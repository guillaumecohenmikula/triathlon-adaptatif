import { EXOS } from "../data/exercises";
import { WARMUPS } from "../data/warmups";
import type { Exercise, ExoRole, ModeId, PhaseId, Warmup, Zones } from "../data/types";

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
/**
 * Prescriptions transformables : « 4 × 8 », éventuellement suivi de « par bras ».
 * Tout le reste (durées en secondes, séries composées, « maximum moins 2 ») est laissé
 * intact : y appliquer un décalage mécanique produirait des consignes absurdes.
 */
const SIMPLE_REPS = /^(\d+) × (\d+)( par (?:bras|jambe|côté))?$/;

/**
 * Règle 4, appliquée à la séance elle-même : le mode change les répétitions des exercices
 * qui portent la charge. La performance en endurance vient de la force, donc de séries
 * courtes et lourdes ; l'hypertrophie vient du volume, donc de séries plus longues.
 * Les accessoires et le gainage ne bougent pas, leur rôle est le même dans les trois modes.
 */
function forMode(sets: string, role: ExoRole, mode: ModeId): string {
  if (mode === "mixte") return sets;
  if (role !== "principal" && role !== "secondaire") return sets;
  const m = SIMPLE_REPS.exec(sets);
  if (!m) return sets;
  const [, s, r, suffix = ""] = m;
  const reps = Number(r);
  const next = mode === "perf" ? Math.max(4, reps - 2) : Math.min(12, reps + 3);
  return `${s} × ${next}${suffix}`;
}

export function selectExos(
  blockId: string,
  phaseId: PhaseId,
  budget: number,
  weekInBlock: number,
  zones: Zones,
  mode: ModeId = "mixte",
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
        // Le mode fixe la plage de répétitions, puis la semaine allégée retire une série
        // et une zone ciblée en ajoute une.
        sets: (() => {
          const base = forMode(spec(e).s, e.role, mode);
          if (easy) return bump(base, -1, 2);
          return focused ? bump(base, 1, 0) : base;
        })(),
        load: spec(e).l,
    };
  });

  return { warm, items, left: Math.max(0, Math.round(left)) };
}
