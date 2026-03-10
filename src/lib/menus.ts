import { supabase } from "./supabase";

export type SlotEntry = {
  slotId: string;
  recipeId: string;
  recipeName: string;
  dayOfWeek: number; // 1=Mon … 7=Sun
  mealType: "lunch" | "dinner";
};

export async function getOrCreateMenu(userId: string): Promise<string> {
  const { data, error } = await supabase
    .from("weekly_menus")
    .upsert({ user_id: userId }, { onConflict: "user_id" })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

export async function getMenuSlots(menuId: string): Promise<SlotEntry[]> {
  const { data, error } = await supabase
    .from("menu_slots")
    .select("id, day_of_week, meal_type, recipe_id, recipes(name)")
    .eq("menu_id", menuId);

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    slotId: row.id,
    recipeId: row.recipe_id,
    recipeName: row.recipes?.name ?? "",
    dayOfWeek: row.day_of_week,
    mealType: row.meal_type as "lunch" | "dinner",
  }));
}

export async function addRecipeToSlot(
  menuId: string,
  dayOfWeek: number,
  mealType: "lunch" | "dinner",
  recipeId: string
): Promise<void> {
  const { error } = await supabase.from("menu_slots").insert({
    menu_id: menuId,
    day_of_week: dayOfWeek,
    meal_type: mealType,
    recipe_id: recipeId,
  });

  if (error) throw error;
}

export async function removeFromSlot(slotId: string): Promise<void> {
  const { error } = await supabase
    .from("menu_slots")
    .delete()
    .eq("id", slotId);

  if (error) throw error;
}
