import { BLOCKS, available } from "../data/blocks";
import type { BlockId } from "../data/blocks";
import type {
  Access,
  GroupId,
  ModeId,
  Phase,
  PlaceId,
  PlacedSession,
  Slot,
} from "../data/types";
import type { Deficits } from "./deficits";

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

/**
 * Le plan de la phase, débarrassé des blocs hors de portée et réordonné par la compensation.
 * Règle 5 : un retard remonte la priorité du bloc, de 1 ou 2 crans (soit 1,5 ou 3 rangs).
 */
export function orderedPlan(
  phase: Phase,
  mode: ModeId,
  def: Deficits,
  access: Access,
): BlockId[] {
  const boost = (id: BlockId) => {
    const r = def.byDisc[BLOCKS[id].disc] ?? 0;
    return r > 0.45 ? 2 : r > 0.2 ? 1 : 0;
  };
  return planFor(phase, mode)
    .filter((id) => available(id, access))
    .map((id, i) => ({ id, rank: i - boost(id) * 1.5 }))
    .sort((a, b) => a.rank - b.rank)
    .map((x) => x.id);
}

/** Ce qui a déjà été consommé dans la semaine. Mutable : l'allocation le remplit au fur et à mesure. */
export interface AllocState {
  used: Set<BlockId>;
  groups: Set<GroupId>;
  /** Nombre de séances dures déjà placées cette semaine. */
  hard: number;
}

export const emptyState = (): AllocState => ({ used: new Set(), groups: new Set(), hard: 0 });

/** Enregistre un bloc comme consommé pour le reste de la semaine. */
export function consume(state: AllocState, id: BlockId) {
  state.used.add(id);
  const b = BLOCKS[id];
  if (b.group) state.groups.add(b.group);
  if (b.hard) state.hard += 1;
}

/**
 * Règle 6 : parcourt les créneaux dans l'ordre et y place le bloc prioritaire compatible,
 * puis empile un second bloc s'il reste au moins 25 minutes.
 *
 * `state` est modifié au passage, ce qui permet de reprendre une allocation déjà entamée
 * (replanification en cours de semaine) plutôt que de tout rejouer.
 */
export function allocate(
  slots: Slot[],
  plan: BlockId[],
  easyWeek: boolean,
  state: AllocState,
): PlacedSession[] {
  const factor = easyWeek ? 0.75 : 1;
  const hardCap = easyWeek ? 1 : 3;
  const placed: PlacedSession[] = [];

  const pick = (place: PlaceId, budget: number, noHard: boolean, stackOnly: boolean) =>
    plan.find((id) => {
      const b = BLOCKS[id];
      if (state.used.has(id) || b.place !== place || b.min > budget) return false;
      if (b.group && state.groups.has(b.group)) return false;
      if (stackOnly && !b.stack) return false;
      if (b.hard && (noHard || state.hard >= hardCap)) return false;
      return true;
    });

  slots.forEach((slot) => {
    const first = pick(slot.place, slot.duration, false, false);
    if (!first) return;
    consume(state, first);

    const d1 = Math.round(Math.min(BLOCKS[first].max, slot.duration * factor) / 5) * 5;
    const blocks = [{ id: first, dur: Math.max(BLOCKS[first].min, d1) }];

    const left = slot.duration - blocks[0].dur;
    if (left >= 25) {
      // Jamais deux séances dures dans le même créneau.
      const second = pick(slot.place, left, BLOCKS[first].hard, true);
      if (second) {
        consume(state, second);
        blocks.push({
          id: second,
          dur: Math.max(BLOCKS[second].min, Math.min(BLOCKS[second].max, left)),
        });
      }
    }
    placed.push({ ...slot, blocks });
  });

  return placed;
}

export interface BuiltWeek {
  placed: PlacedSession[];
  /** Blocs du plan qui n'ont pas trouvé de place, hors ceux évincés par leur groupe. */
  dropped: BlockId[];
}

/** Génération d'une semaine neuve, à partir des seuls créneaux déclarés. */
export function buildWeek(
  slots: Slot[],
  phase: Phase,
  easyWeek: boolean,
  def: Deficits,
  access: Access,
  mode: ModeId,
): BuiltWeek {
  const plan = orderedPlan(phase, mode, def, access);
  const state = emptyState();
  const placed = allocate(slots, plan, easyWeek, state);

  const dropped = plan.filter((id) => {
    const b = BLOCKS[id];
    return !state.used.has(id) && !(b.group && state.groups.has(b.group));
  });
  return { placed, dropped };
}
