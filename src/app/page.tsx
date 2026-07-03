import Link from "next/link";
import { getProperties } from "@/db/queries";
import { StatusBadge } from "@/components/badge";
import { PropertyAvatar } from "@/components/property-avatar";
import { PROPERTY_TYPES } from "@/lib/validation";
import { formatCityLine, formatMoney } from "@/lib/format";

// Always render fresh from the database.
export const dynamic = "force-dynamic";

function StatTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div>
      <p className="text-sm text-ink-muted">{label}</p>
      <p
        className={`mt-1 text-2xl font-semibold tracking-tight ${
          accent ? "text-positive" : "text-ink"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function ChevronRight() {
  return (
    <svg
      className="size-4 text-ink-faint"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export default async function HomePage() {
  const properties = await getProperties();

  const rentRoll = properties.reduce(
    (sum, p) => sum + (p.rentAmount ? Number(p.rentAmount) : 0),
    0,
  );
  const occupied = properties.filter(
    (p) => p.status === "occupied" || p.status === "active",
  ).length;

  return (
    <div>
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-ink-muted">Portfolio</p>
          <h1 className="mt-1 text-4xl font-semibold tracking-tight">
            Properties
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            {properties.length}{" "}
            {properties.length === 1 ? "property" : "properties"} under
            management.
          </p>
        </div>
        <Link href="/properties/new" className="btn btn-primary">
          New property
        </Link>
      </div>

      {/* Stat tiles */}
      <div className="mt-6 flex flex-wrap gap-10">
        <StatTile
          label="Monthly rent roll"
          value={formatMoney(rentRoll.toString())}
          accent
        />
        <StatTile label="Total properties" value={properties.length.toString()} />
        <StatTile
          label="Active / occupied"
          value={`${occupied} of ${properties.length}`}
        />
      </div>

      {/* Table */}
      {properties.length === 0 ? (
        <div className="mt-6 rounded-md border border-dashed border-border-strong bg-surface p-12 text-center">
          <p className="text-ink-muted">No properties yet.</p>
          <Link
            href="/properties/new"
            className="btn btn-primary mt-4 inline-flex"
          >
            Add your first property
          </Link>
        </div>
      ) : (
        <div className="mt-6 bg-surface">
          {/* Header */}
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border px-5 py-2.5 text-xs font-medium text-ink-muted sm:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_auto_auto]">
            <span>Property</span>
            <span className="hidden sm:block">Location</span>
            <span className="hidden justify-self-end sm:block">Status</span>
            <span className="justify-self-end">Rent / mo</span>
          </div>

          {/* Rows */}
          <ul>
            {properties.map((p) => (
              <li key={p.id} className="border-b border-border last:border-0">
                <Link
                  href={`/properties/${p.id}`}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-3.5 transition-colors hover:bg-surface-muted sm:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_auto_auto]"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <PropertyAvatar name={p.name} />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{p.name}</p>
                      <p className="truncate text-sm text-ink-muted">
                        {PROPERTY_TYPES[p.type]}
                      </p>
                    </div>
                  </div>

                  <div className="hidden min-w-0 sm:block">
                    <p className="truncate text-sm">{p.city}</p>
                    <p className="truncate text-sm text-ink-muted">
                      {formatCityLine(p)}
                    </p>
                  </div>

                  <div className="hidden justify-self-end sm:block">
                    <StatusBadge status={p.status} />
                  </div>

                  <div className="flex items-center justify-self-end gap-3">
                    <span className="font-medium tabular-nums">
                      {p.rentAmount ? formatMoney(p.rentAmount) : "—"}
                    </span>
                    <ChevronRight />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
