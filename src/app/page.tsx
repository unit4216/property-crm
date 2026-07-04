import Link from "next/link";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { getProperties, getTenants, getAllLeases } from "@/db/queries";
import { StatTile } from "@/components/stat-tile";
import {
  PropertyStatusChart,
  OccupancyTrendChart,
  LeaseStatusChart,
} from "@/components/dashboard-charts";
import type { Property, Lease } from "@/db/schema";
import { monthlyOccupancy } from "@/lib/occupancy";
import { PROPERTY_STATUSES, LEASE_STATUSES } from "@/lib/validation";
import { formatCityLine, formatDate, formatMoney } from "@/lib/format";

// Always render fresh from the database.
export const dynamic = "force-dynamic";

const LEASE_EXPIRY_WINDOW_DAYS = 30;

// A bright, high-chroma categorical palette in the family of the lime accent
// (--accent, #cbf74f) — evenly spaced hues at similar lightness so the charts
// feel branded rather than stock. Assigned in enum order for a stable mapping.
const PROPERTY_STATUS_COLORS: Record<Property["status"], string> = {
  active: "#cbf74f", // lime (accent)
  occupied: "#5cb8ff", // sky blue
  vacant: "#ffc24f", // amber
  under_maintenance: "#ff8f6b", // coral
  listed: "#b88cff", // violet
};

const LEASE_STATUS_COLORS: Record<Lease["status"], string> = {
  upcoming: "#5cb8ff", // sky blue
  active: "#cbf74f", // lime (accent)
  ended: "#b88cff", // violet
};

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
    <Paper variant="outlined">
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
              style={{ borderBottom: "1px solid var(--border)" }}
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
          className="flex items-center justify-center px-4 py-2.5 text-sm font-medium text-ink-muted hover:bg-[var(--surface-muted)]"
        >
          {hasMore ? `See all ${count} →` : "View all →"}
        </Link>
      )}
    </Paper>
  );
}

export default async function DashboardPage() {
  const [properties, tenants, leases] = await Promise.all([
    getProperties(),
    getTenants(),
    getAllLeases(),
  ]);

  // Stat tiles
  const rentRoll = properties.reduce(
    (sum, p) => sum + (p.rentAmount ? Number(p.rentAmount) : 0),
    0,
  );
  const activeLeaseCount = leases.filter((l) => l.status === "active").length;

  // Occupancy rate trend over the last 12 months. The current occupancy tile is
  // the latest point on the trend, so both use the same lease-coverage
  // definition and always agree.
  const occupancyTrend = monthlyOccupancy(properties.length, leases);
  const occupancyRate = occupancyTrend.at(-1)?.rate ?? 0;

  // Properties by status
  const propertyStatusData = (
    Object.keys(PROPERTY_STATUSES) as Property["status"][]
  )
    .map((status) => ({
      id: status,
      value: properties.filter((p) => p.status === status).length,
      label: PROPERTY_STATUSES[status],
      color: PROPERTY_STATUS_COLORS[status],
    }))
    .filter((d) => d.value > 0);

  // Leases by status
  const leaseStatusData = (Object.keys(LEASE_STATUSES) as Lease["status"][])
    .map((status) => ({
      id: status,
      value: leases.filter((l) => l.status === status).length,
      label: LEASE_STATUSES[status],
      color: LEASE_STATUS_COLORS[status],
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

  const vacantProperties = properties.filter(
    (p) => p.status === "vacant" || p.status === "listed",
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
      <div>
        <p className="text-sm font-medium text-ink-muted">Portfolio</p>
        <h1 className="mt-1 text-4xl font-semibold tracking-tight">
          Dashboard
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          An overview of your portfolio.
        </p>
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
        <PropertyStatusChart data={propertyStatusData} />
        <LeaseStatusChart data={leaseStatusData} />
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
            title="Vacant & listed properties"
            count={vacantProperties.length}
            emptyMessage="No vacant or listed properties."
            seeMoreHref="/properties"
            rows={vacantProperties.map((p) => ({
              href: `/properties/${p.id}`,
              primary: p.name,
              secondary: formatCityLine(p),
              meta: p.rentAmount ? formatMoney(p.rentAmount) : undefined,
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
