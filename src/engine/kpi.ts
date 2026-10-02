import type { ActivityId, DoneItem, Session } from "../data/types";
import { DAYS } from "../data/settings";
import { doneSets, estimated1RM, isDone, sessionDistance, sessionMinutes, tonnage, weightOf } from "./session";

/*
 * La partie mesure. Tout est calculé à partir des séances faites : ce qui est prévu ne
 * compte jamais dans les indicateurs, sinon le carnet mentirait.
 */

export interface WeekStat {
  week: string;
  sessions: number;
  minutes: number;
  byDisc: Partial<Record<ActivityId, number>>;
  /** Charge d'entraînement : minutes × effort ressenti, cumulée sur la semaine. */
  load: number;
  /** Vrai si au moins une séance porte un effort ressenti. */
  hasLoad: boolean;
}

const dayIndex = (day: string) => DAYS.indexOf(day);

/** Les séances faites, de la plus ancienne à la plus récente. */
export const doneSessions = (sessions: Session[]) =>
  sessions
    .filter(isDone)
    .sort((a, b) => a.week.localeCompare(b.week) || dayIndex(a.day) - dayIndex(b.day));

/** Une ligne par semaine où quelque chose a été fait, de la plus récente à la plus ancienne. */
export function weekly(sessions: Session[]): WeekStat[] {
  const byWeek = new Map<string, WeekStat>();
  doneSessions(sessions).forEach((s) => {
    const w =
      byWeek.get(s.week) ??
      { week: s.week, sessions: 0, minutes: 0, byDisc: {}, load: 0, hasLoad: false };
    const minutes = sessionMinutes(s) * weightOf(s);
    w.sessions += 1;
    w.minutes += minutes;
    w.byDisc[s.disc] = (w.byDisc[s.disc] ?? 0) + minutes;
    if (s.actual?.rpe) {
      w.load += minutes * s.actual.rpe;
      w.hasLoad = true;
    }
    byWeek.set(s.week, w);
  });
  return [...byWeek.values()].sort((a, b) => b.week.localeCompare(a.week));
}

/**
 * Nombre de semaines consécutives avec au moins une séance, en remontant depuis la semaine
 * en cours. La semaine en cours ne casse pas la série tant qu'elle est vide : elle n'est
 * pas finie, on repart de la précédente.
 */
export function streak(stats: WeekStat[], currentWeek: string, previousWeek: string): number {
  const weeks = new Set(stats.map((s) => s.week));
  let cursor = weeks.has(currentWeek) ? currentWeek : previousWeek;
  let n = 0;
  while (weeks.has(cursor)) {
    n += 1;
    const d = new Date(cursor);
    d.setDate(d.getDate() - 7);
    cursor = d.toISOString().slice(0, 10);
  }
  return n;
}

export interface PacePoint {
  week: string;
  day: string;
  /** Secondes par kilomètre, ou par 100 m en natation. */
  pace: number;
  distance: number;
  minutes: number;
}

/** L'unité d'allure de la discipline : le 100 m en natation, le kilomètre ailleurs. */
export const paceUnit = (disc: ActivityId) => (disc === "natation" ? 100 : 1000);

/**
 * Allures des séances d'une discipline, de la plus ancienne à la plus récente.
 * Une séance sans distance ou sans durée n'a pas d'allure : elle est écartée.
 */
export function paces(sessions: Session[], disc: ActivityId): PacePoint[] {
  const unit = paceUnit(disc);
  return doneSessions(sessions)
    .filter((s) => s.disc === disc)
    .map((s) => ({ s, distance: sessionDistance(s), minutes: sessionMinutes(s) }))
    .filter((x) => x.distance > 0 && x.minutes > 0)
    .map(({ s, distance, minutes }) => ({
      week: s.week,
      day: s.day,
      pace: (minutes * 60) / (distance / unit),
      distance,
      minutes,
    }));
}

export interface MovementStat {
  movement: string;
  label: string;
  /** Dernière séance où le mouvement a été chargé. */
  lastWeek: string;
  /** Meilleur record de force estimé, en kilos. */
  best?: number;
  /** Plus long maintien tenu, en secondes, pour un gainage. */
  bestHold?: number;
  /** Charge totale soulevée sur le mouvement, tous temps confondus. */
  volume: number;
  sessions: number;
}

/** Progression par mouvement de renfo : record estimé et tonnage. */
export function movements(sessions: Session[]): MovementStat[] {
  const out = new Map<string, MovementStat>();
  doneSessions(sessions).forEach((s) => {
    s.items.forEach((item) => {
      const key = item.movement ?? item.label;
      if (!key) return;
      const done = s.done?.[item.id];
      const sets = doneSets(done);
      if (sets.length === 0) return;
      const stat =
        out.get(key) ??
        { movement: key, label: item.label, lastWeek: s.week, volume: 0, sessions: 0 };
      stat.sessions += 1;
      stat.volume += tonnage(done);
      stat.lastWeek = s.week > stat.lastWeek ? s.week : stat.lastWeek;
      sets.forEach((set) => {
        const rm = set.reps && set.load ? estimated1RM(set.reps, set.load) : undefined;
        if (rm && (stat.best === undefined || rm > stat.best)) stat.best = rm;
        if (set.seconds && (stat.bestHold === undefined || set.seconds > stat.bestHold)) {
          stat.bestHold = set.seconds;
        }
      });
      out.set(key, stat);
    });
  });
  return [...out.values()].sort((a, b) => b.lastWeek.localeCompare(a.lastWeek) || b.volume - a.volume);
}

export interface HeartStat {
  sessions: number;
  avgHr: number;
  maxHr: number;
}

/** Fréquence cardiaque moyenne des séances qui en portent une, et maximum relevé. */
export function heart(sessions: Session[]): HeartStat | undefined {
  const withHr = doneSessions(sessions).filter((s) => s.actual?.avgHr);
  if (withHr.length === 0) return undefined;
  return {
    sessions: withHr.length,
    avgHr: Math.round(withHr.reduce((a, s) => a + (s.actual?.avgHr ?? 0), 0) / withHr.length),
    maxHr: withHr.reduce((a, s) => Math.max(a, s.actual?.maxHr ?? s.actual?.avgHr ?? 0), 0),
  };
}

/**
 * Ce qui avait été fait la dernière fois sur chaque exercice, avant une séance donnée.
 * C'est ce qui permet d'afficher « la dernière fois : 60 kg × 6 » au moment de charger.
 */
export function previousDone(sessions: Session[], before: Session): Record<string, DoneItem> {
  const out: Record<string, DoneItem> = {};
  doneSessions(sessions)
    .filter(
      (s) =>
        s.id !== before.id &&
        (s.week < before.week ||
          (s.week === before.week && dayIndex(s.day) <= dayIndex(before.day))),
    )
    .forEach((s) =>
      s.items.forEach((item) => {
        const done = s.done?.[item.id];
        if (!done?.sets?.length) return;
        out[item.movement ?? item.label] = done;
      }),
    );
  return out;
}
