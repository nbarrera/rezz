import { Title } from "@solidjs/meta";
import { useNavigate } from "@solidjs/router";
import { createSignal, onMount, For } from "solid-js";
import { AppShell } from "~/components/AppShell";
import { Button } from "~/components/ui/Button";
import { SlotCell } from "~/components/SlotCell";
import { useAuth } from "~/lib/auth";
import {
  getOrCreateMenu,
  getMenuSlots,
  addRecipeToSlot,
  removeFromSlot,
} from "~/lib/menus";
import type { SlotEntry } from "~/lib/menus";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DAYS = [
  { label: "Lun", value: 1 },
  { label: "Mar", value: 2 },
  { label: "Mié", value: 3 },
  { label: "Jue", value: 4 },
  { label: "Vie", value: 5 },
  { label: "Sáb", value: 6 },
  { label: "Dom", value: 7 },
];

const MEALS: { label: string; value: "lunch" | "dinner" }[] = [
  { label: "Almuerzo", value: "lunch" },
  { label: "Cena", value: "dinner" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MenuScreen() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [menuId, setMenuId] = createSignal<string | null>(null);
  const [slots, setSlots] = createSignal<SlotEntry[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);

  onMount(async () => {
    try {
      const userId = auth.session()!.user.id;
      const id = await getOrCreateMenu(userId);
      setMenuId(id);
      const entries = await getMenuSlots(id);
      setSlots(entries);
    } catch (err: any) {
      setError(err?.message ?? "Error al cargar el menú.");
    } finally {
      setLoading(false);
    }
  });

  function slotEntries(dayOfWeek: number, mealType: "lunch" | "dinner") {
    return slots().filter(
      (s) => s.dayOfWeek === dayOfWeek && s.mealType === mealType
    );
  }

  async function handleAdd(
    dayOfWeek: number,
    mealType: "lunch" | "dinner",
    recipeId: string,
    recipeName: string
  ) {
    const id = menuId();
    if (!id) return;
    try {
      await addRecipeToSlot(id, dayOfWeek, mealType, recipeId);
      // Optimistic update — we need a unique slotId; refetch to get it
      const entries = await getMenuSlots(id);
      setSlots(entries);
    } catch (err: any) {
      setError(err?.message ?? "Error al agregar receta.");
    }
  }

  async function handleRemove(slotId: string) {
    // Optimistic: remove locally first
    setSlots((prev) => prev.filter((s) => s.slotId !== slotId));
    try {
      await removeFromSlot(slotId);
    } catch (err: any) {
      // On failure reload from server
      const id = menuId();
      if (id) setSlots(await getMenuSlots(id));
      setError(err?.message ?? "Error al quitar receta.");
    }
  }

  return (
    <AppShell>
      <Title>Rezz — Menú semanal</Title>

      <div class="px-4 py-5">
        <h1 class="text-xl font-bold text-obsidian mb-5">Menú semanal</h1>

        {/* Error */}
        {error() && (
          <p class="text-sm text-peach-dark bg-peach-light/40 rounded-lg px-3 py-2 border border-peach/40 mb-4">
            {error()}
          </p>
        )}

        {/* Loading */}
        {loading() && (
          <p class="text-obsidian/40 text-sm text-center py-12">Cargando…</p>
        )}

        {/* Grid */}
        {!loading() && (
          <div class="overflow-x-auto -mx-4 px-4">
            <table class="w-full border-collapse" style="min-width: 560px">
              <thead>
                <tr>
                  <th class="w-20" />
                  <For each={DAYS}>
                    {(day) => (
                      <th class="text-center text-xs font-semibold text-obsidian/50 pb-2 px-1">
                        {day.label}
                      </th>
                    )}
                  </For>
                </tr>
              </thead>
              <tbody>
                <For each={MEALS}>
                  {(meal) => (
                    <tr>
                      <td class="py-1 pr-2 text-xs font-medium text-obsidian/50 align-top pt-2 w-20">
                        {meal.label}
                      </td>
                      <For each={DAYS}>
                        {(day) => (
                          <td class="px-0.5 py-0.5 align-top">
                            <div class="bg-white/60 rounded-lg border border-obsidian/8 min-h-[3.5rem]">
                              <SlotCell
                                menuId={menuId()!}
                                dayOfWeek={day.value}
                                mealType={meal.value}
                                entries={slotEntries(day.value, meal.value)}
                                userId={auth.session()!.user.id}
                                onAdd={(recipeId, recipeName) =>
                                  handleAdd(day.value, meal.value, recipeId, recipeName)
                                }
                                onRemove={handleRemove}
                              />
                            </div>
                          </td>
                        )}
                      </For>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        )}

        {/* Go to shopping list */}
        {!loading() && (
          <div class="mt-6">
            <Button class="w-full" onClick={() => navigate("/list")}>
              Ver lista de compras
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
