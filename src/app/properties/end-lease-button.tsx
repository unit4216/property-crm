"use client";

import { useState, useTransition } from "react";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
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
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <ConfirmDialog
        title="End lease"
        description="End this lease today?"
        confirmLabel="End lease"
        pendingLabel="Ending…"
        pending={pending}
        onConfirm={() =>
          startTransition(async () => {
            const result = await endLease(id, propertyId);
            if (result?.error) setError(result.error);
          })
        }
        trigger={(open) => (
          <Button variant="outlined" onClick={open} loading={pending}>
            {pending ? "Ending…" : "End lease"}
          </Button>
        )}
      />
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}
    </>
  );
}
