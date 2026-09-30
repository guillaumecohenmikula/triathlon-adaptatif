import { describe, expect, it } from "vitest";
import type { Item } from "../../data/types";
import { locate, timeable, timeline, totalSeconds } from "../timeline";

const warm: Item = { id: "a", label: "Échauffement", kind: "time", minutes: 15 };
const main: Item = {
  id: "b",
  label: "Corps de séance",
  kind: "time",
  minutes: 41,
  rep: { n: 4, work: 8, rest: 3 },
  note: "Allure la plus rapide tenable sur les quatre séries",
};
const cool: Item = { id: "c", label: "Retour au calme", kind: "time", minutes: 10 };
const items = [warm, main, cool];

describe("chrono d'une séance", () => {
  it("déplie le 4 × 8 min en efforts et récupérations", () => {
    const phases = timeline(items, "course");
    expect(phases.map((p) => p.kind)).toEqual([
      "steady",
      "work",
      "rest",
      "work",
      "rest",
      "work",
      "rest",
      "work",
      "steady",
    ]);
    expect(phases[1]).toMatchObject({ label: "Effort 1 sur 4", sec: 480, item: "b" });
    expect(phases[2].sec).toBe(180);
  });

  it("dure la somme des éléments, récupérations comprises", () => {
    expect(totalSeconds(timeline(items, "course"))).toBe((15 + 41 + 10) * 60);
  });

  it("adapte la consigne de récupération à la discipline", () => {
    expect(timeline(items, "velo").find((p) => p.kind === "rest")!.text).toMatch(/Résistance/);
    expect(timeline(items, "course").find((p) => p.kind === "rest")!.text).toMatch(/Trot/);
  });

  it("ne sert ni à la piscine ni à une séance d'exercices", () => {
    expect(timeable(items, "course")).toBe(true);
    expect(timeable(items, "natation")).toBe(false);
    expect(timeable([{ id: "x", label: "Squat", kind: "reps", sets: 4 }], "renfo")).toBe(false);
    expect(timeable([], "course")).toBe(false);
  });
});

describe("position dans le chrono", () => {
  const phases = timeline(items, "course");

  it("commence par la première phase", () => {
    expect(locate(phases, 0)).toMatchObject({ index: 0, remaining: 900 });
  });

  it("bascule sur le premier effort à la fin de l'échauffement", () => {
    expect(locate(phases, 900)).toMatchObject({ index: 1, remaining: 480, start: 900 });
  });

  it("signale la fin une fois la dernière phase passée", () => {
    expect(locate(phases, 66 * 60).index).toBe(phases.length);
  });
});
