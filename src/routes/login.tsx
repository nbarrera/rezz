import { Title } from "@solidjs/meta";
import { createSignal } from "solid-js";
import { useAuth } from "~/lib/auth";

export default function Login() {
  const auth = useAuth();
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [error, setError] = createSignal<string | null>(null);
  const [submitting, setSubmitting] = createSignal(false);

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error } = await auth.login(email(), password());
    setSubmitting(false);
    if (error) setError(error);
    // On success, AuthGuard in app.tsx redirects to /
  }

  return (
    <main class="min-h-screen bg-gardenia flex items-center justify-center px-4">
      <Title>Rezz — Iniciar sesión</Title>

      <div class="w-full max-w-sm">
        {/* Logo / heading */}
        <div class="text-center mb-8">
          <h1 class="text-4xl font-bold text-obsidian tracking-tight">Rezz</h1>
          <p class="text-obsidian/50 text-sm mt-1">Recipe &amp; Meal Planner</p>
        </div>

        {/* Card */}
        <div class="bg-white/60 rounded-2xl p-8 shadow-sm border border-obsidian/8">
          <form onSubmit={handleSubmit} class="flex flex-col gap-5">
            <div class="flex flex-col gap-1.5">
              <label for="email" class="text-sm font-medium text-obsidian">
                Correo
              </label>
              <input
                id="email"
                type="email"
                required
                autocomplete="email"
                value={email()}
                onInput={(e) => setEmail(e.currentTarget.value)}
                class="rounded-lg border border-obsidian/20 bg-gardenia/60 px-3 py-2.5 text-obsidian placeholder:text-obsidian/30 focus:outline-none focus:ring-2 focus:ring-biscay focus:border-transparent transition"
                placeholder="tu@correo.com"
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label for="password" class="text-sm font-medium text-obsidian">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                required
                autocomplete="current-password"
                value={password()}
                onInput={(e) => setPassword(e.currentTarget.value)}
                class="rounded-lg border border-obsidian/20 bg-gardenia/60 px-3 py-2.5 text-obsidian placeholder:text-obsidian/30 focus:outline-none focus:ring-2 focus:ring-biscay focus:border-transparent transition"
                placeholder="••••••••"
              />
            </div>

            {/* Error message */}
            {error() && (
              <p class="text-sm text-peach-dark bg-peach-light/40 rounded-lg px-3 py-2 border border-peach/40">
                {error()}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting()}
              class="mt-1 rounded-lg bg-biscay text-white font-medium py-2.5 hover:bg-biscay-dark active:scale-95 disabled:opacity-50 transition-all"
            >
              {submitting() ? "Entrando…" : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
