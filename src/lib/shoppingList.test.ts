import { describe, it, expect } from "vitest";
import { generateShoppingItems } from "./shoppingList";
import type { Database } from "./database.types";

type MenuSlot    = Database["cooking"]["Tables"]["menu_slots"]["Row"];
type Ingredient  = Database["cooking"]["Tables"]["ingredients"]["Row"];
type CatalogEntry = Database["cooking"]["Tables"]["ingredient_catalog"]["Row"];

// ---------------------------------------------------------------------------
// DSL helpers — concise builders, never shared across cases
// ---------------------------------------------------------------------------

const slot = (recipeId: string, day = 1): MenuSlot => ({
  id: `slot-${recipeId}-${day}`, menu_id: "menu-1",
  recipe_id: recipeId, day_of_week: day, meal_type: "lunch",
});

const ingredient = (
  id: string, recipeId: string, catalogId: string, quantity: number, unit: string
): Ingredient => ({ id, recipe_id: recipeId, catalog_ingredient_id: catalogId, quantity, unit });

const cat = (id: string, name: string): CatalogEntry => ({
  id, name, user_id: "user-1", created_at: new Date().toISOString(),
});

// ---------------------------------------------------------------------------
// doTest — the "how" lives here, once
// ---------------------------------------------------------------------------

type Case = {
  desc: string;
  slots: MenuSlot[];
  ingredients: Ingredient[];
  catalog: CatalogEntry[];
  expectedLength: number;
  expectedItems?: Array<Partial<{ name: string; total_quantity: number; unit: string; is_bought: boolean }>>;
};

function doTest({ slots, ingredients, catalog, expectedLength, expectedItems }: Case) {
  const result = generateShoppingItems(slots, ingredients, catalog);
  expect(result).toHaveLength(expectedLength);
  expectedItems?.forEach((expected) => {
    expect(result.find((r) => r.name === expected.name)).toMatchObject(expected);
  });
}

// ---------------------------------------------------------------------------
// Cases — the "what" lives here, fully inline
// ---------------------------------------------------------------------------

const cases: Case[] = [
  {
    desc: "empty inputs → empty list",
    slots: [], ingredients: [], catalog: [],
    expectedLength: 0,
  },
  {
    desc: "ingredient not matching any slot → ignored",
    slots: [slot("recipe-1")],
    ingredients: [ingredient("i1", "recipe-OTHER", "cat-1", 100, "g")],
    catalog: [cat("cat-1", "flour")],
    expectedLength: 0,
  },
  {
    desc: "missing catalog entry → item ignored",
    slots: [slot("recipe-1")],
    ingredients: [ingredient("i1", "recipe-1", "cat-MISSING", 100, "g")],
    catalog: [cat("cat-other", "flour")],
    expectedLength: 0,
  },
  {
    desc: "single ingredient → single item",
    slots: [slot("recipe-1")],
    ingredients: [ingredient("i1", "recipe-1", "cat-1", 200, "g")],
    catalog: [cat("cat-1", "flour")],
    expectedLength: 1,
    expectedItems: [{ name: "flour", total_quantity: 200, unit: "g", is_bought: false }],
  },
  {
    desc: "same ingredient in two recipes → quantities summed",
    slots: [slot("recipe-1", 1), slot("recipe-2", 2)],
    ingredients: [
      ingredient("i1", "recipe-1", "cat-1", 200, "g"),
      ingredient("i2", "recipe-2", "cat-1", 300, "g"),
    ],
    catalog: [cat("cat-1", "flour")],
    expectedLength: 1,
    expectedItems: [{ name: "flour", total_quantity: 500, unit: "g" }],
  },
  {
    desc: "kg + g → normalized and summed as g",
    slots: [slot("recipe-1", 1), slot("recipe-2", 2)],
    ingredients: [
      ingredient("i1", "recipe-1", "cat-1", 1,   "kg"),  // → 1000g
      ingredient("i2", "recipe-2", "cat-1", 500, "g"),   // → 500g
    ],
    catalog: [cat("cat-1", "flour")],
    expectedLength: 1,
    expectedItems: [{ name: "flour", total_quantity: 1500, unit: "g" }],
  },
  {
    desc: "different base units (g vs l) → kept separate",
    slots: [slot("recipe-1")],
    ingredients: [
      ingredient("i1", "recipe-1", "cat-1", 200,  "g"),
      ingredient("i2", "recipe-1", "cat-2", 500,  "ml"), // → 0.5l
    ],
    catalog: [cat("cat-1", "flour"), cat("cat-2", "milk")],
    expectedLength: 2,
    expectedItems: [
      { name: "flour", total_quantity: 200,  unit: "g" },
      { name: "milk",  total_quantity: 0.5,  unit: "l" },
    ],
  },
  {
    desc: "unknown unit (pinch) → summed as-is",
    slots: [slot("recipe-1", 1), slot("recipe-2", 2)],
    ingredients: [
      ingredient("i1", "recipe-1", "cat-1", 2, "pinch"),
      ingredient("i2", "recipe-2", "cat-1", 3, "pinch"),
    ],
    catalog: [cat("cat-1", "salt")],
    expectedLength: 1,
    expectedItems: [{ name: "salt", total_quantity: 5, unit: "pinch" }],
  },
  {
    desc: "all generated items have is_bought: false",
    slots: [slot("recipe-1")],
    ingredients: [ingredient("i1", "recipe-1", "cat-1", 100, "g")],
    catalog: [cat("cat-1", "flour")],
    expectedLength: 1,
    expectedItems: [{ is_bought: false }],
  },
];

// ---------------------------------------------------------------------------
// Test runner
// ---------------------------------------------------------------------------

describe("generateShoppingItems", () => {
  cases.forEach((c) => it(c.desc, () => doTest(c)));
});
