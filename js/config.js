/* Attention à l'escalier — configuration.
 *
 * Clés Firebase : publiques par nature (SDK web), la sécurité réelle est dans
 * firestore.rules. À remplir après création du projet Firebase dédié
 * (Console → Paramètres du projet → Vos applications → Web).
 * Tant que `projectId` est vide, l'app affiche un message explicite au démarrage
 * au lieu de planter dans le SDK.
 */
export const firebaseConfig = {
  apiKey: "AIzaSyAnefT77oC0HrYEXmw7j1NvYyehU06S33o",
  authDomain: "attention-a-l-escalier.firebaseapp.com",
  projectId: "attention-a-l-escalier",
  storageBucket: "attention-a-l-escalier.firebasestorage.app",
  messagingSenderId: "387208712285",
  appId: "1:387208712285:web:3e3aebaf53bab5ef8dbdb4"
};

/* Réglages de jeu globaux — seul endroit où vivent les constantes de rythme. */
export const RULES = {
  /** Nombre de questions par durée visée (≈ 80 s par question, révélation comprise). */
  QUESTIONS_PAR_DUREE: { 45: 32, 60: 42 },
  /** Découpage en étages : la partie se joue en 3 paliers annoncés à l'écran. */
  ETAGES: 3,
  /** Temps laissé aux téléphones pour répondre. */
  SECONDES_REPONSE: 30,
  /** Marches gagnées par le plus proche (égalité : chacun la sienne). */
  POINTS: 1,
  POINTS_COQUINE: 1,
  /** La question coquine tombe dans cette fraction de la partie (jamais en ouverture). */
  COQUINE_ENTRE: [0.55, 0.85],
  /** Questions de départage en cas d'égalité à la fin, avant de déclarer l'ex æquo. */
  DEPARTAGES_MAX: 3,
  MAX_JOUEURS: 12
};

/** Couleurs de pions attribuées dans l'ordre d'arrivée. */
export const PIONS = ['#ffcf3f', '#ff5fa2', '#3fd0ff', '#7dff6a', '#ff8a3d', '#c08bff',
                      '#ff4d4d', '#40ffd2', '#ffe9a8', '#9aa7ff', '#ffa3c7', '#b8ff3d'];
