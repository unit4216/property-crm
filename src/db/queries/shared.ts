import { asc, desc, ilike, or, sql, type SQL } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { leases } from "@/db/schema";
import type { TableParams } from "@/lib/table-params";

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
export const leaseStatusOrder = sql`case when ${leases.startDate} > current_date then 0 when ${leases.endDate} is not null and ${leases.endDate} <= current_date then 2 else 1 end`;

// Maps a validated sort key to an ORDER BY clause. The key is already
// whitelisted by parseTableParams, so a missing entry falls back to the column
// map's default rather than trusting arbitrary input.
export function orderBy(
  columns: Record<string, PgColumn | SQL>,
  params: TableParams,
): SQL {
  const column = columns[params.sort] ?? Object.values(columns)[0];
  return params.dir === "asc" ? asc(column) : desc(column);
}

// Builds a case-insensitive OR-match across the given columns, or undefined
// when there's no search term (so `and(...)` simply drops it).
export function search(q: string, columns: PgColumn[]): SQL | undefined {
  if (!q) return undefined;
  const term = `%${q}%`;
  return or(...columns.map((c) => ilike(c, term)));
}
