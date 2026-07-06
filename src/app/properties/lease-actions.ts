"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { getSessionId } from "@/lib/session";
import {
  leases,
  leaseTenants,
  properties,
  tenants,
  units,
  type NewLease,
} from "@/db/schema";
import {
  leaseSchema,
  formString,
  formStrings,
  type FormState,
} from "@/lib/validation";
import { deriveLeaseStatus } from "@/lib/lease-status";

// Map validated form input to a lease row, coercing optional numbers to
// strings and absent values to null for the DB columns. unitId is set by the
// caller since it isn't validated the same way.
function toRow(
  input: ReturnType<typeof leaseSchema.parse>,
): Omit<NewLease, "unitId"> {
  return {
    startDate: input.startDate,
    endDate: input.endDate ?? null,
    rentAmount: input.rentAmount?.toString() ?? null,
    depositAmount: input.depositAmount?.toString() ?? null,
    notes: input.notes ?? null,
  };
}

// Extract the lease fields from form data and validate them against the schema,
// returning both the raw values (to repopulate the form on error) and the parse
// result.
//
// FormData collapses repeated keys via Object.fromEntries, which loses all
// but the last checked tenant — pull tenantIds out with getAll instead.
function validate(formData: FormData) {
  const raw = {
    unitId: formString(formData, "unitId"),
    tenantIds: formStrings(formData, "tenantIds"),
    startDate: formString(formData, "startDate"),
    endDate: formString(formData, "endDate"),
    rentAmount: formString(formData, "rentAmount"),
    depositAmount: formString(formData, "depositAmount"),
    notes: formString(formData, "notes"),
  };
  return { raw, parsed: leaseSchema.safeParse(raw) };
}

// Create a lease on a unit of the given property and link its tenants. Returns
// a FormState carrying field errors on validation failure or a generic message
// if the insert fails.
export async function createLease(
  propertyId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { raw, parsed } = validate(formData);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
      values: raw,
    };
  }

  const sessionId = await getSessionId();

  // Guard that the chosen unit belongs to a property owned by this session, so a
  // lease can't be pinned to a unit from someone else's property via a forged
  // propertyId or unitId. The join to properties ties both to the session.
  const unit = await db
    .select({ id: units.id })
    .from(units)
    .innerJoin(properties, eq(units.propertyId, properties.id))
    .where(
      and(
        eq(units.id, parsed.data.unitId),
        eq(units.propertyId, propertyId),
        eq(properties.sessionId, sessionId),
      ),
    )
    .limit(1);
  if (unit.length === 0) {
    return {
      ok: false,
      message: "Please fix the errors below.",
      fieldErrors: { unitId: ["Select a unit on this property"] },
      values: raw,
    };
  }

  // Every tenant on the lease must belong to this session too, so forged tenant
  // ids can't attach someone else's tenants (or dangling ids) to the lease.
  const ownedTenants = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(
      and(
        inArray(tenants.id, parsed.data.tenantIds),
        eq(tenants.sessionId, sessionId),
      ),
    );
  if (ownedTenants.length !== parsed.data.tenantIds.length) {
    return {
      ok: false,
      message: "Please fix the errors below.",
      fieldErrors: { tenantIds: ["Select tenants from your list"] },
      values: raw,
    };
  }

  try {
    const [lease] = await db
      .insert(leases)
      .values({ unitId: parsed.data.unitId, ...toRow(parsed.data) })
      .returning();

    await db
      .insert(leaseTenants)
      .values(parsed.data.tenantIds.map((tenantId) => ({ leaseId: lease.id, tenantId })));
  } catch {
    return {
      ok: false,
      message: "Something went wrong saving this lease. Please try again.",
      values: raw,
    };
  }

  revalidatePath("/");
  revalidatePath(`/properties/${propertyId}`);
  revalidatePath("/leases");
  return { ok: true };
}

// End an active lease by capping its end date at today. Returns an error if the
// lease no longer exists, isn't active, or the update fails.
export async function endLease(
  id: string,
  propertyId: string,
): Promise<{ success: boolean; message: string }> {
  const sessionId = await getSessionId();

  // Only an active lease can be ended: an upcoming lease hasn't started, and
  // ending it would leave its end date before its start date. The button is
  // hidden in those cases, but guard here too since it only passes an id. The
  // join to properties also scopes the lookup to this session, so a forged id
  // can't end another session's lease.
  const [lease] = await db
    .select({ startDate: leases.startDate, endDate: leases.endDate })
    .from(leases)
    .innerJoin(units, eq(leases.unitId, units.id))
    .innerJoin(properties, eq(units.propertyId, properties.id))
    .where(and(eq(leases.id, id), eq(properties.sessionId, sessionId)))
    .limit(1);
  if (!lease) {
    return { success: false, message: "This lease no longer exists." };
  }
  if (deriveLeaseStatus(lease) !== "active") {
    return { success: false, message: "Only an active lease can be ended." };
  }

  // Status is derived from the dates, so ending a lease just means capping its
  // end date at today; since the end date is exclusive, it reads as "ended"
  // immediately.
  const today = new Date().toISOString().slice(0, 10);

  try {
    await db
      .update(leases)
      .set({ endDate: today, updatedAt: new Date() })
      .where(eq(leases.id, id));
  } catch {
    return {
      success: false,
      message: "Something went wrong ending this lease. Please try again.",
    };
  }

  revalidatePath("/");
  revalidatePath(`/properties/${propertyId}`);
  revalidatePath("/tenants");
  revalidatePath("/leases");
  return { success: true, message: "" };
}
