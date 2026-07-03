import Link from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
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
      <Typography variant="body2" sx={{ color: "var(--ink-muted)" }}>
        {label}
      </Typography>
      <Typography
        variant="h5"
        sx={{
          mt: 0.5,
          fontWeight: 600,
          letterSpacing: "-0.01em",
          color: accent ? "var(--positive)" : "var(--ink)",
        }}
      >
        {value}
      </Typography>
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
        <Link href="/properties/new">
          <Button variant="contained" component="span">
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
        <StatTile label="Total properties" value={properties.length.toString()} />
        <StatTile
          label="Active / occupied"
          value={`${occupied} of ${properties.length}`}
        />
      </div>

      {/* Table */}
      {properties.length === 0 ? (
        <Paper variant="outlined" sx={{ mt: 3, p: 6, textAlign: "center", borderStyle: "dashed" }}>
          <Typography sx={{ color: "var(--ink-muted)" }}>
            No properties yet.
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Link href="/properties/new">
              <Button variant="contained" component="span">
                Add your first property
              </Button>
            </Link>
          </Box>
        </Paper>
      ) : (
        <Stack sx={{ mt: 3, bgcolor: "var(--surface)" }}>
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
        </Stack>
      )}
    </div>
  );
}
