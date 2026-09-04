import type { Warmup } from "./types";

/* Échauffements des blocs de renfo. d = durée en minutes, x = consignes. */
const RAW = {
  strFull: { d: 10, x: "5 min vélo ou rameur, rotations d'épaules, 10 squats à vide, 10 pompes, 10 tirages élastique. Une série d'approche à 50 % sur les deux premiers exercices." },
  strFullHome: { d: 8, x: "3 min sur place, rotations d'épaules, 10 squats à vide, 10 pompes sur les genoux, 10 ponts fessiers." },
  strLow: { d: 10, x: "5 min vélo ou corde à sauter, puis 10 fentes, 10 squats à vide, 10 ponts fessiers. Une série d'approche à 50 % sur le premier exercice." },
  strUp: { d: 10, x: "5 min rameur ou corde, rotations d'épaules, 10 pompes, 10 tirages élastique. Une série d'approche à 50 %." },
  strLowHome: { d: 8, x: "3 min sur place ou corde, 10 squats à vide, 10 fentes, 10 ponts fessiers, chevilles mobilisées." },
  strUpHome: { d: 7, x: "Rotations d'épaules, 10 pompes lentes sur les genoux, 10 tirages serviette." },
  coreHome: { d: 5, x: "Chat-vache, 10 ponts fessiers, 30 s de planche facile." },
} satisfies Record<string, Warmup>;

export type WARMUPSKey = keyof typeof RAW;

export const WARMUPS: Record<string, Warmup | undefined> = RAW;
