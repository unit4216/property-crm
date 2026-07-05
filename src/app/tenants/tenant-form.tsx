"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import type { Tenant } from "@/db/schema";
import { successButtonSx } from "@/components/success-button-sx";
import { CheckIcon } from "@/components/check-icon";
import type { FormState } from "@/lib/validation";

type Action = (
  prevState: FormState,
  formData: FormData,
) => Promise<FormState>;

const initialState: FormState = { ok: false };

export function TenantForm({
  action,
  tenant,
  submitLabel,
  cancelHref,
  successHref,
}: {
  action: Action;
  tenant?: Tenant;
  submitLabel: string;
  cancelHref: string;
  successHref: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, initialState);
  const errors = state.fieldErrors ?? {};
  const values = (state.values ?? {}) as Record<string, string>;

  // React resets a native form action's inputs once the action settles, on
  // both success and failure. Remounting the fields via `key` whenever we get
  // a fresh state restores whatever the user submitted (echoed back through
  // `state.values`) instead of leaving them blank next to the error text. On
  // success we're about to navigate away, so there's no need to remount.
  const [prevState, setPrevState] = useState(state);
  const [formKey, setFormKey] = useState(0);
  if (state !== prevState) {
    setPrevState(state);
    if (!state.ok) setFormKey((k) => k + 1);
  }

  // Briefly show a "Saved" state on the button before navigating away, so
  // the success is visible instead of the page just instantly changing.
  const saved = state.ok;
  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => router.push(successHref), 700);
    return () => clearTimeout(timer);
  }, [saved, router, successHref]);

  return (
    <form key={formKey} action={formAction}>
      <Stack spacing={2.5}>
        {state.message && !state.ok && (
          <Alert severity="error">{state.message}</Alert>
        )}

        <Paper component="section" variant="outlined" sx={{ p: 3 }}>
          <Stack spacing={2.5}>
            <TextField
              id="name"
              name="name"
              label="Name"
              defaultValue={values.name ?? tenant?.name ?? ""}
              placeholder="e.g. Jordan Rivera"
              error={!!errors.name}
              helperText={errors.name?.[0]}
              fullWidth
            />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                id="email"
                name="email"
                label="Email"
                type="email"
                defaultValue={values.email ?? tenant?.email ?? ""}
                placeholder="jordan@example.com"
                error={!!errors.email}
                helperText={errors.email?.[0] ?? "Email or phone required"}
                fullWidth
              />
              <TextField
                id="phone"
                name="phone"
                label="Phone"
                defaultValue={values.phone ?? tenant?.phone ?? ""}
                placeholder="(555) 123-4567"
                error={!!errors.phone}
                helperText={errors.phone?.[0] ?? "Email or phone required"}
                fullWidth
              />
            </Stack>

            <TextField
              id="notes"
              name="notes"
              label="Notes (optional)"
              multiline
              rows={3}
              defaultValue={values.notes ?? tenant?.notes ?? ""}
              error={!!errors.notes}
              helperText={errors.notes?.[0]}
              fullWidth
            />
          </Stack>
        </Paper>

        <Stack direction="row" spacing={1.5}>
          <Button
            type="submit"
            variant="contained"
            loading={pending}
            disabled={saved}
            sx={saved ? successButtonSx : undefined}
            startIcon={saved ? <CheckIcon /> : undefined}
          >
            {saved ? "Saved" : pending ? "Saving…" : submitLabel}
          </Button>
          <Button variant="outlined" component={Link} href={cancelHref}>
            Cancel
          </Button>
        </Stack>
      </Stack>
    </form>
  );
}
