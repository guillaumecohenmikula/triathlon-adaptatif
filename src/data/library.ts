import { BLOCKS } from "./blocks";
import type { BlockId } from "./blocks";
import { EXOS } from "./exercises";
import { GUIDES_FOR } from "./guides";
import { SEGMENTS } from "./segments";
import { SESSION_GUIDES } from "./sessionGuides";
import type { Item, Movement, Template } from "./types";

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

/**
 * Exercices que les séances de renfo utilisent sans qu'ils viennent de l'ancien programme.
 * Leur fiche d'exécution est déclarée dans `guides.ts` comme les autres.
 */
const EXTRA_MOVEMENTS = [
  "Développé couché",
  "Tirage horizontal à la barre",
  "Dips",
  "Curl haltères",
];

/** Les exercices de renfo de la bibliothèque, sans doublon de nom. */
export const MOVEMENTS: Movement[] = [
  ...new Map(
    Object.values(EXOS)
      .flatMap((list) => list ?? [])
      .map((e) => e.n)
      .concat(EXTRA_MOVEMENTS)
      .map((name) => [
        name,
        {
          id: slug(name),
          name,
          disc: "renfo",
          kind: "reps",
          guide: GUIDES_FOR[name]?.[0],
          builtIn: true,
        } satisfies Movement,
      ]),
  ).values(),
];

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

/** Un exercice de renfo dans un modèle. */
const exo = (
  id: string,
  name: string,
  sets: number,
  reps: string,
  rest: number,
  load: string,
  note: string,
): Item => ({ id, movement: slug(name), label: name, kind: "reps", sets, reps, rest, load, note });

/*
 * Les deux séances de musculation de Guil, reprises de son programme du 2026-10-02
 * (`programme_triathlon_simple.md`). Elles remplacent les sept séances de renfo de
 * l'ancien programme : deux jours par semaine, haut puis bas du corps.
 */
const STRENGTH: Template[] = [
  {
    id: "t-haut",
    name: "Haut du corps",
    disc: "renfo",
    builtIn: true,
    items: [
      {
        id: "haut-0",
        label: "Échauffement",
        kind: "time",
        minutes: 5,
        note: "5 minutes de rameur, sans forcer, juste pour réveiller le corps.",
      },
      exo(
        "haut-1",
        "Tractions ou tirage vertical",
        4,
        "4-6",
        120,
        "Lest si c'est trop facile, machine assistée ou élastique si c'est trop dur",
        "Mains écartées comme les épaules, bras tendus au départ. Tire-toi en amenant les coudes vers le bas, puis redescends lentement.",
      ),
      exo(
        "haut-2",
        "Développé couché",
        4,
        "5-6",
        120,
        "Barre ou haltères",
        "Allongé sur le banc, descends la barre vers la poitrine en contrôlant, puis pousse. Omoplates serrées du début à la fin.",
      ),
      exo(
        "haut-3",
        "Tirage horizontal à la barre",
        3,
        "8-10",
        90,
        "Barre",
        "Jambes un peu pliées, dos droit, buste penché. Tire la barre vers le ventre, puis redescends lentement.",
      ),
      exo(
        "haut-4",
        "Dips",
        3,
        "6-10",
        90,
        "Poids du corps, machine assistée ou élastique si besoin",
        "Barres parallèles, bras tendus, corps légèrement penché en avant. Descends jusqu'à 90° au coude, pas plus bas, et remonte.",
      ),
      exo(
        "haut-5",
        "Curl haltères",
        2,
        "10-12",
        60,
        "Haltères",
        "Debout, coudes au corps. Monte les haltères vers les épaules, redescends lentement.",
      ),
      exo(
        "haut-6",
        "Planche",
        3,
        "30-45 s",
        60,
        "Poids du corps",
        "Avant-bras au sol, coudes sous les épaules, corps bien droit. Tiens sans bouger.",
      ),
    ],
  },
  {
    id: "t-bas",
    name: "Bas du corps",
    disc: "renfo",
    builtIn: true,
    items: [
      {
        id: "bas-0",
        label: "Échauffement",
        kind: "time",
        minutes: 8,
        note: "5 minutes de vélo stationnaire facile, puis 2 à 3 minutes de petits sauts sur place.",
      },
      exo(
        "bas-1",
        "Squat",
        4,
        "5-6",
        120,
        "Barre sur les épaules, ou charge au choix",
        "Pieds largeur d'épaules, barre sur les trapèzes et non sur le cou. Descends cuisses presque parallèles au sol, remonte en poussant par les talons. Le genou suit la pointe du pied.",
      ),
      exo(
        "bas-2",
        "Soulevé de terre roumain",
        3,
        "6-8",
        120,
        "Barre ou haltères",
        "Genoux à peine fléchis, penche-toi en avant dos droit, la barre frôle les jambes. Descends jusqu'à sentir l'étirement derrière les cuisses, puis remonte en poussant le bassin vers l'avant.",
      ),
      exo(
        "bas-3",
        "Split squat bulgare",
        3,
        "8 par jambe",
        90,
        "Pied arrière sur un banc, haltères si besoin",
        "Descends jusqu'à ce que le genou arrière frôle le sol, puis remonte. Fais les 8 répétitions d'une jambe avant de changer.",
      ),
      exo(
        "bas-4",
        "Planche latérale",
        3,
        "30-40 s par côté",
        60,
        "Poids du corps",
        "Sur le côté, avant-bras au sol, bassin soulevé, corps aligné. Tiens, puis change de côté.",
      ),
      exo(
        "bas-5",
        "Pont fessier",
        3,
        "12-15",
        60,
        "Poids du corps",
        "Sur le dos, genoux pliés, pieds au sol. Pousse le bassin vers le haut jusqu'à aligner épaules, hanches et genoux, puis redescends lentement.",
      ),
      exo(
        "bas-6",
        "Mollets debout",
        2,
        "15-20",
        45,
        "Charge au choix",
        "Debout, une main en appui. Monte sur la pointe des pieds, redescends. Petit mouvement, amplitude complète.",
      ),
    ],
  },
];

/** Les modèles fournis : les séances d'endurance de l'ancien programme, et les deux de renfo. */
export const TEMPLATES: Template[] = [
  ...(Object.keys(BLOCKS) as BlockId[])
    .filter((id) => BLOCKS[id].disc !== "renfo")
    .map((id) => {
      const b = BLOCKS[id];
      return {
        id: `t-${id}`,
        name: b.label,
        disc: b.disc,
        items: enduranceItems(id),
        guide: SESSION_GUIDES[id] ? id : undefined,
        builtIn: true,
      } satisfies Template;
    }),
  ...STRENGTH,
];
