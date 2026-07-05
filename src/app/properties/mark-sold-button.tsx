"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Tooltip from "@mui/material/Tooltip";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { markPropertySold, markPropertyActive } from "./actions";

// Toggles a property between "active" and "sold". Selling is guarded — both in
// the server action and here — behind having no active or upcoming lease, so
// the button is disabled with an explanation when one is open.
export function MarkSoldButton({
  id,
  status,
  blocked,
}: {
  id: string;
  status: "active" | "sold";
  blocked?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (status === "sold") {
    return (
      <>
        <ConfirmDialog
          title="Mark as active"
          description="Return this property to the active portfolio?"
          confirmLabel="Mark as active"
          pendingLabel="Updating…"
          pending={pending}
          onConfirm={() =>
            startTransition(async () => {
              const result = await markPropertyActive(id);
              if ("error" in result) setError(result.error);
              else router.refresh();
            })
          }
          trigger={(open) => (
            <Button variant="outlined" onClick={open} loading={pending}>
              Mark as active
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

  if (blocked) {
    return (
      <Tooltip title="End the active or upcoming lease before marking this property sold.">
        <span>
          <Button variant="outlined" disabled>
            Mark as sold
          </Button>
        </span>
      </Tooltip>
    );
  }

  return (
    <>
      <ConfirmDialog
        title="Mark as sold"
        description="Mark this property as sold? It will leave the active portfolio."
        confirmLabel="Mark as sold"
        pendingLabel="Updating…"
        pending={pending}
        onConfirm={() =>
          startTransition(async () => {
            const result = await markPropertySold(id);
            if ("error" in result) setError(result.error);
            else router.refresh();
          })
        }
        trigger={(open) => (
          <Button variant="outlined" onClick={open} loading={pending}>
            Mark as sold
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
