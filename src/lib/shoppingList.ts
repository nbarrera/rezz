import { pipe, groupBy, mapValues, entries } from "remeda";
import { normalizeToBase } from "./units";
import type { Database } from "./database.types";

type MenuSlot = Database["cooking"]["Tables"]["menu_slots"]["Row"];
type Ingredient = Database["cooking"]["Tables"]["ingredients"]["Row"];
type CatalogEntry = Database["cooking"]["Tables"]["ingredient_catalog"]["Row"];

// What we produce — matches shopping_items.Insert minus shopping_list_id.
// total_quantity and unit are stored in the normalized base unit (g, l, or
// as-is for unknown units). The UI calls formatQuantity() for display.
export type ShoppingItemDraft = {
  name: string;
  total_quantity: number;
  unit: string;
  is_bought: boolean;
};

/**
 * Pure function pipeline. No side effects, no Supabase calls inside.
 *
 * Given pre-fetched data for a week's menu, produces the list of shopping
 * items to insert. The caller is responsible for attaching shopping_list_id.
 */
export function generateShoppingItems(
  slots: MenuSlot[],
  ingredients: Ingredient[],
  catalog: CatalogEntry[]
): ShoppingItemDraft[] {
  const recipeIds = new Set(slots.map((s) => s.recipe_id));
  const catalogById = new Map(catalog.map((c) => [c.id, c.name]));

  // Flat list of { name, quantity, unit } normalized to base unit
  const normalized = ingredients
    .filter((ing) => recipeIds.has(ing.recipe_id))
    .flatMap((ing) => {
      const name = catalogById.get(ing.catalog_ingredient_id);
      if (!name) return [];
      const { quantity, unit } = normalizeToBase(ing.quantity, ing.unit);
      return [{ name, quantity, unit }];
    });

  return pipe(
    normalized,
    // Group by "name::unit" — same ingredient + same base unit are summed
    groupBy((item) => `${item.name}::${item.unit}`),
    mapValues((items) => {
      const { name, unit } = items[0];
      const total = items.reduce((sum, i) => sum + i.quantity, 0);
      return { name, total_quantity: total, unit, is_bought: false } satisfies ShoppingItemDraft;
    }),
    entries(),
    (pairs) => pairs.map(([, item]) => item)
  );
}
