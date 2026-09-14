import type { BlockId } from "./blocks";

/*
 * Le discours du coach pour les séances d'endurance : pourquoi on la fait, comment doser
 * sans capteur, la technique à surveiller et les pièges. Les intensités s'appuient sur
 * `docs/bases-scientifiques.md` (répartition polarisée, 4 × 8 min, cadence basse à vélo,
 * allure CSS en natation).
 */

export interface Drill {
  name: string;
  how: string;
  /** Ce que l'éducatif corrige. */
  focus: string;
}

export interface SessionGuide {
  goal: string;
  /** Comment savoir qu'on est à la bonne intensité, sans capteur d'abord. */
  intensity: string[];
  technique: string[];
  mistakes: string[];
  /** Hydratation, alimentation, matériel, organisation. */
  practical?: string[];
  drills?: Drill[];
}

const RUN_FORM = [
  "Pas courts et fréquents, pied qui se pose sous le bassin et pas loin devant. Augmenter sa cadence de 5 à 10 % réduit les contraintes sur les genoux et les hanches.",
  "Buste grand, légèrement penché vers l'avant depuis les chevilles, pas depuis la taille.",
  "Épaules basses et relâchées, bras pliés à 90° qui balancent d'avant en arrière sans croiser devant le corps.",
  "Regard loin devant, mâchoire et mains détendues.",
];

const EASY = [
  "Test de la parole : tu dois pouvoir tenir une conversation en phrases complètes. Si tu ne peux dire que quelques mots, ralentis.",
  "Effort ressenti 3 à 4 sur 10 : ça doit sembler presque trop facile.",
  "Avec une montre cardio : autour de 70 à 75 % de ta fréquence cardiaque maximale, pas plus.",
];

const HARD_INTERVALS = [
  "La bonne allure est la plus rapide que tu tiendras de façon égale sur les quatre séries. Effort ressenti 8 sur 10 : dur, mais contrôlé.",
  "Test de la parole : quelques mots, pas de phrase.",
  "La première série doit sembler un peu facile : la difficulté monte d'une série à l'autre, c'est voulu.",
  "Avec une montre cardio : au-dessus de 85 à 90 % du maximum en fin de série. Le cœur monte en retard, ne règle pas ton effort dessus les premières minutes.",
];

const INTERVAL_TRAPS = [
  "Partir vite sur la première série : si la quatrième est nettement plus lente, c'est ce qui s'est passé. Note-le pour la fois suivante.",
  "Récupérer à l'arrêt : bouge doucement, la série suivante passe mieux.",
  "Faire cette séance fatigué, ou la veille d'une autre séance dure : elle ne vaut que si tu peux vraiment appuyer.",
];

const BIKE_FORM = [
  "Hauteur de selle : jambe presque tendue en bas du coup de pédale, genou légèrement fléchi. Le bassin ne se balance pas sur la selle.",
  "Pédale en cercles réguliers, sans à-coups.",
  "Haut du corps immobile et relâché : coudes souples, épaules basses, mains posées sans serrer.",
];

const INDOOR = [
  "Ventilateur, serviette et eau à portée : on transpire bien plus qu'en extérieur, et la chaleur fait monter le cœur sans rien apporter.",
];

const EASY_BIKE = [
  "Effort ressenti 3 à 4 sur 10 : tu dois pouvoir parler.",
  "Cadence 85 à 95 tours par minute, résistance légère : on fait tourner les jambes, on n'écrase pas les pédales.",
  "Avec une montre cardio : autour de 70 % de ta fréquence maximale. Elle est en général un peu plus basse à vélo qu'en course pour le même ressenti.",
];

