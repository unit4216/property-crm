import Link from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

export default function NotFound() {
  return (
    <Paper variant="outlined" sx={{ p: 6, textAlign: "center", borderStyle: "dashed" }}>
      <Typography variant="h6" sx={{ fontWeight: 600 }}>
        Property not found
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.5, color: "var(--ink-muted)" }}>
        It may have been deleted.
      </Typography>
      <Box sx={{ mt: 2 }}>
        <Link href="/">
          <Button variant="contained" component="span">
            Back to properties
          </Button>
        </Link>
      </Box>
    </Paper>
  );
}
