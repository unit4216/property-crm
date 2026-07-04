"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";

// Select that pushes the chosen value into ?type= and resets to page 1,
// preserving any active search/sort. Mirrors TableSearch's URL-driven approach.
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
      sx={{ width: { xs: "100%", sm: 200 } }}
      slotProps={{ select: { displayEmpty: true } }}
    >
      <MenuItem value="">{placeholder}</MenuItem>
      {Object.entries(options).map(([key, label]) => (
        <MenuItem key={key} value={key}>
          {label}
        </MenuItem>
      ))}
    </TextField>
  );
}
