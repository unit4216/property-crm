import Link from "next/link";

export default function NotFound() {
  return (
    <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
      <h1 className="text-lg font-semibold">Property not found</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        It may have been deleted.
      </p>
      <Link
        href="/"
        className="mt-4 inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        Back to properties
      </Link>
    </div>
  );
}
