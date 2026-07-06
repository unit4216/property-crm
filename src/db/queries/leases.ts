import "server-only";
import {
  and,
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
  units,
  leases,
  leaseTenants,
  type Property,
  type Tenant,
  type Unit,
  type Lease,
} from "@/db/schema";
import type { TableParams } from "@/lib/table-params";
import { deriveLeaseStatus, type LeaseStatus } from "@/lib/lease-status";
import { leaseStatusOrder, orderBy, type Paginated } from "./shared";

// Every fetched lease carries a derived `status` so callers can read
// `lease.status` uniformly, even though it isn't a stored column.
export type LeaseWithTenants = Lease & {
  status: LeaseStatus;
  tenants: Tenant[];
};

// Fetches the co-tenants for a set of leases in one query and groups them
// back onto each lease, rather than issuing a query per lease. Also derives
// each lease's status from its dates while it's building the result rows.
export async function attachTenants(
  leaseRows: Lease[],
): Promise<LeaseWithTenants[]> {
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

  return leaseRows.map((l) => ({
    ...l,
    status: deriveLeaseStatus(l),
    tenants: byLease.get(l.id) ?? [],
  }));
}

export type LeaseWithUnitAndTenants = LeaseWithTenants & { unit: Unit };

// Leases for a property, resolved through its units. Each lease carries the
// specific unit it was signed against so the property page can group them.
export async function getPropertyLeases(
  propertyId: string,
): Promise<LeaseWithUnitAndTenants[]> {
  const rows = await db
    .select({ lease: leases, unit: units })
    .from(leases)
    .innerJoin(units, eq(leases.unitId, units.id))
    .where(eq(units.propertyId, propertyId))
    .orderBy(desc(leases.startDate));

  const withTenants = await attachTenants(rows.map((r) => r.lease));
  return withTenants.map((lease, i) => ({ ...lease, unit: rows[i].unit }));
}

export type LeaseWithPropertyAndTenants = LeaseWithTenants & {
  unit: Unit;
  property: Property;
};

export async function getLease(id: string): Promise<LeaseWithPropertyAndTenants | null> {
  const sessionId = await getSessionId();
  const rows = await db
    .select({ lease: leases, unit: units, property: properties })
    .from(leases)
    .innerJoin(units, eq(leases.unitId, units.id))
    .innerJoin(properties, eq(units.propertyId, properties.id))
    .where(and(eq(leases.id, id), eq(properties.sessionId, sessionId)))
    .limit(1);

  if (rows.length === 0) return null;

  const [withTenants] = await attachTenants([rows[0].lease]);
  return { ...withTenants, unit: rows[0].unit, property: rows[0].property };
}

export async function getAllLeases(): Promise<LeaseWithPropertyAndTenants[]> {
  const sessionId = await getSessionId();
  const rows = await db
    .select({ lease: leases, unit: units, property: properties })
    .from(leases)
    .innerJoin(units, eq(leases.unitId, units.id))
    .innerJoin(properties, eq(units.propertyId, properties.id))
    .where(eq(properties.sessionId, sessionId))
    .orderBy(desc(leases.startDate));

  const withTenants = await attachTenants(rows.map((r) => r.lease));
  return withTenants.map((lease, i) => ({
    ...lease,
    unit: rows[i].unit,
    property: rows[i].property,
  }));
}

// Tenant names aren't sortable here: they're a many-to-many aggregate, not a
// column on the lease row. Everything else maps to a real column.
const LEASE_SORT_COLUMNS: Record<string, PgColumn | SQL> = {
  property: properties.name,
  start: leases.startDate,
  rent: leases.rentAmount,
  status: leaseStatusOrder,
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
      .select({ lease: leases, unit: units, property: properties })
      .from(leases)
      .innerJoin(units, eq(leases.unitId, units.id))
      .innerJoin(properties, eq(units.propertyId, properties.id))
      .where(where)
      .orderBy(orderBy(LEASE_SORT_COLUMNS, params))
      .limit(params.pageSize)
      .offset(params.offset),
    db
      .select({ total: count() })
      .from(leases)
      .innerJoin(units, eq(leases.unitId, units.id))
      .innerJoin(properties, eq(units.propertyId, properties.id))
      .where(where),
  ]);

  const withTenants = await attachTenants(rows.map((r) => r.lease));
  return {
    rows: withTenants.map((lease, i) => ({
      ...lease,
      unit: rows[i].unit,
      property: rows[i].property,
    })),
    total,
  };
}

export async function getTenantLeases(
  tenantId: string,
): Promise<LeaseWithPropertyAndTenants[]> {
  const rows = await db
    .select({ lease: leases, unit: units, property: properties })
    .from(leaseTenants)
    .innerJoin(leases, eq(leaseTenants.leaseId, leases.id))
    .innerJoin(units, eq(leases.unitId, units.id))
    .innerJoin(properties, eq(units.propertyId, properties.id))
    .where(eq(leaseTenants.tenantId, tenantId))
    .orderBy(desc(leases.startDate));

  const withTenants = await attachTenants(rows.map((r) => r.lease));
  return withTenants.map((lease, i) => ({
    ...lease,
    unit: rows[i].unit,
    property: rows[i].property,
  }));
}
