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
        <Link href="/tenants/new">
          <Button variant="contained" component="span">
            New tenant
          </Button>
        </Link>
      </div>

      {tenants.length === 0 ? (
        <Paper variant="outlined" sx={{ mt: 3, p: 6, textAlign: "center", borderStyle: "dashed" }}>
          <Typography sx={{ color: "var(--ink-muted)" }}>
            No tenants yet.
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Link href="/tenants/new">
              <Button variant="contained" component="span">
                Add your first tenant
              </Button>
            </Link>
          </Box>
        </Paper>
      ) : (
        <Stack sx={{ mt: 3, bgcolor: "var(--surface)" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tenant</TableCell>
                <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
                  Contact
                </TableCell>
                <TableCell align="right" sx={{ width: 1 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {tenants.map((t) => (
                <TableRow key={t.id} hover sx={{ position: "relative" }}>
                  <TableCell>
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar name={t.name} />
                      <Link
                        href={`/tenants/${t.id}`}
                        className="block truncate font-medium after:absolute after:inset-0 after:content-['']"
                      >
                        {t.name}
                      </Link>
                    </div>
                  </TableCell>

                  <TableCell
                    sx={{ display: { xs: "none", sm: "table-cell" } }}
                  >
                    <p className="truncate text-sm">{t.email ?? "—"}</p>
                    <p className="truncate text-sm text-ink-muted">
                      {t.phone ?? ""}
                    </p>
                  </TableCell>

                  <TableCell align="right">
                    <ChevronRight />
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
