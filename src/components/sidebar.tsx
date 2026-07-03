"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-canvas">
      <div className="px-5 py-5">
        <Link href="/" className="flex items-center" aria-label="Property CRM">
          <LogoMark />
        </Link>
      </div>

      <nav className="flex-1 px-3">
        <p className="px-2 pb-1 pt-2 text-xs font-medium uppercase tracking-wide text-ink-faint">
          Portfolio
        </p>
        {nav.map(({ href, label, icon: Icon, match }) => {
          const active = match.test(pathname);
          return (
            <Link
              key={href}
              href={href}
              className={`mt-0.5 flex items-center gap-2.5 rounded px-2 py-1.5 text-sm transition-colors ${
                active
                  ? "bg-white font-medium text-ink shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-border"
                  : "text-ink-muted hover:bg-white/60 hover:text-ink"
              }`}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3">
        <Link
          href="/properties/new"
          className="flex items-center justify-center gap-1.5 rounded border border-border-strong bg-surface px-2 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-surface-muted"
        >
          <PlusIcon className="size-4" />
          New property
        </Link>
      </div>
    </aside>
  );
}
