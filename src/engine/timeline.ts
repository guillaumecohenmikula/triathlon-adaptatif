import type { ActivityId, Item } from "../data/types";

/** Une phase du chrono : un échauffement, un effort, une récupération. */
export interface TimerPhase {
  label: string;
  /** Secondes. */
  sec: number;
  kind: "steady" | "work" | "rest";
  text?: string;
  /** Identifiant de l'élément de séance d'où vient la phase. */
  item: string;
}

/**
 * Le chrono ne sert que là où le téléphone suit : une séance faite d'éléments à durée,
 * hors natation. En piscine on se fie à l'horloge du bassin, et le renfo a son minuteur
 * de repos.
 */
export const timeable = (items: Item[], disc: ActivityId) =>
  disc !== "natation" &&
  items.length > 0 &&
  items.every((i) => i.kind === "time" && ((i.minutes ?? 0) > 0 || i.rep));

/** Déroule les éléments en phases chronométrées, en dépliant les séries d'intervalles. */
export function timeline(items: Item[], disc: ActivityId): TimerPhase[] {
  const easy =
    disc === "velo"
      ? "Résistance minimale, cadence libre. Relâche les épaules et respire."
      : "Trot très souple. Relâche les épaules et respire.";

  return items.flatMap((i): TimerPhase[] => {
    if (!i.rep) {
      return [
        { label: i.label, sec: (i.minutes ?? 0) * 60, kind: "steady", text: i.note, item: i.id },
      ];
    }
    const { n, work, rest } = i.rep;
    return Array.from({ length: n }, (_, k): TimerPhase[] => {
      const effort: TimerPhase = {
        label: `Effort ${k + 1} sur ${n}`,
        sec: work * 60,
        kind: "work",
        text: i.note,
        item: i.id,
      };
      if (k === n - 1) return [effort];
      return [effort, { label: "Récupération", sec: rest * 60, kind: "rest", text: easy, item: i.id }];
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
