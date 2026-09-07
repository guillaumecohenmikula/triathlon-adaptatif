import { describe, expect, it } from "vitest";
import { BLOCKS } from "../../data/blocks";
import type { Slot } from "../../data/types";
import { buildWeek } from "../buildWeek";
import { fullAccess, noDeficit, phase } from "./helpers";

const ids = (r: ReturnType<typeof buildWeek>) => r.placed.flatMap((s) => s.blocks.map((b) => b.id));

describe("règle 3, filtrage par accès", () => {
  const slots: Slot[] = [{ day: "Samedi", place: "exterieur", duration: 120 }];

  it("propose l'enchaînement vélo-course quand le vélo de route est disponible", () => {
    const r = buildWeek(slots, phase("spe"), false, noDeficit, fullAccess(), "perf");
    expect(ids(r)).toContain("brick");
  });

  it("retire du plan tout bloc dont un `needs` manque", () => {
    const r = buildWeek(slots, phase("spe"), false, noDeficit, fullAccess({ veloRoute: false }), "perf");
    // brick a besoin du vélo de route, bikeLong aussi : ni placés, ni signalés comme écartés.
    expect(ids(r)).not.toContain("brick");
    expect(r.dropped).not.toContain("brick");
    expect(r.dropped).not.toContain("bikeLong");
  });

  it("ne place aucune natation sans piscine, même avec un créneau piscine déclaré", () => {
    const r = buildWeek(
      [{ day: "Mardi", place: "piscine", duration: 60 }],
      phase("base"),
      false,
      noDeficit,
      fullAccess({ piscine: false }),
      "perf",
    );
    expect(r.placed).toHaveLength(0);
  });
});

describe("règle 6, non-duplication de groupe", () => {
  it("ne place jamais deux blocs du même groupe dans la semaine", () => {
    const slots: Slot[] = [
      { day: "Lundi", place: "salle", duration: 90 },
      { day: "Mardi", place: "maison", duration: 90 },
      { day: "Mercredi", place: "salle", duration: 90 },
      { day: "Jeudi", place: "maison", duration: 90 },
      { day: "Vendredi", place: "exterieur", duration: 90 },
      { day: "Samedi", place: "piscine", duration: 60 },
    ];
    const r = buildWeek(slots, phase("base"), false, noDeficit, fullAccess(), "perf");
    // Les séances de repli répètent un bloc déjà posé : elles sortent du décompte.
    const groups = r.placed
      .filter((s) => !s.filler)
      .flatMap((s) => s.blocks.map((b) => BLOCKS[b.id].group))
      .filter((g): g is NonNullable<typeof g> => Boolean(g));
    expect(groups).toHaveLength(new Set(groups).size);
  });

  it("écarte le home-trainer quand le vélo de salle du même groupe est déjà pris", () => {
    const slots: Slot[] = [
      { day: "Lundi", place: "salle", duration: 60 },
      { day: "Mardi", place: "maison", duration: 60 },
    ];
    const r = buildWeek(slots, phase("base"), false, noDeficit, fullAccess(), "perf");
    expect(ids(r)).toContain("bikeGym");
    expect(ids(r)).not.toContain("bikeHT");
  });
});

describe("règle 6, empilement dans un créneau", () => {
  it("empile un second bloc quand il reste au moins 25 minutes", () => {
    const r = buildWeek(
      [{ day: "Lundi", place: "salle", duration: 120 }],
      phase("base"),
      false,
      noDeficit,
      fullAccess(),
      "perf",
    );
    expect(r.placed[0].blocks).toHaveLength(2);
    expect(BLOCKS[r.placed[0].blocks[1].id].stack).toBe(true);
  });

  it("n'empile rien quand le reste est trop court", () => {
    const r = buildWeek(
      [{ day: "Lundi", place: "salle", duration: 90 }],
      phase("base"),
      false,
      noDeficit,
      fullAccess(),
      "perf",
    );
    expect(r.placed[0].blocks).toHaveLength(1);
  });

  it("ne met jamais deux séances dures dans le même créneau", () => {
    const slots: Slot[] = [
      { day: "Lundi", place: "salle", duration: 120 },
      { day: "Mardi", place: "maison", duration: 120 },
      { day: "Mercredi", place: "exterieur", duration: 120 },
    ];
    const r = buildWeek(slots, phase("dev"), false, noDeficit, fullAccess(), "perf");
    r.placed.forEach((s) => {
      expect(s.blocks.filter((b) => BLOCKS[b.id].hard).length).toBeLessThanOrEqual(1);
    });
  });
});

