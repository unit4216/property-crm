"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import Button from "@mui/material/Button";
import FormHelperText from "@mui/material/FormHelperText";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { Tenant } from "@/db/schema";
import { PlusIcon } from "@/components/plus-icon";
import { LEASE_STATUSES, type FormState } from "@/lib/validation";

type TenantRow = { key: number; tenantId: string | null };

type Action = (
  prevState: FormState,
  formData: FormData,
) => Promise<FormState>;

const initialState: FormState = { ok: false };

const sectionTitleSx = {
  color: "var(--ink-muted)",
  lineHeight: 1,
} as const;

export function LeaseForm({
  action,
  tenants,
  cancelHref,
}: {
  action: Action;
  tenants: Tenant[];
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

  const [tenantRows, setTenantRows] = useState<TenantRow[]>([
    { key: 0, tenantId: null },
  ]);
  const nextRowKey = useRef(1);
  const selectedTenantIds = tenantRows.map((row) => row.tenantId);

  function handleTenantChange(key: number, tenant: Tenant | null) {
    setTenantRows((prev) =>
      prev.map((row) =>
        row.key === key ? { ...row, tenantId: tenant?.id ?? null } : row,
      ),
    );
  }

  function handleAddTenantRow() {
    setTenantRows((prev) => [
      ...prev,
      { key: nextRowKey.current++, tenantId: null },
    ]);
  }

  function handleRemoveTenantRow(key: number) {
    setTenantRows((prev) => prev.filter((row) => row.key !== key));
  }

  return (
    <form key={formKey} action={formAction}>
      <Stack spacing={2.5}>
        {state.message && !state.ok && (
          <Alert severity="error">{state.message}</Alert>
        )}

        <Paper component="section" variant="outlined" sx={{ p: 3 }}>
          <Stack spacing={1.5}>
            <Typography variant="overline" sx={sectionTitleSx}>
              Tenants
            </Typography>
            <Stack spacing={1.5}>
              {tenantRows.map((row) => {
                const selectedTenant =
                  tenants.find((t) => t.id === row.tenantId) ?? null;
                const options = tenants.filter(
                  (t) =>
                    t.id === row.tenantId || !selectedTenantIds.includes(t.id),
                );
                return (
                  <Stack
                    key={row.key}
                    direction="row"
                    spacing={1}
                    sx={{ alignItems: "center" }}
                  >
                    <Autocomplete
                      sx={{ flex: 1 }}
                      options={options}
                      value={selectedTenant}
                      onChange={(_, tenant) =>
                        handleTenantChange(row.key, tenant)
                      }
                      getOptionLabel={(t) => t.name}
                      isOptionEqualToValue={(a, b) => a.id === b.id}
                      renderOption={({ key, ...props }, t) => (
                        <li key={t.id} {...props}>
                          {t.name}
                          {t.email && (
                            <Typography
                              component="span"
                              variant="body2"
                              sx={{ color: "var(--ink-faint)", ml: 0.5 }}
                            >
                              · {t.email}
                            </Typography>
                          )}
                        </li>
                      )}
                      renderInput={(params) => (
                        <TextField {...params} label="Tenant" />
                      )}
                    />
                    {row.tenantId && (
                      <input
                        type="hidden"
                        name="tenantIds"
                        value={row.tenantId}
                      />
                    )}
                    {tenantRows.length > 1 && (
                      <Button
                        type="button"
                        size="small"
                        onClick={() => handleRemoveTenantRow(row.key)}
                        aria-label="Remove tenant"
                      >
                        Remove
                      </Button>
                    )}
                  </Stack>
                );
              })}
              <Button
                type="button"
                variant="outlined"
                size="small"
                onClick={handleAddTenantRow}
                sx={{ alignSelf: "flex-start" }}
                startIcon={<PlusIcon />}
              >
                Add tenant
              </Button>
            </Stack>
            {errors.tenantIds?.[0] && (
              <FormHelperText error>{errors.tenantIds[0]}</FormHelperText>
            )}
          </Stack>
        </Paper>

        <Paper component="section" variant="outlined" sx={{ p: 3 }}>
          <Stack spacing={2.5}>
            <Typography variant="overline" sx={sectionTitleSx}>
              Terms
            </Typography>

            <TextField
              id="status"
              name="status"
              label="Status"
              select
              defaultValue={values.status ?? "active"}
              error={!!errors.status}
              helperText={errors.status?.[0]}
              fullWidth
            >
              {Object.entries(LEASE_STATUSES).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </TextField>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                id="startDate"
                name="startDate"
                label="Start date"
                type="date"
                defaultValue={values.startDate ?? ""}
                error={!!errors.startDate}
                helperText={errors.startDate?.[0]}
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
              />
              <TextField
                id="endDate"
                name="endDate"
                label="End date (optional)"
                type="date"
                defaultValue={values.endDate ?? ""}
                error={!!errors.endDate}
                helperText={errors.endDate?.[0]}
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
              />
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                id="rentAmount"
                name="rentAmount"
                label="Rent / mo"
                type="number"
                slotProps={{ htmlInput: { min: 0, step: 1 } }}
                defaultValue={values.rentAmount ?? ""}
                error={!!errors.rentAmount}
                helperText={errors.rentAmount?.[0]}
                fullWidth
              />
              <TextField
                id="depositAmount"
                name="depositAmount"
                label="Deposit"
                type="number"
                slotProps={{ htmlInput: { min: 0, step: 1 } }}
                defaultValue={values.depositAmount ?? ""}
                error={!!errors.depositAmount}
                helperText={errors.depositAmount?.[0]}
                fullWidth
              />
            </Stack>

            <TextField
              id="notes"
              name="notes"
              label="Notes (optional)"
              multiline
              rows={3}
              defaultValue={values.notes ?? ""}
              error={!!errors.notes}
              helperText={errors.notes?.[0]}
              fullWidth
            />
          </Stack>
        </Paper>

        <Stack direction="row" spacing={1.5}>
          <Button type="submit" variant="contained" loading={pending}>
            {pending ? "Saving…" : "Start lease"}
          </Button>
          <Button variant="outlined" component={Link} href={cancelHref}>
            Cancel
          </Button>
        </Stack>
      </Stack>
    </form>
  );
}
