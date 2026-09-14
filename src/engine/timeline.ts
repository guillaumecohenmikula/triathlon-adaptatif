import { BLOCKS } from "../data/blocks";
import type { Step } from "./steps";

/** Une phase du chrono : un échauffement, un effort, une récupération. */
export interface TimerPhase {
  label: string;
  /** Secondes. */
  sec: number;
  kind: "steady" | "work" | "rest";
  text?: string;
  /** Index de l'étape de séance d'où vient la phase. */
  step: number;
}

/**
 * Le chrono ne sert que là où le téléphone suit : course et vélo. En piscine on se fie
 * à l'horloge du bassin, et le renfo a son propre minuteur de repos.
 */
export const timeable = (steps: Step[]) =>
  steps.length > 0 &&
  steps.every((s) => s.kind === "seg" && BLOCKS[s.block].disc !== "natation");

/** Déroule les étapes en phases chronométrées, en dépliant les séries d'intervalles. */
export function timeline(steps: Step[]): TimerPhase[] {
  return steps.flatMap((s, step): TimerPhase[] => {
    if (!s.rep) return [{ label: s.title, sec: s.dur * 60, kind: "steady", text: s.text, step }];
    const { n, work, rest } = s.rep;
    const easy =
      BLOCKS[s.block].disc === "velo"
        ? "Résistance minimale, cadence libre. Relâche les épaules et respire."
        : "Trot très souple. Relâche les épaules et respire.";
    return Array.from({ length: n }, (_, i): TimerPhase[] => {
      const effort: TimerPhase = {
        label: `Effort ${i + 1} sur ${n}`,
        sec: work * 60,
        kind: "work",
        text: s.text,
        step,
      };
      if (i === n - 1) return [effort];
      return [effort, { label: "Récupération", sec: rest * 60, kind: "rest", text: easy, step }];
    }).flat();
  });
}

export const totalSeconds = (phases: TimerPhase[]) => phases.reduce((a, p) => a + p.sec, 0);

/**
 * Où en est le chrono après `elapsed` secondes : la phase en cours, ce qu'il en reste,
 * et quand elle a commencé. Au-delà de la dernière phase, `index` vaut la longueur.
 */
export function locate(phases: TimerPhase[], elapsed: number) {
  let start = 0;
  for (let i = 0; i < phases.length; i++) {
    const end = start + phases[i].sec;
    if (elapsed < end) return { index: i, remaining: end - elapsed, start };
    start = end;
  }
  return { index: phases.length, remaining: 0, start };
}
