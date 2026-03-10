import { createSignal, For, onCleanup, Show } from "solid-js";
import { searchRecipes } from "~/lib/recipes";
import type { SlotEntry } from "~/lib/menus";

type SlotCellProps = {
  menuId: string;
  dayOfWeek: number;
  mealType: "lunch" | "dinner";
  entries: SlotEntry[];
  userId: string;
  onAdd: (recipeId: string, recipeName: string) => void;
  onRemove: (slotId: string) => void;
};

export function SlotCell(props: SlotCellProps) {
  const [adding, setAdding] = createSignal(false);
  const [query, setQuery] = createSignal("");
  const [suggestions, setSuggestions] = createSignal<{ id: string; name: string }[]>([]);
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  let inputRef: HTMLInputElement | undefined;

  function openAdd() {
    setAdding(true);
    setQuery("");
    setSuggestions([]);
    // Focus input on next tick after render
    setTimeout(() => inputRef?.focus(), 0);
  }

  function closeAdd() {
    setAdding(false);
    setQuery("");
    setSuggestions([]);
    clearTimeout(debounceTimer);
  }

  function handleInput(value: string) {
    setQuery(value);
    clearTimeout(debounceTimer);
    if (!value.trim()) {
      setSuggestions([]);
      return;
    }
    debounceTimer = setTimeout(async () => {
      const results = await searchRecipes(props.userId, value);
      setSuggestions(results);
    }, 300);
  }

  function selectRecipe(id: string, name: string) {
    props.onAdd(id, name);
    closeAdd();
  }

  function handleBlur() {
    setTimeout(() => closeAdd(), 150);
  }

  onCleanup(() => clearTimeout(debounceTimer));

  return (
    <div class="flex flex-col gap-1 min-h-[3rem] p-1.5">
      {/* Recipe chips */}
      <For each={props.entries}>
        {(entry) => (
          <span class="inline-flex items-center gap-1 bg-biscay-light text-obsidian text-xs rounded-md px-2 py-1 leading-tight">
            <span class="truncate max-w-[7rem]">{entry.recipeName}</span>
            <button
              type="button"
              onClick={() => props.onRemove(entry.slotId)}
              class="text-obsidian/40 hover:text-peach-dark transition flex-shrink-0 leading-none"
              aria-label="Quitar receta"
            >
              ×
            </button>
          </span>
        )}
      </For>

      {/* Add button / input */}
      <Show
        when={adding()}
        fallback={
          <button
            type="button"
            onClick={openAdd}
            class="text-obsidian/30 hover:text-biscay text-xs transition self-start leading-none"
            aria-label="Agregar receta"
          >
            + agregar
          </button>
        }
      >
        <div class="relative">
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar receta…"
            value={query()}
            onInput={(e) => handleInput(e.currentTarget.value)}
            onBlur={handleBlur}
            class="w-full rounded border border-obsidian/20 bg-white px-2 py-1 text-xs text-obsidian placeholder:text-obsidian/30 focus:outline-none focus:ring-1 focus:ring-biscay"
          />
          <Show when={suggestions().length > 0}>
            <ul class="absolute left-0 right-0 top-full mt-0.5 z-30 bg-white rounded border border-obsidian/10 shadow-lg overflow-hidden">
              <For each={suggestions()}>
                {(s) => (
                  <li>
                    <button
                      type="button"
                      onMouseDown={() => selectRecipe(s.id, s.name)}
                      class="w-full text-left px-2 py-1.5 text-xs text-obsidian hover:bg-biscay-light transition"
                    >
                      {s.name}
                    </button>
                  </li>
                )}
              </For>
            </ul>
          </Show>
        </div>
      </Show>
    </div>
  );
}
