import "server-only";
import {
  and,
  asc,
  count,
  countDistinct,
  desc,
  eq,
  getTableColumns,
  sql,
  type SQL,
} from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { getSessionId } from "@/lib/session";
import {
  properties,
  units,
  leases,
  type Property,
  type Unit,
} from "@/db/schema";
import type { TableParams } from "@/lib/table-params";
import { leaseIsActive, orderBy, search, type Paginated } from "./shared";

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

// Sort key → column, in display order. `rent` sorts on the per-request
// active-lease rent expression, which only exists inside getPropertiesPage, so
// it's passed in. Keeping the map in one place lets PROPERTY_SORT_KEYS (the
// parseTableParams whitelist) derive from it — the two can't drift out of sync.
function propertySortColumns(
  monthlyRent: SQL,
): Record<string, PgColumn | SQL> {
  return {
    name: properties.name,
    type: properties.type,
    location: properties.city,
    status: properties.status,
    rent: monthlyRent,
    created: properties.createdAt,
  };
}

// The `sql` placeholder is only used to enumerate keys; it's never executed.
export const PROPERTY_SORT_KEYS = Object.keys(propertySortColumns(sql`0`));

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

  const sortColumns = propertySortColumns(monthlyRent);

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
