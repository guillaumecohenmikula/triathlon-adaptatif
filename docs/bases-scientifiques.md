# Bases scientifiques du contenu des séances

> Revue faite le 2026-09-03 pour décider quoi garder, quoi changer et quoi jeter dans
> `src/data/`. Chaque affirmation renvoie à sa source en fin de document.
>
> **Statut : les points 1, 2, 3 et 5 de la liste finale sont appliqués.** Restent ouverts le
> point 4 (renfo avant endurance dans un créneau partagé) et le point 6 (différencier réellement
> les trois modes).

## Avertissement, à lire avant le reste

Trois limites qui conditionnent tout ce qui suit.

1. **La littérature porte majoritairement sur des athlètes entraînés**, souvent jeunes, avec 5 à
   10 séances par semaine. La transposition à trois créneaux hebdomadaires est un **jugement**,
   pas une déduction. Là où j'extrapole, c'est signalé.
2. **La structure pèse plus que le choix des exercices.** Aucune sélection d'exercices ne rattrape
   une mauvaise répartition d'intensité ou une progression absente. C'est pour ça que ce document
   commence par la structure et finit par les exercices, et pas l'inverse.
3. Je ne suis pas coach. Ce document rassemble et cite, il ne prescrit pas.

---

## 1. La répartition d'intensité, le point le plus structurant

**Ce que dit la littérature.** Le modèle polarisé répartit environ **75 à 80 % du volume en basse
intensité** et **15 à 20 % en haute intensité**, avec très peu de travail au seuil. Une revue
systématique avec méta-analyse (17 études, 437 sujets) conclut à une supériorité du polarisé sur
la VO2peak, mais **uniquement pour les interventions de moins de 12 semaines et les athlètes très
entraînés** ; sur les autres marqueurs de performance, les différentes répartitions se valent [1][2].

**Où l'app s'en écarte.** Le moteur ne connaît pas l'intensité. Un bloc porte `hard: true/false`,
qui sert de quota de séances dures, pas de pilotage de répartition. En phase base, le plan contient
`tempo` (sortie soutenue) et en développement `quality` et les intervalles vélo, sans qu'aucune
règle ne garantisse un ratio. Avec trois créneaux et deux séances dures autorisées, on peut se
retrouver à **40 à 60 % d'intensité élevée**, soit l'inverse de ce que recommande la littérature.

**Conséquence pratique.** C'est le changement le plus important à faire, et il est dans le moteur,
pas dans les données : donner une **zone d'intensité** à chaque bloc (basse / seuil / haute) et
piloter la semaine sur le ratio, plutôt que sur un simple compteur de séances dures.

---

## 2. Course à pied

### Le format d'intervalle qui ressort

Le travail de Seiler comparant **4×4 min, 4×8 min et 4×16 min** à intensité maximale tolérable
conclut que le **4×8 min** donne le meilleur rendement : plus de temps passé au-dessus de 90 % de
la FC max qu'en 4×4, pour une pénibilité perçue plus faible. Les auteurs parlent du meilleur
« gain pour la douleur » [3].

**Contenu actuel** : `quality` = 8 × 400 m à 5'30/km, récupération 1 min. C'est un format court
qui accumule peu de temps près de VO2max. **À remplacer par 4×8 min** (ou 5×4 min en phase base,
plus accessible), à allure « maximale tenable sur la série entière ».

**Contenu actuel** : `tempo` = 2 × 12 min à 5'45/km. Le travail au seuil est précisément la zone
que le modèle polarisé raréfie. À conserver mais **en phase spécifique seulement**, pas en base.

**Contenu actuel** : `longRun` = 70 min à 6'30-6'50, conversation possible. **Conforme**, rien à
changer. C'est le pilier des 75-80 % de basse intensité.

---

## 3. Vélo

Un essai chez des cyclistes bien entraînées montre qu'un programme polarisé dont les intervalles
sont réalisés à **basse cadence (50-70 rpm)** améliore davantage la capacité aérobie que le même
programme à cadence libre (au-dessus de 80 rpm) [4].

**Contenu actuel** : `bikeGymInt` et `bikeHTint` = 5 × 4 min résistance forte à cadence 80.
La logique est bonne, la **cadence est à revoir à la baisse (50-70 rpm)** sur les intervalles, et
le format peut s'aligner sur du 4×8 comme en course.

Le *sweet spot* (juste sous le seuil) est populaire et efficace pour élever la puissance
soutenable, mais rien n'indique qu'il batte une approche polarisée ; il augmente surtout la charge
d'entraînement pour un bénéfice qui ne suit pas proportionnellement [5].

