import { describe, expect, it } from "vitest";
import { dateOf, dayLabel, frDate, isToday, mondayKey, todayIndex } from "./date";

describe("clé de semaine", () => {
  it("renvoie le lundi de la semaine, quel que soit le jour", () => {
    // 2026-08-31 est un lundi.
    expect(mondayKey(new Date(2026, 7, 31))).toBe("2026-08-31");
    expect(mondayKey(new Date(2026, 8, 4))).toBe("2026-08-31"); // vendredi
    expect(mondayKey(new Date(2026, 8, 6))).toBe("2026-08-31"); // dimanche
    expect(mondayKey(new Date(2026, 8, 7))).toBe("2026-09-07"); // lundi suivant
  });

  it("ne bascule pas d'un jour à cause du fuseau en début de journée", () => {
    // Une heure locale très matinale tombait la veille une fois convertie en UTC.
    expect(mondayKey(new Date(2026, 7, 31, 0, 30))).toBe("2026-08-31");
    expect(mondayKey(new Date(2026, 8, 6, 23, 45))).toBe("2026-08-31");
  });
});

describe("dates des jours de la semaine", () => {
  it("place chaque jour à sa date réelle", () => {
    expect(dateOf("2026-08-31", "Lundi").getDate()).toBe(31);
    expect(dateOf("2026-08-31", "Mardi").getDate()).toBe(1);
    expect(dateOf("2026-08-31", "Dimanche").getDate()).toBe(6);
  });

  it("passe le mois sans se tromper", () => {
    expect(dateOf("2026-08-31", "Mardi").getMonth()).toBe(8); // septembre
  });

  it("écrit une étiquette lisible", () => {
    expect(dayLabel("2026-08-31", "Lundi")).toMatch(/31/);
    expect(dayLabel("2026-08-31", "Samedi")).toMatch(/5/);
  });
});

describe("repères de temps", () => {
  it("lit la date de semaine sans décalage", () => {
    expect(frDate("2026-08-31")).toMatch(/31/);
  });

  it("numérote les jours à partir du lundi", () => {
    expect(todayIndex(new Date(2026, 7, 31))).toBe(0);
    expect(todayIndex(new Date(2026, 8, 6))).toBe(6);
  });

  it("reconnaît le jour courant", () => {
    const vendredi = new Date(2026, 8, 4);
    expect(isToday("2026-08-31", "Vendredi", vendredi)).toBe(true);
    expect(isToday("2026-08-31", "Samedi", vendredi)).toBe(false);
  });
});
