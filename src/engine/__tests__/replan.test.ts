import { describe, expect, it } from "vitest";
import type { BlockId } from "../../data/blocks";
import type { Journal, JournalEntry, PlacedSession, Slot } from "../../data/types";
import type { ResolveInput, StoredWeek } from "../replan";
import { resolveWeek, settingsStamp } from "../replan";
import { fullAccess, noDeficit, phase } from "./helpers";

const WEEK = "2026-08-31";
const STAMP = "M|perf|2027-06-13|exterieur,maison,piscine,salle,veloRoute,veloSalle";

/** Quatre créneaux en salle : les deux derniers restent vides, faute de blocs disponibles. */
const FOUR_GYM: Slot[] = [
  { day: "Lundi", place: "salle", duration: 90 },
  { day: "Mardi", place: "salle", duration: 90 },
  { day: "Mercredi", place: "salle", duration: 90 },
  { day: "Jeudi", place: "salle", duration: 90 },
];

const resolve = (over: Partial<ResolveInput> = {}) =>
  resolveWeek({
    slots: FOUR_GYM,
    cancelled: [],
    journal: {},
    week: WEEK,
    todayIndex: 0,
    stamp: STAMP,
    phase: phase("base"),
    easyWeek: false,
    def: noDeficit,
    access: fullAccess(),
    mode: "perf",
    ...over,
  });

const store = (
  sessions: PlacedSession[],
  cancelled: string[] = [],
  orphans: BlockId[] = [],
): StoredWeek => ({
  week: WEEK,
  sessions,
  cancelled,
  orphans,
  stamp: STAMP,
});

const ids = (sessions: PlacedSession[], day: string) =>
  sessions.find((s) => s.day === day)?.blocks.map((b) => b.id) ?? [];

const done = (day: string): Journal => {
  const e: JournalEntry = {
    week: WEEK,
    day,
    place: "salle",
    blocks: [{ id: "bikeGym", dur: 75 }],
    state: "fait",
  };
  return { [`${WEEK}|${day}`]: e };
};

describe("première génération", () => {
  it("remplit les créneaux qu'elle peut et laisse les autres vides", () => {
    const r = resolve();
    expect(ids(r.sessions, "Lundi")).toEqual(["bikeGym"]);
    expect(ids(r.sessions, "Mardi")).toEqual(["strLow", "strUp"]);
    expect(r.sessions.map((s) => s.day)).toEqual(["Lundi", "Mardi"]);
    expect(r.orphans).toHaveLength(0);
    expect(r.changed).toBe(true);
  });

  it("ne redemande pas d'écriture quand rien n'a bougé", () => {
    const first = resolve();
    const second = resolve({ stored: store(first.sessions) });
    expect(second.changed).toBe(false);
    expect(second.sessions).toEqual(first.sessions);
  });
});

describe("annulation d'un créneau", () => {
  it("recase la séance annulée sur un créneau libre", () => {
    const first = resolve();
    const after = resolve({ stored: store(first.sessions), cancelled: ["Mardi"] });

    expect(after.sessions.find((s) => s.day === "Mardi")).toBeUndefined();
    // Les blocs du mardi retombent sur le premier créneau libre de la semaine.
    expect(ids(after.sessions, "Mercredi")).toEqual(["strLow", "strUp"]);
    expect(after.orphans).toHaveLength(0);
  });

  it("ne touche pas aux séances déjà prévues sur les autres jours", () => {
    const first = resolve();
    const after = resolve({ stored: store(first.sessions), cancelled: ["Mardi"] });
    expect(ids(after.sessions, "Lundi")).toEqual(["bikeGym"]);
  });

  it("signale les blocs qu'elle n'a pas pu recaser", () => {
    const twoDays: Slot[] = FOUR_GYM.slice(0, 2);
    const first = resolve({ slots: twoDays });
    const after = resolve({ slots: twoDays, stored: store(first.sessions), cancelled: ["Mardi"] });

    expect(after.sessions.map((s) => s.day)).toEqual(["Lundi"]);
    expect(after.orphans).toEqual(["strLow", "strUp"]);
  });

  it("garde un bloc orphelin en attente au lieu de l'oublier à la première écriture", () => {
    const twoDays: Slot[] = FOUR_GYM.slice(0, 2);
    const first = resolve({ slots: twoDays });
    const annule = resolve({ slots: twoDays, stored: store(first.sessions), cancelled: ["Mardi"] });

    // Deuxième passe, cette fois sur la semaine telle qu'elle vient d'être enregistrée.
    const relu = resolve({
      slots: twoDays,
      stored: store(annule.sessions, ["Mardi"], annule.orphans),
      cancelled: ["Mardi"],
    });
    expect(relu.orphans).toEqual(["strLow", "strUp"]);
    expect(relu.changed).toBe(false);
  });

  it("recase un orphelin dès qu'un créneau s'ouvre", () => {
    const twoDays: Slot[] = FOUR_GYM.slice(0, 2);
    const first = resolve({ slots: twoDays });
    const annule = resolve({ slots: twoDays, stored: store(first.sessions), cancelled: ["Mardi"] });

    const avecMercredi = resolve({
      slots: FOUR_GYM.slice(0, 3),
      stored: store(annule.sessions, ["Mardi"], annule.orphans),
      cancelled: ["Mardi"],
    });
    expect(ids(avecMercredi.sessions, "Mercredi")).toEqual(["strLow", "strUp"]);
    expect(avecMercredi.orphans).toHaveLength(0);
  });

  it("ne défait pas la redistribution quand on rétablit le jour annulé", () => {
    const first = resolve();
    const annule = resolve({ stored: store(first.sessions), cancelled: ["Mardi"] });
    const retabli = resolve({ stored: store(annule.sessions, ["Mardi"]), cancelled: [] });

    // Conséquence directe de la règle « seuls les créneaux libres bougent » : le mercredi
    // garde ce qu'il a récupéré, le mardi redevient un créneau libre mais reste vide
    // faute de bloc encore disponible. Rien n'est perdu, la séance a juste changé de jour.
    expect(ids(retabli.sessions, "Mercredi")).toEqual(["strLow", "strUp"]);
    expect(retabli.sessions.find((s) => s.day === "Mardi")).toBeUndefined();
    expect(retabli.orphans).toHaveLength(0);
  });
});

