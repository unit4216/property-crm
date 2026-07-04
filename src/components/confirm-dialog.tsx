"use client";

import { useState } from "react";
import Button from "@mui/material/Button";
import { Modal } from "@/components/modal";

export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel,
  pendingLabel,
  pending,
  danger,
  onConfirm,
}: {
  trigger: (open: () => void) => React.ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  pendingLabel: string;
  pending: boolean;
  danger?: boolean;
  onConfirm: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {trigger(() => setOpen(true))}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        description={description}
        actions={
          <>
            <Button variant="outlined" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="outlined"
              color={danger ? "error" : "primary"}
              loading={pending}
              onClick={() => {
                setOpen(false);
                onConfirm();
              }}
            >
              {pending ? pendingLabel : confirmLabel}
            </Button>
          </>
        }
      />
    </>
  );
}
