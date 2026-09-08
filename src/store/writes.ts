/**
 * Toutes les écritures passent par ici. Sans ça, un `void db.put(...)` avale
 * l'erreur : l'utilisateur touche un bouton, rien ne se passe, et rien ne l'explique.
 * On surveille aussi les écritures qui ne rendent jamais la main, symptôme connu
 * d'IndexedDB bloqué sur iOS.
 */

/** Au-delà, on considère que la base ne répond plus. */
const STALL_MS = 5000;

type Listener = (message: string | null) => void;

const listeners = new Set<Listener>();
let current: string | null = null;

const emit = (message: string | null) => {
  current = message;
  listeners.forEach((l) => l(message));
};

export const writeAlert = () => current;

export function subscribeWriteAlert(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

export const clearWriteAlert = () => emit(null);

/** Lance une écriture et signale son échec, ou son absence de réponse. */
export function track(label: string, op: () => Promise<unknown>): void {
  const stalled = setTimeout(
    () => emit(`${label} : la base de données ne répond pas.`),
    STALL_MS,
  );
  op().then(
    () => {
      clearTimeout(stalled);
      if (current) emit(null);
    },
    (e: unknown) => {
      clearTimeout(stalled);
      emit(`${label} : ${e instanceof Error ? e.message : "écriture refusée"}`);
    },
  );
}
