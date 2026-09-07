import { useCallback, useEffect, useState } from "react";
import { supabase, syncConfigured } from "./client";
import { synchronise } from "./sync";

export type SyncState = "idle" | "running" | "error";

export interface SyncStore {
  configured: boolean;
  /** Adresse du compte connecté, ou null. */
  email: string | null;
  state: SyncState;
  message: string;
  /** Dernier passage réussi, en horloge locale. */
  lastSync: number | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  run: () => Promise<void>;
}

export function useSync(): SyncStore {
  const [email, setEmail] = useState<string | null>(null);
  const [state, setState] = useState<SyncState>("idle");
  const [message, setMessage] = useState("");
  const [lastSync, setLastSync] = useState<number | null>(null);

  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data }) => setEmail(data.session?.user.email ?? null));
    const { data } = supabase.auth.onAuthStateChange((_e, session) =>
      setEmail(session?.user.email ?? null),
    );
    return () => data.subscription.unsubscribe();
  }, []);

  const run = useCallback(async () => {
    if (!supabase || !email) return;
    setState("running");
    setMessage("");
    try {
      const r = await synchronise();
      setLastSync(r.at);
      setState("idle");
      setMessage(
        r.pushed === 0 && r.pulled === 0
          ? "Déjà à jour."
          : `${r.pushed} envoyé${r.pushed > 1 ? "s" : ""}, ${r.pulled} reçu${r.pulled > 1 ? "s" : ""}.`,
      );
    } catch (e) {
      setState("error");
      setMessage(e instanceof Error ? e.message : "Synchronisation impossible.");
    }
  }, [email]);

  // Au démarrage, au retour du réseau, et quand on revient sur l'app.
  useEffect(() => {
    if (!email) return;
    void run();
    const onBack = () => {
      if (document.visibilityState === "visible" && navigator.onLine) void run();
    };
    window.addEventListener("online", onBack);
    document.addEventListener("visibilitychange", onBack);
    return () => {
      window.removeEventListener("online", onBack);
      document.removeEventListener("visibilitychange", onBack);
    };
  }, [email, run]);

  return {
    configured: syncConfigured,
    email,
    state,
    message,
    lastSync,
    signIn: async (mail, password) => {
      if (!supabase) return;
      setState("running");
      setMessage("");
      const { error } = await supabase.auth.signInWithPassword({ email: mail, password });
      if (error) {
        setState("error");
        setMessage("Connexion refusée. Vérifie l'adresse et le mot de passe.");
        return;
      }
      setState("idle");
    },
    signOut: async () => {
      await supabase?.auth.signOut();
      setMessage("");
      setLastSync(null);
    },
    run,
  };
}
