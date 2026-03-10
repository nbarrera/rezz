import { Title } from "@solidjs/meta";
import { useNavigate, useParams } from "@solidjs/router";
import { createResource, Show } from "solid-js";
import { AppShell } from "~/components/AppShell";
import { Button } from "~/components/ui/Button";
import { RecipeForm } from "~/components/RecipeForm";
import { deleteRecipe, getRecipeWithIngredients } from "~/lib/recipes";

export default function EditRecipe() {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [recipe, { refetch }] = createResource(
    () => params.id,
    getRecipeWithIngredients
  );

  async function handleDelete() {
    if (!window.confirm("¿Eliminar esta receta?")) return;
    await deleteRecipe(params.id);
    navigate("/recipes");
  }

  return (
    <AppShell>
      <Title>Rezz — Editar receta</Title>

      <div class="flex items-center justify-between px-4 py-4 border-b border-obsidian/8">
        <div class="flex items-center gap-3">
          <button
            onClick={() => navigate("/recipes")}
            class="text-obsidian/50 hover:text-obsidian transition text-sm"
          >
            ← Volver
          </button>
          <h1 class="font-semibold text-obsidian">Editar receta</h1>
        </div>
        <Button variant="danger" onClick={handleDelete} class="text-sm py-1.5 px-3">
          Eliminar
        </Button>
      </div>

      <Show when={recipe.loading}>
        <p class="text-obsidian/40 text-sm text-center py-12">Cargando…</p>
      </Show>

      <Show when={recipe.error}>
        <p class="text-peach-dark text-sm text-center py-12">
          Error al cargar la receta.
        </p>
      </Show>

      <Show when={recipe()}>
        {(data) => (
          <RecipeForm
            mode="edit"
            initialData={data()}
            onSave={() => navigate("/recipes")}
            onCancel={() => navigate("/recipes")}
          />
        )}
      </Show>
    </AppShell>
  );
}
