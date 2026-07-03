import Chip from "@mui/material/Chip";
import type { Property, Lease } from "@/db/schema";
import { PROPERTY_STATUSES, LEASE_STATUSES } from "@/lib/validation";

const STATUS_STYLES: Record<Property["status"], { bg: string; color: string; border: string }> = {
  active: { bg: "#ecfdf5", color: "#047857", border: "rgba(5,150,105,0.2)" },
  occupied: { bg: "#eff6ff", color: "#1d4ed8", border: "rgba(37,99,235,0.2)" },
  vacant: { bg: "#fffbeb", color: "#b45309", border: "rgba(217,119,6,0.2)" },
  under_maintenance: { bg: "#fff7ed", color: "#c2410c", border: "rgba(234,88,12,0.2)" },
  listed: { bg: "#f5f3ff", color: "#6d28d9", border: "rgba(124,58,237,0.2)" },
};

export function StatusBadge({ status }: { status: Property["status"] }) {
  const { bg, color, border } = STATUS_STYLES[status];
  return (
    <Chip
      size="small"
      label={PROPERTY_STATUSES[status]}
      sx={{
        bgcolor: bg,
        color,
        border: `1px solid ${border}`,
      }}
    />
  );
}

const LEASE_STATUS_STYLES: Record<Lease["status"], { bg: string; color: string; border: string }> = {
  active: { bg: "#ecfdf5", color: "#047857", border: "rgba(5,150,105,0.2)" },
  upcoming: { bg: "#f0f9ff", color: "#0369a1", border: "rgba(2,132,199,0.2)" },
  ended: { bg: "#f5f5f5", color: "#525252", border: "rgba(115,115,115,0.2)" },
};

export function LeaseStatusBadge({ status }: { status: Lease["status"] }) {
  const { bg, color, border } = LEASE_STATUS_STYLES[status];
  return (
    <Chip
      size="small"
      label={LEASE_STATUSES[status]}
      sx={{
        bgcolor: bg,
        color,
        border: `1px solid ${border}`,
      }}
    />
  );
}
