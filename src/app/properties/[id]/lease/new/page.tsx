import Link from "next/link";
import { notFound } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { getProperty, getPropertyUnits, getTenants } from "@/db/queries";
import { PlusIcon } from "@/components/plus-icon";
import { createLease } from "../../../lease-actions";
import { LeaseForm } from "../../../lease-form";

export const metadata = { title: "New lease · Property CRM" };

export default async function NewLeasePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ unit?: string }>;
}) {
  const { id } = await params;
  const { unit } = await searchParams;
  const [property, units, tenants] = await Promise.all([
    getProperty(id),
    getPropertyUnits(id),
    getTenants(),
  ]);

  if (!property) notFound();

  const defaultUnitId = units.some((u) => u.id === unit) ? unit : undefined;
  const action = createLease.bind(null, property.id);

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={`/properties/${property.id}`}
        className="text-sm text-ink-muted hover:text-ink"
      >
        ← Back to {property.name}
      </Link>
      <h1 className="mb-6 mt-3 text-3xl font-semibold tracking-tight">
        Start a lease
      </h1>

      {tenants.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 6, textAlign: "center", borderStyle: "dashed" }}>
          <Typography sx={{ color: "var(--ink-muted)" }}>
            You need at least one tenant before starting a lease.
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Link href="/tenants/new">
              <Button variant="contained" component="span" startIcon={<PlusIcon />}>
                Add a tenant
              </Button>
            </Link>
          </Box>
        </Paper>
      ) : (
        <LeaseForm
          action={action}
          tenants={tenants}
          units={units}
          defaultUnitId={defaultUnitId}
          cancelHref={`/properties/${property.id}`}
          successHref={`/properties/${property.id}`}
        />
      )}
    </div>
  );
}