---

## 4. Natation

**Ancrer les séances sur une allure mesurée.** La *Critical Swim Speed* se calcule à partir d'un
test 400 m / 200 m et correspond à l'allure tenable sur environ 1500 m. Les séances de seuil
classiques sont des séries longues à cette allure : 10 × 100 m avec 10 s de récupération,
10 × 200 m avec 20 s [6].

**Contenu actuel** : `swimEnd` = 5 × 200 m « allure régulière », 30 s de récupération. La structure
est juste, mais **« allure régulière » ne veut rien dire tant qu'aucune allure n'a été mesurée**.
Ajouter un test CSS et exprimer les séances en pourcentage de CSS.

**Sur la technique.** Chez le nageur peu expérimenté, la priorité est de **ralentir la fréquence de
bras et d'allonger la nage** avant de chercher la vitesse [7]. Le bloc `swimTech` va dans ce sens,
il est à conserver.

**Sur le renforcement à sec pour la natation.** Il améliore la force maximale du haut du corps mais
**n'améliore pas significativement la performance de nage ni les paramètres techniques** [8]. Pour
un triathlète, la recommandation est de **réduire le volume haut du corps** par rapport à un nageur
pur, les épaules encaissant déjà les trois disciplines, et de **prioriser la stabilité d'épaule**.

---

## 5. Renforcement, l'écart le plus important

### Ce qui marche

Une revue systématique avec méta-analyse sur les coureurs de demi-fond et de fond compare quatre
méthodes [9] :

| Méthode | Protocole | Effet sur la performance |
|---|---|---|
| Charge lourde (≥ 80 % 1RM) | 3-6 séries × 3-10 reps, 1 à 4 fois/sem, 6 à 40 sem | Modéré (ES −0,469) |
| Charge sous-maximale (40-79 %) | 2-5 × 6-20 | Plus faible |
| Pliométrie seule | 2-5 × 4-20 sauts | **Non significatif** |
| **Combiné lourd + pliométrie** | les deux | **Large (ES −1,035)** |

**Aucune de ces méthodes n'améliore la VO2max.** Le gain passe entièrement par l'**économie de
course**, de l'ordre de **2 à 8 %**, obtenu par adaptations neurales sans hypertrophie [10].

La pliométrie seule n'a qu'un effet trivial sur l'économie de course (ES 0,19), **sauf** au-delà de
15 séances, 7 semaines et 2 séances par semaine. **Combinée au renforcement lourd, l'effet devient
large (ES 1,34)** [11].

Les fléchisseurs plantaires (mollets, soléaire) méritent un ciblage spécifique : leur force
conditionne les actions à cycle étirement-détente rapide, c'est-à-dire la foulée [12].

### Ce qui marche moins bien qu'on ne le croit

**Le gainage.** Une revue systématique conclut qu'il améliore nettement l'endurance du tronc et
l'équilibre, mais qu'il a **peu d'effet sur la performance sportive spécifique** [13].

C'est un vrai problème dans l'app : la règle 7 **réserve la place du gainage d'avance** dans chaque
séance de renfo, avant même de placer les exercices prioritaires. On protège donc le contenu dont
le transfert est le plus faible, au détriment de la charge lourde et de la pliométrie qui, elles,
ont un effet démontré.

### Le volume minimal

Une séance par semaine suffit à **maintenir** la force, à condition de conserver l'intensité
relative et d'aller près de l'échec. Pour progresser, il faut plus [14].

### L'ordre et le regroupement des séances

L'effet d'interférence entre force et endurance est **plus marqué quand les deux sont dans la même
séance** que lorsqu'elles sont séparées de 6 à 24 h. Quand elles doivent être dans la même séance,
placer **la force avant l'endurance** favorise les gains de force dynamique du bas du corps [15].

**Où l'app s'en écarte.** La règle 6 empile volontiers un bloc de renfo derrière un bloc de vélo
dans le même créneau, et l'ordre est celui du plan, pas un choix physiologique. À corriger : quand
un créneau contient renfo + endurance, **le renfo passe en premier**.

---

## 6. Le conflit à trancher : chrono contre physique

C'est le point où la science ne tranchera pas à la place de Guil, parce que les deux objectifs
demandent des programmes différents.

