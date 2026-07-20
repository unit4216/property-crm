import { describe, expect, it } from "vitest";
import { leaseSchema, propertySchema, tenantSchema } from "./validation";

const validProperty = {
  name: "Oak Duplex",
  type: "multi_family",
  addressLine1: "123 Oak St",
  city: "Austin",
  state: "TX",
  zip: "78701",
};

describe("propertySchema", () => {
  it("accepts a minimal valid property", () => {
    expect(propertySchema.safeParse(validProperty).success).toBe(true);
  });

  it("trims and requires a name", () => {
    const r = propertySchema.safeParse({ ...validProperty, name: "   " });
    expect(r.success).toBe(false);
  });

  it("rejects a state code that is not in the list", () => {
    const r = propertySchema.safeParse({ ...validProperty, state: "ZZ" });
    expect(r.success).toBe(false);
  });

  it("rejects a ZIP that is not 5 digits", () => {
    expect(
      propertySchema.safeParse({ ...validProperty, zip: "7870" }).success,
    ).toBe(false);
    expect(
      propertySchema.safeParse({ ...validProperty, zip: "78701-1234" }).success,
    ).toBe(false);
  });

  it("coerces optional numeric fields and treats empty strings as absent", () => {
    const r = propertySchema.safeParse({
      ...validProperty,
      bedrooms: "3",
      bathrooms: "",
      squareFeet: "",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.bedrooms).toBe(3);
      expect(r.data.bathrooms).toBeUndefined();
    }
  });

  it("rejects a negative bedroom count", () => {
    expect(
      propertySchema.safeParse({ ...validProperty, bedrooms: "-1" }).success,
    ).toBe(false);
  });
});

describe("tenantSchema", () => {
  it("accepts a tenant with just an email", () => {
    expect(
      tenantSchema.safeParse({ name: "Sam", email: "sam@example.com" }).success,
    ).toBe(true);
  });

  it("accepts a tenant with just a phone", () => {
    expect(
      tenantSchema.safeParse({ name: "Sam", phone: "(555) 123-4567" }).success,
    ).toBe(true);
  });

  it("normalizes a formatted phone to 10 national digits", () => {
    const r = tenantSchema.safeParse({ name: "Sam", phone: "(555) 123-4567" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.phone).toBe("5551234567");
  });

  it("strips a leading US country code", () => {
    const r = tenantSchema.safeParse({ name: "Sam", phone: "+1 555 123 4567" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.phone).toBe("5551234567");
  });

  it("rejects a phone without 10 digits", () => {
    expect(
      tenantSchema.safeParse({ name: "Sam", phone: "555-1234" }).success,
    ).toBe(false);
  });

  it("requires at least an email or a phone", () => {
    const r = tenantSchema.safeParse({ name: "Sam" });
    expect(r.success).toBe(false);
    if (!r.success) {
      const paths = r.error.issues.flatMap((i) => i.path);
      expect(paths).toContain("email");
      expect(paths).toContain("phone");
    }
  });

  it("rejects an invalid email", () => {
    expect(
      tenantSchema.safeParse({ name: "Sam", email: "not-an-email" }).success,
    ).toBe(false);
  });
});

describe("leaseSchema", () => {
  const validLease = {
    unitId: "11111111-1111-4111-8111-111111111111",
    tenantIds: ["22222222-2222-4222-8222-222222222222"],
    startDate: "2026-01-01",
  };

  it("accepts a valid lease", () => {
    expect(leaseSchema.safeParse(validLease).success).toBe(true);
  });

  it("requires at least one tenant", () => {
    expect(
      leaseSchema.safeParse({ ...validLease, tenantIds: [] }).success,
    ).toBe(false);
  });

  it("requires a unit uuid", () => {
    expect(
      leaseSchema.safeParse({ ...validLease, unitId: "not-a-uuid" }).success,
    ).toBe(false);
  });

  it("requires a start date", () => {
    expect(
      leaseSchema.safeParse({ ...validLease, startDate: "" }).success,
    ).toBe(false);
  });
});
