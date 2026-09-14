import { describe, expect, it } from "vitest";
import { buildSteps } from "../steps";
import { locate, timeable, timeline, totalSeconds } from "../timeline";

const steps = (id: Parameters<typeof buildSteps>[0][0]["id"], dur: number) =>
  buildSteps([{ id, dur }], "dev", 1, {});

describe("chrono des séances d'endurance", () => {
  it("déplie le 4 × 8 min en efforts et récupérations", () => {
    const phases = timeline(steps("quality", 70));
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
    expect(phases[1]).toMatchObject({ label: "Effort 1 sur 4", sec: 480 });
    expect(phases[2].sec).toBe(180);
  });

  it("dure exactement la séance choisie", () => {
    expect(totalSeconds(timeline(steps("quality", 70)))).toBe(70 * 60);
    expect(totalSeconds(timeline(steps("longRun", 65)))).toBe(65 * 60);
  });

  it("adapte la consigne de récupération à la discipline", () => {
    const bike = timeline(steps("bikeGymInt", 60)).find((p) => p.kind === "rest")!;
    expect(bike.text).toMatch(/Résistance minimale/);
  });

  it("ne sert ni à la piscine ni au renfo", () => {
    expect(timeable(steps("longRun", 60))).toBe(true);
    expect(timeable(steps("bikeGym", 45))).toBe(true);
    expect(timeable(steps("swimEnd", 60))).toBe(false);
    expect(timeable(steps("strFull", 60))).toBe(false);
  });
});

describe("position dans le chrono", () => {
  const phases = timeline(steps("quality", 70));
  const warm = phases[0].sec;

  it("commence par la première phase", () => {
    expect(locate(phases, 0)).toMatchObject({ index: 0, remaining: warm });
  });

  it("bascule sur le premier effort à la fin de l'échauffement", () => {
    expect(locate(phases, warm)).toMatchObject({ index: 1, remaining: 480, start: warm });
  });

  it("signale la fin une fois la dernière phase passée", () => {
    expect(locate(phases, 70 * 60).index).toBe(phases.length);
  });
});
