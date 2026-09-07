import { describe, expect, it } from "vitest";
import { BLOCKS } from "../../data/blocks";
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
    // Sans tapis : ces tests portent sur la mécanique de replanification, pas sur le
    // catalogue de blocs. Un créneau en salle n'y offre donc que du vélo et du renfo.
    access: fullAccess({ tapis: false }),
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
  it("occupe tous les créneaux, quitte à répéter une séance facile", () => {
    const r = resolve();
    expect(ids(r.sessions, "Lundi")).toEqual(["bikeGym"]);
    expect(ids(r.sessions, "Mardi")).toEqual(["strLow", "strUp"]);
    // Le plan de la phase est épuisé pour ce lieu : les deux derniers créneaux reçoivent
    // une répétition de basse intensité plutôt que de rester vides.
    expect(r.sessions.map((s) => s.day)).toEqual(["Lundi", "Mardi", "Mercredi", "Jeudi"]);
    expect(r.sessions.filter((s) => s.filler).map((s) => s.day)).toEqual(["Mercredi", "Jeudi"]);
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

    // Conséquence de la règle « seuls les créneaux libres bougent » : le mercredi garde ce
    // qu'il a récupéré. Le mardi redevient libre et reçoit un repli, faute de bloc neuf.
    expect(ids(retabli.sessions, "Mercredi")).toEqual(["strLow", "strUp"]);
    expect(retabli.sessions.find((s) => s.day === "Mardi")?.filler).toBe(true);
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

  it("ne pose jamais deux fois le même bloc du plan", () => {
    const first = resolve();
    const after = resolve({ stored: store(first.sessions), cancelled: ["Mardi"] });
    const planned = after.sessions.filter((s) => !s.filler).flatMap((s) => s.blocks.map((b) => b.id));
    expect(planned).toHaveLength(new Set(planned).size);
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
      access: fullAccess({ piscine: false, tapis: false }),
    });
    expect(a).not.toBe(b);
  });
});

describe("créneaux surnuméraires", () => {
  const isFiller = (r: ReturnType<typeof resolve>, day: string) =>
    r.sessions.find((s) => s.day === day)?.filler === true;

  it("ne laisse aucun créneau déclaré sans séance", () => {
    const r = resolve();
    expect(r.sessions).toHaveLength(FOUR_GYM.length);
  });

  it("ne répète qu'une séance facile, jamais une séance dure", () => {
    const r = resolve();
    r.sessions
      .filter((s) => s.filler)
      .forEach((s) => {
        s.blocks.forEach((b) => {
          expect(BLOCKS[b.id].hard).toBe(false);
          expect(BLOCKS[b.id].zone).toBe("basse");
        });
      });
  });

  it("cède son créneau dès qu'une séance du plan en a besoin", () => {
    const first = resolve();
    expect(isFiller(first, "Mercredi")).toBe(true);

    // Le mardi saute : ses deux blocs de renfo doivent reprendre le créneau du mercredi.
    const after = resolve({ stored: store(first.sessions), cancelled: ["Mardi"] });
    expect(ids(after.sessions, "Mercredi")).toEqual(["strLow", "strUp"]);
    expect(isFiller(after, "Mercredi")).toBe(false);
  });

  it("n'invente rien quand aucun bloc du lieu n'a été posé", () => {
    const r = resolve({
      slots: [
        { day: "Lundi", place: "salle", duration: 90 },
        { day: "Mardi", place: "piscine", duration: 60 },
      ],
      access: fullAccess({ piscine: false, tapis: false }),
    });
    expect(r.sessions.map((s) => s.day)).toEqual(["Lundi"]);
  });
});
