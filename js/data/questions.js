/* Bibi step — banque de questions.
 *
 * RÈGLE D'OR : chaque chiffre vient d'une enquête réelle, citée dans `src`.
 * Aucune valeur n'est estimée, arrondie « au feeling » ou extrapolée d'une autre population.
 * Une question sans source vérifiable n'entre pas dans la banque.
 *
 * Champs :
 *   id    identifiant stable (ne jamais renuméroter : l'historique de l'hôte s'en sert)
 *   pop   population annoncée à l'écran : « Sur 100 {pop}, combien… »
 *   q     suite de l'énoncé, après « combien »
 *   a     la vraie valeur, en % entier (arrondi standard du chiffre publié)
 *   src   institut + commanditaire + année de terrain
 *   note  précision affichée à la révélation (tranche d'âge, base…), facultative
 *   t     thème (sert à varier le tirage)
 *   g     groupe : les variantes femmes / hommes / ensemble d'une même question
 *         partagent un groupe, et une partie n'en tire qu'une par groupe
 *   coq   true = question coquine (une seule par partie, annoncée à l'écran)
 *
 * `DECOUVERTE_IDS` définit la sélection gratuite : elle doit rester courte, variée
 * et représentative. Le reste de la banque appartient à la version complète.
 */

const IFOP_HYG = 'Ifop pour Diogène France, 2020';
const IFOP_SUP = 'Ifop pour Esteban Frédéric, 2022';
const CREDOC   = 'Crédoc / Arcep, Baromètre du numérique 2025';
const SPF      = 'Santé publique France, Baromètre 2024';
const IKEA     = 'Ifop pour Ikea, 2025';
const FACCO    = 'Odoxa pour la Facco, 2024';
const SOMMEIL  = 'Ifop pour Les-Matelas.fr, 2022';
const TRAVAIL  = 'Ifop pour Online Seduction, 2018';
const LELO     = 'Ifop pour Lelo, 2024';
const JOY      = 'Ifop pour JOYclub, 2026';
const OFDT     = 'OFDT, enquête EROPP 2023';
const LIT      = 'Ifop pour Femme Actuelle, 2014';
const DARWIN   = 'Ifop pour Darwin Nutrition, 2022';
const SELL     = 'Médiamétrie pour le SELL, 2025';
const AMB      = 'Ifop pour AMB-USA, 2023';

