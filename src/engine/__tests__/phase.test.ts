import { describe, expect, it } from "vitest";
import { phaseFor, targetsFor, timing } from "../phase";
import { phase } from "./helpers";

const RACE = "2027-06-13";
const weeksBefore = (n: number) => new Date(RACE).getTime() - n * 7 * 86_400_000;

describe("règle 1, la phase se déduit de la date de course", () => {
  it("bascule aux bons seuils", () => {
    expect(phaseFor(27).id).toBe("base");
    expect(phaseFor(26).id).toBe("dev");
    expect(phaseFor(13).id).toBe("dev");
    expect(phaseFor(12).id).toBe("spe");
    expect(phaseFor(4).id).toBe("spe");
    expect(phaseFor(3).id).toBe("affutage");
    expect(phaseFor(0).id).toBe("affutage");
  });
});

describe("règle 2, cycle de quatre semaines", () => {
  it("compte les jours et les semaines restantes", () => {
    const t = timing(RACE, weeksBefore(10));
    expect(t.days).toBe(70);
    expect(t.weeks).toBe(10);
    expect(t.phase.id).toBe("spe");
  });

  it("allège une semaine sur quatre", () => {
    expect(timing(RACE, weeksBefore(8)).easyWeek).toBe(true);
    expect(timing(RACE, weeksBefore(8)).weekInBlock).toBe(4);
    expect(timing(RACE, weeksBefore(7)).easyWeek).toBe(false);
    expect(timing(RACE, weeksBefore(7)).weekInBlock).toBe(1);
  });

  it("ne descend jamais sous zéro jour une fois la course passée", () => {
    const t = timing(RACE, new Date("2027-08-01").getTime());
    expect(t.days).toBe(0);
    expect(t.phase.id).toBe("affutage");
  });
});

describe("cibles hebdomadaires", () => {
  it("applique le format visé", () => {
    const base = phase("base");
    expect(targetsFor(base, 1, "perf").course).toBe(140);
    expect(targetsFor(base, 0.7, "perf").course).toBe(100); // 140 × 0,7 arrondi au pas de 5
    expect(targetsFor(base, 1.5, "perf").course).toBe(210);
  });

  it("règle 4 : le mode physique multiplie la cible renfo par 1,8", () => {
    const base = phase("base");
    expect(targetsFor(base, 1, "perf").renfo).toBe(60);
    expect(targetsFor(base, 1, "mixte").renfo).toBe(70); // × 1,2
    expect(targetsFor(base, 1, "physique").renfo).toBe(110); // × 1,8
  });

  it("ne touche pas aux disciplines d'endurance selon le mode", () => {
    const base = phase("base");
    expect(targetsFor(base, 1, "physique").course).toBe(targetsFor(base, 1, "perf").course);
  });
});
