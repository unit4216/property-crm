"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { Tenant } from "@/db/schema";
import type { FormState } from "@/lib/validation";

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
    <form action={formAction} className="space-y-5">
      {state.message && !state.ok && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}
        </div>
      )}

      <section className="space-y-4 rounded-md border border-border bg-surface p-6">
        <div>
          <label htmlFor="name" className={labelClass}>
            Name
          </label>
          <input
            id="name"
            name="name"
            defaultValue={tenant?.name ?? ""}
            placeholder="e.g. Jordan Rivera"
            className="field"
          />
          <FieldError errors={errors.name} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="email" className={labelClass}>
              Email <span className="text-ink-faint">(optional)</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue={tenant?.email ?? ""}
              placeholder="jordan@example.com"
              className="field"
            />
            <FieldError errors={errors.email} />
          </div>
          <div>
            <label htmlFor="phone" className={labelClass}>
              Phone <span className="text-ink-faint">(optional)</span>
            </label>
            <input
              id="phone"
              name="phone"
              defaultValue={tenant?.phone ?? ""}
              placeholder="(555) 123-4567"
              className="field"
            />
            <FieldError errors={errors.phone} />
          </div>
        </div>

        <div>
          <label htmlFor="notes" className={labelClass}>
            Notes <span className="text-ink-faint">(optional)</span>
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            defaultValue={tenant?.notes ?? ""}
            className="field"
          />
          <FieldError errors={errors.notes} />
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Saving…" : submitLabel}
        </button>
        <Link href={cancelHref} className="btn btn-secondary">
          Cancel
        </Link>
      </div>
    </form>
  );
}
