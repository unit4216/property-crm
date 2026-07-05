"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";

// Segmented toggle that pushes the chosen status into ?status= and resets to
// page 1, preserving any active search/sort/type. Mirrors TableTypeFilter's
// URL-driven approach. The default value ("active") is written as a bare URL —
// its param is dropped — so the clean URL is the default view.
export function TableStatusFilter({
  options,
  defaultValue,
}: {
  options: { value: string; label: string }[];
  defaultValue: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const value = searchParams.get("status") ?? defaultValue;

  function onChange(next: string | null) {
    // Ignore deselecting the active button — the group is always exclusive.
    if (next === null) return;
    const params = new URLSearchParams(searchParams);
    if (next === defaultValue) params.delete("status");
    else params.set("status", next);
    params.delete("page");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <ToggleButtonGroup
      exclusive
      value={value}
      onChange={(_, next) => onChange(next)}
      size="small"
      aria-label="Filter by status"
      sx={{
        backgroundColor: "var(--surface)",
        // Sharp edges to match the search / type filters (borderRadius: 0).
        "& .MuiToggleButtonGroup-grouped": {
          borderRadius: 0,
          border: "1px solid var(--border-strong)",
          px: 2,
          textTransform: "none",
          color: "var(--ink-muted)",
          "&:not(:first-of-type)": { marginLeft: "-1px" },
          "&.Mui-selected": {
            backgroundColor: "var(--surface-muted)",
            color: "var(--ink)",
          },
        },
      }}
    >
      {options.map((o) => (
        <ToggleButton key={o.value} value={o.value}>
          {o.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
