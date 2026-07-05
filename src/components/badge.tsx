import type { Property } from "@/db/schema";
import { PROPERTY_STATUSES } from "@/lib/validation";
import { LEASE_STATUSES, type LeaseStatus } from "@/lib/lease-status";

// Dot colors per status. A single saturated hue reads as a quiet status
// indicator next to a muted label — calmer than a filled pill in every row.
const STATUS_DOT_COLORS: Record<Property["status"], string> = {
  active: "#059669", // emerald
  occupied: "#2563eb", // blue
  vacant: "#d97706", // amber
  under_maintenance: "#ea580c", // orange
  listed: "#7c3aed", // violet
};

function StatusDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap text-sm text-ink-muted">
      <span
        aria-hidden
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

export function StatusBadge({ status }: { status: Property["status"] }) {
  return (
    <StatusDot color={STATUS_DOT_COLORS[status]} label={PROPERTY_STATUSES[status]} />
  );
}

const LEASE_STATUS_DOT_COLORS: Record<LeaseStatus, string> = {
  active: "#059669", // emerald
  upcoming: "#0284c7", // sky
  ended: "#737373", // neutral
};

export function LeaseStatusBadge({ status }: { status: LeaseStatus }) {
  return (
    <StatusDot
      color={LEASE_STATUS_DOT_COLORS[status]}
      label={LEASE_STATUSES[status]}
    />
  );
}
