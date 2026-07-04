import "server-only";
import {
  and,
  asc,
  count,
  desc,
  eq,
  exists,
  ilike,
  inArray,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { getSessionId } from "@/lib/session";
import {
  properties,
  tenants,
  leases,
  leaseTenants,
  type Property,
  type Tenant,
  type Lease,
} from "@/db/schema";
import type { TableParams } from "@/lib/table-params";

export type Paginated<T> = { rows: T[]; total: number };

// Maps a validated sort key to an ORDER BY clause. The key is already
// whitelisted by parseTableParams, so a missing entry falls back to the column
// map's default rather than trusting arbitrary input.
function orderBy(
  columns: Record<string, PgColumn>,
  params: TableParams,
): SQL {
  const column = columns[params.sort] ?? Object.values(columns)[0];
  return params.dir === "asc" ? asc(column) : desc(column);
}

// Builds a case-insensitive OR-match across the given columns, or undefined
// when there's no search term (so `and(...)` simply drops it).
function search(q: string, columns: PgColumn[]): SQL | undefined {
  if (!q) return undefined;
  const term = `%${q}%`;
  return or(...columns.map((c) => ilike(c, term)));
}

export async function getProperties(): Promise<Property[]> {
  const sessionId = await getSessionId();
  return db
    .select()
    .from(properties)
    .where(eq(properties.sessionId, sessionId))
    .orderBy(desc(properties.createdAt));
}

export async function getProperty(id: string): Promise<Property | null> {
  const sessionId = await getSessionId();
  const rows = await db
    .select()
    .from(properties)
    .where(and(eq(properties.id, id), eq(properties.sessionId, sessionId)))
    .limit(1);
  return rows[0] ?? null;
}

const PROPERTY_SORT_COLUMNS: Record<string, PgColumn> = {
  name: properties.name,
  type: properties.type,
  location: properties.city,
  status: properties.status,
  rent: properties.rentAmount,
  created: properties.createdAt,
};

export const PROPERTY_SORT_KEYS = Object.keys(PROPERTY_SORT_COLUMNS);

export async function getPropertiesPage(
  params: TableParams,
): Promise<Paginated<Property>> {
  const sessionId = await getSessionId();
  const where = and(
    eq(properties.sessionId, sessionId),
    search(params.q, [
      properties.name,
      properties.city,
      properties.addressLine1,
    ]),
  );

  const [rows, [{ total }]] = await Promise.all([
    db
      .select()
      .from(properties)
      .where(where)
      .orderBy(orderBy(PROPERTY_SORT_COLUMNS, params))
      .limit(params.pageSize)
      .offset(params.offset),
    db.select({ total: count() }).from(properties).where(where),
  ]);

  return { rows, total };
}

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

export type LeaseWithTenants = Lease & { tenants: Tenant[] };

// Fetches the co-tenants for a set of leases in one query and groups them
// back onto each lease, rather than issuing a query per lease.
async function attachTenants(leaseRows: Lease[]): Promise<LeaseWithTenants[]> {
  if (leaseRows.length === 0) return [];

  const ids = leaseRows.map((l) => l.id);
  const rows = await db
    .select({ leaseId: leaseTenants.leaseId, tenant: tenants })
    .from(leaseTenants)
    .innerJoin(tenants, eq(leaseTenants.tenantId, tenants.id))
    .where(inArray(leaseTenants.leaseId, ids));

  const byLease = new Map<string, Tenant[]>();
  for (const row of rows) {
    const list = byLease.get(row.leaseId) ?? [];
    list.push(row.tenant);
    byLease.set(row.leaseId, list);
  }

  return leaseRows.map((l) => ({ ...l, tenants: byLease.get(l.id) ?? [] }));
}

export async function getPropertyLeases(
  propertyId: string,
): Promise<LeaseWithTenants[]> {
  const rows = await db
    .select()
    .from(leases)
    .where(eq(leases.propertyId, propertyId))
    .orderBy(desc(leases.startDate));
  return attachTenants(rows);
}

export type LeaseWithPropertyAndTenants = Lease & {
  property: Property;
  tenants: Tenant[];
};

export async function getAllLeases(): Promise<LeaseWithPropertyAndTenants[]> {
  const sessionId = await getSessionId();
  const rows = await db
    .select({ lease: leases, property: properties })
    .from(leases)
    .innerJoin(properties, eq(leases.propertyId, properties.id))
    .where(eq(properties.sessionId, sessionId))
    .orderBy(desc(leases.startDate));

  const withTenants = await attachTenants(rows.map((r) => r.lease));
  return withTenants.map((lease, i) => ({ ...lease, property: rows[i].property }));
}

// Tenant names aren't sortable here: they're a many-to-many aggregate, not a
// column on the lease row. Everything else maps to a real column.
const LEASE_SORT_COLUMNS: Record<string, PgColumn> = {
  property: properties.name,
  start: leases.startDate,
  rent: leases.rentAmount,
  status: leases.status,
};

export const LEASE_SORT_KEYS = Object.keys(LEASE_SORT_COLUMNS);

export async function getLeasesPage(
  params: TableParams,
): Promise<Paginated<LeaseWithPropertyAndTenants>> {
  const sessionId = await getSessionId();
  const term = params.q ? `%${params.q}%` : undefined;
  const where = and(
    eq(properties.sessionId, sessionId),
    term
      ? or(
          ilike(properties.name, term),
          exists(
            db
              .select({ one: sql`1` })
              .from(leaseTenants)
              .innerJoin(tenants, eq(leaseTenants.tenantId, tenants.id))
              .where(
                and(eq(leaseTenants.leaseId, leases.id), ilike(tenants.name, term)),
              ),
          ),
        )
      : undefined,
  );

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({ lease: leases, property: properties })
      .from(leases)
      .innerJoin(properties, eq(leases.propertyId, properties.id))
      .where(where)
      .orderBy(orderBy(LEASE_SORT_COLUMNS, params))
      .limit(params.pageSize)
      .offset(params.offset),
    db
      .select({ total: count() })
      .from(leases)
      .innerJoin(properties, eq(leases.propertyId, properties.id))
      .where(where),
  ]);

  const withTenants = await attachTenants(rows.map((r) => r.lease));
  return {
    rows: withTenants.map((lease, i) => ({
      ...lease,
      property: rows[i].property,
    })),
    total,
  };
}

export async function getTenantLeases(
  tenantId: string,
): Promise<LeaseWithPropertyAndTenants[]> {
  const rows = await db
    .select({ lease: leases, property: properties })
    .from(leaseTenants)
    .innerJoin(leases, eq(leaseTenants.leaseId, leases.id))
    .innerJoin(properties, eq(leases.propertyId, properties.id))
    .where(eq(leaseTenants.tenantId, tenantId))
    .orderBy(desc(leases.startDate));

  const withTenants = await attachTenants(rows.map((r) => r.lease));
  return withTenants.map((lease, i) => ({ ...lease, property: rows[i].property }));
}
