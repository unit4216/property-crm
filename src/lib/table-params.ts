// Shared contract for server-side search / sort / pagination across the list
// pages. The query string is the single source of truth:
//   ?q=<search>&sort=<column>&dir=<asc|desc>&page=<1-based>
// Parsed on the server to drive the DB query; rebuilt into links by the table
// header (sort) and pagination controls.

export const PAGE_SIZE = 10;

export type SortDir = "asc" | "desc";

// Raw searchParams as handed to a page (a plain object, values may repeat).
export type RawSearchParams = Record<string, string | string[] | undefined>;

export type TableParams = {
  q: string;
  type: string;
  status: string;
  sort: string;
  dir: SortDir;
  page: number; // 1-based
  pageSize: number;
  offset: number;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

// Normalizes untrusted query params into a safe, bounded shape. `sort` is
// whitelisted against the caller's known columns so it can be mapped straight
// to a DB column without risk.
export function parseTableParams(
  searchParams: RawSearchParams,
  opts: {
    sortKeys: readonly string[];
    defaultSort: string;
    defaultDir?: SortDir;
    pageSize?: number;
    typeKeys?: readonly string[];
    statusKeys?: readonly string[];
    defaultStatus?: string;
  },
): TableParams {
  const q = (first(searchParams.q) ?? "").trim();

  const rawType = first(searchParams.type);
  const type = rawType && opts.typeKeys?.includes(rawType) ? rawType : "";

  // Whitelisted against the caller's known values, falling back to the caller's
  // default (e.g. "active") rather than "all" when the param is absent/invalid.
  const rawStatus = first(searchParams.status);
  const status =
    rawStatus && opts.statusKeys?.includes(rawStatus)
      ? rawStatus
      : (opts.defaultStatus ?? "");

  const rawSort = first(searchParams.sort);
  const sort =
    rawSort && opts.sortKeys.includes(rawSort) ? rawSort : opts.defaultSort;

  const rawDir = first(searchParams.dir);
  const dir: SortDir =
    rawDir === "asc" || rawDir === "desc" ? rawDir : (opts.defaultDir ?? "asc");

  const pageSize = opts.pageSize ?? PAGE_SIZE;
  const parsedPage = Number.parseInt(first(searchParams.page) ?? "1", 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  return {
    q,
    type,
    status,
    sort,
    dir,
    page,
    pageSize,
    offset: (page - 1) * pageSize,
  };
}

// Builds a query string from the current params plus a patch. A `null`/`""`
// patch value removes the key; everything else is coerced to a string. Used to
// generate sort/pagination links that preserve the rest of the URL state.
export function buildQuery(
  base: RawSearchParams,
  patch: Record<string, string | number | null | undefined>,
): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(base)) {
    const v = first(value);
    if (v != null && v !== "") params.set(key, v);
  }

  for (const [key, value] of Object.entries(patch)) {
    if (value == null || value === "") params.delete(key);
    else params.set(key, String(value));
  }

  const qs = params.toString();
  return qs ? `?${qs}` : "";
}
