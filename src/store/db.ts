import Dexie from "dexie";
import type { Table } from "dexie";
import type {
  Access,
  ExtraSession,
  GoalId,
  JournalEntry,
  ModeId,
  Movement,
  Session,
  Template,
  Zones,
} from "../data/types";
import { migrate } from "../engine/migrate";
import type { LegacyExtra, LegacyJournal, LegacyWeek } from "../engine/migrate";

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

/** Une entrée de journal, adressée par `semaine|identifiant de séance`. */
export interface JournalRow extends JournalEntry, Synced {
  key: string;
}

/** Une semaine de l'ancien modèle, conservée telle quelle depuis la conversion. */
export type WeekRow = LegacyWeek & Synced;

/** Une séance faite hors programme, adressée par son identifiant. */
export type ExtraRow = ExtraSession & Synced;

/** Une pesée, une par semaine, adressée par le lundi ISO. */
export interface WeightRow extends Synced {
  week: string;
  kg: number;
}

/** Une séance du carnet. */
export type SessionRow = Session & Synced;

/** Un modèle de séance : ceux fournis ne sont ici que s'ils ont été modifiés. */
export type TemplateRow = Template & Synced;

/** Un mouvement ajouté par l'utilisateur, ou un mouvement fourni qu'il a modifié. */
export type MovementRow = Movement & Synced;

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
};

/* Patron officiel Dexie en TypeScript : on n'étend pas la classe, sinon les champs
   déclarés écrasent les tables installées par Dexie au moment de l'initialisation. */
export const db = new Dexie("triathlon") as Dexie & {
  settings: Table<SettingsRow, string>;
  journal: Table<JournalRow, string>;
  weeks: Table<WeekRow, string>;
  weights: Table<WeightRow, string>;
  extras: Table<ExtraRow, string>;
  sessions: Table<SessionRow, string>;
  templates: Table<TemplateRow, string>;
  movements: Table<MovementRow, string>;
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

/* v5 : la semaine se choisit à la main et les séances extra ont leur table.
   Le repère de réception repart de zéro : un appareil resté sur l'ancienne version a pu
   recevoir des séances extra sans savoir les ranger, tout en avançant son repère. */
db.version(5)
  .stores({
    settings: "key, updatedAt",
    journal: "key, week, updatedAt",
    weeks: "week, updatedAt",
    weights: "week, updatedAt",
    extras: "id, week, updatedAt",
    meta: "key",
  })
  .upgrade(async (tx) => {
    await tx.table("meta").put({ key: "lastPulledAt", value: 0 });
  });

/* v6 : l'app devient un carnet. Les séances, les modèles et les mouvements remplacent le
   journal, les semaines et les séances extra, qui restent en base sans être lus : on ne
   jette pas l'historique d'un utilisateur au moment d'une conversion.

   La conversion produit des identifiants déterministes, pour que deux appareils qui
   migrent chacun de leur côté tombent sur les mêmes séances au lieu de les dupliquer. */
db.version(6)
  .stores({
    settings: "key, updatedAt",
    journal: "key, week, updatedAt",
    weeks: "week, updatedAt",
    weights: "week, updatedAt",
    extras: "id, week, updatedAt",
    sessions: "id, week, updatedAt",
    templates: "id, updatedAt",
    movements: "id, updatedAt",
    meta: "key",
  })
  .upgrade(async (tx) => {
    const [journal, weeks, extras] = await Promise.all([
      tx.table("journal").toArray() as Promise<LegacyJournal[]>,
      tx.table("weeks").toArray() as Promise<LegacyWeek[]>,
      tx.table("extras").toArray() as Promise<LegacyExtra[]>,
    ]);
    const now = Date.now();
    const sessions = migrate(journal, weeks, extras).map((s) => ({ ...s, updatedAt: now }));
    if (sessions.length > 0) await tx.table("sessions").bulkPut(sessions);
    await tx.table("meta").put({ key: "lastPulledAt", value: 0 });
  });

/** Horodate un enregistrement au moment de l'écrire. */
export const stamp = <T,>(row: T): T & Synced => ({ ...row, updatedAt: Date.now() });

export const journalKey = (week: string, sessionId: string) => `${week}|${sessionId}`;
