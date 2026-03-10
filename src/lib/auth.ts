import { createContext, createSignal, onCleanup, onMount, useContext } from "solid-js";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type AuthContextValue = {
  session: () => Session | null;
  loading: () => boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue>();

/** Call this once at the root of the app to create the auth state. */
export function createAuthValue(): AuthContextValue {
  const [session, setSession] = createSignal<Session | null>(null);
  const [loading, setLoading] = createSignal(true);

  onMount(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    onCleanup(() => subscription.unsubscribe());
  });

  return {
    session,
    loading,
    async login(email, password) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error: error?.message ?? null };
    },
    async logout() {
      await supabase.auth.signOut();
    },
  };
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthContext.Provider");
  return ctx;
}
