/**
 * Critical Swim Speed : l'allure de seuil en natation, celle qu'on tient environ 1500 m.
 *
 * Protocole : un 400 m à fond, récupération complète, puis un 200 m à fond, le même jour.
 * L'allure de seuil se déduit de l'écart entre les deux : le temps mis à parcourir les
 * 200 m supplémentaires, ramené à 100 m.
 */
export const cssPace = (t400: number, t200: number) => (t400 - t200) / 2;

/** Le test n'a de sens que si le 400 est plus lent au 100 que le 200, et pas absurdement. */
export function isValidTest(t400: number, t200: number) {
  if (!Number.isFinite(t400) || !Number.isFinite(t200)) return false;
  if (t400 <= t200) return false;
  const css = cssPace(t400, t200);
  // Entre 1 min et 5 min au 100 m : au-delà, c'est une faute de saisie.
  return css >= 60 && css <= 300;
}

/** Secondes vers « 2'10 ». */
export const formatPace = (seconds: number) => {
  const s = Math.round(seconds);
  return `${Math.floor(s / 60)}'${String(s % 60).padStart(2, "0")}`;
};

/** Secondes vers « 8:00 », pour les champs de saisie de temps. */
export const formatTime = (seconds: number) => {
  const s = Math.round(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

/** Lit « 8:00 », « 8'00 », « 8 00 » ou « 480 ». Renvoie null si illisible. */
export function parseTime(input: string): number | null {
  const s = input.trim().replace(",", ".");
  if (s === "") return null;
  const m = /^(\d{1,3})\s*[:'’.\s]\s*(\d{1,2})$/.exec(s);
  if (m) {
    const sec = Number(m[2]);
    return sec < 60 ? Number(m[1]) * 60 + sec : null;
  }
  if (/^\d+$/.test(s)) return Number(s);
  return null;
}

/**
 * Allures d'entraînement dérivées de la CSS, en secondes par 100 m.
 * L'endurance se nage plus lentement que le seuil, la vitesse plus vite.
 */
export const swimPaces = (css: number) => ({
  endurance: css + 8,
  seuil: css,
  vitesse: css - 4,
});
