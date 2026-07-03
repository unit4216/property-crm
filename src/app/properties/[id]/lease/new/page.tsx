import Link from "next/link";
import { notFound } from "next/navigation";
import { getProperty, getTenants } from "@/db/queries";
import { createLease } from "../../../lease-actions";
import { LeaseForm } from "../../../lease-form";

export const metadata = { title: "New lease · Property CRM" };

export default async function NewLeasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [property, tenants] = await Promise.all([
    getProperty(id),
    getTenants(),
  ]);

  if (!property) notFound();

  const action = createLease.bind(null, property.id);

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={`/properties/${property.id}`}
        className="text-sm text-ink-muted hover:text-ink"
      >
        ← Back to {property.name}
      </Link>
      <h1 className="mb-6 mt-3 text-3xl font-semibold tracking-tight">
        Start a lease
      </h1>

      {tenants.length === 0 ? (
        <div className="rounded-md border border-dashed border-border-strong bg-surface p-12 text-center">
          <p className="text-ink-muted">
            You need at least one tenant before starting a lease.
          </p>
          <Link
            href="/tenants/new"
            className="btn btn-primary mt-4 inline-flex"
          >
            Add a tenant
          </Link>
        </div>
      ) : (
        <LeaseForm
          action={action}
          tenants={tenants}
          cancelHref={`/properties/${property.id}`}
        />
      )}
    </div>
  );
}
