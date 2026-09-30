/*
 * Lecture d'un fichier d'activité exporté d'une montre ou de Strava, en GPX ou en TCX.
 *
 * L'analyse se fait à la main plutôt qu'avec DOMParser : le format est simple, et une
 * fonction pure se teste sans navigateur. On ne lit que ce que le carnet sait ranger.
 */

export interface ParsedActivity {
  format: "gpx" | "tcx";
  /** Durée en secondes. */
  seconds?: number;
  /** Distance en mètres. */
  distance?: number;
  avgHr?: number;
  maxHr?: number;
  calories?: number;
  /** Dénivelé positif cumulé, en mètres. */
  elevation?: number;
  /** Début de l'activité, au format ISO. */
  startedAt?: string;
  /** Sport annoncé par le fichier, quand il en annonce un. */
  sport?: string;
}

const number = (v: string | undefined) => {
  if (v === undefined) return undefined;
  const n = Number(v.trim());
  return Number.isFinite(n) ? n : undefined;
};

const average = (values: number[]) =>
  values.length === 0 ? undefined : Math.round(values.reduce((a, v) => a + v, 0) / values.length);

/** Contenu de chaque `<tag>…</tag>`, contenu imbriqué compris. */
function blocks(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "gi");
  return [...xml.matchAll(re)].map((m) => m[1]);
}

/** Contenu de chaque `<tag>…</tag>` sans balise à l'intérieur. */
function values(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, "gi");
  return [...xml.matchAll(re)].map((m) => m[1]);
}

const sum = (list: (number | undefined)[]) => {
  const known = list.filter((v): v is number => v !== undefined);
  return known.length === 0 ? undefined : known.reduce((a, v) => a + v, 0);
};

/** Dénivelé positif cumulé. Les variations minuscules sont du bruit de capteur. */
function climb(altitudes: number[]): number | undefined {
  if (altitudes.length < 2) return undefined;
  let total = 0;
  for (let i = 1; i < altitudes.length; i++) {
    const delta = altitudes[i] - altitudes[i - 1];
    if (delta > 0.5) total += delta;
  }
  return Math.round(total);
}

const R = 6_371_000;
const rad = (deg: number) => (deg * Math.PI) / 180;

/** Distance entre deux points du globe, en mètres. */
function haversine(a: [number, number], b: [number, number]) {
  const dLat = rad(b[0] - a[0]);
  const dLon = rad(b[1] - a[1]);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function parseTcx(xml: string): ParsedActivity {
  const laps = blocks(xml, "Lap");
  const seconds = sum(laps.map((l) => number(values(l, "TotalTimeSeconds")[0])));
  const distance = sum(laps.map((l) => number(values(l, "DistanceMeters")[0])));
  const calories = sum(laps.map((l) => number(values(l, "Calories")[0])));

  const hrOf = (part: string, tag: string) =>
    blocks(part, tag)
      .map((b) => number(values(b, "Value")[0]))
      .filter((v): v is number => v !== undefined);

  const lapAvg = laps.flatMap((l) => hrOf(l, "AverageHeartRateBpm"));
  const lapMax = laps.flatMap((l) => hrOf(l, "MaximumHeartRateBpm"));
  const pointHr = hrOf(xml, "HeartRateBpm");

  const altitudes = values(xml, "AltitudeMeters")
    .map(number)
    .filter((v): v is number => v !== undefined);

  return {
    format: "tcx",
    seconds: seconds === undefined ? undefined : Math.round(seconds),
    distance: distance === undefined ? undefined : Math.round(distance),
    calories: calories === undefined ? undefined : Math.round(calories),
    avgHr: average(lapAvg.length > 0 ? lapAvg : pointHr),
    maxHr: [...lapMax, ...pointHr].length > 0 ? Math.max(...lapMax, ...pointHr) : undefined,
    elevation: climb(altitudes),
    startedAt: values(xml, "Id")[0]?.trim(),
    sport: /<Activity[^>]*Sport="([^"]+)"/i.exec(xml)?.[1],
  };
}

function parseGpx(xml: string): ParsedActivity {
  const points = [...xml.matchAll(/<trkpt[^>]*lat="([-\d.]+)"[^>]*lon="([-\d.]+)"[^>]*>([\s\S]*?)<\/trkpt>/gi)].map(
    (m) => ({
      at: [Number(m[1]), Number(m[2])] as [number, number],
      body: m[3],
    }),
  );

  let distance = 0;
  for (let i = 1; i < points.length; i++) distance += haversine(points[i - 1].at, points[i].at);

  const times = points
    .map((p) => values(p.body, "time")[0])
    .filter((t): t is string => Boolean(t))
    .map((t) => new Date(t).getTime())
    .filter((t) => Number.isFinite(t));

  const altitudes = points
    .map((p) => number(values(p.body, "ele")[0]))
    .filter((v): v is number => v !== undefined);

  // La fréquence cardiaque vit dans une extension, dont le préfixe varie selon l'appareil.
  const hr = points
    .map((p) => number(/<[^>]*hr>([^<]*)</i.exec(p.body)?.[1]))
    .filter((v): v is number => v !== undefined);

  return {
    format: "gpx",
    seconds: times.length > 1 ? Math.round((times[times.length - 1] - times[0]) / 1000) : undefined,
    distance: points.length > 1 ? Math.round(distance) : undefined,
    avgHr: average(hr),
    maxHr: hr.length > 0 ? Math.max(...hr) : undefined,
    elevation: climb(altitudes),
    startedAt: times.length > 0 ? new Date(times[0]).toISOString() : undefined,
    sport: values(xml, "type")[0]?.trim(),
  };
}

/**
 * Un zéro n'est pas une mesure : une séance en salle annonce souvent une distance nulle,
 * et la recopier écraserait une saisie faite à la main.
 */
function clean(a: ParsedActivity): ParsedActivity {
  const keys = ["seconds", "distance", "avgHr", "maxHr", "calories", "elevation"] as const;
  const out = { ...a };
  keys.forEach((k) => {
    if (out[k] === 0) out[k] = undefined;
  });
  return out;
}

/** Lit un fichier d'activité. Renvoie null si le format n'est ni GPX ni TCX. */
export function parseActivity(text: string): ParsedActivity | null {
  if (/<TrainingCenterDatabase/i.test(text)) return clean(parseTcx(text));
  if (/<gpx[\s>]/i.test(text)) return clean(parseGpx(text));
  return null;
}

/** Résumé lisible de ce qui a été importé. */
export function summary(a: ParsedActivity): string {
  const parts = [
    a.seconds ? `${Math.round(a.seconds / 60)} min` : null,
    a.distance ? `${(a.distance / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} km` : null,
    a.avgHr ? `${a.avgHr} bpm` : null,
    a.elevation ? `${a.elevation} m D+` : null,
    a.calories ? `${a.calories} kcal` : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "aucune donnée exploitable";
}
