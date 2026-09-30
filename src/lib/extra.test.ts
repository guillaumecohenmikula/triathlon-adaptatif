import { describe, expect, it } from "vitest";
import { distanceInput, formatDistance, formatPaceValue, parseDistance, rpeLabel } from "./extra";

describe("distances", () => {
  it("lit les kilomètres avec une virgule ou un point, et range en mètres", () => {
    expect(parseDistance("course", "5,2")).toBe(5200);
    expect(parseDistance("velo", "30.5")).toBe(30500);
  });

  it("lit la natation en mètres", () => {
    expect(parseDistance("natation", "1500")).toBe(1500);
    expect(parseDistance("natation", "1 500")).toBe(1500);
  });

  it("ignore une saisie vide, nulle ou illisible au lieu de bloquer", () => {
    expect(parseDistance("course", "")).toBeUndefined();
    expect(parseDistance("course", "0")).toBeUndefined();
    expect(parseDistance("course", "cinq")).toBeUndefined();
  });

  it("affiche dans l'unité de la discipline", () => {
    expect(formatDistance("course", 5200)).toBe("5,2 km");
    expect(formatDistance("natation", 1500)).toMatch(/^1\s?500 m$/);
  });

  it("pré-remplit le champ dans l'unité de saisie", () => {
    expect(distanceInput("natation", 1500)).toBe("1500");
    expect(distanceInput("course", 5200)).toBe("5,2");
    expect(distanceInput("course")).toBe("");
  });
});

describe("effort et allure", () => {
  it("met des mots sur les bornes de l'échelle d'effort", () => {
    expect(rpeLabel(1)).toBe("très facile");
    expect(rpeLabel(6)).toMatch(/^modéré/);
    expect(rpeLabel(10)).toBe("maximal");
  });

  it("écrit une allure en minutes et secondes", () => {
    expect(formatPaceValue(327)).toBe("5'27");
    expect(formatPaceValue(300)).toBe("5'00");
  });
});