describe("règle 2, semaine allégée", () => {
  const slots: Slot[] = [{ day: "Samedi", place: "exterieur", duration: 100 }];

  it("raccourcit les durées de 25 %", () => {
    const normal = buildWeek(slots, phase("base"), false, noDeficit, fullAccess(), "perf");
    const easy = buildWeek(slots, phase("base"), true, noDeficit, fullAccess(), "perf");
    expect(easy.placed[0].blocks[0].dur).toBeLessThan(normal.placed[0].blocks[0].dur);
    expect(easy.placed[0].blocks[0].dur).toBe(75); // 100 × 0,75
  });

  it("ne garde qu'une seule séance dure dans la semaine", () => {
    const many: Slot[] = [
      { day: "Lundi", place: "exterieur", duration: 90 },
      { day: "Mardi", place: "salle", duration: 90 },
      { day: "Mercredi", place: "maison", duration: 90 },
      { day: "Jeudi", place: "exterieur", duration: 90 },
      { day: "Vendredi", place: "salle", duration: 90 },
    ];
    const easy = buildWeek(many, phase("dev"), true, noDeficit, fullAccess(), "perf");
    const hard = ids(easy).filter((id) => BLOCKS[id].hard);
    expect(hard).toHaveLength(1);
  });

  it("respecte toujours la durée minimale du bloc", () => {
    const r = buildWeek(
      [{ day: "Samedi", place: "exterieur", duration: 60 }],
      phase("base"),
      true,
      noDeficit,
      fullAccess(),
      "perf",
    );
    const b = r.placed[0].blocks[0];
    expect(b.dur).toBeGreaterThanOrEqual(BLOCKS[b.id].min);
  });
});

describe("règle 5, compensation d'un retard", () => {
  const slots: Slot[] = [{ day: "Dimanche", place: "exterieur", duration: 120 }];

  it("place l'enchaînement vélo-course quand rien n'est en retard", () => {
    const r = buildWeek(slots, phase("spe"), false, noDeficit, fullAccess(), "perf");
    expect(r.placed[0].blocks[0].id).toBe("brick");
  });

  it("fait passer le vélo devant quand le vélo accuse un gros retard", () => {
    const r = buildWeek(
      slots,
      phase("spe"),
      false,
      { weeks: 2, byDisc: { velo: 0.5 } },
      fullAccess(),
      "perf",
    );
    expect(r.placed[0].blocks[0].id).toBe("bikeLong");
  });

  it("ne bouge pas l'ordre pour un retard sous le seuil de 20 %", () => {
    const r = buildWeek(
      slots,
      phase("spe"),
      false,
      { weeks: 2, byDisc: { velo: 0.15 } },
      fullAccess(),
      "perf",
    );
    expect(r.placed[0].blocks[0].id).toBe("brick");
  });
});

describe("règle 4, effet du mode", () => {
  it("remonte le full body en mode physique", () => {
    const slots: Slot[] = [{ day: "Lundi", place: "salle", duration: 90 }];
    const perf = buildWeek(slots, phase("base"), false, noDeficit, fullAccess(), "perf");
    const phys = buildWeek(slots, phase("base"), false, noDeficit, fullAccess(), "physique");
    expect(ids(perf)).not.toContain("strFull");
    expect(ids(phys)).toContain("strFull");
  });

  it("retire le split haut/bas hors du mode performance", () => {
    const slots: Slot[] = [
      { day: "Lundi", place: "salle", duration: 60 },
      { day: "Mardi", place: "salle", duration: 60 },
    ];
    const phys = buildWeek(slots, phase("base"), false, noDeficit, fullAccess(), "physique");
    expect(ids(phys)).not.toContain("strLow");
    expect(ids(phys)).not.toContain("strUp");
  });
});
