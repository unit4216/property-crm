"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { getSessionId } from "@/lib/session";
import { leases, leaseTenants, tenants, type NewTenant } from "@/db/schema";
import { tenantSchema, type FormState } from "@/lib/validation";

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

function validate(formData: FormData) {
  const raw = Object.fromEntries(formData.entries()) as Record<
    string,
    string
  >;
  return { raw, parsed: tenantSchema.safeParse(raw) };
}

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

export async function deleteTenant(
  id: string,
): Promise<{ error: string } | { ok: true }> {
  const sessionId = await getSessionId();

  // Refuse to delete while the tenant is on an active lease — the lease must
  // be ended first so no active tenancy is silently discarded.
  const activeLease = await db
    .select({ id: leases.id })
    .from(leaseTenants)
    .innerJoin(leases, eq(leases.id, leaseTenants.leaseId))
    .where(and(eq(leaseTenants.tenantId, id), eq(leases.status, "active")))
    .limit(1);
  if (activeLease.length > 0) {
    return {
      error: "Can't delete a tenant on an active lease. End the lease first.",
    };
  }

  try {
    await db
      .delete(tenants)
      .where(and(eq(tenants.id, id), eq(tenants.sessionId, sessionId)));
  } catch {
    return { error: "Something went wrong deleting this tenant. Please try again." };
  }

  revalidatePath("/");
  revalidatePath("/tenants");
  return { ok: true };
}
