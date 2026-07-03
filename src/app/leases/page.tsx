import Link from "next/link";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { getAllLeases } from "@/db/queries";
import { LeaseStatusBadge } from "@/components/badge";
import { formatDate, formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function LeasesPage() {
  const leases = await getAllLeases();

  return (
    <div>
      <div>
        <p className="text-sm font-medium text-ink-muted">Portfolio</p>
        <h1 className="mt-1 text-4xl font-semibold tracking-tight">Leases</h1>
        <p className="mt-2 text-sm text-ink-muted">
          {leases.length} {leases.length === 1 ? "lease" : "leases"} across
          your properties.
        </p>
      </div>

      {leases.length === 0 ? (
        <Paper
          variant="outlined"
          sx={{ mt: 3, p: 6, textAlign: "center", borderStyle: "dashed" }}
        >
          <Typography sx={{ color: "var(--ink-muted)" }}>
            No leases yet.
          </Typography>
        </Paper>
      ) : (
        <Stack sx={{ mt: 3, bgcolor: "var(--surface)" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Property</TableCell>
                <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
                  Tenant(s)
                </TableCell>
                <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
                  Dates
                </TableCell>
                <TableCell align="right">Rent</TableCell>
                <TableCell align="right">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leases.map((lease) => (
                <TableRow key={lease.id} hover sx={{ position: "relative" }}>
                  <TableCell>
                    <Link
                      href={`/properties/${lease.property.id}`}
                      className="block truncate font-medium after:absolute after:inset-0 after:content-['']"
                    >
                      {lease.property.name}
                    </Link>
                  </TableCell>

                  <TableCell
                    sx={{ display: { xs: "none", sm: "table-cell" } }}
                  >
                    <p className="truncate text-sm">
                      {lease.tenants.map((t) => t.name).join(", ") || "—"}
                    </p>
                  </TableCell>

                  <TableCell
                    sx={{ display: { xs: "none", md: "table-cell" } }}
                  >
                    <p className="truncate text-sm text-ink-muted">
                      {formatDate(new Date(lease.startDate))} –{" "}
                      {lease.endDate
                        ? formatDate(new Date(lease.endDate))
                        : "present"}
                    </p>
                  </TableCell>

                  <TableCell align="right">
                    <span className="text-sm tabular-nums">
                      {formatMoney(lease.rentAmount)}
                    </span>
                  </TableCell>

                  <TableCell align="right">
                    <LeaseStatusBadge status={lease.status} />
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
