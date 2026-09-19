/* Attention à l'escalier — parcours du maître du jeu :
 * création → salon → plateau (écran partagé) → podium. */
import { $, $$, el, icon, iconHtml, esc, showScreen, showConfirmModal, toast, sfx, burst,
         copy, initiale, countUp, shake } from './util.js';
import { RULES } from './config.js';
import { uid } from './firebase.js';
import { createGame, loadGame, watchGame, watchPlayers, watchGuesses, patchGame, deleteGame,
         kickPlayer, hostGames, forgetGame, markUsed, usedQuestions } from './store.js';
import { tirerPartie, etageDe, ouvreEtage, departager, crediter, classement, enTete,
         questionDepartage, nbQuestions } from './game.js';
import { byId, enonce } from './data/questions.js';
import { PHASE, broadcast } from './live.js';
import { guard, isPremium, resume as planResume, limitePool, maxJoueurs, PRIX } from './plan.js';

/* ── État de la session hôte ──────────────────────────────────────── */
const S = {
  code: null, game: null, players: [], guesses: {},
  unsubs: [], timer: null, seq: 0,
  step: null,          // { kind, idx, qid, departage, candidats }
  scores: {}, joues: [], departages: 0,
  busy: false
};

function stopTimer() { if (S.timer) { clearInterval(S.timer); S.timer = null; } }

export function leaveHost() {
  S.unsubs.forEach(u => { try { u(); } catch {} });
  S.unsubs = [];
  stopTimer();
  S.step = null;
}

/* ═══════════════ PAYWALL ═══════════════ */
export function openPaywall(why = '') {
  $('#paywallWhy').textContent = why;
  $('#paywallPrice').textContent = PRIX;
  $('#paywall').classList.add('is-open');
}
$('#paywallCancel')?.addEventListener('click', () => $('#paywall').classList.remove('is-open'));
$('#paywall')?.addEventListener('click', e => { if (e.target.id === 'paywall') e.target.classList.remove('is-open'); });

