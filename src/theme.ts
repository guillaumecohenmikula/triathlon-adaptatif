import type { ActivityId, Discipline } from "./data/types";

export const INK = "#12202B";
export const PAPER = "#EDEFF1";
export const LINE = "#D3D8DC";
export const MUTED = "#63707A";
export const WARN_BG = "#F7ECD8";
export const WARN_TX = "#6B4708";

export const DISC: Record<Discipline, { c: string; label: string }> = {
  course: { c: "#B0451C", label: "Course" },
  velo: { c: "#1D6FA5", label: "Vélo" },
  // Vert et non turquoise : le turquoise et le bleu du vélo se distinguaient mal,
  // y compris en vision normale, quand les deux se touchent dans une barre empilée.
  natation: { c: "#2F7A3E", label: "Natation" },
  renfo: { c: "#5C4B8A", label: "Renfo" },
};

/** Les disciplines, plus les activités hors triathlon notées en séance extra. */
export const ACTIVITY: Record<ActivityId, { c: string; label: string }> = {
  ...DISC,
  autre: { c: "#7A7F85", label: "Autre activité" },
};
