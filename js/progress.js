'use strict';
// Fortschrittssysteme (Phase 3). Getrennte Namensräume:
// SW.Char (XP, Level, Werte) | SW.Essence (nur Skilltree) | SW.YinYang (Spielstil) | SW.Karma (Ruf) | SW.Save (Speichern)
// Alle Zahlen sind Platzhalter bis zum Balancing.
SW.Char = (function () {
  const C = { level: 1, xp: 0, sp: 1, ap: 0, pts: { hp: 0, ki: 0, atk: 0, def: 0, end: 0, crit: 0 }, MAX: 30 };
  const PER = { hp: 8, ki: 5, atk: .6, def: 1, end: 1, crit: .5 }; // Wert je Attributpunkt
  C.PER = PER;
  C.need = l => Math.round(30 * Math.pow(l, 1.45));
  C.base = function () {
    const L = C.level - 1, P = C.pts;
    return {
      hp: 100 + 6 * L + PER.hp * P.hp, ki: 100 + 3 * L + PER.ki * P.ki, atk: 10 + .3 * L + PER.atk * P.atk,
      def: .2 * L + PER.def * P.def, end: PER.end * P.end, crit: Math.min(40, 5 + PER.crit * P.crit)
    };
  };
  C.addXp = function (n) {
    const out = [];
    if (C.level >= C.MAX || !(n > 0)) return out;
    C.xp += n;
    while (C.level < C.MAX && C.xp >= C.need(C.level)) { C.xp -= C.need(C.level); C.level++; C.sp++; C.ap += 3; out.push(SW.t('lv_up', C.level)); }
    if (C.level >= C.MAX) C.xp = 0;
    if (SW.Skills) SW.Skills.check();
    SW.Save.touch();
    return out;
  };
  C.spend = function (k) {
    if (C.ap < 1 || !(k in C.pts)) return false;
    if (k === 'crit' && C.base().crit >= 40) return false;
    C.pts[k]++; C.ap--; SW.Save.touch(); return true;
  };
  // Alle Kampfwerte (Basis + Skilltree-Passive + Yin/Yang-Bonus)
  C.combat = function () {
    const b = C.base(), f = SW.Skills.fx();
    const g = SW.Inv ? SW.Inv.bonus() : { atk: 0, def: 0, hp: 0, crit: 0, rec: 0, dodge: 0, ambush: 0, parry: 0, counter: 0, kiCost: 0, kiRegen: 0, critDmg: 0, rdmg: 0, rwind: 0, rrec: 0 }; // Ausrüstung (Phase 4)
    return {
      hp: Math.round(b.hp + f.hpFlat + g.hp), ki: Math.round(b.ki + f.kiFlat),
      kiRegen: 3 * (1 + f.kiRegen + g.kiRegen), atk: b.atk / 10 * (1 + f.dmg + g.atk), def: (b.def + g.def), end: b.end,
      crit: Math.min(.6, (b.crit + f.crit + g.crit) / 100),
      recMul: Math.max(.4, (1 - f.rec) / (1 + b.end * .015) * (1 + g.rec)), dodgeCdMul: Math.max(.4, (1 - f.dodgeCd) / (1 + b.end * .01) * (1 + g.dodge)),
      breathMul: 1 + f.breath, kiCostMul: Math.max(.3, 1 - f.kiCost - g.kiCost), critMul: 1.5 + g.critDmg, blockMul: f.blockMul, parry: .22 + f.parry + g.parry,
      counterMul: 1 + f.counter + g.counter, ambush: f.ambush + g.ambush, slots: SW.Skills.slotMoves(),
      // Fernkampf (Phase 4c): nur mit ausgerüsteter Fernkampfwaffe
      ranged: SW.Inv && SW.Inv.eq.ranged ? { id: SW.Inv.eq.ranged, dmg: g.rdmg, wind: g.rwind || .25, rec: g.rrec || .4 } : null
    };
  };
  C.dump = () => ({ level: C.level, xp: C.xp, sp: C.sp, ap: C.ap, pts: Object.assign({}, C.pts) });
  C.load = function (d) {
    if (!d) return;
    const n = (v, a, b, def) => (typeof v === 'number' && isFinite(v)) ? Math.min(b, Math.max(a, v)) : def;
    C.level = n(d.level, 1, C.MAX, 1); C.xp = n(d.xp, 0, 1e9, 0); C.sp = n(d.sp, 0, 999, 0); C.ap = n(d.ap, 0, 999, 0);
    for (const k in C.pts) C.pts[k] = n(d.pts && d.pts[k], 0, 999, 0);
  };
  return C;
})();

