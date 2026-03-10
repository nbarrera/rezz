import { createSignal, For, Show } from "solid-js";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import { TextArea } from "~/components/ui/TextArea";
import { IngredientRow } from "~/components/IngredientRow";
import { saveRecipeWithIngredients } from "~/lib/recipes";
import type { IngredientDraft, RecipeWithIngredients } from "~/lib/recipes";
import { useAuth } from "~/lib/auth";

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

type RecipeFormState = {
  name: string;
  description: string;
  servings: string;
  ingredients: IngredientDraft[];
  submitting: boolean;
  error: string | null;
};

type RecipeFormAction =
  | { type: "SET_NAME"; value: string }
  | { type: "SET_DESCRIPTION"; value: string }
  | { type: "SET_SERVINGS"; value: string }
  | { type: "ADD_INGREDIENT" }
  | { type: "UPDATE_INGREDIENT"; rowId: string; patch: Partial<IngredientDraft> }
  | { type: "REMOVE_INGREDIENT"; rowId: string }
  | { type: "SET_SUBMITTING"; value: boolean }
  | { type: "SET_ERROR"; value: string | null };

function newIngredient(): IngredientDraft {
  return { rowId: crypto.randomUUID(), nameInput: "", catalogId: null, quantity: "", unit: "" };
}

function initialState(data?: RecipeWithIngredients): RecipeFormState {
  if (!data) {
    return {
      name: "",
      description: "",
      servings: "2",
      ingredients: [newIngredient()],
      submitting: false,
      error: null,
    };
  }
  return {
    name: data.name,
    description: data.description ?? "",
    servings: String(data.servings),
    ingredients:
      data.ingredients.length > 0
        ? data.ingredients.map((i) => ({
            rowId: crypto.randomUUID(),
            nameInput: i.name,
            catalogId: i.catalogId,
            quantity: String(i.quantity),
            unit: i.unit,
          }))
        : [newIngredient()],
    submitting: false,
    error: null,
  };
}

function reducer(state: RecipeFormState, action: RecipeFormAction): RecipeFormState {
  switch (action.type) {
    case "SET_NAME":        return { ...state, name: action.value };
    case "SET_DESCRIPTION": return { ...state, description: action.value };
    case "SET_SERVINGS":    return { ...state, servings: action.value };
    case "ADD_INGREDIENT":
      return { ...state, ingredients: [...state.ingredients, newIngredient()] };
    case "UPDATE_INGREDIENT":
      return {
        ...state,
        ingredients: state.ingredients.map((i) =>
          i.rowId === action.rowId ? { ...i, ...action.patch } : i
        ),
      };
    case "REMOVE_INGREDIENT":
      return {
        ...state,
        ingredients: state.ingredients.filter((i) => i.rowId !== action.rowId),
      };
    case "SET_SUBMITTING": return { ...state, submitting: action.value };
    case "SET_ERROR":      return { ...state, error: action.value };
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type RecipeFormProps = {
  mode: "create" | "edit";
  initialData?: RecipeWithIngredients;
  onSave: (recipeId: string) => void;
  onCancel: () => void;
};

export function RecipeForm(props: RecipeFormProps) {
  const auth = useAuth();
  const [state, setState] = createSignal(initialState(props.initialData));

  function dispatch(action: RecipeFormAction) {
    setState((s) => reducer(s, action));
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    const s = state();
    if (!s.name.trim()) {
      dispatch({ type: "SET_ERROR", value: "El nombre es obligatorio." });
      return;
    }
    dispatch({ type: "SET_SUBMITTING", value: true });
    dispatch({ type: "SET_ERROR", value: null });

    try {
      const userId = auth.session()!.user.id;
      const recipeId = await saveRecipeWithIngredients(
        userId,
        props.mode === "edit" ? (props.initialData?.id ?? null) : null,
        {
          name: s.name.trim(),
          description: s.description.trim(),
          servings: parseInt(s.servings, 10) || 1,
        },
        s.ingredients
      );
      props.onSave(recipeId);
    } catch (err: any) {
      dispatch({ type: "SET_ERROR", value: err?.message ?? "Error al guardar." });
      dispatch({ type: "SET_SUBMITTING", value: false });
    }
  }

  return (
    <form onSubmit={handleSubmit} class="flex flex-col gap-5 px-4 py-5">
      <Input
        id="recipe-name"
        label="Nombre"
        required
        placeholder="Ej. Pasta al pesto"
        value={state().name}
        onInput={(e: any) => dispatch({ type: "SET_NAME", value: e.currentTarget.value })}
      />

      <Input
        id="recipe-servings"
        label="Porciones"
        type="number"
        min="1"
        placeholder="2"
        value={state().servings}
        onInput={(e: any) => dispatch({ type: "SET_SERVINGS", value: e.currentTarget.value })}
      />

      <TextArea
        id="recipe-description"
        label="Descripción (opcional)"
        placeholder="Notas, instrucciones breves…"
        value={state().description}
        onInput={(e: any) => dispatch({ type: "SET_DESCRIPTION", value: e.currentTarget.value })}
      />

      {/* Ingredients */}
      <div class="flex flex-col gap-3">
        <p class="text-sm font-medium text-obsidian">Ingredientes</p>

        <div class="flex flex-col gap-2">
          <For each={state().ingredients}>
            {(row) => (
              <IngredientRow
                row={row}
                userId={auth.session()!.user.id}
                onChange={(patch) =>
                  dispatch({ type: "UPDATE_INGREDIENT", rowId: row.rowId, patch })
                }
                onRemove={() =>
                  dispatch({ type: "REMOVE_INGREDIENT", rowId: row.rowId })
                }
              />
            )}
          </For>
        </div>

        <Button
          type="button"
          variant="ghost"
          class="self-start text-sm"
          onClick={() => dispatch({ type: "ADD_INGREDIENT" })}
        >
          + Agregar ingrediente
        </Button>
      </div>

      {/* Error */}
      <Show when={state().error}>
        <p class="text-sm text-peach-dark bg-peach-light/40 rounded-lg px-3 py-2 border border-peach/40">
          {state().error}
        </p>
      </Show>

      {/* Actions */}
      <div class="flex gap-3 pt-2">
        <Button
          type="submit"
          disabled={state().submitting}
          class="flex-1"
        >
          {state().submitting ? "Guardando…" : "Guardar"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={props.onCancel}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
