import Link from "next/link";
import { notFound } from "next/navigation";
import { getTenant } from "@/db/queries";
import { updateTenant } from "../../actions";
import { TenantForm } from "../../tenant-form";

export const metadata = { title: "Edit tenant · Property CRM" };

export default async function EditTenantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tenant = await getTenant(id);

  if (!tenant) notFound();

  const action = updateTenant.bind(null, tenant.id);

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={`/tenants/${tenant.id}`}
        className="text-sm text-ink-muted hover:text-ink"
      >
        ← Back to tenant
      </Link>
      <h1 className="mb-6 mt-3 text-3xl font-semibold tracking-tight">
        Edit tenant
      </h1>
      <TenantForm
        action={action}
        tenant={tenant}
        submitLabel="Save changes"
        cancelHref={`/tenants/${tenant.id}`}
      />
    </div>
  );
}
