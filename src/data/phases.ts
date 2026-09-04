import type { Phase } from "./types";

/* Phases ordonnées de la plus lointaine à la plus proche de la course. */
const RAW = [
  { id: "base", label: "Base", span: 4, minSlots: 3, plan: ["longRun", "bikeGym", "bikeHT", "swimTech", "strLow", "strLowHome", "tempo", "strUp", "strUpHome", "coreHome"], targets: { course: 140, velo: 80, natation: 45, renfo: 60 }, focus: "Volume aérobie et solidité. L'intensité reste rare." },
  { id: "dev", label: "Développement", span: 3, minSlots: 4, plan: ["quality", "bikeGymInt", "bikeHTint", "longRun", "swimEnd", "bikeGym", "bikeHT", "strUp", "strUpHome", "strLowHome", "coreHome"], targets: { course: 170, velo: 120, natation: 60, renfo: 45 }, focus: "Le seuil et le fractionné entrent. Le volume monte." },
  { id: "spe", label: "Spécifique", span: 2, minSlots: 5, plan: ["brick", "quality", "bikeLong", "bikeGymInt", "bikeHTint", "longRun", "swimEnd", "strUp", "strUpHome", "coreHome"], targets: { course: 180, velo: 180, natation: 75, renfo: 30 }, focus: "Enchaînements vélo-course et allure de course." },
  { id: "affutage", label: "Affûtage", span: 1, minSlots: 3, plan: ["quality", "bikeGym", "bikeHT", "swimTech", "longRun", "coreHome"], targets: { course: 90, velo: 70, natation: 40, renfo: 20 }, focus: "Volume divisé par deux, intensité conservée." },
] satisfies Phase[];

export const PHASES: Phase[] = RAW;
