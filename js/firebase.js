/* Initialisation Firebase + auth anonyme.
 * Un seul point d'entrée : `ready()` résout quand l'utilisateur anonyme existe. */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js';
import { getAuth, signInAnonymously, onAuthStateChanged }
  from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';
import { firebaseConfig } from './config.js';

export const configure = !!firebaseConfig.projectId;

// Sans projet renseigné, on n'initialise rien : le SDK lèverait une erreur obscure
// au premier appel. `app.js` affiche un message clair à la place.
const app = configure ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : null;
export const db   = app ? getFirestore(app) : null;

let resolveReady, rejectReady;
const readyPromise = new Promise((res, rej) => { resolveReady = res; rejectReady = rej; });
readyPromise.catch(() => {});   // le rejet est lu par app.js ; évite l'avertissement « unhandled »

if (auth) {
  onAuthStateChanged(auth, user => { if (user) resolveReady(user); });
  signInAnonymously(auth).catch(err => {
    console.error('[escalier] auth anonyme refusée', err);
    rejectReady(err);
  });
} else {
  rejectReady(new Error('firebase-non-configure'));
}

/** @returns {Promise<import('firebase/auth').User>} */
export function ready() { return readyPromise; }
export function uid() { return auth && auth.currentUser ? auth.currentUser.uid : null; }
