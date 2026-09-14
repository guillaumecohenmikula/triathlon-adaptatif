import { describe, expect, it } from "vitest";
import { EXOS } from "../../data/exercises";
import { clock, parseRest, restSeconds } from "../rest";

describe("temps de repos lu dans la consigne", () => {
  it("lit les minutes, avec ou sans secondes", () => {
    expect(parseRest("Descente en 3 s. Repos 2 min 30.")).toBe(150);
    expect(parseRest("Épaules basses. Repos 1 min 30.")).toBe(90);
    expect(parseRest("Omoplates serrées. Repos 2 min.")).toBe(120);
  });

  it("lit les secondes dans les deux tournures du programme", () => {
    expect(parseRest("Bas du dos plaqué au sol. Repos 45 s.")).toBe(45);
    expect(parseRest("Fessiers serrés, corps aligné. 30 s de repos.")).toBe(30);
  });

  it("ne confond pas une durée de descente avec un repos", () => {
    expect(parseRest("Descente en 3 s, genoux dans l'axe.")).toBeNull();
  });

  it("trouve un repos dans chaque consigne du programme", () => {
    const cues = Object.values(EXOS).flatMap((l) => (l ?? []).map((e) => e.cue));
    expect(cues.filter((c) => parseRest(c) === null)).toEqual([]);
  });

  it("retombe sur le rôle de l'exercice quand la consigne ne dit rien", () => {
    expect(restSeconds("Sans indication", "principal")).toBe(150);
    expect(restSeconds(undefined, "gainage")).toBe(30);
  });
});

describe("affichage du compte à rebours", () => {
  it("écrit minutes et secondes, sans descendre sous zéro", () => {
    expect(clock(90)).toBe("1:30");
    expect(clock(5.2)).toBe("0:06");
    expect(clock(-3)).toBe("0:00");
  });
});
