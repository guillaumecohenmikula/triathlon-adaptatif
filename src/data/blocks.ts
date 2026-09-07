import type { Access, Block } from "./types";

/* Les 16 blocs de séance. L'ordre n'a pas de sens ici : la priorité vient du plan de phase. */
const RAW = {
  longRun: { label: "Sortie longue", disc: "course", place: "exterieur", needs: ["exterieur"], min: 60, max: 100, zone: "basse", hard: false, stack: false },
  quality: { label: "Fractionné", disc: "course", place: "exterieur", needs: ["exterieur"], min: 60, max: 80, zone: "haute", hard: true, stack: false },
  tempo: { label: "Sortie soutenue", disc: "course", place: "exterieur", needs: ["exterieur"], min: 45, max: 60, zone: "seuil", hard: true, stack: false, group: "courseDure" },
  brick: { label: "Enchaînement vélo-course", disc: "course", place: "exterieur", needs: ["exterieur", "veloRoute"], min: 75, max: 110, zone: "seuil", hard: true, stack: false },
  runGym: { label: "Course sur tapis, endurance", disc: "course", place: "salle", needs: ["tapis"], min: 40, max: 75, zone: "basse", hard: false, stack: true },
  runGymInt: { label: "Course sur tapis, fractionné", disc: "course", place: "salle", needs: ["tapis"], min: 60, max: 80, zone: "haute", hard: true, stack: false },
  bikeLong: { label: "Vélo route long", disc: "velo", place: "exterieur", needs: ["veloRoute"], min: 75, max: 150, zone: "basse", hard: false, stack: false },
  bikeGym: { label: "Vélo d'appartement, endurance", disc: "velo", place: "salle", needs: ["veloSalle"], min: 40, max: 75, zone: "basse", hard: false, stack: true, group: "veloEnd" },
  bikeGymInt: { label: "Vélo d'appartement, intervalles", disc: "velo", place: "salle", needs: ["veloSalle"], min: 55, max: 75, zone: "haute", hard: true, stack: true, group: "veloInt" },
  bikeHT: { label: "Home-trainer, endurance", disc: "velo", place: "maison", needs: ["homeTrainer"], min: 40, max: 75, zone: "basse", hard: false, stack: true, group: "veloEnd" },
  bikeHTint: { label: "Home-trainer, intervalles", disc: "velo", place: "maison", needs: ["homeTrainer"], min: 55, max: 75, zone: "haute", hard: true, stack: true, group: "veloInt" },
  swimTech: { label: "Natation technique", disc: "natation", place: "piscine", needs: ["piscine"], min: 40, max: 60, zone: "basse", hard: false, stack: false },
  swimEnd: { label: "Natation endurance", disc: "natation", place: "piscine", needs: ["piscine"], min: 45, max: 75, zone: "seuil", hard: false, stack: false },
  strFull: { label: "Renfo full body", disc: "renfo", place: "salle", needs: ["salle"], min: 45, max: 80, hard: true, stack: false, group: "renfoSemaine" },
  strFullHome: { label: "Full body, poids du corps", disc: "renfo", place: "maison", needs: ["maison"], min: 40, max: 70, hard: true, stack: false, group: "renfoSemaine" },
  strUp: { label: "Renfo haut du corps", disc: "renfo", place: "salle", needs: ["salle"], min: 30, max: 45, hard: false, stack: true, group: "haut" },
  strLow: { label: "Renfo bas du corps", disc: "renfo", place: "salle", needs: ["salle"], min: 35, max: 50, hard: true, stack: true, group: "bas" },
  strUpHome: { label: "Renfo haut, poids du corps", disc: "renfo", place: "maison", needs: ["maison"], min: 25, max: 40, hard: false, stack: true, group: "haut" },
  strLowHome: { label: "Renfo bas, poids du corps", disc: "renfo", place: "maison", needs: ["maison"], min: 30, max: 45, hard: true, stack: true, group: "bas" },
  coreHome: { label: "Gainage et stabilité", disc: "renfo", place: "maison", needs: ["maison"], min: 20, max: 35, hard: false, stack: true, group: "gainage" },
} satisfies Record<string, Block>;

export type BlockId = keyof typeof RAW;

/* Réexposé en Record<BlockId, Block> : sans ça, TypeScript garde le type littéral de chaque
   entrée et `group` n'existe pas sur les blocs qui n'en ont pas. */
export const BLOCKS: Record<BlockId, Block> = RAW;

export const isBlockId = (id: string): id is BlockId => id in RAW;

/** Un bloc dont tous les `needs` ne sont pas cochés est retiré du plan. */
export const available = (id: BlockId, access: Access) =>
  BLOCKS[id].needs.every((n) => access[n]);
