import Typography from "@mui/material/Typography";

export function StatTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div>
      <Typography variant="body2" sx={{ color: "var(--ink-muted)" }}>
        {label}
      </Typography>
      <Typography
        variant="h5"
        sx={{
          mt: 0.5,
          fontWeight: 600,
          letterSpacing: "-0.01em",
          color: accent ? "var(--positive)" : "var(--ink)",
        }}
      >
        {value}
      </Typography>
    </div>
  );
}
