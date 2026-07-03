"use client";

import { useTransition } from "react";
import { deleteTenant } from "./actions";

export function DeleteTenantButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    startTransition(() => deleteTenant(id));
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
