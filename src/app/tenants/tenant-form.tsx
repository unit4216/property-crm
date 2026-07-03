"use client";

import { useActionState } from "react";
import Link from "next/link";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import type { Tenant } from "@/db/schema";
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
}: {
  action: Action;
  tenant?: Tenant;
  submitLabel: string;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction}>
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
              defaultValue={tenant?.name ?? ""}
              placeholder="e.g. Jordan Rivera"
              error={!!errors.name}
              helperText={errors.name?.[0]}
              fullWidth
            />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                id="email"
                name="email"
                label="Email (optional)"
                type="email"
                defaultValue={tenant?.email ?? ""}
                placeholder="jordan@example.com"
                error={!!errors.email}
                helperText={errors.email?.[0]}
                fullWidth
              />
              <TextField
                id="phone"
                name="phone"
                label="Phone (optional)"
                defaultValue={tenant?.phone ?? ""}
                placeholder="(555) 123-4567"
                error={!!errors.phone}
                helperText={errors.phone?.[0]}
                fullWidth
              />
            </Stack>

            <TextField
              id="notes"
              name="notes"
              label="Notes (optional)"
              multiline
              rows={3}
              defaultValue={tenant?.notes ?? ""}
              error={!!errors.notes}
              helperText={errors.notes?.[0]}
              fullWidth
            />
          </Stack>
        </Paper>

        <Stack direction="row" spacing={1.5}>
          <Button type="submit" variant="contained" loading={pending}>
            {pending ? "Saving…" : submitLabel}
          </Button>
          <Button variant="outlined" component={Link} href={cancelHref}>
            Cancel
          </Button>
        </Stack>
      </Stack>
    </form>
  );
}
