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

describe("cibles calées sur le temps déclaré", () => {
  const base = phase("base");

  it("ne touche à rien quand le temps déclaré couvre les cibles", () => {
    const libre = targetsFor(base, 1, "perf");
    const large = targetsFor(base, 1, "perf", 1000);
    expect(large).toEqual(libre);
  });

  it("ramène les cibles au volume réellement disponible", () => {
    const t = targetsFor(base, 1, "perf", 200);
    const total = Object.values(t).reduce((a, v) => a + v, 0);
    // Arrondi au pas de 5 sur quatre disciplines : une marge de 10 min suffit.
    expect(Math.abs(total - 200)).toBeLessThanOrEqual(10);
  });

  it("garde les proportions de la phase en réduisant", () => {
    const plein = targetsFor(base, 1, "perf");
    const reduit = targetsFor(base, 1, "perf", 160);
    const ratio = (x: typeof plein) => x.course / x.velo;
    expect(ratio(reduit)).toBeCloseTo(ratio(plein), 1);
  });

  it("laisse un déficit mesurable au lieu d'un retard maximal permanent", () => {
    // Le cas de Guil : 102 min réelles pour des cibles théoriques à plus de 300.
    const theorique = targetsFor(base, 1, "mixte");
    const cale = targetsFor(base, 1, "mixte", 240);
    expect(cale.course).toBeLessThan(theorique.course);
    expect(cale.course).toBeGreaterThan(0);
  });

  it("ignore un temps déclaré nul ou absurde", () => {
    expect(targetsFor(base, 1, "perf", 0)).toEqual(targetsFor(base, 1, "perf"));
    expect(targetsFor(base, 1, "perf", -50)).toEqual(targetsFor(base, 1, "perf"));
  });
});
