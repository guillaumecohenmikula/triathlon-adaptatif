import type { BlockId } from "./blocks";


/* Types du domaine. Repris tels quels du prototype v11 : aucune règle métier n'est
   modifiée ici, on ne fait que nommer ce que le mono-fichier portait implicitement. */

export type Discipline = "course" | "velo" | "natation" | "renfo";

/** Lieu d'un créneau. Un bloc n'est plaçable que dans un créneau du même lieu. */
export type PlaceId = "exterieur" | "salle" | "maison" | "piscine";

/** Matériel ou lieu auquel l'utilisateur a accès. Filtre les blocs proposés. */
export type AccessId =
  | "exterieur"
  | "salle"
  | "veloSalle"
  | "homeTrainer"
  | "veloRoute"
  | "piscine"
  | "maison";

export type PhaseId = "base" | "dev" | "spe" | "affutage";
export type GoalId = "S" | "M" | "L";
export type ModeId = "perf" | "mixte" | "physique";
export type ZoneId = "dos" | "epaules" | "pecs" | "bras" | "jambes";
export type ExoRole = "principal" | "secondaire" | "accessoire" | "gainage";
export type SessionState = "fait" | "partiel" | "rate";

/** Deux blocs du même groupe ne tombent jamais dans la même semaine. */
export type GroupId =
  | "courseDure"
  | "veloEnd"
  | "veloInt"
  | "renfoSemaine"
  | "haut"
  | "bas"
  | "gainage";

export type Access = Record<AccessId, boolean>;
export type Zones = Partial<Record<ZoneId, boolean>>;
export type Targets = Record<Discipline, number>;

export interface Block {
  label: string;
  disc: Discipline;
  place: PlaceId;
  /** Tous ces accès doivent être cochés pour que le bloc soit proposé. */
  needs: AccessId[];
  min: number;
  max: number;
  /** Séance intense : quota par semaine, et jamais deux dans le même créneau. */
  hard: boolean;
  /** Peut être empilé dans un créneau déjà occupé. */
  stack: boolean;
  group?: GroupId;
}

/** Prescription d'un exercice pour une phase donnée. */
export interface Prescription {
  /** Séries × répétitions, ex. "4 × 8". */
  s: string;
  /** Conseil de charge. */
  l: string;
  /** Coût en minutes, repos inclus. */
  c: number;
}

export interface Exercise {
  n: string;
  z?: ZoneId[];
  role: ExoRole;
  prio: number;
  cue: string;
  p: Record<PhaseId, Prescription>;
}

export interface Warmup {
  d: number;
  x: string;
}

/** Étape d'une séance à durée (course, vélo, natation). */
export interface Segment {
  t: string;
  d: number;
  x: string;
}

export interface Phase {
  id: PhaseId;
  label: string;
  /** Largeur relative dans la frise de progression. */
  span: number;
  minSlots: number;
  plan: BlockId[];
  targets: Targets;
  focus: string;
}

/** Un créneau hebdomadaire déclaré par l'utilisateur. */
export interface Slot {
  day: string;
  place: PlaceId;
  duration: number;
}

/** Un bloc placé dans un créneau, avec sa durée retenue. */
export interface PlacedBlock {
  id: BlockId;
  dur: number;
}

export interface PlacedSession extends Slot {
  blocks: PlacedBlock[];
}

export interface JournalEntry {
  /** Lundi ISO de la semaine, ex. "2026-09-01". */
  week: string;
  day: string;
  place: PlaceId;
  blocks: PlacedBlock[];
  state: SessionState;
}

export type Journal = Record<string, JournalEntry>;
