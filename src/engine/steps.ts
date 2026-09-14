import type { BlockId } from "../data/blocks";
import { SEGMENTS } from "../data/segments";
import type { ExoRole, ModeId, PhaseId, PlacedBlock, Repeats, Segment, Zones } from "../data/types";
import { formatPace, swimPaces } from "../lib/swim";
import { selectExos } from "./selectExos";

export interface Step {
  kind: "warm" | "exo" | "seg";
  block: BlockId;
  title: string;
  dur: number;
  text?: string;
  cue?: string;
  sets?: string;
  load?: string;
  role?: ExoRole;
  zoneFocus?: boolean;
  /** Série d'intervalles, que le chrono déplie. */
  rep?: Repeats;
}

/** Faute de test CSS, on décrit l'intention plutôt que d'inventer une allure. */
const FALLBACK: Record<string, string> = {
  endurance: "allure facile",
  seuil: "allure de seuil",
  vitesse: "allure rapide",
};

/**
 * Remplace les jetons d'allure des séances de natation par les allures réelles.
 * Sans test CSS, le texte reste utilisable mais qualitatif.
 */
export function withPaces(text: string, css?: number) {
  return text.replace(/\{(endurance|seuil|vitesse)\}\/100m/g, (_, key: string) => {
    if (css === undefined) return FALLBACK[key];
    const paces = swimPaces(css);
    return `${formatPace(paces[key as keyof ReturnType<typeof swimPaces>])}/100m`;
  });
}

/** Durée d'une série d'intervalles, récupérations comprises, en minutes. */
export const repeatsMinutes = (r: Repeats) => r.n * r.work + (r.n - 1) * r.rest;

/**
 * Durée de chaque segment pour une séance de `total` minutes.
 *
 * Une série d'intervalles garde sa durée propre. Les autres segments se partagent le reste
 * au prorata, arrondis à la minute par la méthode du plus grand reste : la somme tombe juste
 * sur la durée choisie. Un segment souple ne descend pas sous 3 minutes, quitte à dépasser
 * quand la séance est plus courte que sa série d'intervalles.
 */
export function segmentMinutes(segs: Segment[], total: number): number[] {
  const fixed = segs.map((s) => (s.rep ? repeatsMinutes(s.rep) : 0));
  const flexible = segs.map((s) => (s.rep ? 0 : s.d));
  const flexTotal = flexible.reduce((a, v) => a + v, 0);
  const left = Math.max(0, total - fixed.reduce((a, v) => a + v, 0));

  const raw = flexible.map((d) => (flexTotal === 0 ? 0 : (d / flexTotal) * left));
  const out = raw.map(Math.floor);
  let spare = left - out.reduce((a, v) => a + v, 0);
  raw
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .filter(({ i }) => !segs[i].rep)
    .sort((a, b) => b.frac - a.frac)
    .forEach(({ i }) => {
      if (spare > 0) {
        out[i] += 1;
        spare -= 1;
      }
    });

  return segs.map((s, i) => (s.rep ? fixed[i] : Math.max(3, out[i])));
}

/**
 * Déroulé complet d'une séance, étape par étape. Un bloc de renfo donne un échauffement
 * puis ses exercices ; un bloc à durée donne ses segments, mis à l'échelle de la durée choisie.
 */
export function buildSteps(
  blocks: PlacedBlock[],
  phaseId: PhaseId,
  weekInBlock: number,
  zones: Zones,
  /** Allure de seuil en natation, en secondes par 100 m. */
  css?: number,
  mode: ModeId = "mixte",
): Step[] {
  const out: Step[] = [];

  blocks.forEach((b) => {
    const exos = selectExos(b.id, phaseId, b.dur, weekInBlock, zones, mode);
    if (exos) {
      out.push({
        kind: "warm",
        block: b.id,
        title: "Échauffement",
        dur: exos.warm.d,
        text: exos.warm.x,
      });
      exos.items.forEach((e) =>
        out.push({
          kind: "exo",
          block: b.id,
          title: e.n,
          dur: e.dur,
          cue: e.cue,
          sets: e.sets,
          load: e.load,
          role: e.role,
          zoneFocus: e.zoneFocus,
        }),
      );
      if (exos.left >= 5) {
        out.push({
          kind: "warm",
          block: b.id,
          title: "Temps libre",
          dur: exos.left,
          text: "Une série de plus sur le principal, ou mobilité hanches et chevilles.",
        });
      }
    }

    const segs = SEGMENTS[b.id];
    if (segs) {
      const minutes = segmentMinutes(segs, b.dur);
      segs.forEach((s, i) =>
        out.push({
          kind: "seg",
          block: b.id,
          title: s.t,
          dur: minutes[i],
          text: withPaces(s.x, css),
          rep: s.rep,
        }),
      );
    }
  });

  return out;
}

/** Nombre de cases à cocher pour un exercice, déduit de sa prescription. */
export function setCount(sets?: string) {
  const m = /^(\d+)/.exec(sets ?? "");
  return m ? Math.min(6, Number(m[1])) : 3;
}
