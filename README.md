# Programme adaptatif

Carnet d'entraînement triathlon. On y compose ses propres séances, on les pose sur la semaine, on
note ce qu'on a réellement fait (charges soulevées, durée, distance, fréquence cardiaque, effort,
au clavier ou en important un fichier .gpx ou .tcx de sa montre),
et l'app mesure : volume et régularité, allures, progression des charges, charge d'entraînement.
Elle conseille rarement, et seulement à partir des chiffres.

Les séances fournies et les fiches d'exécution servent de point de départ : elles se modifient,
se dupliquent et s'archivent comme les autres.

Outil personnel, construit pour une préparation de triathlon M en juin 2027.
Les notes de conception et la feuille de route restent hors du dépôt.

## Démarrer

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # tests des calculs et du contenu
npm run build    # build de production + service worker PWA
```

## Comment c'est organisé

| Dossier | Rôle |
|---|---|
| `src/data/` | Le contenu : bibliothèque fournie (`library.ts`, dérivée des blocs, exercices et segments), fiches d'exécution, fiches de séance. Aucune logique. |
| `src/engine/` | Les calculs, en **fonctions pures et testées** : séance, indicateurs, conseils, repos, chrono, conversion de l'ancien modèle. |
| `src/store/` | Persistance IndexedDB via Dexie : réglages, séances, modèles, mouvements, pesées. |
| `src/sync/` | Synchronisation Supabase entre appareils, locale d'abord. |
| `src/screens/` | Semaine, choix d'une séance, séance, bibliothèque, édition d'un modèle, mesures, réglages. |
| `src/components/` | Pas-à-pas, chrono, fiches, éditeur d'élément, sélecteurs, navigation. |

## Les calculs en quelques lignes

Une séance est une copie autonome : modifier un modèle ne touche pas aux séances déjà posées.
`weekly()`, `paces()` et `movements()` ne mesurent que ce qui a été fait, jamais ce qui était
prévu. `signals()` ne parle que quand l'écart est net : discipline laissée de côté, semaine qui
dépasse nettement les précédentes, sortie longue courue trop vite.

`timeline()` déplie les séries d'intervalles en phases de chrono, `restSeconds()` lit le repos
dans la consigne, et `migrate()` convertit l'ancien modèle en produisant des identifiants
déterministes, pour que deux appareils ne dupliquent pas l'historique.

Rien ne pose de séance à la place de l'utilisateur : c'est un choix, pas un manque.

Les règles sont couvertes par les tests. **Ne pas les modifier sans arbitrage explicite.**
