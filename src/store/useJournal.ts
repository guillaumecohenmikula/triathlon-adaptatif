import { useLiveQuery } from "dexie-react-hooks";
import { useMemo } from "react";
import type { Journal, PlacedBlock, PlaceId, SessionState } from "../data/types";
import { db, journalKey, stamp } from "./db";

export interface JournalStore {
  journal: Journal;
  /** Repose sur un basculement : re-marquer le même état efface l'entrée. */
  mark: (
    week: string,
    day: string,
    place: PlaceId,
    blocks: PlacedBlock[],
    state: SessionState,
  ) => void;
}

export function useJournal(): JournalStore {
  const rows = useLiveQuery(() => db.journal.toArray(), [], []);

  const journal: Journal = useMemo(
    () =>
      Object.fromEntries(
        rows
          .filter((r) => !r.deleted)
          .map((r) => [
          r.key,
            { week: r.week, day: r.day, place: r.place, blocks: r.blocks, state: r.state },
          ]),
      ),
    [rows],
  );

  const mark = (
    week: string,
    day: string,
    place: PlaceId,
    blocks: PlacedBlock[],
    state: SessionState,
  ) => {
    const key = journalKey(week, day);
    void db.transaction("rw", db.journal, async () => {
      const existing = await db.journal.get(key);
      // Re-cliquer le même état efface le bilan. On garde une trace pour que la
      // suppression se propage aux autres appareils au lieu de réapparaître.
      if (existing && !existing.deleted && existing.state === state) {
        await db.journal.put(stamp({ ...existing, deleted: true }));
      } else {
        await db.journal.put(stamp({ key, week, day, place, blocks, state, deleted: false }));
      }
    });
  };

  return { journal, mark };
}
