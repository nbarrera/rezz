type ConversionEntry = { base: string; factor: number };

const conversionMap: Record<string, ConversionEntry> = {
  mg: { base: "g", factor: 0.001 },
  kg: { base: "g", factor: 1000 },
  ml: { base: "l", factor: 0.001 },
  cl: { base: "l", factor: 0.01 },
  dl: { base: "l", factor: 0.1 },
};

// Phase 2 (not yet built):
// tsp:  { base: 'tbsp', factor: 0.333 }
// 'unit', 'can', 'slice', 'pinch' → sum as-is

export type NormalizedQuantity = { quantity: number; unit: string };

/**
 * Converts a quantity+unit to the base unit.
 * Unknown units are returned as-is (no crash, no data loss).
 */
export function normalizeToBase(
  quantity: number,
  unit: string
): NormalizedQuantity {
  const entry = conversionMap[unit];
  if (!entry) return { quantity, unit };
  return { quantity: quantity * entry.factor, unit: entry.base };
}

// Reverse map: base unit → display thresholds for formatting
const formatThresholds: Record<string, { factor: number; display: string }[]> =
  {
    g: [{ factor: 1000, display: "kg" }],
    l: [{ factor: 1, display: "l" }],
  };

/**
 * Formats a base-unit quantity into a human-readable string.
 * e.g. normalizeToBase(1000, 'g') → formatQuantity(1000, 'g') → "1 kg"
 */
export function formatQuantity(quantity: number, unit: string): string {
  const thresholds = formatThresholds[unit];
  if (thresholds) {
    for (const t of thresholds) {
      if (quantity >= t.factor) {
        const formatted = quantity / t.factor;
        // Trim unnecessary decimals
        const display =
          formatted % 1 === 0 ? String(formatted) : formatted.toFixed(2);
        return `${display} ${t.display}`;
      }
    }
  }
  const display = quantity % 1 === 0 ? String(quantity) : quantity.toFixed(2);
  return `${display} ${unit}`;
}
