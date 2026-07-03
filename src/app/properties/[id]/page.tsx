import Link from "next/link";
import { notFound } from "next/navigation";
import { getProperty } from "@/db/queries";
import { StatusBadge } from "@/components/badge";
import { PROPERTY_TYPES } from "@/lib/validation";
import {
  formatAddressLine,
  formatCityLine,
  formatDate,
  formatMoney,
} from "@/lib/format";
import { DeleteButton } from "../delete-button";

export const dynamic = "force-dynamic";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <dt className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
        {label}
      </dt>
      <dd className="mt-1 text-lg font-semibold">{value}</dd>
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
      <Link
        href="/"
        className="text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        ← Back to properties
      </Link>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {property.name}
            </h1>
            <StatusBadge status={property.status} />
          </div>
          <p className="mt-1 text-zinc-500 dark:text-zinc-400">
            {formatAddressLine(property)} · {formatCityLine(property)}
          </p>
          <p className="mt-0.5 text-sm text-zinc-400">
            {PROPERTY_TYPES[property.type]}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/properties/${property.id}/edit`}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Edit
          </Link>
          <DeleteButton id={property.id} name={property.name} />
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat
          label="Rent / mo"
          value={
            property.rentAmount ? formatMoney(property.rentAmount) : "—"
          }
        />
        <Stat
          label="Beds"
          value={property.bedrooms?.toString() ?? "—"}
        />
        <Stat
          label="Baths"
          value={property.bathrooms ?? "—"}
        />
        <Stat
          label="Sq ft"
          value={property.squareFeet?.toLocaleString() ?? "—"}
        />
      </dl>

      {property.notes && (
        <section className="mt-6 rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">
            Notes
          </h2>
          <p className="mt-2 whitespace-pre-wrap text-sm">{property.notes}</p>
        </section>
      )}

      <p className="mt-6 text-xs text-zinc-400">
        Added {formatDate(property.createdAt)} · Updated{" "}
        {formatDate(property.updatedAt)}
      </p>
    </div>
  );
}