/* ═══════════════ ACCUEIL : historique ═══════════════ */
export function renderHistory() {
  const list = hostGames();
  const box = $('#homeHistoryList');
  $('#homeHistory').hidden = !list.length;
  box.innerHTML = '';
  list.slice(0, 5).forEach(g => {
    const date = new Date(g.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    box.append(el('div', { class: 'history-item' },
      el('span', { class: 'mono' }, g.code),
      el('span', { class: 'grow' }, `${date} · ${g.duree || 45} min`),
      el('button', { class: 'btn btn-ghost btn-sm', onclick: () => { location.hash = '#/host/' + g.code; } }, 'Ouvrir'),
      el('button', { class: 'btn btn-ghost btn-sm', 'aria-label': 'Oublier', onclick: () => { forgetGame(g.code); renderHistory(); } }, icon('xmark'))
    ));
  });
}

/* ═══════════════ CRÉATION ═══════════════ */
let dureeChoisie = 45;

export function enterCreate() {
  dureeChoisie = 45;
  $$('#cardDuree .choice').forEach(c => {
    c.classList.toggle('is-on', c.dataset.value === '45');
    c.querySelector('.choice-lock')?.remove();
    if (!guard('duree', c.dataset.value).ok) c.append(el('span', { class: 'choice-lock' }, icon('lock')));
  });
  const r = planResume();
  $('#planBanner').hidden = isPremium();
  $('#planBannerTitle').textContent = r.titre;
  $('#planBannerLine').textContent = ' — ' + r.ligne;
  showScreen('screen-create');
}

$$('#cardDuree .choice').forEach(c => c.addEventListener('click', () => {
  const g = guard('duree', c.dataset.value);
  if (!g.ok) { openPaywall(g.why); return; }
  dureeChoisie = Number(c.dataset.value);
  $$('#cardDuree .choice').forEach(x => x.classList.toggle('is-on', x === c));
  sfx.tap();
}));
$('#btnPlanUpgrade')?.addEventListener('click', () => openPaywall(''));

$('#btnCreateGame')?.addEventListener('click', async () => {
  const btn = $('#btnCreateGame');
  btn.disabled = true;
  try {
    const g = await createGame({ duree: dureeChoisie });
    sfx.good();
    location.hash = '#/host/' + g.code;
  } catch (e) {
    console.error(e);
    toast("Impossible de créer la partie : " + (e.code || e.message), 'err');
  } finally { btn.disabled = false; }
});

/* ═══════════════ SALON ═══════════════ */
function lienJoueur(code) {
  return `${location.origin}${location.pathname}#/j/${code}`;
}

export async function enterLobby(code) {
  leaveHost();
  let game;
  try { game = await loadGame(code); } catch (e) { game = null; }
  if (!game) { toast('Partie introuvable.', 'err'); forgetGame(code); location.hash = '#/'; return; }
  if (game.hostUid !== uid()) {
    // Ce n'est pas l'appareil qui a créé la partie : on bascule en joueur.
    location.hash = '#/j/' + code; return;
  }
  S.code = code; S.game = game;
  S.scores = { ...(game.live?.scores || {}) };
  S.joues = [...(game.live?.joues || [])];
  S.departages = game.live?.departages || 0;
  S.seq = game.bc?.seq || 0;

  S.unsubs.push(watchGame(code, g => { if (g) S.game = g; }));
  S.unsubs.push(watchPlayers(code, ps => {
    S.players = ps.sort((a, b) => (a.joinedAt?.seconds || 0) - (b.joinedAt?.seconds || 0));
    renderLobbyPlayers();
    if ($('#screen-live').classList.contains('is-active')) { renderStairs($('#liveStairs'), true); renderAnswered(); }
    // Podium rouvert après un rafraîchissement : les joueurs arrivent après l'affichage.
    if (S.game?.status === 'fini' && $('#screen-podium').classList.contains('is-active')) showPodium({ calme: true });
  }));
  S.unsubs.push(watchGuesses(code, gs => {
    S.guesses = Object.fromEntries(gs.map(g => [g.uid, g]));
    renderAnswered();
  }));

  // Partie déjà lancée (rafraîchissement, retour) : on reprend directement le plateau.
  if (game.status === 'live') { enterLive(true); return; }
  if (game.status === 'fini') { showPodium(); return; }

  const url = lienJoueur(code);
  $('#lobbyUrl').textContent = `${location.host}${location.pathname.replace(/index\.html$/, '')}`;
  $('#lobbyCode').textContent = code;
  $('#btnLobbyCopy').onclick = async () => toast(await copy(url) ? 'Lien copié.' : url, 'ok');
  $('#btnLobbyShare').onclick = async () => {
    if (navigator.share) { try { await navigator.share({ title: "Attention à l'escalier", text: `Rejoins la partie ${code} !`, url }); } catch {} }
    else toast(await copy(url) ? 'Lien copié.' : url, 'ok');
  };
  publish({ phase: PHASE.ATTENTE });
  renderLobbyPlayers();
  showScreen('screen-lobby');
}

function renderLobbyPlayers() {
  const box = $('#lobbyList');
  if (!box) return;
  box.innerHTML = '';
  const max = S.game?.maxJoueurs || maxJoueurs();
  $('#lobbyCount').textContent = `${S.players.length} / ${max}`;
  $('#lobbyEmpty').hidden = S.players.length > 0;
  S.players.forEach(p => {
    box.append(el('span', { class: 'chip' }, pawn(p), p.name,
      el('button', { class: 'chip-x', 'aria-label': 'Retirer ' + p.name, onclick: () =>
        showConfirmModal(`Retirer ${p.name} de la partie ?`, () => kickPlayer(S.code, p.uid).catch(() => toast('Impossible de retirer ce joueur.', 'err')),
          { okLabel: 'Retirer', danger: true }) }, icon('xmark'))));
  });
}

function pawn(p) {
  const s = el('span', { class: 'pawn', title: p.name }, initiale(p.name));
  s.style.setProperty('--c', p.color || '#ffcf3f');
  return s;
}

$('#btnStartLive')?.addEventListener('click', async () => {
  if (!S.players.length) { toast("Attends qu'au moins un joueur ait rejoint.", 'err'); shake($('#lobbyList')); return; }
  const g = guard('joueurs', S.players.length);
  if (!g.ok) { openPaywall(g.why); return; }
  try {
    await patchGame(S.code, { status: 'live' });
    markUsed(S.game.ids);
    enterLive(false);
  } catch (e) { toast('Lancement impossible : ' + (e.code || e.message), 'err'); }
});

$('#btnDeleteGame')?.addEventListener('click', () => {
  showConfirmModal('Supprimer définitivement cette partie ? Les joueurs seront déconnectés.', async () => {
    try { await deleteGame(S.code); toast('Partie supprimée.', 'ok'); location.hash = '#/'; }
    catch (e) { toast('Suppression impossible : ' + (e.code || e.message), 'err'); }
  }, { okLabel: 'Supprimer', danger: true });
});

/* ═══════════════ PLATEAU ═══════════════ */

/** Publie un broadcast pour les téléphones. `seq` n'augmente qu'à chaque nouvelle question. */
function publish(fields, { nouvelleQuestion = false } = {}) {
  if (nouvelleQuestion) S.seq += 1;
  const bc = broadcast({ seq: S.seq, scores: S.scores, total: S.game?.ids?.length || 0, ...fields });
  return patchGame(S.code, { bc }).catch(e => console.warn('[escalier] broadcast', e));
}

/** Sauvegarde l'état de reprise (après chaque révélation). */
function persistLive(idx) {
  return patchGame(S.code, {
    live: { idx, scores: S.scores, joues: S.joues, departages: S.departages }
  }).catch(e => console.warn('[escalier] persistLive', e));
}

function enterLive(reprise) {
  showScreen('screen-live');
  renderStairs($('#liveStairs'), true);
  const idx = (S.game.live?.idx ?? -1) + 1;
  if (reprise) toast(idx > 0 ? `Reprise à la question ${idx + 1}.` : 'Partie reprise.', 'info');
  goQuestion(idx);
}

/** Enchaîne les cartons puis la question `idx` (ou la fin si idx dépasse le déroulé). */
function goQuestion(idx) {
  const total = S.game.ids.length;
  if (idx >= total) { finDePartie(); return; }
  if (ouvreEtage(idx, total)) { showEtage(idx); return; }
  if (idx === S.game.coquineIdx) { showCoquine(idx); return; }
  askQuestion({ idx, qid: S.game.ids[idx] });
}

function hideAll() {
  $('#liveCarton').hidden = true;
  $('#liveQ').hidden = true;
  stopTimer();
}

function header(idx) {
  const total = S.game.ids.length;
  const et = etageDe(Math.min(idx, total - 1), total);
  $('#liveEtage').textContent = S.step?.departage ? 'Départage' : `Étage ${et}`;
  $('#liveProgress').textContent = S.step?.departage ? 'Question bonus' : `Question ${Math.min(idx + 1, total)} / ${total}`;
}

function carton({ icone, titre, sous, coq = false }) {
  hideAll();
  const c = $('#liveCarton');
  c.hidden = false;
  c.classList.toggle('is-coq', coq);
  c.style.animation = 'none'; void c.offsetWidth; c.style.animation = '';
  $('#liveCartonIcon').innerHTML = iconHtml(icone);
  $('#liveCartonTitle').textContent = titre;
  $('#liveCartonSub').textContent = sous || '';
}

function showEtage(idx) {
  const total = S.game.ids.length;
  const et = etageDe(idx, total);
  S.step = { kind: 'etage', idx };
  header(idx);
  const sous = et === 1 ? 'On commence doucement… gare à la première marche.'
             : et === RULES.ETAGES ? 'Dernier étage ! Tout se joue maintenant.'
             : 'Ça grimpe. Accrochez-vous à la rampe.';
  carton({ icone: 'ranking-star', titre: `Étage ${et}`, sous });
  sfx.etage();
  setNext('C\'est parti', 'arrow-right');
  publish({ phase: PHASE.ETAGE, idx, etage: et });
}

function showCoquine(idx) {
  S.step = { kind: 'coquine', idx };
  header(idx);
  carton({ icone: 'fire', titre: "C'est l'heure de la question coquine !", sous: 'Les enfants, au lit.', coq: true });
  sfx.coquine();
  burst(50, ['#ff5fa2', '#ffd1e6', '#ffcf3f', '#ffffff']);
  setNext('Poser la question', 'fire');
  publish({ phase: PHASE.COQUINE, idx, etage: etageDe(idx, S.game.ids.length) });
}

function askQuestion({ idx, qid, departage = false, candidats = null }) {
  const q = byId[qid];
  if (!q) { toast('Question introuvable, on passe.', 'err'); goQuestion(idx + 1); return; }
  S.step = { kind: 'question', idx, qid, departage, candidats };
  hideAll();
  header(idx);

  const card = $('#liveQ');
  card.hidden = false;
  card.classList.toggle('is-coq', !!q.coq);
  card.classList.remove('is-reveal');
  card.style.animation = 'none'; void card.offsetWidth; card.style.animation = '';
  $('#liveCoqBadge').hidden = !q.coq;
  $('#livePop').textContent = q.pop;
  $('#liveTexte').textContent = 'combien ' + q.q;
  $('#liveAsk').hidden = false;
  $('#liveReveal').hidden = true;

  publish({ phase: PHASE.QUESTION, idx, etage: etageDe(idx, S.game.ids.length), qid, pop: q.pop,
            texte: 'combien ' + q.q, coquine: !!q.coq, secondes: RULES.SECONDES_REPONSE,
            departage, candidats }, { nouvelleQuestion: true });
  renderAnswered();

  let reste = RULES.SECONDES_REPONSE;
  const tick = () => {
    $('#liveTimer').textContent = reste;
    $('#liveTimerWrap').style.setProperty('--p', reste / RULES.SECONDES_REPONSE);
    $('#liveTimerWrap').classList.toggle('is-low', reste <= 5);
    if (reste <= 5 && reste > 0) sfx.tick();
  };
  tick();
  S.timer = setInterval(() => {
    reste -= 1; tick();
    if (reste <= 0) { stopTimer(); verrouiller(); }
  }, 1000);
  setNext('Révéler', 'lock-open');
}

/** Temps écoulé : les téléphones se figent, le maître du jeu garde la main pour le suspense. */
function verrouiller() {
  if (S.step?.kind !== 'question') return;
  S.step.kind = 'verrou';
  $('#liveTimer').textContent = '0';
  publish({ phase: PHASE.VERROU, idx: S.step.idx, qid: S.step.qid, departage: S.step.departage,
            candidats: S.step.candidats, coquine: !!byId[S.step.qid]?.coq });
}

function joueursConcernes() {
  const c = S.step?.candidats;
  return c ? S.players.filter(p => c.includes(p.uid)) : S.players;
}

/** Réponses valides pour la question en cours (bon `seq`, joueur concerné). */
function reponsesCourantes() {
  const ok = new Set(joueursConcernes().map(p => p.uid));
  const out = {};
  for (const [u, g] of Object.entries(S.guesses)) {
    if (g.seq === S.seq && ok.has(u) && Number.isFinite(Number(g.value))) out[u] = Number(g.value);
  }
  return out;
}

function renderAnswered() {
  const box = $('#liveAnswered');
  if (!box || !S.step || (S.step.kind !== 'question' && S.step.kind !== 'verrou')) return;
  const rep = reponsesCourantes();
  const ps = joueursConcernes();
  box.innerHTML = '';
  ps.forEach(p => { const pw = pawn(p); if (p.uid in rep) pw.classList.add('is-in'); box.append(pw); });
  $('#liveAnsweredN').textContent = Object.keys(rep).length;
  $('#liveAnsweredT').textContent = ps.length;
  // Tout le monde a répondu : on raccourcit l'attente à 3 secondes.
  if (S.step.kind === 'question' && ps.length && Object.keys(rep).length === ps.length && S.timer) {
    const cur = Number($('#liveTimer').textContent);
    if (cur > 3) {
      stopTimer();
      let reste = 3;
      $('#liveTimer').textContent = reste;
      S.timer = setInterval(() => { reste -= 1; $('#liveTimer').textContent = Math.max(0, reste);
        if (reste <= 0) { stopTimer(); verrouiller(); } }, 1000);
    }
  }
}

async function reveler() {
  const st = S.step;
  if (!st || (st.kind !== 'question' && st.kind !== 'verrou')) return;
  stopTimer();
  const q = byId[st.qid];
  const rep = reponsesCourantes();
  const res = departager(rep, q.a);
  const points = q.coq ? RULES.POINTS_COQUINE : RULES.POINTS;
  S.scores = crediter(S.scores, res.gagnants, points);
  S.joues.push(st.qid);
  st.kind = 'reveal';

  // Sauvegarde AVANT la diffusion : un rafraîchissement ne peut plus compter deux fois
  // la même question (la reprise enchaîne sur la suivante).
  if (st.departage) S.departages += 1;
  await persistLive(st.departage ? S.game.ids.length - 1 : st.idx);
  publish({ phase: PHASE.REVEAL, idx: st.idx, qid: st.qid, pop: q.pop, texte: 'combien ' + q.q,
            coquine: !!q.coq, departage: st.departage, candidats: st.candidats,
            verite: q.a, src: q.src, note: q.note || null,
            reponses: rep, gagnants: res.gagnants, ecarts: res.ecarts });

  animerRevelation(q, rep, res, points);
  const dernier = !st.departage && st.idx >= S.game.ids.length - 1;
  setNext(dernier || st.departage ? 'Voir la suite' : 'Question suivante', 'arrow-right');
}

function nomDe(u) { return S.players.find(p => p.uid === u)?.name || '?'; }

function listeNoms(uids) {
  const n = uids.map(nomDe);
  return n.length <= 1 ? n.join('') : n.slice(0, -1).join(', ') + ' et ' + n[n.length - 1];
}

function animerRevelation(q, rep, res, points) {
  $('#liveAsk').hidden = true;
  $('#liveReveal').hidden = false;
  // Énoncé réduit à la révélation : la jauge et le classement doivent tenir à l'écran.
  $('#liveQ').classList.add('is-reveal');
  const fill = $('#liveGaugeFill');
  fill.style.transition = 'none'; fill.style.width = '0'; void fill.offsetWidth; fill.style.transition = '';

  // Marqueurs des joueurs sur la jauge (décalés en hauteur s'ils se chevauchent).
  const marks = $('#liveGaugeMarks');
  marks.innerHTML = '';
  const pris = [];
  Object.entries(rep).sort((a, b) => a[1] - b[1]).forEach(([u, v]) => {
    const p = S.players.find(x => x.uid === u) || { uid: u, name: '?' };
    let lift = 0;
    while (pris.some(x => x.lift === lift && Math.abs(x.v - v) < 4)) lift++;
    pris.push({ v, lift });
    const m = el('div', { class: 'gauge-mark' }, pawn(p));
    m.style.left = v + '%';
    m.style.setProperty('--c', p.color);
    m.style.transform = `translate(-50%, ${-lift * 22}px)`;
    marks.append(m);
    m.dataset.uid = u;
  });

  $('#liveWinner').innerHTML = '<span class="mono">…</span>';
  $('#liveSource').textContent = '';
  $('#liveRanking').innerHTML = '';
  sfx.roll(20);
  requestAnimationFrame(() => { fill.style.width = q.a + '%'; });
  countUp($('#liveVerite'), q.a, { ms: 1600 }).then(() => {
    // Qui est le plus proche : phrase en clair + classement complet des réponses.
    const w = $('#liveWinner');
    if (!res.gagnants.length) {
      w.textContent = 'Personne n\'a répondu : la marche reste vide.';
      sfx.bad();
    } else {
      const ecart = res.meilleur;
      const val = rep[res.gagnants[0]];
      const pl = res.gagnants.length > 1;
      const detail = ecart === 0 ? 'pile poil !' : `à ${ecart} point${ecart > 1 ? 's' : ''}`;
      w.innerHTML = `${iconHtml('circle-check')} Le${pl ? 's' : ''} plus proche${pl ? 's' : ''} : `
        + `<strong>${esc(listeNoms(res.gagnants))}</strong>`
        + (pl ? ` <span class="ecart">(${detail})</span>` : ` avec ${val} % <span class="ecart">(${detail})</span>`)
        + `<br><small>+${points} marche${points > 1 ? 's' : ''}${pl ? ' chacun' : ''}</small>`;
      sfx.step();
      if (ecart === 0) burst(120);
      $$('.gauge-mark', marks).forEach(m => m.classList.toggle('is-win', res.gagnants.includes(m.dataset.uid)));
    }
    renderRanking(rep, res);
    $('#liveSource').textContent = `Source : ${q.src}.` + (q.note ? ' ' + q.note : '');
    renderStairs($('#liveStairs'), true);
  });
}

/** Toutes les réponses, triées de la plus proche à la plus éloignée ; le(s) gagnant(s) en vert. */
function renderRanking(rep, res) {
  const box = $('#liveRanking');
  box.innerHTML = '';
  const ps = joueursConcernes();
  const lignes = ps.map(p => ({ p, v: rep[p.uid], e: res.ecarts[p.uid] }))
    .sort((a, b) => (a.e ?? 999) - (b.e ?? 999));
  lignes.forEach(({ p, v, e }, i) => {
    const win = res.gagnants.includes(p.uid);
    const item = el('span', { class: 'reveal-item' + (win ? ' is-win' : '') + (v === undefined ? ' is-none' : '') },
      pawn(p), `${p.name} : ${v === undefined ? '—' : v + ' %'}`,
      el('span', { class: 'ecart' }, v === undefined ? 'pas de réponse' : (e === 0 ? 'pile !' : `écart ${e}`)));
    item.style.animationDelay = (i * 0.06) + 's';
    box.append(item);
  });
}

/** Fin du déroulé : départage si égalité en tête, sinon podium. */
function finDePartie() {
  const tete = enTete(S.scores, S.players);
  if (tete.length > 1 && S.departages < RULES.DEPARTAGES_MAX && S.players.length > 1) {
    const qid = questionDepartage([...S.game.ids, ...S.joues]);
    if (qid) {
      S.step = { kind: 'dep-carton', idx: S.game.ids.length - 1, qid, departage: true, candidats: tete };
      carton({ icone: 'stopwatch', titre: 'Départage !', sous: `${listeNoms(tete)} sont à égalité en haut de l'escalier. Une question pour tout décider.` });
      $('#liveEtage').textContent = 'Départage';
      $('#liveProgress').textContent = 'Question bonus';
      sfx.etage();
      setNext('Question de départage', 'stopwatch');
      publish({ phase: PHASE.ETAGE, idx: S.step.idx, departage: true, candidats: tete });
      return;
    }
  }
  terminer();
}

async function terminer() {
  stopTimer();
  S.step = { kind: 'fini' };
  await patchGame(S.code, { status: 'fini', live: { idx: S.game.ids.length, scores: S.scores, joues: S.joues, departages: S.departages } })
    .catch(() => {});
  publish({ phase: PHASE.FINI, idx: S.game.ids.length });
  showPodium();
}

function showPodium({ calme = false } = {}) {
  const c = classement(S.scores, S.players);
  const tete = c.filter(l => l.rang === 1);
  if (!c.length) { $('#podiumTitle').textContent = 'Partie terminée'; $('#podiumLine').textContent = ''; }
  else if (tete.length === 1) {
    $('#podiumTitle').textContent = `${tete[0].name} gagne !`;
    $('#podiumLine').textContent = `${tete[0].score} marche${tete[0].score > 1 ? 's' : ''} grimpée${tete[0].score > 1 ? 's' : ''}. Tout en haut de l'escalier, sans trébucher.`;
  } else {
    $('#podiumTitle').textContent = 'Égalité au sommet !';
    $('#podiumLine').textContent = `${listeNoms(tete.map(l => l.uid))} partagent la dernière marche.`;
  }
  renderStairs($('#podiumStairs'), false);
  const board = $('#podiumBoard');
  board.innerHTML = '';
  c.forEach(l => board.append(el('div', { class: 'podium-row' },
    el('span', { class: 'rang' }, l.rang), pawn(l), el('span', { class: 'grow' }, l.name),
    el('span', { class: 'mono' }, `${l.score} marche${l.score > 1 ? 's' : ''}`))));
  if (calme) return;
  showScreen('screen-podium');
  sfx.win(); burst(140);
}

/** Rejouer : même code, mêmes joueurs, nouveau tirage — les téléphones suivent seuls. */
$('#btnReplay')?.addEventListener('click', async () => {
  let duree = S.game.duree;
  if (!guard('duree', duree).ok) duree = 45;
  const { ids, coquineIdx } = tirerPartie({ duree, exclude: usedQuestions(), pool: limitePool() });
  S.scores = {}; S.joues = []; S.departages = 0;
  try {
    await patchGame(S.code, { status: 'lobby', duree, ids, coquineIdx,
      live: { idx: -1, scores: {}, joues: [], departages: 0 } });
    S.game = { ...S.game, status: 'lobby', duree, ids, coquineIdx, live: { idx: -1, scores: {}, joues: [], departages: 0 } };
    enterLobby(S.code);
  } catch (e) { toast('Impossible de relancer : ' + (e.code || e.message), 'err'); }
});

/* ── Bouton principal du plateau ──────────────────────────────────── */
function setNext(label, ic) {
  $('#btnLiveNext').innerHTML = `${esc(label)} ${iconHtml(ic)}`;
}

async function suivant() {
  if (S.busy || !S.step) return;
  S.busy = true;
  try {
    const st = S.step;
    sfx.tap();
    switch (st.kind) {
      case 'etage':
        if (st.idx === S.game.coquineIdx) showCoquine(st.idx);
        else askQuestion({ idx: st.idx, qid: S.game.ids[st.idx] });
        break;
      case 'coquine':
        askQuestion({ idx: st.idx, qid: S.game.ids[st.idx] });
        break;
      case 'question':
      case 'verrou':
        await reveler();
        break;
      case 'reveal':
        if (st.departage) finDePartie();
        else goQuestion(st.idx + 1);
        break;
      case 'dep-carton':
        askQuestion({ idx: st.idx, qid: st.qid, departage: true, candidats: st.candidats });
        break;
    }
  } finally { setTimeout(() => { S.busy = false; }, 350); }
}
$('#btnLiveNext')?.addEventListener('click', suivant);

$('#btnLiveQuit')?.addEventListener('click', () => {
  showConfirmModal('Terminer la partie maintenant et afficher le podium ?', () => terminer(),
    { okLabel: 'Terminer', danger: true });
});

/* Raccourcis clavier du maître du jeu : Espace / Entrée pour avancer. */
document.addEventListener('keydown', e => {
  if (!$('#screen-live').classList.contains('is-active')) return;
  if (e.target.matches('input, textarea') || $('.modal.is-open')) return;
  if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); suivant(); }
});

