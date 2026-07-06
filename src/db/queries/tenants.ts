import "server-only";
import { and, count, eq } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { getSessionId } from "@/lib/session";
import { tenants, type Tenant } from "@/db/schema";
import type { TableParams } from "@/lib/table-params";
import { orderBy, search, type Paginated } from "./shared";

export async function getTenants(): Promise<Tenant[]> {
  const sessionId = await getSessionId();
  return db
    .select()
    .from(tenants)
    .where(eq(tenants.sessionId, sessionId))
    .orderBy(tenants.name);
}

export async function getTenant(id: string): Promise<Tenant | null> {
  const sessionId = await getSessionId();
  const rows = await db
    .select()
    .from(tenants)
    .where(and(eq(tenants.id, id), eq(tenants.sessionId, sessionId)))
    .limit(1);
  return rows[0] ?? null;
}

const TENANT_SORT_COLUMNS: Record<string, PgColumn> = {
  name: tenants.name,
  email: tenants.email,
  phone: tenants.phone,
  created: tenants.createdAt,
};

export const TENANT_SORT_KEYS = Object.keys(TENANT_SORT_COLUMNS);

export async function getTenantsPage(
  params: TableParams,
): Promise<Paginated<Tenant>> {
  const sessionId = await getSessionId();
  const where = and(
    eq(tenants.sessionId, sessionId),
    search(params.q, [tenants.name, tenants.email, tenants.phone]),
  );

  const [rows, [{ total }]] = await Promise.all([
    db
      .select()
      .from(tenants)
      .where(where)
      .orderBy(orderBy(TENANT_SORT_COLUMNS, params))
      .limit(params.pageSize)
      .offset(params.offset),
    db.select({ total: count() }).from(tenants).where(where),
  ]);

  return { rows, total };
}
