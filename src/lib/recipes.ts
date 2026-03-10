import { supabase } from "./supabase";
import { getOwnerScope } from "./ownerScope";
import type { Database } from "./database.types";

type Recipe = Database["cooking"]["Tables"]["recipes"]["Row"];
type CatalogEntry = Database["cooking"]["Tables"]["ingredient_catalog"]["Row"];

export type { Recipe, CatalogEntry };

export type RecipeWithIngredients = Recipe & {
  ingredients: Array<{
    id: string;
    catalogId: string;
    name: string;
    quantity: number;
    unit: string;
  }>;
};

export type IngredientDraft = {
  rowId: string;
  nameInput: string;
  catalogId: string | null;
  quantity: string;
  unit: string;
};

// ---------------------------------------------------------------------------
// Recipe queries
// ---------------------------------------------------------------------------

export async function listRecipes(userId: string): Promise<Recipe[]> {
  const { data, error } = await supabase
    .from("recipes")
    .select("*")
    .match(getOwnerScope(userId))
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getRecipeWithIngredients(
  id: string
): Promise<RecipeWithIngredients | null> {
  const { data, error } = await supabase
    .from("recipes")
    .select(
      `*, ingredients(id, quantity, unit, catalog_ingredient_id, ingredient_catalog(id, name))`
    )
    .eq("id", id)
    .single();
  if (error) throw error;
  if (!data) return null;

  return {
    ...data,
    ingredients: (data.ingredients ?? []).map((row: any) => ({
      id: row.id,
      catalogId: row.catalog_ingredient_id,
      name: row.ingredient_catalog?.name ?? "",
      quantity: row.quantity,
      unit: row.unit,
    })),
  };
}

export async function createRecipe(
  userId: string,
  fields: { name: string; description: string; servings: number }
): Promise<string> {
  const { data, error } = await supabase
    .from("recipes")
    .insert({ ...getOwnerScope(userId), ...fields })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function updateRecipe(
  id: string,
  fields: { name?: string; description?: string; servings?: number }
): Promise<void> {
  const { error } = await supabase
    .from("recipes")
    .update(fields)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteRecipe(id: string): Promise<void> {
  const { error } = await supabase.from("recipes").delete().eq("id", id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Ingredients
// ---------------------------------------------------------------------------

export async function saveIngredients(
  recipeId: string,
  rows: Array<{ catalogId: string; quantity: number; unit: string }>
): Promise<void> {
  const { error: delError } = await supabase
    .from("ingredients")
    .delete()
    .eq("recipe_id", recipeId);
  if (delError) throw delError;

  if (rows.length === 0) return;

  const { error: insError } = await supabase.from("ingredients").insert(
    rows.map((r) => ({
      recipe_id: recipeId,
      catalog_ingredient_id: r.catalogId,
      quantity: r.quantity,
      unit: r.unit,
    }))
  );
  if (insError) throw insError;
}

// ---------------------------------------------------------------------------
// Ingredient catalog
// ---------------------------------------------------------------------------

export async function searchRecipes(
  userId: string,
  query: string
): Promise<{ id: string; name: string }[]> {
  if (!query.trim()) return [];
  const { data, error } = await supabase
    .from("recipes")
    .select("id, name")
    .match(getOwnerScope(userId))
    .ilike("name", `%${query.trim()}%`)
    .order("name")
    .limit(8);
  if (error) throw error;
  return data ?? [];
}

export async function searchCatalog(
  userId: string,
  query: string
): Promise<CatalogEntry[]> {
  if (!query.trim()) return [];
  const { data, error } = await supabase
    .from("ingredient_catalog")
    .select("*")
    .match(getOwnerScope(userId))
    .ilike("name", `%${query.trim().toLowerCase()}%`)
    .order("name")
    .limit(8);
  if (error) throw error;
  return data ?? [];
}

export async function upsertCatalogEntry(
  userId: string,
  name: string
): Promise<string> {
  const normalized = name.trim().toLowerCase();
  const { data, error } = await supabase
    .from("ingredient_catalog")
    .upsert({ ...getOwnerScope(userId), name: normalized }, { onConflict: "user_id,name" })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

// ---------------------------------------------------------------------------
// Orchestrated save (create or update recipe + ingredients)
// ---------------------------------------------------------------------------

export async function saveRecipeWithIngredients(
  userId: string,
  recipeId: string | null,
  fields: { name: string; description: string; servings: number },
  ingredients: IngredientDraft[]
): Promise<string> {
  // 1. Resolve any unmatched ingredient names into catalog IDs
  const resolved = await Promise.all(
    ingredients
      .filter((i) => i.nameInput.trim() !== "")
      .map(async (i) => ({
        catalogId: i.catalogId ?? (await upsertCatalogEntry(userId, i.nameInput)),
        quantity: parseFloat(i.quantity) || 0,
        unit: i.unit.trim(),
      }))
  );

  // 2. Create or update the recipe row
  const id =
    recipeId === null
      ? await createRecipe(userId, fields)
      : (await updateRecipe(recipeId, fields), recipeId);

  // 3. Replace ingredients
  await saveIngredients(id, resolved);

  return id;
}
