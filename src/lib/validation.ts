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
  vacant: "Vacant",
  occupied: "Occupied",
  under_maintenance: "Under maintenance",
  listed: "Listed",
};

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

export const propertySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  type: z.enum(propertyTypeEnum.enumValues),
  status: z.enum(propertyStatusEnum.enumValues),

  addressLine1: z.string().trim().min(1, "Address is required").max(200),
  addressLine2: optionalText,
  city: z.string().trim().min(1, "City is required").max(120),
  state: z.string().trim().min(1, "State is required").max(60),
  zip: z.string().trim().min(1, "ZIP is required").max(20),

  bedrooms: optionalInt,
  bathrooms: optionalDecimal,
  squareFeet: optionalInt,
  rentAmount: optionalDecimal,

  notes: optionalText,
});

export type PropertyInput = z.infer<typeof propertySchema>;

// Shape returned by server actions, consumed by the client form via useActionState.
export type FormState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};
