import { PHASES } from "../../data/phases";
import type { Access, Phase, PhaseId } from "../../data/types";
import type { Deficits } from "../deficits";

export const phase = (id: PhaseId): Phase => {
  const p = PHASES.find((x) => x.id === id);
  if (!p) throw new Error(`phase inconnue : ${id}`);
  return p;
};

/** Tous les accès cochés. Chaque test retire ce qu'il veut tester. */
export const fullAccess = (over: Partial<Access> = {}): Access => ({
  exterieur: true,
  salle: true,
  maison: true,
  piscine: true,
  veloSalle: true,
  veloRoute: true,
  homeTrainer: true,
  ...over,
});

export const noDeficit: Deficits = { weeks: 0, byDisc: {} };
