# map-front — interface et déroulé

## Principe
Un **écran maître** (télé/ordi, `#/host/CODE`) et un **téléphone par joueur** (`#/j/CODE`).
L'écran pose la question « Sur 100 {femmes}, combien… ? », chaque téléphone envoie un
pourcentage, l'app calcule seule le plus proche et le fait monter d'une marche.

## Déroulé d'une partie (js/host.js)
- `tirerPartie()` fixe le déroulé à la création : 32 questions (45 min) ou 42 (1 h),
  dont **exactement une coquine** placée entre 55 % et 85 % de la partie.
- 3 étages : un carton « Étage N » s'affiche à chaque changement (`ouvreEtage`).
- Carton rose **« C'est l'heure de la question coquine ! »** juste avant la coquine
  (jingle `sfx.coquine`, confettis roses), badge « Question coquine » sur la question.
- `askQuestion` : chrono 30 s (`RULES.SECONDES_REPONSE`). Si tout le monde a répondu,
  le chrono tombe à 3 s. À 0 : phase `verrou` (téléphones figés), le maître du jeu garde
  la main pour le suspense.
- `reveler` : `departager()` → crédite les marches → `persistLive()` **avant** la
  diffusion → `animerRevelation()`.
- `animerRevelation` : jauge 0-100 avec le pion de chaque joueur, compteur qui défile
  jusqu'à la vraie valeur, puis **phrase « Le plus proche : X avec 42 % (à 3 points) »**
  et `renderRanking()` = toutes les réponses triées par écart, gagnant(s) en vert.
  Source + note affichées sous le résultat. Énoncé réduit (`.is-reveal`) pour tenir à l'écran.
- `finDePartie` : égalité en tête → question de **départage** (seuls les ex æquo
  répondent, 3 max), sinon podium.
- `Terminer` (bouton haut droit) : podium immédiat avec les scores courants.
- `btnReplay` : même code, mêmes joueurs, nouveau tirage — les téléphones suivent seuls.
- Clavier : Espace / Entrée = bouton principal.

## Escalier des scores — `renderStairs(box, legende)`
Une marche par point (minimum 8), pions posés sur la marche de leur score, légende
classée. Même fonction pour le plateau et le podium. Piège : les hauteurs sont en %, le
conteneur doit avoir une hauteur définie (`flex:1` sur le plateau, `height:300px` sur
le podium) — sinon toutes les marches s'aplatissent.

## Manette (js/player.js)
- Rejoindre : prénom (2-16 car., unique dans la partie), couleur de pion libre attribuée.
  Refus si `maxJoueurs` (figé dans le doc de partie) est atteint.
- Saisie : gros chiffre, boutons −/+ (appui long = défilement, ×5 après 1,2 s) et curseur.
  Curseur restylé (boule de 48 px, piste remplie en or via la variable `--p` posée par
  `majValeur`) : la boule native était trop petite au doigt.
  « Valider » peut être renvoyé tant que le chrono tourne (la dernière valeur compte).
- Chrono **local**, démarré à réception : on ne compare jamais les horloges des appareils.
- Résultat (`afficherResultat`) : ta valeur / la vraie stat, ton écart, puis le bloc vert
  « Le plus proche » avec **sa réponse et son écart uniquement** (tous les ex æquo s'il y en
  a). Les réponses des autres joueurs ne s'affichent jamais sur les téléphones, seulement
  sur l'écran maître. Masqué au récap final (`afficherFin`).
- Retiré par l'hôte (fiche supprimée) ou partie supprimée : retour à l'accueil.

## Contrat de diffusion (js/live.js)
`games/{code}.bc` = `{ seq, phase, idx, qid, pop, texte, coquine, secondes, departage,
candidats, verite, src, note, reponses, gagnants, ecarts, scores }`.
Phases : attente, etage, coquine, question, verrou, reveal, fini.
`seq` n'augmente qu'à chaque question ; une réponse au mauvais `seq` est ignorée.
**Rien de secret en phase question** (ni `verite`, ni `reponses`).

## DA
Violet laqué + lettrage or bombé (Lilita One / Outfit). Logo original : deux cartouches
posées en marche d'escalier. Esprit plateau TV, jamais le logo ni le cadre d'une émission
existante. Font Awesome vendorisé (sous-ensemble de Bibi Love : n'utiliser que les
icônes présentes dans `vendor/fontawesome/fa.css`).

## Pièges
- Zoom au double tap sur mobile : `touch-action:manipulation` sur html/body (iOS ignore
  `user-scalable=no` depuis iOS 10, gardé dans le viewport pour Android).
- `[hidden]{display:none!important}` en tête de CSS (hérité de Bibi Love).
- Toast vide visible en bas d'écran : `visibility:hidden` hors ouverture.
- Bouton son déplacé en bas à gauche : il chevauchait le bouton « Suivant » du plateau.
