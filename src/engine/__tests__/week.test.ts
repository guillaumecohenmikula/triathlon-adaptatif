import { describe, expect, it } from "vitest";
import { BLOCKS } from "../../data/blocks";
import type { BlockId } from "../../data/blocks";
import type { ExtraSession, JournalEntry, PlannedSession, SessionState } from "../../data/types";
import {
  addSession,
  doneByDiscipline,
  intensityMix,
  lagging,
  legacySessions,
  moveSession,
  recommended,
  removeSession,
  resizeSession,
  sessionsOf,
} from "../week";
import { fullAccess, phase } from "./helpers";

const W = "2026-09-14";

const entry = (
  week: string,
  day: string,
  id: BlockId,
  dur: number,
  state: SessionState = "fait",
): JournalEntry => ({ week, day, place: BLOCKS[id].place, blocks: [{ id, dur }], state });

const session = (id: string, day: string, block: BlockId, dur = 60): PlannedSession => ({
  id,
  day,
  blocks: [{ id: block, dur }],
});

const extra = (over: Partial<ExtraSession>): ExtraSession => ({
  id: "x",
  week: W,
  day: "Lundi",
  activity: "course",
  dur: 30,
  ...over,
});

describe("séances d'une semaine", () => {
  it("reprend de l'ancien moteur les seules séances qui ont un bilan", () => {
    const journal = {
      [`${W}|Mardi`]: entry(W, "Mardi", "longRun", 60),
      "2026-09-07|Mardi": entry("2026-09-07", "Mardi", "bikeGym", 45),
    };
    expect(sessionsOf(undefined, journal, W)).toEqual([session("Mardi", "Mardi", "longRun")]);
  });

  it("ne prend pas un bilan au nouveau format pour une séance de l'ancien moteur", () => {
    expect(legacySessions({ [`${W}|a1`]: entry(W, "Mardi", "longRun", 60) }, W)).toEqual([]);
  });

  it("s'en tient aux séances choisies dès qu'elles existent, même vides", () => {
    const journal = { [`${W}|Mardi`]: entry(W, "Mardi", "longRun", 60) };
    expect(sessionsOf({ week: W, picked: [] }, journal, W)).toEqual([]);
  });
});

describe("modifier la semaine à la main", () => {
  it("accepte plusieurs séances le même jour, dans l'ordre d'ajout", () => {
    let list = addSession([], "Jeudi", "longRun", 60, "a");
    list = addSession(list, "Mardi", "strFull", 50, "b");
    list = addSession(list, "Jeudi", "strUp", 30, "c");
    expect(list.map((s) => s.id)).toEqual(["b", "a", "c"]);
  });

  it("déplace une séance et la range à son nouveau jour", () => {
    const list = [session("a", "Mardi", "longRun"), session("b", "Jeudi", "bikeGym")];
    expect(moveSession(list, "b", "Lundi").map((s) => `${s.id}:${s.day}`)).toEqual([
      "b:Lundi",
      "a:Mardi",
    ]);
  });

  it("change la durée d'une séance d'un seul bloc", () => {
    const list = resizeSession([session("a", "Mardi", "longRun", 60)], "a", 45);
    expect(list[0].blocks[0].dur).toBe(45);
  });

  it("ne répartit pas arbitrairement une durée entre deux blocs", () => {
    const double: PlannedSession = {
      id: "a",
      day: "Mardi",
      blocks: [
        { id: "strUp", dur: 30 },
        { id: "bikeGym", dur: 40 },
      ],
    };
    expect(resizeSession([double], "a", 90)).toEqual([double]);
  });

  it("retire la seule séance visée", () => {
    const list = [session("a", "Mardi", "longRun"), session("b", "Mardi", "strUp")];
    expect(removeSession(list, "a").map((s) => s.id)).toEqual(["b"]);
  });
});

describe("séances conseillées", () => {
  it("suit l'ordre du plan de la phase", () => {
    expect(recommended(phase("base"), "perf", fullAccess())).toEqual(phase("base").plan);
  });

  it("écarte ce qui n'est pas réalisable avec le matériel coché", () => {
    const ids = recommended(phase("base"), "perf", fullAccess({ tapis: false, homeTrainer: false }));
    expect(ids).not.toContain("runGym");
    expect(ids).not.toContain("bikeHT");
  });

  it("remplace le split haut/bas par le full body hors mode performance", () => {
    const ids = recommended(phase("base"), "mixte", fullAccess());
    expect(ids).toContain("strFull");
    expect(ids).not.toContain("strUp");
  });
});

describe("volume réellement fait", () => {
  const journal = {
    "2026-08-24|a": entry("2026-08-24", "Lundi", "swimTech", 50),
    "2026-08-31|b": entry("2026-08-31", "Mardi", "longRun", 60),
    "2026-09-07|c": entry("2026-09-07", "Mardi", "bikeGym", 40, "partiel"),
    [`${W}|d`]: entry(W, "Mardi", "strFull", 60),
  };
  const extras = [
    extra({ id: "e1", week: "2026-09-07", activity: "course", dur: 30 }),
    extra({ id: "e2", week: "2026-09-07", activity: "autre", label: "Rando", dur: 90 }),
    extra({ id: "e3", week: W, activity: "natation", dur: 45 }),
  ];

  it("additionne programme et extra sur les deux dernières semaines terminées", () => {
    expect(doneByDiscipline(journal, extras, W)).toEqual({
      weeks: 2,
      // 60 de sortie longue + 30 de course extra ; 40 de vélo comptés à moitié.
      minutes: { course: 90, velo: 20 },
    });
  });

  it("laisse de côté la semaine en cours et les activités hors triathlon", () => {
    const { minutes } = doneByDiscipline(journal, extras, W);
    expect(minutes.renfo).toBeUndefined();
    expect(minutes.natation).toBeUndefined();
  });
});

describe("disciplines en retard", () => {
  const targets = { course: 140, velo: 80, natation: 45, renfo: 60 };

  it("compare des parts et non des minutes : un petit volume bien réparti n'est pas en retard", () => {
    const done = { weeks: 2, minutes: { course: 14, velo: 8, natation: 4.5, renfo: 6 } };
    expect(lagging(done, targets)).toEqual([]);
  });

  it("signale les disciplines négligées, la plus en retard d'abord", () => {
    const done = { weeks: 2, minutes: { course: 200, velo: 0, natation: 20, renfo: 60 } };
    expect(lagging(done, targets)).toEqual(["velo", "natation"]);
  });

  it("ne dit rien tant que rien n'a été fait", () => {
    expect(lagging({ weeks: 0, minutes: {} }, targets)).toEqual([]);
  });
});

describe("répartition d'intensité", () => {
  it("ignore le renfo, qui n'a pas de zone aérobie", () => {
    const mix = intensityMix([session("a", "Lundi", "strFull", 80), session("b", "Mardi", "longRun", 90)]);
    expect(mix.total).toBe(90);
    expect(mix.part.basse).toBe(100);
  });

  it("renvoie zéro partout quand la semaine est vide", () => {
    const mix = intensityMix([]);
    expect(mix.total).toBe(0);
    expect(mix.part.haute).toBe(0);
  });
});
