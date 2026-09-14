import { BLOCKS, available } from "../data/blocks";
import type { BlockId } from "../data/blocks";
import { DAYS, WEIGHT } from "../data/settings";
import type {
  Access,
  Discipline,
  ExtraSession,
  IntensityZone,
  Journal,
  ModeId,
  Phase,
  PlannedSession,
  Targets,
} from "../data/types";

/*
 * Depuis le 2026-09-14, la semaine n'est plus construite par un moteur : Guil choisit
 * lui-même ses séances. Ce module ne place donc rien. Il range ce qui a été choisi,
 * et calcule le conseil qui accompagne le choix (séances de la phase, disciplines en
 * retard, répartition d'intensité).
 */

/** La semaine telle qu'elle est rangée en base. */
export interface StoredWeek {
  week: string;
  /**
   * Séances choisies. Absent sur les semaines écrites par l'ancien moteur automatique,
   * dont les autres champs ne sont plus lus.
   */
  picked?: PlannedSession[];
}

/** Bornes de la durée d'une séance programmée, en minutes. */
export const DUR_MIN = 10;
export const DUR_MAX = 240;
export const DUR_STEP = 5;

const dayIndex = (day: string) => DAYS.indexOf(day);

/** Tri par jour. Le tri est stable : deux séances d'un même jour gardent leur ordre d'ajout. */
export const byDay = (list: PlannedSession[]) =>
  [...list].sort((a, b) => dayIndex(a.day) - dayIndex(b.day));

export const minutesOf = (s: PlannedSession) => s.blocks.reduce((a, b) => a + b.dur, 0);

export const newId = (): string =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;

/**
 * Bilans de l'ancien format « semaine|Jour », reconvertis en séances.
 *
 * On ne reprend de l'ancien moteur que ce qui porte un bilan. Le reste n'était qu'une
 * proposition jamais validée : l'afficher reviendrait à choisir encore à la place de Guil.
 */
export function legacySessions(journal: Journal, week: string): PlannedSession[] {
  return Object.entries(journal)
    .filter(([key, e]) => e.week === week && key === `${week}|${e.day}`)
    .map(([, e]) => ({ id: e.day, day: e.day, blocks: e.blocks }));
}

/** Les séances d'une semaine : celles choisies, ou à défaut celles héritées de l'ancien moteur. */
export function sessionsOf(
  stored: StoredWeek | undefined,
  journal: Journal,
  week: string,
): PlannedSession[] {
  return byDay(stored?.picked ?? legacySessions(journal, week));
}

export const addSession = (
  list: PlannedSession[],
  day: string,
  block: BlockId,
  dur: number,
  id: string,
) => byDay([...list, { id, day, blocks: [{ id: block, dur }] }]);

export const moveSession = (list: PlannedSession[], id: string, day: string) =>
  byDay(list.map((s) => (s.id === id ? { ...s, day } : s)));

/** Seule une séance d'un bloc se redimensionne : répartir une durée entre deux blocs serait arbitraire. */
export const resizeSession = (list: PlannedSession[], id: string, dur: number) =>
  list.map((s) =>
    s.id === id && s.blocks.length === 1 ? { ...s, blocks: [{ ...s.blocks[0], dur }] } : s,
  );

export const removeSession = (list: PlannedSession[], id: string) =>
  list.filter((s) => s.id !== id);

/** Les blocs de renfo en split haut/bas, remplacés par le full body hors mode performance. */
const SPLIT_IDS: BlockId[] = ["strLow", "strUp", "strLowHome", "strUpHome"];
const FULL_IDS: BlockId[] = ["strFull", "strFullHome"];

/**
 * Règle 4 : le mode recompose la liste ordonnée de blocs de la phase.
 * En mode physique le full body remonte en 2e priorité, en mode équilibré il reste plus bas.
 */
export function planFor(phase: Phase, mode: ModeId): BlockId[] {
  if (mode === "perf") return phase.plan;
  const base = phase.plan.filter((id) => !SPLIT_IDS.includes(id));
  if (mode === "physique") return [...base.slice(0, 1), ...FULL_IDS, ...base.slice(1)];
  return [...base.slice(0, 3), ...FULL_IDS, ...base.slice(3)];
}

