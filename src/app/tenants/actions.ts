"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { getSessionId } from "@/lib/session";
import { tenants, type NewTenant } from "@/db/schema";
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

  const sessionId = await getSessionId();
  await db.insert(tenants).values({ ...toRow(parsed.data), sessionId });

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

  const sessionId = await getSessionId();
  await db
    .update(tenants)
    .set({ ...toRow(parsed.data), updatedAt: new Date() })
    .where(and(eq(tenants.id, id), eq(tenants.sessionId, sessionId)));

  revalidatePath("/tenants");
  revalidatePath(`/tenants/${id}`);
  redirect(`/tenants/${id}`);
}

export async function deleteTenant(id: string): Promise<void> {
  const sessionId = await getSessionId();
  await db
    .delete(tenants)
    .where(and(eq(tenants.id, id), eq(tenants.sessionId, sessionId)));
  revalidatePath("/tenants");
  redirect("/tenants");
}
