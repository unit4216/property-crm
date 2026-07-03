import type { Property, Lease } from "@/db/schema";
import { PROPERTY_STATUSES, LEASE_STATUSES } from "@/lib/validation";

const STATUS_STYLES: Record<Property["status"], string> = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  occupied: "bg-blue-50 text-blue-700 ring-blue-600/20",
  vacant: "bg-amber-50 text-amber-700 ring-amber-600/20",
  under_maintenance: "bg-orange-50 text-orange-700 ring-orange-600/20",
  listed: "bg-violet-50 text-violet-700 ring-violet-600/20",
};

export function StatusBadge({ status }: { status: Property["status"] }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[status]}`}
    >
      {PROPERTY_STATUSES[status]}
    </span>
  );
}

const LEASE_STATUS_STYLES: Record<Lease["status"], string> = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  upcoming: "bg-sky-50 text-sky-700 ring-sky-600/20",
  ended: "bg-neutral-100 text-neutral-600 ring-neutral-500/20",
};

export function LeaseStatusBadge({ status }: { status: Lease["status"] }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${LEASE_STATUS_STYLES[status]}`}
    >
      {LEASE_STATUSES[status]}
    </span>
  );
}
