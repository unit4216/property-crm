import { createTheme } from "@mui/material/styles";

// Mirrors the design tokens in globals.css so MUI's Table components render
// with the same hairline borders / hover / typography as the rest of the app.
export const theme = createTheme({
  typography: {
    fontFamily: "var(--font-sans), Arial, Helvetica, sans-serif",
  },
  components: {
    MuiTable: {
      styleOverrides: {
        root: {
          backgroundColor: "var(--surface)",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: "1px solid var(--border)",
          padding: "14px 20px",
          fontSize: "0.875rem",
          color: "var(--ink)",
          lineHeight: 1.4,
        },
        head: {
          fontSize: "0.75rem",
          fontWeight: 500,
          color: "var(--ink-muted)",
          padding: "10px 20px",
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:last-child .MuiTableCell-root": {
            borderBottom: "none",
          },
        },
        hover: {
          transition: "background-color 0.15s ease",
          "&:hover": {
            backgroundColor: "var(--surface-muted)",
          },
        },
      },
    },
  },
});
