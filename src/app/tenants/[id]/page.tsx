import Link from "next/link";
import { notFound } from "next/navigation";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import { getTenant, getTenantLeases } from "@/db/queries";
import { LeaseStatusBadge } from "@/components/badge";
import { Avatar } from "@/components/avatar";
import { formatCityLine, formatDate, formatMoney } from "@/lib/format";
import { DeleteTenantButton } from "../delete-button";

export const dynamic = "force-dynamic";

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [tenant, leases] = await Promise.all([
    getTenant(id),
    getTenantLeases(id),
  ]);

  if (!tenant) notFound();

  return (
    <div>
      <Link href="/tenants" className="text-sm text-ink-muted hover:text-ink">
        ← Back to tenants
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Avatar name={tenant.name} size="lg" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {tenant.name}
            </h1>
            <p className="mt-1 text-ink-muted">{tenant.email ?? "—"}</p>
            {tenant.phone && (
              <p className="mt-0.5 text-sm text-ink-faint">{tenant.phone}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/tenants/${tenant.id}/edit`}>
            <Button variant="outlined" component="span">
              Edit
            </Button>
          </Link>
          <DeleteTenantButton id={tenant.id} name={tenant.name} />
        </div>
      </div>

      {tenant.notes && (
        <Paper component="section" variant="outlined" sx={{ mt: 3, p: 3 }}>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Notes
          </h2>
          <p className="mt-2 whitespace-pre-wrap text-sm">{tenant.notes}</p>
        </Paper>
      )}

      <section className="mt-6">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Leases
        </h2>

        {leases.length === 0 ? (
          <p className="mt-2 text-sm text-ink-muted">No leases yet.</p>
        ) : (
          <Stack sx={{ mt: 1, bgcolor: "var(--surface)" }}>
            <Table>
              <TableBody>
                {leases.map((lease) => (
                  <TableRow key={lease.id}>
                    <TableCell sx={{ px: 0 }}>
                      <div className="min-w-0">
                        <Link
                          href={`/properties/${lease.property.id}`}
                          className="font-medium hover:underline"
                        >
                          {lease.property.name}
                        </Link>
                        <p className="truncate text-sm text-ink-muted">
                          {formatCityLine(lease.property)}
                        </p>
                        <p className="mt-1 text-xs text-ink-faint">
                          {formatDate(new Date(lease.startDate))} –{" "}
                          {lease.endDate
                            ? formatDate(new Date(lease.endDate))
                            : "present"}
                          {lease.tenants.length > 1 && (
                            <>
                              {" "}
                              · with{" "}
                              {lease.tenants
                                .filter((t) => t.id !== tenant.id)
                                .map((t) => t.name)
                                .join(", ")}
                            </>
                          )}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell align="right" sx={{ px: 0 }}>
                      <div className="flex items-center justify-end gap-3">
                        <span className="font-medium tabular-nums">
                          {formatMoney(lease.rentAmount)}
                        </span>
                        <LeaseStatusBadge status={lease.status} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Stack>
        )}
      </section>
    </div>
  );
}
