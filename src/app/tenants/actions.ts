"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tenants, type NewTenant } from "@/db/schema";
import { tenantSchema, type FormState } from "@/lib/validation";

function toRow(input: ReturnType<typeof tenantSchema.parse>): NewTenant {
  return {
    name: input.name,
    email: input.email ?? null,
    phone: input.phone ?? null,
    notes: input.notes ?? null,
  };
}

function validate(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  return tenantSchema.safeParse(raw);
}

export async function createTenant(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = validate(formData);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await db.insert(tenants).values(toRow(parsed.data));

  revalidatePath("/tenants");
  redirect("/tenants");
}

export async function updateTenant(
  id: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = validate(formData);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await db
    .update(tenants)
    .set({ ...toRow(parsed.data), updatedAt: new Date() })
    .where(eq(tenants.id, id));

  revalidatePath("/tenants");
  revalidatePath(`/tenants/${id}`);
  redirect(`/tenants/${id}`);
}

export async function deleteTenant(id: string): Promise<void> {
  await db.delete(tenants).where(eq(tenants.id, id));
  revalidatePath("/tenants");
  redirect("/tenants");
}
