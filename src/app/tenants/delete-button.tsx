"use client";

import { useTransition } from "react";
import Button from "@mui/material/Button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { deleteTenant } from "./actions";

export function DeleteTenantButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <ConfirmDialog
      title="Delete tenant"
      description={`Delete "${name}"? This cannot be undone.`}
      confirmLabel="Delete"
      pendingLabel="Deleting…"
      pending={pending}
      danger
      onConfirm={() => startTransition(() => deleteTenant(id))}
      trigger={(open) => (
        <Button variant="outlined" color="error" onClick={open} loading={pending}>
          {pending ? "Deleting…" : "Delete"}
        </Button>
      )}
    />
  );
}
