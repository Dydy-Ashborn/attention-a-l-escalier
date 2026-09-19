/* Attention à l'escalier — logique de jeu pure.
 * Aucun accès au DOM ni à Firebase : ce module est testé tel quel sous Node
 * (scripts/test-game.mjs). */
import { QUESTIONS } from './data/questions.js';
import { RULES } from './config.js';

export function shuffle(arr, rng = Math.random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function nbQuestions(duree) {
  return RULES.QUESTIONS_PAR_DUREE[duree] || RULES.QUESTIONS_PAR_DUREE[45];
}

/**
 * Tire le déroulé d'une partie.
 *
 * - Une seule question par groupe `g` : les variantes femmes / hommes d'une même
 *   question ne tombent jamais dans la même partie (la deuxième serait éventée).
 * - Les questions déjà jouées sur cet appareil (`exclude`) passent en dernier recours
 *   seulement : si la banque est trop petite, on rejoue plutôt que de raccourcir.
 * - Exactement UNE question coquine, placée dans la seconde moitié.
 * - Deux thèmes identiques ne se suivent pas quand c'est évitable.
 *
 * @returns {{ ids:string[], coquineIdx:number }}
 */
export function tirerPartie({ duree = 45, exclude = [], pool = QUESTIONS, rng = Math.random } = {}) {
  const n = nbQuestions(duree);
  const vu = new Set(exclude);
  const frais = q => !vu.has(q.id);

  const normales = pool.filter(q => !q.coq);
  const coquines = pool.filter(q => q.coq);

  // Frais d'abord, déjà-vus ensuite, chacun mélangé.
  const ordre = [...shuffle(normales.filter(frais), rng), ...shuffle(normales.filter(q => !frais(q)), rng)];
  const groupes = new Set();
  const choisies = [];
  for (const q of ordre) {
    if (choisies.length >= n - 1) break;
    if (groupes.has(q.g)) continue;
    groupes.add(q.g);
    choisies.push(q);
  }

  const seq = alternerThemes(choisies, rng);

  const coq = [...shuffle(coquines.filter(frais), rng), ...shuffle(coquines.filter(q => !frais(q)), rng)][0];
  let coquineIdx = -1;
  if (coq) {
    const [a, b] = RULES.COQUINE_ENTRE;
    const total = seq.length + 1;
    coquineIdx = Math.min(total - 2, Math.max(1, Math.floor(total * (a + rng() * (b - a)))));
    seq.splice(coquineIdx, 0, coq);
  }
  return { ids: seq.map(q => q.id), coquineIdx };
}

/** Réordonne pour éviter deux thèmes identiques consécutifs (glouton, sans garantie). */
function alternerThemes(list, rng) {
  const reste = list.slice();
  const out = [];
  while (reste.length) {
    const prev = out.length ? out[out.length - 1].t : null;
    let k = reste.findIndex(q => q.t !== prev);
    if (k < 0) k = 0;
    out.push(reste.splice(k, 1)[0]);
  }
  return out;
}

/** Étage (1..ETAGES) d'une question d'après sa position. */
export function etageDe(idx, total, etages = RULES.ETAGES) {
  if (total <= 0) return 1;
  return Math.min(etages, Math.floor((idx * etages) / total) + 1);
}

/** Vrai si la question `idx` ouvre un nouvel étage (carton d'annonce à l'écran). */
export function ouvreEtage(idx, total, etages = RULES.ETAGES) {
  return idx === 0 || etageDe(idx, total, etages) !== etageDe(idx - 1, total, etages);
}

/** Normalise une saisie en pourcentage entier 0..100, ou null si invalide. */
export function pourcent(v) {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(100, n));
}

/**
 * Désigne le ou les plus proches.
 * @param {Record<string, number>} reponses  uid → pourcentage proposé
 * @param {number} verite
 * @returns {{ gagnants:string[], ecarts:Record<string,number>, meilleur:number|null, pile:string[] }}
 * Égalité d'écart : tous les ex æquo gagnent leur marche. Personne n'a répondu : aucun gagnant.
 */
export function departager(reponses, verite) {
  const ecarts = {};
  for (const [u, v] of Object.entries(reponses || {})) {
    const p = pourcent(v);
    if (p === null) continue;
    ecarts[u] = Math.abs(p - verite);
  }
  const vals = Object.values(ecarts);
  if (!vals.length) return { gagnants: [], ecarts, meilleur: null, pile: [] };
  const meilleur = Math.min(...vals);
  const gagnants = Object.keys(ecarts).filter(u => ecarts[u] === meilleur);
  return { gagnants, ecarts, meilleur, pile: meilleur === 0 ? gagnants.slice() : [] };
}

/** Ajoute les marches gagnées aux scores (nouvel objet). */
export function crediter(scores, gagnants, points = RULES.POINTS) {
  const out = { ...(scores || {}) };
  for (const u of gagnants) out[u] = (out[u] || 0) + points;
  return out;
}

/**
 * Classement affichable, rangs partagés en cas d'égalité (1, 1, 3…).
 * @param {Record<string,number>} scores
 * @param {{uid:string,name:string,color?:string}[]} joueurs
 */
export function classement(scores, joueurs) {
  const lignes = joueurs.map(j => ({ ...j, score: (scores || {})[j.uid] || 0 }))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, 'fr'));
  let rang = 0, prec = null;
  lignes.forEach((l, i) => {
    if (l.score !== prec) { rang = i + 1; prec = l.score; }
    l.rang = rang;
  });
  return lignes;
}

/** Joueurs à égalité en tête (plusieurs = départage nécessaire). */
export function enTete(scores, joueurs) {
  const c = classement(scores, joueurs);
  if (!c.length) return [];
  return c.filter(l => l.rang === 1).map(l => l.uid);
}

/** Question de départage : une normale absente de la partie, fraîche si possible. */
export function questionDepartage(dejaJouees, { pool = QUESTIONS, rng = Math.random } = {}) {
  const pris = new Set(dejaJouees);
  const groupes = new Set(pool.filter(q => pris.has(q.id)).map(q => q.g));
  const libres = pool.filter(q => !q.coq && !pris.has(q.id) && !groupes.has(q.g));
  const repli  = pool.filter(q => !q.coq && !pris.has(q.id));
  const choix = libres.length ? libres : repli;
  return choix.length ? shuffle(choix, rng)[0].id : null;
}
