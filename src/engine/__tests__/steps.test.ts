import { describe, expect, it } from "vitest";
import { buildSteps, setCount } from "../steps";

describe("déroulé d'une séance", () => {
  it("commence un bloc de renfo par son échauffement", () => {
    const steps = buildSteps([{ id: "strFull", dur: 80 }], "base", 1, {});
    expect(steps[0].kind).toBe("warm");
    expect(steps[0].title).toBe("Échauffement");
    expect(steps.filter((s) => s.kind === "exo").length).toBeGreaterThan(3);
  });

  it("met les segments à l'échelle du créneau réel", () => {
    // La sortie longue vaut 85 min de segments, ramenés ici à un créneau de 60.
    const steps = buildSteps([{ id: "longRun", dur: 60 }], "base", 1, {});
    const total = steps.reduce((a, s) => a + s.dur, 0);
    expect(steps).toHaveLength(3);
    expect(total).toBeLessThan(85);
    expect(total).toBeGreaterThan(45);
  });

  it("enchaîne les deux blocs d'un créneau empilé", () => {
    const steps = buildSteps(
      [
        { id: "bikeGym", dur: 45 },
        { id: "strUp", dur: 40 },
      ],
      "base",
      1,
      {},
    );
    expect(new Set(steps.map((s) => s.block))).toEqual(new Set(["bikeGym", "strUp"]));
  });

  it("propose du temps libre quand il reste au moins 5 minutes", () => {
    const steps = buildSteps([{ id: "strFull", dur: 120 }], "base", 1, {});
    expect(steps.some((s) => s.title === "Temps libre")).toBe(true);
  });
});

describe("cases de séries", () => {
  it("lit le nombre de séries de la prescription", () => {
    expect(setCount("4 × 8")).toBe(4);
    expect(setCount("3 × 45 s + 3 × 30 s par côté")).toBe(3);
  });

  it("plafonne à 6 et retombe sur 3 quand il n'y a rien à lire", () => {
    expect(setCount("9 × 3")).toBe(6);
    expect(setCount(undefined)).toBe(3);
    expect(setCount("maximum moins 2")).toBe(3);
  });
});

describe("allures de natation", () => {
  const text = (steps: ReturnType<typeof buildSteps>) => steps.map((s) => s.text ?? "").join(" ");

  it("chiffre les allures quand le test CSS est fait", () => {
    // 400 m en 13'00 et 200 m en 6'15 donnent une CSS de 3'23 au 100 m.
    const css = 203;
    const steps = buildSteps([{ id: "swimEnd", dur: 60 }], "dev", 1, {}, css);
    expect(text(steps)).toContain("3'23/100m");
    expect(text(steps)).not.toContain("{seuil}");
  });

  it("reste lisible sans test, sans inventer de chiffre", () => {
    const steps = buildSteps([{ id: "swimEnd", dur: 60 }], "dev", 1, {});
    expect(text(steps)).toContain("allure de seuil");
    expect(text(steps)).not.toContain("{");
  });

  it("nage l'endurance plus lentement que le seuil", () => {
    const css = 200;
    const tech = text(buildSteps([{ id: "swimTech", dur: 50 }], "base", 1, {}, css));
    const end = text(buildSteps([{ id: "swimEnd", dur: 60 }], "dev", 1, {}, css));
    expect(tech).toContain("3'28/100m"); // seuil + 8 s
    expect(end).toContain("3'20/100m"); // seuil
  });

  it("ne touche pas aux séances des autres disciplines", () => {
    const steps = buildSteps([{ id: "longRun", dur: 60 }], "base", 1, {}, 200);
    expect(text(steps)).toContain("conversation");
  });
});
