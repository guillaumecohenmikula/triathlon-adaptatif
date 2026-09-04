import type { BlockId } from "../data/blocks";
import { SEGMENTS } from "../data/segments";
import type { ExoRole, PhaseId, PlacedBlock, Zones } from "../data/types";
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

/**
 * Déroulé complet d'une séance, étape par étape. Un bloc de renfo donne un échauffement
 * puis ses exercices ; un bloc à durée donne ses segments, mis à l'échelle du créneau réel.
 */
export function buildSteps(
  blocks: PlacedBlock[],
  phaseId: PhaseId,
  weekInBlock: number,
  zones: Zones,
): Step[] {
  const out: Step[] = [];

  blocks.forEach((b) => {
    const exos = selectExos(b.id, phaseId, b.dur, weekInBlock, zones);
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
          text: s.x,
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
