import { useLiveQuery } from "dexie-react-hooks";
import type { BlockId } from "../data/blocks";
import type { PlacedSession, Slots } from "../data/types";
import type { StoredWeek } from "../engine/replan";
import { db, stamp } from "./db";

export interface WeekStore {
  stored?: StoredWeek;
  loaded: boolean;
  /** Fige l'état résolu de la semaine. Appelé seulement quand il a réellement changé. */
  save: (sessions: PlacedSession[], cancelled: string[], orphans: BlockId[], stamp: string) => void;
  /** « Je ne peux pas ce jour » : le créneau saute, sans être compté comme un échec. */
  cancelDay: (day: string) => void;
  restoreDay: (day: string) => void;
  /** Donne à cette semaine des créneaux qui lui sont propres. */
  setSlots: (slots: Slots) => void;
  /** Retire la surcharge : la semaine repasse sur le schéma habituel des réglages. */
  clearSlots: () => void;
}

export function useWeek(week: string): WeekStore {
  const wrapped = useLiveQuery(async () => ({ row: await db.weeks.get(week) }), [week]);

  /** Modifie la ligne de la semaine, en la créant au besoin. */
  const patch = (change: (row: StoredWeek) => StoredWeek) => {
    void db.transaction("rw", db.weeks, async () => {
      const row =
        (await db.weeks.get(week)) ??
        // Semaine encore jamais générée : le prochain rendu la remplira.
        ({ week, sessions: [], cancelled: [], orphans: [], stamp: "" } satisfies StoredWeek);
      await db.weeks.put(stamp(change(row)));
    });
  };

  const save = (
    sessions: PlacedSession[],
    cancelled: string[],
    orphans: BlockId[],
    stamp: string,
  ) => {
    // Les créneaux propres à la semaine ne sont pas touchés par une regénération.
    patch((row) => ({ ...row, sessions, cancelled, orphans, stamp }));
  };

  return {
    stored: wrapped?.row,
    loaded: wrapped !== undefined,
    save,
    cancelDay: (day) =>
      patch((row) => ({
        ...row,
        cancelled: row.cancelled.includes(day) ? row.cancelled : [...row.cancelled, day],
      })),
    restoreDay: (day) =>
      patch((row) => ({ ...row, cancelled: row.cancelled.filter((d) => d !== day) })),
    setSlots: (slots) => patch((row) => ({ ...row, slots })),
    clearSlots: () =>
      patch((row) => {
        const { slots: _drop, ...rest } = row;
        return rest;
      }),
  };
}
