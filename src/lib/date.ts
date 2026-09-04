/** Clé de semaine : le lundi au format ISO, ex. "2026-08-31". */
export const mondayKey = (d: Date = new Date()) => {
  const x = new Date(d);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x.toISOString().slice(0, 10);
};

export const frDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
