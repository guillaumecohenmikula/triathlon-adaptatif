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

export interface Settings {
  goal: GoalId;
  mode: ModeId;
  zones: Zones;
  raceDate: string;
  access: Access;
  slots: Slots;
}

export interface SettingsRow extends Settings {
  key: "app";
}

/** Une entrée de journal, adressée par `semaine|jour`. */
export interface JournalRow extends JournalEntry {
  key: string;
}

/** La semaine figée, adressée par son lundi ISO. */
export type WeekRow = StoredWeek;

/** Une pesée, une par semaine, adressée par le lundi ISO. */
export interface WeightRow {
  week: string;
  kg: number;
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

export const journalKey = (week: string, day: string) => `${week}|${day}`;
