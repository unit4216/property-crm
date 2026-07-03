import Link from "next/link";
import { createProperty } from "../actions";
import { PropertyForm } from "../property-form";

export const metadata = { title: "New property · Property CRM" };

export default function NewPropertyPage() {
  return (
    <div>
      <Link
        href="/"
        className="text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        ← Back to properties
      </Link>
      <h1 className="mt-2 mb-6 text-2xl font-semibold tracking-tight">
        New property
      </h1>
      <PropertyForm
        action={createProperty}
        submitLabel="Create property"
        cancelHref="/"
      />
    </div>
  );
}