/** Les séances conseillées pour la phase, dans l'ordre du plan, parmi celles réalisables. */
export const recommended = (phase: Phase, mode: ModeId, access: Access): BlockId[] =>
  planFor(phase, mode).filter((id) => available(id, access));

export interface Done {
  /** Nombre de semaines terminées prises en compte (0, 1 ou 2). */
  weeks: number;
  minutes: Partial<Record<Discipline, number>>;
}

/**
 * Minutes réellement faites par discipline sur les deux dernières semaines terminées,
 * séances du programme et séances extra confondues. La semaine en cours est exclue,
 * elle n'est pas finie. Les activités « autre » ne comptent dans aucune discipline.
 */
export function doneByDiscipline(
  journal: Journal,
  extras: ExtraSession[],
  currentWeek: string,
): Done {
  const weeks = [...new Set([...Object.values(journal), ...extras].map((e) => e.week))]
    .filter((w) => w < currentWeek)
    .sort()
    .slice(-2);

  const minutes: Partial<Record<Discipline, number>> = {};
  const add = (d: Discipline, m: number) => (minutes[d] = (minutes[d] ?? 0) + m);

  Object.values(journal).forEach((e) => {
    if (!weeks.includes(e.week)) return;
    e.blocks.forEach((b) => add(BLOCKS[b.id].disc, b.dur * (WEIGHT[e.state] ?? 0)));
  });
  extras.forEach((x) => {
    if (weeks.includes(x.week) && x.activity !== "autre") add(x.activity, x.dur);
  });

  return { weeks: weeks.length, minutes };
}

/**
 * Règle 5, en conseil et non plus en placement : une discipline est en retard quand sa part
 * du volume réel est inférieure d'au moins 20 % à la part que la phase lui donne.
 *
 * On compare des parts et non des minutes : le volume total dépend de l'emploi du temps,
 * et trois séances par semaine ne doivent pas mettre toutes les disciplines en retard.
 * Renvoyé du plus en retard au moins en retard.
 */
export function lagging(done: Done, targets: Targets): Discipline[] {
  const total = Object.values(done.minutes).reduce((a, v) => a + (v ?? 0), 0);
  const targetTotal = Object.values(targets).reduce((a, v) => a + v, 0);
  if (total === 0 || targetTotal === 0) return [];

  return (Object.keys(targets) as Discipline[])
    .map((d) => {
      const expected = (targets[d] / targetTotal) * total;
      return { d, gap: expected === 0 ? 0 : (expected - (done.minutes[d] ?? 0)) / expected };
    })
    .filter((x) => x.gap > 0.2)
    .sort((a, b) => b.gap - a.gap)
    .map((x) => x.d);
}

/** Minutes programmées par discipline sur la semaine. */
export function plannedByDiscipline(sessions: PlannedSession[]) {
  const out: Partial<Record<Discipline, number>> = {};
  sessions.forEach((s) =>
    s.blocks.forEach((b) => {
      const d = BLOCKS[b.id].disc;
      out[d] = (out[d] ?? 0) + b.dur;
    }),
  );
  return out;
}

/** Répartition du volume aérobie de la semaine, en minutes puis en part du total. */
export function intensityMix(sessions: PlannedSession[]) {
  const min: Record<IntensityZone, number> = { basse: 0, seuil: 0, haute: 0 };
  sessions.forEach((s) =>
    s.blocks.forEach((b) => {
      const zone = BLOCKS[b.id].zone;
      if (zone) min[zone] += b.dur;
    }),
  );
  const total = min.basse + min.seuil + min.haute;
  const pct = (v: number) => (total === 0 ? 0 : Math.round((v / total) * 100));
  return {
    minutes: min,
    total,
    part: { basse: pct(min.basse), seuil: pct(min.seuil), haute: pct(min.haute) },
  };
}
