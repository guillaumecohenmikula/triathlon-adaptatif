import { describe, expect, it } from "vitest";
import { migrate } from "../migrate";
import type { LegacyExtra, LegacyJournal, LegacyWeek } from "../migrate";

const journal = (over: Partial<LegacyJournal> = {}): LegacyJournal => ({
  key: "2026-09-07|Mardi",
  week: "2026-09-07",
  day: "Mardi",
  blocks: [{ id: "longRun", dur: 70 }],
  state: "fait",
  ...over,
});

describe("conversion de l'ancien carnet", () => {
  it("garde le prévu et le réalisé dans une seule séance", () => {
    const week: LegacyWeek = {
      week: "2026-09-07",
      picked: [{ id: "Mardi", day: "Mardi", blocks: [{ id: "longRun", dur: 70 }] }],
    };
    const [s] = migrate([journal()], [week], []);
    expect(s.title).toBe("Sortie longue");
    expect(s.disc).toBe("course");
    expect(s.state).toBe("fait");
    expect(s.actual?.minutes).toBe(70);
    expect(s.items).toHaveLength(1);
  });

  it("produit des identifiants déterministes, pour ne pas dupliquer à la synchronisation", () => {
    const week: LegacyWeek = {
      week: "2026-09-07",
      picked: [{ id: "abc", day: "Jeudi", blocks: [{ id: "bikeGym", dur: 45 }] }],
    };
    const first = migrate([], [week], []);
    const second = migrate([], [week], []);
    expect(first[0].id).toBe(second[0].id);
    expect(first[0].id).toBe("s-2026-09-07-abc");
  });

  it("reprend un bilan dont la séance planifiée a disparu", () => {
    const [s] = migrate([journal({ key: "2026-08-31|Samedi", week: "2026-08-31", day: "Samedi" })], [], []);
    expect(s.week).toBe("2026-08-31");
    expect(s.day).toBe("Samedi");
    expect(s.state).toBe("fait");
  });

  it("convertit une séance extra avec ses chiffres", () => {
    const extra: LegacyExtra = {
      id: "e1",
      week: "2026-09-14",
      day: "Lundi",
      activity: "course",
      label: "Footing du matin",
      dur: 30,
      km: 5.4,
      rpe: 8,
      note: "Jambes lourdes",
    };
    const [s] = migrate([], [], [extra]);
    expect(s.id).toBe("x-e1");
    expect(s.title).toBe("Footing du matin");
    expect(s.state).toBe("fait");
    expect(s.actual).toEqual({ minutes: 30, distance: 5400, rpe: 8 });
    expect(s.note).toBe("Jambes lourdes");
  });

  it("nomme une activité hors triathlon quand elle n'a pas de libellé", () => {
    const [s] = migrate([], [], [{ id: "e2", week: "2026-09-14", day: "Mardi", activity: "autre", dur: 60 }]);
    expect(s.title).toBe("Autre activité");
    expect(s.disc).toBe("autre");
  });

  it("laisse de côté ce qui était supprimé, et les séances vides", () => {
    const out = migrate(
      [journal({ deleted: true })],
      [{ week: "2026-09-07", picked: [{ id: "x", day: "Lundi", blocks: [] }] }],
      [{ id: "e3", week: "2026-09-07", day: "Lundi", activity: "velo", dur: 30, deleted: true }],
    );
    expect(out).toEqual([]);
  });
});
