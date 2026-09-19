# decisions — Attention à l'escalier

## Format
- **Écran maître + téléphones** (comme Bibi Love), Firestore temps réel, auth anonyme.
- **Arbitrage automatique** : l'app calcule l'écart, le plus proche gagne une marche ;
  égalité d'écart = une marche chacun ; personne n'a répondu = marche vide.
  L'écran maître affiche en clair **qui est le plus proche**, sa valeur et l'écart,
  puis toutes les réponses triées (demande explicite).
- **Une question coquine par partie**, jamais en ouverture ni en dernière question,
  annoncée par un carton dédié. Elle vaut 1 marche comme les autres (`POINTS_COQUINE`).
- **Départage** automatique en cas d'égalité au sommet (3 questions max, puis ex æquo).
- Durées 45 min (32 q.) et 1 h (42 q.), ≈ 80 s par question révélation comprise.
- Le maître du jeu ne joue pas depuis l'écran ; s'il veut jouer, il rejoint aussi avec
  son téléphone.

## Données
- Toutes les stats sont réelles et sourcées ; aucune valeur inventée ou extrapolée.
- Variantes femmes/hommes d'une même question groupées (`g`) : jamais les deux dans
  une même partie.
- Banque embarquée en JS statique : zéro latence en jeu. Contrepartie assumée : un
  joueur qui ouvre le code source peut lire les réponses (jeu de soirée, pas d'enjeu).
- Les réponses des joueurs (`guesses`) sont illisibles par les autres joueurs.

## Technique
- Pas de Cloud Functions sauf le webhook Stripe (même exception que Bibi Love).
- État de reprise `live` sauvegardé après chaque révélation, AVANT la diffusion : un
  rafraîchissement de l'écran maître reprend à la question suivante sans double compte.
- `bc` séparé de `live` (piège Bibi Love : réécrire `live` effaçait la diffusion).
- Chronos locaux sur chaque appareil, jamais de comparaison d'horloges.
- Service worker réseau-d'abord pour le code (leçon Bibi Love).

## Identité
Nom « Attention à l'escalier », logo et DA originaux (violet/or, cartouches en marches).
L'esprit des jeux télé est repris, jamais la marque, le logo ou le cadre d'une émission.

## Limitations connues
- Historique des questions jouées local à l'appareil de l'hôte.
- Pas de QR code dans le salon (v1) : adresse + code à taper.
