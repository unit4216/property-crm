import Link from "next/link";
import Button from "@mui/material/Button";
import { buildQuery, type RawSearchParams } from "@/lib/table-params";

// Prev/Next pager driven by the URL. Rendered on the server as links so it
// works without client JS; disabled ends render as plain (non-link) buttons.
export function Pagination({
  page,
  pageSize,
  total,
  searchParams,
  noun = "result",
  nounPlural = `${noun}s`,
}: {
  page: number;
  pageSize: number;
  total: number;
  searchParams: RawSearchParams;
  noun?: string;
  nounPlural?: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  // Clamp: a stale ?page= past the end still reports sensibly.
  const current = Math.min(page, totalPages);
  const hasPrev = current > 1;
  const hasNext = current < totalPages;

  const word = total === 1 ? noun : nounPlural;
  const label =
    total === 0
      ? `No ${nounPlural}`
      : `Page ${current} of ${totalPages} · ${total} ${word}`;

  return (
    <div className="mt-3 flex items-center justify-between gap-4">
      <p className="text-sm text-ink-muted">{label}</p>
      <div className="flex items-center gap-2">
        <PagerButton
          href={buildQuery(searchParams, { page: current - 1 })}
          disabled={!hasPrev}
        >
          Previous
        </PagerButton>
        <PagerButton
          href={buildQuery(searchParams, { page: current + 1 })}
          disabled={!hasNext}
        >
          Next
        </PagerButton>
      </div>
    </div>
  );
}

function PagerButton({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <Button variant="outlined" size="small" disabled>
        {children}
      </Button>
    );
  }
  return (
    <Link href={href}>
      <Button variant="outlined" size="small" component="span">
        {children}
      </Button>
    </Link>
  );
}
