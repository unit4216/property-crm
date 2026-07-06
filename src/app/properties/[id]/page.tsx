import Link from "next/link";
import { notFound } from "next/navigation";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import {
  getProperty,
  getPropertyUnits,
  getPropertyLeases,
} from "@/db/queries";
import { StatusBadge } from "@/components/badge";
import { Avatar } from "@/components/avatar";
import { PROPERTY_TYPES } from "@/lib/validation";
import { formatAddressLine, formatCityLine, formatMoney } from "@/lib/format";
import { LocalTime } from "@/components/local-time";
import { DeleteButton } from "../delete-button";
import { MarkSoldButton } from "../mark-sold-button";
import { UnitsTable } from "./units-table";

export const dynamic = "force-dynamic";

function Stat({
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
      <Typography
        component="dt"
        variant="caption"
        sx={{
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: "0.03em",
          color: "var(--ink-muted)",
        }}
      >
        {label}
      </Typography>
      <Typography
        component="dd"
        variant="body1"
        sx={{
          mt: 0.5,
          fontWeight: 600,
          color: accent ? "var(--positive)" : "var(--ink)",
        }}
      >
        {value}
      </Typography>
    </div>
  );
}

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await getProperty(id);

  if (!property) notFound();

  const [units, leases] = await Promise.all([
    getPropertyUnits(property.id),
    getPropertyLeases(property.id),
  ]);

  // Group each unit's full lease history (newest first, as returned) under the
  // unit, so the table can render the current lease and expand to the rest.
  const leasesByUnit = new Map<string, typeof leases>();
  for (const lease of leases) {
    const list = leasesByUnit.get(lease.unitId) ?? [];
    list.push(lease);
    leasesByUnit.set(lease.unitId, list);
  }

  const unitRows = units.map((unit) => ({
    unit,
    leases: leasesByUnit.get(unit.id) ?? [],
  }));

  // An active or upcoming lease blocks deletion — neither should be silently
  // discarded (mirrors leaseNotEnded in the deleteProperty guard).
  const hasOpenLease = leases.some((l) => l.status !== "ended");

  // Monthly rent is derived income: the sum of rent across the property's
  // currently active leases, not a figure stored on the property itself.
  const monthlyRent = leases
    .filter((l) => l.status === "active")
    .reduce((sum, l) => sum + (l.rentAmount ? Number(l.rentAmount) : 0), 0);

  return (
    <div>
      {/* Breadcrumb back to the list view */}
      <Link href="/properties" className="text-sm text-ink-muted hover:text-ink">
        ← Back to properties
      </Link>

      {/* Header: identity (avatar, name, status, address) on the left, actions on the right */}
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Avatar name={property.name} size="lg" />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">
                {property.name}
              </h1>
              <StatusBadge status={property.status} />
            </div>
            <p className="mt-1 text-ink-muted">
              {formatAddressLine(property)} · {formatCityLine(property)}
            </p>
            <p className="mt-0.5 text-sm text-ink-faint">
              {PROPERTY_TYPES[property.type]}
            </p>
          </div>
        </div>
        {/* Actions — Mark sold / Delete are disabled while a lease is still open */}
        <div className="flex items-center gap-3">
          <Link href={`/properties/${property.id}/edit`}>
            <Button variant="outlined" component="span">
              Edit
            </Button>
          </Link>
          <MarkSoldButton
            id={property.id}
            status={property.status}
            blocked={hasOpenLease}
          />
          <DeleteButton
            id={property.id}
            name={property.name}
            blocked={hasOpenLease}
          />
        </div>
      </div>

      {/* At-a-glance stats — rent is derived (see monthlyRent), the rest come off the property */}
      <dl className="mt-6 flex flex-wrap gap-8">
        <Stat
          label="Rent / mo"
          value={monthlyRent > 0 ? formatMoney(monthlyRent.toString()) : "—"}
          accent={monthlyRent > 0}
        />
        <Stat label="Beds" value={property.bedrooms?.toString() ?? "—"} />
        <Stat label="Baths" value={property.bathrooms ?? "—"} />
        <Stat
          label="Sq ft"
          value={property.squareFeet?.toLocaleString() ?? "—"}
        />
      </dl>

      {/* Units section — heading singularizes/pluralizes with a count; table gets each unit's lease history */}
      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            {units.length === 1 ? "Unit" : `Units (${units.length})`}
          </h2>
        </div>

        <UnitsTable propertyId={property.id} rows={unitRows} />
      </section>

      {/* Notes card — only rendered when notes exist; preserves author line breaks */}
      {property.notes && (
        <Paper component="section" variant="outlined" sx={{ mt: 3, p: 3 }}>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Notes
          </h2>
          <p className="mt-2 whitespace-pre-wrap text-sm">{property.notes}</p>
        </Paper>
      )}

      {/* Footer timestamps — rendered client-side in the viewer's local timezone */}
      <p className="mt-6 text-xs text-ink-faint">
        Added <LocalTime iso={property.createdAt.toISOString()} mode="date" /> ·
        Updated{" "}
        <LocalTime iso={property.updatedAt.toISOString()} mode="date" />
      </p>
    </div>
  );
}
