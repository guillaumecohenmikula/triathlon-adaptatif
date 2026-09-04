import { useLiveQuery } from "dexie-react-hooks";
import type { BlockId } from "../data/blocks";
import type { PlacedSession } from "../data/types";
import type { StoredWeek } from "../engine/replan";
import { db } from "./db";

export interface WeekStore {
  stored?: StoredWeek;
  loaded: boolean;
  /** Fige l'état résolu de la semaine. Appelé seulement quand il a réellement changé. */
  save: (sessions: PlacedSession[], cancelled: string[], orphans: BlockId[], stamp: string) => void;
  /** « Je ne peux pas ce jour » : le créneau saute, sans être compté comme un échec. */
  cancelDay: (day: string) => void;
  restoreDay: (day: string) => void;
}

export function useWeek(week: string): WeekStore {
  const wrapped = useLiveQuery(async () => ({ row: await db.weeks.get(week) }), [week]);

  const save = (
    sessions: PlacedSession[],
    cancelled: string[],
    orphans: BlockId[],
    stamp: string,
  ) => {
    void db.weeks.put({ week, sessions, cancelled, orphans, stamp });
  };

  const setCancelled = (change: (list: string[]) => string[]) => {
    void db.transaction("rw", db.weeks, async () => {
      const row = await db.weeks.get(week);
      if (!row) return;
      await db.weeks.put({ ...row, cancelled: change(row.cancelled) });
    });
  };

  return {
    stored: wrapped?.row,
    loaded: wrapped !== undefined,
    save,
    cancelDay: (day) => setCancelled((l) => (l.includes(day) ? l : [...l, day])),
    restoreDay: (day) => setCancelled((l) => l.filter((d) => d !== day)),
  };
}
