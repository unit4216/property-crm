import type { ReactNode } from "react";
import Link from "next/link";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Stack from "@mui/material/Stack";
import {
  buildQuery,
  type RawSearchParams,
  type SortDir,
} from "@/lib/table-params";

export type Column<T> = {
  // Matches the sort key handled by the query layer, and used as the React key.
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  sortable?: boolean;
  align?: "left" | "right";
  // Hide the column below this breakpoint to keep narrow screens readable.
  hideBelow?: "sm" | "md";
};

function hideSx(hideBelow?: "sm" | "md") {
  return hideBelow ? { display: { xs: "none", [hideBelow]: "table-cell" } } : undefined;
}

function SortArrow({ dir }: { dir: SortDir }) {
  return (
    <span aria-hidden className="text-ink-faint">
      {dir === "asc" ? "↑" : "↓"}
    </span>
  );
}

// Renders a sortable header as a plain link that flips direction (or starts at
// ascending). No client JS — the link just rewrites the query string.
function SortableHeader<T>({
  column,
  searchParams,
  sort,
  dir,
}: {
  column: Column<T>;
  searchParams: RawSearchParams;
  sort: string;
  dir: SortDir;
}) {
  const active = sort === column.key;
  const nextDir: SortDir = active && dir === "asc" ? "desc" : "asc";
  const href = buildQuery(searchParams, {
    sort: column.key,
    dir: nextDir,
    page: null, // a new sort order returns you to the first page
  });

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 hover:text-ink"
      aria-label={`Sort by ${column.key}`}
    >
      {column.header}
      {active ? <SortArrow dir={dir} /> : null}
    </Link>
  );
}

// A generic table wired to the URL-based sort contract. Cell content stays the
// caller's responsibility via `render`; the table owns layout, sortable
// headers, and the empty state.
export function DataTable<T extends { id: string }>({
  columns,
  rows,
  sort,
  dir,
  searchParams,
  empty,
}: {
  columns: Column<T>[];
  rows: T[];
  sort: string;
  dir: SortDir;
  searchParams: RawSearchParams;
  empty: ReactNode;
}) {
  return (
    <Stack sx={{ bgcolor: "var(--surface)", overflowX: "auto" }}>
      <Table>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell
                key={column.key}
                align={column.align}
                sx={hideSx(column.hideBelow)}
              >
                {column.sortable ? (
                  <SortableHeader
                    column={column}
                    searchParams={searchParams}
                    sort={sort}
                    dir={dir}
                  />
                ) : (
                  column.header
                )}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                sx={{ py: 6, textAlign: "center", color: "var(--ink-muted)" }}
              >
                {empty}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id} hover sx={{ position: "relative" }}>
                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    align={column.align}
                    sx={hideSx(column.hideBelow)}
                  >
                    {column.render(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Stack>
  );
}

// Trailing affordance for rows that navigate on click. Shared so the list
// pages don't each redefine it.
export function RowChevron() {
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
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
