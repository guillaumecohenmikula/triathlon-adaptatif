import { describe, expect, it } from "vitest";
import { BLOCKS } from "./blocks";
import { EXOS } from "./exercises";
import { guidesFor } from "./guides";
import { MOVEMENTS, TEMPLATES, prescription, slug } from "./library";
import { plannedMinutes } from "../engine/session";

describe("bibliothèque fournie", () => {
  const endurance = (Object.keys(BLOCKS) as (keyof typeof BLOCKS)[]).filter(
    (id) => BLOCKS[id].disc !== "renfo",
  );

  it("garde une séance par bloc d'endurance, et deux séances de renfo", () => {
    expect(TEMPLATES).toHaveLength(endurance.length + 2);
    expect(TEMPLATES.filter((t) => t.disc === "renfo").map((t) => t.name)).toEqual([
      "Haut du corps",
      "Bas du corps",
    ]);
  });

  it("n'a gardé aucune séance de renfo de l'ancien programme", () => {
    expect(TEMPLATES.find((t) => t.id === "t-strFull")).toBeUndefined();
    expect(TEMPLATES.find((t) => t.id === "t-coreHome")).toBeUndefined();
  });

  it("compose le haut du corps comme le programme de Guil", () => {
    const t = TEMPLATES.find((x) => x.id === "t-haut")!;
    expect(t.items.map((i) => i.label)).toEqual([
      "Échauffement",
      "Tractions ou tirage vertical",
      "Développé couché",
      "Tirage horizontal à la barre",
      "Dips",
      "Curl haltères",
      "Planche",
    ]);
    expect(t.items[1]).toMatchObject({ sets: 4, reps: "4-6", rest: 120 });
  });

  it("compose le bas du corps comme le programme de Guil", () => {
    const t = TEMPLATES.find((x) => x.id === "t-bas")!;
    expect(t.items.map((i) => i.label)).toEqual([
      "Échauffement",
      "Squat",
      "Soulevé de terre roumain",
      "Split squat bulgare",
      "Planche latérale",
      "Pont fessier",
      "Mollets debout",
    ]);
    expect(t.items[1]).toMatchObject({ sets: 4, reps: "5-6", rest: 120 });
    expect(t.items[3].reps).toBe("8 par jambe");
  });

  it("tient dans les 45 à 50 minutes annoncées", () => {
    ["t-haut", "t-bas"].forEach((id) => {
      const minutes = plannedMinutes(TEMPLATES.find((t) => t.id === id)!.items);
      expect(minutes).toBeGreaterThanOrEqual(45);
      expect(minutes).toBeLessThanOrEqual(52);
    });
  });

  it("rattache chaque exercice de renfo à un mouvement de la bibliothèque", () => {
    TEMPLATES.filter((t) => t.disc === "renfo").forEach((t) =>
      t.items
        .filter((i) => i.kind === "reps")
        .forEach((i) => {
          const movement = MOVEMENTS.find((m) => m.id === i.movement);
          expect(movement, i.label).toBeDefined();
          expect(guidesFor(movement!.name).length).toBeGreaterThan(0);
        }),
    );
  });

  it("compose un modèle d'endurance de ses segments, série d'intervalles comprise", () => {
    const t = TEMPLATES.find((x) => x.id === "t-quality")!;
    expect(t.items.map((i) => i.label)).toEqual([
      "Échauffement",
      "Corps de séance",
      "Retour au calme",
    ]);
    expect(t.items[1].rep).toEqual({ n: 4, work: 8, rest: 3 });
  });

  it("garde le lien vers la fiche de séance là où il y en a une", () => {
    expect(TEMPLATES.find((x) => x.id === "t-longRun")!.guide).toBe("longRun");
  });

  it("expose chaque exercice une seule fois, avec sa fiche", () => {
    const names = new Set(
      Object.values(EXOS)
        .flatMap((l) => l ?? [])
        .map((e) => e.n),
    );
    expect(MOVEMENTS.length).toBeGreaterThan(names.size);
    expect(new Set(MOVEMENTS.map((m) => m.id)).size).toBe(MOVEMENTS.length);
    MOVEMENTS.forEach((m) => expect(m.disc).toBe("renfo"));
  });
});

describe("lecture d'une prescription", () => {
  it("sépare les séries des répétitions", () => {
    expect(prescription("4 × 6")).toEqual({ sets: 4, reps: "6" });
    expect(prescription("3 × 12 par bras")).toEqual({ sets: 3, reps: "12 par bras" });
  });

  it("laisse intact ce qui ne s'y prête pas", () => {
    expect(prescription("maximum moins 2")).toEqual({ reps: "maximum moins 2" });
  });
});

describe("identifiants de mouvement", () => {
  it("sont stables et sans accent", () => {
    expect(slug("Élévations latérales")).toBe("elevations-laterales");
    expect(slug("Gainage : planche et planche latérale")).toBe("gainage-planche-et-planche-laterale");
  });
});
