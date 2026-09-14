import { useEffect, useState } from "react";

/**
 * L'heure courante, rafraîchie tant que `active` est vrai. Les minuteurs se calculent
 * toujours à partir d'horodatages : si le téléphone suspend l'app, le temps affiché
 * au retour reste juste.
 */
export function useNow(active: boolean, every = 250) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), every);
    return () => clearInterval(id);
  }, [active, every]);
  return now;
}
