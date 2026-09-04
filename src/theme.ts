import type { Discipline } from "./data/types";

export const INK = "#12202B";
export const PAPER = "#EDEFF1";
export const LINE = "#D3D8DC";
export const MUTED = "#63707A";
export const WARN_BG = "#F7ECD8";
export const WARN_TX = "#6B4708";

export const DISC: Record<Discipline, { c: string; label: string }> = {
  course: { c: "#B0451C", label: "Course" },
  velo: { c: "#1D6FA5", label: "Vélo" },
  natation: { c: "#0F7A6B", label: "Natation" },
  renfo: { c: "#5C4B8A", label: "Renfo" },
};