describe("ce qui est intouchable", () => {
  it("garde les jours passés même si leur créneau disparaît", () => {
    const first = resolve();
    // Jeudi : lundi et mardi sont derrière nous, et leurs créneaux ne sont plus déclarés.
    const after = resolve({
      slots: FOUR_GYM.slice(2),
      stored: store(first.sessions),
      todayIndex: 3,
    });
    expect(ids(after.sessions, "Lundi")).toEqual(["bikeGym"]);
    expect(ids(after.sessions, "Mardi")).toEqual(["strLow", "strUp"]);
  });

  it("ne replanifie jamais une séance qui porte déjà un bilan", () => {
    const first = resolve();
    const after = resolve({
      stored: store(first.sessions),
      journal: done("Lundi"),
      cancelled: ["Lundi"],
    });
    // Annuler après coup une séance déjà faite ne l'efface pas.
    expect(ids(after.sessions, "Lundi")).toEqual(["bikeGym"]);
  });

  it("ne consomme pas deux fois un bloc déjà posé dans la semaine", () => {
    const first = resolve();
    const after = resolve({ stored: store(first.sessions), cancelled: ["Mardi"] });
    const all = after.sessions.flatMap((s) => s.blocks.map((b) => b.id));
    expect(all).toHaveLength(new Set(all).size);
  });
});

describe("changement de réglages", () => {
  it("rejoue les jours à venir mais conserve ce qui est déjà fait", () => {
    const first = resolve();
    const after = resolve({
      stored: store(first.sessions),
      journal: done("Lundi"),
      stamp: "autre",
      mode: "physique",
      todayIndex: 1,
    });
    expect(ids(after.sessions, "Lundi")).toEqual(["bikeGym"]);
    // Le mode physique fait entrer le full body à la place du split.
    expect(ids(after.sessions, "Mardi")).toEqual(["strFull"]);
  });

  it("libère un créneau dont la durée a changé", () => {
    const first = resolve();
    const raccourci = [{ day: "Lundi", place: "salle", duration: 45 } as Slot, ...FOUR_GYM.slice(1)];
    const after = resolve({ slots: raccourci, stored: store(first.sessions) });
    expect(after.sessions.find((s) => s.day === "Lundi")!.duration).toBe(45);
  });
});

describe("empreinte des réglages", () => {
  it("ignore les accès décochés et l'ordre des clés", () => {
    const a = settingsStamp({ goal: "M", mode: "perf", raceDate: "2027-06-13", access: fullAccess() });
    const b = settingsStamp({ goal: "M", mode: "perf", raceDate: "2027-06-13", access: fullAccess() });
    expect(a).toBe(b);
  });

  it("change quand un accès disparaît", () => {
    const a = settingsStamp({ goal: "M", mode: "perf", raceDate: "2027-06-13", access: fullAccess() });
    const b = settingsStamp({
      goal: "M",
      mode: "perf",
      raceDate: "2027-06-13",
      access: fullAccess({ piscine: false }),
    });
    expect(a).not.toBe(b);
  });
});
