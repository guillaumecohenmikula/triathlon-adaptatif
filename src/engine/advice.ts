import type { ActivityId, Session } from "../data/types";
import { dateOf } from "../lib/date";
import { doneSessions, weekly } from "./kpi";
import { sessionDistance, sessionMinutes, weightOf } from "./session";

/*
 * Le conseil discret. L'app ne dit jamais quoi faire : elle signale ce que les chiffres
 * montrent, et seulement quand c'est net. Tout est calculé, rien n'est prescrit.
 */

export interface Signal {
  id: string;
  text: string;
  tone: "info" | "warn";
}

const DAY_MS = 86_400_000;
const LABEL: Record<ActivityId, string> = {
  course: "couru",
  velo: "fait de vélo",
  natation: "nagé",
  renfo: "fait de renfo",
  autre: "fait d'autre activité",
};

/** Allure au-delà de laquelle une sortie longue n'en est plus une, en secondes par km. */
const EASY_RUN_PACE = 390;

const pace = (s: Session) => {
  const distance = sessionDistance(s);
  const minutes = sessionMinutes(s);
  if (distance <= 0 || minutes <= 0) return undefined;
  return (minutes * 60) / (distance / 1000);
};

const mmss = (seconds: number) =>
  `${Math.floor(seconds / 60)}'${String(Math.round(seconds % 60)).padStart(2, "0")}`;

const hours = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h === 0 ? `${m} min` : m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, "0")}`;
};

/**
 * Les signaux du moment, du plus utile au moins urgent.
 * `now` est injecté pour rester testable.
 */
export function signals(
  sessions: Session[],
  currentWeek: string,
  now: Date = new Date(),
): Signal[] {
  const out: Signal[] = [];
  const done = doneSessions(sessions);
  if (done.length === 0) return out;

  // Discipline délaissée : plus de deux semaines sans, alors qu'elle a déjà été pratiquée.
  (["natation", "velo", "course", "renfo"] as ActivityId[]).forEach((disc) => {
    const last = [...done].reverse().find((s) => s.disc === disc);
    if (!last) return;
    const days = Math.floor((now.getTime() - dateOf(last.week, last.day).getTime()) / DAY_MS);
    if (days >= 14) {
      out.push({
        id: `gap-${disc}`,
        tone: "warn",
        text: `Tu n'as pas ${LABEL[disc]} depuis ${days} jours.`,
      });
    }
  });

  // Semaine nettement plus chargée que les précédentes : le volume monte vite.
  const stats = weekly(sessions);
  const current = stats.find((s) => s.week === currentWeek);
  const past = stats.filter((s) => s.week < currentWeek).slice(0, 4);
  if (current && past.length >= 2) {
    const average = past.reduce((a, s) => a + s.minutes, 0) / past.length;
    if (average > 0 && current.minutes > average * 1.5) {
      out.push({
        id: "volume",
        tone: "warn",
        text: `Cette semaine est déjà à ${hours(current.minutes)}, contre ${hours(average)} en moyenne sur tes dernières semaines. La progression du volume se paie sur la récupération.`,
      });
    }
  }

  // Sortie longue courue trop vite : le constat de la calibration de septembre.
  const longRun = [...done]
    .reverse()
    .find((s) => s.disc === "course" && sessionMinutes(s) >= 50 && pace(s) !== undefined);
  const p = longRun ? pace(longRun) : undefined;
  if (longRun && p !== undefined && p < EASY_RUN_PACE) {
    out.push({
      id: "pace",
      tone: "info",
      text: `Ta dernière sortie longue était à ${mmss(p)}/km. Une allure facile autour de 6'30 à 6'50 construirait davantage, et laisserait de la fraîcheur pour les séances rapides.`,
    });
  }

  // Aucune séance notée cette semaine alors que la semaine est bien entamée.
  if (!current && now.getDay() >= 4) {
    out.push({
      id: "empty",
      tone: "info",
      text: "Rien de noté cette semaine pour l'instant.",
    });
  }

  return out;
}

/** Part du volume par discipline sur les semaines faites, pour le regard d'ensemble. */
export function shares(sessions: Session[]): Partial<Record<ActivityId, number>> {
  const total = doneSessions(sessions).reduce((a, s) => a + sessionMinutes(s) * weightOf(s), 0);
  if (total === 0) return {};
  const out: Partial<Record<ActivityId, number>> = {};
  doneSessions(sessions).forEach((s) => {
    out[s.disc] = (out[s.disc] ?? 0) + (sessionMinutes(s) * weightOf(s)) / total;
  });
  return out;
}
