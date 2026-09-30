import { useLiveQuery } from "dexie-react-hooks";
import { useMemo } from "react";
import { MOVEMENTS, TEMPLATES } from "../data/library";
import type { Movement, Template } from "../data/types";
import { db, stamp } from "./db";
import { track } from "./writes";

/*
 * La bibliothèque : ce que l'app fournit, plus ce que Guil crée ou modifie.
 * Un élément fourni qui a été modifié existe en base sous le même identifiant et
 * remplace l'original ; rien n'est jamais écrasé dans le code.
 */

function merge<T extends { id: string }>(builtIn: T[], rows: (T & { deleted?: boolean })[]): T[] {
  const byId = new Map(builtIn.map((t) => [t.id, t]));
  rows.forEach((r) => {
    if (r.deleted) byId.delete(r.id);
    else byId.set(r.id, r);
  });
  return [...byId.values()];
}

export interface LibraryStore {
  /** Modèles utilisables, les archivés en moins. */
  templates: Template[];
  /** Modèles archivés, pour pouvoir les remettre. */
  archived: Template[];
  movements: Movement[];
  loaded: boolean;
  saveTemplate: (template: Template) => void;
  /** Archive au lieu de supprimer : les séances déjà posées gardent leur origine. */
  archiveTemplate: (id: string, archived: boolean) => void;
  /** Efface définitivement un modèle créé par l'utilisateur. */
  deleteTemplate: (id: string) => void;
  saveMovement: (movement: Movement) => void;
}

export function useLibrary(): LibraryStore {
  const templateRows = useLiveQuery(() => db.templates.toArray(), []);
  const movementRows = useLiveQuery(() => db.movements.toArray(), []);

  const all = useMemo(() => merge(TEMPLATES, templateRows ?? []), [templateRows]);
  const movements = useMemo(() => merge(MOVEMENTS, movementRows ?? []), [movementRows]);

  const templates = useMemo(
    () =>
      all
        .filter((t) => !t.archived)
        .sort((a, b) => a.disc.localeCompare(b.disc) || a.name.localeCompare(b.name)),
    [all],
  );

  const save = (template: Template) =>
    track("Enregistrement du modèle", () =>
      db.templates.put(stamp({ ...template, deleted: false })),
    );

  return {
    templates,
    archived: all.filter((t) => t.archived),
    movements: movements.sort((a, b) => a.name.localeCompare(b.name)),
    loaded: templateRows !== undefined && movementRows !== undefined,
    saveTemplate: save,
    archiveTemplate: (id, archived) => {
      const template = all.find((t) => t.id === id);
      if (template) save({ ...template, archived });
    },
    deleteTemplate: (id) =>
      track("Suppression du modèle", () =>
        db.transaction("rw", db.templates, async () => {
          const row = await db.templates.get(id);
          if (row) await db.templates.put(stamp({ ...row, deleted: true }));
        }),
      ),
    saveMovement: (movement) =>
      track("Enregistrement du mouvement", () =>
        db.movements.put(stamp({ ...movement, deleted: false })),
      ),
  };
}
