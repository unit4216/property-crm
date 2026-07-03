import { db } from "./index";
import { properties, type NewProperty } from "./schema";

const sample: Omit<NewProperty, "sessionId">[] = [
  {
    name: "Maple Street Duplex",
    type: "multi_family",
    status: "occupied",
    addressLine1: "412 Maple St",
    city: "Austin",
    state: "TX",
    zip: "78704",
    bedrooms: 4,
    bathrooms: "3.0",
    squareFeet: 2200,
    rentAmount: "2850.00",
    notes: "Both units leased through end of year.",
  },
  {
    name: "Downtown Loft 3B",
    type: "condo",
    status: "vacant",
    addressLine1: "88 Congress Ave",
    addressLine2: "Unit 3B",
    city: "Austin",
    state: "TX",
    zip: "78701",
    bedrooms: 1,
    bathrooms: "1.0",
    squareFeet: 850,
    rentAmount: "1950.00",
    notes: "Turnover cleaning scheduled.",
  },
  {
    name: "Lakeview Single Family",
    type: "single_family",
    status: "listed",
    addressLine1: "27 Shoreline Dr",
    city: "Round Rock",
    state: "TX",
    zip: "78665",
    bedrooms: 3,
    bathrooms: "2.5",
    squareFeet: 1875,
    rentAmount: "2400.00",
  },
];

export const sampleCount = sample.length;

// Populates a freshly created session with sample properties so guests land
// on a populated dashboard instead of an empty state.
export async function seedDemoData(sessionId: string) {
  await db.insert(properties).values(sample.map((p) => ({ ...p, sessionId })));
}
