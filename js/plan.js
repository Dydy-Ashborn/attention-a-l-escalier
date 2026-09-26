/* Bibi step — point de contrôle unique du plan (gratuit / complet).
 *
 * Même modèle que Bibi Love : toute limitation passe par `guard()`, aucune
 * vérification de plan ailleurs. Ajouter une restriction = une entrée ici, jamais
 * un `if` dans une vue.
 *
 * Découpage : la découverte gratuite est une vraie mini-partie de 15 minutes.
 * La version complète débloque les formats de soirée, toute la banque et 12 joueurs.
 */
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';
import { db, uid } from './firebase.js';
import { QUESTIONS, DECOUVERTE_IDS } from './data/questions.js';
import { RULES } from './config.js';
import { ls } from './util.js';

export const PRIX = '4,99 €';

/**
 * Stripe Payment Link, mode `payment` (achat unique, jamais `subscription`).
 * À créer dans le Dashboard Stripe puis coller ici. Vide = bouton d'achat désactivé
 * proprement (« Bientôt disponible ») plutôt qu'une page morte.
 */
export const LIEN_PAIEMENT = 'https://buy.stripe.com/8x228r9Z05f171Qfgn8so04';

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
  durees: [15],
  maxJoueurs: 4,
  ids: DECOUVERTE_IDS
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
        : { ok: false, why: `Le format ${Number(value) === 60 ? '1 heure' : '45 minutes'} est réservé au jeu complet.` };
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

export function dureeInitiale() {
  return cache ? 45 : GRATUIT.durees[0];
}

/**
 * Restreint la banque à la sélection éditoriale de découverte.
 */
export function limitePool(pool = QUESTIONS) {
  if (cache) return pool;
  const ids = new Set(GRATUIT.ids);
  return pool.filter(q => ids.has(q.id));
}

export function offre() {
  const coquines = QUESTIONS.filter(q => q.coq).length;
  return {
    total: QUESTIONS.length,
    coquines,
    themes: new Set(QUESTIONS.filter(q => !q.coq).map(q => q.t)).size,
    decouverte: GRATUIT.ids.length,
    joueursGratuits: GRATUIT.maxJoueurs,
    joueursComplets: RULES.MAX_JOUEURS
  };
}

export function resume() {
  const o = offre();
  if (cache) return { titre: 'Jeu complet', ligne: `${o.total} questions · 45 min ou 1 h · jusqu'à ${o.joueursComplets} joueurs.` };
  return { titre: 'Partie découverte',
    ligne: `15 min · ${o.decouverte} questions disponibles · ${o.joueursGratuits} joueurs max.` };
}
