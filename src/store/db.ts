import Dexie from "dexie";
import type { Table } from "dexie";
import type {
  Access,
  GoalId,
  JournalEntry,
  ModeId,
  Slots,
  Zones,
} from "../data/types";
import type { StoredWeek } from "../engine/replan";

export type { Slots };

/** Résultat du test CSS : les deux temps en secondes, et quand il a été fait. */
export interface SwimTest {
  t400: number;
  t200: number;
  date: string;
}

export interface Settings {
  goal: GoalId;
  mode: ModeId;
  zones: Zones;
  raceDate: string;
  access: Access;
  slots: Slots;
  /** Absent tant que le test CSS n'a pas été fait. */
  swimTest?: SwimTest;
}

/**
 * Horodatage local de chaque enregistrement. C'est lui qui permet à la synchronisation
 * de savoir quoi pousser, et au serveur d'arbitrer « le plus récent gagne ».
 */
export interface Synced {
  updatedAt: number;
  /** Pierre tombale : une suppression doit se propager aux autres appareils. */
  deleted?: boolean;
}

export interface SettingsRow extends Settings, Synced {
  key: "app";
}

/** Une entrée de journal, adressée par `semaine|jour`. */
export interface JournalRow extends JournalEntry, Synced {
  key: string;
}

/** La semaine figée, adressée par son lundi ISO. */
export type WeekRow = StoredWeek & Synced;

/** Une pesée, une par semaine, adressée par le lundi ISO. */
export interface WeightRow extends Synced {
  week: string;
  kg: number;
}

/** Petites valeurs de service : date de dernière synchronisation, identifiant d'appareil. */
export interface MetaRow {
  key: string;
  value: unknown;
}

export const DEFAULTS: Settings = {
  goal: "M",
  mode: "mixte",
  zones: { dos: true, epaules: true },
  raceDate: "2027-06-13",
  access: {
    exterieur: true,
    salle: true,
    maison: true,
    piscine: true,
    veloSalle: true,
    veloRoute: false,
    homeTrainer: false,
    tapis: false,
  },
  slots: {
    Mardi: { place: "salle", duration: 90 },
    Jeudi: { place: "exterieur", duration: 60 },
    Samedi: { place: "exterieur", duration: 90 },
  },
};

/* Patron officiel Dexie en TypeScript : on n'étend pas la classe, sinon les champs
   déclarés écrasent les tables installées par Dexie au moment de l'initialisation. */
export const db = new Dexie("triathlon") as Dexie & {
  settings: Table<SettingsRow, string>;
  journal: Table<JournalRow, string>;
  weeks: Table<WeekRow, string>;
  weights: Table<WeightRow, string>;
  meta: Table<MetaRow, string>;
};

db.version(1).stores({
  settings: "key",
  journal: "key, week",
});

/* v2 : la semaine devient un objet persistant, sans quoi la replanification en cours
   de semaine est impossible (rien ne distingue le prévu du réalisé). */
db.version(2).stores({
  settings: "key",
  journal: "key, week",
  weeks: "week",
});

/* v3 : suivi du poids, une pesée par semaine. */
db.version(3).stores({
  settings: "key",
  journal: "key, week",
  weeks: "week",
  weights: "week",
});

/* v4 : chaque enregistrement s'horodate, condition de la synchronisation. */
db.version(4)
  .stores({
    settings: "key, updatedAt",
    journal: "key, week, updatedAt",
    weeks: "week, updatedAt",
    weights: "week, updatedAt",
    meta: "key",
  })
  .upgrade(async (tx) => {
    // L'existant est daté d'aujourd'hui : il sera poussé au premier passage.
    const now = Date.now();
    for (const name of ["settings", "journal", "weeks", "weights"]) {
      await tx.table(name).toCollection().modify((row: Partial<Synced>) => {
        row.updatedAt ??= now;
      });
    }
  });

/** Horodate un enregistrement au moment de l'écrire. */
export const stamp = <T,>(row: T): T & Synced => ({ ...row, updatedAt: Date.now() });

export const journalKey = (week: string, day: string) => `${week}|${day}`;
