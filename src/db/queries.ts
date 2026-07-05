import "server-only";
import {
  and,
  asc,
  count,
  countDistinct,
  desc,
  eq,
  exists,
  getTableColumns,
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

export type Paginated<T> = { rows: T[]; total: number };

// SQL mirrors of the lease-status derivation in lib/lease-status.ts, for the
// queries that must filter or sort by status in the database rather than in JS.
// `current_date` and the exclusive end date match deriveLeaseStatus exactly.
export const leaseIsActive = sql`(${leases.startDate} <= current_date and (${leases.endDate} is null or ${leases.endDate} > current_date))`;
// A lease that hasn't ended yet — i.e. active or upcoming. The complement of
// the "ended" branch of deriveLeaseStatus (which only ends a lease that has
// already started), so a not-yet-started lease always counts as not ended.
// Wrapped in parens so its top-level `or`s stay grouped when this fragment is
// combined with other conditions via `and()` — otherwise SQL's `and`-binds-
// tighter-than-`or` precedence lets the unwrapped branches match rows the outer
// `and` was meant to exclude (e.g. leases on other properties).
export const leaseNotEnded = sql`(${leases.startDate} > current_date or ${leases.endDate} is null or ${leases.endDate} > current_date)`;
const leaseStatusOrder = sql`case when ${leases.startDate} > current_date then 0 when ${leases.endDate} is not null and ${leases.endDate} <= current_date then 2 else 1 end`;

// Maps a validated sort key to an ORDER BY clause. The key is already
// whitelisted by parseTableParams, so a missing entry falls back to the column
// map's default rather than trusting arbitrary input.
function orderBy(
  columns: Record<string, PgColumn | SQL>,
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

// Every property has at least one unit; ordered by label so the property page
// and the lease form's unit picker list them consistently.
export async function getPropertyUnits(propertyId: string): Promise<Unit[]> {
  return db
    .select()
    .from(units)
    .where(eq(units.propertyId, propertyId))
    .orderBy(asc(units.label));
}

// Per-property occupancy, unit-weighted: how many of a property's units have an
// active lease covering today, out of its total units. Occupancy is derived
// from lease coverage (via leaseIsActive), never the `status` column, matching
// lib/occupancy.ts. Unlike the portfolio-wide monthlyOccupancy trend, this is
// per property and unit-weighted, so a half-leased duplex reads as partial.
export type PropertyOccupancy = {
  propertyId: string;
  totalUnits: number;
  occupiedUnits: number;
};

export async function getPropertyOccupancy(): Promise<PropertyOccupancy[]> {
  const sessionId = await getSessionId();
  return db
    .select({
      propertyId: units.propertyId,
      totalUnits: countDistinct(units.id),
      // leases only join when active, so a non-null unitId marks an occupied unit.
      occupiedUnits: countDistinct(leases.unitId),
    })
    .from(units)
    .innerJoin(properties, eq(units.propertyId, properties.id))
    .leftJoin(leases, and(eq(leases.unitId, units.id), leaseIsActive))
    .where(eq(properties.sessionId, sessionId))
    .groupBy(units.propertyId);
}

export const PROPERTY_SORT_KEYS = [
  "name",
  "type",
  "location",
  "status",
  "rent",
  "created",
];

// A property's monthly rent isn't stored — it's the income from its currently
// active leases (summed across the property's units). Vacant properties, whose
// only leases are ended or upcoming, coalesce to 0.
export type PropertyWithRent = Property & { monthlyRent: string };

export async function getPropertiesPage(
  params: TableParams,
): Promise<Paginated<PropertyWithRent>> {
  const sessionId = await getSessionId();

  const activeRent = db
    .select({
      propertyId: units.propertyId,
      monthlyRent: sql<string>`sum(${leases.rentAmount})`.as("monthly_rent"),
    })
    .from(leases)
    .innerJoin(units, eq(leases.unitId, units.id))
    .where(leaseIsActive)
    .groupBy(units.propertyId)
    .as("active_rent");

  const monthlyRent = sql<string>`coalesce(${activeRent.monthlyRent}, 0)`;

  const sortColumns: Record<string, PgColumn | SQL> = {
    name: properties.name,
    type: properties.type,
    location: properties.city,
    status: properties.status,
    rent: monthlyRent,
    created: properties.createdAt,
  };

  const where = and(
    eq(properties.sessionId, sessionId),
    search(params.q, [
      properties.name,
      properties.city,
      properties.addressLine1,
    ]),
    params.type ? eq(properties.type, params.type as Property["type"]) : undefined,
    // "all" (or any non-status value) leaves the portfolio unfiltered; a real
    // status narrows to just active or sold.
    params.status === "active" || params.status === "sold"
      ? eq(properties.status, params.status)
      : undefined,
  );

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({ ...getTableColumns(properties), monthlyRent })
      .from(properties)
      .leftJoin(activeRent, eq(activeRent.propertyId, properties.id))
      .where(where)
      .orderBy(orderBy(sortColumns, params))
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

// Every fetched lease carries a derived `status` so callers can read
// `lease.status` uniformly, even though it isn't a stored column.
export type LeaseWithTenants = Lease & {
  status: LeaseStatus;
  tenants: Tenant[];
};

// Fetches the co-tenants for a set of leases in one query and groups them
// back onto each lease, rather than issuing a query per lease. Also derives
// each lease's status from its dates while it's building the result rows.
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

export type UniversalSearchResults = {
  properties: Property[];
  tenants: Tenant[];
  leases: LeaseWithPropertyAndTenants[];
};

const UNIVERSAL_SEARCH_LIMIT = 5;

// Top few matches across properties, tenants, and leases, for the dashboard's
// universal search. Scoped to the current session like every other query.
export async function universalSearch(q: string): Promise<UniversalSearchResults> {
  if (!q.trim()) return { properties: [], tenants: [], leases: [] };
  const sessionId = await getSessionId();
  const term = `%${q}%`;

  const [matchedProperties, matchedTenants, leaseRows] = await Promise.all([
    db
      .select()
      .from(properties)
      .where(
        and(
          eq(properties.sessionId, sessionId),
          search(q, [properties.name, properties.city, properties.addressLine1]),
        ),
      )
      .orderBy(properties.name)
      .limit(UNIVERSAL_SEARCH_LIMIT),
    db
      .select()
      .from(tenants)
      .where(
        and(
          eq(tenants.sessionId, sessionId),
          search(q, [tenants.name, tenants.email, tenants.phone]),
        ),
      )
      .orderBy(tenants.name)
      .limit(UNIVERSAL_SEARCH_LIMIT),
    // A lease matches by its property's name or by any of its tenants' names,
    // same as the leases page search.
    db
      .select({ lease: leases, unit: units, property: properties })
      .from(leases)
      .innerJoin(units, eq(leases.unitId, units.id))
      .innerJoin(properties, eq(units.propertyId, properties.id))
      .where(
        and(
          eq(properties.sessionId, sessionId),
          or(
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
          ),
        ),
      )
      .orderBy(desc(leases.startDate))
      .limit(UNIVERSAL_SEARCH_LIMIT),
  ]);

  const withTenants = await attachTenants(leaseRows.map((r) => r.lease));
  const matchedLeases = withTenants.map((lease, i) => ({
    ...lease,
    unit: leaseRows[i].unit,
    property: leaseRows[i].property,
  }));

  return { properties: matchedProperties, tenants: matchedTenants, leases: matchedLeases };
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
