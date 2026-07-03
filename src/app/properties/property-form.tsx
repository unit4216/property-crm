"use client";

import { useActionState } from "react";
import Link from "next/link";
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

const labelClass = "mb-1 block text-sm font-medium text-ink";

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="mt-1 text-xs text-red-600">{errors[0]}</p>;
}

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
    <section className="space-y-4 rounded-md border border-border bg-surface p-6">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
        {title}
        {hint && <span className="ml-2 font-normal text-ink-faint">{hint}</span>}
      </h2>
      {children}
    </section>
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

  return (
    <form action={formAction} className="space-y-5">
      {state.message && !state.ok && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}
        </div>
      )}

      <Section title="Details">
        <div>
          <label htmlFor="name" className={labelClass}>
            Name
          </label>
          <input
            id="name"
            name="name"
            defaultValue={property?.name ?? ""}
            placeholder="e.g. Maple Street Duplex"
            className="field"
          />
          <FieldError errors={errors.name} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="type" className={labelClass}>
              Type
            </label>
            <select
              id="type"
              name="type"
              defaultValue={property?.type ?? "single_family"}
              className="field"
            >
              {Object.entries(PROPERTY_TYPES).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <FieldError errors={errors.type} />
          </div>
          <div>
            <label htmlFor="status" className={labelClass}>
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={property?.status ?? "active"}
              className="field"
            >
              {Object.entries(PROPERTY_STATUSES).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <FieldError errors={errors.status} />
          </div>
        </div>
      </Section>

      <Section title="Address">
        <div>
          <label htmlFor="addressLine1" className={labelClass}>
            Street address
          </label>
          <input
            id="addressLine1"
            name="addressLine1"
            defaultValue={property?.addressLine1 ?? ""}
            placeholder="123 Maple St"
            className="field"
          />
          <FieldError errors={errors.addressLine1} />
        </div>
        <div>
          <label htmlFor="addressLine2" className={labelClass}>
            Unit / Apt <span className="text-ink-faint">(optional)</span>
          </label>
          <input
            id="addressLine2"
            name="addressLine2"
            defaultValue={property?.addressLine2 ?? ""}
            placeholder="Unit 2"
            className="field"
          />
          <FieldError errors={errors.addressLine2} />
        </div>
        <div className="grid gap-4 sm:grid-cols-6">
          <div className="sm:col-span-3">
            <label htmlFor="city" className={labelClass}>
              City
            </label>
            <input
              id="city"
              name="city"
              defaultValue={property?.city ?? ""}
              className="field"
            />
            <FieldError errors={errors.city} />
          </div>
          <div className="sm:col-span-1">
            <label htmlFor="state" className={labelClass}>
              State
            </label>
            <input
              id="state"
              name="state"
              defaultValue={property?.state ?? ""}
              placeholder="CA"
              className="field"
            />
            <FieldError errors={errors.state} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="zip" className={labelClass}>
              ZIP
            </label>
            <input
              id="zip"
              name="zip"
              defaultValue={property?.zip ?? ""}
              className="field"
            />
            <FieldError errors={errors.zip} />
          </div>
        </div>
      </Section>

      <Section title="Specs & rent" hint="(optional)">
        <div className="grid gap-4 sm:grid-cols-4">
          <div>
            <label htmlFor="bedrooms" className={labelClass}>
              Beds
            </label>
            <input
              id="bedrooms"
              name="bedrooms"
              type="number"
              min="0"
              defaultValue={property?.bedrooms ?? ""}
              className="field"
            />
            <FieldError errors={errors.bedrooms} />
          </div>
          <div>
            <label htmlFor="bathrooms" className={labelClass}>
              Baths
            </label>
            <input
              id="bathrooms"
              name="bathrooms"
              type="number"
              min="0"
              step="0.5"
              defaultValue={property?.bathrooms ?? ""}
              className="field"
            />
            <FieldError errors={errors.bathrooms} />
          </div>
          <div>
            <label htmlFor="squareFeet" className={labelClass}>
              Sq ft
            </label>
            <input
              id="squareFeet"
              name="squareFeet"
              type="number"
              min="0"
              defaultValue={property?.squareFeet ?? ""}
              className="field"
            />
            <FieldError errors={errors.squareFeet} />
          </div>
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
              defaultValue={property?.rentAmount ?? ""}
              className="field"
            />
            <FieldError errors={errors.rentAmount} />
          </div>
        </div>
        <div>
          <label htmlFor="notes" className={labelClass}>
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            defaultValue={property?.notes ?? ""}
            className="field"
          />
          <FieldError errors={errors.notes} />
        </div>
      </Section>

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
