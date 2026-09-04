import { describe, expect, it } from "vitest";
import { selectExos } from "../selectExos";

describe("règle 7, remplissage d'une séance de renfo", () => {
  it("retourne null pour un bloc qui n'est pas du renfo", () => {
    expect(selectExos("longRun", "base", 90, 1, {})).toBeNull();
  });

  it("réserve la place du gainage et le pose en dernier", () => {
    const r = selectExos("strFull", "base", 80, 1, {});
    expect(r).not.toBeNull();
    const items = r!.items;
    expect(items.at(-1)!.role).toBe("gainage");
    expect(items.filter((e) => e.role === "gainage")).toHaveLength(1);
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

    expect(neutre.items.find((e) => e.n.startsWith("Tractions"))!.sets).toBe("4 × 8");
    expect(dos.items[0].sets).toBe("5 × 8");
    expect(dos.items[0].zoneFocus).toBe(true);
  });

  it("ne priorise jamais le gainage, même si une zone correspond", () => {
    const r = selectExos("strFull", "base", 80, 1, { jambes: true, dos: true, bras: true })!;
    expect(r.items.at(-1)!.role).toBe("gainage");
    expect(r.items.find((e) => e.role === "gainage")!.zoneFocus).toBe(false);
  });
});

describe("règle 2, semaine allégée", () => {
  it("retire une série et raccourcit chaque exercice", () => {
    const normale = selectExos("strFull", "base", 80, 1, {})!;
    const allegee = selectExos("strFull", "base", 80, 4, {})!;

    expect(normale.items[0].sets).toBe("4 × 8");
    expect(allegee.items[0].sets).toBe("3 × 8");
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
    expect(base.items[0].sets).toBe("4 × 8");
    expect(dev.items[0].sets).toBe("4 × 6");
  });
});
