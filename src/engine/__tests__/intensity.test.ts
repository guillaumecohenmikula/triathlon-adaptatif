import { describe, expect, it } from "vitest";
import { BLOCKS } from "../../data/blocks";
import type { PhaseId, Slot } from "../../data/types";
import { buildWeek, intensityCaps, intensityMix } from "../buildWeek";
import { fullAccess, noDeficit, phase } from "./helpers";

const week = (slots: Slot[], easy = false, ph: PhaseId = "dev") =>
  buildWeek(slots, phase(ph), easy, noDeficit, fullAccess(), "perf");

const ids = (r: ReturnType<typeof buildWeek>) => r.placed.flatMap((s) => s.blocks.map((b) => b.id));
const zonesOf = (r: ReturnType<typeof buildWeek>) =>
  ids(r).map((id) => BLOCKS[id].zone).filter(Boolean);

const gym = (day: string, duration = 90): Slot => ({ day, place: "salle", duration });
const out = (day: string, duration = 90): Slot => ({ day, place: "exterieur", duration });
const home = (day: string, duration = 90): Slot => ({ day, place: "maison", duration });
const pool = (day: string, duration = 75): Slot => ({ day, place: "piscine", duration });

describe("plafonds d'intensité", () => {
  it("monte avec le nombre de créneaux", () => {
    expect(intensityCaps(3, false).intensity).toBe(1);
    expect(intensityCaps(4, false).intensity).toBe(2);
    expect(intensityCaps(5, false).intensity).toBe(2);
    expect(intensityCaps(6, false).intensity).toBe(3);
  });

  it("retombe à une seule séance en semaine allégée", () => {
    expect(intensityCaps(6, true).intensity).toBe(1);
  });

  it("n'autorise jamais plus d'une séance au seuil", () => {
    [3, 4, 6, 10].forEach((n) => expect(intensityCaps(n, false).threshold).toBe(1));
  });
});

describe("répartition d'intensité dans la semaine", () => {
  it("ne place qu'une séance intense sur trois créneaux", () => {
    const r = week([out("Lundi"), gym("Mercredi"), home("Vendredi")]);
    expect(zonesOf(r).filter((z) => z !== "basse")).toHaveLength(1);
  });

  it("en autorise davantage quand le volume le permet", () => {
    const r = week([
      out("Lundi"),
      gym("Mardi"),
      home("Mercredi"),
      out("Jeudi"),
      gym("Vendredi"),
      pool("Samedi"),
    ]);
    const intenses = zonesOf(r).filter((z) => z !== "basse");
    expect(intenses.length).toBeGreaterThan(1);
    expect(intenses.length).toBeLessThanOrEqual(3);
  });

  it("ne double jamais le travail au seuil, même sur six créneaux", () => {
    const r = week(
      [out("Lundi"), out("Mardi"), pool("Mercredi"), gym("Jeudi"), home("Vendredi"), pool("Samedi")],
      false,
      "spe",
    );
    expect(zonesOf(r).filter((z) => z === "seuil").length).toBeLessThanOrEqual(1);
  });

  it("garde la sortie longue, qui porte le volume de basse intensité", () => {
    const r = week([out("Lundi"), gym("Mercredi"), out("Samedi")]);
    expect(ids(r)).toContain("longRun");
  });

  it("laisse la basse intensité majoritaire en minutes", () => {
    const r = week([out("Lundi"), gym("Mercredi"), home("Vendredi"), out("Samedi")]);
    const mix = intensityMix(r.placed);
    expect(mix.part.basse).toBeGreaterThanOrEqual(50);
  });
});

describe("mesure de la répartition", () => {
  it("ignore le renfo, qui n'a pas de zone aérobie", () => {
    const mix = intensityMix([
      { day: "Lundi", place: "salle", duration: 90, blocks: [{ id: "strFull", dur: 80 }] },
      { day: "Mardi", place: "exterieur", duration: 90, blocks: [{ id: "longRun", dur: 90 }] },
    ]);
    expect(mix.total).toBe(90);
    expect(mix.part.basse).toBe(100);
  });

  it("renvoie zéro partout quand la semaine est vide", () => {
    const mix = intensityMix([]);
    expect(mix.total).toBe(0);
    expect(mix.part.haute).toBe(0);
  });
});

