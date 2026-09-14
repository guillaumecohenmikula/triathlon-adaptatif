import { useLiveQuery } from "dexie-react-hooks";
import type { BlockId } from "../data/blocks";
import type { PlannedSession } from "../data/types";
import type { StoredWeek } from "../engine/week";
import {
  addSession,
  legacySessions,
  moveSession,
  newId,
  removeSession,
  resizeSession,
} from "../engine/week";
import { db, journalKey, stamp } from "./db";
import type { JournalRow } from "./db";
import { track } from "./writes";

export interface WeekStore {
  stored?: StoredWeek;
  loaded: boolean;
  add: (day: string, block: BlockId, dur: number) => void;
  /** Change la séance de jour. Son bilan, s'il existe, la suit. */
  move: (id: string, day: string) => void;
  resize: (id: string, dur: number) => void;
  /** Retire la séance. Son bilan part avec elle, sinon il resterait orphelin dans l'historique. */
  remove: (id: string) => void;
}

export function useWeek(week: string): WeekStore {
  const wrapped = useLiveQuery(async () => ({ row: await db.weeks.get(week) }), [week]);

  /** Les séances en base, en convertissant au passage une semaine de l'ancien moteur. */
  const current = async (): Promise<PlannedSession[]> => {
    const row = await db.weeks.get(week);
    if (row?.picked) return row.picked;
    const entries = await db.journal.where("week").equals(week).toArray();
    return legacySessions(
      Object.fromEntries(entries.filter((e) => !e.deleted).map((e) => [e.key, e])),
      week,
    );
  };

  /** Réécrit la liste des séances, et le bilan de la séance visée si `entry` est fourni. */
  const edit = (
    label: string,
    change: (list: PlannedSession[]) => PlannedSession[],
    entry?: { id: string; update: (row: JournalRow) => JournalRow },
  ) =>
    track(label, () =>
      db.transaction("rw", db.weeks, db.journal, async () => {
        const list = await current();
        await db.weeks.put(stamp({ week, picked: change(list) }));
        if (!entry) return;
        const row = await db.journal.get(journalKey(week, entry.id));
        if (row && !row.deleted) await db.journal.put(stamp(entry.update(row)));
      }),
    );

  return {
    stored: wrapped?.row,
    loaded: wrapped !== undefined,
    add: (day, block, dur) =>
      edit("Ajout de la séance", (l) => addSession(l, day, block, dur, newId())),
    move: (id, day) =>
      edit("Déplacement de la séance", (l) => moveSession(l, id, day), {
        id,
        update: (row) => ({ ...row, day }),
      }),
    resize: (id, dur) =>
      edit("Changement de durée", (l) => resizeSession(l, id, dur), {
        id,
        update: (row) =>
          row.blocks.length === 1 ? { ...row, blocks: [{ ...row.blocks[0], dur }] } : row,
      }),
    remove: (id) =>
      edit("Retrait de la séance", (l) => removeSession(l, id), {
        id,
        update: (row) => ({ ...row, deleted: true }),
      }),
  };
}
