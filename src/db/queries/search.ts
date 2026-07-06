import "server-only";
import { and, desc, eq, exists, ilike, or, sql } from "drizzle-orm";
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
} from "@/db/schema";
import { search } from "./shared";
import { attachTenants, type LeaseWithPropertyAndTenants } from "./leases";

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
