import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  numeric,
  timestamp,
} from "drizzle-orm/pg-core";

export const propertyTypeEnum = pgEnum("property_type", [
  "single_family",
  "multi_family",
  "apartment",
  "condo",
  "townhouse",
  "commercial",
  "land",
]);

export const propertyStatusEnum = pgEnum("property_status", [
  "active",
  "vacant",
  "occupied",
  "under_maintenance",
  "listed",
]);

export const properties = pgTable("properties", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  type: propertyTypeEnum("type").notNull().default("single_family"),
  status: propertyStatusEnum("status").notNull().default("active"),

  addressLine1: text("address_line1").notNull(),
  addressLine2: text("address_line2"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zip: text("zip").notNull(),

  bedrooms: integer("bedrooms"),
  bathrooms: numeric("bathrooms", { precision: 3, scale: 1 }),
  squareFeet: integer("square_feet"),
  rentAmount: numeric("rent_amount", { precision: 12, scale: 2 }),

  notes: text("notes"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Property = typeof properties.$inferSelect;
export type NewProperty = typeof properties.$inferInsert;
