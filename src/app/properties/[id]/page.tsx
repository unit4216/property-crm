import Link from "next/link";
import { notFound } from "next/navigation";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import {
  getProperty,
  getPropertyUnits,
  getPropertyLeases,
} from "@/db/queries";
import { StatusBadge, LeaseStatusBadge } from "@/components/badge";
import { Avatar } from "@/components/avatar";
import { PROPERTY_TYPES } from "@/lib/validation";
import {
  formatAddressLine,
  formatCityLine,
  formatDate,
  formatMoney,
} from "@/lib/format";
import { DeleteButton } from "../delete-button";
import { EndLeaseButton } from "../end-lease-button";

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

  // Group leases under their unit, and pick each unit's "current" lease — the
  // active one, or an upcoming one if the unit is between tenants.
  const leasesByUnit = new Map<string, typeof leases>();
  for (const lease of leases) {
    const list = leasesByUnit.get(lease.unitId) ?? [];
    list.push(lease);
    leasesByUnit.set(lease.unitId, list);
  }

  const currentLeaseByUnit = new Map<string, (typeof leases)[number] | null>();
  const currentLeaseIds = new Set<string>();
  for (const unit of units) {
    const unitLeases = leasesByUnit.get(unit.id) ?? [];
    const current =
      unitLeases.find((l) => l.status === "active") ??
      unitLeases.find((l) => l.status === "upcoming") ??
      null;
    currentLeaseByUnit.set(unit.id, current);
    if (current) currentLeaseIds.add(current.id);
  }

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
      <Link href="/properties" className="text-sm text-ink-muted hover:text-ink">
        ← Back to properties
      </Link>

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
        <div className="flex items-center gap-3">
          <Link href={`/properties/${property.id}/edit`}>
            <Button variant="outlined" component="span">
              Edit
            </Button>
          </Link>
          <DeleteButton
            id={property.id}
            name={property.name}
            blocked={hasOpenLease}
          />
        </div>
      </div>

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

      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            {units.length === 1 ? "Unit" : `Units (${units.length})`}
          </h2>
        </div>

        <Stack sx={{ mt: 2, bgcolor: "var(--surface)", overflowX: "auto" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Unit</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Tenant</TableCell>
                <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
                  Term
                </TableCell>
                <TableCell align="right">Rent</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {units.map((unit) => {
                const currentLease = currentLeaseByUnit.get(unit.id) ?? null;
                return (
                  <TableRow key={unit.id} hover>
                    <TableCell>
                      <span className="text-sm font-semibold">
                        {unit.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      {currentLease ? (
                        <LeaseStatusBadge status={currentLease.status} />
                      ) : (
                        <span className="text-sm text-ink-muted">Vacant</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {currentLease ? (
                        <span className="text-sm">
                          {currentLease.tenants.map((t, i) => (
                            <span key={t.id}>
                              {i > 0 && ", "}
                              <Link
                                href={`/tenants/${t.id}`}
                                className="font-medium hover:underline"
                              >
                                {t.name}
                              </Link>
                            </span>
                          ))}
                        </span>
                      ) : (
                        <span className="text-sm text-ink-faint">—</span>
                      )}
                    </TableCell>
                    <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
                      {currentLease ? (
                        <span className="text-sm text-ink-muted">
                          {formatDate(new Date(currentLease.startDate))} –{" "}
                          {currentLease.endDate
                            ? formatDate(new Date(currentLease.endDate))
                            : "present"}
                        </span>
                      ) : (
                        <span className="text-sm text-ink-faint">—</span>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {currentLease ? (
                        <span className="text-sm tabular-nums">
                          {formatMoney(currentLease.rentAmount)}/mo
                        </span>
                      ) : (
                        <span className="text-sm text-ink-faint">—</span>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {currentLease ? (
                        currentLease.status === "active" && (
                          <EndLeaseButton
                            id={currentLease.id}
                            propertyId={property.id}
                          />
                        )
                      ) : (
                        <Link
                          href={`/properties/${property.id}/lease/new?unit=${unit.id}`}
                        >
                          <Button variant="contained" size="small" component="span">
                            Start lease
                          </Button>
                        </Link>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Stack>
      </section>

      {property.notes && (
        <Paper component="section" variant="outlined" sx={{ mt: 3, p: 3 }}>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Notes
          </h2>
          <p className="mt-2 whitespace-pre-wrap text-sm">{property.notes}</p>
        </Paper>
      )}

      <p className="mt-6 text-xs text-ink-faint">
        Added {formatDate(property.createdAt)} · Updated{" "}
        {formatDate(property.updatedAt)}
      </p>
    </div>
  );
}
