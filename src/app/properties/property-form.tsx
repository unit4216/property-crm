"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import Button from "@mui/material/Button";
import FormHelperText from "@mui/material/FormHelperText";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { Property, Unit } from "@/db/schema";
import { successButtonSx } from "@/components/success-button-sx";
import { actionButtonLabel } from "@/components/action-button-label";
import { CheckIcon } from "@/components/check-icon";
import { PlusIcon } from "@/components/plus-icon";
import {
  PROPERTY_TYPES,
  US_STATES,
  type FormState,
} from "@/lib/validation";

type UnitRowState = { key: number; id: string | null; label: string };

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
  units,
  submitLabel,
  cancelHref,
  successHref,
}: {
  action: Action;
  property?: Property;
  units?: Unit[];
  submitLabel: string;
  cancelHref: string;
  successHref: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, initialState);
  const errors = state.fieldErrors ?? {};
  const values = (state.values ?? {}) as Record<string, string>;

  // Units are edited inline as a repeatable list. Kept in component state (not
  // as uncontrolled inputs) so they survive the form's remount-on-error and
  // are submitted as parallel `unitId` / `unitLabel` fields.
  const [unitRows, setUnitRows] = useState<UnitRowState[]>(() =>
    units && units.length > 0
      ? units.map((u, i) => ({ key: i, id: u.id, label: u.label }))
      : [{ key: 0, id: null, label: "" }],
  );
  const nextUnitKey = useRef(units && units.length > 0 ? units.length : 1);

  // State is picked from an autocomplete, so it's controlled and submitted via a
  // hidden `state` input carrying the two-letter code. The form remounts (via
  // `formKey`) on a failed submit, re-running this initializer with the echoed
  // `state.values`, so the selection survives an error the same way the native
  // fields do.
  const [stateCode, setStateCode] = useState<string>(
    () => values.state ?? property?.state ?? "",
  );
  const selectedState = US_STATES.find((s) => s.code === stateCode) ?? null;

  function handleUnitLabelChange(key: number, label: string) {
    setUnitRows((prev) =>
      prev.map((row) => (row.key === key ? { ...row, label } : row)),
    );
  }

  function handleAddUnitRow() {
    setUnitRows((prev) => [
      ...prev,
      { key: nextUnitKey.current++, id: null, label: "" },
    ]);
  }

  function handleRemoveUnitRow(key: number) {
    setUnitRows((prev) => prev.filter((row) => row.key !== key));
  }

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
            <Autocomplete
              options={US_STATES}
              value={selectedState}
              onChange={(_, option) => setStateCode(option?.code ?? "")}
              getOptionLabel={(s) => s.code}
              isOptionEqualToValue={(a, b) => a.code === b.code}
              fullWidth
              sx={{ flex: 1 }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="State"
                  error={!!errors.state}
                  helperText={errors.state?.[0]}
                />
              )}
            />
            <input type="hidden" name="state" value={stateCode} />
            <TextField
              id="zip"
              name="zip"
              label="ZIP"
              defaultValue={values.zip ?? property?.zip ?? ""}
              placeholder="94103"
              error={!!errors.zip}
              helperText={errors.zip?.[0]}
              slotProps={{
                htmlInput: { inputMode: "numeric", maxLength: 5 },
              }}
              fullWidth
              sx={{ flex: 2 }}
            />
          </Stack>
        </Section>

        <Section
          title="Units"
          hint="every property has at least one leasable unit"
        >
          <Stack spacing={1.5}>
            {unitRows.map((row) => (
              <Stack
                key={row.key}
                direction="row"
                spacing={1}
                sx={{ alignItems: "center" }}
              >
                <input type="hidden" name="unitId" value={row.id ?? ""} />
                <TextField
                  name="unitLabel"
                  label="Unit name"
                  value={row.label}
                  onChange={(e) =>
                    handleUnitLabelChange(row.key, e.target.value)
                  }
                  placeholder="e.g. Unit A"
                  fullWidth
                />
                {unitRows.length > 1 && (
                  <Button
                    type="button"
                    size="small"
                    onClick={() => handleRemoveUnitRow(row.key)}
                    aria-label="Remove unit"
                  >
                    Remove
                  </Button>
                )}
              </Stack>
            ))}
            <Button
              type="button"
              variant="outlined"
              size="small"
              onClick={handleAddUnitRow}
              sx={{ alignSelf: "flex-start" }}
              startIcon={<PlusIcon />}
            >
              Add unit
            </Button>
          </Stack>
          {errors.units?.[0] && (
            <FormHelperText error>{errors.units[0]}</FormHelperText>
          )}
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
          <Button
            type="submit"
            variant="contained"
            loading={pending}
            disabled={saved}
            sx={saved ? successButtonSx : undefined}
            startIcon={saved ? <CheckIcon /> : undefined}
          >
            {actionButtonLabel(saved, pending, {
              done: "Saved",
              pending: "Saving…",
              idle: submitLabel,
            })}
          </Button>
          <Button variant="outlined" component={Link} href={cancelHref}>
            Cancel
          </Button>
        </Stack>
      </Stack>
    </form>
  );
}
