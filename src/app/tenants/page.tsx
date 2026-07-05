import Link from "next/link";
import Button from "@mui/material/Button";
import { getTenantsPage, TENANT_SORT_KEYS } from "@/db/queries";
import { Avatar } from "@/components/avatar";
import { DataTable, RowChevron, type Column } from "@/components/data-table";
import { TableSearch } from "@/components/table-search";
import { Pagination } from "@/components/pagination";
import { PlusIcon } from "@/components/plus-icon";
import { SuccessBanner } from "@/components/success-banner";
import { parseTableParams, type RawSearchParams } from "@/lib/table-params";
import type { Tenant } from "@/db/schema";

export const dynamic = "force-dynamic";

const columns: Column<Tenant>[] = [
  {
    key: "name",
    header: "Tenant",
    sortable: true,
    render: (t) => (
      <div className="flex min-w-0 items-center gap-3">
        <Avatar name={t.name} />
        <Link
          href={`/tenants/${t.id}`}
          className="block truncate font-medium after:absolute after:inset-0 after:content-['']"
        >
          {t.name}
        </Link>
      </div>
    ),
  },
  {
    key: "email",
    header: "Email",
    sortable: true,
    hideBelow: "sm",
    render: (t) => <span className="truncate text-sm">{t.email ?? "—"}</span>,
  },
  {
    key: "phone",
    header: "Phone",
    sortable: true,
    hideBelow: "md",
    render: (t) => (
      <span className="truncate text-sm text-ink-muted">{t.phone ?? "—"}</span>
    ),
  },
  {
    key: "chevron",
    header: "",
    align: "right",
    render: () => <RowChevron />,
  },
];

export default async function TenantsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const sp = await searchParams;
  const params = parseTableParams(sp, {
    sortKeys: TENANT_SORT_KEYS,
    defaultSort: "name",
    defaultDir: "asc",
  });

  const { rows, total } = await getTenantsPage(params);

  return (
    <div>
      <SuccessBanner />

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-ink-muted">Portfolio</p>
          <h1 className="mt-1 text-4xl font-semibold tracking-tight">
            Tenants
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            {total} {total === 1 ? "tenant" : "tenants"} on file.
          </p>
        </div>
        <Link href="/tenants/new">
          <Button variant="contained" component="span" startIcon={<PlusIcon />}>
            New tenant
          </Button>
        </Link>
      </div>

      <div className="mt-6">
        <TableSearch placeholder="Search tenants…" />
      </div>
      <div className="mt-3">
        <DataTable
          columns={columns}
          rows={rows}
          sort={params.sort}
          dir={params.dir}
          searchParams={sp}
          empty={
            params.q ? `No tenants match “${params.q}”.` : "No tenants yet."
          }
        />
        <Pagination
          page={params.page}
          pageSize={params.pageSize}
          total={total}
          searchParams={sp}
          noun="tenant"
        />
      </div>
    </div>
  );
}
