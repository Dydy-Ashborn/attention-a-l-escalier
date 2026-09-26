/* Bibi step — parcours joueur : rejoindre → manette téléphone. */
import { $, el, icon, iconHtml, esc, showScreen, toast, sfx, burst, initiale, ls, shake } from './util.js';
import { PIONS } from './config.js';
import { uid } from './firebase.js';
import { loadGame, watchGame, watchPlayers, joinGame, myPlayer, listPlayers, sendGuess } from './store.js';
import { pourcent, classement } from './game.js';
import { PHASE, peutRepondre } from './live.js';

const P = { code: null, me: null, players: [], unsubs: [], lastSeq: -1, lastPhase: null,
            value: 50, sent: null, timer: null, bc: null };

function stopTimer() { if (P.timer) { clearInterval(P.timer); P.timer = null; } }

export function leavePlayer() {
  P.unsubs.forEach(u => { try { u(); } catch {} });
  P.unsubs = [];
  stopTimer();
  P.lastSeq = -1; P.lastPhase = null; P.bc = null;
}

/* ═══════════════ REJOINDRE ═══════════════ */
export async function enterJoin(code) {
  leavePlayer();
  let game = null;
  try { game = await loadGame(code); } catch {}
  if (!game) { toast(`Aucune partie avec le code ${code}.`, 'err'); location.hash = '#/'; return; }
  P.code = code;

  const moi = await myPlayer(code).catch(() => null);
  if (moi) { P.me = moi; startPlay(); return; }

  $('#joinCode').textContent = code;
  $('#joinMeta').textContent = game.status === 'lobby'
    ? 'La partie va bientôt commencer. Choisis ton prénom.'
    : 'La partie a déjà commencé : tu prends le train en marche, à partir de la marche 0.';
  $('#inputName').value = ls.get('escalier.name', '');
  showScreen('screen-join');
  setTimeout(() => $('#inputName').focus(), 300);
}

$('#btnJoinConfirm')?.addEventListener('click', async () => {
  const name = $('#inputName').value.trim().replace(/\s+/g, ' ');
  if (name.length < 2) { toast('Ton prénom, au moins deux lettres.', 'err'); shake($('#inputName')); return; }
  const btn = $('#btnJoinConfirm');
  btn.disabled = true;
  try {
    const [game, ps] = await Promise.all([loadGame(P.code), listPlayers(P.code)]);
    const max = game?.maxJoueurs || 4;
    if (ps.length >= max) {
      toast(`La partie est complète (${max} joueurs max).`, 'err');
      return;
    }
    if (ps.some(p => p.name.toLowerCase() === name.toLowerCase())) {
      toast('Ce prénom est déjà pris, ajoute une initiale.', 'err');
      return;
    }
    const prises = new Set(ps.map(p => p.color));
    const color = PIONS.find(c => !prises.has(c)) || PIONS[ps.length % PIONS.length];
    await joinGame(P.code, { name, color });
    ls.set('escalier.name', name);
    P.me = { uid: uid(), name, color };
    sfx.good();
    startPlay();
  } catch (e) {
    toast('Impossible de rejoindre : ' + (e.code || e.message), 'err');
  } finally { btn.disabled = false; }
});
$('#inputName')?.addEventListener('keydown', e => { if (e.key === 'Enter') $('#btnJoinConfirm').click(); });

/* ═══════════════ MANETTE ═══════════════ */
function startPlay() {
  const pw = el('span', { class: 'pawn' }, initiale(P.me.name));
  pw.style.setProperty('--c', P.me.color);
  $('#playMe').replaceChildren(pw, P.me.name);
  showScreen('screen-play');
  vue('wait', 'Tu es dans la partie !', "Regarde l'écran du maître du jeu.");

  P.unsubs.push(watchPlayers(P.code, ps => {
    P.players = ps;
    // Retiré par le maître du jeu : on revient à l'écran pour rejoindre.
    if (!ps.some(p => p.uid === uid())) {
      toast('Tu as été retiré de la partie.', 'err');
      leavePlayer();
      location.hash = '#/';
    }
  }));
  P.unsubs.push(watchGame(P.code, g => {
    if (!g) { toast('La partie a été supprimée.', 'err'); leavePlayer(); location.hash = '#/'; return; }
    rendre(g.bc);
  }));
}

function vue(which, titre, ligne) {
  $('#playWait').hidden = which !== 'wait';
  $('#playAsk').hidden = which !== 'ask';
  $('#playResult').hidden = which !== 'result';
  if (which === 'wait') {
    $('#playWaitTitle').textContent = titre || '';
    $('#playWaitLine').textContent = ligne || '';
  }
}

