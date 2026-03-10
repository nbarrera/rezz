import { createSignal, For, onCleanup, Show } from "solid-js";
import { searchCatalog } from "~/lib/recipes";
import type { IngredientDraft } from "~/lib/recipes";

type IngredientRowProps = {
  row: IngredientDraft;
  userId: string;
  onChange: (patch: Partial<IngredientDraft>) => void;
  onRemove: () => void;
};

const inputClass =
  "rounded-lg border border-obsidian/20 bg-gardenia/60 px-2 py-2 text-obsidian text-sm placeholder:text-obsidian/30 focus:outline-none focus:ring-2 focus:ring-biscay focus:border-transparent transition w-full";

export function IngredientRow(props: IngredientRowProps) {
  const [suggestions, setSuggestions] = createSignal<{ id: string; name: string }[]>([]);
  const [showDropdown, setShowDropdown] = createSignal(false);
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

  function handleNameInput(value: string) {
    props.onChange({ nameInput: value, catalogId: null });
    clearTimeout(debounceTimer);
    if (!value.trim()) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    debounceTimer = setTimeout(async () => {
      const results = await searchCatalog(props.userId, value);
      setSuggestions(results);
      setShowDropdown(results.length > 0);
    }, 300);
  }

  function selectSuggestion(id: string, name: string) {
    props.onChange({ nameInput: name, catalogId: id });
    setSuggestions([]);
    setShowDropdown(false);
  }

  function handleNameBlur() {
    // Small delay so a suggestion click fires before dropdown closes
    setTimeout(() => setShowDropdown(false), 150);
  }

  onCleanup(() => clearTimeout(debounceTimer));

  return (
    <div class="grid grid-cols-[1fr_4rem_5rem_2rem] gap-2 items-start relative">
      {/* Name with autocomplete */}
      <div class="relative">
        <input
          type="text"
          placeholder="Ingrediente"
          value={props.row.nameInput}
          onInput={(e) => handleNameInput(e.currentTarget.value)}
          onBlur={handleNameBlur}
          onFocus={() => suggestions().length > 0 && setShowDropdown(true)}
          class={inputClass}
        />
        <Show when={showDropdown() && suggestions().length > 0}>
          <ul class="absolute left-0 right-0 top-full mt-1 z-20 bg-white rounded-lg border border-obsidian/10 shadow-lg overflow-hidden">
            <For each={suggestions()}>
              {(s) => (
                <li>
                  <button
                    type="button"
                    onMouseDown={() => selectSuggestion(s.id, s.name)}
                    class="w-full text-left px-3 py-2 text-sm text-obsidian hover:bg-biscay-light transition"
                  >
                    {s.name}
                  </button>
                </li>
              )}
            </For>
          </ul>
        </Show>
      </div>

      {/* Quantity */}
      <input
        type="number"
        min="0"
        step="any"
        placeholder="Cant."
        value={props.row.quantity}
        onInput={(e) => props.onChange({ quantity: e.currentTarget.value })}
        class={inputClass}
      />

      {/* Unit */}
      <input
        type="text"
        placeholder="Unidad"
        value={props.row.unit}
        onInput={(e) => props.onChange({ unit: e.currentTarget.value })}
        class={inputClass}
      />

      {/* Remove */}
      <button
        type="button"
        onClick={props.onRemove}
        class="h-9 w-8 flex items-center justify-center rounded-lg text-obsidian/30 hover:text-peach-dark hover:bg-peach-light/30 transition text-lg leading-none"
        aria-label="Eliminar ingrediente"
      >
        ×
      </button>
    </div>
  );
}
