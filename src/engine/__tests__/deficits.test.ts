import { describe, expect, it } from "vitest";
import type { Journal, JournalEntry, SessionState, Targets } from "../../data/types";
import { deficits } from "../deficits";

const TARGETS: Targets = { course: 100, velo: 100, natation: 100, renfo: 100 };
const CURRENT = "2026-08-31";

const entry = (week: string, day: string, dur: number, state: SessionState): JournalEntry => ({
  week,
  day,
  place: "exterieur",
  blocks: [{ id: "longRun", dur }],
  state,
});

const journal = (...entries: JournalEntry[]): Journal =>
  Object.fromEntries(entries.map((e) => [`${e.week}|${e.day}`, e]));

describe("règle 5, calcul du retard", () => {
  it("ne renvoie aucun retard quand le journal est vide", () => {
    expect(deficits({}, TARGETS, CURRENT)).toEqual({ weeks: 0, byDisc: {} });
  });

  it("mesure le manque en part de la cible", () => {
    const j = journal(
      entry("2026-08-17", "Samedi", 50, "fait"),
      entry("2026-08-24", "Samedi", 50, "fait"),
    );
    const d = deficits(j, TARGETS, CURRENT);
    expect(d.weeks).toBe(2);
    // 100 min faites pour une cible de 200 sur deux semaines.
    expect(d.byDisc.course).toBeCloseTo(0.5);
    // Rien de fait dans les autres disciplines.
    expect(d.byDisc.natation).toBe(1);
  });

  it("compte une séance partielle pour moitié et une séance ratée pour rien", () => {
    const partiel = deficits(journal(entry("2026-08-24", "Samedi", 100, "partiel")), TARGETS, CURRENT);
    const rate = deficits(journal(entry("2026-08-24", "Samedi", 100, "rate")), TARGETS, CURRENT);
    expect(partiel.byDisc.course).toBeCloseTo(0.5);
    expect(rate.byDisc.course).toBe(1);
  });

  it("exclut la semaine en cours, qui n'est pas finie", () => {
    const j = journal(entry(CURRENT, "Lundi", 100, "fait"));
    expect(deficits(j, TARGETS, CURRENT)).toEqual({ weeks: 0, byDisc: {} });
  });

  it("ne regarde que les deux dernières semaines renseignées", () => {
    const j = journal(
      entry("2026-08-03", "Samedi", 100, "fait"),
      entry("2026-08-10", "Samedi", 100, "fait"),
      entry("2026-08-17", "Samedi", 0, "rate"),
      entry("2026-08-24", "Samedi", 0, "rate"),
    );
    const d = deficits(j, TARGETS, CURRENT);
    expect(d.weeks).toBe(2);
    // Les deux bonnes semaines sont hors fenêtre : le retard est total.
    expect(d.byDisc.course).toBe(1);
  });

  it("ne renvoie jamais de retard négatif quand la cible est dépassée", () => {
    const j = journal(entry("2026-08-24", "Samedi", 500, "fait"));
    expect(deficits(j, TARGETS, CURRENT).byDisc.course).toBe(0);
  });
});
