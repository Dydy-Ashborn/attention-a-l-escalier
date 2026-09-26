# map-donnees — Firestore, banque de questions

## Modèle Firestore
- `games/{code}` : `hostUid, status (lobby|live|fini), duree, maxJoueurs, ids[],
  coquineIdx, live{idx, scores, joues, departages}, bc` — écrit par l'hôte seul.
- `games/{code}/players/{uid}` : `name, color, joinedAt` — écrit par le joueur.
- `games/{code}/guesses/{uid}` : `seq, value (int 0-100)` — **lisible par son auteur et
  l'hôte seulement** : impossible de recopier le pourcentage d'un autre avant la révélation.
- `hosts/{uid}` : `premium` — écriture refusée côté client, webhook Stripe seul.

## Mémoire locale de l'hôte (localStorage)
`escalier.host.games` (10 dernières parties), `escalier.host.used` (questions déjà
jouées : repoussées en fin de tirage), `escalier.premium` (cache), `escalier.name`.

## Banque — js/data/questions.js
**Règle d'or : chaque chiffre vient d'une enquête réelle citée dans `src`.** Aucune
valeur estimée. Champs : `id, pop, q, a, src, note?, t, g, coq?`.
- `g` (groupe) : les variantes femmes/hommes/ensemble d'une même question partagent un
  groupe ; une partie n'en tire qu'une.
- La sélection gratuite est définie explicitement par `DECOUVERTE_IDS` afin de rester
  courte et variée. **Ne jamais renuméroter les ids existants.**
- `node scripts/test-game.mjs` contrôle la banque (champs, valeurs, assez de groupes
  pour une partie d'1 h).

État : 117 questions (97 normales / 79 groupes, 20 coquines).
Sources utilisées : Ifop/Diogène 2020 (hygiène), Ifop/Esteban Frédéric 2022
(superstitions), Crédoc Baromètre du numérique 2025, Santé publique France 2024 (tabac),
Odoxa/Ferrero 2023, Ifop/Lemeilleurcafe 2024, Ifop/Ikea 2025, Odoxa/Facco 2024, Insee 2021,
INJEP 2025, Ipsos/CNL 2025, Ifop/Les-Matelas 2022, Ifop/Journal du Geek 2023,
Ifop/Voyage Avec Nous 2023, Ifop/Online Seduction 2018, Ifop/Gleeden 2025, Ifop/Lelo 2024,
Ifop/JOYclub 2026, Ifop 2019 (chocolatine), Ifop 2020 (nudes), OFDT/EROPP 2023 (jeux
d'argent), Insee 2024 (télétravail), Cint/NordVPN 2022, Ifop/Femme Actuelle 2014 (le lit),
Ifop/Tousaulit 2021, Ifop/Consolab 2019, Ifop/Lacse 2018, Ifop/Darwin Nutrition 2022
(hommes uniquement), Médiamétrie/SELL 2025 (jeux vidéo), Ifop/AMB-USA 2023 (croyances),
Ifop/TF1-Quotidien 2017, Ifop/24matins 2020.

### Pistes pour la suite
Vacances (départs en vacances), avion (jamais pris — chiffres contradictoires entre
sources, écarté pour l'instant), transports (vélo, permis), végétariens, infidélité
masculine (Ifop/Gleeden), lecture par sexe (CNL rapport complet), tatouages (chiffre
postérieur à 2016), sport par sexe (INJEP).

### Écartés volontairement
- Chiffres dont la base est ambiguë dans la source (ex. « lecture quotidienne 45 % » :
  ensemble ou lecteurs ?) — mieux vaut une question de moins qu'une réponse fausse.
- Pratiques sexuelles explicites (Ifop/JOYclub 2026) : la coquine reste coquine, pas crue.
- Religion : sujet clivant pour une soirée.
