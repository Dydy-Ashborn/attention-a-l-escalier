/* Attention à l'escalier — contrat de diffusion entre l'écran maître et les téléphones.
 *
 * L'hôte publie un « broadcast » dans games/{code}.bc à chaque changement d'état.
 * Champ séparé de `live` (l'état de reprise) : `live` est réécrit en bloc à chaque
 * sauvegarde et emporterait la diffusion avec lui (piège vécu sur Bibi Love).
 *
 * Les téléphones l'écoutent et se rendent seuls ; chaque joueur renvoie son
 * pourcentage dans games/{code}/guesses/{uid} avec le `seq` courant. Un envoi au
 * `seq` périmé (téléphone en retard, reconnexion) est ignoré par l'hôte.
 *
 * SECRET : le doc de partie est lisible par tous les joueurs. En phase QUESTION,
 * ni `verite`, ni `reponses`, ni `src` ne doivent y figurer — ils ne sont écrits
 * qu'à la révélation.
 */

export const PHASE = {
  ATTENTE:  'attente',   // salon : la partie n'a pas commencé
  ETAGE:    'etage',     // carton « Étage 2 »
  COQUINE:  'coquine',   // carton « C'est l'heure de la question coquine ! »
  QUESTION: 'question',  // question posée, les téléphones répondent
  VERROU:   'verrou',    // temps écoulé : plus de réponses, suspense avant révélation
  REVEAL:   'reveal',    // vraie valeur + plus proche(s)
  FINI:     'fini'       // podium
};

/** Construit un broadcast. Aucune valeur `undefined` : Firestore les refuse. */
export function broadcast({
  seq, phase, idx = 0, total = 0, etage = 1,
  qid = null, pop = null, texte = null, coquine = false,
  secondes = 0, departage = false, candidats = null,
  verite = null, src = null, note = null,
  reponses = null, gagnants = null, ecarts = null,
  scores = null
}) {
  return {
    seq, phase, idx, total, etage,
    qid, pop, texte, coquine,
    secondes, departage, candidats,
    verite, src, note, reponses, gagnants, ecarts,
    scores: scores || {}, at: Date.now()
  };
}

/** Ce téléphone peut-il répondre à la question en cours ? */
export function peutRepondre(bc, monUid) {
  if (!bc || bc.phase !== PHASE.QUESTION) return false;
  if (bc.departage && Array.isArray(bc.candidats)) return bc.candidats.includes(monUid);
  return true;
}
