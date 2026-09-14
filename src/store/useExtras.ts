import { useLiveQuery } from "dexie-react-hooks";
import { useMemo } from "react";
import type { ExtraSession } from "../data/types";
import { db, stamp } from "./db";
import { track } from "./writes";

export interface ExtrasStore {
  /** Toutes les séances extra, toutes semaines confondues. */
  extras: ExtraSession[];
  /** Crée ou remplace, selon que l'identifiant existe déjà. */
  save: (extra: ExtraSession) => void;
  remove: (id: string) => void;
}

export function useExtras(): ExtrasStore {
  const rows = useLiveQuery(() => db.extras.toArray(), [], []);
  const extras = useMemo(() => rows.filter((r) => !r.deleted), [rows]);

  return {
    extras,
    save: (extra) =>
      track("Enregistrement de la séance extra", () =>
        db.extras.put(stamp({ ...extra, deleted: false })),
      ),
    remove: (id) =>
      track("Suppression de la séance extra", () =>
        db.transaction("rw", db.extras, async () => {
          const row = await db.extras.get(id);
          // Pierre tombale : la suppression doit gagner les autres appareils.
          if (row) await db.extras.put(stamp({ ...row, deleted: true }));
        }),
      ),
  };
}
