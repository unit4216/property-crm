"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { getSessionId } from "@/lib/session";
import { leases, properties, units, type NewProperty } from "@/db/schema";
import { leaseNotEnded } from "@/db/queries";
import {
  propertySchema,
  unitLabelSchema,
  formStrings,
  formStringRecord,
  type FormState,
} from "@/lib/validation";

type UnitRow = { id: string | null; label: string };

// Units are submitted as parallel `unitId` / `unitLabel` lists — one hidden id
// and one label per row, in order — so they zip back together by index. Blank
// rows the user never filled in are dropped; every property needs at least one.
function parseUnitRows(
  formData: FormData,
): { rows: UnitRow[] } | { error: string } {
  const ids = formStrings(formData, "unitId");
  const labels = formStrings(formData, "unitLabel");
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

// Parses the flat property fields into the raw string record (echoed back to
// the form on error) and a Zod result. Unit rows are validated separately by
// parseUnitRows.
function validate(formData: FormData) {
  const raw = formStringRecord(formData);
  return { raw, parsed: propertySchema.safeParse(raw) };
}

type ParsedForm = {
  row: Omit<NewProperty, "sessionId">;
  units: UnitRow[];
  // The raw string values, to echo back into the form if the DB write fails.
  raw: Record<string, string>;
};

// Validates the property fields and unit rows together. On failure returns an
// error FormState ready to return as-is; on success returns the mapped DB row,
// unit rows, and raw values. Used by both create and update.
function validateForm(
  formData: FormData,
): { error: FormState } | { data: ParsedForm } {
  const { raw, parsed } = validate(formData);
  const unitParse = parseUnitRows(formData);
  if (!parsed.success || "error" in unitParse) {
    return {
      error: {
        ok: false,
        message: "Please fix the errors below.",
        fieldErrors: {
          ...(parsed.success ? {} : parsed.error.flatten().fieldErrors),
          ...("error" in unitParse ? { units: [unitParse.error] } : {}),
        },
        values: raw,
      },
    };
  }
  return { data: { row: toRow(parsed.data), units: unitParse.rows, raw } };
}

// True if any of the property's units has an active or upcoming lease. Shared
// by the delete and mark-sold guards.
async function hasOpenLease(propertyId: string): Promise<boolean> {
  const rows = await db
    .select({ id: leases.id })
    .from(leases)
    .innerJoin(units, eq(leases.unitId, units.id))
    .where(and(eq(units.propertyId, propertyId), leaseNotEnded))
    .limit(1);
  return rows.length > 0;
}

// Server action: creates a property and its units for the current session from
// the submitted form. Returns field errors on invalid input; the property row
// and its unit rows are inserted together.
export async function createProperty(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const result = validateForm(formData);
  if ("error" in result) return result.error;
  const { row, units: unitRows, raw } = result.data;

  const sessionId = await getSessionId();
  try {
    const [property] = await db
      .insert(properties)
      .values({ ...row, sessionId })
      .returning({ id: properties.id });

    await db
      .insert(units)
      .values(unitRows.map((r) => ({ propertyId: property.id, label: r.label })));
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

// Server action: updates a property and reconciles its unit rows for the
// current session. Returns field errors on invalid input, or when a removed
// unit still has leases (which it refuses).
export async function updateProperty(
  id: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const result = validateForm(formData);
  if ("error" in result) return result.error;
  const { row, units: unitRows, raw } = result.data;

  const sessionId = await getSessionId();

  // Confirm the property belongs to this session before touching anything. The
  // property update below is already session-scoped (a no-op if unowned), but
  // the unit reconciliation keys only on propertyId, so without this guard a
  // forged id could mutate another session's units.
  const owned = await db
    .select({ id: properties.id })
    .from(properties)
    .where(and(eq(properties.id, id), eq(properties.sessionId, sessionId)))
    .limit(1);
  if (owned.length === 0) {
    return {
      ok: false,
      message: "Something went wrong saving this property. Please try again.",
      values: raw,
    };
  }

  // Reconcile the submitted units against what's on record: rows with a known
  // id are renamed, new rows are inserted, and units no longer present are
  // removed — unless a removed unit still has leases, which we refuse.
  const existing = await db
    .select({ id: units.id })
    .from(units)
    .where(eq(units.propertyId, id));
  const existingIds = new Set(existing.map((u) => u.id));
  const keptIds = new Set(
    unitRows.filter((r) => r.id && existingIds.has(r.id)).map((r) => r.id!),
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
      .set({ ...row, updatedAt: new Date() })
      .where(and(eq(properties.id, id), eq(properties.sessionId, sessionId)));

    if (toDelete.length > 0) {
      await db.delete(units).where(inArray(units.id, toDelete));
    }
    for (const unitRow of unitRows) {
      if (unitRow.id && existingIds.has(unitRow.id)) {
        await db
          .update(units)
          .set({ label: unitRow.label, updatedAt: new Date() })
          .where(and(eq(units.id, unitRow.id), eq(units.propertyId, id)));
      } else {
        await db.insert(units).values({ propertyId: id, label: unitRow.label });
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

// Server action: deletes a property for the current session. Refused while it
// still has an active or upcoming lease, so no current or future tenancy is
// silently discarded.
export async function deleteProperty(
  id: string,
): Promise<{ success: boolean; message: string }> {
  const sessionId = await getSessionId();

  // A not-yet-ended lease on any of the property's units blocks the delete.
  if (await hasOpenLease(id)) {
    return {
      success: false,
      message:
        "Can't delete a property with an active or upcoming lease. End the lease first.",
    };
  }

  try {
    await db
      .delete(properties)
      .where(and(eq(properties.id, id), eq(properties.sessionId, sessionId)));
  } catch {
    return {
      success: false,
      message: "Something went wrong deleting this property. Please try again.",
    };
  }

  revalidatePath("/");
  revalidatePath("/properties");
  return { success: true, message: "" };
}

// Marks a property "sold". Refused while any active or upcoming lease is on the
// property — a sold property can't carry a current or future tenancy — using
// the same open-lease guard as deleteProperty.
export async function markPropertySold(
  id: string,
): Promise<{ success: boolean; message: string }> {
  const sessionId = await getSessionId();

  if (await hasOpenLease(id)) {
    return {
      success: false,
      message:
        "Can't mark a property sold while it has an active or upcoming lease. End the lease first.",
    };
  }

  try {
    await db
      .update(properties)
      .set({ status: "sold", updatedAt: new Date() })
      .where(and(eq(properties.id, id), eq(properties.sessionId, sessionId)));
  } catch {
    return {
      success: false,
      message: "Something went wrong updating this property. Please try again.",
    };
  }

  revalidatePath("/");
  revalidatePath("/properties");
  revalidatePath(`/properties/${id}`);
  return { success: true, message: "" };
}

// Reverses a sale, returning a property to the active portfolio.
export async function markPropertyActive(
  id: string,
): Promise<{ success: boolean; message: string }> {
  const sessionId = await getSessionId();

  try {
    await db
      .update(properties)
      .set({ status: "active", updatedAt: new Date() })
      .where(and(eq(properties.id, id), eq(properties.sessionId, sessionId)));
  } catch {
    return {
      success: false,
      message: "Something went wrong updating this property. Please try again.",
    };
  }

  revalidatePath("/");
  revalidatePath("/properties");
  revalidatePath(`/properties/${id}`);
  return { success: true, message: "" };
}
