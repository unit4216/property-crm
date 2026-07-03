import Link from "next/link";

export default function NotFound() {
  return (
    <div className="rounded-md border border-dashed border-border-strong bg-surface p-12 text-center">
      <h1 className="text-lg font-semibold">Tenant not found</h1>
      <p className="mt-1 text-sm text-ink-muted">It may have been deleted.</p>
      <Link href="/tenants" className="btn btn-primary mt-4 inline-flex">
        Back to tenants
      </Link>
    </div>
  );
}
