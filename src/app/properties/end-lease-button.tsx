"use client";

import { useTransition } from "react";
import { endLease } from "./lease-actions";

export function EndLeaseButton({
  id,
  propertyId,
}: {
  id: string;
  propertyId: string;
}) {
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!confirm("End this lease today?")) return;
    startTransition(() => endLease(id, propertyId));
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="btn btn-secondary"
    >
      {pending ? "Ending…" : "End lease"}
    </button>
  );
}
