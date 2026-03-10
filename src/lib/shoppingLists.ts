import { supabase } from "./supabase";
import { generateShoppingItems } from "./shoppingList";

export type ShoppingListItem = {
  itemId: string;
  name: string;
  totalQuantity: number;
  unit: string;
  isBought: boolean;
};

export type ShoppingListWithItems = {
  listId: string;
  generatedAt: string;
  items: ShoppingListItem[];
};

export async function generateAndSaveShoppingList(
  menuId: string
): Promise<string> {
  // 1. Fetch slots
  const { data: slots, error: slotsErr } = await supabase
    .from("menu_slots")
    .select("*")
    .eq("menu_id", menuId);
  if (slotsErr) throw slotsErr;

  const recipeIds = [...new Set((slots ?? []).map((s: any) => s.recipe_id))];

  // 2. Fetch ingredients for those recipes
  const { data: ingredients, error: ingErr } = await supabase
    .from("ingredients")
    .select("*")
    .in("recipe_id", recipeIds.length > 0 ? recipeIds : ["__none__"]);
  if (ingErr) throw ingErr;

  const catalogIds = [
    ...new Set((ingredients ?? []).map((i: any) => i.catalog_ingredient_id)),
  ];

  // 3. Fetch catalog entries
  const { data: catalog, error: catErr } = await supabase
    .from("ingredient_catalog")
    .select("*")
    .in("id", catalogIds.length > 0 ? catalogIds : ["__none__"]);
  if (catErr) throw catErr;

  // 4. Run pure pipeline
  const items = generateShoppingItems(
    slots ?? [],
    ingredients ?? [],
    catalog ?? []
  );

  // 5. Insert shopping list row
  const { data: list, error: listErr } = await supabase
    .from("shopping_lists")
    .insert({ menu_id: menuId })
    .select("id")
    .single();
  if (listErr) throw listErr;

  // 6. Insert items
  if (items.length > 0) {
    const { error: itemsErr } = await supabase.from("shopping_items").insert(
      items.map((item) => ({
        shopping_list_id: list.id,
        name: item.name,
        total_quantity: item.total_quantity,
        unit: item.unit,
        is_bought: item.is_bought,
      }))
    );
    if (itemsErr) throw itemsErr;
  }

  return list.id;
}

export async function getLatestShoppingList(
  menuId: string
): Promise<ShoppingListWithItems | null> {
  const { data, error } = await supabase
    .from("shopping_lists")
    .select("id, generated_at, shopping_items(id, name, total_quantity, unit, is_bought)")
    .eq("menu_id", menuId)
    .order("generated_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // no rows
    throw error;
  }

  return {
    listId: data.id,
    generatedAt: data.generated_at,
    items: ((data.shopping_items as any[]) ?? []).map((i) => ({
      itemId: i.id,
      name: i.name,
      totalQuantity: i.total_quantity,
      unit: i.unit,
      isBought: i.is_bought,
    })),
  };
}

export async function toggleItem(
  itemId: string,
  isBought: boolean
): Promise<void> {
  const { error } = await supabase
    .from("shopping_items")
    .update({ is_bought: isBought })
    .eq("id", itemId);
  if (error) throw error;
}

export async function markAllBought(listId: string): Promise<void> {
  const { error } = await supabase
    .from("shopping_items")
    .update({ is_bought: true })
    .eq("shopping_list_id", listId);
  if (error) throw error;
}
