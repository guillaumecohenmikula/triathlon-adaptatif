/**
 * État du chrono, tenu par l'écran de séance : revenir à l'aperçu en cours de route
 * ne remet pas le compteur à zéro.
 */
export interface ChronoState {
  startedAt: number | null;
  pausedAt: number | null;
  /** Secondes ajoutées en passant une phase, retirées pendant les pauses. */
  offset: number;
}

export const IDLE: ChronoState = { startedAt: null, pausedAt: null, offset: 0 };
