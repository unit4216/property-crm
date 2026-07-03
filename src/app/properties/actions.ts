"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { getSessionId } from "@/lib/session";
import { properties, type NewProperty } from "@/db/schema";
import { propertySchema, type FormState } from "@/lib/validation";

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
    rentAmount: input.rentAmount?.toString() ?? null,
    notes: input.notes ?? null,
  };
}

function validate(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  return propertySchema.safeParse(raw);
}

export async function createProperty(
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
  await db.insert(properties).values({ ...toRow(parsed.data), sessionId });

  revalidatePath("/");
  redirect("/");
}

export async function updateProperty(
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
    .update(properties)
    .set({ ...toRow(parsed.data), updatedAt: new Date() })
    .where(and(eq(properties.id, id), eq(properties.sessionId, sessionId)));

  revalidatePath("/");
  revalidatePath(`/properties/${id}`);
  redirect(`/properties/${id}`);
}

export async function deleteProperty(id: string): Promise<void> {
  const sessionId = await getSessionId();
  await db
    .delete(properties)
    .where(and(eq(properties.id, id), eq(properties.sessionId, sessionId)));
  revalidatePath("/");
  redirect("/");
}
