import { createSignal, onMount, onCleanup } from "solid-js";

const DISMISSED_KEY = "pwa-install-dismissed";

export function useInstallPrompt() {
  const [prompt, setPrompt] = createSignal<any>(null);
  const [dismissed, setDismissed] = createSignal(
    typeof localStorage !== "undefined" &&
      localStorage.getItem(DISMISSED_KEY) === "1"
  );

  onMount(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    onCleanup(() => window.removeEventListener("beforeinstallprompt", handler));
  });

  async function install() {
    const p = prompt();
    if (!p) return;
    p.prompt();
    const { outcome } = await p.userChoice;
    if (outcome === "accepted") setPrompt(null);
  }

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setDismissed(true);
  }

  const show = () => !!prompt() && !dismissed();
  return { show, install, dismiss };
}