| | Pour la performance triathlon | Pour le physique (haut du corps) |
|---|---|---|
| Charge | ≥ 80 % 1RM | 60-80 % 1RM |
| Répétitions | 3 à 6 | 6 à 12 |
| Volume | faible, 1 à 2 séances | **12 à 20 séries par muscle et par semaine** [16] |
| Objectif | économie de course, pas d'hypertrophie | hypertrophie |
| Coût en fatigue | maîtrisé | concurrence directe avec l'endurance |

Les modes existants (`perf` / `mixte` / `physique`) sont le bon endroit pour matérialiser ce
conflit, mais **le contenu actuel ne diffère pas assez entre eux** : le mode change surtout quels
blocs sont proposés, pas les charges ni les plages de répétitions.

Point de réalisme : viser 12 à 20 séries par muscle et par semaine est difficilement compatible
avec trois créneaux dont deux sont pris par l'endurance. Il faudra choisir, ou ajouter des créneaux.

---

## 7. Ce qu'il faut changer, par ordre d'impact

1. **Donner une zone d'intensité aux blocs et piloter le ratio 80/20.** Moteur, pas données.
   C'est le seul changement qui touche la performance globale.
2. **Passer le fractionné course en 4×8 min** au lieu de 8×400 m, et baisser la cadence des
   intervalles vélo à 50-70 rpm.
3. **Refondre le renfo** : charge lourde ≥ 80 % 1RM sur les exercices principaux, ajout d'un bloc
   de pliométrie, gainage rétrogradé (il ne doit plus être réservé d'avance).
4. **Renfo avant endurance** quand les deux partagent un créneau.
5. ~~**Ancrer la natation sur un test CSS** et exprimer les séries en allure CSS.~~ Fait le
   2026-09-07 : test dans les réglages, séances exprimées en allure réelle.
6. **Différencier réellement les trois modes** sur les charges et les répétitions, pas seulement
   sur le choix des blocs.

---

## Sources

1. [Comparison of Polarized Versus Other Types of Endurance Training Intensity Distribution: A Systematic Review with Meta-analysis](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11329428/) — *Sports Medicine*
2. [The Effect of Polarized Training Intensity Distribution on VO2max and Work Economy: A Systematic Review](https://pmc.ncbi.nlm.nih.gov/articles/PMC11679080/)
3. [High Intensity Interval Training and Time at VO2max](https://pezcyclingnews.com/toolbox/high-intensity-interval-training-and-time-at-vo2max/) — synthèse des travaux de Seiler sur 4×4 / 4×8 / 4×16
4. [Greater improvement in aerobic capacity after a polarized training program including cycling interval training at low cadence (50–70 RPM)](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11559993/)
5. [Sweet spot training](https://rouvy.com/blog/sweet-spot-training) — synthèse pratique, niveau de preuve plus faible que les précédentes
6. [How to Train With Critical Swim Speed Intervals](https://www.usms.org/fitness-and-training/articles-and-videos/articles/how-to-train-with-critical-swim-speed-intervals) — U.S. Masters Swimming
7. [Front crawl: how to develop your swim stroke and cadence](https://www.220triathlon.com/training/swim-training/front-crawl-how-to-develop-your-swim-stroke-and-cadence)
8. [Effects of dry-land resistance training on competitive swimmers](https://www.frontiersin.org/journals/physiology/articles/10.3389/fphys.2024.1406518/full) — *Frontiers in Physiology*
9. [The Effect of Strength Training Methods on Middle- and Long-Distance Runners' Athletic Performance: A Systematic Review with Meta-analysis](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11258194/)
10. [Heavy Resistance Training Versus Plyometric Training for Improving Running Economy and Running Time Trial Performance](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9653533/) — *Sports Medicine Open*
11. [Effects of plyometric jump training on running economy in endurance runners: a systematic review and meta-analysis](https://ojs.srce.hr/kinesiology/article/view/24698)
12. [Association between Sprint and Jump Performance and Maximum Strength in Standing Calf Raise or Squat](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11054242/)
13. [Core training and performance: a systematic review with meta-analysis](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10588579/)
14. [The Minimum Effective Training Dose Required to Increase 1RM Strength](https://pubmed.ncbi.nlm.nih.gov/31797219/)
15. [The Role of Intra-Session Exercise Sequence in the Interference Effect: A Systematic Review with Meta-Analysis](https://pmc.ncbi.nlm.nih.gov/articles/PMC5752732/)
16. [The Resistance Training Dose-Response: Meta-Regressions Exploring the Effects of Weekly Volume and Frequency on Hypertrophy and Strength](https://sportrxiv.org/index.php/server/preprint/view/460)