function majScore(bc) {
  const s = (bc?.scores || {})[uid()] || 0;
  $('#playScore').textContent = `${s} marche${s > 1 ? 's' : ''}`;
}

function rendre(bc) {
  P.bc = bc;
  majScore(bc);
  if (!bc) { vue('wait', 'Tu es dans la partie !', "Regarde l'écran du maître du jeu."); return; }
  // Même état déjà affiché (autre champ du doc modifié) : on ne réinitialise pas la saisie.
  const cle = bc.seq + ':' + bc.phase;
  if (cle === P.lastPhase) return;
  P.lastPhase = cle;
  stopTimer();

  switch (bc.phase) {
    case PHASE.ATTENTE:
      vue('wait', 'Tu es dans la partie !', 'Le maître du jeu va lancer la partie. Prépare tes pouces.');
      break;
    case PHASE.ETAGE:
      vue('wait', bc.departage ? 'Départage !' : `Étage ${bc.etage}`,
        bc.departage ? (bc.candidats?.includes(uid()) ? 'Tu joues le départage : sois précis !' : 'Égalité en tête : place au départage.')
                     : 'Nouvel étage, on continue de grimper.');
      sfx.etage();
      break;
    case PHASE.COQUINE:
      vue('wait', "C'est l'heure de la question coquine !", 'Regarde bien l\'écran…');
      sfx.coquine();
      burst(40, ['#ff5fa2', '#ffd1e6', '#ffcf3f']);
      break;
    case PHASE.QUESTION:
      afficherQuestion(bc);
      break;
    case PHASE.VERROU:
      vue('wait', 'Temps écoulé !', P.sent !== null && P.lastSeq === bc.seq
        ? `Tu as répondu ${P.sent} %. Suspense…` : 'Trop tard pour celle-ci. Suspense…');
      break;
    case PHASE.REVEAL:
      afficherResultat(bc);
      break;
    case PHASE.FINI:
      afficherFin(bc);
      break;
  }
}

function afficherQuestion(bc) {
  const nouvelle = bc.seq !== P.lastSeq;
  if (nouvelle) { P.lastSeq = bc.seq; P.value = 50; P.sent = null; }
  $('#playCoq').hidden = !bc.coquine;
  $('#playPop').textContent = bc.pop;
  $('#playTexte').textContent = bc.texte;

  const actif = peutRepondre(bc, uid());
  $('#playSpectate').hidden = actif;
  $('#playSpectate').textContent = actif ? '' : 'Question de départage : seuls les joueurs à égalité répondent.';
  ['#btnMinus', '#btnPlus', '#playRange', '#btnSend'].forEach(s => { $(s).disabled = !actif; });
  majValeur(P.value);
  $('#playSent').hidden = P.sent === null;
  vue('ask');
  if (nouvelle && actif) sfx.tap();

  // Chrono local, lancé à la réception : les horloges des téléphones ne sont pas
  // synchronisées avec celle de l'écran maître, on ne compare donc jamais d'heures.
  let reste = bc.secondes || 30;
  const aff = () => { $('#playTimer').textContent = actif ? `· ${reste}s` : ''; };
  aff();
  P.timer = setInterval(() => {
    reste -= 1; aff();
    if (reste <= 0) { stopTimer(); ['#btnMinus', '#btnPlus', '#playRange', '#btnSend'].forEach(s => { $(s).disabled = true; }); }
  }, 1000);
}

function majValeur(v) {
  P.value = pourcent(v) ?? 50;
  $('#playValue').textContent = P.value;
  const r = $('#playRange');
  r.value = P.value;
  // Remplissage doré de la piste jusqu'au curseur (lu par .range::-webkit-slider-runnable-track).
  r.style.setProperty('--p', P.value + '%');
}

$('#playRange')?.addEventListener('input', e => majValeur(e.target.value));
let repeat = null;
function nudge(d) { majValeur(P.value + d); sfx.tick(); }
[['#btnMinus', -1], ['#btnPlus', 1]].forEach(([sel, d]) => {
  const b = $(sel);
  if (!b) return;
  // Appui long : défilement rapide, sinon atteindre 87 % au bouton serait pénible.
  b.addEventListener('pointerdown', () => {
    nudge(d);
    clearInterval(repeat);
    const t0 = Date.now();
    repeat = setInterval(() => nudge(Date.now() - t0 > 1200 ? d * 5 : d), 120);
  });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => b.addEventListener(ev, () => clearInterval(repeat)));
});

