import { z } from "zod";
import { propertyTypeEnum, propertyStatusEnum } from "@/db/schema";

// Human-readable labels for the enum values, reused across forms and displays.
export const PROPERTY_TYPES: Record<
  (typeof propertyTypeEnum.enumValues)[number],
  string
> = {
  single_family: "Single-family home",
  multi_family: "Multi-family",
  apartment: "Apartment",
  condo: "Condo",
  townhouse: "Townhouse",
  commercial: "Commercial",
  land: "Land",
};

export const PROPERTY_STATUSES: Record<
  (typeof propertyStatusEnum.enumValues)[number],
  string
> = {
  active: "Active",
  sold: "Sold",
};

// US states (plus DC) offered by the property form's state autocomplete. The
// two-letter `code` is what gets stored; the schema below validates against it.
export const US_STATES: { code: string; name: string }[] = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "DC", name: "District of Columbia" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
];

const US_STATE_CODES = new Set(US_STATES.map((s) => s.code));

// Turns "" into undefined so optional numeric/text fields from a form clear out
// instead of failing validation.
const emptyToUndefined = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v;

const optionalInt = z.preprocess(
  emptyToUndefined,
  z.coerce.number().int().nonnegative().optional(),
);

const optionalDecimal = z.preprocess(
  emptyToUndefined,
  z.coerce.number().nonnegative().optional(),
);

const optionalText = z.preprocess(
  emptyToUndefined,
  z.string().trim().optional(),
);

const optionalEmail = z.preprocess(
  emptyToUndefined,
  z.string().trim().email("Invalid email").optional(),
);

// `status` is intentionally absent: it isn't set through the property form.
// New properties default to "active" (see the schema), and the only transition
// — to "sold" — happens via the guarded markPropertySold action.
export const propertySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  type: z.enum(propertyTypeEnum.enumValues),

  addressLine1: z.string().trim().min(1, "Address is required").max(200),
  addressLine2: optionalText,
  city: z.string().trim().min(1, "City is required").max(120),
  state: z
    .string()
    .trim()
    .min(1, "State is required")
    .refine((v) => US_STATE_CODES.has(v), "Select a state from the list"),
  zip: z
    .string()
    .trim()
    .min(1, "ZIP is required")
    .regex(/^\d{5}$/, "ZIP must be a 5-digit number"),

  bedrooms: optionalInt,
  bathrooms: optionalDecimal,
  squareFeet: optionalInt,

  notes: optionalText,
});

export type PropertyInput = z.infer<typeof propertySchema>;

// Shape returned by server actions, consumed by the client form via useActionState.
// `values` echoes back what the user submitted so the form can restore it —
// React resets native form actions after they settle, on both success and
// failure, which would otherwise wipe the fields right when errors appear.
export type FormState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
  values?: Record<string, string | string[]>;
};

export const tenantSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(200),
    email: optionalEmail,
    phone: optionalText,
    notes: optionalText,
  })
  .superRefine((val, ctx) => {
    // A tenant needs at least one way to be reached.
    if (!val.email && !val.phone) {
      const message = "Add an email or phone number.";
      ctx.addIssue({ code: "custom", message, path: ["email"] });
      ctx.addIssue({ code: "custom", message, path: ["phone"] });
    }
  });

export type TenantInput = z.infer<typeof tenantSchema>;

// Units are edited inline on the property form as a repeatable list of labels,
// so their rule lives here and is applied per-row in the property action rather
// than as part of `propertySchema`.
export const UNIT_LABEL_MAX = 120;
export const unitLabelSchema = z
  .string()
  .trim()
  .min(1, "Unit name is required")
  .max(UNIT_LABEL_MAX);

export const leaseSchema = z.object({
  unitId: z.string().uuid("Select a unit"),
  tenantIds: z.array(z.string().uuid()).min(1, "Select at least one tenant"),
  startDate: z.string().trim().min(1, "Start date is required"),
  endDate: optionalText,
  rentAmount: optionalDecimal,
  depositAmount: optionalDecimal,
  notes: optionalText,
});

export type LeaseInput = z.infer<typeof leaseSchema>;
