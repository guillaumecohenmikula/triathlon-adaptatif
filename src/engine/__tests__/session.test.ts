import { describe, expect, it } from "vitest";
import type { Item, Template } from "../../data/types";
import {
  addItem,
  emptyItem,
  estimated1RM,
  fromTemplate,
  itemMinutes,
  moveItem,
  plannedMinutes,
  removeItem,
  updateItem,
} from "../session";

const exo: Item = { id: "a", label: "Squat", kind: "reps", sets: 4, reps: "6", rest: 120 };
const block: Item = { id: "b", label: "Corps de séance", kind: "time", minutes: 41, rep: { n: 4, work: 8, rest: 3 } };
const swim: Item = { id: "c", label: "5 × 200 m", kind: "distance", distance: 1000 };

describe("durée d'une séance", () => {
  it("compte la durée annoncée d'un bloc, récupérations comprises", () => {
    expect(itemMinutes(block)).toBe(41);
  });

  it("estime la durée d'un exercice à partir des séries et du repos", () => {
    expect(itemMinutes(exo)).toBe(11);
    expect(itemMinutes({ id: "x", label: "Gainage", kind: "reps", sets: 3, rest: 30 })).toBe(4);
  });

  it("n'invente pas de durée pour une distance", () => {
    expect(itemMinutes(swim)).toBe(0);
  });

  it("additionne les éléments d'une séance", () => {
    expect(plannedMinutes([{ id: "w", label: "Échauffement", kind: "time", minutes: 10 }, exo])).toBe(21);
  });
});

describe("gainage", () => {
  const plank: Item = { id: "p", label: "Planche", kind: "hold", sets: 3, seconds: 40, rest: 60 };

  it("compte le temps tenu et le repos dans la durée", () => {
    expect(itemMinutes(plank)).toBe(5);
  });

  it("démarre un nouvel élément avec des secondes plutôt que des répétitions", () => {
    const item = emptyItem("hold");
    expect(item.seconds).toBe(40);
    expect(item.reps).toBeUndefined();
  });
});

describe("modifier une liste d'éléments", () => {
  const items = [exo, block, swim];

  it("ajoute, modifie et retire", () => {
    expect(addItem(items, emptyItem("time"))).toHaveLength(4);
    expect(updateItem(items, "a", { sets: 5 })[0].sets).toBe(5);
    expect(removeItem(items, "b").map((i) => i.id)).toEqual(["a", "c"]);
  });

  it("déplace d'un cran, sans sortir de la liste", () => {
    expect(moveItem(items, "b", -1).map((i) => i.id)).toEqual(["b", "a", "c"]);
    expect(moveItem(items, "a", -1)).toEqual(items);
    expect(moveItem(items, "c", 1)).toEqual(items);
  });
});

describe("séance tirée d'un modèle", () => {
  const template: Template = { id: "t1", name: "Renfo haut", disc: "renfo", items: [exo] };

  it("copie le contenu avec de nouveaux identifiants, pour rester indépendante", () => {
    const s = fromTemplate(template, "2026-09-28", "Mardi");
    expect(s.title).toBe("Renfo haut");
    expect(s.from).toBe("t1");
    expect(s.items[0].label).toBe("Squat");
    expect(s.items[0].id).not.toBe(exo.id);
  });
});

describe("record de force estimé", () => {
  it("suit la formule d'Epley", () => {
    expect(estimated1RM(6, 70)).toBe(84);
    expect(estimated1RM(1, 100)).toBe(103.3);
  });

  it("refuse les séries trop longues pour être estimées", () => {
    expect(estimated1RM(15, 40)).toBeUndefined();
    expect(estimated1RM(6, 0)).toBeUndefined();
  });
});
