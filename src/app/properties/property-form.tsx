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

const labelClass =
  "block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1";
const inputClass =
  "block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-400";

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors[0]}</p>
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
    <form action={formAction} className="space-y-6">
      {state.message && !state.ok && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {state.message}
        </div>
      )}

      <section className="space-y-4 rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">
          Details
        </h2>
        <div>
          <label htmlFor="name" className={labelClass}>
            Name
          </label>
          <input
            id="name"
            name="name"
            defaultValue={property?.name ?? ""}
            placeholder="e.g. Maple Street Duplex"
            className={inputClass}
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
              className={inputClass}
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
              className={inputClass}
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
      </section>

      <section className="space-y-4 rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">
          Address
        </h2>
        <div>
          <label htmlFor="addressLine1" className={labelClass}>
            Street address
          </label>
          <input
            id="addressLine1"
            name="addressLine1"
            defaultValue={property?.addressLine1 ?? ""}
            placeholder="123 Maple St"
            className={inputClass}
          />
          <FieldError errors={errors.addressLine1} />
        </div>
        <div>
          <label htmlFor="addressLine2" className={labelClass}>
            Unit / Apt <span className="text-zinc-400">(optional)</span>
          </label>
          <input
            id="addressLine2"
            name="addressLine2"
            defaultValue={property?.addressLine2 ?? ""}
            placeholder="Unit 2"
            className={inputClass}
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
              className={inputClass}
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
              className={inputClass}
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
              className={inputClass}
            />
            <FieldError errors={errors.zip} />
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">
          Specs &amp; rent <span className="text-zinc-400">(optional)</span>
        </h2>
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
              className={inputClass}
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
              className={inputClass}
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
              className={inputClass}
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
              className={inputClass}
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
            className={inputClass}
          />
          <FieldError errors={errors.notes} />
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {pending ? "Saving…" : submitLabel}
        </button>
        <Link
          href={cancelHref}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
