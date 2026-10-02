import { describe, expect, it } from "vitest";
import type { Session } from "../../data/types";
import { heart, movements, paces, streak, weekly } from "../kpi";
import { estimated1RM } from "../session";

const session = (over: Partial<Session> = {}): Session => ({
  id: over.id ?? "s1",
  week: "2026-09-14",
  day: "Mardi",
  title: "Sortie longue",
  disc: "course",
  items: [],
  state: "fait",
  ...over,
});

describe("volume par semaine", () => {
  it("ne compte que les séances faites, et compte les partielles à moitié", () => {
    const [w] = weekly([
      session({ id: "a", actual: { minutes: 60 } }),
      session({ id: "b", actual: { minutes: 40 }, state: "partiel" }),
      session({ id: "c", actual: { minutes: 90 }, state: "rate" }),
      session({ id: "d", actual: { minutes: 30 }, state: undefined }),
    ]);
    expect(w.sessions).toBe(2);
    expect(w.minutes).toBe(80);
  });

  it("retient la durée de la montre plutôt que celle prévue", () => {
    const s = session({
      items: [{ id: "i", label: "Corps de séance", kind: "time", minutes: 60 }],
      actual: { minutes: 47 },
    });
    expect(weekly([s])[0].minutes).toBe(47);
  });

  it("retombe sur le prévu quand la montre n'a rien donné", () => {
    const s = session({ items: [{ id: "i", label: "Corps", kind: "time", minutes: 55 }] });
    expect(weekly([s])[0].minutes).toBe(55);
  });

  it("cumule la charge d'entraînement des séances qui portent un effort ressenti", () => {
    const [w] = weekly([
      session({ id: "a", actual: { minutes: 60, rpe: 7 } }),
      session({ id: "b", actual: { minutes: 30 } }),
    ]);
    expect(w.load).toBe(420);
    expect(w.hasLoad).toBe(true);
  });
});

describe("série de semaines tenues", () => {
  const stats = (weeks: string[]) =>
    weekly(weeks.map((week, i) => session({ id: `s${i}`, week, actual: { minutes: 30 } })));

  it("compte les semaines consécutives", () => {
    const s = stats(["2026-09-14", "2026-09-07", "2026-08-31"]);
    expect(streak(s, "2026-09-14", "2026-09-07")).toBe(3);
  });

  it("ne casse pas la série tant que la semaine en cours est vide", () => {
    const s = stats(["2026-09-07", "2026-08-31"]);
    expect(streak(s, "2026-09-14", "2026-09-07")).toBe(2);
  });

  it("repart de zéro après une semaine sautée", () => {
    const s = stats(["2026-08-24"]);
    expect(streak(s, "2026-09-14", "2026-09-07")).toBe(0);
  });
});

describe("allures", () => {
  it("compte au kilomètre en course et au 100 m en natation", () => {
    const run = paces([session({ actual: { minutes: 50, distance: 10000 } })], "course");
    expect(Math.round(run[0].pace)).toBe(300);
    const swim = paces(
      [session({ disc: "natation", actual: { minutes: 30, distance: 1000 } })],
      "natation",
    );
    expect(Math.round(swim[0].pace)).toBe(180);
  });

  it("écarte les séances sans distance", () => {
    expect(paces([session({ actual: { minutes: 45 } })], "course")).toEqual([]);
  });
});

describe("progression en renfo", () => {
  const squat = session({
    disc: "renfo",
    title: "Renfo",
    items: [{ id: "i1", movement: "squat", label: "Squat", kind: "reps", sets: 3, reps: "6" }],
    done: {
      i1: {
        sets: [
          { reps: 6, load: 60 },
          { reps: 6, load: 70 },
        ],
      },
    },
  });

  it("cumule le tonnage et retient le meilleur record estimé", () => {
    const [m] = movements([squat]);
    expect(m.label).toBe("Squat");
    expect(m.volume).toBe(6 * 60 + 6 * 70);
    expect(m.best).toBe(estimated1RM(6, 70));
  });

  it("retient le plus long maintien d'un gainage, sans parler de charge", () => {
    const [m] = movements([
      session({
        disc: "renfo",
        items: [{ id: "g1", movement: "planche", label: "Planche", kind: "hold", sets: 3, seconds: 40 }],
        done: { g1: { sets: [{ seconds: 40 }, { seconds: 48 }, { seconds: 35 }] } },
      }),
    ]);
    expect(m.bestHold).toBe(48);
    expect(m.best).toBeUndefined();
    expect(m.volume).toBe(0);
  });

  it("ignore les exercices sur lesquels rien n'a été noté", () => {
    expect(movements([session({ disc: "renfo", items: [{ id: "i1", label: "Squat", kind: "reps" }] })])).toEqual([]);
  });
});

describe("fréquence cardiaque", () => {
  it("moyenne les séances qui en portent une et retient le maximum", () => {
    const h = heart([
      session({ id: "a", actual: { minutes: 60, avgHr: 140, maxHr: 165 } }),
      session({ id: "b", actual: { minutes: 40, avgHr: 150 } }),
      session({ id: "c", actual: { minutes: 30 } }),
    ]);
    expect(h).toEqual({ sessions: 2, avgHr: 145, maxHr: 165 });
  });

  it("ne dit rien sans aucune donnée cardiaque", () => {
    expect(heart([session({ actual: { minutes: 60 } })])).toBeUndefined();
  });
});
