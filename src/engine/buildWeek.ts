import { BLOCKS, available } from "../data/blocks";
import type { BlockId } from "../data/blocks";
import type {
  Access,
  GroupId,
  IntensityZone,
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

/**
 * Blocs disponibles que le plan de la phase n'a pas retenus. Ils servent de réserve quand
 * on déclare plus de créneaux que le plan n'a de séances : mieux vaut travailler une partie
 * du corps que le plan avait écartée que répéter deux fois la même séance.
 */
export function reservePlan(plan: BlockId[], access: Access): BlockId[] {
  return (Object.keys(BLOCKS) as BlockId[]).filter(
    (id) => !plan.includes(id) && available(id, access),
  );
}

/** Ce qui a déjà été consommé dans la semaine. Mutable : l'allocation le remplit au fur et à mesure. */
export interface AllocState {
  used: Set<BlockId>;
  groups: Set<GroupId>;
  /** Nombre de séances coûteuses en fatigue déjà placées, renfo lourd compris. */
  hard: number;
  /** Nombre de séances d'intensité aérobie élevée, seuil compris. */
  intense: number;
  /** Nombre de séances au seuil, la zone que le modèle polarisé raréfie le plus. */
  threshold: number;
}

export const emptyState = (): AllocState => ({
  used: new Set(),
  groups: new Set(),
  hard: 0,
  intense: 0,
  threshold: 0,
});

const isIntense = (zone?: IntensityZone) => zone === "haute" || zone === "seuil";

/** Enregistre un bloc comme consommé pour le reste de la semaine. */
export function consume(state: AllocState, id: BlockId) {
  state.used.add(id);
  const b = BLOCKS[id];
  if (b.group) state.groups.add(b.group);
  if (b.hard) state.hard += 1;
  if (isIntense(b.zone)) state.intense += 1;
  if (b.zone === "seuil") state.threshold += 1;
}

export interface Caps {
  /** Séances dures autorisées, toutes causes confondues. */
  hard: number;
  /** Séances d'intensité aérobie élevée autorisées. */
  intensity: number;
  /** Séances au seuil autorisées. */
  threshold: number;
}

/**
 * Plafonds d'intensité de la semaine.
 *
 * Le modèle polarisé vise 75 à 80 % du volume en basse intensité, mais il est établi
 * sur des athlètes qui s'entraînent 8 à 12 h par semaine. À trois créneaux, une seule
 * séance de qualité pèse déjà 30 % du volume : appliquer le ratio en minutes rendrait
 * toute séance intense impossible. On traduit donc l'intention en **nombre de séances**,
 * proportionnel au nombre de créneaux, ce qui garde l'esprit du modèle sans prétendre
 * à un ratio inatteignable.
 */
export function intensityCaps(slotCount: number, easyWeek: boolean): Caps {
  if (easyWeek) return { hard: 1, intensity: 1, threshold: 1 };
  const intensity = slotCount >= 6 ? 3 : slotCount >= 4 ? 2 : 1;
  // Au plus une séance au seuil, quel que soit le volume : c'est la zone la moins rentable.
  return { hard: 3, intensity, threshold: 1 };
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
  caps: Caps,
  reserve: BlockId[] = [],
): PlacedSession[] {
  const factor = easyWeek ? 0.75 : 1;
  const placed: PlacedSession[] = [];

  const pickFrom = (
    list: BlockId[],
    place: PlaceId,
    budget: number,
    noHard: boolean,
    stackOnly: boolean,
  ) =>
    list.find((id) => {
      const b = BLOCKS[id];
      if (state.used.has(id) || b.place !== place || b.min > budget) return false;
      if (b.group && state.groups.has(b.group)) return false;
      if (stackOnly && !b.stack) return false;
      if (b.hard && (noHard || state.hard >= caps.hard)) return false;
      if (isIntense(b.zone) && state.intense >= caps.intensity) return false;
      if (b.zone === "seuil" && state.threshold >= caps.threshold) return false;
      return true;
    });

  const pick = (place: PlaceId, budget: number, noHard: boolean, stackOnly: boolean) =>
    pickFrom(plan, place, budget, noHard, stackOnly);

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

  // Passe de repli : un créneau déclaré ne doit pas rester vide.
  //
  // Le plan d'une phase est fini, et chaque bloc ne sert qu'une fois par semaine. Dès qu'on
  // déclare plus de créneaux que le plan n'a de blocs pour ce lieu, les derniers restaient
  // vides. On y remet alors une séance déjà posée, en n'autorisant que de la basse intensité
  // non dure : une deuxième sortie facile augmente le volume sans toucher au ratio 80/20 ni
  // ajouter de la fatigue.
  const filled = new Set(placed.map((s) => s.day));

  // Combien de fois chaque bloc est déjà posé : le repli prend le moins servi, pour ne pas
  // proposer trois fois la même séance quand plusieurs créneaux sont surnuméraires.
  const seen = new Map<BlockId, number>();
  placed.forEach((s) => s.blocks.forEach((b) => seen.set(b.id, (seen.get(b.id) ?? 0) + 1)));

  slots
    .filter((s) => !filled.has(s.day))
    .forEach((slot) => {
      // 1. Une séance neuve tirée de la réserve : une partie du corps que le plan avait écartée.
      //    Jamais de séance dure ici : un créneau en plus doit apporter du volume, pas de
      //    l'intensité que le plan de la phase n'avait pas prévue.
      const fresh = pickFrom(reserve, slot.place, slot.duration, true, false);
      const again =
        fresh ??
        // 2. À défaut, on répète la séance facile la moins servie jusqu'ici.
        plan
          .filter((id) => {
            const b = BLOCKS[id];
            return (
              state.used.has(id) &&
              b.place === slot.place &&
              b.min <= slot.duration &&
              !b.hard &&
              b.zone === "basse"
            );
          })
          .reduce<BlockId | undefined>(
            (best, id) => (!best || (seen.get(id) ?? 0) < (seen.get(best) ?? 0) ? id : best),
            undefined,
          );

      if (!again) return;
      if (fresh) consume(state, fresh);
      seen.set(again, (seen.get(again) ?? 0) + 1);

      const dur = Math.round(Math.min(BLOCKS[again].max, slot.duration * factor) / 5) * 5;
      placed.push({
        ...slot,
        blocks: [{ id: again, dur: Math.max(BLOCKS[again].min, dur) }],
        filler: true,
      });
    });

  return placed.sort((a, b) => slots.indexOf(a) - slots.indexOf(b) || 0);
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
  const placed = allocate(
    slots,
    plan,
    easyWeek,
    state,
    intensityCaps(slots.length, easyWeek),
    reservePlan(plan, access),
  );

  const dropped = plan.filter((id) => {
    const b = BLOCKS[id];
    return !state.used.has(id) && !(b.group && state.groups.has(b.group));
  });
  return { placed, dropped };
}

/** Répartition du volume aérobie de la semaine, en minutes puis en part du total. */
export function intensityMix(sessions: PlacedSession[]) {
  const min: Record<IntensityZone, number> = { basse: 0, seuil: 0, haute: 0 };
  sessions.forEach((s) =>
    s.blocks.forEach((b) => {
      const zone = BLOCKS[b.id].zone;
      if (zone) min[zone] += b.dur;
    }),
  );
  const total = min.basse + min.seuil + min.haute;
  const pct = (v: number) => (total === 0 ? 0 : Math.round((v / total) * 100));
  return { minutes: min, total, part: { basse: pct(min.basse), seuil: pct(min.seuil), haute: pct(min.haute) } };
}
