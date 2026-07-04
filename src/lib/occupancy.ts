// Occupancy is derived from lease coverage, not the property `status` column,
// so the dashboard trend, dashboard tile, and properties-page tile all agree.

export type OccupancyLease = {
  propertyId: string;
  startDate: string;
  endDate: string | null;
};

export type OccupancyPoint = { label: string; rate: number };

// Distinct properties occupied in a given month: those with a lease whose date
// range overlaps the month.
function occupiedInMonth(
  leases: OccupancyLease[],
  monthStart: Date,
  monthEnd: Date,
): number {
  const occupied = new Set<string>();
  for (const l of leases) {
    const start = new Date(l.startDate);
    const end = l.endDate ? new Date(l.endDate) : null;
    if (start <= monthEnd && (!end || end >= monthStart)) {
      occupied.add(l.propertyId);
    }
  }
  return occupied.size;
}

// Occupancy rate for each of the last `months` months, as a share of the
// current portfolio.
export function monthlyOccupancy(
  propertyCount: number,
  leases: OccupancyLease[],
  months = 12,
): OccupancyPoint[] {
  const now = new Date();
  const series: OccupancyPoint[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    const occupied = occupiedInMonth(leases, monthStart, monthEnd);
    const rate =
      propertyCount > 0 ? Math.round((occupied / propertyCount) * 100) : 0;
    series.push({
      label: monthStart.toLocaleString("en-US", { month: "short" }),
      rate,
    });
  }

  return series;
}

// Distinct properties occupied in the current month.
export function currentOccupiedCount(leases: OccupancyLease[]): number {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return occupiedInMonth(leases, monthStart, monthEnd);
}