SW.Essence = (function () {
  // Eine einzige Essence ohne Arten/Seltenheit (Spec 32.5/33.2). Ausgabe nur im Skilltree. BALANCE-PLATZHALTER: Startwert 2.
  const E = { n: 2 };
  E.add = function (k) { if (!Number.isFinite(k) || !(k > 0)) return false; E.n = Math.min(999, E.n + Math.floor(k)); SW.Save.touch(); return true; };
  E.has = c => Number.isFinite(c) && E.n >= c;
  E.spend = function (c) { if (!E.has(c)) return false; E.n -= c; SW.Save.touch(); return true; };
  E.dump = () => E.n;
  // Altstand (Format <= 2): Objekt je Art -> Summe 1:1, nichts geht verloren. Neu: Zahl.
  E.load = function (d) {
    const v = typeof d === 'number' ? d : (d && typeof d === 'object') ? Object.keys(d).reduce((a, t) => a + (Number.isFinite(d[t]) && d[t] > 0 ? Math.floor(d[t]) : 0), 0) : NaN;
    if (Number.isFinite(v) && v >= 0) E.n = Math.min(999, Math.floor(v));
  };
  return E;
})();

SW.YinYang = (function () {
  const Y = { yin: 20, yang: 20 };
  // Wer eine Seite stärkt, verliert langsam etwas von der anderen: keine dauerhafte Festlegung.
  Y.gain = function (k, g) {
    if ((k !== 'yin' && k !== 'yang') || !Number.isFinite(g) || !(g > 0)) return 0;
    const o = k === 'yin' ? 'yang' : 'yin', before = Y[k];
    Y[k] = Math.min(100, Y[k] + g); Y[o] = Math.max(0, Y[o] - g * .35);
    SW.Save.touch(); SW.Skills.check(); return Y[k] - before;
  };
  // Yin/Yang geben keine Kampfboni mehr: sie sind Voraussetzungen im Skilltree und bei Geheimtechniken.
  // Pro Kampf begrenzt (max. 6 je Seite), damit Wiederholen nichts erzwingt.
  Y.fromCombat = function (st) {
    const yg = Math.round(Math.min(6, st.heavy + 2 * st.special + 1.5 * st.counter) * 10) / 10;
    const ng = Math.round(Math.min(6, 2 * st.parry + .7 * st.dodge + .4 * st.block + .5 * st.breath) * 10) / 10;
    if (yg > 0) Y.gain('yang', yg);
    if (ng > 0) Y.gain('yin', ng);
    SW.Save.touch(); SW.Skills.check();
    return { yin: ng, yang: yg };
  };
  Y.spend = function (k, n) { // Skilltree-Kosten (Spezifikationsänderung durch Nutzer: Yin/Yang werden beim Lernen verbraucht)
    if ((k !== 'yin' && k !== 'yang') || !Number.isFinite(n) || !(n > 0) || Y[k] < n) return false;
    Y[k] -= n; SW.Save.touch(); return true;
  };
  Y.balanced = min => Math.abs(Y.yang - Y.yin) <= 12 && Math.min(Y.yin, Y.yang) >= min;
  Y.dump = () => ({ yin: Y.yin, yang: Y.yang });
  Y.load = function (d) {
    if (!d) return;
    if (typeof d.yin === 'number' && isFinite(d.yin)) Y.yin = Math.min(100, Math.max(0, d.yin));
    if (typeof d.yang === 'number' && isFinite(d.yang)) Y.yang = Math.min(100, Math.max(0, d.yang));
  };
  return Y;
})();