const LOW_CADENCE = {
  goal: "Élever ton plafond aérobie à vélo. Réaliser les intervalles à basse cadence, 50 à 70 tours par minute, a davantage amélioré la capacité aérobie que la cadence libre dans un essai chez des cyclistes entraînées.",
  intensity: [
    "Résistance forte, effort ressenti 8 sur 10 : dur mais tenable de façon égale sur les quatre séries.",
    "Test de la parole : quelques mots seulement.",
    "Avec une montre cardio : au-dessus de 85 % du maximum en fin de série. Il monte en retard, ne t'y fie pas au début.",
    "Si la cadence tombe sous 50 sur la dernière série, la résistance était trop forte.",
  ],
  technique: [
    "Reste assis, buste stable, sans tirer sur le guidon ni te balancer.",
    "Accompagne la pédale sur tout le tour pour lisser l'effort à basse cadence.",
    "Pendant la récupération : résistance minimale, cadence libre, épaules relâchées.",
  ],
  mistakes: [
    "Un genou qui tire à basse cadence : remonte vers 80 tours et baisse la résistance. Ça ne doit jamais faire mal aux articulations.",
    ...INTERVAL_TRAPS,
  ],
};

const SWIM_FORM = [
  "Tête dans le prolongement du corps, regard vers le fond : relever la tête fait couler les jambes.",
  "Expire en continu dans l'eau, par le nez et la bouche, pour n'avoir qu'à inspirer en tournant la tête.",
  "Respire sur le côté en roulant avec le corps, une oreille reste dans l'eau. Tous les trois mouvements de bras si tu peux, pour équilibrer la nage.",
  "Main qui entre dans l'eau devant l'épaule et pas au centre, bras qui s'allonge avant de tirer.",
  "Coude haut pendant la traction : avant-bras et main forment une pagaie qui pousse l'eau vers l'arrière, jusqu'à la hanche.",
  "Battements de jambes petits et réguliers, depuis la hanche. En triathlon, ils servent surtout à garder les jambes à la surface.",
];

const SWIM_DRILLS: Drill[] = [
  {
    name: "Rattrapé",
    how: "Un bras reste tendu devant pendant que l'autre fait un mouvement complet et vient le toucher. Puis on change de bras.",
    focus: "Allonger la nage et sentir la glisse : on ne tire que lorsque le bras avant est bien placé.",
  },
  {
    name: "Poings fermés",
    how: "Crawl normal, poings fermés. Sur les derniers 25 m, rouvre les mains.",
    focus: "Obliger l'avant-bras à tirer l'eau, coude haut. En rouvrant les mains, tu sens nettement plus d'appui.",
  },
  {
    name: "Battements planche",
    how: "Planche tenue bras tendus, visage dans l'eau et tête qui se tourne pour respirer si tu peux. Jambes presque tendues, chevilles souples.",
    focus: "Battre depuis la hanche et non depuis le genou, et trouver une position du corps horizontale.",
  },
];

