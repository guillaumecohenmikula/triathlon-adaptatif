# Programme adaptatif

Application d'entraînement triathlon qui se réorganise autour des créneaux réellement
disponibles, au lieu d'imposer un programme figé qu'une semaine réelle finit toujours par casser.

Outil personnel, construit pour une préparation de triathlon M en juin 2027.
Les notes de conception et la feuille de route restent hors du dépôt.

## Démarrer

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # 60 tests sur le moteur
npm run build    # build de production + service worker PWA
```

## Comment c'est organisé

| Dossier | Rôle |
|---|---|
| `src/data/` | Les données du programme : blocs, exercices, phases, échauffements, segments. Aucune logique. |
| `src/engine/` | Le moteur, en **fonctions pures et testées**. C'est la seule partie où une régression est invisible à l'œil nu. |
| `src/store/` | Persistance IndexedDB via Dexie, exposée par trois hooks (réglages, journal, semaine). |
| `src/screens/` | Les quatre écrans : semaine, séance, historique, réglages (plus le plan par période). |
| `src/components/` | Les morceaux réutilisés : navigation, étape de séance, éditeur de créneaux. |

## Le moteur en une phrase

`timing()` déduit la phase de la date de course, `deficits()` mesure le retard des deux
dernières semaines, `buildWeek()` place les blocs dans les créneaux déclarés, et
`selectExos()` remplit les séances de renfo dans le temps qui reste.

`resolveWeek()` fait le lien : la semaine est un objet persistant, généré une fois puis amendé,
ce qui permet d'annuler un jour et de replacer la séance ailleurs sans toucher au passé.

Les règles sont couvertes par les tests de `src/engine/__tests__/`.
**Ne pas les modifier sans arbitrage explicite.**
