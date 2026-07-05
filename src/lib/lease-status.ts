// A lease's status is never stored or set by hand — it's derived from where
// today falls relative to its start and end dates, so it can't drift out of
// sync with those dates. The SQL mirror of this logic lives in db/queries.ts
// (for filtering active leases and sorting the leases table by status).

export const LEASE_STATUS_VALUES = ["upcoming", "active", "ended"] as const;

export type LeaseStatus = (typeof LEASE_STATUS_VALUES)[number];

export const LEASE_STATUSES: Record<LeaseStatus, string> = {
  upcoming: "Upcoming",
  active: "Active",
  ended: "Ended",
};

// Dates are stored as "YYYY-MM-DD" strings, so lexicographic comparison is the
// same as chronological. The end date is exclusive: a lease is "ended" on its
// end date itself, so ending a lease (which sets its end date to today) takes
// effect immediately rather than the following day.
export function deriveLeaseStatus({
  startDate,
  endDate,
}: {
  startDate: string;
  endDate: string | null;
}): LeaseStatus {
  const today = new Date().toISOString().slice(0, 10);
  if (startDate > today) return "upcoming";
  if (endDate && endDate <= today) return "ended";
  return "active";
}
