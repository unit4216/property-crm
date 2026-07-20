import { describe, expect, it } from "vitest";
import type { Property } from "@/db/schema";
import {
  formatAddressLine,
  formatCityLine,
  formatMoney,
  formatPhone,
} from "./format";

describe("formatMoney", () => {
  it("formats a numeric string as whole dollars", () => {
    expect(formatMoney("1500.00")).toBe("$1,500");
  });

  it("rounds to whole dollars", () => {
    expect(formatMoney("1500.75")).toBe("$1,501");
  });

  it("returns an em dash for null", () => {
    expect(formatMoney(null)).toBe("—");
  });

  it("returns an em dash for a non-numeric string", () => {
    expect(formatMoney("not-a-number")).toBe("—");
  });

  it("formats zero as $0", () => {
    expect(formatMoney("0")).toBe("$0");
  });
});

describe("formatPhone", () => {
  it("formats 10 stored digits as (XXX) XXX-XXXX", () => {
    expect(formatPhone("5551234567")).toBe("(555) 123-4567");
  });

  it("drops a leading US country code", () => {
    expect(formatPhone("15551234567")).toBe("(555) 123-4567");
  });

  it("returns an em dash for null", () => {
    expect(formatPhone(null)).toBe("—");
  });

  it("leaves a non-10-digit value untouched", () => {
    expect(formatPhone("555-1234")).toBe("555-1234");
  });
});

// formatAddressLine / formatCityLine only read a few fields; cast a partial.
const property = (over: Partial<Property>): Property =>
  ({
    addressLine1: "123 Oak St",
    addressLine2: null,
    city: "Austin",
    state: "TX",
    zip: "78701",
    ...over,
  }) as Property;

describe("formatAddressLine", () => {
  it("joins line 1 and line 2 when both are present", () => {
    expect(formatAddressLine(property({ addressLine2: "Apt 4" }))).toBe(
      "123 Oak St, Apt 4",
    );
  });

  it("omits line 2 when it is null", () => {
    expect(formatAddressLine(property({}))).toBe("123 Oak St");
  });
});

describe("formatCityLine", () => {
  it("renders City, ST ZIP", () => {
    expect(formatCityLine(property({}))).toBe("Austin, TX 78701");
  });
});
