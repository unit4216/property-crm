"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { getSessionId } from "@/lib/session";
import { leases, leaseTenants, tenants, type NewTenant } from "@/db/schema";
import { leaseNotEnded } from "@/db/queries";
import { tenantSchema, formStringRecord, type FormState } from "@/lib/validation";

/** Map validated tenant form input to a database row, defaulting optional fields to null. */
function toRow(
  input: ReturnType<typeof tenantSchema.parse>,
): Omit<NewTenant, "sessionId"> {
  return {
    name: input.name,
    email: input.email ?? null,
    phone: input.phone ?? null,
    notes: input.notes ?? null,
  };
}

/** Extract raw form fields and run them through the tenant schema, returning both the raw values and the parse result. */
function validate(formData: FormData) {
  const raw = formStringRecord(formData);
  return { raw, parsed: tenantSchema.safeParse(raw) };
}

/** Server action that validates and inserts a new tenant for the current session, returning form state with any errors. */
export async function createTenant(
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
  try {
    await db.insert(tenants).values({ ...toRow(parsed.data), sessionId });
  } catch {
    return {
      ok: false,
      message: "Something went wrong saving this tenant. Please try again.",
      values: raw,
    };
  }

  revalidatePath("/");
  revalidatePath("/tenants");
  return { ok: true };
}

/** Server action that validates and updates an existing session-scoped tenant by id, returning form state with any errors. */
export async function updateTenant(
  id: string,
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
  try {
    await db
      .update(tenants)
      .set({ ...toRow(parsed.data), updatedAt: new Date() })
      .where(and(eq(tenants.id, id), eq(tenants.sessionId, sessionId)));
  } catch {
    return {
      ok: false,
      message: "Something went wrong saving this tenant. Please try again.",
      values: raw,
    };
  }

  revalidatePath("/tenants");
  revalidatePath(`/tenants/${id}`);
  return { ok: true };
}

/** Server action that deletes a session-scoped tenant, refusing while they are on an active or upcoming lease. */
export async function deleteTenant(
  id: string,
): Promise<{ success: boolean; message: string }> {
  const sessionId = await getSessionId();

  // Refuse to delete while the tenant is on an active or upcoming lease, so no
  // current or future tenancy is silently discarded.
  const openLease = await db
    .select({ id: leases.id })
    .from(leaseTenants)
    .innerJoin(leases, eq(leases.id, leaseTenants.leaseId))
    .where(and(eq(leaseTenants.tenantId, id), leaseNotEnded))
    .limit(1);
  if (openLease.length > 0) {
    return {
      success: false,
      message:
        "Can't delete a tenant on an active or upcoming lease. End the lease first.",
    };
  }

  try {
    await db
      .delete(tenants)
      .where(and(eq(tenants.id, id), eq(tenants.sessionId, sessionId)));
  } catch {
    return {
      success: false,
      message: "Something went wrong deleting this tenant. Please try again.",
    };
  }

  revalidatePath("/");
  revalidatePath("/tenants");
  return { success: true, message: "" };
}
