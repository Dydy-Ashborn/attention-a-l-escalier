/* Bibi step — helpers DOM, modale maison, sons synthétisés, particules.
 * Repris de Bibi Love (mêmes garde-fous) ; aucune alerte native : toute confirmation
 * passe par showConfirmModal(). */

export const $  = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
    else if (k.startsWith('on')) node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v !== null && v !== undefined && v !== false) node.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    node.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return node;
}

/** Icône Font Awesome (sous-ensemble vendorisé : seules les icônes de fa.css existent). */
export function icon(name, extra = '') {
  const i = document.createElement('i');
  i.className = 'fa fa-' + name + (extra ? ' ' + extra : '');
  i.setAttribute('aria-hidden', 'true');
  return i;
}
export function iconHtml(name, extra = '') {
  return `<i class="fa fa-${name}${extra ? ' ' + extra : ''}" aria-hidden="true"></i>`;
}

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}

export function showScreen(id) {
  $$('.screen').forEach(s => s.classList.toggle('is-active', s.id === id));
  window.scrollTo(0, 0);
}

/* ── Modale de confirmation maison (jamais confirm()) ───────────────────── */
export function showConfirmModal(message, onConfirm, opts = {}) {
  const modal = $('#confirmModal');
  $('#confirmModalText').textContent = message;
  const ok = $('#confirmModalOk');
  const no = $('#confirmModalCancel');
  ok.textContent = opts.okLabel || 'Confirmer';
  no.textContent = opts.cancelLabel || 'Annuler';
  ok.className = 'btn ' + (opts.danger ? 'btn-danger' : 'btn-gold');

  // Les écouteurs sont détruits à la fermeture (cloneNode) : sans ça, le second
  // usage de la modale déclenche deux callbacks (piège hérité de Bibi Love).
  const close = () => {
    modal.classList.remove('is-open');
    ok.replaceWith(ok.cloneNode(true));
    no.replaceWith(no.cloneNode(true));
    modal.removeEventListener('click', backdrop);
  };
  const backdrop = e => { if (e.target === modal) close(); };

  ok.addEventListener('click', () => { close(); onConfirm && onConfirm(); });
  no.addEventListener('click', close);
  modal.addEventListener('click', backdrop);
  modal.classList.add('is-open');
}

/* ── Toast ─────────────────────────────────────────────────────────────── */
let toastTimer = null;
export function toast(msg, kind = 'info') {
  const t = $('#toast');
  t.textContent = msg;
  t.dataset.kind = kind;
  t.classList.add('is-open');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    t.classList.remove('is-open');
    setTimeout(() => { if (!t.classList.contains('is-open')) t.textContent = ''; }, 350);
  }, 2800);
}

/* ── Stockage local protégé (navigation privée, données bloquées) ───────── */
export const ls = {
  get(k, d = null) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} }
};

/* ── Sons synthétisés (aucun fichier audio à héberger) ──────────────────── */
let actx = null;
const audioOn = () => ls.get('escalier.mute') !== '1';
export function toggleMute() {
  const muted = ls.get('escalier.mute') === '1';
  ls.set('escalier.mute', muted ? '0' : '1');
  return !muted;
}
export function isMuted() { return ls.get('escalier.mute') === '1'; }

/* Les navigateurs créent l'AudioContext à l'état `suspended` tant que l'utilisateur
   n'a pas interagi : on le réveille au premier geste réel, avant qu'un son soit demandé. */
function ctx() {
  if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
  return actx;
}
let audioPret = false;
function reveillerAudio() {
  const c = ctx();
  if (c.state === 'suspended') c.resume().then(() => { audioPret = true; }).catch(() => {});
  else audioPret = true;
}
// Garde `typeof window` : le module est importé hors navigateur par les scripts de contrôle.
if (typeof window !== 'undefined') {
  ['pointerdown', 'touchstart', 'keydown'].forEach(evt =>
    window.addEventListener(evt, reveillerAudio, { capture: true, passive: true }));
}

