import type { BlockId } from "../data/blocks";
import { SEGMENTS } from "../data/segments";
import type { ExoRole, ModeId, PhaseId, PlacedBlock, Zones } from "../data/types";
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

/**
 * Déroulé complet d'une séance, étape par étape. Un bloc de renfo donne un échauffement
 * puis ses exercices ; un bloc à durée donne ses segments, mis à l'échelle du créneau réel.
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
      const scale = b.dur / segs.reduce((a, s) => a + s.d, 0);
      segs.forEach((s) =>
        out.push({
          kind: "seg",
          block: b.id,
          title: s.t,
          dur: Math.max(3, Math.round((s.d * scale) / 5) * 5),
          text: withPaces(s.x, css),
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
