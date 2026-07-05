import Link from "next/link";
import { createProperty } from "../actions";
import { PropertyForm } from "../property-form";

export const metadata = { title: "New property · Property CRM" };

export default function NewPropertyPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/properties" className="text-sm text-ink-muted hover:text-ink">
        ← Back to properties
      </Link>
      <h1 className="mb-6 mt-3 text-3xl font-semibold tracking-tight">
        New property
      </h1>
      <PropertyForm
        action={createProperty}
        submitLabel="Create property"
        cancelHref="/"
        successHref="/properties"
      />
    </div>
  );
}
