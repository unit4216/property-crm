"use client";

import { useTransition } from "react";
import { deleteProperty } from "./actions";

export function DeleteButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    startTransition(() => deleteProperty(id));
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="btn btn-danger"
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
