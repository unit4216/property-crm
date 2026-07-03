import Link from "next/link";
import { notFound } from "next/navigation";
import { getProperty } from "@/db/queries";
import { StatusBadge } from "@/components/badge";
import { PropertyAvatar } from "@/components/property-avatar";
import { PROPERTY_TYPES } from "@/lib/validation";
import {
  formatAddressLine,
  formatCityLine,
  formatDate,
  formatMoney,
} from "@/lib/format";
import { DeleteButton } from "../delete-button";

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

  return (
    <div>
      <Link href="/" className="text-sm text-ink-muted hover:text-ink">
        ← Back to properties
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <PropertyAvatar name={property.name} size="lg" />
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
