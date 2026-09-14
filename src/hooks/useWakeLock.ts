import { useEffect } from "react";

/**
 * Garde l'écran allumé tant que `active` est vrai. Le verrou tombe quand l'app passe en
 * arrière-plan : on le redemande au retour. Sans effet là où le navigateur ne le permet pas.
 */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let stopped = false;

    const request = async () => {
      try {
        const next = await navigator.wakeLock.request("screen");
        if (stopped) void next.release();
        else lock = next;
      } catch {
        // Refusé (batterie faible, réglage) : l'écran s'éteindra normalement.
      }
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") void request();
    };

    void request();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      document.removeEventListener("visibilitychange", onVisible);
      void lock?.release();
    };
  }, [active]);
}
