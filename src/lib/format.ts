import type { Property } from "@/db/schema";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const dateFmt = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

/** Formats a numeric string like "1500.00" as "$1,500". Returns "—" if empty. */
export function formatMoney(value: string | null): string {
  if (value === null) return "—";
  const n = Number(value);
  return Number.isFinite(n) ? currency.format(n) : "—";
}

export function formatDate(value: Date): string {
  return dateFmt.format(value);
}

/** Single-line street address. */
export function formatAddressLine(p: Property): string {
  return [p.addressLine1, p.addressLine2].filter(Boolean).join(", ");
}

/** City, ST ZIP. */
export function formatCityLine(p: Property): string {
  return `${p.city}, ${p.state} ${p.zip}`;
}
