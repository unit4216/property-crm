"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { leases, leaseTenants, units, type NewLease } from "@/db/schema";
import { leaseSchema, type FormState } from "@/lib/validation";
import { deriveLeaseStatus } from "@/lib/lease-status";

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

// FormData collapses repeated keys via Object.fromEntries, which loses all
// but the last checked tenant — pull tenantIds out with getAll instead.
function validate(formData: FormData) {
  const raw = {
    unitId: formData.get("unitId") as string,
    tenantIds: formData.getAll("tenantIds") as string[],
    startDate: formData.get("startDate") as string,
    endDate: formData.get("endDate") as string,
    rentAmount: formData.get("rentAmount") as string,
    depositAmount: formData.get("depositAmount") as string,
    notes: formData.get("notes") as string,
  };
  return { raw, parsed: leaseSchema.safeParse(raw) };
}

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

  // Guard that the chosen unit actually belongs to this property, so a lease
  // can't be pinned to a unit from someone else's property via a forged id.
  const unit = await db
    .select({ id: units.id })
    .from(units)
    .where(and(eq(units.id, parsed.data.unitId), eq(units.propertyId, propertyId)))
    .limit(1);
  if (unit.length === 0) {
    return {
      ok: false,
      message: "Please fix the errors below.",
      fieldErrors: { unitId: ["Select a unit on this property"] },
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

export async function endLease(
  id: string,
  propertyId: string,
): Promise<{ error: string } | { ok: true }> {
  // Only an active lease can be ended: an upcoming lease hasn't started, and
  // ending it would leave its end date before its start date. The button is
  // hidden in those cases, but guard here too since it only passes an id.
  const [lease] = await db
    .select({ startDate: leases.startDate, endDate: leases.endDate })
    .from(leases)
    .where(eq(leases.id, id))
    .limit(1);
  if (!lease) {
    return { error: "This lease no longer exists." };
  }
  if (deriveLeaseStatus(lease) !== "active") {
    return { error: "Only an active lease can be ended." };
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
    return { error: "Something went wrong ending this lease. Please try again." };
  }

  revalidatePath("/");
  revalidatePath(`/properties/${propertyId}`);
  revalidatePath("/tenants");
  revalidatePath("/leases");
  return { ok: true };
}
