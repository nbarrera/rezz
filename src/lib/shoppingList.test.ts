import { describe, it, expect } from "vitest";
import { generateShoppingItems } from "./shoppingList";
import type { Database } from "./database.types";

type MenuSlot = Database["cooking"]["Tables"]["menu_slots"]["Row"];
type Ingredient = Database["cooking"]["Tables"]["ingredients"]["Row"];
type CatalogEntry = Database["cooking"]["Tables"]["ingredient_catalog"]["Row"];

const slot = (recipeId: string): MenuSlot => ({
  id: "slot-1",
  menu_id: "menu-1",
  recipe_id: recipeId,
  day_of_week: 1,
  meal_type: "lunch",
});

const ingredient = (
  id: string,
  recipeId: string,
  catalogId: string,
  quantity: number,
  unit: string
): Ingredient => ({ id, recipe_id: recipeId, catalog_ingredient_id: catalogId, quantity, unit });

const catalogEntry = (id: string, name: string): CatalogEntry => ({
  id,
  name,
  user_id: "user-1",
  created_at: new Date().toISOString(),
});

describe("generateShoppingItems", () => {
  it("returns empty array when no slots", () => {
    expect(generateShoppingItems([], [], [])).toEqual([]);
  });

  it("returns empty array when no ingredients match slots", () => {
    const slots = [slot("recipe-1")];
    const ingredients = [ingredient("i1", "recipe-OTHER", "cat-1", 100, "g")];
    const catalog = [catalogEntry("cat-1", "flour")];
    expect(generateShoppingItems(slots, ingredients, catalog)).toEqual([]);
  });

  it("returns a single item for a single ingredient", () => {
    const slots = [slot("recipe-1")];
    const ingredients = [ingredient("i1", "recipe-1", "cat-1", 200, "g")];
    const catalog = [catalogEntry("cat-1", "flour")];

    const result = generateShoppingItems(slots, ingredients, catalog);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ name: "flour", total_quantity: 200, unit: "g", is_bought: false });
  });

  it("sums same ingredient from two recipes", () => {
    const slots = [slot("recipe-1"), { ...slot("recipe-2"), id: "slot-2", day_of_week: 2 }];
    const ingredients = [
      ingredient("i1", "recipe-1", "cat-1", 200, "g"),
      ingredient("i2", "recipe-2", "cat-1", 300, "g"),
    ];
    const catalog = [catalogEntry("cat-1", "flour")];

    const result = generateShoppingItems(slots, ingredients, catalog);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ name: "flour", total_quantity: 500, unit: "g" });
  });

  it("normalizes units before summing (kg + g → g)", () => {
    const slots = [slot("recipe-1"), { ...slot("recipe-2"), id: "slot-2", day_of_week: 2 }];
    const ingredients = [
      ingredient("i1", "recipe-1", "cat-1", 1, "kg"),   // → 1000g
      ingredient("i2", "recipe-2", "cat-1", 500, "g"),  // → 500g
    ];
    const catalog = [catalogEntry("cat-1", "flour")];

    const result = generateShoppingItems(slots, ingredients, catalog);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ name: "flour", total_quantity: 1500, unit: "g" });
  });

  it("keeps different base units separate (g vs l)", () => {
    const slots = [slot("recipe-1")];
    const ingredients = [
      ingredient("i1", "recipe-1", "cat-1", 200, "g"),
      ingredient("i2", "recipe-1", "cat-2", 500, "ml"), // → 0.5l
    ];
    const catalog = [
      catalogEntry("cat-1", "flour"),
      catalogEntry("cat-2", "milk"),
    ];

    const result = generateShoppingItems(slots, ingredients, catalog);

    expect(result).toHaveLength(2);
    expect(result.find((i) => i.name === "flour")).toMatchObject({ total_quantity: 200, unit: "g" });
    expect(result.find((i) => i.name === "milk")).toMatchObject({ total_quantity: 0.5, unit: "l" });
  });

  it("keeps unknown units separate per name", () => {
    const slots = [slot("recipe-1"), { ...slot("recipe-2"), id: "slot-2", day_of_week: 2 }];
    const ingredients = [
      ingredient("i1", "recipe-1", "cat-1", 2, "pinch"),
      ingredient("i2", "recipe-2", "cat-1", 3, "pinch"),
    ];
    const catalog = [catalogEntry("cat-1", "salt")];

    const result = generateShoppingItems(slots, ingredients, catalog);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ name: "salt", total_quantity: 5, unit: "pinch" });
  });

  it("ignores ingredients whose catalog id is not in catalog list", () => {
    const slots = [slot("recipe-1")];
    const ingredients = [ingredient("i1", "recipe-1", "cat-MISSING", 100, "g")];
    const catalog = [catalogEntry("cat-1", "flour")];

    expect(generateShoppingItems(slots, ingredients, catalog)).toEqual([]);
  });

  it("all items have is_bought: false", () => {
    const slots = [slot("recipe-1")];
    const ingredients = [ingredient("i1", "recipe-1", "cat-1", 100, "g")];
    const catalog = [catalogEntry("cat-1", "flour")];

    const result = generateShoppingItems(slots, ingredients, catalog);
    expect(result.every((i) => i.is_bought === false)).toBe(true);
  });
});
