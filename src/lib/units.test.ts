import { describe, it, expect } from "vitest";
import { normalizeToBase, formatQuantity } from "./units";

describe("normalizeToBase", () => {
  it("converts mg to g", () => {
    expect(normalizeToBase(500, "mg")).toEqual({ quantity: 0.5, unit: "g" });
  });

  it("converts kg to g", () => {
    expect(normalizeToBase(2, "kg")).toEqual({ quantity: 2000, unit: "g" });
  });

  it("converts ml to l", () => {
    expect(normalizeToBase(500, "ml")).toEqual({ quantity: 0.5, unit: "l" });
  });

  it("converts cl to l", () => {
    expect(normalizeToBase(25, "cl")).toEqual({ quantity: 0.25, unit: "l" });
  });

  it("converts dl to l", () => {
    const result = normalizeToBase(3, "dl");
    expect(result.unit).toBe("l");
    expect(result.quantity).toBeCloseTo(0.3);
  });

  it("passes through unknown unit as-is", () => {
    expect(normalizeToBase(4, "pinch")).toEqual({ quantity: 4, unit: "pinch" });
  });

  it("passes through g unchanged (already base)", () => {
    expect(normalizeToBase(200, "g")).toEqual({ quantity: 200, unit: "g" });
  });

  it("passes through l unchanged (already base)", () => {
    expect(normalizeToBase(1.5, "l")).toEqual({ quantity: 1.5, unit: "l" });
  });
});

describe("formatQuantity", () => {
  it("formats 1000g as 1 kg", () => {
    expect(formatQuantity(1000, "g")).toBe("1 kg");
  });

  it("formats 500g as 500 g", () => {
    expect(formatQuantity(500, "g")).toBe("500 g");
  });

  it("formats 1.5 l as 1.50 l", () => {
    expect(formatQuantity(1.5, "l")).toBe("1.50 l");
  });

  it("formats 1 l as 1 l", () => {
    expect(formatQuantity(1, "l")).toBe("1 l");
  });

  it("formats unknown unit as-is", () => {
    expect(formatQuantity(3, "pinch")).toBe("3 pinch");
  });

  it("formats 2500g as 2.50 kg", () => {
    expect(formatQuantity(2500, "g")).toBe("2.50 kg");
  });
});
