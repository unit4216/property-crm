"use client";

import { useTransition } from "react";
import Button from "@mui/material/Button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { endLease } from "./lease-actions";

export function EndLeaseButton({
  id,
  propertyId,
}: {
  id: string;
  propertyId: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <ConfirmDialog
      title="End lease"
      description="End this lease today?"
      confirmLabel="End lease"
      pendingLabel="Ending…"
      pending={pending}
      onConfirm={() => startTransition(() => endLease(id, propertyId))}
      trigger={(open) => (
        <Button variant="outlined" onClick={open} loading={pending}>
          {pending ? "Ending…" : "End lease"}
        </Button>
      )}
    />
  );
}
