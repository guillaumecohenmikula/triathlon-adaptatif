import { BLOCKS } from "../data/blocks";
import { WEIGHT } from "../data/settings";
import type { Discipline, Journal, Targets } from "../data/types";

export interface Deficits {
  /** Nombre de semaines effectivement prises en compte (0, 1 ou 2). */
  weeks: number;
  /** Part manquante par discipline, de 0 (cible atteinte) à 1 (rien de fait). */
  byDisc: Partial<Record<Discipline, number>>;
}

/**
 * Règle 5 : compare le volume réellement fait sur les 2 dernières semaines révolues
 * aux cibles de la phase. La semaine en cours est exclue, elle n'est pas finie.
 */
export function deficits(journal: Journal, targets: Targets, currentWeek: string): Deficits {
  const weeks = [...new Set(Object.values(journal).map((e) => e.week))]
    .filter((w) => w < currentWeek)
    .sort()
    .slice(-2);
  if (weeks.length === 0) return { weeks: 0, byDisc: {} };

  const done: Partial<Record<Discipline, number>> = {};
  Object.values(journal).forEach((e) => {
    if (!weeks.includes(e.week)) return;
    e.blocks.forEach((b) => {
      const d = BLOCKS[b.id].disc;
      done[d] = (done[d] ?? 0) + b.dur * (WEIGHT[e.state] ?? 0);
    });
  });

  const byDisc: Partial<Record<Discipline, number>> = {};
  (Object.keys(targets) as Discipline[]).forEach((d) => {
    const t = targets[d] * weeks.length;
    byDisc[d] = t === 0 ? 0 : Math.max(0, (t - (done[d] ?? 0)) / t);
  });
  return { weeks: weeks.length, byDisc };
}
