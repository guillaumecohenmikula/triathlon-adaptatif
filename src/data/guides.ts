/*
 * Fiches d'exécution des exercices de renfo : ce qu'un coach dirait à côté de toi.
 *
 * Le contenu suit les consignes techniques classiques des manuels de préparation physique
 * (NSCA, ACSM) et reste cohérent avec les prescriptions de `exercises.ts`. Les « pourquoi »
 * reprennent les conclusions de `docs/bases-scientifiques.md`, sans en rajouter.
 */

export interface ExerciseGuide {
  /** Nom du mouvement, affiché quand un exercice en regroupe deux. */
  name: string;
  muscles: string;
  /** Ce que l'exercice apporte à un triathlète. */
  why: string;
  /** Mise en place, avant la première répétition. */
  setup: string[];
  /** Le mouvement, étape par étape. */
  steps: string[];
  breathing: string;
  /** Erreurs fréquentes, chacune avec sa correction. */
  mistakes: string[];
  easier: string;
  harder: string;
}

const RAW = {
  backSquat: {
    name: "Squat",
    muscles: "Quadriceps, fessiers, adducteurs, tronc en gainage",
    why: "Le mouvement de force de référence pour le bas du corps. Chargé lourd, il améliore l'économie de course sans prise de masse : c'est ce type de travail qui transfère le mieux vers l'endurance dans les études.",
    setup: [
      "Barre posée sur le haut du dos, sur les trapèzes et pas sur la nuque. Mains un peu plus larges que les épaules, coudes tirés vers le bas.",
      "Pieds largeur d'épaules ou un peu plus, pointes légèrement ouvertes.",
      "Sors du rack en deux pas au maximum. Inspire et serre les abdos comme pour encaisser un coup.",
    ],
    steps: [
      "Descends en 3 secondes en poussant les fesses en arrière et en pliant les genoux en même temps.",
      "Genoux dans l'axe des pointes de pieds : ils peuvent dépasser les orteils, ils ne doivent pas rentrer vers l'intérieur.",
      "Descends au moins jusqu'à ce que le haut des cuisses soit parallèle au sol, dos plat et poitrine haute.",
      "Remonte en poussant le sol avec tout le pied, talons collés. Hanches et épaules montent à la même vitesse.",
    ],
    breathing: "Grande inspiration bloquée avant de descendre, garde l'air jusqu'au passage le plus dur de la remontée, puis expire. Reprends ton air et ton gainage en haut avant chaque répétition.",
    mistakes: [
      "Genoux qui rentrent en remontant : pense à écarter le sol avec les pieds.",
      "Talons qui décollent : descends moins bas pour l'instant, ou cale les talons sur des disques de 2,5 kg le temps de gagner en mobilité de cheville.",
      "Dos qui s'arrondit en bas : arrête la descente juste avant, et baisse la charge.",
      "Fesses qui montent avant les épaules : la charge est trop lourde ou le gainage lâche.",
    ],
    easier: "Goblet squat : un haltère tenu contre la poitrine. Même mouvement, plus facile à apprendre, et le dos est protégé.",
    harder: "Pause de 2 secondes en bas de chaque répétition, sans rebond.",
  },

  pullup: {
    name: "Tractions",
    muscles: "Grand dorsal, biceps, rhomboïdes, avant-bras",
    why: "Le grand dorsal est le moteur de la traction en crawl. Des tractions solides donnent de la puissance à la nage et équilibrent les épaules face au travail de poussée.",
    setup: [
      "Mains en pronation, paumes vers l'avant, un peu plus larges que les épaules.",
      "Suspends-toi bras tendus, jambes serrées légèrement devant toi, abdos gainés.",
    ],
    steps: [
      "Avant de plier les bras, abaisse les épaules loin des oreilles : le corps monte de quelques centimètres.",
      "Tire les coudes vers les hanches, poitrine vers la barre.",
      "Monte jusqu'à ce que le menton passe la barre, sans tendre le cou.",
      "Redescends en 2 à 3 secondes jusqu'aux bras tendus, épaules toujours actives.",
    ],
    breathing: "Expire en montant, inspire en redescendant.",
    mistakes: [
      "Balancer les jambes pour prendre de l'élan : croise les chevilles et gaine le ventre.",
      "Demi-répétitions : chaque répétition part des bras tendus. Si tu n'y arrives plus, la série est finie.",
      "Épaules qui montent vers les oreilles en bas du mouvement : le dos a lâché, c'est là que l'épaule souffre.",
    ],
    easier: "Élastique d'aide passé sous les genoux ou les pieds. Choisis celui qui te laisse faire toutes les répétitions prévues avec 1 ou 2 en réserve.",
    harder: "Lest à la ceinture ou haltère coincé entre les pieds, dès que 6 répétitions propres passent.",
  },

  latPulldown: {
    name: "Tirage vertical à la poulie",
    muscles: "Grand dorsal, biceps, rhomboïdes",
    why: "L'alternative aux tractions tant que tu n'en enchaînes pas assez : même geste, charge réglable au kilo près.",
    setup: [
      "Règle le boudin pour bloquer les cuisses, pieds à plat.",
      "Prise en pronation un peu plus large que les épaules, buste très légèrement incliné en arrière.",
    ],
    steps: [
      "Abaisse d'abord les épaules, sans plier les bras.",
      "Tire la barre vers le haut de la poitrine en amenant les coudes vers le bas et l'arrière.",
      "Marque un temps quand la barre touche la poitrine, omoplates serrées.",
      "Remonte en contrôlant jusqu'aux bras tendus.",
    ],
    breathing: "Expire en tirant, inspire en remontant.",
    mistakes: [
      "Se jeter en arrière pour tirer avec le poids du corps : le buste reste fixe.",
      "Tirer la barre derrière la nuque : inutile et risqué pour l'épaule.",
      "Tirer avec les mains : pense coudes vers les poches.",
    ],
    easier: "Poignée triangle, paumes face à face : plus confortable pour les épaules.",
    harder: "Descente en 4 secondes, ou passage aux tractions avec élastique.",
  },

  squatJump: {
    name: "Squat jump",
    muscles: "Quadriceps, fessiers, mollets, en explosivité",
    why: "La pliométrie apprend aux tendons à restituer l'énergie comme un ressort. Associée à la charge lourde, c'est la combinaison qui améliore le plus l'économie de course dans les études.",
    setup: [
      "Pieds largeur de hanches, sur un sol qui amortit un peu : tapis de salle, parquet, herbe. Pas de béton.",
      "Échauffement terminé : on ne saute jamais à froid.",
    ],
    steps: [
      "Descends vite en quart de squat, bras qui partent en arrière.",
      "Enchaîne sans pause : pousse le sol le plus fort possible et lance les bras vers le haut.",
      "En l'air, corps gainé, pointes de pieds tendues.",
      "Réception sur l'avant du pied puis tout le pied, genoux souples et dans l'axe, sans bruit.",
      "Repars aussitôt : le contact au sol doit être court.",
    ],
    breathing: "Expire en poussant, inspire à la réception.",
    mistakes: [
      "Réception bruyante ou jambes raides : c'est la fatigue, arrête la série.",
      "Genoux qui rentrent à la réception : saute moins haut et concentre-toi sur l'axe.",
      "Enchaîner coûte que coûte : la pliométrie ne sert que si chaque saut est explosif. Mieux vaut 6 bons sauts que 10 moyens.",
    ],
    easier: "Un saut, réception tenue 2 secondes, puis le suivant. Moins d'impact, et on apprend à se réceptionner.",
    harder: "Sauts sur une box de 40 à 50 cm : même poussée, sans l'impact de la descente.",
  },

  bounds: {
    name: "Bondissements",
    muscles: "Mollets, fessiers, ischios, tendon d'Achille",
    why: "C'est la foulée de course amplifiée : on travaille la raideur utile de la cheville et la poussée vers l'avant, exactement ce qui sert en course.",
    setup: [
      "Une ligne droite de 20 à 30 m, sur piste, herbe ou sol souple.",
      "Quelques accélérations avant la première série.",
    ],
    steps: [
      "Pars en petite foulée, puis pousse fort sur une jambe pour projeter le corps loin devant.",
      "Genou avant qui monte, bras opposé lancé vers l'avant comme en sprint.",
      "Atterris sur l'avant du pied, sous le bassin, et repars aussitôt sur l'autre jambe.",
      "Compte 10 appuis, puis reviens en marchant : c'est ta récupération.",
    ],
    breathing: "Libre, calée sur les appuis.",
    mistakes: [
      "Poser le talon loin devant le corps : ça freine et ça tape. Le pied se pose sous toi.",
      "Chercher la hauteur : l'objectif est d'aller loin, pas haut.",
      "Continuer quand les appuis s'alourdissent : la série est finie.",
    ],
    easier: "Montées de genoux dynamiques, ou foulées bondissantes courtes.",
    harder: "Bondissements en légère montée, ou cloche-pied, 5 appuis par jambe.",
  },

  benchPress: {
    name: "Développé couché",
    muscles: "Pectoraux, triceps, avant des épaules",
    why: "Il équilibre le haut du corps et rend les épaules plus solides. Pour le physique, c'est l'exercice qui construit le plus efficacement les pectoraux.",
    setup: [
      "Allongé sur le banc, yeux sous la barre, pieds à plat au sol.",
      "Serre les omoplates et abaisse-les, comme pour les ranger dans les poches arrière : le haut du dos est plaqué, le bas du dos garde sa cambrure naturelle.",
      "Mains un peu plus larges que les épaules, poignets droits au-dessus des coudes.",
    ],
    steps: [
      "Décroche la barre et amène-la au-dessus des épaules, bras tendus.",
      "Descends en 2 à 3 secondes vers le bas des pectoraux, coudes à environ 45° du corps.",
      "Touche légèrement la poitrine, sans rebond.",
      "Pousse vers le haut et un peu vers l'arrière jusqu'aux bras tendus, omoplates toujours serrées.",
    ],
    breathing: "Inspire en descendant, bloque au passage bas, expire en poussant.",
    mistakes: [
      "Coudes écartés à 90° : l'épaule prend tout. Ramène-les vers 45°.",
      "Fesses qui décollent du banc : baisse la charge.",
      "Omoplates qui se relâchent en fin de série : c'est ce qui abîme l'épaule.",
      "Charger lourd seul : demande une parade ou règle les sécurités du rack.",
    ],
    easier: "Haltères au lieu de la barre : plus facile à sécuriser, amplitude libre.",
    harder: "Pause de 1 seconde sur la poitrine à chaque répétition.",
  },

  militaryPress: {
    name: "Développé militaire",
    muscles: "Épaules, triceps, haut du dos, tronc",
    why: "Des épaules fortes dans toute leur amplitude encaissent mieux la nage. Debout, il travaille aussi le gainage.",
    setup: [
      "Debout, pieds largeur de hanches, barre en appui sur le haut de la poitrine.",
      "Mains juste plus larges que les épaules, coudes légèrement devant la barre.",
      "Serre fessiers et abdos : le bassin ne bouge pas de la série.",
    ],
    steps: [
      "Recule légèrement la tête pour laisser passer la barre.",
      "Pousse la barre à la verticale.",
      "Dès qu'elle passe le front, avance la tête dessous : bras tendus, barre au-dessus du milieu des pieds.",
      "Redescends en contrôlant jusqu'au haut de la poitrine.",
    ],
    breathing: "Inspire et gaine avant de pousser, expire une fois la barre en haut.",
    mistakes: [
      "Se cambrer pour pousser : le bas du dos compense. Serre davantage les fessiers ou baisse la charge.",
      "Pousser la barre en avant : elle monte près du visage.",
    ],
    easier: "Assis sur un banc à dossier vertical, avec des haltères.",
    harder: "Un bras à la fois avec un haltère : le tronc doit résister à la bascule.",
  },

  rdl: {
    name: "Soulevé de terre roumain",
    muscles: "Ischio-jambiers, fessiers, lombaires en gainage",
    why: "Les ischios et les fessiers propulsent la foulée et freinent chaque réception. Des ischios forts réduisent le risque de claquage, la blessure musculaire la plus fréquente en course.",
    setup: [
      "Debout, pieds largeur de hanches, barre ou haltères contre les cuisses.",
      "Genoux légèrement fléchis : ils le resteront du début à la fin.",
      "Omoplates serrées, regard vers le sol à deux mètres devant toi.",
    ],
    steps: [
      "Recule les fesses comme pour fermer une porte derrière toi : le buste s'incline et la barre glisse le long des cuisses.",
      "Descends jusqu'à sentir un étirement franc à l'arrière des cuisses, en général juste sous les genoux.",
      "Dos plat tout du long : dès qu'il commence à s'arrondir, tu as trouvé ton amplitude.",
      "Remonte en poussant les hanches vers l'avant et en serrant les fessiers, sans te cambrer en haut.",
    ],
    breathing: "Inspire et gaine en haut, garde l'air en descendant, expire en fin de remontée.",
    mistakes: [
      "Barre qui s'éloigne des jambes : le dos prend la charge. Elle frôle les cuisses.",
      "Genoux qui plient de plus en plus : ça devient un squat. L'angle reste fixe.",
      "Aller chercher le sol en arrondissant le dos : l'amplitude s'arrête là où le dos reste plat.",
    ],
    easier: "Haltères légers, descente jusqu'aux genoux, le temps de sentir le mouvement de hanche.",
    harder: "Sur une jambe avec un haltère : excellent pour la stabilité de hanche du coureur.",
  },

  dbRow: {
    name: "Rowing haltère",
    muscles: "Grand dorsal, rhomboïdes, trapèzes, biceps",
    why: "Le tirage horizontal épaissit le dos et stabilise les omoplates, sollicitées à chaque mouvement de bras en crawl.",
    setup: [
      "Genou et main du même côté posés sur un banc, dos plat parallèle au sol.",
      "L'autre pied au sol, haltère dans la main libre, bras tendu sous l'épaule.",
    ],
    steps: [
      "Tire l'haltère vers la hanche, coude qui longe le corps.",
      "En haut, omoplate serrée vers la colonne, marque 1 seconde.",
      "Redescends lentement jusqu'au bras tendu, en laissant l'omoplate s'écarter.",
    ],
    breathing: "Expire en tirant, inspire en redescendant.",
    mistakes: [
      "Tourner le buste pour lever l'haltère : les épaules restent parallèles au sol.",
      "Tirer vers la poitrine : vise la hanche, c'est là que le dos travaille.",
      "Donner de l'élan : si tu dois lancer l'haltère, il est trop lourd.",
    ],
    easier: "Rowing assis à la poulie basse, buste droit.",
    harder: "Descente en 3 secondes, ou sans appui, buste penché à 45°, deux haltères.",
  },

  lateralRaise: {
    name: "Élévations latérales",
    muscles: "Deltoïde moyen",
    why: "Il donne la largeur d'épaules. Léger et contrôlé, il complète la stabilité de l'épaule sans la fatiguer.",
    setup: [
      "Debout, haltères légers le long du corps, coudes légèrement fléchis : cet angle ne change pas.",
      "Buste très légèrement penché en avant.",
    ],
    steps: [
      "Monte les bras sur les côtés en menant avec les coudes, jusqu'à hauteur d'épaules.",
      "Redescends en 2 à 3 secondes.",
    ],
    breathing: "Expire en montant, inspire en descendant.",
    mistakes: [
      "Monter au-dessus des épaules en haussant les trapèzes : arrête à l'horizontale.",
      "Balancer le buste : prends plus léger, cet exercice se fait lentement.",
    ],
    easier: "Un bras à la fois, main libre en appui.",
    harder: "Pause de 2 secondes en haut, ou à la poulie basse pour une tension constante.",
  },

  externalRotation: {
    name: "Rotation externe à l'élastique",
    muscles: "Coiffe des rotateurs : infra-épineux et petit rond",
    why: "Ces petits muscles tiennent la tête de l'humérus en place. En natation ils sont souvent faibles face aux rotateurs internes : c'est l'exercice de prévention de l'épaule du nageur le plus recommandé.",
    setup: [
      "Élastique fixé à hauteur de coude, tu te places de profil.",
      "Coude plié à 90° et collé au flanc. Glisse une serviette roulée entre le coude et les côtes pour ne pas tricher.",
      "Main devant le ventre, élastique légèrement tendu.",
    ],
    steps: [
      "Tourne l'avant-bras vers l'extérieur comme une porte qui s'ouvre, sans décoller le coude.",
      "Va aussi loin que l'épaule tourne sans que le buste pivote.",
      "Reviens lentement, en 3 secondes.",
    ],
    breathing: "Respiration libre et calme.",
    mistakes: [
      "Coude qui s'écarte du corps : la serviette tombe, c'est le signal.",
      "Élastique trop dur : ces muscles se travaillent léger, la brûlure arrive vers la 12e répétition.",
      "Tourner le buste au lieu de l'épaule.",
    ],
    easier: "Allongé sur le côté, avec une bouteille d'eau.",
    harder: "Coude levé à hauteur d'épaule, bras à 90° : position proche du retour de bras en crawl.",
  },

  plank: {
    name: "Planche",
    muscles: "Grand droit, transverse, obliques, fessiers",
    why: "Le gainage apprend à garder le bassin stable quand les jambes travaillent. Son effet sur la performance est modeste, c'est pour ça qu'il passe après les exercices lourds.",
    setup: ["Avant-bras au sol, coudes sous les épaules, pieds joints ou largeur de hanches."],
    steps: [
      "Décolle le corps : une ligne droite des talons à la tête.",
      "Serre les fessiers et rentre légèrement le bas du ventre.",
      "Pousse le sol avec les avant-bras pour écarter les omoplates.",
      "Regard vers le sol entre les mains, nuque dans l'alignement.",
      "Tiens le temps prévu. Si le bassin s'affaisse avant, pose les genoux et termine le temps.",
    ],
    breathing: "Respire normalement, par petites expirations. Bloquer sa respiration raccourcit la série.",
    mistakes: [
      "Bassin qui s'affaisse et creuse le bas du dos : serre davantage les fessiers.",
      "Fesses trop hautes : ça soulage les abdos, redescends dans l'alignement.",
      "Tenir longtemps dans une mauvaise position : 30 secondes parfaites valent mieux qu'une minute affaissée.",
    ],
    easier: "Genoux au sol, ou avant-bras sur un banc.",
    harder: "Lever alternativement un pied de 5 cm pendant 2 secondes.",
  },

  sidePlank: {
    name: "Planche latérale",
    muscles: "Obliques, carré des lombes, moyen fessier",
    why: "Le moyen fessier et les obliques empêchent le bassin de tomber à chaque appui en course : c'est le gainage le plus proche des besoins de la foulée.",
    setup: ["Allongé sur le côté, coude sous l'épaule, jambes tendues, pieds empilés."],
    steps: [
      "Soulève les hanches : ligne droite des pieds à la tête.",
      "Pousse la hanche vers le plafond, sans basculer en avant ni en arrière.",
      "Tiens le temps prévu, puis change de côté.",
    ],
    breathing: "Respiration normale et régulière.",
    mistakes: [
      "Hanche qui descend au fil des secondes : pose le genou du dessous et termine.",
      "Épaule qui s'écrase vers l'oreille : pousse le sol avec l'avant-bras.",
      "Buste qui roule vers l'avant : épaules et hanches dans le même plan.",
    ],
    easier: "Genoux pliés au sol.",
    harder: "Jambe du dessus levée de 20 cm et tenue.",
  },

  pushup: {
    name: "Pompes",
    muscles: "Pectoraux, triceps, épaules, gainage",
    why: "Le meilleur exercice de poussée sans matériel. Il travaille en même temps le gainage et la stabilité des omoplates.",
    setup: [
      "Mains au sol un peu plus larges que les épaules, doigts vers l'avant.",
      "Corps gainé en planche, pieds joints ou légèrement écartés.",
    ],
    steps: [
      "Descends en 2 à 3 secondes, coudes à 45° du corps, jusqu'à ce que la poitrine frôle le sol.",
      "Le corps descend d'un bloc : bassin et épaules à la même vitesse.",
      "Pousse le sol pour remonter jusqu'aux bras tendus.",
      "Sur « maximum moins 2 » : fais autant de répétitions que possible en t'arrêtant 2 avant l'échec.",
    ],
    breathing: "Inspire en descendant, expire en poussant.",
    mistakes: [
      "Bassin qui touche le sol avant la poitrine : le gainage a lâché.",
      "Coudes à 90° en forme de T : l'épaule encaisse. Rapproche-les.",
      "Amplitude partielle : une pompe compte quand la poitrine passe sous le niveau des coudes.",
    ],
    easier: "Mains surélevées sur un banc ou une table : plus c'est haut, plus c'est facile.",
    harder: "Pieds surélevés, sac à dos chargé, ou descente en 4 secondes.",
  },

  bulgarianSplitSquat: {
    name: "Split squat bulgare",
    muscles: "Quadriceps, fessiers, adducteurs, stabilisateurs de hanche",
    why: "Une jambe à la fois, comme en course : il corrige les écarts entre les deux jambes et développe beaucoup de force avec peu de charge, donc aussi chez soi.",
    setup: [
      "Dos à un banc ou une chaise stable, à une grande enjambée.",
      "Dessus du pied arrière posé sur le banc. Pied avant assez loin pour qu'en bas le genou reste au-dessus de la cheville.",
      "Charge : haltères le long du corps en salle, sac à dos chargé à la maison.",
    ],
    steps: [
      "Descends en 3 secondes, buste droit ou très légèrement penché, genou arrière vers le sol.",
      "Arrête quand la cuisse avant est parallèle au sol.",
      "Remonte en poussant par le talon avant. La jambe arrière ne sert que d'appui.",
      "Enchaîne toutes les répétitions d'une jambe, puis change.",
    ],
    breathing: "Inspire en descendant, expire en poussant.",
    mistakes: [
      "Pied avant trop près : le talon décolle. Avance le pied.",
      "Genou avant qui rentre vers l'intérieur.",
      "Pousser avec la jambe arrière : elle reste détendue.",
    ],
    easier: "Fente statique pieds au sol, en tenant un appui.",
    harder: "Charge plus lourde, ou pause de 2 secondes en bas.",
  },

  bandRow: {
    name: "Tirage à l'élastique ou à la serviette",
    muscles: "Rhomboïdes, trapèzes moyens, grand dorsal, biceps",
    why: "Le tirage accessible sans matériel. Il équilibre les pompes et entretient les muscles qui tiennent les omoplates en nage.",
    setup: [
      "Élastique : fixé à hauteur de poitrine à un poteau ou dans une porte. Recule jusqu'à ce qu'il soit tendu bras tendus.",
      "Serviette : enroulée autour d'un poteau solide, une extrémité dans chaque main. Pieds près du poteau, corps incliné en arrière bras tendus. Plus tu es incliné, plus c'est dur.",
    ],
    steps: [
      "Serre d'abord les omoplates, sans plier les bras.",
      "Tire ensuite les coudes vers l'arrière le long du corps.",
      "Marque 1 seconde, poitrine ouverte.",
      "Reviens lentement jusqu'aux bras tendus.",
    ],
    breathing: "Expire en tirant, inspire en revenant.",
    mistakes: [
      "Hausser les épaules en tirant : garde-les basses.",
      "Tirer avec les bras sans bouger les omoplates : l'ordre compte, omoplates d'abord.",
      "Avec la serviette, casser les hanches : le corps reste gainé.",
    ],
    easier: "Élastique plus souple, ou corps plus droit avec la serviette.",
    harder: "Élastique plus résistant, corps plus incliné, ou 2 secondes tenues en fin de tirage.",
  },

  benchDips: {
    name: "Dips sur chaise",
    muscles: "Triceps, pectoraux, avant des épaules",
    why: "Il développe les triceps, qui terminent la poussée sous l'eau en crawl.",
    setup: [
      "Dos à une chaise stable calée contre un mur, mains sur le bord, doigts vers l'avant.",
      "Jambes pliées pieds au sol, ou tendues pour durcir. Fesses juste devant la chaise.",
    ],
    steps: [
      "Descends en pliant les coudes vers l'arrière, pas vers l'extérieur.",
      "Arrête quand les coudes font 90°.",
      "Pousse pour remonter jusqu'aux bras tendus, épaules basses.",
    ],
    breathing: "Inspire en descendant, expire en poussant.",
    mistakes: [
      "Descendre sous 90° : l'avant de l'épaule est en position fragile.",
      "Épaules qui montent vers les oreilles : pousse la chaise vers le bas.",
      "Chaise qui glisse : toujours calée contre un mur.",
      "Gêne à l'avant de l'épaule : remplace par des pompes mains serrées.",
    ],
    easier: "Jambes pliées, pieds proches de la chaise.",
    harder: "Pieds sur une seconde chaise, ou sac à dos sur les cuisses.",
  },

  pikePushup: {
    name: "Pompes piquées",
    muscles: "Épaules, triceps, haut des pectoraux",
    why: "Le développé militaire sans matériel : le corps en V met le poids sur les épaules.",
    setup: [
      "Position de pompe, puis rapproche les pieds des mains pour monter le bassin : le corps forme un V inversé.",
      "Mains largeur d'épaules, jambes aussi tendues que possible.",
    ],
    steps: [
      "Plie les coudes pour amener le sommet de la tête vers le sol, un peu devant les mains.",
      "Coudes vers l'arrière, pas sur les côtés.",
      "Pousse pour remonter jusqu'aux bras tendus, bassin toujours haut.",
    ],
    breathing: "Inspire en descendant, expire en poussant.",
    mistakes: [
      "Bassin qui redescend : ça redevient une pompe classique.",
      "Tête qui arrive entre les mains : vise un point devant elles.",
    ],
    easier: "Mains sur une marche, amplitude réduite.",
    harder: "Pieds surélevés sur une chaise : le corps se rapproche de la verticale.",
  },

  singleLegBridge: {
    name: "Pont fessier sur une jambe",
    muscles: "Fessiers, ischios",
    why: "Le fessier sur une jambe, c'est la stabilité du bassin à chaque appui de course. Un fessier faible se paie souvent aux genoux.",
    setup: [
      "Allongé sur le dos, un pied à plat près des fesses, l'autre jambe tendue en l'air.",
      "Bras au sol le long du corps.",
    ],
    steps: [
      "Pousse dans le talon au sol pour monter le bassin jusqu'à la ligne épaule, hanche, genou.",
      "En haut, serre fort le fessier 2 secondes, bassin bien horizontal.",
      "Redescends lentement sans poser les fesses, et enchaîne.",
    ],
    breathing: "Expire en montant, inspire en descendant.",
    mistakes: [
      "Bassin qui penche du côté de la jambe levée : monte moins haut, hanches au même niveau.",
      "Cambrer le bas du dos en haut : c'est le fessier qui finit le mouvement.",
      "Crampe à l'arrière de la cuisse : rapproche le pied des fesses.",
    ],
    easier: "Pont sur deux jambes.",
    harder: "Pied posé sur une chaise, amplitude plus grande.",
  },

  hipThrust: {
    name: "Hip thrust",
    muscles: "Grand fessier, ischios",
    why: "L'exercice qui charge le plus le grand fessier en extension de hanche, le mouvement de propulsion de la foulée et du coup de pédale.",
    setup: [
      "Haut du dos appuyé sur le bord d'un banc, juste sous les omoplates.",
      "Barre sur le pli des hanches, avec une mousse de protection.",
      "Pieds à plat largeur de hanches, placés pour qu'en haut les tibias soient verticaux.",
    ],
    steps: [
      "Menton légèrement rentré, regard devant toi et pas vers le plafond.",
      "Pousse dans les talons pour monter les hanches jusqu'à ce que le buste soit parallèle au sol.",
      "En haut, serre les fessiers 2 secondes, côtes basses.",
      "Redescends en contrôlant jusqu'à ce que les fesses frôlent le sol.",
    ],
    breathing: "Inspire en bas, gaine, expire en haut pendant la pause.",
    mistakes: [
      "Se cambrer pour monter plus haut : la hanche est tendue quand le buste est à plat.",
      "Pieds trop loin : ce sont les ischios qui travaillent. Rapproche-les.",
      "Genoux qui s'écartent ou se rapprochent : dans l'axe des pieds.",
    ],
    easier: "Pont fessier au sol, haltère sur les hanches.",
    harder: "Une jambe à la fois.",
  },

  legCurl: {
    name: "Leg curl à la machine",
    muscles: "Ischio-jambiers",
    why: "Les ischios freinent la jambe à chaque foulée. Les renforcer protège de la blessure musculaire la plus fréquente chez le coureur.",
    setup: ["Règle la machine : genou aligné avec l'axe de rotation, boudin juste au-dessus des chevilles."],
    steps: [
      "Ramène les talons vers les fesses, bassin plaqué.",
      "Marque 1 seconde en fin de mouvement.",
      "Redescends en 3 secondes : la descente lente est la phase qui renforce le mieux.",
    ],
    breathing: "Expire en pliant, inspire en revenant.",
    mistakes: [
      "Bassin qui décolle pour aider : baisse la charge.",
      "Laisser retomber la charge : la descente est le cœur de l'exercice.",
    ],
    easier: "Charge plus légère, amplitude complète.",
    harder: "Une jambe à la fois, ou passage au nordic curl.",
  },

  nordicCurl: {
    name: "Nordic curl",
    muscles: "Ischio-jambiers, en freinage",
    why: "L'exercice le plus étudié en prévention des blessures des ischios : les programmes qui l'incluent réduisent ce risque d'environ moitié chez les sportifs.",
    setup: [
      "À genoux sur un tapis épais, chevilles bloquées sous une barre, un meuble lourd, ou tenues par quelqu'un.",
      "Buste droit, hanches tendues, mains devant la poitrine prêtes à amortir.",
    ],
    steps: [
      "Bascule lentement vers l'avant d'un bloc, genoux, hanches et épaules alignés.",
      "Résiste le plus longtemps possible avec l'arrière des cuisses.",
      "Quand tu ne peux plus retenir, réceptionne-toi sur les mains en pompe.",
      "Repousse avec les mains pour revenir à genoux.",
    ],
    breathing: "Inspire avant de basculer, expire lentement pendant la descente.",
    mistakes: [
      "Casser les hanches en arrière : les ischios ne travaillent plus.",
      "Tomber vite : l'intérêt est la lenteur, même sur 20 cm.",
      "En faire trop la première fois : les courbatures sont fortes. Commence par 2 séries de 4.",
    ],
    easier: "Amplitude partielle, ou élastique fixé devant et passé sous les aisselles.",
    harder: "Descente plus lente, bras croisés sur la poitrine.",
  },

  calfRaise: {
    name: "Mollets",
    muscles: "Gastrocnémiens, soléaire, tendon d'Achille",
    why: "Mollet et soléaire encaissent plusieurs fois le poids du corps à chaque foulée. Leur force conditionne la poussée, et les renforcer protège le tendon d'Achille.",
    setup: [
      "Avant des pieds sur une marche ou un disque, talons dans le vide.",
      "En salle : machine ou haltère dans une main, l'autre main en appui. À la maison : sur une jambe, main contre le mur.",
    ],
    steps: [
      "Descends lentement les talons sous le niveau de la marche, jusqu'à l'étirement complet.",
      "Monte le plus haut possible sur la pointe, poussée par le gros orteil.",
      "Tiens 1 seconde en haut.",
      "Redescends en 2 à 3 secondes.",
    ],
    breathing: "Respiration libre et régulière.",
    mistakes: [
      "Rebondir en bas : le tendon encaisse sans contrôle.",
      "Amplitude courte : la moitié du bénéfice se joue en bas du mouvement.",
      "Chevilles qui partent vers l'extérieur : pousse par le gros orteil.",
    ],
    easier: "Deux pieds au sol, sans marche.",
    harder: "Sur une jambe avec charge, ou genou fléchi à 30° pour cibler le soléaire.",
  },

  straightArmPulldown: {
    name: "Tirage bras tendus",
    muscles: "Grand dorsal, grand rond",
    why: "Le geste le plus proche de la traction sous l'eau en crawl : le bras tendu qui ramène l'eau vers la hanche.",
    setup: [
      "Face à la poulie haute avec une barre droite ou une corde, ou un élastique fixé en hauteur.",
      "Recule d'un pas, buste penché en avant d'environ 30°, bras tendus devant, coudes à peine fléchis.",
    ],
    steps: [
      "Abaisse d'abord les épaules.",
      "Descends la barre en arc de cercle jusqu'aux cuisses, bras tendus.",
      "Serre le dos 1 seconde en bas.",
      "Remonte lentement jusqu'à hauteur des yeux.",
    ],
    breathing: "Expire en tirant, inspire en remontant.",
    mistakes: [
      "Plier les coudes : ça devient un tirage des bras. Les coudes restent fixes.",
      "Bouger le buste pour aider : seuls les bras bougent.",
    ],
    easier: "Élastique léger.",
    harder: "Pause de 2 secondes en bas, ou un bras à la fois.",
  },

  dips: {
    name: "Dips aux barres parallèles",
    muscles: "Pectoraux, triceps, avant des épaules",
    why: "Une poussée complète et exigeante, le complément naturel des tractions.",
    setup: ["Mains sur les barres, bras tendus, épaules basses, corps légèrement penché en avant."],
    steps: [
      "Descends en pliant les coudes vers l'arrière, jusqu'à 90°.",
      "Remonte en poussant jusqu'aux bras tendus.",
    ],
    breathing: "Inspire en descendant, expire en poussant.",
    mistakes: [
      "Descendre sous 90° : l'avant de l'épaule est en position fragile.",
      "Épaules qui remontent vers les oreilles : pousse les barres vers le sol.",
      "Gêne à l'avant de l'épaule : prends l'option pompes lestées.",
    ],
    easier: "Machine de dips assistée, ou élastique d'aide.",
    harder: "Ceinture lestée.",
  },

  stepUp: {
    name: "Montées sur chaise",
    muscles: "Quadriceps, fessiers",
    why: "Une poussée sur une jambe, proche de la montée de côte ou du coup de pédale en danseuse.",
    setup: [
      "Chaise stable ou marche solide, calée contre un mur. Hauteur idéale : genou à 90° pied posé dessus.",
      "Pied entier posé sur la chaise.",
    ],
    steps: [
      "Penche légèrement le buste en avant et pousse dans le talon posé sur la chaise.",
      "Monte jusqu'à la jambe tendue. L'autre pied reste en l'air à côté, sans se poser.",
      "Redescends lentement, jambe d'appui toujours active.",
      "Enchaîne toutes les répétitions d'une jambe.",
    ],
    breathing: "Expire en montant, inspire en descendant.",
    mistakes: [
      "Pousser avec la jambe restée au sol : elle décolle, c'est tout.",
      "Genou qui rentre vers l'intérieur en montant.",
      "Redescendre en chute : c'est la moitié du travail.",
    ],
    easier: "Marche plus basse.",
    harder: "Sac à dos chargé, ou marche plus haute.",
  },

  walkingLunge: {
    name: "Fentes marchées",
    muscles: "Quadriceps, fessiers, adducteurs",
    why: "Force et équilibre sur une jambe en mouvement, avec un gros travail du fessier de la jambe avant.",
    setup: ["Un espace de 8 à 10 m. Sac à dos chargé si prévu."],
    steps: [
      "Fais un grand pas en avant.",
      "Descends le genou arrière vers le sol sans le poser, buste droit.",
      "Pousse dans le talon avant pour te relever en ramenant la jambe arrière directement dans le pas suivant.",
    ],
    breathing: "Inspire en descendant, expire en poussant.",
    mistakes: [
      "Pas trop court : le talon avant décolle.",
      "Buste qui s'effondre vers l'avant : regard devant, poitrine haute.",
      "Pieds sur une même ligne : garde l'écartement des hanches.",
    ],
    easier: "Fentes arrière sur place, plus stables.",
    harder: "Sac plus lourd, ou 1 seconde tenue genou en bas.",
  },

  superman: {
    name: "Superman",
    muscles: "Érecteurs du rachis, fessiers, arrière des épaules",
    why: "Il renforce la chaîne arrière qui tient la position allongée en nage.",
    setup: ["Allongé sur le ventre, bras tendus devant, jambes tendues, front vers le sol."],
    steps: [
      "Serre les fessiers.",
      "Décolle en même temps bras, poitrine et jambes de quelques centimètres.",
      "Tiens 2 secondes, regard toujours vers le sol.",
      "Redescends lentement.",
    ],
    breathing: "Expire en montant, inspire en redescendant.",
    mistakes: [
      "Relever la tête pour regarder devant : la nuque se casse.",
      "Monter le plus haut possible : quelques centimètres suffisent.",
    ],
    easier: "Bras et jambe opposés seulement, en alternance.",
    harder: "Tenue de 3 à 5 secondes.",
  },

  dynamicCore: {
    name: "Gainage dynamique",
    muscles: "Abdominaux, obliques, épaules, fléchisseurs de hanche",
    why: "Garder le bassin stable pendant que les membres bougent : c'est ce que la course et la nage demandent au tronc.",
    setup: ["Position de pompe, mains sous les épaules, corps aligné."],
    steps: [
      "Mountain climbers : ramène un genou vers la poitrine puis l'autre, rythme régulier, fesses basses.",
      "Touches d'épaule : pieds un peu plus écartés, touche l'épaule opposée avec une main, repose, puis l'autre.",
      "Dans les deux cas, le bassin ne tourne pas et ne monte pas.",
      "Un aller-retour des deux côtés compte pour une répétition.",
    ],
    breathing: "Respiration continue, sans bloquer.",
    mistakes: [
      "Fesses qui montent pour aller plus vite : ralentis.",
      "Bassin qui se balance sur les touches d'épaule : écarte les pieds.",
    ],
    easier: "Mains sur un banc, rythme lent.",
    harder: "Rythme plus rapide en gardant le bassin fixe, ou pieds joints sur les touches d'épaule.",
  },

  deadBug: {
    name: "Dead bug",
    muscles: "Transverse, grand droit, contrôle du bassin",
    why: "Il apprend à bouger bras et jambes sans que le bas du dos se cambre : la stabilité qui manque souvent en fin de course.",
    setup: [
      "Allongé sur le dos, bras tendus vers le plafond, hanches et genoux pliés à 90°.",
      "Plaque le bas du dos au sol : ta main ne doit pas passer dessous.",
    ],
    steps: [
      "Descends lentement le bras droit derrière la tête et la jambe gauche vers le sol, en 3 secondes.",
      "Arrête juste avant que le bas du dos décolle.",
      "Reviens au centre, puis change de côté.",
    ],
    breathing: "Expire longuement pendant que bras et jambe s'éloignent.",
    mistakes: [
      "Bas du dos qui se creuse : réduis l'amplitude.",
      "Aller vite : l'exercice n'a d'intérêt que lent.",
    ],
    easier: "Seulement les jambes, bras restés au plafond.",
    harder: "Bras et jambe tendus, ou un haltère léger dans les mains.",
  },

  gluteBridge: {
    name: "Pont fessier",
    muscles: "Fessiers, ischios",
    why: "Réveiller et renforcer des fessiers souvent peu actifs quand on passe la journée assis.",
    setup: ["Sur le dos, pieds à plat largeur de hanches, talons à une main des fesses."],
    steps: [
      "Pousse dans les talons pour monter les hanches jusqu'à la ligne épaules, hanches, genoux.",
      "Serre les fessiers 2 secondes en haut.",
      "Redescends lentement.",
    ],
    breathing: "Expire en montant, inspire en descendant.",
    mistakes: [
      "Se cambrer en haut au lieu de serrer les fessiers.",
      "Pousser sur la pointe des pieds : ce sont les talons qui poussent.",
    ],
    easier: "Amplitude réduite.",
    harder: "Une jambe à la fois.",
  },

  backExtension: {
    name: "Extensions lombaires",
    muscles: "Érecteurs du rachis, fessiers",
    why: "Des lombaires endurants tiennent la position sur le vélo et en fin de course.",
    setup: ["Allongé sur le ventre, mains derrière les oreilles ou bras le long du corps, pieds calés sous un meuble si besoin."],
    steps: [
      "Serre les fessiers.",
      "Décolle la poitrine de quelques centimètres, regard vers le sol.",
      "Tiens 1 à 2 secondes, redescends lentement.",
    ],
    breathing: "Expire en montant, inspire en descendant.",
    mistakes: [
      "Chercher l'amplitude en se cambrant fort : l'exercice doit rester confortable.",
      "Douleur lombaire : arrête et remplace par le superman bras le long du corps.",
    ],
    easier: "Bras le long du corps.",
    harder: "Tenue de 3 secondes en haut.",
  },

  barbellRow: {
    name: "Tirage horizontal à la barre",
    muscles: "Grand dorsal, rhomboïdes, trapèzes moyens, biceps",
    why: "Le tirage horizontal épaissit le dos et stabilise les omoplates, celles qui encaissent chaque mouvement de bras en crawl.",
    setup: [
      "Barre au sol devant toi, pieds largeur de hanches.",
      "Genoux légèrement fléchis, buste penché vers 45°, dos plat.",
      "Prise en pronation, un peu plus large que les épaules.",
    ],
    steps: [
      "Serre d'abord les omoplates, sans plier les bras.",
      "Tire la barre vers le ventre, coudes le long du corps.",
      "Marque un temps quand la barre touche le ventre.",
      "Redescends en contrôlant jusqu'aux bras tendus, sans laisser le dos s'arrondir.",
    ],
    breathing: "Inspire en bas, expire en tirant.",
    mistakes: [
      "Se redresser à chaque répétition pour aider : le buste reste fixe.",
      "Dos qui s'arrondit : c'est le signal d'arrêter la série et de baisser la charge.",
      "Tirer vers la poitrine : vise le ventre, c'est là que le dos travaille.",
    ],
    easier: "Rowing haltère, un bras à la fois, genou et main en appui sur un banc : le dos est soutenu.",
    harder: "Pause de 2 secondes barre au ventre, ou descente en 3 secondes.",
  },

  bicepsCurl: {
    name: "Curl haltères",
    muscles: "Biceps, brachial, avant-bras",
    why: "Du volume pour le haut du corps, ton objectif secondaire assumé. En triathlon le biceps ne limite rien : il passe donc en fin de séance.",
    setup: [
      "Debout, pieds largeur de hanches, un haltère dans chaque main, bras le long du corps.",
      "Coudes collés aux côtes, épaules basses.",
    ],
    steps: [
      "Plie les coudes pour monter les haltères vers les épaules.",
      "Les coudes n'avancent ni ne reculent : seul l'avant-bras bouge.",
      "Redescends en 2 à 3 secondes, jusqu'aux bras tendus.",
    ],
    breathing: "Expire en montant, inspire en descendant.",
    mistakes: [
      "Balancer le buste pour lancer la charge : prends plus léger.",
      "S'arrêter à mi-course en descendant : l'amplitude complète fait le travail.",
    ],
    easier: "Assis sur un banc à dossier : impossible de tricher avec le buste.",
    harder: "Un bras à la fois, ou pause de 2 secondes en haut.",
  },
} satisfies Record<string, ExerciseGuide>;

