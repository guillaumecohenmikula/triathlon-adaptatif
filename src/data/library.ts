import { BLOCKS } from "./blocks";
import type { BlockId } from "./blocks";
import { EXOS } from "./exercises";
import { GUIDES_FOR } from "./guides";
import { SEGMENTS } from "./segments";
import { SESSION_GUIDES } from "./sessionGuides";
import type { Item, Movement, Template } from "./types";
import { WARMUPS } from "./warmups";

/*
 * La bibliothèque fournie. Elle n'est plus un programme : c'est un point de départ
 * que Guil duplique, modifie ou ignore. Elle est dérivée des données existantes
 * (blocs, exercices, segments, échauffements) pour rester d'une seule source.
 */

/** Identifiant stable tiré d'un nom : deux appareils doivent produire le même. */
export const slug = (name: string) =>
  name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/** « 4 × 6 » donne 4 séries de « 6 ». Ce qui ne s'y prête pas reste tel quel. */
export function prescription(text: string): { sets?: number; reps: string } {
  const m = /^(\d+)\s*×\s*(.+)$/.exec(text);
  return m ? { sets: Number(m[1]), reps: m[2] } : { reps: text };
}

/** Repos écrit dans une consigne, en secondes. Dupliqué ici pour ne pas faire dépendre les données du moteur. */
function restOf(cue: string): number | undefined {
  const min = /Repos (\d+) min(?: (\d+))?/.exec(cue);
  if (min) return Number(min[1]) * 60 + (min[2] ? Number(min[2]) : 0);
  const sec = /Repos (\d+) s\b/.exec(cue) ?? /(\d+) s de repos/.exec(cue);
  return sec ? Number(sec[1]) : undefined;
}

/** Les exercices de renfo de la bibliothèque, sans doublon de nom. */
export const MOVEMENTS: Movement[] = [
  ...new Map(
    Object.values(EXOS)
      .flatMap((list) => list ?? [])
      .map((e) => [
        e.n,
        {
          id: slug(e.n),
          name: e.n,
          disc: "renfo",
          kind: "reps",
          guide: GUIDES_FOR[e.n]?.[0],
          builtIn: true,
        } satisfies Movement,
      ]),
  ).values(),
];

/** Les éléments d'un modèle de renfo : échauffement, puis les exercices en prescription de base. */
function renfoItems(id: BlockId): Item[] {
  const warm = WARMUPS[id];
  const list = EXOS[id] ?? [];
  const items: Item[] = [];
  if (warm) {
    items.push({
      id: `${id}-warm`,
      label: "Échauffement",
      kind: "time",
      minutes: warm.d,
      note: warm.x,
    });
  }
  list.forEach((e, i) => {
    const p = e.p.base;
    const { sets, reps } = prescription(p.s);
    items.push({
      id: `${id}-${i}`,
      movement: slug(e.n),
      label: e.n,
      kind: "reps",
      sets,
      reps,
      load: p.l,
      rest: restOf(e.cue),
      note: e.cue,
    });
  });
  return items;
}

/** Les éléments d'un modèle d'endurance : ses segments, avec leurs durées de référence. */
function enduranceItems(id: BlockId): Item[] {
  return (SEGMENTS[id] ?? []).map((s, i) => ({
    id: `${id}-${i}`,
    label: s.t,
    kind: "time" as const,
    minutes: s.d,
    rep: s.rep,
    note: s.x,
  }));
}

/** Les modèles fournis, un par séance de l'ancien programme. */
export const TEMPLATES: Template[] = (Object.keys(BLOCKS) as BlockId[]).map((id) => {
  const b = BLOCKS[id];
  return {
    id: `t-${id}`,
    name: b.label,
    disc: b.disc,
    items: EXOS[id] ? renfoItems(id) : enduranceItems(id),
    guide: SESSION_GUIDES[id] ? id : undefined,
    builtIn: true,
  };
});
