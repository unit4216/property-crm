"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";

function GridIcon({ className }: { className?: string }) {
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
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" />
    </svg>
  );
}

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

function LeaseIcon({ className }: { className?: string }) {
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
      <path d="M14 3v4a1 1 0 0 0 1 1h4" />
      <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z" />
      <path d="M9 13h6M9 17h6" />
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
  { href: "/", label: "Dashboard", icon: GridIcon, match: /^\/$/ },
  { href: "/properties", label: "Properties", icon: BuildingIcon, match: /^\/properties/ },
  { href: "/tenants", label: "Tenants", icon: UsersIcon, match: /^\/tenants/ },
  { href: "/leases", label: "Leases", icon: LeaseIcon, match: /^\/leases/ },
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
        <List disablePadding sx={{ display: "flex", flexDirection: "column", gap: 0.25, mt: 1 }}>
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
    </Drawer>
  );
}
