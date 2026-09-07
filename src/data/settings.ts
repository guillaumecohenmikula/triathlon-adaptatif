import type {
  AccessId,
  GoalId,
  ModeId,
  PlaceId,
  SessionState,
  ZoneId,
} from "./types";

export const ACCESS: { id: AccessId; label: string; hint: string }[] = [
  { id: "exterieur", label: "Courir dehors", hint: "route, parc, chemins" },
  { id: "salle", label: "Salle de sport", hint: "machines et charges libres" },
  { id: "tapis", label: "Tapis de course", hint: "en salle, pour courir sans sortir" },
  { id: "veloSalle", label: "Vélo d'appartement en salle", hint: "vélo stationnaire ou assault bike" },
  { id: "homeTrainer", label: "Home-trainer chez moi", hint: "vélo + support" },
  { id: "veloRoute", label: "Vélo de route", hint: "pour rouler dehors" },
  { id: "piscine", label: "Piscine", hint: "bassin accessible régulièrement" },
  { id: "maison", label: "Espace chez moi", hint: "un tapis suffit" },
];

/** `factor` multiplie les cibles hebdomadaires de la phase. */
export const GOALS: { id: GoalId; label: string; detail: string; factor: number }[] = [
  { id: "S", label: "Triathlon S", detail: "750 m · 20 km · 5 km", factor: 0.7 },
  { id: "M", label: "Triathlon M", detail: "1,5 km · 40 km · 10 km", factor: 1 },
  { id: "L", label: "Triathlon L", detail: "1,9 km · 90 km · 21 km", factor: 1.5 },
];

export const MODES: { id: ModeId; label: string; detail: string }[] = [
  { id: "perf", label: "Performance pure", detail: "Le renfo sert uniquement le chrono, volume minimal" },
  { id: "mixte", label: "Équilibré", detail: "Chrono d'abord, mais on entretient le haut du corps" },
  { id: "physique", label: "Chrono et physique", detail: "Full body prioritaire, séances plus longues, fourchettes 8-12 reps" },
];

export const ZONES: { id: ZoneId; label: string }[] = [
  { id: "dos", label: "Dos" },
  { id: "epaules", label: "Épaules" },
  { id: "pecs", label: "Pectoraux" },
  { id: "bras", label: "Bras" },
  { id: "jambes", label: "Jambes" },
];

export const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

/** `needs` est l'accès qui rend ce lieu proposable comme créneau. */
export const PLACES: { id: PlaceId; label: string; needs: AccessId }[] = [
  { id: "exterieur", label: "Extérieur", needs: "exterieur" },
  { id: "salle", label: "Salle", needs: "salle" },
  { id: "maison", label: "Maison", needs: "maison" },
  { id: "piscine", label: "Piscine", needs: "piscine" },
];

export const DURATIONS = [30, 45, 60, 75, 90, 120];

export const STATES: [SessionState, string][] = [
  ["fait", "Fait"],
  ["partiel", "Partiel"],
  ["rate", "Pas fait"],
];

/** Pondération d'une séance dans le calcul du volume réellement fait. */
export const WEIGHT: Record<SessionState, number> = { fait: 1, partiel: 0.5, rate: 0 };

/** Consigne de charge affichée selon la position dans le cycle de 4 semaines. */
export const PROGRESSION: Record<number, string> = {
  1: "Semaine 1 du bloc — charge de référence. Note ce que tu mets, tout part de là.",
  2: "Semaine 2 — ajoute une série sur l'exercice principal, ou 2,5 kg si les reps passaient largement.",
  3: "Semaine 3 — +2,5 kg sur le principal et le secondaire, volume inchangé. C'est la semaine la plus dure.",
  4: "Semaine 4 — allégée. Une série de moins par exercice, charge inchangée. Tu dois sortir frais.",
};

export const placeLabel = (id: PlaceId) =>
  (PLACES.find((p) => p.id === id) ?? { label: id as string }).label;
