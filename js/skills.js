'use strict';
// Skilltree-Logik (Phase 3): Lernen, Voraussetzungen, Ausrüsten, Zurücksetzen, geheime Techniken.
SW.Skills = (function () {
  const D = SW.Data, T = (k, n) => SW.t(k, n);
  const S = { nodes: D.skills, specials: D.specials || [], learned: {}, specialLearned: {}, specialQuest: {}, spent: 0, slots: [null, null], sec: {}, scr: {}, notified: {}, taught: false };
  S.node = id => S.nodes.find(n => n.id === id);
  const secDef = id => D.secrets.find(s => s.id === id);
  const scrDef = id => D.scrolls.find(s => s.id === id);
  const costTxt = ess => ess + ' ' + T('ess');

  // Liste der Voraussetzungen als {ok, text}; wird auch vom Menü angezeigt
  S.reqs = function (id) {
    const n = S.node(id), C = SW.Char, Y = SW.YinYang, r = [];
    r.push({ ok: C.level >= n.lvl, text: T('req_lvl', n.lvl) });
    n.req.forEach(p => r.push({ ok: !!S.learned[p], text: T('req_skill', T('sk_' + p)) }));
    if (n.karma) r.push({ ok: SW.Karma.v >= n.karma, text: T('req_karma', n.karma) });
    if (n.yin) r.push({ ok: Y.yin >= n.yin, text: T('cost_yin', n.yin) });
    if (n.yang) r.push({ ok: Y.yang >= n.yang, text: T('cost_yang', n.yang) });
    if (n.balance) r.push({ ok: Y.balanced(n.balance), text: T('cost_balance', n.balance) });
    r.push({ ok: C.sp >= n.cost.sp, text: T('req_sp', n.cost.sp) });
    r.push({ ok: SW.Essence.has(n.cost.ess), text: costTxt(n.cost.ess) });
    return r;
  };
  S.can = id => S.taught && !S.learned[id] && !!S.node(id) && S.reqs(id).every(x => x.ok);
  S.special = id => S.specials.find(n => n.id === id);
  S.specialReqs = function (id) {
    const n = S.special(id); if (!n) return [];
    const r = [{ ok: SW.Char.level >= n.lvl, text: T('req_lvl', n.lvl) }];
    (n.req || []).forEach(p => r.push({ ok: !!S.learned[p], text: T('req_skill', p) }));
    if (n.unlock === 'karma') r.push({ ok: SW.Karma.v >= n.karma, text: T('req_karma', n.karma) });
    if (n.unlock === 'yinyang') r.push({ ok: SW.YinYang.balanced(n.balance), text: T('req_balance', n.balance) });
    if (n.unlock === 'quest') r.push({ ok: !!S.specialQuest[n.quest], text: 'Spezialquest abgeschlossen' });
    return r;
  };
  S.canSpecial = id => S.taught && !!S.special(id) && !S.specialLearned[id] && S.specialReqs(id).every(x => x.ok);
  S.unlockSpecial = function (id) {
    if (!S.canSpecial(id)) return false;
    S.specialLearned[id] = 1; SW.Save.touch(); return true;
  };
  // Quest-Systeme melden hier den Abschluss der drei Spezialquests.
  S.markSpecialQuest = function (id) {
    if (!['sm_will', 'sw_escape', 'km_enlightenment'].includes(id)) return false;
    S.specialQuest[id] = 1; SW.Save.touch(); return true;
  };
  S.learn = function (id) {
    if (!S.can(id)) return false;
    const n = S.node(id);
    SW.Char.sp -= n.cost.sp; SW.Essence.spend(n.cost.ess);
    const h = n.balance ? n.balance / 2 : 0; // Gleichgewichtsknoten: je Seite die Hälfte
    if (n.yin || h) SW.YinYang.spend('yin', (n.yin || 0) + h); if (n.yang || h) SW.YinYang.spend('yang', (n.yang || 0) + h);
    S.learned[id] = 1; S.spent += n.cost.sp;
    if (n.type === 'active') { const i = S.slots.indexOf(null); if (i >= 0) S.slots[i] = id; }
    SW.Save.touch(); return true;
  };

  // Summe aller Passiv-Effekte
  S.fx = function () {
    const f = { dmg: 0, rec: 0, crit: 0, dodgeCd: 0, ambush: 0, breath: 0, hpFlat: 0, kiFlat: 0, kiRegen: 0, kiCost: 0, blockMul: .2, parry: 0, counter: 0, range: 0, move: 0, healWin: 0, kiDodge: 0, dodgeWindow: 0, knockback: 0, damageReduction: 0, kiDamage: 0 };
    S.nodes.forEach(n => {
      if (n.type !== 'passive' || !S.learned[n.id]) return;
      for (const k in n.fx) { if (k === 'blockMul') f.blockMul = Math.min(f.blockMul, n.fx[k]); else f[k] += n.fx[k]; }
    });
    return f;
  };

  // Aktive Fähigkeiten: Name der Kampfaktion je Slot (null = leer)
  S.moveOf = function (id) {
    const n = S.node(id);
    if (n) return S.learned[id] ? n.move : null;
    const s = secDef(id);
    if (s) return S.sec[id] === 2 ? s.move : null;
    const c = scrDef(id);
    return c && S.scr[id] === 2 ? c.move : null;
  };
  S.slotMoves = () => S.slots.map(id => (id && S.moveOf(id)) || null);
  S.equip = function (id, i) {
    if (!S.moveOf(id) || i < 0 || i > 1) return false;
    const o = S.slots.indexOf(id);
    if (o >= 0) S.slots[o] = null;
    S.slots[i] = id; SW.Save.touch(); return true;
  };
  S.unequip = function (i) { S.slots[i] = null; SW.Save.touch(); };

  // Zurücksetzen: Skillpunkte kommen zurück, Essence ist verbraucht (Preis). Geheime Techniken bleiben.
  S.resetCost = () => D.resetCost;
  S.resetText = () => costTxt(D.resetCost);
  S.reset = function () {
    if (!S.spent && !Object.keys(S.learned).length) return false;
    if (!SW.Essence.spend(D.resetCost)) return false;
    SW.Char.sp += S.spent; S.spent = 0; S.learned = {};
    S.slots = S.slots.map(id => (id && (secDef(id) && S.sec[id] === 2 || scrDef(id) && S.scr[id] === 2)) ? id : null);
    SW.Save.touch(); return true;
  };

  // Geheime Techniken: 0 = unbekannt, 1 = erhalten (gesperrt), 2 = freigeschaltet
  S.secrets = () => D.secrets.filter(s => S.sec[s.id]);
  S.secReqs = function (id) {
    const s = secDef(id), r = [];
    r.push({ ok: SW.Char.level >= s.lvl, text: T('req_lvl', s.lvl) });
    if (s.karma) r.push({ ok: SW.Karma.v >= s.karma, text: T('req_karma', s.karma) });
    if (s.yang) r.push({ ok: SW.YinYang.yang >= s.yang, text: T('req_yang', s.yang) });
    if (s.yin) r.push({ ok: SW.YinYang.yin >= s.yin, text: T('req_yin', s.yin) });
    if (s.balance) r.push({ ok: SW.YinYang.balanced(s.balance), text: T('req_balance', s.balance) });
    return r;
  };
  // Schriftrollen: 1 = gefunden (nicht lesbar), 2 = vom Meister entziffert (Technik gelernt)
  S.findScroll = function (id) {
    if (!scrDef(id)) return false;
    if (!S.scr[id]) { S.scr[id] = 1; SW.Save.touch(); }
    return true;
  };
  S.canDecipher = function (id) {
    const c = scrDef(id);
    return !!c && S.scr[id] === 1 && SW.Char.level >= c.lvl && SW.YinYang.yin >= c.yin && SW.YinYang.yang >= c.yang;
  };
  S.decipher = function (id) {
    if (!S.canDecipher(id)) return false;
    const c = scrDef(id);
    if (c.yin) SW.YinYang.spend('yin', c.yin); if (c.yang) SW.YinYang.spend('yang', c.yang);
    S.scr[id] = 2;
    const i = S.slots.indexOf(null); if (i >= 0) S.slots[i] = id;
    SW.Save.touch(); if (SW.UI && SW.UI.banner) SW.UI.banner(T('secret_got', T('sk_' + id))); return true;
  };
  S.secReady = id => S.sec[id] === 1 && S.secReqs(id).every(x => x.ok);
  S.award = function (id) {
    if (!secDef(id) || S.sec[id]) return false;
    S.sec[id] = 1; SW.Save.touch(); S.check(); return true;
  };
  S.activate = function (id) {
    if (!S.secReady(id)) return false;
    S.sec[id] = 2;
    const i = S.slots.indexOf(null); if (i >= 0) S.slots[i] = id;
    SW.Save.touch(); return true;
  };
  // Meldet (einmal je Sitzung), wenn eine geheime Technik freischaltbar wird
  S.check = function () {
    D.secrets.forEach(s => {
      if (S.secReady(s.id) && !S.notified[s.id]) { S.notified[s.id] = 1; if (SW.UI && SW.UI.banner) SW.UI.banner(T('secret_ready')); }
    });
  };

  S.dump = () => ({ learned: Object.assign({}, S.learned), specialLearned: Object.assign({}, S.specialLearned), specialQuest: Object.assign({}, S.specialQuest), spent: S.spent, slots: S.slots.slice(), sec: Object.assign({}, S.sec), scr: Object.assign({}, S.scr), taught: S.taught ? 1 : 0 });
  S.teach = function () { if (!S.taught) { S.taught = true; SW.Save.touch(); } }; // Meister hat Skilltree erklärt
  S.load = function (d) {
    if (!d) return;
    S.learned = {}; S.specialLearned = {}; S.specialQuest = {}; S.sec = {}; S.scr = {};
    S.taught = d.taught === 1 || Object.keys(d.learned || {}).length > 0 || Object.keys(d.specialLearned || {}).length > 0; // alte Stände mit Skills nicht aussperren
    for (const id in (d.learned || {})) if (S.node(id)) S.learned[id] = 1;
    for (const id in (d.specialLearned || {})) if (S.special(id)) S.specialLearned[id] = 1;
    for (const id in (d.specialQuest || {})) if (['sm_will', 'sw_escape', 'km_enlightenment'].includes(id) && d.specialQuest[id]) S.specialQuest[id] = 1;
    for (const id in (d.sec || {})) if (secDef(id) && (d.sec[id] === 1 || d.sec[id] === 2)) S.sec[id] = d.sec[id];
    for (const id in (d.scr || {})) if (scrDef(id) && (d.scr[id] === 1 || d.scr[id] === 2)) S.scr[id] = d.scr[id];
    // Alte Skilltree-IDs werden absichtlich verworfen; SP-Ausgaben aus dem neuen Baum neu berechnen.
    S.spent = S.nodes.reduce((sum, n) => sum + (S.learned[n.id] ? n.cost.sp : 0), 0);
    S.slots = [0, 1].map(i => { const id = d.slots && d.slots[i]; return id && S.moveOf(id) ? id : null; });
  };
  return S;
})();
