/* Tests de la logique pure + contrôle de la banque. Lancer : node scripts/test-game.mjs */
import assert from 'node:assert/strict';
import { QUESTIONS, DECOUVERTE_IDS, enonce } from '../js/data/questions.js';
import { tirerPartie, departager, crediter, classement, enTete, etageDe, ouvreEtage,
         pourcent, questionDepartage, nbQuestions } from '../js/game.js';

let ok = 0;
const t = (nom, fn) => { fn(); ok++; console.log('✓', nom); };

t('banque : champs, ids uniques, valeurs 0-100, sources', () => {
  const ids = new Set();
  for (const q of QUESTIONS) {
    assert.ok(q.id && !ids.has(q.id), 'id dupliqué ' + q.id); ids.add(q.id);
    for (const k of ['pop', 'q', 'src', 't', 'g']) assert.ok(q[k], `${q.id} sans ${k}`);
    assert.ok(Number.isInteger(q.a) && q.a >= 0 && q.a <= 100, q.id + ' valeur');
    assert.ok(q.q.trim().endsWith('?'), q.id + ' sans ?');
    assert.ok(!/undefined/.test(enonce(q)));
  }
});
t('banque : au moins une coquine et assez de groupes pour 1 h', () => {
  const coq = QUESTIONS.filter(q => q.coq);
  const groupes = new Set(QUESTIONS.filter(q => !q.coq).map(q => q.g));
  assert.ok(coq.length >= 1);
  console.log(`   ${QUESTIONS.length} questions, ${coq.length} coquines, ${groupes.size} groupes normaux`);
  assert.ok(groupes.size >= nbQuestions(60) - 1, 'pas assez de groupes pour une partie d\'1 h');
});
t('banque découverte : courte, variée et sans référence invalide', () => {
  const qs = DECOUVERTE_IDS.map(id => QUESTIONS.find(q => q.id === id));
  assert.equal(qs.length, 20);
  assert.ok(qs.every(Boolean), 'id découverte introuvable');
  assert.equal(new Set(DECOUVERTE_IDS).size, DECOUVERTE_IDS.length, 'id découverte dupliqué');
  assert.equal(qs.filter(q => q.coq).length, 2);
  assert.ok(new Set(qs.filter(q => !q.coq).map(q => q.t)).size >= 7, 'découverte pas assez variée');
  assert.ok(new Set(qs.filter(q => !q.coq).map(q => q.g)).size >= nbQuestions(15) - 1,
    'pas assez de groupes pour la découverte');
});
t('tirage : longueur, une seule coquine placée en 2e moitié, groupes uniques', () => {
  for (const duree of [15, 45, 60]) for (let k = 0; k < 200; k++) {
    const { ids, coquineIdx } = tirerPartie({ duree });
    assert.equal(ids.length, nbQuestions(duree));
    const qs = ids.map(id => QUESTIONS.find(q => q.id === id));
    assert.equal(qs.filter(q => q.coq).length, 1);
    assert.ok(qs[coquineIdx].coq);
    assert.ok(coquineIdx >= ids.length * 0.5 && coquineIdx < ids.length - 1, 'coquine mal placée ' + coquineIdx);
    assert.equal(new Set(qs.map(q => q.g)).size, qs.length);
  }
});
t('tirage : les questions déjà jouées passent après les fraîches', () => {
  const first = tirerPartie({ duree: 45 }).ids;
  const second = tirerPartie({ duree: 45, exclude: first }).ids;
  const commun = second.filter(id => first.includes(id)).length;
  const normales = new Set(QUESTIONS.filter(q => !q.coq).map(q => q.g)).size;
  assert.ok(commun <= Math.max(1, 2 * nbQuestions(45) - normales + 2), 'trop de répétitions : ' + commun);
});
t('départage : plus proche, égalités, absents, pile', () => {
  let r = departager({ a: 40, b: 55, c: 70 }, 52);
  assert.deepEqual(r.gagnants, ['b']); assert.equal(r.meilleur, 3);
  r = departager({ a: 48, b: 56 }, 52);
  assert.deepEqual(r.gagnants.sort(), ['a', 'b']);
  r = departager({}, 52); assert.deepEqual(r.gagnants, []);
  r = departager({ a: 52, b: 10 }, 52); assert.deepEqual(r.pile, ['a']);
  r = departager({ a: 'x', b: 150 }, 100); assert.deepEqual(r.gagnants, ['b']);
});
t('scores et classement à rangs partagés', () => {
  let s = crediter({}, ['a', 'b']); s = crediter(s, ['a']);
  const c = classement(s, [{ uid: 'a', name: 'Ash' }, { uid: 'b', name: 'Bea' }, { uid: 'c', name: 'Cy' }]);
  assert.deepEqual(c.map(l => [l.uid, l.rang]), [['a', 1], ['b', 2], ['c', 3]]);
  assert.deepEqual(enTete({ a: 2, b: 2 }, [{ uid: 'a', name: 'A' }, { uid: 'b', name: 'B' }]).sort(), ['a', 'b']);
});
t('étages', () => {
  assert.equal(etageDe(0, 32), 1); assert.equal(etageDe(31, 32), 3);
  const ouvertures = [...Array(32).keys()].filter(i => ouvreEtage(i, 32));
  assert.equal(ouvertures.length, 3);
});
t('pourcent + question de départage hors partie', () => {
  assert.equal(pourcent('42.6'), 43); assert.equal(pourcent(-3), 0); assert.equal(pourcent('abc'), null);
  const { ids } = tirerPartie({ duree: 45 });
  const d = questionDepartage(ids);
  assert.ok(d && !ids.includes(d) && !QUESTIONS.find(q => q.id === d).coq);
});
console.log(`\n${ok} tests OK`);
