'use strict';
// Skilltree-Logik (Phase 3): Lernen, Voraussetzungen, Ausrüsten, Zurücksetzen, geheime Techniken.
SW.Skills = (function () {
  const D = SW.Data, T = (k, n) => SW.t(k, n);
  const S = { nodes: D.skills, learned: {}, spent: 0, slots: [null, null], sec: {}, notified: {} };
  S.node = id => S.nodes.find(n => n.id === id);
  const secDef = id => D.secrets.find(s => s.id === id);
  const costTxt = ess => ess + ' ' + T('ess');

  // Liste der Voraussetzungen als {ok, text}; wird auch vom Menü angezeigt
  S.reqs = function (id) {
    const n = S.node(id), C = SW.Char, Y = SW.YinYang, r = [];
    r.push({ ok: C.level >= n.lvl, text: T('req_lvl', n.lvl) });
    n.req.forEach(p => r.push({ ok: !!S.learned[p], text: T('req_skill', T('sk_' + p)) }));
    if (n.yin) r.push({ ok: Y.yin >= n.yin, text: T('req_yin', n.yin) });
    if (n.yang) r.push({ ok: Y.yang >= n.yang, text: T('req_yang', n.yang) });
    if (n.balance) r.push({ ok: Y.balanced(n.balance), text: T('req_balance', n.balance) });
    r.push({ ok: C.sp >= n.cost.sp, text: T('req_sp', n.cost.sp) });
    r.push({ ok: SW.Essence.has(n.cost.ess), text: costTxt(n.cost.ess) });
    return r;
  };
  S.can = id => !S.learned[id] && S.reqs(id).every(x => x.ok);
  S.learn = function (id) {
    if (!S.can(id)) return false;
    const n = S.node(id);
    SW.Char.sp -= n.cost.sp; SW.Essence.spend(n.cost.ess);
    S.learned[id] = 1; S.spent += n.cost.sp;
    if (n.type === 'active') { const i = S.slots.indexOf(null); if (i >= 0) S.slots[i] = id; }
    SW.Save.touch(); return true;
  };

  // Summe aller Passiv-Effekte
  S.fx = function () {
    const f = { dmg: 0, rec: 0, crit: 0, dodgeCd: 0, ambush: 0, breath: 0, hpFlat: 0, kiFlat: 0, kiRegen: 0, kiCost: 0, blockMul: .2, parry: 0, counter: 0 };
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
    return s && S.sec[id] === 2 ? s.move : null;
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
    S.slots = S.slots.map(id => (id && secDef(id) && S.sec[id] === 2) ? id : null);
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

  S.dump = () => ({ learned: Object.assign({}, S.learned), spent: S.spent, slots: S.slots.slice(), sec: Object.assign({}, S.sec) });
  S.load = function (d) {
    if (!d) return;
    S.learned = {}; S.sec = {};
    for (const id in (d.learned || {})) if (S.node(id)) S.learned[id] = 1;
    for (const id in (d.sec || {})) if (secDef(id) && (d.sec[id] === 1 || d.sec[id] === 2)) S.sec[id] = d.sec[id];
    S.spent = typeof d.spent === 'number' && d.spent >= 0 ? d.spent : 0;
    S.slots = [0, 1].map(i => { const id = d.slots && d.slots[i]; return id && S.moveOf(id) ? id : null; });
  };
  return S;
})();
