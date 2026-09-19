/* Attention à l'escalier — point de contrôle unique du plan (gratuit / complet).
 *
 * Même modèle que Bibi Love : toute limitation passe par `guard()`, aucune
 * vérification de plan ailleurs. Ajouter une restriction = une entrée ici, jamais
 * un `if` dans une vue.
 *
 * Découpage : on ne verrouille ni la question coquine ni le format. La version
 * gratuite fait vivre une vraie partie de 45 minutes ; ce sont la taille de la
 * banque, la partie d'une heure et le nombre de joueurs qui sont bridés. C'est la
 * répétition des questions à la deuxième soirée qui déclenche l'achat.
 */
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';
import { db, uid } from './firebase.js';
import { QUESTIONS } from './data/questions.js';
import { RULES } from './config.js';
import { ls } from './util.js';

export const PRIX = '4,99 €';

/**
 * Stripe Payment Link, mode `payment` (achat unique, jamais `subscription`).
 * À créer dans le Dashboard Stripe puis coller ici. Vide = bouton d'achat désactivé
 * proprement (« Bientôt disponible ») plutôt qu'une page morte.
 */
export const LIEN_PAIEMENT = '';

/**
 * URL de paiement portant l'identité de l'acheteur. `client_reference_id` est renvoyé
 * tel quel par Stripe dans le webhook : c'est le seul lien entre un paiement et
 * `hosts/{uid}`. Caractères filtrés : un identifiant refusé ferait échouer le paiement.
 */
export function urlPaiement() {
  if (!LIEN_PAIEMENT) return '';
  const ref = String(uid() || '').replace(/[^a-zA-Z0-9_-]/g, '');
  if (!ref) return '';
  const sep = LIEN_PAIEMENT.includes('?') ? '&' : '?';
  return `${LIEN_PAIEMENT}${sep}client_reference_id=${encodeURIComponent(ref)}`;
}

export const GRATUIT = {
  durees: [45],
  maxJoueurs: 4,
  questions: 45,     // premières questions normales de la banque
  coquines: 6        // premières questions coquines
};

const LS = 'escalier.premium';
let cache = ls.get(LS) === '1';

export function isPremium() { return cache; }

let dernierDiag = { etat: 'jamais', message: '' };
export function diagPremium() { return dernierDiag; }

/**
 * Relit `hosts/{uid}.premium` (écrit par le webhook Stripe, ou à la main par le
 * propriétaire). Le localStorage n'est qu'un cache anti-clignotement.
 * Comparaison STRICTE à `true` : la console Firebase propose le type « chaîne »
 * par défaut et `"true"` passait pour vrai (piège vécu sur Bibi Love).
 * L'erreur n'est jamais avalée : elle alimente l'écran « Mon compte ».
 */
export async function refreshPremium() {
  if (!db || !uid()) return cache;
  try {
    const snap = await getDoc(doc(db, 'hosts', uid()));
    const brut = snap.exists() ? snap.data().premium : undefined;
    cache = brut === true;
    if (!snap.exists()) {
      dernierDiag = { etat: 'absent',
        message: "Aucun document hosts/ à cet identifiant. Vérifie que l'ID du document est exactement celui affiché ci-dessus." };
    } else if (cache) {
      dernierDiag = { etat: 'ok', message: '' };
    } else if (typeof brut === 'string') {
      dernierDiag = { etat: 'mauvais-type',
        message: `Le champ premium vaut la chaîne « ${brut} », pas le booléen true. Dans la console Firebase, choisis le type « booléen ».` };
    } else {
      dernierDiag = { etat: 'sans-premium',
        message: "Le document existe mais son champ premium n'est pas à true (type booléen attendu)." };
    }
  } catch (e) {
    dernierDiag = { etat: 'refus', message: 'Lecture refusée par Firestore : ' + (e.code || e.message) +
      ". Le plus souvent, les règles n'ont pas encore été déployées (firebase deploy --only firestore:rules)." };
    console.warn('[escalier] lecture de hosts/' + uid() + ' impossible :', e);
  }
  ls.set(LS, cache ? '1' : '0');
  return cache;
}

/** Au retour de Stripe, le webhook peut mettre quelques secondes : on réessaie. */
export async function attendrePaiement({ essais = 8, delai = 2000 } = {}) {
  for (let i = 0; i < essais; i++) {
    if (await refreshPremium()) return true;
    if (i < essais - 1) await new Promise(r => setTimeout(r, delai));
  }
  return false;
}

/**
 * Point de contrôle unique.
 * @returns {{ok:boolean, why?:string}} `why` est le texte affiché dans le paywall.
 */
export function guard(feature, value) {
  if (cache) return { ok: true };
  switch (feature) {
    case 'duree':
      return GRATUIT.durees.includes(Number(value))
        ? { ok: true }
        : { ok: false, why: "La partie d'une heure fait partie de la version complète." };
    case 'joueurs':
      return Number(value) <= GRATUIT.maxJoueurs
        ? { ok: true }
        : { ok: false, why: `La version gratuite accueille ${GRATUIT.maxJoueurs} joueurs. Au-delà, c'est la version complète (jusqu'à ${RULES.MAX_JOUEURS}).` };
    default:
      return { ok: true };
  }
}

/** Nombre de joueurs autorisé par le plan de l'HÔTE — figé dans le doc de partie. */
export function maxJoueurs() {
  return cache ? RULES.MAX_JOUEURS : GRATUIT.maxJoueurs;
}

/**
 * Restreint la banque en version gratuite. Découpe déterministe (les premières
 * de la banque) : deux parties gratuites successives piochent dans le même
 * sous-ensemble — c'est voulu, c'est la répétition qui se fait sentir.
 */
export function limitePool(pool = QUESTIONS) {
  if (cache) return pool;
  let n = 0, c = 0;
  return pool.filter(q => q.coq ? (++c <= GRATUIT.coquines) : (++n <= GRATUIT.questions));
}

export function resume() {
  const total = QUESTIONS.length;
  if (cache) return { titre: 'Version complète', ligne: `${total} questions, parties de 45 min ou 1 h, jusqu'à ${RULES.MAX_JOUEURS} joueurs.` };
  return { titre: 'Version gratuite',
    ligne: `${GRATUIT.questions + GRATUIT.coquines} questions · parties de 45 min · ${GRATUIT.maxJoueurs} joueurs max.` };
}
