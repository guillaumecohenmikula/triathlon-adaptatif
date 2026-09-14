import { describe, expect, it } from "vitest";
import { BLOCKS } from "./blocks";
import type { BlockId } from "./blocks";
import { EXOS } from "./exercises";
import { GUIDES, GUIDES_FOR, guidesFor } from "./guides";
import { SESSION_GUIDES } from "./sessionGuides";

const exerciseNames = [
  ...new Set(Object.values(EXOS).flatMap((list) => (list ?? []).map((e) => e.n))),
];

describe("fiches d'exécution du renfo", () => {
  it("couvrent chaque exercice du programme", () => {
    const missing = exerciseNames.filter((n) => guidesFor(n).length === 0);
    expect(missing).toEqual([]);
  });

  it("ne renvoient que vers des fiches qui existent", () => {
    Object.values(GUIDES_FOR)
      .flat()
      .forEach((id) => expect(GUIDES[id]).toBeDefined());
  });

  it("donnent toujours une mise en place, un déroulé et des erreurs à éviter", () => {
    Object.values(GUIDES).forEach((g) => {
      expect(g.setup.length).toBeGreaterThan(0);
      expect(g.steps.length).toBeGreaterThan(0);
      expect(g.mistakes.length).toBeGreaterThan(0);
      expect(g.easier).not.toBe("");
      expect(g.harder).not.toBe("");
    });
  });
});

describe("fiches des séances d'endurance", () => {
  const endurance = (Object.keys(BLOCKS) as BlockId[]).filter((id) => BLOCKS[id].disc !== "renfo");

  it("couvrent chaque séance de course, de vélo et de natation", () => {
    expect(endurance.filter((id) => !SESSION_GUIDES[id])).toEqual([]);
  });

  it("disent toujours comment doser l'intensité", () => {
    endurance.forEach((id) => expect(SESSION_GUIDES[id]!.intensity.length).toBeGreaterThan(0));
  });

  it("expliquent les éducatifs de la séance technique", () => {
    expect(SESSION_GUIDES.swimTech!.drills!.map((d) => d.name)).toEqual([
      "Rattrapé",
      "Poings fermés",
      "Battements planche",
    ]);
  });
});
