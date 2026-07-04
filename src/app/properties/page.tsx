import Link from "next/link";
import Button from "@mui/material/Button";
import {
  getProperties,
  getPropertiesPage,
  getAllLeases,
  PROPERTY_SORT_KEYS,
} from "@/db/queries";
import { StatusBadge } from "@/components/badge";
import { Avatar } from "@/components/avatar";
import { StatTile } from "@/components/stat-tile";
import { DataTable, RowChevron, type Column } from "@/components/data-table";
import { TableSearch } from "@/components/table-search";
import { TableTypeFilter } from "@/components/table-type-filter";
import { Pagination } from "@/components/pagination";
import { PlusIcon } from "@/components/plus-icon";
import { currentOccupiedCount } from "@/lib/occupancy";
import { parseTableParams, type RawSearchParams } from "@/lib/table-params";
import { PROPERTY_TYPES } from "@/lib/validation";
import { formatCityLine, formatMoney } from "@/lib/format";
import type { Property } from "@/db/schema";

// searchParams (q/sort/dir/page) makes this a request-time, dynamic render.
export const dynamic = "force-dynamic";

const columns: Column<Property>[] = [
  {
    key: "name",
    header: "Property",
    sortable: true,
    render: (p) => (
      <div className="flex min-w-0 items-center gap-3">
        <Avatar name={p.name} />
        <Link
          href={`/properties/${p.id}`}
          className="block truncate font-medium after:absolute after:inset-0 after:content-['']"
        >
          {p.name}
        </Link>
      </div>
    ),
  },
  {
    key: "type",
    header: "Type",
    sortable: true,
    hideBelow: "sm",
    render: (p) => (
      <span className="truncate text-sm text-ink-muted">
        {PROPERTY_TYPES[p.type]}
      </span>
    ),
  },
  {
    key: "location",
    header: "Location",
    sortable: true,
    hideBelow: "md",
    render: (p) => <span className="truncate text-sm">{formatCityLine(p)}</span>,
  },
  {
    key: "status",
    header: "Status",
    sortable: true,
    align: "right",
    hideBelow: "sm",
    render: (p) => <StatusBadge status={p.status} />,
  },
  {
    key: "rent",
    header: "Rent / mo",
    sortable: true,
    align: "right",
    render: (p) => (
      <div className="flex items-center justify-end gap-3">
        <span className="font-medium tabular-nums">
          {p.rentAmount ? formatMoney(p.rentAmount) : "—"}
        </span>
        <RowChevron />
      </div>
    ),
  },
];

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const sp = await searchParams;
  const params = parseTableParams(sp, {
    sortKeys: PROPERTY_SORT_KEYS,
    defaultSort: "created",
    defaultDir: "desc",
    typeKeys: Object.keys(PROPERTY_TYPES),
  });

  // Full list drives the portfolio KPIs; the page drives the table.
  const [all, leases, { rows, total }] = await Promise.all([
    getProperties(),
    getAllLeases(),
    getPropertiesPage(params),
  ]);

  const rentRoll = all.reduce(
    (sum, p) => sum + (p.rentAmount ? Number(p.rentAmount) : 0),
    0,
  );
  // Occupancy from lease coverage, matching the dashboard (not the status column).
  const occupied = currentOccupiedCount(leases);

  return (
    <div>
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-ink-muted">Portfolio</p>
          <h1 className="mt-1 text-4xl font-semibold tracking-tight">
            Properties
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            {all.length} {all.length === 1 ? "property" : "properties"} under
            management.
          </p>
        </div>
        <Link href="/properties/new">
          <Button variant="contained" component="span" startIcon={<PlusIcon />}>
            New property
          </Button>
        </Link>
      </div>

      {/* Stat tiles */}
      <div className="mt-6 flex flex-wrap gap-10">
        <StatTile
          label="Monthly rent roll"
          value={formatMoney(rentRoll.toString())}
          accent
        />
        <StatTile label="Total properties" value={all.length.toString()} />
        <StatTile label="Occupied" value={`${occupied} of ${all.length}`} />
      </div>

      {/* Search + table */}
      <div className="mt-6 flex flex-wrap gap-3">
        <TableSearch placeholder="Search properties…" />
        <TableTypeFilter options={PROPERTY_TYPES} placeholder="All types" />
      </div>
      <div className="mt-3">
        <DataTable
          columns={columns}
          rows={rows}
          sort={params.sort}
          dir={params.dir}
          searchParams={sp}
          empty={
            params.q || params.type
              ? "No properties match your filters."
              : "No properties yet."
          }
        />
        <Pagination
          page={params.page}
          pageSize={params.pageSize}
          total={total}
          searchParams={sp}
          noun="property"
          nounPlural="properties"
        />
      </div>
    </div>
  );
}