function blip(freq, start, dur, type = 'sine', gain = 0.18, slideTo = null) {
  const c = ctx();
  if (c.state !== 'running') { reveillerAudio(); if (!audioPret) return; }
  const o = c.createOscillator();
  const g = c.createGain();
  const t0 = c.currentTime + start;
  o.type = type; o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(c.destination);
  o.start(t0); o.stop(t0 + dur + 0.05);
}

export const sfx = {
  tap()    { if (audioOn()) blip(660, 0, 0.07, 'triangle', 0.09); },
  good()   { if (!audioOn()) return; [0, .09, .18].forEach((t, i) => blip([523,659,880][i], t, .28, 'triangle', .22)); },
  bad()    { if (!audioOn()) return; blip(200, 0, .22, 'sawtooth', .14); blip(150, .12, .35, 'sawtooth', .14); },
  tick()   { if (audioOn()) blip(1200, 0, .03, 'square', .05); },
  /** Montée d'escalier : 4 notes qui grimpent. */
  step()   { if (!audioOn()) return; [392, 494, 587, 784].forEach((f, i) => blip(f, i * .08, .22, 'triangle', .18)); },
  /** Roulement pendant que le compteur de révélation défile. */
  roll(n = 14) { if (!audioOn()) return; for (let i = 0; i < n; i++) blip(900 + i * 25, i * .07, .04, 'square', .04); },
  /** Jingle de la question coquine : glissando suave. */
  coquine() { if (!audioOn()) return; blip(330, 0, .5, 'sine', .16, 660); blip(495, .35, .6, 'triangle', .14, 990); blip(660, .8, .7, 'sine', .12, 440); },
  etage()  { if (!audioOn()) return; [523, 659, 784, 1047, 784, 1047].forEach((f, i) => blip(f, i * .1, .3, 'triangle', .17)); },
  win()    { if (!audioOn()) return; [523,659,784,1047].forEach((f,i)=>blip(f, i*.11, .5, 'triangle', .2)); }
};

/* ── Particules ────────────────────────────────────────────────────────── */
export function burst(count = 90, colors = ['#ffcf3f', '#ff9f1c', '#ffffff', '#c08bff', '#ff5fa2']) {
  const layer = $('#fxLayer');
  if (!layer) return;
  for (let n = 0; n < count; n++) {
    const p = document.createElement('span');
    p.className = 'fx-confetti';
    p.style.background = colors[n % colors.length];
    p.style.left = Math.random() * 100 + 'vw';
    p.style.animationDelay = (Math.random() * 0.6).toFixed(2) + 's';
    p.style.animationDuration = (1.8 + Math.random() * 1.6).toFixed(2) + 's';
    p.style.setProperty('--drift', (Math.random() * 200 - 100).toFixed(0) + 'px');
    p.style.setProperty('--spin', (Math.random() * 720 - 360).toFixed(0) + 'deg');
    layer.append(p);
    setTimeout(() => p.remove(), 3600);
  }
}

export function shake(node) {
  if (!node) return;
  node.classList.remove('shake'); void node.offsetWidth; node.classList.add('shake');
}

/* ── Divers ────────────────────────────────────────────────────────────── */
export function makeCode(len = 5) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sans I, O, 0, 1
  let out = '';
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

export async function copy(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch { return false; }
}

export function initiale(name) {
  return (name || '?').trim().slice(0, 1).toUpperCase();
}

/** Anime un nombre de `from` à `to` dans `node` (révélation du pourcentage). */
export function countUp(node, to, { from = 0, ms = 1600, suffix = '' } = {}) {
  return new Promise(resolve => {
    const t0 = performance.now();
    const step = now => {
      const k = Math.min(1, (now - t0) / ms);
      const eased = 1 - Math.pow(1 - k, 3);
      node.textContent = Math.round(from + (to - from) * eased) + suffix;
      if (k < 1) requestAnimationFrame(step); else resolve();
    };
    requestAnimationFrame(step);
  });
}
