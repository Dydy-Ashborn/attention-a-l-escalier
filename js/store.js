/* Bibi step — couche d'accès Firestore. Aucun composant UI ici.
 * Modèle :
 *   games/{code}                    config + déroulé + état live + broadcast — écrit par l'hôte seul
 *   games/{code}/players/{uid}      prénom + couleur de pion — écrit par le joueur
 *   games/{code}/guesses/{uid}      { seq, value } — lisible par son auteur et par l'hôte seulement
 *   hosts/{uid}                     { premium } — écrit par le webhook Stripe seul
 */
import {
  doc, collection, setDoc, updateDoc, getDoc, getDocs, onSnapshot,
  serverTimestamp, deleteDoc
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';
import { db, uid } from './firebase.js';
import { makeCode, ls } from './util.js';
import { tirerPartie } from './game.js';
import { limitePool, maxJoueurs } from './plan.js';

const gameRef    = code => doc(db, 'games', code);
const playersRef = code => collection(db, 'games', code, 'players');
const playerRef  = (code, u) => doc(db, 'games', code, 'players', u);
const guessesRef = code => collection(db, 'games', code, 'guesses');
const guessRef   = (code, u) => doc(db, 'games', code, 'guesses', u);

/* ── Mémoire locale de l'hôte ──────────────────────────────────────────── */
const LS_GAMES = 'escalier.host.games';
const LS_USED  = 'escalier.host.used';

export function hostGames() {
  try { return JSON.parse(ls.get(LS_GAMES, '[]')); } catch { return []; }
}
function rememberGame(entry) {
  const list = hostGames().filter(g => g.code !== entry.code);
  list.unshift(entry);
  ls.set(LS_GAMES, JSON.stringify(list.slice(0, 10)));
}
export function forgetGame(code) {
  ls.set(LS_GAMES, JSON.stringify(hostGames().filter(g => g.code !== code)));
}
export function usedQuestions() {
  try { return JSON.parse(ls.get(LS_USED, '[]')); } catch { return []; }
}
export function markUsed(ids) {
  const all = Array.from(new Set([...usedQuestions(), ...ids]));
  ls.set(LS_USED, JSON.stringify(all.slice(-500)));
}

/* ── Création / lecture ────────────────────────────────────────────────── */

/** @param {{duree:number}} cfg */
export async function createGame(cfg) {
  let code = makeCode();
  for (let tries = 0; tries < 5; tries++) {
    const snap = await getDoc(gameRef(code));
    if (!snap.exists()) break;
    code = makeCode();
  }
  const { ids, coquineIdx } = tirerPartie({
    duree: cfg.duree, exclude: usedQuestions(), pool: limitePool()
  });

  const data = {
    code, hostUid: uid(), createdAt: serverTimestamp(),
    status: 'lobby', duree: cfg.duree,
    // Figé à la création depuis le plan de l'HÔTE : c'est lui qui paie, les invités
    // en profitent. Relire le plan chez l'invité donnerait la limite gratuite à tous.
    maxJoueurs: maxJoueurs(),
    ids, coquineIdx,
    live: { idx: -1, scores: {}, joues: [], departages: 0 },
    bc: null
  };
  await setDoc(gameRef(code), data);
  rememberGame({ code, createdAt: Date.now(), duree: cfg.duree });
  return data;
}

export async function loadGame(code) {
  const snap = await getDoc(gameRef(code));
  return snap.exists() ? snap.data() : null;
}

export function watchGame(code, cb) {
  return onSnapshot(gameRef(code), s => cb(s.exists() ? s.data() : null),
    err => { console.warn('[escalier] watchGame', err); cb(null, err); });
}

export function watchPlayers(code, cb) {
  return onSnapshot(playersRef(code), s => cb(s.docs.map(d => ({ uid: d.id, ...d.data() }))),
    err => console.warn('[escalier] watchPlayers', err));
}

export async function listPlayers(code) {
  const s = await getDocs(playersRef(code));
  return s.docs.map(d => ({ uid: d.id, ...d.data() }));
}

export async function patchGame(code, patch) {
  await updateDoc(gameRef(code), patch);
}

export async function kickPlayer(code, u) {
  await deleteDoc(playerRef(code, u));
}

export async function deleteGame(code) {
  const [ps, gs] = await Promise.all([getDocs(playersRef(code)), getDocs(guessesRef(code))]);
  await Promise.all([...ps.docs, ...gs.docs].map(d => deleteDoc(d.ref)));
  await deleteDoc(gameRef(code));
  forgetGame(code);
}

/* ── Côté joueur ───────────────────────────────────────────────────────── */

export async function joinGame(code, { name, color }) {
  await setDoc(playerRef(code, uid()), { name, color, joinedAt: serverTimestamp() }, { merge: true });
  return uid();
}

export async function myPlayer(code) {
  const s = await getDoc(playerRef(code, uid()));
  return s.exists() ? { uid: uid(), ...s.data() } : null;
}

/** Envoie (ou corrige) le pourcentage du joueur pour la question `seq`. */
export async function sendGuess(code, { seq, value }) {
  await setDoc(guessRef(code, uid()), { seq, value, at: serverTimestamp() });
}

/** Côté hôte : écoute tous les pourcentages envoyés. */
export function watchGuesses(code, cb) {
  return onSnapshot(guessesRef(code), s => cb(s.docs.map(d => ({ uid: d.id, ...d.data() }))),
    err => console.warn('[escalier] watchGuesses', err));
}

export { uid };
