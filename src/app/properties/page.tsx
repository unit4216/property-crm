import Link from "next/link";
import Button from "@mui/material/Button";
import {
  getProperties,
  getPropertiesPage,
  getAllLeases,
  PROPERTY_SORT_KEYS,
  type PropertyWithRent,
} from "@/db/queries";
import { StatusBadge } from "@/components/badge";
import { Avatar } from "@/components/avatar";
import { StatTile } from "@/components/stat-tile";
import { DataTable, RowChevron, type Column } from "@/components/data-table";
import { TableSearch } from "@/components/table-search";
import { TableTypeFilter } from "@/components/table-type-filter";
import { TableStatusFilter } from "@/components/table-status-filter";
import { Pagination } from "@/components/pagination";
import { PlusIcon } from "@/components/plus-icon";
import { currentOccupiedCount } from "@/lib/occupancy";
import { parseTableParams, type RawSearchParams } from "@/lib/table-params";
import { PROPERTY_TYPES, PROPERTY_STATUSES } from "@/lib/validation";
import { formatCityLine, formatMoney } from "@/lib/format";

// searchParams (q/sort/dir/page) makes this a request-time, dynamic render.
export const dynamic = "force-dynamic";

// Status toggle: defaults to "active" so sold properties are hidden until the
// user opts into "Sold" or "All". "all" is a filter sentinel, not a real status.
const STATUS_DEFAULT = "active";
const STATUS_OPTIONS = [
  { value: "active", label: PROPERTY_STATUSES.active },
  { value: "sold", label: PROPERTY_STATUSES.sold },
  { value: "all", label: "All" },
];
const STATUS_KEYS = STATUS_OPTIONS.map((o) => o.value);

const columns: Column<PropertyWithRent>[] = [
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
          {Number(p.monthlyRent) > 0 ? formatMoney(p.monthlyRent) : "—"}
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
    statusKeys: STATUS_KEYS,
    defaultStatus: STATUS_DEFAULT,
  });

  // Full list drives the portfolio KPIs; the page drives the table.
  const [all, leases, { rows, total }] = await Promise.all([
    getProperties(),
    getAllLeases(),
    getPropertiesPage(params),
  ]);

  // Rent roll is realized income: the sum of every active lease's rent.
  const rentRoll = leases
    .filter((l) => l.status === "active")
    .reduce((sum, l) => sum + (l.rentAmount ? Number(l.rentAmount) : 0), 0);
  // Occupancy from lease coverage, matching the dashboard (not the status column).
  const occupied = currentOccupiedCount(
    leases.map((l) => ({
      propertyId: l.property.id,
      startDate: l.startDate,
      endDate: l.endDate,
    })),
  );

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
        <div className="sm:ml-auto">
          <TableStatusFilter
            options={STATUS_OPTIONS}
            defaultValue={STATUS_DEFAULT}
          />
        </div>
      </div>
      <div className="mt-3">
        <DataTable
          columns={columns}
          rows={rows}
          sort={params.sort}
          dir={params.dir}
          searchParams={sp}
          empty={
            all.length === 0
              ? "No properties yet."
              : "No properties match your filters."
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
