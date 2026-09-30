import { useLiveQuery } from "dexie-react-hooks";
import { useMemo } from "react";
import type { Actual, DoneItem, Item, Session, SessionState } from "../data/types";
import { db, stamp } from "./db";
import { track } from "./writes";

export interface SessionStore {
  /** Toutes les séances du carnet, tri fait par les vues. */
  sessions: Session[];
  loaded: boolean;
  add: (session: Session) => void;
  /** Modifie une séance existante. */
  patch: (id: string, change: Partial<Session>) => void;
  setItems: (id: string, items: Item[]) => void;
  /** Note ce qui a été fait sur un élément. Une valeur vide efface la ligne. */
  setDone: (id: string, itemId: string, done: DoneItem | undefined) => void;
  /** Bilan de la séance. Re-marquer le même état l'efface. */
  mark: (id: string, state: SessionState) => void;
  setActual: (id: string, actual: Actual) => void;
  remove: (id: string) => void;
}

export function useSessions(): SessionStore {
  const rows = useLiveQuery(() => db.sessions.toArray(), []);
  const sessions = useMemo(() => (rows ?? []).filter((r) => !r.deleted), [rows]);

  const edit = (label: string, id: string, change: (s: Session) => Session) =>
    track(label, () =>
      db.transaction("rw", db.sessions, async () => {
        const row = await db.sessions.get(id);
        if (row) await db.sessions.put(stamp(change(row)));
      }),
    );

  return {
    sessions,
    loaded: rows !== undefined,
    add: (session) =>
      track("Ajout de la séance", () => db.sessions.put(stamp({ ...session, deleted: false }))),
    patch: (id, change) => edit("Enregistrement de la séance", id, (s) => ({ ...s, ...change })),
    setItems: (id, items) => edit("Enregistrement de la séance", id, (s) => ({ ...s, items })),
    setDone: (id, itemId, done) =>
      edit("Enregistrement de la série", id, (s) => {
        const next = { ...s.done };
        if (done) next[itemId] = done;
        else delete next[itemId];
        return { ...s, done: next };
      }),
    mark: (id, state) =>
      edit("Enregistrement du bilan", id, (s) => ({
        ...s,
        state: s.state === state ? undefined : state,
      })),
    setActual: (id, actual) => edit("Enregistrement des chiffres", id, (s) => ({ ...s, actual })),
    // Pierre tombale : la suppression doit gagner les autres appareils.
    remove: (id) => edit("Suppression de la séance", id, (s) => ({ ...s, deleted: true }) as Session),
  };
}
