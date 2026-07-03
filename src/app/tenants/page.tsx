import Link from "next/link";
import { getTenants } from "@/db/queries";
import { Avatar } from "@/components/avatar";

export const dynamic = "force-dynamic";

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

export default async function TenantsPage() {
  const tenants = await getTenants();

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-ink-muted">Portfolio</p>
          <h1 className="mt-1 text-4xl font-semibold tracking-tight">
            Tenants
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            {tenants.length} {tenants.length === 1 ? "tenant" : "tenants"} on
            file.
          </p>
        </div>
        <Link href="/tenants/new" className="btn btn-primary">
          New tenant
        </Link>
      </div>

      {tenants.length === 0 ? (
        <div className="mt-6 rounded-md border border-dashed border-border-strong bg-surface p-12 text-center">
          <p className="text-ink-muted">No tenants yet.</p>
          <Link
            href="/tenants/new"
            className="btn btn-primary mt-4 inline-flex"
          >
            Add your first tenant
          </Link>
        </div>
      ) : (
        <div className="mt-6 bg-surface">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border px-5 py-2.5 text-xs font-medium text-ink-muted sm:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_auto]">
            <span>Tenant</span>
            <span className="hidden sm:block">Contact</span>
            <span className="justify-self-end sm:hidden" />
          </div>

          <ul>
            {tenants.map((t) => (
              <li key={t.id} className="border-b border-border last:border-0">
                <Link
                  href={`/tenants/${t.id}`}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-3.5 transition-colors hover:bg-surface-muted sm:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_auto]"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={t.name} />
                    <p className="truncate font-medium">{t.name}</p>
                  </div>

                  <div className="hidden min-w-0 sm:block">
                    <p className="truncate text-sm">{t.email ?? "—"}</p>
                    <p className="truncate text-sm text-ink-muted">
                      {t.phone ?? ""}
                    </p>
                  </div>

                  <ChevronRight />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
