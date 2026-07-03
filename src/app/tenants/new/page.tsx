import Link from "next/link";
import { createTenant } from "../actions";
import { TenantForm } from "../tenant-form";

export const metadata = { title: "New tenant · Property CRM" };

export default function NewTenantPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/tenants" className="text-sm text-ink-muted hover:text-ink">
        ← Back to tenants
      </Link>
      <h1 className="mb-6 mt-3 text-3xl font-semibold tracking-tight">
        New tenant
      </h1>
      <TenantForm
        action={createTenant}
        submitLabel="Create tenant"
        cancelHref="/tenants"
      />
    </div>
  );
}
