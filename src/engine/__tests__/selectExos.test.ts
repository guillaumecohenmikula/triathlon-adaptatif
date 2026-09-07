import { describe, expect, it } from "vitest";
import { selectExos } from "../selectExos";

/** Nombre de séries lu dans une prescription du type « 4 × 6 ». */
const sets = (s: string) => Number(/^(\d+)/.exec(s)?.[1] ?? 0);

describe("règle 7, remplissage d'une séance de renfo", () => {
  it("retourne null pour un bloc qui n'est pas du renfo", () => {
    expect(selectExos("longRun", "base", 90, 1, {})).toBeNull();
  });

  it("pose le gainage en dernier quand le créneau est large", () => {
    const r = selectExos("strFull", "base", 110, 1, {});
    expect(r).not.toBeNull();
    const items = r!.items;
    expect(items.at(-1)!.role).toBe("gainage");
    expect(items.filter((e) => e.role === "gainage")).toHaveLength(1);
  });

  it("sacrifie le gainage avant les exercices lourds quand le créneau est court", () => {
    // Révision du 2026-09-03 : le gainage n'a plus sa place réservée d'avance.
    const court = selectExos("strFull", "base", 45, 1, {})!;
    expect(court.items.some((e) => e.role === "gainage")).toBe(false);
    expect(court.items[0].role).toBe("principal");
    expect(court.items.length).toBeGreaterThan(1);
  });

  it("garde l'ordre de priorité dans la séance rendue", () => {
    const r = selectExos("strFull", "base", 80, 1, {})!;
    const roles = r.items.map((e) => e.role);
    expect(roles.indexOf("principal")).toBeLessThan(roles.lastIndexOf("accessoire"));
  });

  it("tient dans le budget du créneau, échauffement compris", () => {
    const budget = 80;
    const r = selectExos("strFull", "base", budget, 1, {})!;
    const total = r.warm.d + r.items.reduce((a, e) => a + e.dur, 0);
    expect(total).toBeLessThanOrEqual(budget);
    expect(r.left).toBe(budget - total);
  });

  it("coupe des exercices quand le créneau raccourcit", () => {
    const long = selectExos("strFull", "base", 80, 1, {})!;
    const court = selectExos("strFull", "base", 45, 1, {})!;
    expect(court.items.length).toBeLessThan(long.items.length);
  });

  it("garde toujours au moins un exercice, même sur un créneau trop court", () => {
    const r = selectExos("strFull", "base", 20, 1, {})!;
    expect(r.items).toHaveLength(1);
    expect(r.left).toBe(0);
  });
});

describe("zones à développer", () => {
  it("remonte l'exercice qui touche une zone cochée et lui ajoute une série", () => {
    const neutre = selectExos("strFull", "base", 80, 1, {})!;
    const dos = selectExos("strFull", "base", 80, 1, { dos: true })!;

    expect(neutre.items[0].n).toBe("Squat");
    expect(dos.items[0].n).toBe("Tractions ou tirage vertical");

    const avant = neutre.items.find((e) => e.n.startsWith("Tractions"))!;
    expect(sets(dos.items[0].sets)).toBe(sets(avant.sets) + 1);
    expect(dos.items[0].zoneFocus).toBe(true);
  });

  it("ne priorise jamais le gainage, même si une zone correspond", () => {
    const r = selectExos("strFull", "base", 110, 1, { jambes: true, dos: true, bras: true })!;
    expect(r.items.at(-1)!.role).toBe("gainage");
    expect(r.items.find((e) => e.role === "gainage")!.zoneFocus).toBe(false);
  });
});

describe("règle 2, semaine allégée", () => {
  it("retire une série et raccourcit chaque exercice", () => {
    const normale = selectExos("strFull", "base", 80, 1, {})!;
    const allegee = selectExos("strFull", "base", 80, 4, {})!;

    expect(sets(allegee.items[0].sets)).toBe(sets(normale.items[0].sets) - 1);
    expect(allegee.items[0].dur).toBeLessThan(normale.items[0].dur);
  });

  it("ne descend jamais sous 2 séries", () => {
    const r = selectExos("strFull", "affutage", 80, 4, {})!;
    r.items.forEach((e) => {
      const n = Number(/^(\d+)/.exec(e.sets)?.[1] ?? 0);
      expect(n).toBeGreaterThanOrEqual(2);
    });
  });
});

