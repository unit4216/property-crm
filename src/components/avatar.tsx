import MuiAvatar from "@mui/material/Avatar";

// A small deterministic-colored tile with a name's initials — stands in for
// the merchant/contact logos in the reference design. Used for both
// properties and tenants.
const PALETTE = [
  { bg: "#fff1f2", color: "#be123c" },
  { bg: "#fffbeb", color: "#b45309" },
  { bg: "#ecfdf5", color: "#047857" },
  { bg: "#f0f9ff", color: "#0369a1" },
  { bg: "#f5f3ff", color: "#6d28d9" },
  { bg: "#f0fdfa", color: "#0f766e" },
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function colorFor(seed: string): { bg: string; color: string } {
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
  const dim = size === "lg" ? 44 : 36;
  const { bg, color } = colorFor(name);
  return (
    <MuiAvatar
      variant="rounded"
      sx={{
        width: dim,
        height: dim,
        bgcolor: bg,
        color,
        fontSize: size === "lg" ? "0.875rem" : "0.75rem",
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      {initials(name)}
    </MuiAvatar>
  );
}
