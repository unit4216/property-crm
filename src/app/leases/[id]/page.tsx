import Link from "next/link";
import { notFound } from "next/navigation";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { getLease } from "@/db/queries";
import { LeaseStatusBadge } from "@/components/badge";
import { formatAddressLine, formatCityLine, formatDate, formatMoney } from "@/lib/format";
import { EndLeaseButton } from "../../properties/end-lease-button";

export const dynamic = "force-dynamic";

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <Typography
        component="dt"
        variant="caption"
        sx={{
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: "0.03em",
          color: "var(--ink-muted)",
        }}
      >
        {label}
      </Typography>
      <Typography
        component="dd"
        variant="body1"
        sx={{ mt: 0.5, fontWeight: 600, color: "var(--ink)" }}
      >
        {value}
      </Typography>
    </div>
  );
}

export default async function LeaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lease = await getLease(id);

  if (!lease) notFound();

  return (
    <div>
      <Link href="/leases" className="text-sm text-ink-muted hover:text-ink">
        ← Back to leases
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {lease.tenants.map((t) => t.name).join(", ") || "Lease"}
            </h1>
            <LeaseStatusBadge status={lease.status} />
          </div>
          <p className="mt-1 text-ink-muted">
            {formatAddressLine(lease.property)} · {formatCityLine(lease.property)}
          </p>
        </div>
        {lease.status === "active" && (
          <EndLeaseButton id={lease.id} propertyId={lease.property.id} />
        )}
      </div>

      <dl className="mt-6 flex flex-wrap gap-8">
        <Stat
          label="Property"
          value={
            <Link
              href={`/properties/${lease.property.id}`}
              className="hover:underline"
            >
              {lease.property.name}
            </Link>
          }
        />
        <Stat label="Unit" value={lease.unit.label} />
        <Stat
          label="Dates"
          value={`${formatDate(new Date(lease.startDate))} – ${
            lease.endDate ? formatDate(new Date(lease.endDate)) : "present"
          }`}
        />
      </dl>

      <dl className="mt-6 flex flex-wrap gap-8">
        <Stat label="Rent / mo" value={formatMoney(lease.rentAmount)} />
        <Stat label="Deposit" value={formatMoney(lease.depositAmount)} />
      </dl>

      <Paper component="section" variant="outlined" sx={{ mt: 3, p: 3 }}>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Tenants
        </h2>
        {lease.tenants.length > 0 ? (
          <ul className="mt-3 flex flex-col gap-2">
            {lease.tenants.map((t) => (
              <li key={t.id}>
                <Link href={`/tenants/${t.id}`} className="text-sm font-medium hover:underline">
                  {t.name}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-ink-muted">No tenants on this lease.</p>
        )}
      </Paper>

      {lease.notes && (
        <Paper component="section" variant="outlined" sx={{ mt: 3, p: 3 }}>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Notes
          </h2>
          <p className="mt-2 whitespace-pre-wrap text-sm">{lease.notes}</p>
        </Paper>
      )}

      <p className="mt-6 text-xs text-ink-faint">
        Added {formatDate(lease.createdAt)} · Updated {formatDate(lease.updatedAt)}
      </p>
    </div>
  );
}
