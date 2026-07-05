import Link from "next/link";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import {
  getProperties,
  getTenants,
  getAllLeases,
  getPropertyOccupancy,
} from "@/db/queries";
import { StatTile } from "@/components/stat-tile";
import { UniversalSearch } from "@/components/universal-search";
import {
  PropertyOccupancyChart,
  OccupancyTrendChart,
  PropertyTypeChart,
} from "@/components/dashboard-charts";
import type { Property } from "@/db/schema";
import { monthlyOccupancy } from "@/lib/occupancy";
import { PROPERTY_TYPES } from "@/lib/validation";
import { formatCityLine, formatDate, formatMoney } from "@/lib/format";

// Always render fresh from the database.
export const dynamic = "force-dynamic";

const LEASE_EXPIRY_WINDOW_DAYS = 30;

// A bright, high-chroma categorical palette in the family of the lime accent
// (--accent, #cbf74f) — evenly spaced hues at similar lightness so the charts
// feel branded rather than stock. Assigned in enum order for a stable mapping.
// Occupancy bands, brightest for the healthiest state: lime for fully leased,
// amber for partial, coral for vacant (the state that needs attention).
const OCCUPANCY_BAND_COLORS = {
  full: "#cbf74f", // lime (accent)
  partial: "#ffc24f", // amber
  vacant: "#ff8f6b", // coral
} as const;

function daysFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

type ListRow = {
  href: string;
  primary: string;
  secondary: string;
  meta?: string;
};

const LIST_CARD_MAX_ROWS = 3;

