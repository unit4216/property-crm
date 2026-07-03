// A small deterministic-colored tile with a name's initials — stands in for
// the merchant/contact logos in the reference design. Used for both
// properties and tenants.
const PALETTE = [
  "bg-rose-100 text-rose-700",
  "bg-amber-100 text-amber-700",
  "bg-emerald-100 text-emerald-700",
  "bg-sky-100 text-sky-700",
  "bg-violet-100 text-violet-700",
  "bg-teal-100 text-teal-700",
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function colorFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export function Avatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "md" | "lg";
}) {
  const dim = size === "lg" ? "size-11 text-sm" : "size-9 text-xs";
  return (
    <span
      className={`grid shrink-0 place-items-center rounded font-semibold ${dim} ${colorFor(
        name,
      )}`}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
