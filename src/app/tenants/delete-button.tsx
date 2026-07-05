"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Tooltip from "@mui/material/Tooltip";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { successButtonSx } from "@/components/success-button-sx";
import { deleteTenant } from "./actions";

export function DeleteTenantButton({
  id,
  name,
  blocked,
}: {
  id: string;
  name: string;
  blocked?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);

  if (blocked) {
    return (
      <Tooltip title="End the active lease before deleting this tenant.">
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
        title="Delete tenant"
        description={`Delete "${name}"? This cannot be undone.`}
        confirmLabel="Delete"
        pendingLabel="Deleting…"
        pending={pending}
        danger
        onConfirm={() =>
          startTransition(async () => {
            const result = await deleteTenant(id);
            if ("error" in result) {
              setError(result.error);
            } else {
              setDeleted(true);
              setTimeout(() => router.push("/tenants"), 700);
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
            {deleted ? "Deleted" : pending ? "Deleting…" : "Delete"}
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
