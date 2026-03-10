import { Title } from "@solidjs/meta";
import { createSignal, For, onMount, Show } from "solid-js";
import { AppShell } from "~/components/AppShell";
import { Button } from "~/components/ui/Button";
import { useAuth } from "~/lib/auth";
import { getOrCreateMenu } from "~/lib/menus";
import { formatQuantity } from "~/lib/units";
import {
  generateAndSaveShoppingList,
  getLatestShoppingList,
  markAllBought,
  toggleItem,
} from "~/lib/shoppingLists";
import type { ShoppingListItem, ShoppingListWithItems } from "~/lib/shoppingLists";

export default function ShoppingList() {
  const auth = useAuth();
  const [menuId, setMenuId] = createSignal<string | null>(null);
  const [list, setList] = createSignal<ShoppingListWithItems | null>(null);
  const [loading, setLoading] = createSignal(true);
  const [generating, setGenerating] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  onMount(async () => {
    try {
      const userId = auth.session()!.user.id;
      const id = await getOrCreateMenu(userId);
      setMenuId(id);
      setList(await getLatestShoppingList(id));
    } catch (err: any) {
      setError(err?.message ?? "Error al cargar la lista.");
    } finally {
      setLoading(false);
    }
  });

  async function handleGenerate() {
    const id = menuId();
    if (!id) return;
    setGenerating(true);
    setError(null);
    try {
      await generateAndSaveShoppingList(id);
      setList(await getLatestShoppingList(id));
    } catch (err: any) {
      setError(err?.message ?? "Error al generar la lista.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleToggle(item: ShoppingListItem) {
    const next = !item.isBought;
    // Optimistic update
    setList((prev) =>
      prev
        ? {
            ...prev,
            items: prev.items.map((i) =>
              i.itemId === item.itemId ? { ...i, isBought: next } : i
            ),
          }
        : prev
    );
    try {
      await toggleItem(item.itemId, next);
    } catch (err: any) {
      // Revert on failure
      setList((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.map((i) =>
                i.itemId === item.itemId ? { ...i, isBought: item.isBought } : i
              ),
            }
          : prev
      );
      setError(err?.message ?? "Error al actualizar el ítem.");
    }
  }

  async function handleMarkAll() {
    const l = list();
    if (!l) return;
    // Optimistic
    setList((prev) =>
      prev ? { ...prev, items: prev.items.map((i) => ({ ...i, isBought: true })) } : prev
    );
    try {
      await markAllBought(l.listId);
    } catch (err: any) {
      setList(await getLatestShoppingList(menuId()!));
      setError(err?.message ?? "Error al marcar todo.");
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("es-AR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  const pendingCount = () => list()?.items.filter((i) => !i.isBought).length ?? 0;

  return (
    <AppShell>
      <Title>Rezz — Lista de compras</Title>

      <div class="px-4 py-5">
        <div class="flex items-center justify-between mb-5">
          <h1 class="text-xl font-bold text-obsidian">Lista de compras</h1>
          <Button
            onClick={handleGenerate}
            disabled={generating()}
            class="text-sm py-1.5 px-3"
          >
            {generating() ? "Generando…" : "Nueva lista"}
          </Button>
        </div>

        {/* Error */}
        <Show when={error()}>
          <p class="text-sm text-peach-dark bg-peach-light/40 rounded-lg px-3 py-2 border border-peach/40 mb-4">
            {error()}
          </p>
        </Show>

        {/* Loading */}
        <Show when={loading()}>
          <p class="text-obsidian/40 text-sm text-center py-12">Cargando…</p>
        </Show>

        {/* No list yet */}
        <Show when={!loading() && !list()}>
          <div class="text-center py-16">
            <p class="text-obsidian/40 text-sm">Aún no generaste una lista.</p>
            <p class="text-obsidian/30 text-sm mt-1">
              Armá el menú semanal y luego tocá "Nueva lista".
            </p>
          </div>
        </Show>

        {/* List */}
        <Show when={!loading() && list()}>
          {(l) => (
            <>
              <p class="text-xs text-obsidian/40 mb-4">
                Generada el {formatDate(l().generatedAt)}
              </p>

              <ul class="flex flex-col gap-2 mb-5">
                <For each={l().items}>
                  {(item) => (
                    <li>
                      <button
                        type="button"
                        onClick={() => handleToggle(item)}
                        class="w-full flex items-center gap-3 bg-white/60 rounded-xl px-4 py-3 border border-obsidian/8 hover:bg-white/80 active:scale-[0.99] transition-all text-left"
                      >
                        {/* Checkbox */}
                        <span
                          class={`w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center transition ${
                            item.isBought
                              ? "bg-biscay border-biscay text-white"
                              : "border-obsidian/30 bg-white"
                          }`}
                        >
                          {item.isBought && (
                            <svg
                              class="w-3 h-3"
                              viewBox="0 0 12 12"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                            >
                              <path d="M2 6l3 3 5-5" stroke-linecap="round" stroke-linejoin="round" />
                            </svg>
                          )}
                        </span>

                        {/* Name */}
                        <span
                          class={`flex-1 text-sm font-medium transition ${
                            item.isBought ? "text-obsidian/30 line-through" : "text-obsidian"
                          }`}
                        >
                          {item.name}
                        </span>

                        {/* Quantity */}
                        <span
                          class={`text-sm transition ${
                            item.isBought ? "text-obsidian/20" : "text-obsidian/50"
                          }`}
                        >
                          {formatQuantity(item.totalQuantity, item.unit)}
                        </span>
                      </button>
                    </li>
                  )}
                </For>
              </ul>

              <Show when={pendingCount() > 0}>
                <Button
                  variant="secondary"
                  class="w-full"
                  onClick={handleMarkAll}
                >
                  Marcar todo como comprado
                </Button>
              </Show>
            </>
          )}
        </Show>
      </div>
    </AppShell>
  );
}
