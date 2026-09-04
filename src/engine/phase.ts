import { PHASES } from "../data/phases";
import type { ModeId, Phase, Targets } from "../data/types";

const DAY_MS = 86_400_000;

/** Règle 1 : la phase se déduit du nombre de semaines restantes avant la course. */
export const phaseFor = (weeks: number): Phase =>
  weeks > 26 ? PHASES[0] : weeks > 12 ? PHASES[1] : weeks > 3 ? PHASES[2] : PHASES[3];

export interface Timing {
  /** Jours restants avant la course, jamais négatif. */
  days: number;
  weeks: number;
  phase: Phase;
  /** Règle 2 : une semaine sur quatre est allégée. */
  easyWeek: boolean;
  /** Position dans le cycle de 4, de 1 à 4. */
  weekInBlock: number;
}

/** Tout ce qui se déduit de la seule date de course. Pure : `now` est injectable pour les tests. */
export function timing(raceDate: string, now: number = Date.now()): Timing {
  const days = Math.max(0, Math.ceil((new Date(raceDate).getTime() - now) / DAY_MS));
  const weeks = Math.ceil(days / 7);
  const weekInBlock = weeks % 4 === 0 ? 4 : 4 - (weeks % 4);
  return { days, weeks, phase: phaseFor(weeks), easyWeek: weeks % 4 === 0, weekInBlock };
}

/**
 * Cibles hebdomadaires en minutes, une fois appliqués le format visé (`factor`)
 * et le mode. Règle 4 : en mode physique la cible renfo est multipliée par 1,8.
 */
export function targetsFor(phase: Phase, factor: number, mode: ModeId): Targets {
  const renfoBoost = mode === "physique" ? 1.8 : mode === "mixte" ? 1.2 : 1;
  const out = {} as Targets;
  (Object.keys(phase.targets) as (keyof Targets)[]).forEach((d) => {
    const m = d === "renfo" ? factor * renfoBoost : factor;
    out[d] = Math.round((phase.targets[d] * m) / 5) * 5;
  });
  return out;
}