export const QUESTIONS = [
  /* ── Hygiène ─────────────────────────────────────────────── */
  { id: 'hyg01', g: 'toilette', t: 'hygiene', pop: 'Français', a: 76, src: IFOP_HYG,
    q: 'font une toilette complète tous les jours ?' },
  { id: 'hyg02', g: 'toilette', t: 'hygiene', pop: 'femmes', a: 81, src: IFOP_HYG,
    q: 'font une toilette complète tous les jours ?' },
  { id: 'hyg03', g: 'toilette', t: 'hygiene', pop: 'hommes', a: 71, src: IFOP_HYG,
    q: 'font une toilette complète tous les jours ?' },
  { id: 'hyg04', g: 'douche', t: 'hygiene', pop: 'Français', a: 63, src: IFOP_HYG,
    q: 'prennent une douche tous les jours ?' },
  { id: 'hyg05', g: 'cheveux', t: 'hygiene', pop: 'hommes', a: 30, src: IFOP_HYG,
    q: 'se lavent les cheveux tous les jours ?' },
  { id: 'hyg06', g: 'cheveux', t: 'hygiene', pop: 'femmes', a: 8, src: IFOP_HYG,
    q: 'se lavent les cheveux tous les jours ?' },
  { id: 'hyg07', g: 'mains-wc', t: 'hygiene', pop: 'hommes', a: 68, src: IFOP_HYG,
    q: 'se lavent les mains après être passés aux toilettes ?' },
  { id: 'hyg08', g: 'mains-transports', t: 'hygiene', pop: 'femmes', a: 42, src: IFOP_HYG,
    q: 'se lavent les mains après avoir pris les transports en commun ?' },
  { id: 'hyg09', g: 'slip', t: 'hygiene', pop: 'hommes', a: 73, src: IFOP_HYG,
    q: 'changent de sous-vêtements tous les jours ?' },
  { id: 'hyg10', g: 'culotte', t: 'hygiene', pop: 'femmes', a: 94, src: IFOP_HYG,
    q: 'changent de culotte tous les jours ?' },

  /* ── Superstitions et croyances ──────────────────────────── */
  { id: 'sup01', g: 'etoile', t: 'croyances', pop: 'Français', a: 56, src: IFOP_SUP,
    q: 'croient en leur bonne étoile ?' },
  { id: 'sup02', g: 'astro-caractere', t: 'croyances', pop: 'femmes', a: 54, src: IFOP_SUP,
    q: 'pensent que le signe astrologique explique le caractère ?' },
  { id: 'sup03', g: 'astro-caractere', t: 'croyances', pop: 'hommes', a: 34, src: IFOP_SUP,
    q: 'pensent que le signe astrologique explique le caractère ?' },
  { id: 'sup04', g: 'mauvais-oeil', t: 'croyances', pop: 'Français', a: 33, src: IFOP_SUP,
    q: 'croient au mauvais œil ?' },
  { id: 'sup05', g: 'voyante', t: 'croyances', pop: 'femmes', a: 22, src: IFOP_SUP,
    q: 'ont déjà consulté un(e) voyant(e) ?' },
  { id: 'sup06', g: 'voyante', t: 'croyances', pop: 'hommes', a: 12, src: IFOP_SUP,
    q: 'ont déjà consulté un(e) voyant(e) ?' },
  { id: 'sup07', g: 'miroir', t: 'croyances', pop: 'femmes', a: 42, src: IFOP_SUP,
    q: 'pensent que casser un miroir porte malheur ?' },
  { id: 'sup08', g: 'parapluie', t: 'croyances', pop: 'hommes', a: 21, src: IFOP_SUP,
    q: 'pensent qu\'ouvrir un parapluie dans la maison porte malheur ?' },
  { id: 'sup09', g: 'bois', t: 'croyances', pop: 'Français', a: 49, src: IFOP_SUP,
    q: 'pensent que toucher du bois porte bonheur ?' },
  { id: 'sup10', g: 'superstitieux', t: 'croyances', pop: 'Français', a: 30, src: IFOP_SUP,
    q: 'se disent superstitieux ?' },
  { id: 'sup11', g: 'treize', t: 'croyances', pop: 'Français', a: 22, src: IFOP_SUP,
    q: 'pensent qu\'être 13 à table porte malheur ?' },
  { id: 'sup12', g: 'chanceux', t: 'croyances', pop: 'Français', a: 29, src: IFOP_SUP,
    q: 'se trouvent chanceux dans la vie ?' },
  { id: 'sup13', g: 'pain', t: 'croyances', pop: 'Français', a: 32, src: IFOP_SUP,
    q: 'pensent que poser le pain à l\'envers porte malheur ?' },
  { id: 'sup14', g: 'etoile-filante', t: 'croyances', pop: 'femmes', a: 55, src: IFOP_SUP,
    q: 'pensent que voir une étoile filante porte bonheur ?' },
  { id: 'sup15', g: 'predictions', t: 'croyances', pop: 'hommes', a: 25, src: IFOP_SUP,
    q: 'croient aux prédictions des voyants ?' },
  { id: 'sup16', g: 'chat-noir', t: 'croyances', pop: 'Français', a: 14, src: IFOP_SUP,
    q: 'pensent que croiser un chat noir la nuit porte malheur ?' },
  { id: 'sup17', g: 'numerologie', t: 'croyances', pop: 'Français', a: 28, src: IFOP_SUP,
    q: 'croient à la numérologie ?' },
  { id: 'sup18', g: 'gui', t: 'croyances', pop: 'Français', a: 21, src: IFOP_SUP,
    q: 'pensent que s\'embrasser sous le gui porte bonheur ?' },
  { id: 'sup19', g: 'astro-ami', t: 'croyances', pop: 'Français', a: 24, src: IFOP_SUP,
    q: 'ont déjà demandé son signe astrologique à un(e) ami(e) ?' },

  /* ── À table ─────────────────────────────────────────────── */
  { id: 'tab01', g: 'chocolatine', t: 'table', pop: 'Français', a: 16, src: 'Ifop, 2019',
    q: 'disent « chocolatine » plutôt que « pain au chocolat » ?' },
  { id: 'tab02', g: 'petit-dej', t: 'table', pop: 'Français', a: 80, src: 'Odoxa pour Ferrero, 2023',
    q: 'prennent un petit-déjeuner très régulièrement ?' },
  { id: 'tab03', g: 'cafe', t: 'table', pop: 'hommes', a: 85, src: 'Ifop pour Lemeilleurcafe.fr, 2024',
    q: 'ont bu du café ces trois derniers mois ?' },
  { id: 'tab04', g: 'cafe', t: 'table', pop: 'femmes', a: 70, src: 'Ifop pour Lemeilleurcafe.fr, 2024',
    q: 'ont bu du café ces trois derniers mois ?' },
  { id: 'tab05', g: 'chante-cuisine', t: 'table', pop: 'Français', a: 55, src: IKEA,
    q: 'chantent ou dansent en cuisinant ?' },
  { id: 'tab06', g: 'gaspi', t: 'table', pop: 'Français', a: 68, src: IKEA,
    q: 'reconnaissent jeter de la nourriture ?' },
  { id: 'tab07', g: 'cuisine-3x', t: 'table', pop: 'Français', a: 73, src: IKEA,
    q: 'cuisinent au moins trois fois par semaine ?' },
  { id: 'tab08', g: 'cuisine-fr', t: 'table', pop: 'Français', a: 85, src: IKEA,
    q: 'pensent que la cuisine française est la meilleure du monde ?' },
  { id: 'tab09', g: 'invitent', t: 'table', pop: 'Français', a: 55, src: IKEA,
    q: 'invitent des proches à manger au moins une fois par mois ?' },

  /* ── Maison, animaux, sommeil ────────────────────────────── */
  { id: 'mai01', g: 'animal', t: 'maison', pop: 'Français', a: 61, src: FACCO,
    q: 'ont au moins un animal de compagnie ?' },
  { id: 'mai02', g: 'chat', t: 'maison', pop: 'Français', a: 39, src: FACCO,
    q: 'ont un chat ?' },
  { id: 'mai03', g: 'chien', t: 'maison', pop: 'Français', a: 30, src: FACCO,
    q: 'ont un chien ?' },
  { id: 'mai04', g: 'proprio', t: 'maison', pop: 'foyers français', a: 58, src: 'Insee, 2021',
    q: 'sont propriétaires de leur logement ?', note: 'Résidence principale, France métropolitaine (57,7 %).' },
  { id: 'mai05', g: 'ecran-dodo', t: 'maison', pop: 'Français', a: 50, src: SOMMEIL,
    q: 'regardent la télé ou des vidéos avant de dormir ?' },
  { id: 'mai06', g: 'sommeil', t: 'maison', pop: 'femmes', a: 38, src: SOMMEIL,
    q: 'ne sont pas satisfaites de leur sommeil ?' },
  { id: 'mai07', g: 'sommeil', t: 'maison', pop: 'hommes', a: 26, src: SOMMEIL,
    q: 'ne sont pas satisfaits de leur sommeil ?' },
  { id: 'mai08', g: 'matelas', t: 'maison', pop: 'Français', a: 52, src: SOMMEIL,
    q: 'préfèrent dormir sur un matelas ferme ?' },

  /* ── Écrans ──────────────────────────────────────────────── */
  { id: 'num01', g: 'smartphone', t: 'ecrans', pop: 'Français', a: 91, src: CREDOC,
    q: 'ont un smartphone ?', note: 'Population de 12 ans et plus.' },
  { id: 'num02', g: 'ia', t: 'ecrans', pop: 'Français', a: 33, src: CREDOC,
    q: 'ont utilisé une IA générative (type ChatGPT) dans l\'année ?', note: 'Population de 12 ans et plus.' },
  { id: 'num03', g: 'fixe', t: 'ecrans', pop: 'Français', a: 74, src: CREDOC,
    q: 'ont encore un téléphone fixe à la maison ?', note: 'Population de 12 ans et plus.' },
  { id: 'num04', g: 'ia-perso', t: 'ecrans', pop: 'hommes', a: 30, src: CREDOC,
    q: 'utilisent une IA générative pour leur vie perso ?', note: 'Population de 12 ans et plus.' },
  { id: 'num05', g: 'ia-perso', t: 'ecrans', pop: 'femmes', a: 22, src: CREDOC,
    q: 'utilisent une IA générative pour leur vie perso ?', note: 'Population de 12 ans et plus.' },

  /* ── Santé, sport, loisirs ───────────────────────────────── */
  { id: 'vie01', g: 'tabac', t: 'vie', pop: 'Français', a: 17, src: SPF,
    q: 'fument tous les jours ?', note: '18-79 ans (17,4 %).' },
  { id: 'vie02', g: 'tabac', t: 'vie', pop: 'hommes', a: 20, src: SPF,
    q: 'fument tous les jours ?', note: '18-75 ans (20,4 %).' },
  { id: 'vie03', g: 'tabac', t: 'vie', pop: 'femmes', a: 16, src: SPF,
    q: 'fument tous les jours ?', note: '18-75 ans (16,2 %).' },
  { id: 'vie04', g: 'sport', t: 'vie', pop: 'Français', a: 61, src: 'INJEP, Baromètre des pratiques sportives 2025',
    q: 'font du sport au moins une fois par semaine ?', note: '15 ans et plus, au moins 52 séances dans l\'année.' },
  { id: 'vie05', g: 'livre-audio', t: 'vie', pop: 'Français', a: 32, src: 'Ipsos pour le CNL, 2025',
    q: 'ont déjà écouté un livre audio ?', note: '15 ans et plus.' },

  /* ── Couple (sans rien de coquin) ────────────────────────── */
  { id: 'cou01', g: 'snooping', t: 'couple', pop: 'femmes', a: 44, src: 'Ifop pour Le Journal du Geek, 2023',
    q: 'ont déjà fouillé le téléphone de leur partenaire ?' },
  { id: 'cou02', g: 'snooping', t: 'couple', pop: 'hommes', a: 35, src: 'Ifop pour Le Journal du Geek, 2023',
    q: 'ont déjà fouillé le téléphone de leur partenaire ?' },
  { id: 'cou03', g: 'topless', t: 'couple', pop: 'femmes', a: 19, src: 'Ifop pour Voyage Avec Nous, 2023',
    q: 'font du topless à la plage ?', note: 'Contre 43 % en 1984.' },
  { id: 'cou04', g: 'rencontre-travail', t: 'couple', pop: 'Français en couple', a: 12, src: TRAVAIL,
    q: 'ont rencontré leur partenaire au travail ?' },
  { id: 'cou05', g: 'seduction-travail', t: 'couple', pop: 'Français', a: 31, src: TRAVAIL,
    q: 'ont déjà joué les séducteurs sur leur lieu de travail ?' },

  /* ── Questions coquines (une seule par partie) ───────────── */
  { id: 'coq01', coq: true, g: 'astro-soir', t: 'coquin', pop: 'Français', a: 9, src: IFOP_SUP,
    q: 'ont déjà demandé son signe astro à un partenaire… d\'un soir ?' },
  { id: 'coq02', coq: true, g: 'infidele-f', t: 'coquin', pop: 'femmes', a: 26, src: 'Ifop pour Gleeden, 2025',
    q: 'ont déjà été infidèles ?' },
  { id: 'coq03', coq: true, g: 'couple-ouvert', t: 'coquin', pop: 'Français', a: 15, src: 'Ifop pour Gleeden, 2025',
    q: 'ont déjà vécu une relation ouverte ?' },
  { id: 'coq04', coq: true, g: 'fantasme-collegue', t: 'coquin', pop: 'hommes', a: 53, src: TRAVAIL,
    q: 'ont déjà fantasmé sur un(e) collègue ?' },
  { id: 'coq05', coq: true, g: 'fantasme-collegue', t: 'coquin', pop: 'femmes', a: 30, src: TRAVAIL,
    q: 'ont déjà fantasmé sur un(e) collègue ?' },
  { id: 'coq06', coq: true, g: 'sexe-travail', t: 'coquin', pop: 'Français', a: 35, src: TRAVAIL,
    q: 'ont déjà couché avec quelqu\'un rencontré par le travail ?' },
  { id: 'coq07', coq: true, g: 'rapport-annee', t: 'coquin', pop: 'Français', a: 76, src: LELO,
    q: 'ont fait l\'amour au cours des 12 derniers mois ?' },
  { id: 'coq08', coq: true, g: 'platonique', t: 'coquin', pop: 'femmes', a: 54, src: LELO,
    q: 'pourraient vivre une histoire d\'amour sans sexe ?' },
  { id: 'coq09', coq: true, g: 'platonique', t: 'coquin', pop: 'hommes', a: 42, src: LELO,
    q: 'pourraient vivre une histoire d\'amour sans sexe ?' },
  { id: 'coq10', coq: true, g: 'manque', t: 'coquin', pop: 'hommes', a: 60, src: LELO,
    q: 'disent que le sexe leur manque vite quand ils n\'en ont pas ?', note: 'En cas d\'abstinence prolongée.' },
  { id: 'coq11', coq: true, g: 'manque', t: 'coquin', pop: 'femmes', a: 30, src: LELO,
    q: 'disent que le sexe leur manque vite quand elles n\'en ont pas ?', note: 'En cas d\'abstinence prolongée.' },
  { id: 'coq12', coq: true, g: 'simulation', t: 'coquin', pop: 'femmes', a: 57, src: JOY,
    q: 'ont déjà simulé un orgasme ?', note: '18-69 ans. Elles étaient 32 % en 1998.' },
  { id: 'coq13', coq: true, g: 'orgasme', t: 'coquin', pop: 'hommes', a: 67, src: JOY,
    q: 'atteignent l\'orgasme à chaque rapport ou presque ?' },
  { id: 'coq14', coq: true, g: 'orgasme', t: 'coquin', pop: 'femmes', a: 40, src: JOY,
    q: 'atteignent l\'orgasme à chaque rapport ou presque ?' },
  { id: 'coq15', coq: true, g: 'sextoy', t: 'coquin', pop: 'femmes', a: 43, src: JOY,
    q: 'ont déjà utilisé un sextoy avec leur partenaire ?', note: 'Elles étaient 6 % en 1996.' },
  { id: 'coq16', coq: true, g: 'ennui', t: 'coquin', pop: 'femmes', a: 56, src: JOY,
    q: 'avouent s\'ennuyer parfois pendant l\'amour ?', note: 'Contre 36 % en 1996.' },
  { id: 'coq17', coq: true, g: 'nudes', t: 'coquin', pop: 'Français', a: 14, src: 'Ifop, 2020',
    q: 'ont déjà envoyé des nudes ?', note: '31 % chez les 18-25 ans.' },

  /* ── Ajouts v1.1 (septembre 2026) ────────────────────────── */
  { id: 'arg01', g: 'jeux-argent', t: 'argent', pop: 'Français', a: 52, src: OFDT,
    q: 'ont joué à un jeu d\'argent dans l\'année ?', note: '18-75 ans (51,6 %), enquête EROPP 2023.' },
  { id: 'arg02', g: 'jeux-argent', t: 'argent', pop: 'hommes', a: 56, src: OFDT,
    q: 'ont joué à un jeu d\'argent dans l\'année ?', note: '18-75 ans (55,9 %), enquête EROPP 2023.' },
  { id: 'arg03', g: 'jeux-argent', t: 'argent', pop: 'femmes', a: 48, src: OFDT,
    q: 'ont joué à un jeu d\'argent dans l\'année ?', note: '18-75 ans (47,6 %), enquête EROPP 2023.' },
  { id: 'arg04', g: 'loto', t: 'argent', pop: 'Français', a: 34, src: OFDT,
    q: 'ont joué à un jeu de tirage (Loto, EuroMillions…) dans l\'année ?', note: '18-75 ans, enquête EROPP 2023.' },
  { id: 'arg05', g: 'grattage', t: 'argent', pop: 'Français', a: 31, src: OFDT,
    q: 'ont gratté un jeu de grattage dans l\'année ?', note: '18-75 ans, enquête EROPP 2023.' },
  { id: 'arg06', g: 'paris-sportifs', t: 'argent', pop: 'Français', a: 7, src: OFDT,
    q: 'ont fait un pari sportif dans l\'année ?', note: '18-75 ans (6,7 %), enquête EROPP 2023.' },

  { id: 'tra01', g: 'teletravail', t: 'travail', pop: 'salariés du privé', a: 22, src: 'Insee, 2024',
    q: 'télétravaillent au moins une fois par mois ?', note: 'Premier semestre 2024.' },
  { id: 'tra02', g: 'wc-smartphone', t: 'ecrans', pop: 'Français', a: 65, src: 'Cint pour NordVPN, 2022',
    q: 'utilisent leur smartphone aux toilettes ?' },

  { id: 'lit01', g: 'lire-lit', t: 'maison', pop: 'femmes', a: 90, src: LIT,
    q: 'lisent dans leur lit ?', note: 'Au moins de temps en temps.' },
  { id: 'lit02', g: 'lire-lit', t: 'maison', pop: 'hommes', a: 77, src: LIT,
    q: 'lisent dans leur lit ?', note: 'Au moins de temps en temps.' },
  { id: 'lit03', g: 'travail-lit', t: 'maison', pop: 'Français', a: 29, src: LIT,
    q: 'travaillent dans leur lit ?', note: 'Au moins de temps en temps.' },
  { id: 'lit04', g: 'pdj-lit', t: 'maison', pop: 'Français', a: 28, src: LIT,
    q: 'prennent leur petit-déjeuner au lit ?', note: 'Au moins de temps en temps.' },
  { id: 'lit05', g: 'diner-lit', t: 'maison', pop: 'Français', a: 21, src: LIT,
    q: 'déjeunent ou dînent dans leur lit ?', note: 'Au moins de temps en temps.' },
  { id: 'lit06', g: 'ronflement', t: 'couple', pop: 'femmes en couple', a: 52, src: LIT,
    q: 'disent que les ronflements sont ce qui les agace le plus au lit ?' },
  { id: 'lit07', g: 'ronflement', t: 'couple', pop: 'hommes en couple', a: 30, src: LIT,
    q: 'disent que les ronflements sont ce qui les agace le plus au lit ?' },
  { id: 'lit08', g: 'bonne-nuit', t: 'couple', pop: 'Français en couple', a: 67, src: LIT,
    q: 'disent « bonne nuit » comme derniers mots avant de dormir ?' },
  { id: 'lit09', g: 'je-taime', t: 'couple', pop: 'Français en couple', a: 10, src: LIT,
    q: 'disent « je t\'aime » comme derniers mots avant de dormir ?' },
  { id: 'lit10', g: 'canape', t: 'couple', pop: 'femmes ayant déjà vécu en couple', a: 40, src: LIT,
    q: 'ont déjà vu l\'un des deux partir dormir ailleurs après une dispute ?', note: 'Chez les hommes : 23 %.' },
  { id: 'lit11', g: 'dormir-seul', t: 'maison', pop: 'femmes', a: 41, src: 'Ifop pour Tousaulit.com, 2021',
    q: 'préfèrent dormir seules ?' },
  { id: 'lit12', g: 'dormir-seul', t: 'maison', pop: 'hommes', a: 33, src: 'Ifop pour Tousaulit.com, 2021',
    q: 'préfèrent dormir seuls ?' },
  { id: 'cou06', g: 'dispute-menage', t: 'couple', pop: 'Français en couple', a: 48, src: 'Ifop pour Consolab, 2019',
    q: 'se disputent au sujet des tâches ménagères ?', note: 'Ils étaient 42 % en 2005.' },
  { id: 'cou07', g: 'site-rencontre', t: 'couple', pop: 'Français', a: 26, src: 'Ifop pour Lacse, 2018',
    q: 'se sont déjà inscrits sur un site ou une appli de rencontre ?' },

  { id: 'tab10', g: 'viandard', t: 'table', pop: 'hommes', a: 56, src: DARWIN,
    q: 'se disent « viandards » ?' },
  { id: 'tab11', g: 'barbecue', t: 'table', pop: 'hommes en couple', a: 78, src: DARWIN,
    q: 's\'occupent du barbecue plus souvent que leur conjointe ?' },
  { id: 'tab12', g: 'viande-force', t: 'table', pop: 'hommes', a: 55, src: DARWIN,
    q: 'pensent que la viande rouge donne de la force aux hommes ?' },
  { id: 'tab13', g: 'the', t: 'table', pop: 'Français', a: 56, src: 'Ifop pour Lemeilleurcafe.fr, 2024',
    q: 'ont bu du thé ces trois derniers mois ?' },

  { id: 'num06', g: 'jeux-video', t: 'ecrans', pop: 'Français', a: 73, src: SELL,
    q: 'jouent aux jeux vidéo, au moins de temps en temps ?', note: '10 ans et plus.' },
  { id: 'num07', g: 'jeux-video', t: 'ecrans', pop: 'femmes', a: 69, src: SELL,
    q: 'jouent aux jeux vidéo, au moins de temps en temps ?', note: '10 ans et plus. Chez les hommes : 77 %.' },
  { id: 'num08', g: 'jeux-video', t: 'ecrans', pop: 'hommes', a: 77, src: SELL,
    q: 'jouent aux jeux vidéo, au moins de temps en temps ?', note: '10 ans et plus. Chez les femmes : 69 %.' },
  { id: 'num09', g: 'jeux-video-hebdo', t: 'ecrans', pop: 'Français', a: 55, src: SELL,
    q: 'jouent aux jeux vidéo au moins une fois par semaine ?', note: '10 ans et plus.' },

  { id: 'sup20', g: 'miracles', t: 'croyances', pop: 'Français', a: 43, src: AMB,
    q: 'croient aux miracles ?' },
  { id: 'sup21', g: 'telepathie', t: 'croyances', pop: 'Français', a: 40, src: AMB,
    q: 'croient à la transmission de pensée ?' },
  { id: 'sup22', g: 'ovnis', t: 'croyances', pop: 'Français', a: 28, src: AMB,
    q: 'croient aux OVNIs ?' },
  { id: 'sup23', g: 'reincarnation', t: 'croyances', pop: 'Français', a: 28, src: AMB,
    q: 'croient à la réincarnation ?' },
  { id: 'sup24', g: 'fantomes', t: 'croyances', pop: 'Français', a: 24, src: AMB,
    q: 'croient aux fantômes ?' },
  { id: 'sup25', g: 'sorcieres', t: 'croyances', pop: 'Français', a: 18, src: AMB,
    q: 'croient aux sorcières ?' },

  { id: 'coq18', coq: true, g: 'ete-partenaire', t: 'coquin', pop: 'hommes en couple', a: 34, src: 'Ifop pour TF1 / Quotidien, 2017',
    q: 'avouent avoir envie de changer de partenaire pendant l\'été ?' },
  { id: 'coq19', coq: true, g: 'ete-partenaire', t: 'coquin', pop: 'femmes en couple', a: 16, src: 'Ifop pour TF1 / Quotidien, 2017',
    q: 'avouent avoir envie de changer de partenaire pendant l\'été ?' },
  { id: 'coq20', coq: true, g: 'soutif', t: 'coquin', pop: 'femmes', a: 3, src: 'Ifop pour 24matins, 2020',
    q: 'ne portent jamais (ou presque) de soutien-gorge ?', note: 'Avant le confinement ; 8 % pendant.' }
];

/** Libellé complet tel qu'il s'affiche : « Sur 100 femmes, combien… ». */
export function enonce(q) {
  return `Sur 100 ${q.pop}, combien ${q.q}`;
}

export const byId = Object.fromEntries(QUESTIONS.map(q => [q.id, q]));

/** Sélection éditoriale de la partie découverte : 18 normales, 2 coquines, 8 thèmes. */
export const DECOUVERTE_IDS = Object.freeze([
  'hyg04', 'hyg09',
  'sup01', 'sup10', 'sup24',
  'tab01', 'tab05',
  'mai01', 'mai05',
  'num02', 'num06',
  'vie01', 'vie04',
  'cou01', 'cou04',
  'arg06',
  'tra02',
  'lit06',
  'coq01', 'coq02'
]);
