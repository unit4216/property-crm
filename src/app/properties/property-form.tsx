"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { Property } from "@/db/schema";
import {
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
  type FormState,
} from "@/lib/validation";

type Action = (
  prevState: FormState,
  formData: FormData,
) => Promise<FormState>;

const initialState: FormState = { ok: false };

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <Paper component="section" variant="outlined" sx={{ p: 3 }}>
      <Stack spacing={2.5}>
        <Typography
          variant="overline"
          sx={{ color: "var(--ink-muted)", lineHeight: 1 }}
        >
          {title}
          {hint && (
            <Typography
              component="span"
              variant="caption"
              sx={{ ml: 1, color: "var(--ink-faint)", textTransform: "none" }}
            >
              {hint}
            </Typography>
          )}
        </Typography>
        {children}
      </Stack>
    </Paper>
  );
}

export function PropertyForm({
  action,
  property,
  submitLabel,
  cancelHref,
}: {
  action: Action;
  property?: Property;
  submitLabel: string;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const errors = state.fieldErrors ?? {};
  const values = (state.values ?? {}) as Record<string, string>;

  // React resets a native form action's inputs once the action settles, on
  // both success and failure. Remounting the fields via `key` whenever we get
  // a fresh state restores whatever the user submitted (echoed back through
  // `state.values`) instead of leaving them blank next to the error text.
  const [prevState, setPrevState] = useState(state);
  const [formKey, setFormKey] = useState(0);
  if (state !== prevState) {
    setPrevState(state);
    setFormKey((k) => k + 1);
  }

  return (
    <form key={formKey} action={formAction}>
      <Stack spacing={2.5}>
        {state.message && !state.ok && (
          <Alert severity="error">{state.message}</Alert>
        )}

        <Section title="Details">
          <TextField
            id="name"
            name="name"
            label="Name"
            defaultValue={values.name ?? property?.name ?? ""}
            placeholder="e.g. Maple Street Duplex"
            error={!!errors.name}
            helperText={errors.name?.[0]}
            fullWidth
          />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              id="type"
              name="type"
              label="Type"
              select
              defaultValue={values.type ?? property?.type ?? "single_family"}
              error={!!errors.type}
              helperText={errors.type?.[0]}
              fullWidth
            >
              {Object.entries(PROPERTY_TYPES).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              id="status"
              name="status"
              label="Status"
              select
              defaultValue={values.status ?? property?.status ?? "active"}
              error={!!errors.status}
              helperText={errors.status?.[0]}
              fullWidth
            >
              {Object.entries(PROPERTY_STATUSES).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </Section>

        <Section title="Address">
          <TextField
            id="addressLine1"
            name="addressLine1"
            label="Street address"
            defaultValue={values.addressLine1 ?? property?.addressLine1 ?? ""}
            placeholder="123 Maple St"
            error={!!errors.addressLine1}
            helperText={errors.addressLine1?.[0]}
            fullWidth
          />
          <TextField
            id="addressLine2"
            name="addressLine2"
            label="Unit / Apt (optional)"
            defaultValue={values.addressLine2 ?? property?.addressLine2 ?? ""}
            placeholder="Unit 2"
            error={!!errors.addressLine2}
            helperText={errors.addressLine2?.[0]}
            fullWidth
          />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              id="city"
              name="city"
              label="City"
              defaultValue={values.city ?? property?.city ?? ""}
              error={!!errors.city}
              helperText={errors.city?.[0]}
              fullWidth
              sx={{ flex: 3 }}
            />
            <TextField
              id="state"
              name="state"
              label="State"
              defaultValue={values.state ?? property?.state ?? ""}
              placeholder="CA"
              error={!!errors.state}
              helperText={errors.state?.[0]}
              fullWidth
              sx={{ flex: 1 }}
            />
            <TextField
              id="zip"
              name="zip"
              label="ZIP"
              defaultValue={values.zip ?? property?.zip ?? ""}
              error={!!errors.zip}
              helperText={errors.zip?.[0]}
              fullWidth
              sx={{ flex: 2 }}
            />
          </Stack>
        </Section>

        <Section title="Specs & rent" hint="(optional)">
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              id="bedrooms"
              name="bedrooms"
              label="Beds"
              type="number"
              slotProps={{ htmlInput: { min: 0 } }}
              defaultValue={values.bedrooms ?? property?.bedrooms ?? ""}
              error={!!errors.bedrooms}
              helperText={errors.bedrooms?.[0]}
              fullWidth
            />
            <TextField
              id="bathrooms"
              name="bathrooms"
              label="Baths"
              type="number"
              slotProps={{ htmlInput: { min: 0, step: 0.5 } }}
              defaultValue={values.bathrooms ?? property?.bathrooms ?? ""}
              error={!!errors.bathrooms}
              helperText={errors.bathrooms?.[0]}
              fullWidth
            />
            <TextField
              id="squareFeet"
              name="squareFeet"
              label="Sq ft"
              type="number"
              slotProps={{ htmlInput: { min: 0 } }}
              defaultValue={values.squareFeet ?? property?.squareFeet ?? ""}
              error={!!errors.squareFeet}
              helperText={errors.squareFeet?.[0]}
              fullWidth
            />
            <TextField
              id="rentAmount"
              name="rentAmount"
              label="Rent / mo"
              type="number"
              slotProps={{ htmlInput: { min: 0, step: 1 } }}
              defaultValue={values.rentAmount ?? property?.rentAmount ?? ""}
              error={!!errors.rentAmount}
              helperText={errors.rentAmount?.[0]}
              fullWidth
            />
          </Stack>
          <TextField
            id="notes"
            name="notes"
            label="Notes"
            multiline
            rows={3}
            defaultValue={values.notes ?? property?.notes ?? ""}
            error={!!errors.notes}
            helperText={errors.notes?.[0]}
            fullWidth
          />
        </Section>

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
