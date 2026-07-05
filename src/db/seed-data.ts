import { db } from "./index";
import {
  properties,
  tenants,
  units,
  leases,
  leaseTenants,
  type NewProperty,
  type NewTenant,
  type NewLease,
} from "./schema";

type PropertySeed = Omit<NewProperty, "sessionId"> & { key: string };
type TenantSeed = Omit<NewTenant, "sessionId"> & { key: string };
type UnitSeed = { key: string; propertyKey: string; label: string };
type LeaseSeed = Omit<NewLease, "unitId"> & {
  unitKey: string;
  tenantKeys: string[];
};

const sampleProperties: PropertySeed[] = [
  {
    key: "maple",
    name: "Maple Street Duplex",
    type: "multi_family",
    status: "active",
    addressLine1: "412 Maple St",
    city: "Austin",
    state: "TX",
    zip: "78704",
    bedrooms: 4,
    bathrooms: "3.0",
    squareFeet: 2200,
    notes: "Both units leased through end of year.",
  },
  {
    key: "loft",
    name: "Downtown Loft 3B",
    type: "condo",
    status: "active",
    addressLine1: "88 Congress Ave",
    addressLine2: "Unit 3B",
    city: "Austin",
    state: "TX",
    zip: "78701",
    bedrooms: 1,
    bathrooms: "1.0",
    squareFeet: 850,
    notes: "Turnover cleaning scheduled.",
  },
  {
    key: "lakeview",
    name: "Lakeview Single Family",
    type: "single_family",
    status: "sold",
    addressLine1: "27 Shoreline Dr",
    city: "Round Rock",
    state: "TX",
    zip: "78665",
    bedrooms: 3,
    bathrooms: "2.5",
    squareFeet: 1875,
    notes: "Sold in early 2026; kept on record for history.",
  },
  {
    key: "cedar",
    name: "Cedar Park Townhome",
    type: "townhouse",
    status: "active",
    addressLine1: "1904 Brushy Creek Rd",
    addressLine2: "Unit 12",
    city: "Cedar Park",
    state: "TX",
    zip: "78613",
    bedrooms: 3,
    bathrooms: "2.5",
    squareFeet: 1650,
    notes: "HOA covers landscaping and trash.",
  },
  {
    key: "riverside",
    name: "Riverside Apartments #204",
    type: "apartment",
    status: "active",
    addressLine1: "550 E Riverside Dr",
    addressLine2: "Apt 204",
    city: "Austin",
    state: "TX",
    zip: "78741",
    bedrooms: 2,
    bathrooms: "1.0",
    squareFeet: 980,
  },
  {
    key: "oakhill",
    name: "Oak Hill Bungalow",
    type: "single_family",
    status: "active",
    addressLine1: "7321 Patton Ranch Rd",
    city: "Austin",
    state: "TX",
    zip: "78735",
    bedrooms: 2,
    bathrooms: "2.0",
    squareFeet: 1420,
    notes: "Long-term tenant, renews annually.",
  },
  {
    key: "commerce",
    name: "Commerce St Retail",
    type: "commercial",
    status: "active",
    addressLine1: "215 Commerce St",
    city: "San Marcos",
    state: "TX",
    zip: "78666",
    squareFeet: 3200,
    notes: "Ground-floor retail, triple-net lease.",
  },
  {
    key: "sunset",
    name: "Sunset Ridge Lot",
    type: "land",
    status: "active",
    addressLine1: "0 Sunset Ridge Rd",
    city: "Dripping Springs",
    state: "TX",
    zip: "78620",
    notes: "Undeveloped 1.2-acre lot held for future build.",
  },
  {
    key: "pecan",
    name: "Pecan Grove Fourplex",
    type: "multi_family",
    status: "active",
    addressLine1: "1130 Pecan Grove Blvd",
    city: "Pflugerville",
    state: "TX",
    zip: "78660",
    bedrooms: 8,
    bathrooms: "4.0",
    squareFeet: 3600,
    notes: "Units A and B leased; C undergoing plumbing repairs, D turning over.",
  },
  {
    key: "clarksville",
    name: "Clarksville Duplex",
    type: "multi_family",
    status: "active",
    addressLine1: "1607 W 10th St",
    city: "Austin",
    state: "TX",
    zip: "78703",
    bedrooms: 4,
    bathrooms: "2.0",
    squareFeet: 1980,
    notes: "Unit A leased; Unit B being repainted before listing.",
  },
];

