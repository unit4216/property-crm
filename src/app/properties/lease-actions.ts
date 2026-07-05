"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { leases, leaseTenants, type NewLease } from "@/db/schema";
import { leaseSchema, type FormState } from "@/lib/validation";

function toRow(input: ReturnType<typeof leaseSchema.parse>): Omit<NewLease, "propertyId"> {
  return {
    status: input.status,
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
    tenantIds: formData.getAll("tenantIds") as string[],
    status: formData.get("status") as string,
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

  const [lease] = await db
    .insert(leases)
    .values({ propertyId, ...toRow(parsed.data) })
    .returning();

  await db
    .insert(leaseTenants)
    .values(parsed.data.tenantIds.map((tenantId) => ({ leaseId: lease.id, tenantId })));

  revalidatePath("/");
  revalidatePath(`/properties/${propertyId}`);
  revalidatePath("/leases");
  redirect(`/properties/${propertyId}`);
}

export async function endLease(id: string, propertyId: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);

  await db
    .update(leases)
    .set({ status: "ended", endDate: today, updatedAt: new Date() })
    .where(eq(leases.id, id));

  revalidatePath("/");
  revalidatePath(`/properties/${propertyId}`);
  revalidatePath("/tenants");
  revalidatePath("/leases");
}
