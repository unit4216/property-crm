"use client";

import { useTransition } from "react";
import Button from "@mui/material/Button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { deleteProperty } from "./actions";

export function DeleteButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <ConfirmDialog
      title="Delete property"
      description={`Delete "${name}"? This cannot be undone.`}
      confirmLabel="Delete"
      pendingLabel="Deleting…"
      pending={pending}
      danger
      onConfirm={() => startTransition(() => deleteProperty(id))}
      trigger={(open) => (
        <Button variant="outlined" color="error" onClick={open} loading={pending}>
          {pending ? "Deleting…" : "Delete"}
        </Button>
      )}
    />
  );
}
