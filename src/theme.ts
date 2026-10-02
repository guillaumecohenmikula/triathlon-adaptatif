import type { ActivityId, Discipline } from "./data/types";

/*
 * Thème sombre, retenu avec Guil le 2026-10-02 à partir des maquettes (direction 2).
 *
 * Les couleurs de discipline ont été re-choisies pour ce fond : les anciennes, pensées
 * pour un fond clair, sortaient de la bande de luminosité lisible sur sombre. Celles-ci
 * passent les contrôles de contraste et de vision des couleurs sur la surface #17242F,
 * y compris côte à côte dans une barre empilée.
 */

/** Fond de l'app. */
export const PAPER = "#0E1A24";
/** Surface des cartes et des champs. */
export const CARD = "#17242F";
/** Texte principal. */
export const INK = "#F2F5F7";
export const MUTED = "#9AAAB6";
export const LINE = "#243544";
export const WARN_BG = "#2A2418";
export const WARN_TX = "#F0C987";

/** Action principale, et le texte qui se pose dessus. */
export const ACCENT = "#D2703F";
export const ON_ACCENT = "#1A1008";
/** Texte posé sur un aplat de couleur de discipline. */
export const ON_FILL = "#0E1A24";

/** Arrondis : carte, champ, pilule. */
export const R = { card: 14, field: 12, pill: 999 };

export const DISC: Record<Discipline, { c: string; label: string }> = {
  course: { c: "#D2703F", label: "Course" },
  velo: { c: "#2E92D8", label: "Vélo" },
  natation: { c: "#35A449", label: "Natation" },
  renfo: { c: "#8D73DC", label: "Renfo" },
};

/** Les disciplines, plus les activités hors triathlon. */
export const ACTIVITY: Record<ActivityId, { c: string; label: string }> = {
  ...DISC,
  autre: { c: "#8795A2", label: "Autre activité" },
};
