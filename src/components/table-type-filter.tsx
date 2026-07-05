"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";

function ClearIcon() {
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

// Select that pushes the chosen value into ?type= and resets to page 1,
// preserving any active search/sort. Mirrors TableSearch's URL-driven approach.
// The dropdown lists only real types — clearing is done via the explicit clear
// button, so the value is only ever "set" or absent, never a blank menu choice.
export function TableTypeFilter({
  options,
  placeholder = "All types",
}: {
  options: Record<string, string>;
  placeholder?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const value = searchParams.get("type") ?? "";

  function onChange(next: string) {
    const params = new URLSearchParams(searchParams);
    if (next) params.set("type", next);
    else params.delete("type");
    params.delete("page");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <TextField
      select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      size="small"
      sx={{
        width: { xs: "100%", sm: 200 },
        // Keep the selected label clear of the clear button + dropdown arrow.
        "& .MuiSelect-select": { pr: value ? 6 : undefined },
      }}
      slotProps={{
        select: {
          displayEmpty: true,
          renderValue: (selected) =>
            selected ? (
              options[selected as string]
            ) : (
              <span className="text-ink-faint">{placeholder}</span>
            ),
          endAdornment: value ? (
            <InputAdornment position="end" sx={{ mr: 2 }}>
              <IconButton
                size="small"
                aria-label="Clear type filter"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange("");
                }}
                edge="end"
              >
                <ClearIcon />
              </IconButton>
            </InputAdornment>
          ) : undefined,
        },
      }}
    >
      {Object.entries(options).map(([key, label]) => (
        <MenuItem key={key} value={key}>
          {label}
        </MenuItem>
      ))}
    </TextField>
  );
}
