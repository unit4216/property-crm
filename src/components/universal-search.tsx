"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
import { searchAction } from "@/app/search-actions";
import type { UniversalSearchResults } from "@/db/queries";

function SearchIcon() {
  return (
    <svg
      className="size-4 text-ink-faint"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

const EMPTY_RESULTS: UniversalSearchResults = { properties: [], tenants: [] };

type Row = { href: string; primary: string; secondary: string };

function toRows(results: UniversalSearchResults): { title: string; rows: Row[] }[] {
  const groups = [
    {
      title: "Properties",
      rows: results.properties.map((p) => ({
        href: `/properties/${p.id}`,
        primary: p.name,
        secondary: `${p.city}, ${p.state}`,
      })),
    },
    {
      title: "Tenants",
      rows: results.tenants.map((t) => ({
        href: `/tenants/${t.id}`,
        primary: t.name,
        secondary: t.email || t.phone || "No contact info",
      })),
    },
  ];
  return groups.filter((g) => g.rows.length > 0);
}

// Debounced search across properties and tenants, shown in a dropdown below
// the input. Selecting a row (click or Enter on the top match) navigates
// straight to that record.
export function UniversalSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [results, setResults] = useState<UniversalSearchResults>(EMPTY_RESULTS);
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function onChange(next: string) {
    setValue(next);
    clearTimeout(timer.current);
    const term = next.trim();
    if (!term) {
      setResults(EMPTY_RESULTS);
      setOpen(false);
      return;
    }
    timer.current = setTimeout(() => {
      startTransition(async () => {
        const found = await searchAction(term);
        setResults(found);
        setOpen(true);
      });
    }, 300);
  }

  function onSelect(href: string) {
    setOpen(false);
    setValue("");
    setResults(EMPTY_RESULTS);
    router.push(href);
  }

  const groups = toRows(results);

  return (
    <div ref={containerRef} className="relative">
      <TextField
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => value.trim() && groups.length > 0 && setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
          if (e.key === "Enter") {
            const first = groups[0]?.rows[0];
            if (first) onSelect(first.href);
          }
        }}
        placeholder="Search properties, tenants…"
        size="small"
        type="search"
        sx={{ width: { xs: "100%", sm: 320 } }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          },
        }}
      />
      {open && (
        <Paper
          variant="outlined"
          className="absolute right-0 z-10 mt-1 w-full min-w-[320px] overflow-hidden"
        >
          {groups.length === 0 ? (
            <p className="px-4 py-4 text-center text-sm text-ink-muted">
              No results found.
            </p>
          ) : (
            groups.map((group) => (
              <div key={group.title}>
                <p
                  className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-ink-faint"
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  {group.title}
                </p>
                <ul>
                  {group.rows.map((row) => (
                    <li key={row.href} style={{ borderBottom: "1px solid var(--border)" }}>
                      <button
                        type="button"
                        onClick={() => onSelect(row.href)}
                        className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-[var(--surface-muted)]"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{row.primary}</p>
                          <p className="truncate text-sm text-ink-muted">{row.secondary}</p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </Paper>
      )}
    </div>
  );
}
