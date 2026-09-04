import { EXOS } from "../data/exercises";
import { WARMUPS } from "../data/warmups";
import type { Exercise, ExoRole, PhaseId, Warmup, Zones } from "../data/types";

export interface ExoStep {
  n: string;
  role: ExoRole;
  cue: string;
  /** Coût en minutes, repos inclus. */
  dur: number;
  /** L'exercice touche une zone que l'utilisateur veut développer. */
  zoneFocus: boolean;
  sets: string;
  load: string;
}

export interface RenfoPlan {
  warm: Warmup;
  items: ExoStep[];
  /** Minutes restantes dans le créneau une fois les exercices posés. */
  left: number;
}

/** Un exercice est-il un bloc de renfo ? Sinon la séance est faite de segments à durée. */
export const isRenfo = (blockId: string) => blockId in EXOS;

/**
 * Règle 7 : remplit une séance de renfo. Budget = durée du créneau moins l'échauffement,
 * puis exercices par priorité tant que le budget tient.
 *
 * Le gainage n'a plus sa place réservée d'avance (révision du 2026-09-03) : les revues
 * systématiques lui reconnaissent un effet net sur l'endurance du tronc mais faible sur la
 * performance sportive spécifique, alors que la charge lourde et la pliométrie ont un effet
 * démontré. Il passe donc après elles, et saute quand le créneau est trop court.
 *
 * Retourne null si le bloc n'est pas un bloc de renfo.
 */
export function selectExos(
  blockId: string,
  phaseId: PhaseId,
  budget: number,
  weekInBlock: number,
  zones: Zones,
): RenfoPlan | null {
  const list = EXOS[blockId];
  const warm = WARMUPS[blockId];
  if (!list || !warm) return null;

  const easy = weekInBlock === 4;
  const spec = (e: Exercise) => e.p[phaseId] ?? e.p.base;
  // Semaine allégée : les durées sont rabotées de 25 %, plancher à 3 minutes.
  const cost = (e: Exercise) => (easy ? Math.max(3, Math.round(spec(e).c * 0.75)) : spec(e).c);

  const wanted = Object.keys(zones).filter((z) => zones[z as keyof Zones]);
  const hit = (e: Exercise) =>
    Boolean(e.z && wanted.length > 0 && e.z.some((z) => wanted.includes(z)));

  // Une zone ciblée fait remonter l'exercice de 2 crans.
  const rank = (e: Exercise) => e.prio - (hit(e) ? 2 : 0);
  const sorted = [...list].sort((a, b) => rank(a) - rank(b));

  let left = budget - warm.d;
  const out: Exercise[] = [];
  sorted.forEach((e) => {
    // Le premier exercice passe toujours, même si le créneau est trop court.
    if (out.length === 0 || cost(e) <= left) {
      left -= cost(e);
      out.push(e);
    }
  });

  const bump = (s: string, delta: number, floor: number) =>
    s.replace(/^(\d+)/, (m) => String(Math.max(floor, Number(m) + delta)));

  const items = out.map((e) => {
      const focused = hit(e) && e.role !== "gainage";
      return {
        n: e.n,
        role: e.role,
        cue: e.cue,
        dur: cost(e),
        zoneFocus: focused,
        // Semaine allégée : une série de moins. Zone ciblée : une série de plus.
        sets: easy
          ? bump(spec(e).s, -1, 2)
          : focused
            ? bump(spec(e).s, 1, 0)
            : spec(e).s,
        load: spec(e).l,
    };
  });

  return { warm, items, left: Math.max(0, Math.round(left)) };
}
