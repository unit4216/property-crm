import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
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
