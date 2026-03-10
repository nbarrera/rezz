import { describe, it, expect } from "vitest";
import { normalizeToBase, formatQuantity } from "./units";

// ---------------------------------------------------------------------------
// normalizeToBase
// ---------------------------------------------------------------------------

type NormalizeCase = {
  desc: string;
  qty: number;
  unit: string;
  expectedQty: number;
  expectedUnit: string;
  closeTo?: boolean;
};

function doTestNormalize({ qty, unit, expectedQty, expectedUnit, closeTo }: NormalizeCase) {
  const result = normalizeToBase(qty, unit);
  expect(result.unit).toBe(expectedUnit);
  closeTo
    ? expect(result.quantity).toBeCloseTo(expectedQty)
    : expect(result.quantity).toBe(expectedQty);
}

const normalizeCases: NormalizeCase[] = [
  { desc: "mg → g",             qty: 500,  unit: "mg",    expectedQty: 0.5,   expectedUnit: "g" },
  { desc: "kg → g",             qty: 2,    unit: "kg",    expectedQty: 2000,  expectedUnit: "g" },
  { desc: "ml → l",             qty: 500,  unit: "ml",    expectedQty: 0.5,   expectedUnit: "l" },
  { desc: "cl → l",             qty: 25,   unit: "cl",    expectedQty: 0.25,  expectedUnit: "l" },
  { desc: "dl → l (float)",     qty: 3,    unit: "dl",    expectedQty: 0.3,   expectedUnit: "l", closeTo: true },
  { desc: "g passthrough",      qty: 200,  unit: "g",     expectedQty: 200,   expectedUnit: "g" },
  { desc: "l passthrough",      qty: 1.5,  unit: "l",     expectedQty: 1.5,   expectedUnit: "l" },
  { desc: "unknown unit as-is", qty: 4,    unit: "pinch", expectedQty: 4,     expectedUnit: "pinch" },
];

describe("normalizeToBase", () => {
  normalizeCases.forEach((c) => it(c.desc, () => doTestNormalize(c)));
});

// ---------------------------------------------------------------------------
// formatQuantity
// ---------------------------------------------------------------------------

type FormatCase = { desc: string; qty: number; unit: string; expected: string };

function doTestFormat({ qty, unit, expected }: FormatCase) {
  expect(formatQuantity(qty, unit)).toBe(expected);
}

const formatCases: FormatCase[] = [
  { desc: "1000g → 1 kg",       qty: 1000, unit: "g",     expected: "1 kg"    },
  { desc: "500g stays as g",    qty: 500,  unit: "g",     expected: "500 g"   },
  { desc: "2500g → 2.50 kg",    qty: 2500, unit: "g",     expected: "2.50 kg" },
  { desc: "1 l",                qty: 1,    unit: "l",     expected: "1 l"     },
  { desc: "1.5 l → 1.50 l",     qty: 1.5,  unit: "l",     expected: "1.50 l"  },
  { desc: "unknown unit as-is", qty: 3,    unit: "pinch", expected: "3 pinch" },
  { desc: "999g stays as g (just below 1 kg threshold)", qty: 999, unit: "g", expected: "999 g" },
  { desc: "0.5 l falls through to generic (below factor-1 threshold)", qty: 0.5, unit: "l", expected: "0.50 l" },
];

describe("formatQuantity", () => {
  formatCases.forEach((c) => it(c.desc, () => doTestFormat(c)));
});
