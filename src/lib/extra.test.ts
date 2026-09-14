import { describe, expect, it } from "vitest";
import { distanceInput, formatDistance, parseDistance, rpeLabel } from "./extra";

describe("distance d'une séance extra", () => {
  it("lit les kilomètres avec une virgule ou un point", () => {
    expect(parseDistance("course", "5,2")).toBe(5.2);
    expect(parseDistance("velo", "30.5")).toBe(30.5);
  });

  it("lit la natation en mètres et la range en kilomètres", () => {
    expect(parseDistance("natation", "1500")).toBe(1.5);
    expect(parseDistance("natation", "1 500")).toBe(1.5);
  });

  it("ignore une saisie vide, nulle ou illisible au lieu de bloquer", () => {
    expect(parseDistance("course", "")).toBeUndefined();
    expect(parseDistance("course", "0")).toBeUndefined();
    expect(parseDistance("course", "cinq")).toBeUndefined();
  });

  it("affiche dans l'unité de la discipline", () => {
    expect(formatDistance("course", 5.2)).toBe("5,2 km");
    expect(formatDistance("natation", 1.5)).toMatch(/^1\s?500 m$/);
  });

  it("pré-remplit le champ dans l'unité de saisie", () => {
    expect(distanceInput("natation", 1.5)).toBe("1500");
    expect(distanceInput("course", 5.2)).toBe("5,2");
    expect(distanceInput("course")).toBe("");
  });
});

describe("effort ressenti", () => {
  it("met des mots sur les bornes de l'échelle", () => {
    expect(rpeLabel(1)).toBe("très facile");
    expect(rpeLabel(6)).toMatch(/^modéré/);
    expect(rpeLabel(10)).toBe("maximal");
  });
});