/* ═══════════════ L'ESCALIER DES SCORES ═══════════════ */
/**
 * Dessine l'escalier : une marche par point, les pions posés sur la marche de leur
 * score. Hauteur minimale de 8 marches pour que l'escalier existe dès le début.
 */
export function renderStairs(box, legende) {
  if (!box) return;
  const scores = S.scores;
  const max = Math.max(0, ...S.players.map(p => scores[p.uid] || 0));
  const n = Math.max(8, max + 2);
  box.innerHTML = '';
  for (let i = 0; i <= n; i++) {
    const st = el('div', { class: 'stair' }, el('span', { class: 'stair-n' }, i || ''));
    st.style.setProperty('--h', (i / n) * 100 * 0.8);
    const ici = S.players.filter(p => (scores[p.uid] || 0) === i);
    if (ici.length) st.append(el('div', { class: 'stair-pawns' }, ici.map(pawn)));
    box.append(st);
  }
  if (legende) {
    const wrap = box.parentElement.querySelector('.stairs-legend') || el('div', { class: 'stairs-legend' });
    wrap.innerHTML = '';
    classement(scores, S.players).forEach(l => wrap.append(el('div', { class: 'legend-row' },
      pawn(l), el('span', { class: 'grow' }, l.name), el('span', { class: 'n' }, l.score))));
    if (!wrap.parentElement) box.after(wrap);
  }
}

export { nbQuestions };
