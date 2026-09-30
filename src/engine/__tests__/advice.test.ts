import { describe, expect, it } from "vitest";
import type { Session } from "../../data/types";
import { shares, signals } from "../advice";

const session = (over: Partial<Session> = {}): Session => ({
  id: over.id ?? "s1",
  week: "2026-09-14",
  day: "Mardi",
  title: "Séance",
  disc: "course",
  items: [],
  state: "fait",
  ...over,
});

// Jeudi 17 septembre 2026.
const now = new Date(2026, 8, 17, 18, 0);
const ids = (s: ReturnType<typeof signals>) => s.map((x) => x.id);

describe("conseil discret", () => {
  it("ne dit rien tant que rien n'a été fait", () => {
    expect(signals([], "2026-09-14", now)).toEqual([]);
  });

  it("signale une discipline laissée de côté depuis plus de deux semaines", () => {
    const out = signals(
      [
        session({ id: "a", disc: "natation", week: "2026-08-31", day: "Lundi", actual: { minutes: 45 } }),
        session({ id: "b", disc: "course", week: "2026-09-14", day: "Mardi", actual: { minutes: 45 } }),
      ],
      "2026-09-14",
      now,
    );
    expect(ids(out)).toContain("gap-natation");
    expect(ids(out)).not.toContain("gap-course");
  });

  it("prévient quand la semaine dépasse nettement les précédentes", () => {
    const past = ["2026-08-24", "2026-08-31", "2026-09-07"].map((week, i) =>
      session({ id: `p${i}`, week, actual: { minutes: 60 } }),
    );
    const out = signals(
      [...past, session({ id: "now", week: "2026-09-14", actual: { minutes: 200 } })],
      "2026-09-14",
      now,
    );
    expect(ids(out)).toContain("volume");
  });

  it("reprend le constat de la sortie longue courue trop vite", () => {
    const out = signals(
      [session({ actual: { minutes: 60, distance: 11000 } })],
      "2026-09-14",
      now,
    );
    const pace = out.find((s) => s.id === "pace");
    expect(pace?.text).toContain("5'27/km");
  });

  it("ne dit rien sur une sortie longue déjà courue à l'allure facile", () => {
    const out = signals([session({ actual: { minutes: 70, distance: 10000 } })], "2026-09-14", now);
    expect(ids(out)).not.toContain("pace");
  });
});

describe("répartition du volume", () => {
  it("donne la part de chaque discipline sur ce qui a été fait", () => {
    const s = shares([
      session({ id: "a", disc: "course", actual: { minutes: 60 } }),
      session({ id: "b", disc: "velo", actual: { minutes: 20 } }),
      session({ id: "c", disc: "natation", actual: { minutes: 20 }, state: "rate" }),
    ]);
    expect(s.course).toBeCloseTo(0.75);
    expect(s.velo).toBeCloseTo(0.25);
    expect(s.natation).toBeUndefined();
  });
});
