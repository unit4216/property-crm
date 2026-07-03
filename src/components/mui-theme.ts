import { createTheme } from "@mui/material/styles";

// Mirrors the design tokens in globals.css so MUI components render with the
// same hairline borders / hover / typography as the rest of the app.
export const theme = createTheme({
  typography: {
    fontFamily: "var(--font-sans), Arial, Helvetica, sans-serif",
  },
  palette: {
    primary: {
      main: "#cbf74f",
      dark: "#bfee40",
      contrastText: "#1a1a1a",
    },
    error: {
      main: "#b42318",
    },
  },
  shape: {
    borderRadius: 4,
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 500,
          fontSize: "0.875rem",
        },
      },
      variants: [
        {
          props: { variant: "outlined", color: "primary" },
          style: {
            borderColor: "var(--border-strong)",
            color: "var(--ink)",
            "&:hover": {
              backgroundColor: "var(--surface-muted)",
              borderColor: "var(--border-strong)",
            },
          },
        },
        {
          props: { variant: "outlined", color: "error" },
          style: {
            backgroundColor: "var(--surface)",
            borderColor: "#f0c8c3",
            "&:hover": {
              backgroundColor: "#fdf3f2",
              borderColor: "#f0c8c3",
            },
          },
        },
      ],
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: "var(--ink-muted)",
          "&.Mui-focused": {
            color: "var(--ink)",
          },
          "&.Mui-error": {
            color: "var(--ink-muted)",
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "var(--surface)",
          borderRadius: 0,
          transition: "border-color 0.15s ease",
          "& .MuiOutlinedInput-notchedOutline": {
            borderRadius: 0,
            borderColor: "var(--border-strong)",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "var(--ink-faint)",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "var(--ink)",
            borderWidth: "1.5px",
          },
          "&.Mui-error .MuiOutlinedInput-notchedOutline": {
            borderColor: "#b42318",
          },
          "&.Mui-disabled": {
            backgroundColor: "var(--surface-muted)",
          },
        },
        input: {
          "&::placeholder": {
            color: "var(--ink-faint)",
            opacity: 1,
          },
        },
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          marginLeft: 2,
          fontSize: "0.75rem",
          color: "var(--ink-faint)",
          "&.Mui-error": {
            color: "#b42318",
          },
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: "0.875rem",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          borderRadius: 9999,
        },
      },
    },
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
          borderBottom: "1px solid var(--border-strong)",
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "tbody &:last-child .MuiTableCell-root": {
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
