import Link from "next/link";
import { getLeasesPage, LEASE_SORT_KEYS, type LeaseWithPropertyAndTenants } from "@/db/queries";
import { LeaseStatusBadge } from "@/components/badge";
import { DataTable, type Column } from "@/components/data-table";
import { TableSearch } from "@/components/table-search";
import { Pagination } from "@/components/pagination";
import { parseTableParams, type RawSearchParams } from "@/lib/table-params";
import { formatDate, formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

const columns: Column<LeaseWithPropertyAndTenants>[] = [
  {
    key: "property",
    header: "Property",
    sortable: true,
    render: (lease) => (
      <Link
        href={`/properties/${lease.property.id}`}
        className="block truncate font-medium after:absolute after:inset-0 after:content-['']"
      >
        {lease.property.name}
      </Link>
    ),
  },
  {
    // Tenants are a many-to-many aggregate, so this column can't sort server-side.
    key: "tenants",
    header: "Tenant(s)",
    hideBelow: "sm",
    render: (lease) => (
      <span className="truncate text-sm">
        {lease.tenants.map((t) => t.name).join(", ") || "—"}
      </span>
    ),
  },
  {
    key: "start",
    header: "Dates",
    sortable: true,
    hideBelow: "md",
    render: (lease) => (
      <span className="truncate text-sm text-ink-muted">
        {formatDate(new Date(lease.startDate))} –{" "}
        {lease.endDate ? formatDate(new Date(lease.endDate)) : "present"}
      </span>
    ),
  },
  {
    key: "rent",
    header: "Rent",
    sortable: true,
    align: "right",
    render: (lease) => (
      <span className="text-sm tabular-nums">{formatMoney(lease.rentAmount)}</span>
    ),
  },
  {
    key: "status",
    header: "Status",
    sortable: true,
    align: "right",
    render: (lease) => <LeaseStatusBadge status={lease.status} />,
  },
];

export default async function LeasesPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const sp = await searchParams;
  const params = parseTableParams(sp, {
    sortKeys: LEASE_SORT_KEYS,
    defaultSort: "start",
    defaultDir: "desc",
  });

  const { rows, total } = await getLeasesPage(params);

  return (
    <div>
      <div>
        <p className="text-sm font-medium text-ink-muted">Portfolio</p>
        <h1 className="mt-1 text-4xl font-semibold tracking-tight">Leases</h1>
        <p className="mt-2 text-sm text-ink-muted">
          {total} {total === 1 ? "lease" : "leases"} across your properties.
        </p>
      </div>

      <div className="mt-6">
        <TableSearch placeholder="Search by property or tenant…" />
      </div>
      <div className="mt-3">
        <DataTable
          columns={columns}
          rows={rows}
          sort={params.sort}
          dir={params.dir}
          searchParams={sp}
          empty={params.q ? `No leases match “${params.q}”.` : "No leases yet."}
        />
        <Pagination
          page={params.page}
          pageSize={params.pageSize}
          total={total}
          searchParams={sp}
          noun="lease"
        />
      </div>
    </div>
  );
}
