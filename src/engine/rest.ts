import type { ExoRole } from "../data/types";

/** Repos par défaut quand la consigne n'en indique pas, selon le rôle de l'exercice. */
const BY_ROLE: Record<ExoRole, number> = {
  principal: 150,
  secondaire: 120,
  accessoire: 90,
  gainage: 30,
};

/**
 * Temps de repos écrit dans une consigne, en secondes : « Repos 2 min 30. »,
 * « Repos 45 s. », « 30 s de repos. ». Renvoie null si la consigne n'en dit rien.
 * La consigne reste la seule source : c'est elle que l'utilisateur lit à l'écran.
 */
export function parseRest(cue: string): number | null {
  const min = /Repos (\d+) min(?: (\d+))?/.exec(cue);
  if (min) return Number(min[1]) * 60 + (min[2] ? Number(min[2]) : 0);
  const sec = /Repos (\d+) s\b/.exec(cue) ?? /(\d+) s de repos/.exec(cue);
  return sec ? Number(sec[1]) : null;
}

export const restSeconds = (cue: string | undefined, role?: ExoRole) =>
  parseRest(cue ?? "") ?? (role ? BY_ROLE[role] : 90);

/** « 1:30 », pour un compte à rebours. */
export const clock = (seconds: number) => {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};