describe("phases", () => {
  it("change la prescription selon la phase", () => {
    const base = selectExos("strFull", "base", 80, 1, {})!;
    const dev = selectExos("strFull", "dev", 80, 1, {})!;
    expect(base.items[0].n).toBe(dev.items[0].n);
    expect(base.items[0].sets).not.toBe(dev.items[0].sets);
    expect(base.items[0].load).toContain("80 %");
    expect(dev.items[0].load).toContain("85 %");
  });
});

describe("pliométrie", () => {
  const isJump = (n: string) => /saut|bondissement/i.test(n);

  it("entre dans les séances qui sollicitent les jambes", () => {
    ["strFull", "strLow", "strFullHome", "strLowHome"].forEach((block) => {
      const r = selectExos(block, "base", 90, 1, {})!;
      expect(r.items.some((e) => isJump(e.n))).toBe(true);
    });
  });

  it("passe avant les accessoires, dont l'effet est moins documenté", () => {
    const r = selectExos("strFull", "base", 110, 1, {})!;
    const jump = r.items.findIndex((e) => isJump(e.n));
    const firstAccessory = r.items.findIndex((e) => e.role === "accessoire");
    expect(jump).toBeGreaterThan(-1);
    expect(jump).toBeLessThan(firstAccessory);
  });

  it("se réduit à l'affûtage plutôt que de disparaître", () => {
    const r = selectExos("strFull", "affutage", 90, 1, {})!;
    const jump = r.items.find((e) => isJump(e.n));
    expect(jump).toBeDefined();
    expect(jump!.load.toLowerCase()).toContain("sans fatigue");
  });
});

describe("différence réelle entre les trois modes", () => {
  const seance = (mode: "perf" | "mixte" | "physique") =>
    selectExos("strFull", "base", 110, 1, {}, mode)!;

  const repsOf = (s: string) => Number(/^\d+ × (\d+)/.exec(s)?.[1] ?? 0);

  it("raccourcit les séries en performance et les allonge en physique", () => {
    const squat = (m: "perf" | "mixte" | "physique") =>
      repsOf(seance(m).items.find((e) => e.n === "Squat")!.sets);

    expect(squat("perf")).toBeLessThan(squat("mixte"));
    expect(squat("physique")).toBeGreaterThan(squat("mixte"));
  });

  it("ne descend pas sous 4 répétitions ni au-dessus de 12", () => {
    ["perf", "physique"].forEach((m) => {
      seance(m as "perf").items
        .filter((e) => e.role === "principal" || e.role === "secondaire")
        .forEach((e) => {
          const r = repsOf(e.sets);
          if (r > 0) {
            expect(r).toBeGreaterThanOrEqual(4);
            expect(r).toBeLessThanOrEqual(12);
          }
        });
    });
  });

  it("laisse les accessoires et le gainage identiques dans les trois modes", () => {
    const autres = (m: "perf" | "mixte" | "physique") =>
      seance(m).items
        .filter((e) => e.role === "accessoire" || e.role === "gainage")
        .map((e) => e.sets)
        .join("|");
    expect(autres("perf")).toBe(autres("mixte"));
    expect(autres("physique")).toBe(autres("mixte"));
  });

  it("ne touche pas aux prescriptions qui ne sont pas de simples séries", () => {
    // Le gainage est en secondes, la pliométrie porte un libellé : rien ne doit bouger.
    const plyo = (m: "perf" | "mixte" | "physique") =>
      seance(m).items.find((e) => /saut/i.test(e.n))!.sets;
    expect(plyo("perf")).toBe(plyo("mixte"));
    expect(plyo("physique")).toBe(plyo("mixte"));
  });

  it("se combine avec la semaine allégée sans se contredire", () => {
    const normale = selectExos("strFull", "base", 110, 1, {}, "physique")!;
    const allegee = selectExos("strFull", "base", 110, 4, {}, "physique")!;
    const series = (r: typeof normale) => Number(/^(\d+)/.exec(r.items[0].sets)?.[1] ?? 0);
    expect(series(allegee)).toBe(series(normale) - 1);
  });
});
