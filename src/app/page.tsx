import Link from "next/link";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { getProperties } from "@/db/queries";
import { StatusBadge } from "@/components/badge";
import { Avatar } from "@/components/avatar";
import { PROPERTY_TYPES } from "@/lib/validation";
import { formatCityLine, formatMoney } from "@/lib/format";

// Always render fresh from the database.
export const dynamic = "force-dynamic";

function StatTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div>
      <p className="text-sm text-ink-muted">{label}</p>
      <p
        className={`mt-1 text-2xl font-semibold tracking-tight ${
          accent ? "text-positive" : "text-ink"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

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

export default async function HomePage() {
  const properties = await getProperties();

  const rentRoll = properties.reduce(
    (sum, p) => sum + (p.rentAmount ? Number(p.rentAmount) : 0),
    0,
  );
  const occupied = properties.filter(
    (p) => p.status === "occupied" || p.status === "active",
  ).length;

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
            {properties.length}{" "}
            {properties.length === 1 ? "property" : "properties"} under
            management.
          </p>
        </div>
        <Link href="/properties/new" className="btn btn-primary">
          New property
        </Link>
      </div>

      {/* Stat tiles */}
      <div className="mt-6 flex flex-wrap gap-10">
        <StatTile
          label="Monthly rent roll"
          value={formatMoney(rentRoll.toString())}
          accent
        />
        <StatTile label="Total properties" value={properties.length.toString()} />
        <StatTile
          label="Active / occupied"
          value={`${occupied} of ${properties.length}`}
        />
      </div>

      {/* Table */}
      {properties.length === 0 ? (
        <div className="mt-6 rounded-md border border-dashed border-border-strong bg-surface p-12 text-center">
          <p className="text-ink-muted">No properties yet.</p>
          <Link
            href="/properties/new"
            className="btn btn-primary mt-4 inline-flex"
          >
            Add your first property
          </Link>
        </div>
      ) : (
        <div className="mt-6 bg-surface">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Property</TableCell>
                <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
                  Location
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ display: { xs: "none", sm: "table-cell" } }}
                >
                  Status
                </TableCell>
                <TableCell align="right">Rent / mo</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {properties.map((p) => (
                <TableRow key={p.id} hover sx={{ position: "relative" }}>
                  <TableCell>
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar name={p.name} />
                      <div className="min-w-0">
                        <Link
                          href={`/properties/${p.id}`}
                          className="block truncate font-medium after:absolute after:inset-0 after:content-['']"
                        >
                          {p.name}
                        </Link>
                        <p className="truncate text-sm text-ink-muted">
                          {PROPERTY_TYPES[p.type]}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell
                    sx={{ display: { xs: "none", sm: "table-cell" } }}
                  >
                    <p className="truncate text-sm">{p.city}</p>
                    <p className="truncate text-sm text-ink-muted">
                      {formatCityLine(p)}
                    </p>
                  </TableCell>

                  <TableCell
                    align="right"
                    sx={{ display: { xs: "none", sm: "table-cell" } }}
                  >
                    <StatusBadge status={p.status} />
                  </TableCell>

                  <TableCell align="right">
                    <div className="flex items-center justify-end gap-3">
                      <span className="font-medium tabular-nums">
                        {p.rentAmount ? formatMoney(p.rentAmount) : "—"}
                      </span>
                      <ChevronRight />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
