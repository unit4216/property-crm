import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  numeric,
  timestamp,
  date,
  primaryKey,
} from "drizzle-orm/pg-core";

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

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
  sessionId: uuid("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
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

export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  notes: text("notes"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;

// A property is made up of one or more leasable units (e.g. the two halves of a
// duplex, or the single unit of a house). Every property has at least one, and
// a lease is always signed against a specific unit rather than the property.
export const units = pgTable("units", {
  id: uuid("id").primaryKey().defaultRandom(),
  propertyId: uuid("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  label: text("label").notNull(),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Unit = typeof units.$inferSelect;
export type NewUnit = typeof units.$inferInsert;

// A lease has no stored status column — its status ("upcoming" / "active" /
// "ended") is derived from its start and end dates. See lib/lease-status.ts.
export const leases = pgTable("leases", {
  id: uuid("id").primaryKey().defaultRandom(),
  unitId: uuid("unit_id")
    .notNull()
    .references(() => units.id, { onDelete: "cascade" }),

  startDate: date("start_date", { mode: "string" }).notNull(),
  endDate: date("end_date", { mode: "string" }),

  rentAmount: numeric("rent_amount", { precision: 12, scale: 2 }),
  depositAmount: numeric("deposit_amount", { precision: 12, scale: 2 }),

  notes: text("notes"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Lease = typeof leases.$inferSelect;
export type NewLease = typeof leases.$inferInsert;

// Join table: a lease can have multiple tenants, and a tenant can have
// leases across multiple properties over time.
export const leaseTenants = pgTable(
  "lease_tenants",
  {
    leaseId: uuid("lease_id")
      .notNull()
      .references(() => leases.id, { onDelete: "cascade" }),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.leaseId, table.tenantId] })],
);
