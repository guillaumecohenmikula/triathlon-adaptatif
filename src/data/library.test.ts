import { describe, expect, it } from "vitest";
import { BLOCKS } from "./blocks";
import { EXOS } from "./exercises";
import { guidesFor } from "./guides";
import { MOVEMENTS, TEMPLATES, prescription, slug } from "./library";

describe("bibliothèque fournie", () => {
  it("donne un modèle par séance de l'ancien programme", () => {
    expect(TEMPLATES).toHaveLength(Object.keys(BLOCKS).length);
    expect(TEMPLATES.every((t) => t.builtIn && t.items.length > 0)).toBe(true);
  });

  it("compose un modèle de renfo d'un échauffement puis des exercices", () => {
    const t = TEMPLATES.find((x) => x.id === "t-strFull")!;
    expect(t.items[0].label).toBe("Échauffement");
    expect(t.items[0].kind).toBe("time");
    expect(t.items[1]).toMatchObject({ label: "Squat", kind: "reps", sets: 4, reps: "6" });
    expect(t.items[1].rest).toBe(120);
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
    expect(TEMPLATES.find((x) => x.id === "t-strFull")!.guide).toBeUndefined();
  });

  it("expose chaque exercice une seule fois, avec sa fiche", () => {
    const names = new Set(
      Object.values(EXOS)
        .flatMap((l) => l ?? [])
        .map((e) => e.n),
    );
    expect(MOVEMENTS).toHaveLength(names.size);
    MOVEMENTS.forEach((m) => {
      expect(m.disc).toBe("renfo");
      expect(guidesFor(m.name).length).toBeGreaterThan(0);
    });
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
