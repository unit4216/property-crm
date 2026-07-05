"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { getSessionId } from "@/lib/session";
import { leases, properties, units, type NewProperty } from "@/db/schema";
import { leaseIsActive } from "@/db/queries";
import {
  propertySchema,
  unitLabelSchema,
  type FormState,
} from "@/lib/validation";

type UnitRow = { id: string | null; label: string };

// Units are submitted as parallel `unitId` / `unitLabel` lists — one hidden id
// and one label per row, in order — so they zip back together by index. Blank
// rows the user never filled in are dropped; every property needs at least one.
function parseUnitRows(
  formData: FormData,
): { rows: UnitRow[] } | { error: string } {
  const ids = formData.getAll("unitId") as string[];
  const labels = formData.getAll("unitLabel") as string[];
  const rows: UnitRow[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < labels.length; i++) {
    const raw = labels[i] ?? "";
    if (raw.trim() === "") continue;
    const parsed = unitLabelSchema.safeParse(raw);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid unit name" };
    }
    const key = parsed.data.toLowerCase();
    if (seen.has(key)) {
      return { error: `Unit names must be unique — "${parsed.data}" is repeated.` };
    }
    seen.add(key);
    const id = ids[i]?.trim() ? ids[i] : null;
    rows.push({ id, label: parsed.data });
  }

  if (rows.length === 0) return { error: "Add at least one unit." };
  return { rows };
}

// Maps validated input to DB column values. Drizzle `numeric` columns expect
// strings, while `integer` columns take numbers; both are nullable.
function toRow(
  input: ReturnType<typeof propertySchema.parse>,
): Omit<NewProperty, "sessionId"> {
  return {
    name: input.name,
    type: input.type,
    status: input.status,
    addressLine1: input.addressLine1,
    addressLine2: input.addressLine2 ?? null,
    city: input.city,
    state: input.state,
    zip: input.zip,
    bedrooms: input.bedrooms ?? null,
    bathrooms: input.bathrooms?.toString() ?? null,
    squareFeet: input.squareFeet ?? null,
    notes: input.notes ?? null,
  };
}

function validate(formData: FormData) {
  const raw = Object.fromEntries(formData.entries()) as Record<
    string,
    string
  >;
  return { raw, parsed: propertySchema.safeParse(raw) };
}

export async function createProperty(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { raw, parsed } = validate(formData);
  const unitParse = parseUnitRows(formData);
  if (!parsed.success || "error" in unitParse) {
    return {
      ok: false,
      message: "Please fix the errors below.",
      fieldErrors: {
        ...(parsed.success ? {} : parsed.error.flatten().fieldErrors),
        ...("error" in unitParse ? { units: [unitParse.error] } : {}),
      },
      values: raw,
    };
  }

  const sessionId = await getSessionId();
  try {
    const [property] = await db
      .insert(properties)
      .values({ ...toRow(parsed.data), sessionId })
      .returning({ id: properties.id });

    await db
      .insert(units)
      .values(unitParse.rows.map((r) => ({ propertyId: property.id, label: r.label })));
  } catch {
    return {
      ok: false,
      message: "Something went wrong saving this property. Please try again.",
      values: raw,
    };
  }

  revalidatePath("/");
  revalidatePath("/properties");
  return { ok: true };
}

export async function updateProperty(
  id: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { raw, parsed } = validate(formData);
  const unitParse = parseUnitRows(formData);
  if (!parsed.success || "error" in unitParse) {
    return {
      ok: false,
      message: "Please fix the errors below.",
      fieldErrors: {
        ...(parsed.success ? {} : parsed.error.flatten().fieldErrors),
        ...("error" in unitParse ? { units: [unitParse.error] } : {}),
      },
      values: raw,
    };
  }

  const sessionId = await getSessionId();

  // Reconcile the submitted units against what's on record: rows with a known
  // id are renamed, new rows are inserted, and units no longer present are
  // removed — unless a removed unit still has leases, which we refuse.
  const existing = await db
    .select({ id: units.id })
    .from(units)
    .where(eq(units.propertyId, id));
  const existingIds = new Set(existing.map((u) => u.id));
  const keptIds = new Set(
    unitParse.rows.filter((r) => r.id && existingIds.has(r.id)).map((r) => r.id!),
  );
  const toDelete = existing.filter((u) => !keptIds.has(u.id)).map((u) => u.id);

  if (toDelete.length > 0) {
    const leased = await db
      .select({ id: leases.id })
      .from(leases)
      .where(inArray(leases.unitId, toDelete))
      .limit(1);
    if (leased.length > 0) {
      return {
        ok: false,
        message: "Please fix the errors below.",
        fieldErrors: {
          units: ["Can't remove a unit that has leases. End its leases first."],
        },
        values: raw,
      };
    }
  }

  try {
    await db
      .update(properties)
      .set({ ...toRow(parsed.data), updatedAt: new Date() })
      .where(and(eq(properties.id, id), eq(properties.sessionId, sessionId)));

    if (toDelete.length > 0) {
      await db.delete(units).where(inArray(units.id, toDelete));
    }
    for (const row of unitParse.rows) {
      if (row.id && existingIds.has(row.id)) {
        await db
          .update(units)
          .set({ label: row.label, updatedAt: new Date() })
          .where(and(eq(units.id, row.id), eq(units.propertyId, id)));
      } else {
        await db.insert(units).values({ propertyId: id, label: row.label });
      }
    }
  } catch {
    return {
      ok: false,
      message: "Something went wrong saving this property. Please try again.",
      values: raw,
    };
  }

  revalidatePath("/");
  revalidatePath("/properties");
  revalidatePath(`/properties/${id}`);
  return { ok: true };
}

export async function deleteProperty(
  id: string,
): Promise<{ error: string } | { ok: true }> {
  const sessionId = await getSessionId();

  // Refuse to delete while an active lease is on the property — the lease
  // must be ended first so no active tenancy is silently discarded.
  const activeLease = await db
    .select({ id: leases.id })
    .from(leases)
    .innerJoin(units, eq(leases.unitId, units.id))
    .where(and(eq(units.propertyId, id), leaseIsActive))
    .limit(1);
  if (activeLease.length > 0) {
    return {
      error: "Can't delete a property with an active lease. End the lease first.",
    };
  }

  try {
    await db
      .delete(properties)
      .where(and(eq(properties.id, id), eq(properties.sessionId, sessionId)));
  } catch {
    return { error: "Something went wrong deleting this property. Please try again." };
  }

  revalidatePath("/");
  revalidatePath("/properties");
  return { ok: true };
}
