"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";

function BuildingIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 21h18" />
      <path d="M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16" />
      <path d="M15 21V9h2a2 2 0 0 1 2 2v10" />
      <path d="M9 7h2M9 11h2M9 15h2" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="10" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

// Abstract duotone logo mark — two overlapping discs (an "eclipse") using the
// brand's ink + lime accent, drawn directly on the canvas (no tile).
function LogoMark() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" aria-hidden>
      <circle cx="8" cy="12" r="5.5" fill="var(--ink)" />
      <circle
        cx="16"
        cy="12"
        r="5.5"
        fill="var(--accent)"
        stroke="var(--ink)"
        strokeWidth="1"
      />
    </svg>
  );
}

const nav = [
  { href: "/", label: "Properties", icon: BuildingIcon, match: /^\/($|properties)/ },
  { href: "/tenants", label: "Tenants", icon: UsersIcon, match: /^\/tenants/ },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 240,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          position: "relative",
          width: 240,
          boxSizing: "border-box",
          border: "none",
          borderRight: "1px solid var(--border)",
          backgroundColor: "var(--canvas)",
        },
      }}
    >
      <Box sx={{ px: 2.5, py: 2.5 }}>
        <Link href="/" aria-label="Property CRM" style={{ display: "flex" }}>
          <LogoMark />
        </Link>
      </Box>

      <Box sx={{ flex: 1, px: 1.5 }}>
        <Typography
          variant="caption"
          sx={{
            display: "block",
            px: 1,
            pb: 0.5,
            pt: 1,
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.03em",
            color: "var(--ink-faint)",
          }}
        >
          Portfolio
        </Typography>
        <List disablePadding sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
          {nav.map(({ href, label, icon: Icon, match }) => {
            const active = match.test(pathname);
            return (
              <ListItemButton
                key={href}
                component={Link}
                href={href}
                selected={active}
                sx={{
                  borderRadius: 1,
                  py: 0.75,
                  px: 1,
                  color: active ? "var(--ink)" : "var(--ink-muted)",
                  "&.Mui-selected": {
                    backgroundColor: "#fff",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                    border: "1px solid var(--border)",
                  },
                  "&.Mui-selected:hover": {
                    backgroundColor: "#fff",
                  },
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.6)",
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 0, mr: 1.25, color: "inherit" }}>
                  <Icon className="size-4" />
                </ListItemIcon>
                <ListItemText
                  primary={label}
                  slotProps={{
                    primary: {
                      sx: { fontSize: "0.875rem", fontWeight: active ? 500 : 400 },
                    },
                  }}
                />
              </ListItemButton>
            );
          })}
        </List>
      </Box>

      <Box sx={{ p: 1.5 }}>
        <Button
          variant="outlined"
          fullWidth
          component={Link}
          href={pathname.startsWith("/tenants") ? "/tenants/new" : "/properties/new"}
          startIcon={<PlusIcon className="size-4" />}
        >
          {pathname.startsWith("/tenants") ? "New tenant" : "New property"}
        </Button>
      </Box>
    </Drawer>
  );
}
