import Link from "next/link";
import { notFound } from "next/navigation";
import { getProperty, getPropertyLeases } from "@/db/queries";
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
      <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">
        {label}
      </dt>
      <dd
        className={`mt-1 text-lg font-semibold ${
          accent ? "text-positive" : "text-ink"
        }`}
      >
        {value}
      </dd>
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

  const leases = await getPropertyLeases(property.id);
  const currentLease =
    leases.find((l) => l.status === "active") ??
    leases.find((l) => l.status === "upcoming") ??
    null;
  const pastLeases = leases.filter((l) => l.id !== currentLease?.id);

  return (
    <div>
      <Link href="/" className="text-sm text-ink-muted hover:text-ink">
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
          <Link
            href={`/properties/${property.id}/edit`}
            className="btn btn-secondary"
          >
            Edit
          </Link>
          <DeleteButton id={property.id} name={property.name} />
        </div>
      </div>

      <dl className="mt-6 flex flex-wrap gap-8">
        <Stat
          label="Rent / mo"
          value={property.rentAmount ? formatMoney(property.rentAmount) : "—"}
          accent={!!property.rentAmount}
        />
        <Stat label="Beds" value={property.bedrooms?.toString() ?? "—"} />
        <Stat label="Baths" value={property.bathrooms ?? "—"} />
        <Stat
          label="Sq ft"
          value={property.squareFeet?.toLocaleString() ?? "—"}
        />
      </dl>

      <section className="mt-6 rounded-md border border-border bg-surface p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Lease
          </h2>
          {currentLease && <LeaseStatusBadge status={currentLease.status} />}
        </div>

        {currentLease ? (
          <div className="mt-3">
            <p className="text-sm">
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
            </p>
            <p className="mt-1 text-sm text-ink-muted">
              {formatDate(new Date(currentLease.startDate))} –{" "}
              {currentLease.endDate
                ? formatDate(new Date(currentLease.endDate))
                : "present"}
              {" · "}
              {formatMoney(currentLease.rentAmount)}/mo
              {currentLease.depositAmount &&
                ` · ${formatMoney(currentLease.depositAmount)} deposit`}
            </p>
            {currentLease.status !== "ended" && (
              <div className="mt-3">
                <EndLeaseButton id={currentLease.id} propertyId={property.id} />
              </div>
            )}
          </div>
        ) : (
          <div className="mt-3">
            <p className="text-sm text-ink-muted">No active lease.</p>
            <Link
              href={`/properties/${property.id}/lease/new`}
              className="btn btn-primary mt-3 inline-flex"
            >
              Start lease
            </Link>
          </div>
        )}
      </section>

      {pastLeases.length > 0 && (
        <section className="mt-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Lease history
          </h2>
          <ul className="mt-2 bg-surface">
            {pastLeases.map((lease) => (
              <li
                key={lease.id}
                className="border-b border-border py-3.5 last:border-0"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {lease.tenants.map((t) => t.name).join(", ")}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-faint">
                      {formatDate(new Date(lease.startDate))} –{" "}
                      {lease.endDate
                        ? formatDate(new Date(lease.endDate))
                        : "present"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm tabular-nums text-ink-muted">
                      {formatMoney(lease.rentAmount)}
                    </span>
                    <LeaseStatusBadge status={lease.status} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {property.notes && (
        <section className="mt-6 rounded-md border border-border bg-surface p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Notes
          </h2>
          <p className="mt-2 whitespace-pre-wrap text-sm">{property.notes}</p>
        </section>
      )}

      <p className="mt-6 text-xs text-ink-faint">
        Added {formatDate(property.createdAt)} · Updated{" "}
        {formatDate(property.updatedAt)}
      </p>
    </div>
  );
}
