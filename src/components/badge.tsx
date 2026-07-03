import type { Property } from "@/db/schema";
import { PROPERTY_STATUSES } from "@/lib/validation";

const STATUS_STYLES: Record<Property["status"], string> = {
  active:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  occupied:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  vacant:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  under_maintenance:
    "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  listed:
    "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300",
};

export function StatusBadge({ status }: { status: Property["status"] }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {PROPERTY_STATUSES[status]}
    </span>
  );
}
