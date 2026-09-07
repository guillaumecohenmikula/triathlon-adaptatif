import type { BlockId } from "../data/blocks";
import { BLOCKS, available } from "../data/blocks";
import { DAYS } from "../data/settings";
import type {
  Access,
  Journal,
  ModeId,
  Phase,
  PlacedSession,
  Slot,
  Slots,
} from "../data/types";
import { allocate, consume, emptyState, intensityCaps, orderedPlan } from "./buildWeek";
import type { Deficits } from "./deficits";

/** La semaine telle qu'elle est rangée en base : générée une fois, puis amendée. */
export interface StoredWeek {
  week: string;
  sessions: PlacedSession[];
  /** Jours que l'utilisateur a déclarés impossibles. Ce n'est pas un échec, juste un empêchement. */
  cancelled: string[];
  /** Blocs libérés qui attendent encore une place. Absent sur les semaines écrites avant la v2. */
  orphans?: BlockId[];
  /**
   * Créneaux propres à cette semaine. Absent tant que l'utilisateur n'a rien changé :
   * on retombe alors sur le schéma habituel des réglages.
   */
  slots?: Slots;
  /** Empreinte des réglages ayant servi à la génération. */
  stamp: string;
}

export interface ResolvedWeek {
  sessions: PlacedSession[];
  /** Blocs libérés par une annulation qui n'ont pas pu être recasés cette semaine. */
  orphans: BlockId[];
  /** Blocs du plan qui n'ont jamais trouvé de créneau. */
  dropped: BlockId[];
  /** Vrai si le résultat diffère de ce qui est en base et mérite d'être réécrit. */
  changed: boolean;
}

export interface ResolveInput {
  stored?: StoredWeek;
  /** Créneaux déclarés, déjà filtrés sur les accès et ordonnés par jour. */
  slots: Slot[];
  cancelled: string[];
  journal: Journal;
  week: string;
  /** Index du jour courant dans DAYS, 0 pour lundi. Injecté pour rester testable. */
  todayIndex: number;
  stamp: string;
  phase: Phase;
  easyWeek: boolean;
  def: Deficits;
  access: Access;
  mode: ModeId;
}

/**
 * Empreinte des réglages qui déterminent le contenu d'une semaine.
 * Volontairement sans le journal : marquer une séance ne doit pas rejouer le plan.
 */
export function settingsStamp(s: {
  goal: string;
  mode: string;
  raceDate: string;
  access: Access;
}): string {
  const acc = (Object.keys(s.access) as (keyof Access)[])
    .sort()
    .filter((k) => s.access[k])
    .join(",");
  return [s.goal, s.mode, s.raceDate, acc].join("|");
}

const dayIndex = (day: string) => DAYS.indexOf(day);
const byDay = (a: { day: string }, b: { day: string }) => dayIndex(a.day) - dayIndex(b.day);
const sameSlot = (s: PlacedSession, slot: Slot) =>
  s.place === slot.place && s.duration === slot.duration;

/**
 * Résout la semaine affichée. C'est le point d'entrée unique : il gère aussi bien
 * la première génération que la replanification en cours de semaine.
 *
 * Trois principes, arbitrés avec Guil le 2026-09-03 :
 * 1. Un créneau qui saute libère son bloc, qu'on tente de recaser ailleurs dans la semaine.
 * 2. « Je ne peux pas » n'est pas « pas fait » : l'annulation ne compte jamais comme un échec.
 * 3. Une séance déjà prévue sur un jour à venir ne change pas de contenu. Seuls les
 *    créneaux libres bougent, pour que le plan reste prévisible.
 */
export function resolveWeek(input: ResolveInput): ResolvedWeek {
  const { stored, slots, cancelled, journal, week, todayIndex, stamp } = input;
  const plan = orderedPlan(input.phase, input.mode, input.def, input.access);

  const slotOf = new Map(slots.map((s) => [s.day, s]));
  const isCancelled = (day: string) => cancelled.includes(day);
  // Le passé et tout ce qui porte déjà un bilan sont intouchables.
  const isLocked = (s: PlacedSession) =>
    dayIndex(s.day) < todayIndex || Boolean(journal[`${week}|${s.day}`]);

  const previous = stored?.sessions ?? [];
  // Un changement de réglages rejoue le plan ; sinon on ne touche qu'aux créneaux libres.
  const settingsChanged = !stored || stored.stamp !== stamp;

  const keep = previous.filter((s) => {
    if (isLocked(s)) return true;
    if (settingsChanged) return false;
    if (isCancelled(s.day)) return false;
    const slot = slotOf.get(s.day);
    // Un créneau modifié (lieu ou durée) redevient libre : la séance ne lui correspond plus.
    return Boolean(slot && sameSlot(s, slot));
  });

  const kept = new Set(keep.map((s) => s.day));

  // Les blocs libérés par une annulation ou par un créneau supprimé passent en tête.
  // On y ajoute ceux qui attendaient déjà une place : tant qu'un créneau ne s'ouvre pas,
  // un orphelin reste candidat prioritaire au lieu de disparaître à la première écriture.
  const freedIds = [
    ...previous.filter((s) => !kept.has(s.day)).flatMap((s) => s.blocks.map((b) => b.id)),
    ...(stored?.orphans ?? []),
  ].filter((id) => available(id, input.access) && plan.includes(id));

  const state = emptyState();
  keep.forEach((s) => s.blocks.forEach((b) => consume(state, b.id)));

  // Un bloc entre-temps reposé ailleurs dans la semaine n'est plus orphelin.
  const freed = [...new Set(freedIds)].filter((id) => !state.used.has(id));

  const free = slots.filter(
    (s) => !kept.has(s.day) && !isCancelled(s.day) && dayIndex(s.day) >= todayIndex,
  );

  const prioritized = [...freed, ...plan.filter((id) => !freed.includes(id))];
  // Les plafonds portent sur la semaine entière, pas sur les seuls créneaux encore libres.
  const caps = intensityCaps(slots.length, input.easyWeek);
  const fresh = allocate(free, prioritized, input.easyWeek, state, caps);

  const sessions = [...keep, ...fresh].sort(byDay);
  const orphans = freed.filter((id) => !state.used.has(id));
  const dropped = plan.filter((id) => {
    const b = BLOCKS[id];
    return !state.used.has(id) && !(b.group && state.groups.has(b.group)) && !orphans.includes(id);
  });

  const changed =
    !stored ||
    stored.stamp !== stamp ||
    JSON.stringify(stored.sessions) !== JSON.stringify(sessions) ||
    JSON.stringify(stored.cancelled) !== JSON.stringify(cancelled) ||
    JSON.stringify(stored.orphans ?? []) !== JSON.stringify(orphans);

  return { sessions, orphans, dropped, changed };
}
