import type { JSX } from "solid-js";
import { Show } from "solid-js";
import { A } from "@solidjs/router";
import { useAuth } from "~/lib/auth";
import { useInstallPrompt } from "~/lib/useInstallPrompt";

type AppShellProps = {
  children: JSX.Element;
};

export function AppShell(props: AppShellProps) {
  const auth = useAuth();
  const { show, install, dismiss } = useInstallPrompt();

  return (
    <div class="min-h-screen bg-gardenia flex flex-col">
      {/* Install banner */}
      <Show when={show()}>
        <div class="flex items-center justify-between gap-2 px-4 py-2.5 bg-biscay/20 border-b border-biscay/30 text-sm text-obsidian">
          <span>Agregá Rezz a tu pantalla de inicio</span>
          <div class="flex gap-2">
            <button
              onClick={install}
              class="px-3 py-1 rounded-lg bg-biscay text-white font-medium text-xs"
            >
              Instalar
            </button>
            <button onClick={dismiss} class="px-2 py-1 text-obsidian/40 text-xs">
              No, gracias
            </button>
          </div>
        </div>
      </Show>

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
        <A
          href="/menu"
          end={false}
          class="flex-1 flex flex-col items-center justify-center py-3 text-xs text-obsidian/40 transition"
          activeClass="text-biscay font-semibold"
        >
          Menú
        </A>
        <A
          href="/list"
          end={false}
          class="flex-1 flex flex-col items-center justify-center py-3 text-xs text-obsidian/40 transition"
          activeClass="text-biscay font-semibold"
        >
          Lista
        </A>
      </nav>
    </div>
  );
}
