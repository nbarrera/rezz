import { MetaProvider, Title } from "@solidjs/meta";
import { Router, useLocation, useNavigate } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { createEffect, Show, Suspense } from "solid-js";
import { AuthContext, createAuthValue } from "~/lib/auth";
import "./app.css";

function AuthGuard(props: { children: any }) {
  const auth = createAuthValue();
  const navigate = useNavigate();
  const location = useLocation();

  createEffect(() => {
    if (auth.loading()) return;
    if (!auth.session() && location.pathname !== "/login") {
      navigate("/login", { replace: true });
    }
    if (auth.session() && location.pathname === "/login") {
      navigate("/", { replace: true });
    }
  });

  return (
    <AuthContext.Provider value={auth}>
      <Show
        when={!auth.loading()}
        fallback={
          <div class="min-h-screen bg-gardenia flex items-center justify-center">
            <span class="text-obsidian/50 text-sm">Cargando…</span>
          </div>
        }
      >
        {props.children}
      </Show>
    </AuthContext.Provider>
  );
}

export default function App() {
  return (
    <Router
      root={(props) => (
        <MetaProvider>
          <Title>Rezz</Title>
          <Suspense>
            <AuthGuard>{props.children}</AuthGuard>
          </Suspense>
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