const RAW = {
  longRun: {
    goal: "Construire la base aérobie : cœur, capillaires et muscles apprennent à durer. C'est la séance la plus importante de la semaine, et la plus facile en intensité.",
    intensity: [...EASY, "Marcher quelques secondes en côte pour rester facile est une bonne décision, pas un échec."],
    technique: RUN_FORM,
    mistakes: [
      "Courir trop vite, l'erreur la plus répandue. Tes sorties passées tournaient souvent entre 5'40 et 6'15/km : trop rapide pour ce rôle, ça fatigue sans construire davantage.",
      "Accélérer sur la fin pour finir fort : garde ça pour les séances dures.",
      "Allonger la foulée quand la fatigue arrive : raccourcis plutôt le pas.",
    ],
    practical: [
      "Au-delà d'une heure, emporte de l'eau s'il fait chaud.",
      "Au-delà de 75 à 90 minutes, prends 30 à 60 g de glucides par heure : un gel, une compote, quelques dattes. C'est aussi un entraînement de l'estomac pour la course.",
      "Parcours plat ou vallonné doux : les côtes raides font sortir de la zone facile.",
    ],
  },

  quality: {
    goal: "Élever ton plafond aérobie. Le format 4 × 8 minutes est celui qui, pour une pénibilité perçue plus faible, accumule le plus de temps près de la VO2max dans les travaux de Seiler.",
    intensity: HARD_INTERVALS,
    technique: [
      RUN_FORM[0],
      "Sur les séries, même foulée qu'en endurance en plus dynamique : ce n'est pas un sprint.",
      "Choisis un parcours plat et sans feux : chaque arrêt casse l'effort.",
    ],
    mistakes: INTERVAL_TRAPS,
    practical: [
      "L'échauffement complet n'est pas facultatif : les accélérations préparent le cœur et les muscles à l'intensité.",
      "Une séance intense par semaine en phase base, deux au maximum ensuite.",
    ],
  },

  tempo: {
    goal: "Travailler au seuil, l'allure que tu tiendrais environ une heure en course. Utile mais coûteux : la répartition polarisée en garde peu, d'où deux blocs courts.",
    intensity: [
      "Effort ressenti 6 à 7 sur 10 : confortablement dur.",
      "Test de la parole : phrases courtes, pas de conversation.",
      "L'allure indiquée est un repère : si la chaleur ou la fatigue la rendent trop dure, fie-toi aux sensations.",
    ],
    technique: RUN_FORM,
    mistakes: [
      "En faire une course contre la montre : au seuil, on reste juste en dessous du moment où l'on s'essouffle.",
      "Allonger les blocs d'une semaine à l'autre sans les avoir tenus réguliers.",
    ],
  },

  brick: {
    goal: "Habituer les jambes à courir juste après le vélo. Les premières minutes de course paraissent toujours lourdes : on apprend à les gérer, et on répète la transition.",
    intensity: [
      "Vélo à allure de course, effort ressenti 6 sur 10.",
      "Course : pars volontairement plus lentement que prévu. Les jambes reviennent vers la huitième minute, l'allure suit.",
    ],
    technique: [
      "Sur les 10 dernières minutes de vélo, monte la cadence vers 90 à 95 tours en allégeant : ça prépare la fréquence de la foulée.",
      "En sortie de vélo, pas courts et rapides, buste redressé : le dos reste souvent penché après la position vélo.",
      "Prépare ta zone avant de partir : chaussures ouvertes, lacets élastiques, casquette, dans l'ordre où tu les prends.",
    ],
    mistakes: [
      "Partir trop vite en course parce que les jambes semblent tourner vite : illusion classique après le vélo.",
      "Ne pas boire sur le vélo : on arrive déshydraté sur la course.",
    ],
    practical: ["Chronomètre la transition : c'est du temps gagné sans effort le jour de la course."],
  },

  runGym: {
    goal: "Le rôle de la sortie longue, en salle : du volume facile qui construit la base aérobie.",
    intensity: EASY,
    technique: [
      "Inclinaison à 1 % : elle compense l'absence de résistance de l'air et rapproche l'effort de la course dehors.",
      "Cours au centre de la bande, sans tenir les barres.",
      ...RUN_FORM.slice(0, 3),
    ],
    mistakes: [
      "Régler une vitesse trop élevée parce que le tapis semble facile : fie-toi à la parole, pas au chiffre.",
      "Regarder ses pieds : regard devant, sinon le dos se voûte.",
    ],
    practical: INDOOR,
  },

  runGymInt: {
    goal: "Élever ton plafond aérobie, comme le fractionné dehors. Le 4 × 8 minutes est le format qui accumule le plus de temps près de la VO2max pour une pénibilité perçue plus faible.",
    intensity: HARD_INTERVALS,
    technique: [
      "Inclinaison à 1 %.",
      "Règle la vitesse de la série avant de partir et n'y touche plus : le tapis impose la régularité.",
      "Pour récupérer, baisse la vitesse sans descendre de la bande.",
    ],
    mistakes: INTERVAL_TRAPS,
    practical: INDOOR,
  },

  bikeLong: {
    goal: "Le volume aérobie et le temps en selle. C'est la discipline où tu as le plus à gagner, avec 40 km à couvrir le jour de la course.",
    intensity: [
      ...EASY_BIKE,
      "Dans les bosses, allège le braquet et reste assis plutôt que d'appuyer fort : c'est là qu'on sort de la zone facile.",
    ],
    technique: [...BIKE_FORM, "Change de vitesse avant la bosse, pas au milieu."],
    mistakes: [
      "Suivre plus rapide que soi : la sortie devient une séance dure.",
      "Oublier de manger : la fringale arrive vite après une heure et demie de vélo.",
    ],
    practical: [
      "Un bidon par heure environ, davantage s'il fait chaud.",
      "Au-delà de 90 minutes, 30 à 60 g de glucides par heure, dès la première demi-heure.",
      "Chambre à air, démonte-pneus et pompe. Casque toujours.",
    ],
  },

  bikeGym: {
    goal: "Du volume vélo facile, sans météo ni circulation. Tant que tu n'as pas de vélo de route, c'est ta base sur la discipline.",
    intensity: EASY_BIKE,
    technique: BIKE_FORM,
    mistakes: [
      "Monter la résistance pour sentir que ça travaille : ce n'est pas le but de cette séance.",
    ],
    practical: INDOOR,
  },

  bikeGymInt: { ...LOW_CADENCE, practical: INDOOR },

  bikeHT: {
    goal: "Du volume vélo facile à la maison, sans météo ni circulation.",
    intensity: EASY_BIKE,
    technique: BIKE_FORM,
    mistakes: [
      "Monter le braquet pour sentir que ça travaille : ce n'est pas le but de cette séance.",
    ],
    practical: [...INDOOR, "Un tapis sous le vélo protège le sol de la transpiration."],
  },

  bikeHTint: { ...LOW_CADENCE, practical: INDOOR },

  swimTech: {
    goal: "Nager mieux avant de nager plus. Pour un nageur en progression, l'efficacité du mouvement rapporte bien plus que la forme physique : on allonge la nage et on ralentit la fréquence de bras.",
    intensity: [
      "Tout se nage facile, effort ressenti 3 à 4 sur 10.",
      "Sur les 100 m de fin, compte tes mouvements de bras par longueur : l'objectif est d'en faire un peu moins d'une séance à l'autre, à allure égale.",
    ],
    technique: SWIM_FORM,
    drills: SWIM_DRILLS,
    mistakes: [
      "Enchaîner les éducatifs vite : ils ne servent que lents et précis.",
      "Retenir sa respiration sous l'eau : on arrive essoufflé au moment d'inspirer.",
      "Main qui croise devant la tête en entrant dans l'eau : la nage zigzague et l'épaule force.",
    ],
    practical: [
      "Pull-buoy entre les cuisses si les jambes coulent pendant les éducatifs de bras.",
    ],
  },

  swimEnd: {
    goal: "L'endurance à l'allure de seuil, celle que tu tiendrais environ 1 500 m, la distance du triathlon M.",
    intensity: [
      "Tous les 200 m à la même allure, effort ressenti 7 sur 10.",
      "Regarde l'horloge du bassin à chaque 200 m : entre le premier et le dernier, l'écart doit rester sous 5 secondes.",
      "Sans test CSS, prends une allure que tu es sûr de tenir cinq fois, et fais le test dès que possible : c'est lui qui donne les chiffres.",
    ],
    technique: [
      ...SWIM_FORM.slice(0, 3),
      "Garde ta longueur de nage quand la fatigue arrive : la fréquence de bras reste stable au lieu de s'emballer.",
    ],
    mistakes: [
      "Partir vite sur le premier 200 : la série se joue sur le dernier.",
      "Rallonger la récupération quand ça devient dur : les 20 secondes font partie de la séance.",
    ],
    practical: [
      "Une fois toutes les quatre longueurs, lève les yeux devant toi comme en eau libre, regard juste au-dessus de l'eau, puis tourne la tête pour respirer. Le jour de la course, il n'y a pas de ligne au fond.",
    ],
  },
} satisfies Partial<Record<BlockId, SessionGuide>>;

export const SESSION_GUIDES: Partial<Record<BlockId, SessionGuide>> = RAW;
