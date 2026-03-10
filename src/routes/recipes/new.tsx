import { Title } from "@solidjs/meta";
import { useNavigate } from "@solidjs/router";
import { AppShell } from "~/components/AppShell";
import { RecipeForm } from "~/components/RecipeForm";

export default function NewRecipe() {
  const navigate = useNavigate();

  return (
    <AppShell>
      <Title>Rezz — Nueva receta</Title>

      <div class="flex items-center gap-3 px-4 py-4 border-b border-obsidian/8">
        <button
          onClick={() => navigate("/recipes")}
          class="text-obsidian/50 hover:text-obsidian transition text-sm"
        >
          ← Volver
        </button>
        <h1 class="font-semibold text-obsidian">Nueva receta</h1>
      </div>

      <RecipeForm
        mode="create"
        onSave={() => navigate("/recipes")}
        onCancel={() => navigate("/recipes")}
      />
    </AppShell>
  );
}
