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

/** Index du jour courant, lundi = 0. Sert à savoir ce qui appartient au passé. */
export const todayIndex = (now: Date = new Date()) => (now.getDay() + 6) % 7;

/** Le jour appartient-il à la semaine en cours, et est-il aujourd'hui ? */
export const isToday = (week: string, day: string, now: Date = new Date()) =>
  toISO(dateOf(week, day)) === toISO(now);
