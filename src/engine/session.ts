import type { ActivityId, DoneItem, Item, Session, Template } from "../data/types";

/*
 * Les opérations du carnet, en fonctions pures. Une séance est une copie autonome :
 * modifier un modèle ne touche jamais aux séances déjà posées, et modifier une séance
 * ne touche jamais au modèle.
 */

export const newId = (): string =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;

export const emptyItem = (kind: Item["kind"] = "reps"): Item => ({
  id: newId(),
  label: "",
  kind,
  ...(kind === "reps" ? { sets: 3, reps: "10", rest: 90 } : {}),
  ...(kind === "hold" ? { sets: 3, seconds: 40, rest: 60 } : {}),
  ...(kind === "time" ? { minutes: 20 } : {}),
  ...(kind === "distance" ? { distance: 1000 } : {}),
});

/** Recopie les éléments avec de nouveaux identifiants : la séance devient indépendante. */
export const copyItems = (items: Item[]): Item[] => items.map((i) => ({ ...i, id: newId() }));

export function fromTemplate(t: Template, week: string, day: string): Session {
  return {
    id: newId(),
    week,
    day,
    title: t.name,
    disc: t.disc,
    items: copyItems(t.items),
    from: t.id,
  };
}

export function blankSession(week: string, day: string, disc: ActivityId = "course"): Session {
  return { id: newId(), week, day, title: "", disc, items: [] };
}

export const addItem = (items: Item[], item: Item): Item[] => [...items, item];

export const updateItem = (items: Item[], id: string, patch: Partial<Item>): Item[] =>
  items.map((i) => (i.id === id ? { ...i, ...patch } : i));

export const removeItem = (items: Item[], id: string): Item[] => items.filter((i) => i.id !== id);

/** Remonte ou descend un élément d'un cran. Aux extrémités, rien ne bouge. */
export function moveItem(items: Item[], id: string, delta: -1 | 1): Item[] {
  const at = items.findIndex((i) => i.id === id);
  const to = at + delta;
  if (at < 0 || to < 0 || to >= items.length) return items;
  const out = [...items];
  [out[at], out[to]] = [out[to], out[at]];
  return out;
}

/** Temps de travail supposé d'une série, en secondes. Le repos, lui, est annoncé. */
const WORK_PER_SET = 45;

/**
 * Durée approchée d'un exercice : ses séries, travail et repos compris. Une prescription
 * n'annonce jamais sa durée, or une séance de renfo sans durée paraîtrait vide.
 */
export const repsMinutes = (item: Item) =>
  Math.round(
    ((item.sets ?? 3) * ((item.kind === "hold" ? (item.seconds ?? 40) : WORK_PER_SET) + (item.rest ?? 90))) / 60,
  );

/** Durée d'un élément : celle qu'il annonce, ou celle qu'on en déduit. */
export function itemMinutes(item: Item): number {
  if (item.rep) return item.rep.n * item.rep.work + (item.rep.n - 1) * item.rep.rest;
  if (item.minutes) return item.minutes;
  return item.kind === "reps" || item.kind === "hold" ? repsMinutes(item) : 0;
}

/** Durée prévue par les éléments, récupérations d'intervalles comprises. */
export const plannedMinutes = (items: Item[]) => items.reduce((a, i) => a + itemMinutes(i), 0);

/**
 * Durée retenue pour une séance : celle de la montre si elle existe, sinon ce qui était
 * prévu. C'est cette durée qui alimente les volumes.
 */
export const sessionMinutes = (s: Session): number =>
  s.actual?.minutes ?? plannedMinutes(s.items);

/** Distance retenue, en mètres : celle de la montre, sinon la somme des éléments. */
export function sessionDistance(s: Session): number {
  if (s.actual?.distance !== undefined) return s.actual.distance;
  const planned = s.items.reduce((a, i) => a + (i.distance ?? 0), 0);
  return planned;
}

/** Une séance compte comme faite dès qu'elle porte un bilan autre que « pas fait ». */
export const isDone = (s: Session) => s.state === "fait" || s.state === "partiel";

/** Pondération du volume : une séance partielle compte pour moitié. */
export const weightOf = (s: Session) => (s.state === "fait" ? 1 : s.state === "partiel" ? 0.5 : 0);

/** Séries réellement faites sur un élément, avec leurs charges. */
export const doneSets = (done: DoneItem | undefined) => done?.sets ?? [];

/**
 * Charge soulevée sur un élément, en kilos cumulés : c'est le tonnage.
 * Une série sans charge ou sans répétitions n'y participe pas.
 */
export const tonnage = (done: DoneItem | undefined) =>
  doneSets(done).reduce((a, s) => a + (s.reps ?? 0) * (s.load ?? 0), 0);

/**
 * Record de force estimé à partir d'une série, par la formule d'Epley.
 * Au-delà de 12 répétitions l'estimation perd son sens, on s'arrête là.
 */
export function estimated1RM(reps: number, load: number): number | undefined {
  if (reps < 1 || reps > 12 || load <= 0) return undefined;
  return Math.round(load * (1 + reps / 30) * 10) / 10;
}
