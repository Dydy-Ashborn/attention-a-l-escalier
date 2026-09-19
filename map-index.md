# map-index — Attention à l'escalier

Aiguillage global. Aucun détail comportemental ici : voir les maps spécialisées.

| Module | Fichier(s) | Map | Statut |
|---|---|---|---|
| Coque PWA, routeur, boot | `index.html`, `js/app.js`, `sw.js`, `manifest.webmanifest` | [map-front](map-front.md) | ✅ v1 |
| Direction artistique | `css/style.css`, `icons/` | [map-front](map-front.md) | ✅ v1 |
| Parcours maître du jeu (création → salon → plateau → podium) | `js/host.js` | [map-front](map-front.md) | ✅ v1 |
| Manette téléphone (rejoindre → répondre → résultat) | `js/player.js` | [map-front](map-front.md) | ✅ v1 |
| Contrat de diffusion écran ↔ téléphones | `js/live.js` | [map-front](map-front.md) | ✅ v1 |
| Logique de jeu pure (tirage, plus proche, classement) | `js/game.js`, `js/config.js` | [map-front](map-front.md) | ✅ v1, testée |
| Banque de questions sourcées | `js/data/questions.js` | [map-donnees](map-donnees.md) | ✅ 117 questions (20 coquines) |
| Accès Firestore + mémoire locale hôte | `js/store.js`, `js/firebase.js` | [map-donnees](map-donnees.md) | ✅ v1 |
| Règles de sécurité | `firestore.rules` | [map-donnees](map-donnees.md) | ✅ v1 |
| Plan gratuit / complet + webhook Stripe | `js/plan.js`, `functions/index.js` | [map-monetisation](map-monetisation.md) | ⚠️ Stripe à brancher |
| Tests | `scripts/test-game.mjs` | — | ✅ 8 tests |

## Chantiers ouverts

- [x] **Banque** : 117 questions sourcées. Pistes d'enrichissement dans map-donnees.
- [x] **Firebase** : projet `attention-a-l-escalier` renseigné dans `js/config.js` et `.firebaserc`.
- [ ] Déployer : `firebase deploy --only firestore:rules,hosting` (Firestore créé + auth anonyme activée).
- [ ] **Stripe** : Payment Link 4,99 € + webhook (voir map-monetisation).
- [ ] QR code dans le salon (évite de taper l'adresse).