SW.Karma = (function () {
  const K = { v: 0, seen: {} };
  // id = Handlung. Gleiche Handlung wiederholt bringt jedes Mal nur die Hälfte (Schutz vor Farmen).
  K.add = function (id, n) {
    if (typeof id !== 'string' || !id || !Number.isFinite(n) || n === 0) return 0;
    const c = Math.max(0, Math.min(30, Math.floor(Number(K.seen[id]) || 0))), g = Math.round(n * Math.pow(.5, c) * 10) / 10;
    K.seen[id] = c + 1;
    if (!g) return 0;
    K.v = Math.max(-100, Math.min(100, K.v + g));
    SW.Save.touch(); if (SW.Skills) SW.Skills.check();
    return g;
  };
  K.rank = () => K.v >= 70 ? 'revered' : K.v >= 30 ? 'honored' : K.v <= -70 ? 'despised' : K.v <= -30 ? 'distrusted' : 'neutral';
  K.dump = () => ({ v: K.v, seen: Object.assign({}, K.seen) });
  K.load = function (d) {
    if (!d) return;
    if (typeof d.v === 'number' && isFinite(d.v)) K.v = Math.max(-100, Math.min(100, d.v));
    if (d.seen && typeof d.seen === 'object' && !Array.isArray(d.seen)) { K.seen = {}; Object.keys(d.seen).slice(0, 500).forEach(id => { const n = Number(d.seen[id]); if (Number.isFinite(n) && n >= 0) K.seen[id] = Math.min(30, Math.floor(n)); }); }
  };
  return K;
})();