$('#btnSend')?.addEventListener('click', async () => {
  const bc = P.bc;
  if (!peutRepondre(bc, uid())) return;
  const btn = $('#btnSend');
  btn.disabled = true;
  try {
    await sendGuess(P.code, { seq: bc.seq, value: P.value });
    P.sent = P.value;
    $('#playSent').hidden = false;
    sfx.good();
  } catch (e) {
    toast("Réponse non envoyée, réessaie : " + (e.code || e.message), 'err');
  } finally { if (P.timer) btn.disabled = false; }
});

function afficherResultat(bc) {
  const rep = bc.reponses || {};
  const mine = rep[uid()];
  const concerne = !bc.departage || (bc.candidats || []).includes(uid());
  const gagne = (bc.gagnants || []).includes(uid());
  const ecart = (bc.ecarts || {})[uid()];

  const labels = document.querySelectorAll('#playResult .play-compare .field-label');
  labels[0].textContent = 'Toi';
  labels[1].textContent = 'La vraie stat';
  $('#playMine').textContent = mine === undefined ? '—' : mine + ' %';
  $('#playTruth').textContent = bc.verite + ' %';
  const ico = $('#playResultIcon');
  if (gagne) {
    ico.innerHTML = iconHtml(ecart === 0 ? 'crown' : 'circle-check');
    $('#playResultTitle').textContent = ecart === 0 ? 'Pile poil !' : 'Tu montes une marche !';
    sfx.step(); burst(ecart === 0 ? 120 : 60);
  } else {
    ico.innerHTML = iconHtml('circle-xmark');
    $('#playResultTitle').textContent = !concerne ? 'Départage' : mine === undefined ? 'Pas de réponse' : `Raté de ${ecart} point${ecart > 1 ? 's' : ''}`;
    if (concerne) sfx.bad();
  }

  // Le ou les plus proches, avec LEUR réponse uniquement : les autres joueurs
  // ne voient jamais les pourcentages de tout le monde sur leur téléphone.
  const g = bc.gagnants || [];
  const box = $('#playClosestList');
  box.replaceChildren();
  $('#playClosest').hidden = !g.length;
  $('#playClosestLabel').textContent = g.length > 1 ? 'Les plus proches, ex æquo' : 'Le plus proche';
  g.forEach(u => {
    const p = P.players.find(x => x.uid === u) || { name: '?', color: '#ffcf3f' };
    const pw = el('span', { class: 'pawn' }, initiale(p.name));
    pw.style.setProperty('--c', p.color);
    const e = (bc.ecarts || {})[u];
    box.append(el('div', { class: 'play-closest-row' },
      pw,
      el('span', { class: 'grow' }, u === uid() ? `${p.name} (toi)` : p.name),
      el('span', {}, el('strong', {}, `${rep[u]} %`), ' ',
        el('small', {}, e === 0 ? 'pile !' : `à ${e} pt${e > 1 ? 's' : ''}`))));
  });

  $('#playResultLine').innerHTML = (g.length ? '' : 'Personne n\'a répondu. ')
    + `<small>Source : ${esc(bc.src || '')}${bc.note ? '. ' + esc(bc.note) : ''}</small>`;
  vue('result');
}

function afficherFin(bc) {
  $('#playClosest').hidden = true;   // bloc propre à la révélation, pas au récap final
  const c = classement(bc.scores || {}, P.players.map(p => ({ uid: p.uid, name: p.name, color: p.color })));
  const moi = c.find(l => l.uid === uid());
  const premier = moi && moi.rang === 1;
  $('#playResultIcon').innerHTML = iconHtml(premier ? 'trophy' : 'ranking-star');
  $('#playResultTitle').textContent = premier ? 'Tu es tout en haut !' : `${moi ? moi.rang : '?'}e place`;
  $('#playMine').textContent = (moi?.score || 0) + '';
  $('#playTruth').textContent = (c[0]?.score || 0) + '';
  $('#playResultLine').textContent = premier
    ? 'Victoire ! Le maître du jeu peut relancer une partie avec les mêmes joueurs.'
    : `Le sommet : ${c.filter(l => l.rang === 1).map(l => l.name).join(', ')}. Revanche ?`;
  // Libellés adaptés à l'écran de fin (marches au lieu de pourcentages).
  document.querySelectorAll('#playResult .play-compare .field-label')[0].textContent = 'Tes marches';
  document.querySelectorAll('#playResult .play-compare .field-label')[1].textContent = 'Le sommet';
  vue('result');
  if (premier) { sfx.win(); burst(140); }
}
