import type { Segment } from "./types";

/* Étapes des séances à durée. Les durées sont mises à l'échelle du créneau réel. */
const RAW = {
  longRun: [
    { t: "Échauffement", d: 10, x: "Trot très souple, 3 accélérations de 20 s sur la fin" },
    { t: "Corps de séance", d: 70, x: "Allure 6'30–6'50/km, respiration confortable, tu dois pouvoir tenir une conversation" },
    { t: "Retour au calme", d: 5, x: "5 min de marche, étirements légers ischios et mollets" },
  ],
  quality: [
    { t: "Échauffement", d: 15, x: "12 min de trot + montées de genoux, talons-fesses, 3 lignes droites" },
    { t: "Corps de séance", d: 30, x: "8 × 400 m à 5'30/km, récupération 1 min en trottinant" },
    { t: "Retour au calme", d: 10, x: "10 min très souple" },
  ],
  tempo: [
    { t: "Échauffement", d: 12, x: "Trot progressif" },
    { t: "Corps de séance", d: 30, x: "2 × 12 min à 5'45/km, 3 min de récup entre les blocs" },
    { t: "Retour au calme", d: 8, x: "Trot souple" },
  ],
  brick: [
    { t: "Vélo", d: 60, x: "Allure course, dernières 10 min à cadence élevée pour préparer les jambes" },
    { t: "Transition", d: 3, x: "Changement de chaussures chronométré, on s'entraîne aussi à ça" },
    { t: "Course", d: 20, x: "Départ volontairement contenu, les jambes reviennent vers la 8e minute" },
  ],
  bikeLong: [
    { t: "Échauffement", d: 15, x: "Cadence 90, résistance faible" },
    { t: "Corps de séance", d: 90, x: "Endurance, terrain roulant, rester assis dans les bosses" },
    { t: "Retour au calme", d: 10, x: "Petit braquet" },
  ],
  bikeGym: [
    { t: "Échauffement", d: 10, x: "Cadence 85-90, résistance légère" },
    { t: "Corps de séance", d: 40, x: "Endurance continue, cadence 85-95, tu dois pouvoir parler" },
    { t: "Retour au calme", d: 5, x: "Résistance minimale" },
  ],
  bikeGymInt: [
    { t: "Échauffement", d: 12, x: "Progressif, 2 accélérations de 30 s" },
    { t: "Corps de séance", d: 35, x: "5 × 4 min résistance forte à cadence 80 / 3 min facile" },
    { t: "Retour au calme", d: 8, x: "Résistance minimale" },
  ],
  bikeHT: [
    { t: "Échauffement", d: 10, x: "Cadence 85-90, braquet souple" },
    { t: "Corps de séance", d: 40, x: "Endurance continue, cadence 85-95" },
    { t: "Retour au calme", d: 5, x: "Braquet minimal" },
  ],
  bikeHTint: [
    { t: "Échauffement", d: 12, x: "Progressif" },
    { t: "Corps de séance", d: 35, x: "5 × 4 min dur / 3 min facile" },
    { t: "Retour au calme", d: 8, x: "Braquet minimal" },
  ],
  swimTech: [
    { t: "Échauffement", d: 10, x: "300 m souple, alternance crawl et dos" },
    { t: "Éducatifs", d: 25, x: "6 × 50 m rattrapé, poings fermés, battements planche" },
    { t: "Corps de séance", d: 15, x: "4 × 100 m souple, focus sur le retour de bras haut" },
  ],
  swimEnd: [
    { t: "Échauffement", d: 10, x: "300 m progressif" },
    { t: "Corps de séance", d: 40, x: "5 × 200 m allure régulière, 30 s de récup" },
    { t: "Retour au calme", d: 10, x: "200 m souple" },
  ],
} satisfies Record<string, Segment[]>;

export type SEGMENTSKey = keyof typeof RAW;

export const SEGMENTS: Record<string, Segment[] | undefined> = RAW;
