"use client";

import { useActionState } from "react";
import Link from "next/link";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import FormHelperText from "@mui/material/FormHelperText";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { Tenant } from "@/db/schema";
import { LEASE_STATUSES, type FormState } from "@/lib/validation";

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

  return (
    <form action={formAction}>
      <Stack spacing={2.5}>
        {state.message && !state.ok && (
          <Alert severity="error">{state.message}</Alert>
        )}

        <Paper component="section" variant="outlined" sx={{ p: 3 }}>
          <Stack spacing={1.5}>
            <Typography variant="overline" sx={sectionTitleSx}>
              Tenants
            </Typography>
            <FormGroup>
              {tenants.map((t) => (
                <FormControlLabel
                  key={t.id}
                  control={<Checkbox name="tenantIds" value={t.id} />}
                  label={
                    <>
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
                    </>
                  }
                />
              ))}
            </FormGroup>
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
              defaultValue="active"
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