const sampleTenants: TenantSeed[] = [
  {
    key: "chen",
    name: "Sarah Chen",
    email: "sarah.chen@example.com",
    phone: "(512) 555-0142",
  },
  {
    key: "johnson",
    name: "Marcus Johnson",
    email: "marcus.johnson@example.com",
    phone: "(512) 555-0188",
  },
  {
    key: "patel",
    name: "Priya Patel",
    email: "priya.patel@example.com",
    phone: "(737) 555-0119",
    notes: "Prefers email contact.",
  },
  {
    key: "nguyen-d",
    name: "David Nguyen",
    email: "david.nguyen@example.com",
    phone: "(512) 555-0203",
  },
  {
    key: "nguyen-e",
    name: "Emily Nguyen",
    email: "emily.nguyen@example.com",
    phone: "(512) 555-0204",
  },
  {
    key: "okafor",
    name: "Grace Okafor",
    email: "grace.okafor@example.com",
    phone: "(737) 555-0166",
  },
  {
    key: "reyes",
    name: "Luis Reyes",
    email: "luis.reyes@example.com",
    phone: "(830) 555-0177",
    notes: "Business tenant — Reyes Coffee Co.",
  },
  {
    key: "thompson",
    name: "Hannah Thompson",
    email: "hannah.thompson@example.com",
    phone: "(512) 555-0155",
  },
  {
    key: "garcia",
    name: "Sofia Garcia",
    email: "sofia.garcia@example.com",
    phone: "(512) 555-0211",
  },
  {
    key: "kim",
    name: "Daniel Kim",
    email: "daniel.kim@example.com",
    phone: "(737) 555-0233",
  },
  {
    key: "wright",
    name: "Olivia Wright",
    email: "olivia.wright@example.com",
    phone: "(512) 555-0248",
  },
];

// Every property has at least one unit. Multi-family buildings are split into
// their individual leasable units; single-unit properties get one entry.
const sampleUnits: UnitSeed[] = [
  { key: "maple-a", propertyKey: "maple", label: "Unit A" },
  { key: "maple-b", propertyKey: "maple", label: "Unit B" },
  { key: "loft-main", propertyKey: "loft", label: "Unit 3B" },
  { key: "lakeview-main", propertyKey: "lakeview", label: "Main home" },
  { key: "cedar-main", propertyKey: "cedar", label: "Unit 12" },
  { key: "riverside-main", propertyKey: "riverside", label: "Apt 204" },
  { key: "oakhill-main", propertyKey: "oakhill", label: "Main home" },
  { key: "commerce-main", propertyKey: "commerce", label: "Retail suite" },
  { key: "sunset-main", propertyKey: "sunset", label: "Parcel" },
  { key: "pecan-a", propertyKey: "pecan", label: "Unit A" },
  { key: "pecan-b", propertyKey: "pecan", label: "Unit B" },
  { key: "pecan-c", propertyKey: "pecan", label: "Unit C" },
  { key: "pecan-d", propertyKey: "pecan", label: "Unit D" },
  { key: "clarksville-a", propertyKey: "clarksville", label: "Unit A" },
  { key: "clarksville-b", propertyKey: "clarksville", label: "Unit B" },
];

