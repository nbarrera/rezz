import { Title } from "@solidjs/meta";
import { useNavigate } from "@solidjs/router";
import { createResource, For, Show } from "solid-js";
import { AppShell } from "~/components/AppShell";
import { Button } from "~/components/ui/Button";
import { useAuth } from "~/lib/auth";
import { listRecipes } from "~/lib/recipes";

export default function RecipeList() {
  const auth = useAuth();
  const navigate = useNavigate();

  const [recipes] = createResource(
    () => auth.session()?.user.id,
    listRecipes
  );

  return (
    <AppShell>
      <Title>Rezz — Recetas</Title>

      <div class="px-4 py-5">
        <div class="flex items-center justify-between mb-5">
          <h1 class="text-xl font-bold text-obsidian">Mis recetas</h1>
          <Button onClick={() => navigate("/recipes/new")}>
            + Nueva
          </Button>
        </div>

        <Show when={recipes.loading}>
          <p class="text-obsidian/40 text-sm text-center py-12">Cargando…</p>
        </Show>

        <Show when={recipes.error}>
          <p class="text-peach-dark text-sm text-center py-12">
            Error al cargar recetas.
          </p>
        </Show>

        <Show when={!recipes.loading && recipes()?.length === 0}>
          <div class="text-center py-16">
            <p class="text-obsidian/40 text-sm">Aún no tienes recetas.</p>
            <p class="text-obsidian/30 text-sm mt-1">¡Crea la primera!</p>
          </div>
        </Show>

        <ul class="flex flex-col gap-2">
          <For each={recipes()}>
            {(recipe) => (
              <li>
                <button
                  onClick={() => navigate(`/recipes/${recipe.id}`)}
                  class="w-full text-left bg-white/60 rounded-xl px-4 py-3.5 border border-obsidian/8 hover:bg-white/80 active:scale-[0.99] transition-all"
                >
                  <p class="font-medium text-obsidian">{recipe.name}</p>
                  <p class="text-xs text-obsidian/40 mt-0.5">
                    {recipe.servings} {recipe.servings === 1 ? "porción" : "porciones"}
                  </p>
                </button>
              </li>
            )}
          </For>
        </ul>
      </div>
    </AppShell>
  );
}
