import type { ActivityId } from "../data/types";

/** La natation se compte en mètres, le reste en kilomètres. */
export const inMeters = (disc: ActivityId) => disc === "natation";

/** Unité de saisie de la discipline. */
export const distanceUnit = (disc: ActivityId) => (inMeters(disc) ? "m" : "km");

/** « 5,4 km », ou « 1 500 m » en natation. Les distances sont rangées en mètres. */
export function formatDistance(disc: ActivityId, meters: number) {
  if (inMeters(disc)) return `${Math.round(meters).toLocaleString("fr-FR")} m`;
  return `${(meters / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} km`;
}

/**
 * Lit une distance saisie dans l'unité de la discipline et la rend en mètres.
 * Accepte la virgule. Vide ou illisible donne `undefined` : la distance est facultative.
 */
export function parseDistance(disc: ActivityId, input: string): number | undefined {
  const s = input.trim().replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(s)) return undefined;
  const n = Number(s);
  if (n <= 0) return undefined;
  return Math.round(inMeters(disc) ? n : n * 1000);
}

/** Saisie d'une distance déjà rangée, pour pré-remplir le champ. */
export const distanceInput = (disc: ActivityId, meters?: number) =>
  meters === undefined
    ? ""
    : inMeters(disc)
      ? String(Math.round(meters))
      : String(meters / 1000).replace(".", ",");

/** Échelle d'effort ressenti : ce que veut dire chaque note, en mots. */
export function rpeLabel(rpe: number) {
  if (rpe <= 2) return "très facile";
  if (rpe <= 4) return "facile, on parle sans effort";
  if (rpe <= 6) return "modéré, on parle par phrases courtes";
  if (rpe <= 8) return "dur, quelques mots seulement";
  return "maximal";
}

/** « 5'27 », pour une allure en secondes. */
export const formatPaceValue = (seconds: number) =>
  `${Math.floor(seconds / 60)}'${String(Math.round(seconds % 60)).padStart(2, "0")}`;
