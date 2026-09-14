# Programme adaptatif

Application d'entraînement triathlon. La semaine se compose à la main dans un catalogue de
séances, où ce qui convient à la phase de préparation passe en premier. Chaque séance se déroule
comme avec un coach : consignes d'exécution, dosage de l'effort, minuteur de repos et chrono des
intervalles. Les séances faites hors programme se notent aussi, et comptent dans le volume.

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
| `src/data/` | Le contenu : blocs de séance, exercices et leurs fiches d'exécution, fiches des séances d'endurance, phases, échauffements, segments. Aucune logique. |
| `src/engine/` | Les calculs, en **fonctions pures et testées** : phase, séances conseillées, retard par discipline, déroulé d'une séance, repos, chrono. |
| `src/store/` | Persistance IndexedDB via Dexie : réglages, journal, semaines, séances extra, pesées. |
| `src/sync/` | Synchronisation Supabase entre appareils, locale d'abord. |
| `src/screens/` | Semaine, catalogue, séance, séance extra, historique, réglages, plan par période. |
| `src/components/` | Pas-à-pas, chrono, fiches coach, sélecteurs, navigation. |

## Les calculs en quelques lignes

`timing()` déduit de la date de course la phase et la position dans le cycle de quatre semaines.
`recommended()` donne les séances de la phase réalisables avec le matériel coché, et `lagging()`
signale les disciplines dont la part du volume réel est nettement sous celle que prévoit la phase.

`buildSteps()` déroule une séance pour la durée choisie : `selectExos()` remplit le renfo, et les
segments d'endurance se partagent la durée sans toucher aux séries d'intervalles. `timeline()` en
tire les phases du chrono, `restSeconds()` le repos entre deux séries.

Rien ne pose de séance à la place de l'utilisateur : c'est un choix, pas un manque.

Les règles sont couvertes par les tests. **Ne pas les modifier sans arbitrage explicite.**
