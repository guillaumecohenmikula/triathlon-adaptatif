import type { ActivityId } from "../data/types";

/** La natation se compte en mètres, le reste en kilomètres. */
export const inMeters = (activity: ActivityId) => activity === "natation";

/** « 5,2 km », ou « 1 500 m » en natation. */
export function formatDistance(activity: ActivityId, km: number) {
  if (inMeters(activity)) return `${Math.round(km * 1000).toLocaleString("fr-FR")} m`;
  return `${km.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} km`;
}

/**
 * Lit une distance saisie, en mètres pour la natation et en kilomètres sinon, et la rend
 * en kilomètres. Accepte la virgule. Vide ou illisible donne `undefined` : la distance
 * est facultative, on ne bloque pas l'enregistrement pour elle.
 */
export function parseDistance(activity: ActivityId, input: string): number | undefined {
  const s = input.trim().replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(s)) return undefined;
  const n = Number(s);
  if (n <= 0) return undefined;
  return inMeters(activity) ? n / 1000 : n;
}

/** Saisie d'une distance déjà rangée, pour pré-remplir le champ. */
export const distanceInput = (activity: ActivityId, km?: number) =>
  km === undefined
    ? ""
    : inMeters(activity)
      ? String(Math.round(km * 1000))
      : String(km).replace(".", ",");

/** Échelle d'effort ressenti : ce que veut dire chaque note, en mots. */
export function rpeLabel(rpe: number) {
  if (rpe <= 2) return "très facile";
  if (rpe <= 4) return "facile, on parle sans effort";
  if (rpe <= 6) return "modéré, on parle par phrases courtes";
  if (rpe <= 8) return "dur, quelques mots seulement";
  return "maximal";
}
