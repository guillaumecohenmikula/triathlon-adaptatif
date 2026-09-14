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
  | "maison"
  | "tapis";

export type PhaseId = "base" | "dev" | "spe" | "affutage";

/**
 * Zone d'intensité aérobie d'un bloc. Absente sur les blocs de renfo, qui ne comptent
 * pas dans la répartition. Le modèle polarisé vise beaucoup de « basse », un peu de
 * « haute », et surtout très peu de « seuil ».
 */
export type IntensityZone = "basse" | "seuil" | "haute";
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
  /** Séance coûteuse en fatigue : jamais deux dans le même créneau. */
  hard: boolean;
  /** Zone d'intensité aérobie. Absente pour le renfo, qui sort du calcul de répartition. */
  zone?: IntensityZone;
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

/** Un bloc posé dans une séance, avec sa durée retenue. */
export interface PlacedBlock {
  id: BlockId;
  dur: number;
}

/** Une séance choisie par l'utilisateur pour un jour de la semaine. */
export interface PlannedSession {
  /**
   * Identifiant stable, qui sert aussi de clé au bilan. Les séances posées par l'ancien
   * moteur automatique portent le nom de leur jour : leur bilan reste ainsi rattaché.
   */
  id: string;
  day: string;
  blocks: PlacedBlock[];
}

/** Ce qu'une séance extra peut être : une des quatre disciplines, ou autre chose. */
export type ActivityId = Discipline | "autre";

/** Une séance faite hors programme, notée après coup. */
export interface ExtraSession {
  id: string;
  /** Lundi ISO de la semaine. */
  week: string;
  day: string;
  activity: ActivityId;
  /** Nom libre : marche, foot, vélotaf. Surtout utile pour « autre ». */
  label?: string;
  /** Minutes. */
  dur: number;
  /** Kilomètres. La natation se saisit en mètres mais se range en kilomètres. */
  km?: number;
  /** Effort ressenti, de 1 à 10. */
  rpe?: number;
  note?: string;
}

/** Le bilan d'une séance du programme, adressé par `semaine|identifiant de séance`. */
export interface JournalEntry {
  /** Lundi ISO de la semaine, ex. "2026-09-01". */
  week: string;
  day: string;
  place: PlaceId;
  blocks: PlacedBlock[];
  state: SessionState;
}

export type Journal = Record<string, JournalEntry>;
