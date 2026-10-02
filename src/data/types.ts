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

/** Série d'intervalles : `n` fois `work` minutes, séparées de `rest` minutes. */
export interface Repeats {
  n: number;
  work: number;
  rest: number;
}

/** Étape d'une séance à durée (course, vélo, natation). */
export interface Segment {
  t: string;
  d: number;
  x: string;
  /**
   * Structure fixe d'intervalles. Un segment qui en porte une garde sa durée quelle que
   * soit celle de la séance : raccourcir un 4 × 8 min en changerait la nature.
   */
  rep?: Repeats;
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

/* ---------------------------------------------------------------------------
 * Le carnet (2026-09-30). Guil compose ses propres séances et les place lui-même ;
 * l'app enregistre ce qu'il a fait et le mesure. Les types au-dessus servent
 * désormais de source à la bibliothèque fournie et aux fiches d'exécution.
 * ------------------------------------------------------------------------- */

/**
 * Comment un élément de séance se mesure : en répétitions, en temps tenu (gainage),
 * en durée, ou en distance.
 */
export type ItemKind = "reps" | "hold" | "time" | "distance";

/** Un mouvement de la bibliothèque : un exercice de renfo, un éducatif. */
export interface Movement {
  id: string;
  name: string;
  disc: ActivityId;
  kind: ItemKind;
  /** Fiche d'exécution, quand le mouvement en a une. */
  guide?: string;
  /** Vrai pour ceux fournis avec l'app, faux pour ceux que Guil crée. */
  builtIn?: boolean;
}

/** Un élément de séance : un exercice, un bloc de durée, une distance à couvrir. */
export interface Item {
  id: string;
  /** Mouvement de la bibliothèque dont il vient, s'il en vient. */
  movement?: string;
  label: string;
  kind: ItemKind;
  /** Nombre de séries, pour un exercice. */
  sets?: number;
  /** Ce qu'on fait par série : « 8 », « 8-12 », « max ». */
  reps?: string;
  /** Secondes à tenir par série, pour un gainage. */
  seconds?: number;
  /** Charge : « 60 kg », « élastique », « poids du corps ». */
  load?: string;
  minutes?: number;
  /** Mètres. */
  distance?: number;
  /** Repos entre les séries, en secondes. */
  rest?: number;
  /** Série d'intervalles : n fois `work` minutes séparées de `rest` minutes. */
  rep?: Repeats;
  note?: string;
}

/** Un modèle de séance, réutilisable autant de fois qu'on veut. */
export interface Template {
  id: string;
  name: string;
  disc: ActivityId;
  items: Item[];
  note?: string;
  /** Fiche de séance, pour les modèles fournis avec l'app. */
  guide?: string;
  builtIn?: boolean;
  /** Sorti de la liste sans effacer les séances qui en sont issues. */
  archived?: boolean;
}

/** Ce qui a réellement été fait sur un élément. */
export interface DoneItem {
  /** Une entrée par série réalisée : répétitions et charge, ou secondes tenues. */
  sets?: { reps?: number; load?: number; seconds?: number }[];
  minutes?: number;
  distance?: number;
}

/** Les chiffres de la séance : saisis à la main, ou repris de la montre. */
export interface Actual {
  minutes?: number;
  /** Mètres. */
  distance?: number;
  avgHr?: number;
  maxHr?: number;
  /** Effort ressenti, de 1 à 10. */
  rpe?: number;
  calories?: number;
  /** Dénivelé positif, en mètres. */
  elevation?: number;
  /** Identifiant de l'activité Strava rattachée. */
  strava?: number;
}

/** Une séance du carnet : ce qui était prévu, et ce qui a été fait. */
export interface Session {
  id: string;
  /** Lundi ISO de la semaine. */
  week: string;
  day: string;
  title: string;
  disc: ActivityId;
  /** Copie des éléments au placement : modifier un modèle ne réécrit pas le passé. */
  items: Item[];
  /** Ce qui a été fait, par identifiant d'élément. */
  done?: Record<string, DoneItem>;
  state?: SessionState;
  actual?: Actual;
  note?: string;
  /** Modèle d'origine, pour information. */
  from?: string;
}
