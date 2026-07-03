import Link from "next/link";
import { getProperties } from "@/db/queries";
import { StatusBadge } from "@/components/badge";
import { PROPERTY_TYPES } from "@/lib/validation";
import { formatAddressLine, formatCityLine, formatMoney } from "@/lib/format";

// Always render fresh from the database.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const properties = await getProperties();

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Properties</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {properties.length}{" "}
            {properties.length === 1 ? "property" : "properties"} in your
            portfolio
          </p>
        </div>
      </div>

      {properties.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <p className="text-zinc-600 dark:text-zinc-400">
            No properties yet.
          </p>
          <Link
            href="/properties/new"
            className="mt-4 inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Add your first property
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {properties.map((p) => (
            <li key={p.id}>
              <Link
                href={`/properties/${p.id}`}
                className="block rounded-lg border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-medium leading-tight">{p.name}</h2>
                  <StatusBadge status={p.status} />
                </div>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {formatAddressLine(p)}
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {formatCityLine(p)}
                </p>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-zinc-500 dark:text-zinc-400">
                    {PROPERTY_TYPES[p.type]}
                  </span>
                  <span className="font-medium">
                    {p.rentAmount ? `${formatMoney(p.rentAmount)}/mo` : "—"}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
