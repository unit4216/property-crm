"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { Tenant } from "@/db/schema";
import { LEASE_STATUSES, type FormState } from "@/lib/validation";

type Action = (
  prevState: FormState,
  formData: FormData,
) => Promise<FormState>;

const initialState: FormState = { ok: false };

const labelClass = "mb-1 block text-sm font-medium text-ink";

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="mt-1 text-xs text-red-600">{errors[0]}</p>;
}

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
    <form action={formAction} className="space-y-5">
      {state.message && !state.ok && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}
        </div>
      )}

      <section className="space-y-4 rounded-md border border-border bg-surface p-6">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Tenants
        </h2>
        <div className="space-y-2">
          {tenants.map((t) => (
            <label
              key={t.id}
              className="flex items-center gap-2.5 text-sm text-ink"
            >
              <input
                type="checkbox"
                name="tenantIds"
                value={t.id}
                className="size-4 rounded border-border-strong"
              />
              {t.name}
              {t.email && (
                <span className="text-ink-faint">· {t.email}</span>
              )}
            </label>
          ))}
        </div>
        <FieldError errors={errors.tenantIds} />
      </section>

      <section className="space-y-4 rounded-md border border-border bg-surface p-6">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Terms
        </h2>

        <div>
          <label htmlFor="status" className={labelClass}>
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue="active"
            className="field"
          >
            {Object.entries(LEASE_STATUSES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <FieldError errors={errors.status} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="startDate" className={labelClass}>
              Start date
            </label>
            <input
              id="startDate"
              name="startDate"
              type="date"
              className="field"
            />
            <FieldError errors={errors.startDate} />
          </div>
          <div>
            <label htmlFor="endDate" className={labelClass}>
              End date <span className="text-ink-faint">(optional)</span>
            </label>
            <input id="endDate" name="endDate" type="date" className="field" />
            <FieldError errors={errors.endDate} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="rentAmount" className={labelClass}>
              Rent / mo
            </label>
            <input
              id="rentAmount"
              name="rentAmount"
              type="number"
              min="0"
              step="1"
              className="field"
            />
            <FieldError errors={errors.rentAmount} />
          </div>
          <div>
            <label htmlFor="depositAmount" className={labelClass}>
              Deposit
            </label>
            <input
              id="depositAmount"
              name="depositAmount"
              type="number"
              min="0"
              step="1"
              className="field"
            />
            <FieldError errors={errors.depositAmount} />
          </div>
        </div>

        <div>
          <label htmlFor="notes" className={labelClass}>
            Notes <span className="text-ink-faint">(optional)</span>
          </label>
          <textarea id="notes" name="notes" rows={3} className="field" />
          <FieldError errors={errors.notes} />
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Saving…" : "Start lease"}
        </button>
        <Link href={cancelHref} className="btn btn-secondary">
          Cancel
        </Link>
      </div>
    </form>
  );
}
