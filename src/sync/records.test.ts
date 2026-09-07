import { describe, expect, it } from "vitest";
import type { LocalRow, SyncRecord } from "./records";
import { nextPullMark, shouldApply, toPush } from "./records";

const row = (key: string, updatedAt: number, extra: Partial<LocalRow> = {}): LocalRow => ({
  week: key,
  kg: 80,
  updatedAt,
  ...extra,
});

describe("ce qu'il faut pousser", () => {
  const rows = [row("a", 100), row("b", 200), row("c", 300)];
  const keyOf = (r: LocalRow) => r.week as string;

  it("ne pousse que ce qui a bougé depuis le dernier envoi", () => {
    expect(toPush("weight", rows, keyOf, 150).map((r) => r.key)).toEqual(["b", "c"]);
  });

  it("pousse tout au premier passage", () => {
    expect(toPush("weight", rows, keyOf, 0)).toHaveLength(3);
  });

  it("sort l'horodatage et la pierre tombale du contenu", () => {
    const [rec] = toPush("weight", [row("a", 100, { deleted: true })], keyOf, 0);
    expect(rec.deleted).toBe(true);
    expect(rec.payload).not.toHaveProperty("updatedAt");
    expect(rec.payload).not.toHaveProperty("deleted");
    expect(rec.payload).toMatchObject({ week: "a", kg: 80 });
  });

  it("pousse les enregistrements d'avant la synchronisation", () => {
    const ancien: LocalRow = { week: "vieux", kg: 84 };
    expect(toPush("weight", [ancien], keyOf, 0)).toHaveLength(1);
  });
});

describe("ce qu'il faut appliquer en local", () => {
  const remote: SyncRecord = {
    kind: "weight",
    key: "a",
    payload: { week: "a", kg: 80 },
    deleted: false,
    updatedAt: 500,
  };

  it("crée ce qui n'existe pas encore", () => {
    expect(shouldApply(remote, undefined)).toBe(true);
  });

  it("ignore une suppression distante d'un enregistrement inconnu", () => {
    expect(shouldApply({ ...remote, deleted: true }, undefined)).toBe(false);
  });

  it("n'écrit rien quand le contenu est identique", () => {
    expect(shouldApply(remote, { week: "a", kg: 80, updatedAt: 1 })).toBe(false);
  });

  it("écrit quand le contenu diffère", () => {
    expect(shouldApply(remote, { week: "a", kg: 82, updatedAt: 999 })).toBe(true);
  });

  it("propage une suppression sur un enregistrement encore vivant", () => {
    expect(shouldApply({ ...remote, deleted: true }, { week: "a", kg: 80, updatedAt: 1 })).toBe(true);
  });
});

describe("repère du prochain pull", () => {
  it("retient la date la plus récente reçue", () => {
    const recs = [400, 900, 700].map((updatedAt) => ({ updatedAt }) as SyncRecord);
    expect(nextPullMark(recs, 100)).toBe(900);
  });

  it("ne recule jamais quand rien n'arrive", () => {
    expect(nextPullMark([], 1234)).toBe(1234);
  });
});

describe("pas d'aller-retour sans fin", () => {
  it("ne repousse pas ce qui vient d'être reçu", () => {
    // Le pull horodate à l'instant du push : la ligne n'est donc plus « postérieure ».
    const startedAt = 1000;
    const recu: LocalRow = { week: "a", kg: 80, updatedAt: startedAt };
    expect(toPush("weight", [recu], (r) => r.week as string, startedAt)).toHaveLength(0);
  });

  it("pousse en revanche ce qui a changé pendant la synchronisation", () => {
    const startedAt = 1000;
    const modifie: LocalRow = { week: "a", kg: 81, updatedAt: startedAt + 5 };
    expect(toPush("weight", [modifie], (r) => r.week as string, startedAt)).toHaveLength(1);
  });
});