function ListCard({
  title,
  count,
  emptyMessage,
  rows,
  seeMoreHref,
}: {
  title: string;
  count: number;
  emptyMessage: string;
  rows: ListRow[];
  seeMoreHref: string;
}) {
  const visibleRows = rows.slice(0, LIST_CARD_MAX_ROWS);
  const hasMore = rows.length > LIST_CARD_MAX_ROWS;

  return (
    <Paper variant="outlined" className="flex h-full flex-col">
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        <span
          className={`inline-flex h-5 min-w-5 items-center justify-center rounded px-1 text-xs font-semibold tabular-nums ${
            count === 0
              ? "bg-[var(--surface-muted)] text-ink-muted"
              : "bg-[var(--ink)] text-white"
          }`}
        >
          {count}
        </span>
      </div>
      {visibleRows.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-ink-muted">
          {emptyMessage}
        </p>
      ) : (
        <ul>
          {visibleRows.map((row, i) => (
            <li
              key={row.href + i}
              style={
                i < visibleRows.length - 1
                  ? { borderBottom: "1px solid var(--border)" }
                  : undefined
              }
            >
              <Link
                href={row.href}
                className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-[var(--surface-muted)]"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{row.primary}</p>
                  <p className="truncate text-sm text-ink-muted">
                    {row.secondary}
                  </p>
                </div>
                {row.meta && (
                  <span className="shrink-0 text-sm tabular-nums text-ink-muted">
                    {row.meta}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
      {visibleRows.length > 0 && (
        <Link
          href={seeMoreHref}
          className="mt-auto flex items-center justify-center px-4 py-2.5 text-sm font-medium text-ink-muted hover:bg-[var(--surface-muted)]"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          {hasMore ? `See all ${count} →` : "View all →"}
        </Link>
      )}
    </Paper>
  );
}

export default async function DashboardPage() {
  const [properties, tenants, leases, propertyOccupancy] = await Promise.all([
    getProperties(),
    getTenants(),
    getAllLeases(),
    getPropertyOccupancy(),
  ]);

  // Stat tiles. Rent roll is realized income — the sum of every active lease's
  // rent — not a figure stored on the property.
  const activeLeases = leases.filter((l) => l.status === "active");
  const rentRoll = activeLeases.reduce(
    (sum, l) => sum + (l.rentAmount ? Number(l.rentAmount) : 0),
    0,
  );
  const activeLeaseCount = activeLeases.length;

  // Occupancy rate trend over the last 12 months. The current occupancy tile is
  // the latest point on the trend, so both use the same lease-coverage
  // definition and always agree.
  const occupancyLeases = leases.map((l) => ({
    propertyId: l.property.id,
    startDate: l.startDate,
    endDate: l.endDate,
  }));
  const occupancyTrend = monthlyOccupancy(properties.length, occupancyLeases);
  const occupancyRate = occupancyTrend.at(-1)?.rate ?? 0;

  // Properties by type. Uses a shorter label than PROPERTY_TYPES for the
  // single-family case so it fits the lollipop's label column without eliding.
  const propertyTypeDataset = (Object.keys(PROPERTY_TYPES) as Property["type"][])
    .map((type) => ({
      label: type === "single_family" ? "Single-family" : PROPERTY_TYPES[type],
      count: properties.filter((p) => p.type === type).length,
    }))
    .filter((d) => d.count > 0);

  // Properties by occupancy: bucket each property by the share of its units
  // with an active lease — vacant (none), partial (some), or fully occupied
  // (all). Unit-weighted, so a half-leased duplex lands in "partial".
  const occupancyBands = { full: 0, partial: 0, vacant: 0 };
  for (const p of propertyOccupancy) {
    if (p.occupiedUnits === 0) occupancyBands.vacant += 1;
    else if (p.occupiedUnits >= p.totalUnits) occupancyBands.full += 1;
    else occupancyBands.partial += 1;
  }
  const propertyOccupancyData = [
    { id: "full", value: occupancyBands.full, label: "Fully occupied" },
    { id: "partial", value: occupancyBands.partial, label: "Partially occupied" },
    { id: "vacant", value: occupancyBands.vacant, label: "Vacant" },
  ]
    .map((d) => ({
      ...d,
      color: OCCUPANCY_BAND_COLORS[d.id as keyof typeof OCCUPANCY_BAND_COLORS],
    }))
    .filter((d) => d.value > 0);

  // Leases ending within the window, soonest first.
  const expiryCutoff = daysFromNow(LEASE_EXPIRY_WINDOW_DAYS);
  const expiringLeases = leases
    .filter(
      (l) => l.status === "active" && l.endDate && new Date(l.endDate) <= expiryCutoff,
    )
    .sort(
      (a, b) => new Date(a.endDate!).getTime() - new Date(b.endDate!).getTime(),
    );

  // Vacant = no unit currently under an active lease, derived from lease
  // coverage like the occupancy chart rather than the status column. Sold
  // properties have left the portfolio, so they're excluded.
  const vacantPropertyIds = new Set(
    propertyOccupancy
      .filter((p) => p.occupiedUnits === 0)
      .map((p) => p.propertyId),
  );
  const vacantProperties = properties.filter(
    (p) => p.status !== "sold" && vacantPropertyIds.has(p.id),
  );

  // Signed but not yet started, soonest first.
  const upcomingLeases = leases
    .filter((l) => l.status === "upcoming")
    .sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );

  const tenantIdsWithActiveLease = new Set(
    leases
      .filter((l) => l.status === "active")
      .flatMap((l) => l.tenants.map((t) => t.id)),
  );
  const idleTenants = tenants.filter((t) => !tenantIdsWithActiveLease.has(t.id));

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-ink-muted">Portfolio</p>
          <h1 className="mt-1 text-4xl font-semibold tracking-tight">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            An overview of your properties.
          </p>
        </div>
        <UniversalSearch />
      </div>

      {/* Stat tiles */}
      <div className="mt-6 flex flex-wrap gap-10">
        <StatTile
          label="Monthly rent roll"
          value={formatMoney(rentRoll.toString())}
          accent
        />
        <StatTile label="Total properties" value={properties.length.toString()} />
        <StatTile label="Total tenants" value={tenants.length.toString()} />
        <StatTile label="Active leases" value={activeLeaseCount.toString()} />
        <StatTile label="Occupancy rate" value={`${occupancyRate}%`} />
      </div>

      {/* Charts */}
      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PropertyOccupancyChart data={propertyOccupancyData} />
        <PropertyTypeChart dataset={propertyTypeDataset} />
      </div>

      <div className="mt-4">
        <OccupancyTrendChart data={occupancyTrend} />
      </div>

      {/* Attention needed */}
      <div className="mt-8">
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
          Needs attention
        </Typography>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ListCard
            title={`Leases expiring in the next ${LEASE_EXPIRY_WINDOW_DAYS} days`}
            count={expiringLeases.length}
            emptyMessage="No leases expiring soon."
            seeMoreHref="/leases"
            rows={expiringLeases.map((l) => ({
              href: `/properties/${l.property.id}`,
              primary: l.property.name,
              secondary: l.tenants.map((t) => t.name).join(", ") || "No tenants",
              meta: formatDate(new Date(l.endDate!)),
            }))}
          />
          <ListCard
            title="Vacant properties"
            count={vacantProperties.length}
            emptyMessage="No vacant properties."
            seeMoreHref="/properties"
            rows={vacantProperties.map((p) => ({
              href: `/properties/${p.id}`,
              primary: p.name,
              secondary: formatCityLine(p),
            }))}
          />
          <ListCard
            title="Upcoming move-ins"
            count={upcomingLeases.length}
            emptyMessage="No upcoming leases."
            seeMoreHref="/leases"
            rows={upcomingLeases.map((l) => ({
              href: `/properties/${l.property.id}`,
              primary: l.property.name,
              secondary: l.tenants.map((t) => t.name).join(", ") || "No tenants",
              meta: formatDate(new Date(l.startDate)),
            }))}
          />
          <ListCard
            title="Tenants without an active lease"
            count={idleTenants.length}
            emptyMessage="Every tenant has an active lease."
            seeMoreHref="/tenants"
            rows={idleTenants.map((t) => ({
              href: `/tenants/${t.id}`,
              primary: t.name,
              secondary: t.email || t.phone || "No contact info",
            }))}
          />
        </div>
      </div>
    </div>
  );
}
