"use client";

import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

function CloseIcon() {
  return (
    <svg
      className="size-4 text-ink-muted"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

// Shared modal shell for the app. Renders a styled Dialog with a header
// (title, optional description, close affordance), a body region for
// arbitrary content, and a footer for actions — so every modal reads the
// same regardless of what it contains.
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  actions,
  maxWidth = 420,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  maxWidth?: number;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: "100%",
            maxWidth,
            m: 2,
            borderRadius: 2,
            border: "1px solid var(--border-strong)",
            backgroundColor: "var(--surface)",
            boxShadow: "0 16px 48px rgba(26, 26, 26, 0.16)",
          },
        },
        backdrop: {
          sx: { backgroundColor: "rgba(26, 26, 26, 0.32)" },
        },
      }}
    >
      <Stack sx={{ p: 3, pb: actions ? 2.5 : 3 }} spacing={2.5}>
        <Stack
          direction="row"
          spacing={2}
          sx={{ alignItems: "flex-start", justifyContent: "space-between" }}
        >
          <Stack spacing={0.75} sx={{ minWidth: 0 }}>
            <Typography
              variant="h6"
              sx={{ fontSize: "1.0625rem", fontWeight: 600, color: "var(--ink)" }}
            >
              {title}
            </Typography>
            {description && (
              <Typography
                variant="body2"
                sx={{ color: "var(--ink-muted)", lineHeight: 1.5 }}
              >
                {description}
              </Typography>
            )}
          </Stack>
          <IconButton
            aria-label="Close"
            onClick={onClose}
            size="small"
            sx={{
              mt: -0.5,
              mr: -0.5,
              borderRadius: 1,
              "&:hover": { backgroundColor: "var(--surface-muted)" },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Stack>

        {children}

        {actions && (
          <Stack
            direction="row"
            spacing={1}
            sx={{ justifyContent: "flex-end", pt: 0.5 }}
          >
            {actions}
          </Stack>
        )}
      </Stack>
    </Dialog>
  );
}