describe("tapis de course", () => {
  const gymWeek = (access: ReturnType<typeof fullAccess>) =>
    buildWeek(
      [gym("Lundi"), gym("Mardi"), gym("Mercredi")],
      phase("base"),
      false,
      noDeficit,
      access,
      "perf",
    );

  it("ne propose aucune course en salle sans tapis", () => {
    const r = gymWeek(fullAccess({ tapis: false }));
    expect(ids(r).some((id) => id.startsWith("runGym"))).toBe(false);
  });

  it("ouvre la course en salle dès que le tapis est coché", () => {
    const r = gymWeek(fullAccess());
    expect(ids(r)).toContain("runGym");
  });

  it("compte la course sur tapis en basse intensité", () => {
    const r = gymWeek(fullAccess());
    expect(BLOCKS.runGym.zone).toBe("basse");
    expect(BLOCKS.runGymInt.zone).toBe("haute");
    expect(intensityMix(r.placed).part.basse).toBeGreaterThan(50);
  });

  it("n'ajoute pas une deuxième séance dure de course en phase développement", () => {
    const r = buildWeek(
      [out("Lundi"), gym("Mardi"), gym("Mercredi")],
      phase("dev"),
      false,
      noDeficit,
      fullAccess(),
      "perf",
    );
    const hard = ids(r).filter((id) => BLOCKS[id].zone === "haute");
    expect(hard.length).toBeLessThanOrEqual(1);
  });
});

describe("répétitions sur créneaux surnuméraires", () => {
  const fiveGym = [gym("Lundi"), gym("Mardi"), gym("Mercredi"), gym("Jeudi"), gym("Vendredi")];

  it("alterne les séances répétées au lieu de servir toujours la même", () => {
    const r = week(fiveGym, false, "base");
    const fillers = r.placed.filter((s) => s.filler).flatMap((s) => s.blocks.map((b) => b.id));
    expect(fillers.length).toBeGreaterThan(1);
    // Deux créneaux de repli, deux séances faciles différentes.
    expect(new Set(fillers).size).toBe(fillers.length);
  });

  it("ne laisse aucun des cinq créneaux vide", () => {
    expect(week(fiveGym, false, "base").placed).toHaveLength(5);
  });
});

describe("réserve : travailler d'autres parties plutôt que répéter", () => {
  const many = [gym("Lundi"), gym("Mardi"), gym("Mercredi"), gym("Jeudi"), gym("Vendredi")];

  it("puise dans les blocs que le mode avait écartés avant de répéter", () => {
    // En mode équilibré, le split haut/bas sort du plan au profit du full body.
    // Sur des créneaux surnuméraires, il redevient une option utile.
    const r = buildWeek(many, phase("base"), false, noDeficit, fullAccess(), "mixte");
    expect(ids(r)).toContain("strUp");
  });

  it("ne fait entrer aucune séance dure par cette porte", () => {
    const r = buildWeek(many, phase("base"), false, noDeficit, fullAccess(), "mixte");
    r.placed
      .filter((s) => s.filler)
      .forEach((s) => s.blocks.forEach((b) => expect(BLOCKS[b.id].hard).toBe(false)));
  });

  it("respecte les groupes : jamais deux blocs différents d'un même groupe", () => {
    const r = buildWeek(many, phase("base"), false, noDeficit, fullAccess(), "mixte");
    // Une répétition repose le même bloc, donc le même groupe : c'est attendu.
    // Ce qui est interdit, c'est deux blocs *différents* du même groupe.
    const groups = [...new Set(ids(r))]
      .map((id) => BLOCKS[id].group)
      .filter((g): g is NonNullable<typeof g> => Boolean(g));
    expect(groups).toHaveLength(new Set(groups).size);
  });

  it("garde la basse intensité largement majoritaire malgré le volume", () => {
    const r = buildWeek(many, phase("base"), false, noDeficit, fullAccess(), "mixte");
    expect(intensityMix(r.placed).part.basse).toBeGreaterThanOrEqual(75);
  });
});
