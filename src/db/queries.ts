import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { properties, type Property } from "@/db/schema";

export async function getProperties(): Promise<Property[]> {
  return db.select().from(properties).orderBy(desc(properties.createdAt));
}

export async function getProperty(id: string): Promise<Property | null> {
  const rows = await db
    .select()
    .from(properties)
    .where(eq(properties.id, id))
    .limit(1);
  return rows[0] ?? null;
}