export type GuideId = keyof typeof RAW;

export const GUIDES: Record<GuideId, ExerciseGuide> = RAW;

/**
 * Fiches de chaque exercice du programme, par nom. Un exercice qui laisse le choix
 * (« tractions ou tirage ») ou qui en enchaîne deux a une fiche par mouvement.
 */
export const GUIDES_FOR: Record<string, GuideId[]> = {
  Squat: ["backSquat"],
  "Développé couché": ["benchPress"],
  "Tirage horizontal à la barre": ["barbellRow"],
  Dips: ["dips"],
  "Curl haltères": ["bicepsCurl"],
  "Tractions ou tirage vertical": ["pullup", "latPulldown"],
  "Sauts : squat jump puis bondissements": ["squatJump", "bounds"],
  "Développé couché ou militaire": ["benchPress", "militaryPress"],
  "Développé militaire": ["militaryPress"],
  "Soulevé de terre roumain": ["rdl"],
  "Rowing haltère": ["dbRow"],
  "Élévations latérales et rotateurs externes": ["lateralRaise", "externalRotation"],
  "Rotateurs externes à l'élastique": ["externalRotation"],
  "Gainage : planche et planche latérale": ["plank", "sidePlank"],
  "Gainage : planche puis planche latérale": ["plank", "sidePlank"],
  "Gainage : planche latérale et gainage dynamique": ["sidePlank", "dynamicCore"],
  "Gainage : planche latérale et dynamique": ["sidePlank", "dynamicCore"],
  Pompes: ["pushup"],
  "Dips ou pompes lestées": ["dips", "pushup"],
  "Split squat bulgare": ["bulgarianSplitSquat"],
  "Split squat bulgare sur chaise": ["bulgarianSplitSquat"],
  "Squats sautés": ["squatJump"],
  "Tirage serviette ou élastique": ["bandRow"],
  "Tirage bras tendus": ["straightArmPulldown"],
  "Dips sur chaise": ["benchDips"],
  "Pompes piquées": ["pikePushup"],
  "Pont fessier unilatéral": ["singleLegBridge"],
  "Pont fessier": ["gluteBridge"],
  "Hip thrust": ["hipThrust"],
  "Leg curl ou nordic curl": ["legCurl", "nordicCurl"],
  "Mollets debout": ["calfRaise"],
  "Mollets sur une marche": ["calfRaise"],
  "Montées sur chaise": ["stepUp"],
  "Fentes marchées": ["walkingLunge"],
  "Superman et rotations d'épaules élastique": ["superman", "externalRotation"],
  Planche: ["plank"],
  "Planche latérale": ["sidePlank"],
  "Dead bug": ["deadBug"],
  "Gainage dynamique": ["dynamicCore"],
  "Extensions lombaires": ["backExtension"],
};

export const guidesFor = (exercise: string): ExerciseGuide[] =>
  (GUIDES_FOR[exercise] ?? []).map((id) => GUIDES[id]);

/** Ce qu'il faut savoir avant toute séance de renfo pour doser sans tester son maximum. */
export const LOAD_PRIMER: string[] = [
  "« 2 reps en réserve » : tu t'arrêtes quand tu pourrais encore en faire 2 propres. C'est la consigne qui compte le plus, les pourcentages ne sont qu'un repère.",
  "Pas besoin de tester ton maximum. Une charge soulevée 8 fois avec 2 en réserve tourne autour de 75 % de ton 1RM ; 6 fois avec 1 en réserve, un peu plus de 80 %.",
  "Première fois sur un exercice : commence léger et monte la charge série après série jusqu'à trouver la bonne. Note-la, la semaine suivante part de là.",
  "Si toutes les séries passent avec plus de réserve que prévu, ajoute 2,5 kg la fois suivante, 1 à 2 kg sur les petits exercices.",
  "Une répétition qui se déforme ne compte pas : c'est le signal d'arrêter la série.",
  "Brûlure musculaire, c'est normal. Douleur vive dans une articulation, non : arrête l'exercice et passe à sa version plus facile.",
];
