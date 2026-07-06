"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Tooltip from "@mui/material/Tooltip";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { successButtonSx } from "@/components/success-button-sx";
import { actionButtonLabel } from "@/components/action-button-label";

// Shared delete button for a single record's detail page. `entity` is the
// lowercase noun ("property", "tenant") woven into the dialog and tooltip
// copy; `action` is the session-scoped server action that performs the delete
// and reports success/failure; `redirectTo` is where we navigate on success.
export function DeleteRecordButton({
  id,
  name,
  entity,
  action,
  redirectTo,
  blocked,
}: {
  id: string;
  name: string;
  entity: string;
  action: (id: string) => Promise<{ success: boolean; message: string }>;
  redirectTo: string;
  blocked?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);

  if (blocked) {
    return (
      <Tooltip
        title={`End the active or upcoming lease before deleting this ${entity}.`}
      >
        <span>
          <Button variant="outlined" color="error" disabled>
            Delete
          </Button>
        </span>
      </Tooltip>
    );
  }

  return (
    <>
      <ConfirmDialog
        title={`Delete ${entity}`}
        description={`Delete "${name}"? This cannot be undone.`}
        confirmLabel="Delete"
        pendingLabel="Deleting…"
        pending={pending}
        danger
        onConfirm={() =>
          startTransition(async () => {
            const result = await action(id);
            if (!result.success) {
              setError(result.message);
            } else {
              // Navigate away immediately: this button lives on the record's
              // detail page, and the server action triggers a re-render of the
              // current route. Delaying the push would flash the "not found"
              // screen while the now-deleted record re-renders.
              setDeleted(true);
              router.push(redirectTo);
            }
          })
        }
        trigger={(open) => (
          <Button
            variant="outlined"
            color="error"
            onClick={open}
            loading={pending}
            disabled={deleted}
            sx={deleted ? successButtonSx : undefined}
          >
            {actionButtonLabel(deleted, pending, {
              done: "Deleted",
              pending: "Deleting…",
              idle: "Delete",
            })}
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
