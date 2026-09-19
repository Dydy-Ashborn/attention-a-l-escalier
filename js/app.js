/* Attention à l'escalier — routeur et amorçage. */
import { $, iconHtml, showScreen, toast, sfx, toggleMute, isMuted, copy, burst, ls } from './util.js';
import { ready, uid, configure } from './firebase.js';
import { enterCreate, enterLobby, renderHistory, leaveHost, openPaywall } from './host.js';
import { enterJoin, leavePlayer } from './player.js';
import { refreshPremium, isPremium, diagPremium, resume as planResume,
         PRIX, LIEN_PAIEMENT, urlPaiement, attendrePaiement } from './plan.js';

/* ── Routes ───────────────────────────────────────────────────────
   #/            accueil
   #/create      création de partie
   #/host/CODE   salon puis plateau (maître du jeu)
   #/j/CODE      manette joueur
   #/compte      statut d'achat + identifiant
   ───────────────────────────────────────────────────────────────── */
const nettoie = s => s.toUpperCase().replace(/[^A-Z0-9]/g, '');

async function route() {
  const hash = location.hash || '#/';
  leaveHost(); leavePlayer();
  if (hash.startsWith('#/j/'))    { await enterJoin(nettoie(hash.slice(4))); return; }
  if (hash.startsWith('#/host/')) { await enterLobby(nettoie(hash.slice(7))); return; }
  if (hash === '#/create') { enterCreate(); return; }
  if (hash === '#/compte') { enterCompte(); return; }
  renderHistory();
  showScreen('screen-home');
}
window.addEventListener('hashchange', route);

document.addEventListener('click', e => {
  const t = e.target.closest('[data-goto]');
  if (t) { location.hash = t.dataset.goto; sfx.tap(); }
});

$('#btnGoCreate')?.addEventListener('click', () => { location.hash = '#/create'; sfx.tap(); });
$('#btnGoJoin')?.addEventListener('click', () => {
  const code = nettoie($('#inputJoinCode').value.trim());
  if (code.length < 5) { toast('Il faut le code à 5 caractères affiché sur l\'écran.', 'err'); return; }
  location.hash = '#/j/' + code;
});
$('#inputJoinCode')?.addEventListener('keydown', e => { if (e.key === 'Enter') $('#btnGoJoin').click(); });

/* ── Mon compte : seul écran qui expose l'uid (déblocage manuel, support) ── */
function enterCompte() {
  const r = planResume();
  $('#comptePlan').textContent = r.titre;
  $('#compteDetail').textContent = isPremium()
    ? r.ligne + ' Tes joueurs en profitent sans rien acheter.'
    : r.ligne + ` Version complète : ${PRIX}, une seule fois.`;
  $('#compteUid').textContent = uid() || '…';
  const d = diagPremium();
  const box = $('#compteDiag');
  box.hidden = isPremium() || d.etat === 'jamais';
  box.className = 'diag ' + (d.etat === 'refus' ? 'is-err' : 'is-warn');
  box.textContent = d.message;
  showScreen('screen-compte');
}

$('#btnCompteRefresh')?.addEventListener('click', async () => {
  const btn = $('#btnCompteRefresh');
  btn.disabled = true;
  const ok = await refreshPremium();
  btn.disabled = false;
  toast(ok ? 'Version complète active.' : 'Toujours en version gratuite.', ok ? 'ok' : 'err');
  enterCompte();
});
$('#btnCompteCopy')?.addEventListener('click', async () => {
  const ok = await copy(uid() || '');
  toast(ok ? 'Identifiant copié.' : (uid() || ''), ok ? 'ok' : 'info');
});

/* ── Paywall : achat et restauration ─────────────────────────────────────── */
if (!LIEN_PAIEMENT && $('#paywallBuy')) {
  $('#paywallBuy').disabled = true;
  $('#paywallBuy').textContent = 'Bientôt disponible';
}
$('#paywallBuy')?.addEventListener('click', () => {
  const url = urlPaiement();
  if (!url) { toast("Le paiement n'est pas encore ouvert. Reviens bientôt !", 'err'); return; }
  // Marque le départ vers Stripe : au retour on attend le webhook au lieu
  // d'annoncer froidement « version gratuite » à quelqu'un qui vient de payer.
  try { sessionStorage.setItem('escalier.achat', '1'); } catch {}
  location.href = url;
});

async function verifierRetourPaiement() {
  let attendu = false;
  try { attendu = sessionStorage.getItem('escalier.achat') === '1'; } catch {}
  const retour = location.hash.includes('paiement=ok');
  if (!attendu && !retour) return;
  try { sessionStorage.removeItem('escalier.achat'); } catch {}
  if (isPremium()) return;
  toast('Validation de ton achat…', 'info');
  const ok = await attendrePaiement();
  if (ok) {
    $('#paywall')?.classList.remove('is-open');
    toast('Version complète débloquée. Merci !', 'ok');
    burst(90);
    if (retour) location.hash = '#/'; else route();
  } else {
    toast("Paiement pas encore confirmé. Touche « Vérifier mon statut » dans Mon compte d'ici une minute.", 'err');
  }
}

$('#paywallRestore')?.addEventListener('click', async () => {
  const ok = await refreshPremium();
  toast(ok ? 'Version complète débloquée.' : 'Aucun achat trouvé sur cet appareil.', ok ? 'ok' : 'err');
  if (ok) { $('#paywall').classList.remove('is-open'); route(); }
});

/* ── Son : chaque bascule est confirmée (un clic accidentel passait inaperçu) ── */
const muteBtn = $('#btnMute');
function majMute(actif) {
  muteBtn.innerHTML = iconHtml(actif ? 'volume-high' : 'volume-xmark');
  muteBtn.classList.toggle('is-muted', !actif);
  muteBtn.title = actif ? 'Couper le son' : 'Réactiver le son';
  muteBtn.setAttribute('aria-label', muteBtn.title);
}
majMute(!isMuted());
muteBtn.addEventListener('click', () => {
  const actif = toggleMute();
  majMute(actif);
  toast(actif ? 'Son réactivé' : 'Son coupé', actif ? 'ok' : 'info');
  if (actif) sfx.good();
});

/* ── Boot ─────────────────────────────────────────────────────────── */
(async function boot() {
  const t0 = Date.now();
  if (!configure) {
    document.querySelector('.loader-text').textContent =
      'Projet Firebase non configuré : renseigne firebaseConfig dans js/config.js.';
    return;
  }
  try {
    await Promise.race([ready(), new Promise((_, rej) => setTimeout(rej, 9000))]);
  } catch {
    document.querySelector('.loader-text').textContent =
      "Connexion à Firebase impossible. Vérifie que l'authentification anonyme est activée.";
    return;
  }
  refreshPremium().then(verifierRetourPaiement);   // non bloquant
  const wait = Math.max(0, 900 - (Date.now() - t0));
  setTimeout(route, wait);
})();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

export { openPaywall, ls };
