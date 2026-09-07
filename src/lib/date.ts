import { DAYS } from "../data/settings";

/**
 * Parse une date ISO en date **locale**. `new Date("2026-08-31")` la lirait en UTC,
 * ce qui décale l'affichage d'un jour selon le fuseau.
 */
const parseISO = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const toISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Clé de semaine : le lundi au format ISO, ex. "2026-08-31". */
export const mondayKey = (d: Date = new Date()) => {
  const x = new Date(d);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return toISO(x);
};

export const frDate = (iso: string) =>
  parseISO(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

/** Date réelle d'un jour de la semaine, ex. mardi de la semaine du 31 août. */
export const dateOf = (week: string, day: string) => {
  const i = DAYS.indexOf(day);
  const d = parseISO(week);
  d.setDate(d.getDate() + (i < 0 ? 0 : i));
  return d;
};

/** Étiquette courte à afficher à côté du jour, ex. « 8 sept. ». */
export const dayLabel = (week: string, day: string) =>
  dateOf(week, day).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

/** Clé de la semaine qui contient une date ISO donnée. */
export const weekOf = (iso: string) => mondayKey(parseISO(iso));

/** Décale une clé de semaine d'un nombre de semaines, positif ou négatif. */
export const shiftWeek = (week: string, weeks: number) => {
  const d = parseISO(week);
  d.setDate(d.getDate() + weeks * 7);
  return toISO(d);
};

/** Nombre de semaines entre deux clés de semaine, négatif si `b` est dans le passé. */
export const weeksBetween = (a: string, b: string) =>
  Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / (7 * 86_400_000));

/**
 * Index du jour à partir duquel une semaine est encore modifiable.
 * Semaine passée : tout est figé. Semaine à venir : rien ne l'est. Semaine en cours : aujourd'hui.
 */
export const frozenUntil = (week: string, now: Date = new Date()) => {
  const current = mondayKey(now);
  if (week < current) return 7;
  if (week > current) return 0;
  return todayIndex(now);
};

/** Index du jour courant, lundi = 0. Sert à savoir ce qui appartient au passé. */
export const todayIndex = (now: Date = new Date()) => (now.getDay() + 6) % 7;

/** Le jour appartient-il à la semaine en cours, et est-il aujourd'hui ? */
export const isToday = (week: string, day: string, now: Date = new Date()) =>
  toISO(dateOf(week, day)) === toISO(now);

/** Durée en minutes rendue lisible : « 45 min », « 1 h », « 4 h 15 ». */
export const humanDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, "0")}`;
};