const sampleLeases: LeaseSeed[] = [
  {
    unitKey: "maple-a",
    tenantKeys: ["chen"],
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    rentAmount: "1450.00",
    depositAmount: "1450.00",
  },
  {
    unitKey: "maple-b",
    tenantKeys: ["johnson"],
    startDate: "2026-03-01",
    endDate: "2027-02-28",
    rentAmount: "1400.00",
    depositAmount: "1400.00",
  },
  {
    unitKey: "cedar-main",
    tenantKeys: ["nguyen-d", "nguyen-e"],
    startDate: "2025-09-01",
    endDate: "2026-08-31",
    rentAmount: "2250.00",
    depositAmount: "2250.00",
  },
  {
    unitKey: "riverside-main",
    tenantKeys: ["patel"],
    startDate: "2026-05-15",
    endDate: "2027-05-14",
    rentAmount: "1750.00",
    depositAmount: "1750.00",
  },
  {
    unitKey: "oakhill-main",
    tenantKeys: ["thompson"],
    startDate: "2026-02-01",
    endDate: "2027-01-31",
    rentAmount: "2100.00",
    depositAmount: "2100.00",
  },
  {
    unitKey: "commerce-main",
    tenantKeys: ["reyes"],
    startDate: "2024-06-01",
    endDate: "2029-05-31",
    rentAmount: "4800.00",
    depositAmount: "9600.00",
    notes: "5-year triple-net commercial lease.",
  },
  {
    // Prior tenant of the Oak Hill bungalow, moved out.
    unitKey: "oakhill-main",
    tenantKeys: ["okafor"],
    startDate: "2025-01-01",
    endDate: "2026-01-15",
    rentAmount: "1950.00",
    depositAmount: "1950.00",
  },
  {
    // Upcoming lease for the loft that is currently being turned over.
    unitKey: "loft-main",
    tenantKeys: ["okafor"],
    startDate: "2026-08-01",
    endDate: "2027-07-31",
    rentAmount: "1950.00",
    depositAmount: "1950.00",
    notes: "Move-in after turnover cleaning.",
  },
  {
    // Two of the fourplex's four units are leased, so it reads as partially
    // occupied (C is under repair, D is turning over).
    unitKey: "pecan-a",
    tenantKeys: ["garcia"],
    startDate: "2026-04-01",
    endDate: "2027-03-31",
    rentAmount: "1500.00",
    depositAmount: "1500.00",
  },
  {
    unitKey: "pecan-b",
    tenantKeys: ["kim"],
    startDate: "2026-06-01",
    endDate: "2027-05-31",
    rentAmount: "1500.00",
    depositAmount: "1500.00",
  },
  {
    // One of the duplex's two units is leased — partially occupied.
    unitKey: "clarksville-a",
    tenantKeys: ["wright"],
    startDate: "2026-02-15",
    endDate: "2027-02-14",
    rentAmount: "1800.00",
    depositAmount: "1800.00",
  },
];

export const sampleCount = sampleProperties.length;
export const tenantCount = sampleTenants.length;
export const unitCount = sampleUnits.length;
export const leaseCount = sampleLeases.length;

// Populates a freshly created session with sample properties, tenants, and
// leases so guests land on a populated dashboard instead of an empty state.
export async function seedDemoData(sessionId: string) {
  const insertedProperties = await db
    .insert(properties)
    .values(sampleProperties.map(({ key, ...p }) => ({ ...p, sessionId })))
    .returning({ id: properties.id });

  const propertyIdByKey = new Map(
    sampleProperties.map((p, i) => [p.key, insertedProperties[i].id]),
  );

  const insertedTenants = await db
    .insert(tenants)
    .values(sampleTenants.map(({ key, ...t }) => ({ ...t, sessionId })))
    .returning({ id: tenants.id });

  const tenantIdByKey = new Map(
    sampleTenants.map((t, i) => [t.key, insertedTenants[i].id]),
  );

  const insertedUnits = await db
    .insert(units)
    .values(
      sampleUnits.map(({ propertyKey, label }) => ({
        label,
        propertyId: propertyIdByKey.get(propertyKey)!,
      })),
    )
    .returning({ id: units.id });

  const unitIdByKey = new Map(
    sampleUnits.map((u, i) => [u.key, insertedUnits[i].id]),
  );

  const insertedLeases = await db
    .insert(leases)
    .values(
      sampleLeases.map(({ unitKey, tenantKeys, ...l }) => ({
        ...l,
        unitId: unitIdByKey.get(unitKey)!,
      })),
    )
    .returning({ id: leases.id });

  const links = sampleLeases.flatMap((lease, i) =>
    lease.tenantKeys.map((tenantKey) => ({
      leaseId: insertedLeases[i].id,
      tenantId: tenantIdByKey.get(tenantKey)!,
    })),
  );
  await db.insert(leaseTenants).values(links);
}
