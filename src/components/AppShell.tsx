import type { JSX } from "solid-js";
import { A } from "@solidjs/router";
import { useAuth } from "~/lib/auth";

type AppShellProps = {
  children: JSX.Element;
};

export function AppShell(props: AppShellProps) {
  const auth = useAuth();

  return (
    <div class="min-h-screen bg-gardenia flex flex-col">
      {/* Top header */}
      <header class="fixed top-0 inset-x-0 z-10 bg-obsidian text-gardenia flex items-center justify-between px-4 h-14">
        <span class="font-bold tracking-tight text-lg">Rezz</span>
        <button
          onClick={() => auth.logout()}
          class="text-gardenia/60 text-sm hover:text-gardenia transition"
        >
          Salir
        </button>
      </header>

      {/* Content */}
      <main class="pt-14 pb-16 flex-1">{props.children}</main>

      {/* Bottom tab bar */}
      <nav class="fixed bottom-0 inset-x-0 z-10 bg-white/80 backdrop-blur border-t border-obsidian/10 flex">
        <A
          href="/recipes"
          end={false}
          class="flex-1 flex flex-col items-center justify-center py-3 text-xs text-obsidian/40 transition"
          activeClass="text-biscay font-semibold"
        >
          Recetas
        </A>
        <span class="flex-1 flex flex-col items-center justify-center py-3 text-xs text-obsidian/25 cursor-not-allowed select-none">
          Menú
        </span>
        <span class="flex-1 flex flex-col items-center justify-center py-3 text-xs text-obsidian/25 cursor-not-allowed select-none">
          Lista
        </span>
      </nav>
    </div>
  );
}
