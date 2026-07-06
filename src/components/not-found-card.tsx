import Link from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

/**
 * Shared empty-state card for a route's `not-found.tsx` — a record that was
 * deleted or never existed. `entity` is the singular noun ("Property"); the
 * button links back to the collection.
 */
export function NotFoundCard({
  entity,
  backHref,
  backLabel,
}: {
  entity: string;
  backHref: string;
  backLabel: string;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 6, textAlign: "center", borderStyle: "dashed" }}>
      <Typography variant="h6" sx={{ fontWeight: 600 }}>
        {entity} not found
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.5, color: "var(--ink-muted)" }}>
        It may have been deleted.
      </Typography>
      <Box sx={{ mt: 2 }}>
        <Link href={backHref}>
          <Button variant="contained" component="span">
            {backLabel}
          </Button>
        </Link>
      </Box>
    </Paper>
  );
}