// Lokale Speicherung des Spielstands (Phase 6). Format v2 + Umschlag {ts, pt, sum, d}: Zeitstempel, Spielzeit, Prüfsumme über den Daten-Text.
// Sicherheit: vor jedem Schreiben wird der letzte gültige Stand als Kopie gesichert; defekter Stand (Prüfsumme falsch) fällt auf die Kopie zurück.
// Hauptstand + 4 rotierende Wiederherstellungspunkte (alle 10 min Echtzeit rückt der alte Hauptstand nach). Alte Stände ohne Umschlag werden übernommen.
SW.Save = (function () {
  const KEY = 'sw_progress_v1', BAK = 'sw_progress_v1_bak', RP = 'sw_progress_v1_rp', NRP = 4, GAP = 600000, VER = 3, V = {};
  let tmr = 0, acc = 0, lp = null, wiped = false, pt = 0;
  const hash = t => { let h = 5381; for (let i = 0; i < t.length; i++) h = ((h << 5) + h + t.charCodeAt(i)) | 0; return h >>> 0; };
  V.data = () => ({
    v: VER, gv: SW.version, char: SW.Char.dump(), ess: SW.Essence.dump(), yy: SW.YinYang.dump(), karma: SW.Karma.dump(), skills: SW.Skills.dump(),
    inv: SW.Inv ? SW.Inv.dump() : null,
    shr: SW.Shrines ? SW.Shrines.dump() : null, tr: SW.Trials ? SW.Trials.dump() : null, q: SW.Quests ? SW.Quests.dump() : null, time: SW.Time ? SW.Time.dump() : null,
    pos: SW.Player ? { x: Math.round(SW.Player.x * 100) / 100, y: Math.round(SW.Player.y * 100) / 100 } : null,
    defeated: SW.Combat.spots.filter(s => s.dead && !s.respawn).map(s => s.id), pt: Math.floor(pt),
    disc: SW.UI ? [...SW.UI.disc] : [], seen: SW.UI ? [...SW.UI.seen] : []
  });
  V.save = function () {
    if (tmr) { clearTimeout(tmr); tmr = 0; } // zuerst entriegeln, sonst blockiert ein verworfener Timer (hold) alle späteren touch()
    if (wiped || V.hold) return; // hold: Startbildschirm offen, noch nichts überschreiben
    try {
      const old = localStorage.getItem(KEY), d = JSON.stringify(V.data());
      if (old && unpack(old)) { localStorage.setItem(BAK, old); rotate(old, false); } // defekten Stand nie als Kopie sichern
      localStorage.setItem(KEY, JSON.stringify({ e: 1, ts: Date.now(), pt: Math.floor(pt), sum: hash(d), d }));
      if (SW.Player) lp = { x: SW.Player.x, y: SW.Player.y };
    } catch (e) { /* Speicher gesperrt oder voll */ }
  };
  // Spielstand löschen (beide Kopien); danach wird nichts mehr geschrieben, die Seite lädt neu. Sprache bleibt.
  V.clear = function () {
    wiped = true; if (tmr) { clearTimeout(tmr); tmr = 0; }
    try { localStorage.removeItem(KEY); localStorage.removeItem(BAK); for (let i = 0; i < NRP; i++) localStorage.removeItem(RP + i); } catch (e) { /* Speicher gesperrt */ }
    location.reload();
  };
  V.touch = function () { if (!tmr) tmr = setTimeout(V.save, 500); };
  // Position regelmäßig sichern (alle 5 s Spielzeit, nur nach Bewegung), nicht bei jedem Bild
  V.tick = function (dt) {
    pt += dt; acc += dt; if (acc < 5) return; acc = 0;
    const P = SW.Player;
    if (!lp || Math.hypot(P.x - lp.x, P.y - lp.y) > .5) V.touch();
  };
  // Ältere Formate auf die aktuelle Version heben
  function migrate(d) {
    if (!d || typeof d !== 'object' || typeof d.v !== 'number' || d.v > VER) return null;
    if (d.v === 1) d.v = 2; // v1 -> v2: nur Position kommt neu dazu (fehlt = Startpunkt)
    if (d.v === 2) d.v = 3; // v2 -> v3: Essence ist eine Zahl (Altformat wird in Essence.load summiert)
    return d;
  }
  // Umschlag prüfen und auspacken: {ts, pt, d} oder null (beschädigt/zu neu). Alter Stand ohne Umschlag: ts 0.
  function unpack(raw) {
    try {
      const o = JSON.parse(raw); if (!o || typeof o !== 'object') return null;
      if (o.e === 1) { if (typeof o.d !== 'string' || hash(o.d) !== o.sum) return null; const d = migrate(JSON.parse(o.d)); return d ? { ts: o.ts || 0, pt: o.pt || 0, d } : null; }
      const d = migrate(o); return d ? { ts: 0, pt: 0, d } : null;
    } catch (e) { return null; }
  }
  function read(key) { try { const r = localStorage.getItem(key); return r ? unpack(r) : null; } catch (e) { return null; } }
  // Alten Hauptstand in die Wiederherstellungspunkte schieben (nur wenn force oder seit 10 min kein neuer Punkt)
  function rotate(old, force) {
    const tk = RP + '_t';
    if (!force && Date.now() - Number(localStorage.getItem(tk) || 0) < GAP) return;
    for (let i = NRP - 1; i > 0; i--) { const v = localStorage.getItem(RP + (i - 1)); if (v) localStorage.setItem(RP + i, v); }
    localStorage.setItem(RP + 0, old); localStorage.setItem(tk, String(Date.now()));
  }
  // Liste für die Auswahl: Hauptstand + Wiederherstellungspunkte (nur vorhandene), mit Kurzinfo
  V.slots = function () {
    const out = [];
    [KEY].concat([0, 1, 2, 3].map(i => RP + i)).forEach((k, i) => {
      let raw = null; try { raw = localStorage.getItem(k); } catch (e) { /* gesperrt */ }
      if (!raw) return;
      const r = unpack(raw), d = r && r.d, q = d && d.pos, W = SW.World;
      out.push({ key: k, main: i === 0, n: i, ok: !!r, ts: r ? r.ts : 0, pt: r ? (d.pt || r.pt) : 0, lvl: r ? (d.char && d.char.level) || 1 : 0,
        reg: q && isFinite(q.x) && isFinite(q.y) ? W.regionAt(Math.floor(q.x), Math.floor(q.y)) : 0, shr: r && d.shr && d.shr.on ? d.shr.on.length : 0, def: r && d.defeated ? d.defeated.length : 0 });
    });
    return out;
  };
  // Tausch: Wiederherstellungspunkt wird Hauptstand, alter Hauptstand nimmt dessen Platz ein (nichts geht verloren). Danach Neuladen.
  V.restore = function (key) {
    try {
      const sel = localStorage.getItem(key), cur = localStorage.getItem(KEY);
      if (key === KEY || !sel || !unpack(sel)) return false;
      wiped = true; if (tmr) { clearTimeout(tmr); tmr = 0; }
      if (cur) localStorage.setItem(key, cur); else localStorage.removeItem(key);
      localStorage.setItem(KEY, sel);
    } catch (e) { return false; }
    location.reload(); return true;
  };
  // Neues Spiel: aktueller Hauptstand wird Wiederherstellungspunkt 1 (ältester Punkt entfällt), dann leerer Start.
  V.newGame = function () {
    wiped = true; if (tmr) { clearTimeout(tmr); tmr = 0; }
    try { const cur = localStorage.getItem(KEY); if (cur && unpack(cur)) rotate(cur, true); localStorage.removeItem(KEY); localStorage.removeItem(BAK); } catch (e) { /* gesperrt */ }
    location.reload();
  };
  V.has = () => !!(read(KEY) || read(BAK));
  const step = fn => { try { fn(); } catch (e) { /* ein defekter Teil darf den Rest nicht blockieren */ } };
  V.load = function () {
    const r = read(KEY) || read(BAK), d = r && r.d;
    V.damaged = !r && !!(function () { try { return localStorage.getItem(KEY); } catch (e) { return null; } })();
    if (!d) return;
    pt = d.pt || r.pt || 0;
    step(() => SW.Char.load(d.char)); step(() => SW.Essence.load(d.ess)); step(() => SW.YinYang.load(d.yy));
    step(() => SW.Karma.load(d.karma)); step(() => SW.Skills.load(d.skills));
    if (SW.Inv) step(() => SW.Inv.load(d.inv));
    if (SW.Shrines) step(() => SW.Shrines.load(d.shr));
    if (SW.Quests) step(() => SW.Quests.load(d.q));
    if (SW.Trials) step(() => SW.Trials.load(d.tr));
    if (SW.Time) step(() => SW.Time.load(d.time));
    step(() => (d.defeated || []).forEach(id => { const s = SW.Combat.spots.find(x => x.id === id); if (s) s.dead = true; }));
    if (SW.UI) step(() => { (d.disc || []).forEach(i => SW.UI.disc.add(i)); (d.seen || []).forEach(i => SW.UI.seen.add(i)); });
    step(() => {
      const q = d.pos, W = SW.World;
      if (!q || !isFinite(q.x) || !isFinite(q.y) || q.x < 1 || q.y < 1 || q.x > SW.CFG.W - 1 || q.y > SW.CFG.H - 1) return;
      if (W.solid(Math.floor(q.x), Math.floor(q.y))) return;
      SW.Player.x = q.x; SW.Player.y = q.y; lp = { x: q.x, y: q.y };
      if (SW.cam) { SW.cam.x = q.x; SW.cam.y = q.y; }
    });
  };
  if (typeof document !== 'undefined' && document.addEventListener) {
    document.addEventListener('visibilitychange', () => { if (document.hidden) V.save(); });
    window.addEventListener('pagehide', V.save);
  }
  return V;
})();
