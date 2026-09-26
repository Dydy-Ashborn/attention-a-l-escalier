# map-monetisation — plan gratuit / complet

Même modèle que Bibi Love : achat unique **4,99 €**, attaché à l'uid anonyme du
**maître du jeu** (`hosts/{uid}.premium`), les joueurs n'achètent jamais rien.

| | Gratuit | Complet |
|---|---|---|
| Questions tirables | sélection découverte : 18 normales + 2 coquines | toute la banque |
| Durée | 15 min (12 questions) | 45 min / 1 h |
| Joueurs | 4 | 12 |
| Question coquine, départage, podium | ✅ | ✅ |

La gratuite fait vivre une vraie mini-partie de 15 min, assez complète pour comprendre
le plaisir du jeu. Les formats de soirée, les 117 questions et les groupes jusqu'à
12 joueurs donnent une raison immédiate et lisible de passer au complet.

## js/plan.js — point de contrôle unique
`guard(feature, value)` (`duree`, `joueurs`) → `{ok, why}` ; `limitePool()` (découpe
déterministe) ; `maxJoueurs()` figé dans le doc de partie à la création (c'est le plan
de l'hôte qui compte, jamais celui de l'invité) ; `refreshPremium()` avec comparaison
**stricte** à `true` et diagnostic affiché dans « Mon compte » ; `attendrePaiement()`
réessaie 8 × 2 s au retour de Stripe.

## Brancher Stripe
1. Payment Link en mode `payment` → coller dans `LIEN_PAIEMENT` (`js/plan.js`).
   URL de succès : `https://<domaine>/#/?paiement=ok`.
2. `client_reference_id` = uid anonyme, ajouté automatiquement par `urlPaiement()`.
3. `firebase functions:secrets:set STRIPE_SECRET_KEY` et `STRIPE_WEBHOOK_SECRET`,
   puis `firebase deploy --only functions` (plan Blaze requis).
4. Webhook Stripe → URL de `stripeWebhook`, événement `checkout.session.completed`.
   Endpoints et secrets **distincts** en test et en live.

## Se débloquer soi-même
« Mon compte » affiche l'uid → Console Firestore → `hosts/<uid>` → champ `premium`
de type **booléen** `true`.

## Limite connue
Achat lié à l'uid anonyme de l'appareil : changer de navigateur le perd. Réponse future :
connexion Google optionnelle (`linkWithPopup`), sans changer le modèle de données.
