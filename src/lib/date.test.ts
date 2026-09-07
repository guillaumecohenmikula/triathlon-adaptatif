import { describe, expect, it } from "vitest";
import {
  dateOf,
  dayLabel,
  frDate,
  frozenUntil,
  humanDuration,
  isToday,
  mondayKey,
  shiftWeek,
  todayIndex,
  weeksBetween,
} from "./date";

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

describe("navigation entre semaines", () => {
  it("avance et recule d'une semaine", () => {
    expect(shiftWeek("2026-08-31", 1)).toBe("2026-09-07");
    expect(shiftWeek("2026-08-31", -1)).toBe("2026-08-24");
    expect(shiftWeek("2026-08-31", 0)).toBe("2026-08-31");
  });

  it("passe les changements de mois et d'année", () => {
    expect(shiftWeek("2026-12-28", 1)).toBe("2027-01-04");
    expect(shiftWeek("2027-01-04", -1)).toBe("2026-12-28");
  });

  it("compte les semaines d'écart", () => {
    expect(weeksBetween("2026-08-31", "2026-09-07")).toBe(1);
    expect(weeksBetween("2026-08-31", "2026-08-17")).toBe(-2);
    expect(weeksBetween("2026-08-31", "2026-08-31")).toBe(0);
  });

  it("ne se laisse pas piéger par le changement d'heure", () => {
    // Fin octobre 2026 : le passage à l'heure d'hiver ajoute une heure dans la semaine.
    expect(shiftWeek("2026-10-19", 1)).toBe("2026-10-26");
    expect(weeksBetween("2026-10-19", "2026-11-02")).toBe(2);
  });
});

describe("ce qui est figé selon la semaine consultée", () => {
  const lundi = new Date(2026, 8, 7); // 7 septembre 2026, un lundi
  const jeudi = new Date(2026, 8, 10);

  it("fige toute une semaine passée", () => {
    expect(frozenUntil("2026-08-31", jeudi)).toBe(7);
  });

  it("ne fige rien dans une semaine à venir", () => {
    expect(frozenUntil("2026-09-14", jeudi)).toBe(0);
  });

  it("fige la semaine en cours jusqu'à aujourd'hui", () => {
    expect(frozenUntil("2026-09-07", jeudi)).toBe(3);
    expect(frozenUntil("2026-09-07", lundi)).toBe(0);
  });
});

describe("durées lisibles", () => {
  it("garde les minutes sous une heure", () => {
    expect(humanDuration(45)).toBe("45 min");
    expect(humanDuration(0)).toBe("0 min");
  });

  it("passe en heures au-delà", () => {
    expect(humanDuration(60)).toBe("1 h");
    expect(humanDuration(255)).toBe("4 h 15");
    expect(humanDuration(365)).toBe("6 h 05");
  });
});
