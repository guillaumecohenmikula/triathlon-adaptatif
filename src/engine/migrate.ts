import { BLOCKS } from "../data/blocks";
import type { BlockId } from "../data/blocks";
import type { ActivityId, Item, Session, SessionState } from "../data/types";

/*
 * Conversion de l'ancien carnet (journal, semaines, séances extra) vers le nouveau
 * modèle de séances. Les identifiants sont déterministes : deux appareils qui migrent
 * chacun de leur côté doivent produire les mêmes, sinon la synchronisation duplique tout.
 */

interface LegacyBlock {
  id: BlockId;
  dur: number;
}

export interface LegacyJournal {
  key: string;
  week: string;
  day: string;
  blocks: LegacyBlock[];
  state: SessionState;
  deleted?: boolean;
}

export interface LegacyWeek {
  week: string;
  picked?: { id: string; day: string; blocks: LegacyBlock[] }[];
  deleted?: boolean;
}

export interface LegacyExtra {
  id: string;
  week: string;
  day: string;
  activity: ActivityId;
  label?: string;
  dur: number;
  km?: number;
  rpe?: number;
  note?: string;
  deleted?: boolean;
}

const ACTIVITY_LABEL: Record<ActivityId, string> = {
  course: "Course",
  velo: "Vélo",
  natation: "Natation",
  renfo: "Renfo",
  autre: "Autre activité",
};

const idOf = (week: string, sessionId: string) => `s-${week}-${sessionId}`;

const titleOf = (blocks: LegacyBlock[]) => blocks.map((b) => BLOCKS[b.id].label).join(" + ");

const minutesOf = (blocks: LegacyBlock[]) => blocks.reduce((a, b) => a + b.dur, 0);

const itemsOf = (id: string, blocks: LegacyBlock[]): Item[] =>
  blocks.map((b, i) => ({
    id: `${id}-${i}`,
    label: BLOCKS[b.id].label,
    kind: "time" as const,
    minutes: b.dur,
  }));

/** Reconstruit le carnet à partir des trois anciennes tables. */
export function migrate(
  journal: LegacyJournal[],
  weeks: LegacyWeek[],
  extras: LegacyExtra[],
): Session[] {
  const out = new Map<string, Session>();

  weeks
    .filter((w) => !w.deleted)
    .forEach((w) =>
      (w.picked ?? []).forEach((p) => {
        if (p.blocks.length === 0) return;
        const id = idOf(w.week, p.id);
        out.set(id, {
          id,
          week: w.week,
          day: p.day,
          title: titleOf(p.blocks),
          disc: BLOCKS[p.blocks[0].id].disc,
          items: itemsOf(id, p.blocks),
        });
      }),
    );

  journal
    .filter((j) => !j.deleted && j.blocks.length > 0)
    .forEach((j) => {
      // La clé porte « semaine|identifiant » ; l'identifiant d'avant les séances multiples
      // était le nom du jour, ce qui reste vrai ici.
      const id = idOf(j.week, j.key.slice(j.week.length + 1));
      const base = out.get(id) ?? {
        id,
        week: j.week,
        day: j.day,
        title: titleOf(j.blocks),
        disc: BLOCKS[j.blocks[0].id].disc,
        items: itemsOf(id, j.blocks),
      };
      out.set(id, {
        ...base,
        day: j.day,
        state: j.state,
        actual: { ...base.actual, minutes: minutesOf(j.blocks) },
      });
    });

  extras
    .filter((x) => !x.deleted)
    .forEach((x) => {
      const id = `x-${x.id}`;
      out.set(id, {
        id,
        week: x.week,
        day: x.day,
        title: x.label ?? ACTIVITY_LABEL[x.activity],
        disc: x.activity,
        items: [],
        state: "fait",
        note: x.note,
        actual: {
          minutes: x.dur,
          distance: x.km === undefined ? undefined : Math.round(x.km * 1000),
          rpe: x.rpe,
        },
      });
    });

  return [...out.values()];
}
