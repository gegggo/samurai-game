'use strict';
// Inventar, Ausrüstung, Münzen, Truhen (Phase 4a). Namensraum SW.Inv. Münzen = Handel (Händler folgen 4b).
// Menüseiten SW.Menus.inventory (mit Kategorie-Tabs und Ausrüstung) (benötigt menus.js davor).
SW.Inv = (function () {
  const D = SW.Data, W = SW.World, TAU = 6.2832, T = (k, n) => SW.t(k, n);
  const I = { coins: 0, bag: {}, eq: { main: 'katana_worn' }, up: {}, chests: [], MAXSTACK: 999,
    dur: {}, edur: {}, // Haltbarkeit: dur[id] = Liste je Exemplar im Beutel (gleiche Länge wie bag[id]), edur[slot] = ausgerüstetes Exemplar
    DUR: { common: 30, uncommon: 45, rare: 60, epic: 80 } }; // Platzhalter bis Balancing; Legendär = unzerbrechlich
  const it = id => D.itemMap[id];
  const durMax = id => { const d = D.itemMap[id]; return d && d.type === 'weapon' ? I.DUR[d.rar] || 0 : 0; }; // 0 = hält ewig
  const touch = () => { if (SW.Save) SW.Save.touch(); };
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

  function free(x, y) {
    for (let r = 0; r < 40; r++) {
      const n = r ? r * 8 : 1;
      for (let a = 0; a < n; a++) {
        const g = a / n * TAU, px = Math.floor(x + Math.cos(g) * r), py = Math.floor(y + Math.sin(g) * r);
        if (!W.solid(px, py) && !W.solid(px + 1, py) && !W.solid(px, py + 1) && !W.solid(px - 1, py)) return { x: px + .5, y: py + .5 };
      }
    }
    return { x, y };
  }
  D.chests.forEach(c => { const p = free(c.x, c.y); I.chests.push({ id: c.id, x: p.x, y: p.y, rar: c.rar, give: c.give, open: false }); });
  // Je Hütte und je Torii (Lintel) eine Truhe daneben, Inhalt aus Position abgeleitet (stabile IDs). Keine zweite Truhe, wenn schon eine nahe steht.
  W.S.forEach(st => {
    if (st.type !== 'hut' && st.type !== 'lintel') return;
    const px = st.type === 'hut' ? st.x + st.w / 2 : st.x + st.w + 1.5, py = st.type === 'hut' ? st.y + st.h + 1.2 : st.y + .5;
    if (I.chests.some(c => Math.hypot(c.x - px, c.y - py) < 8)) return;
    const r = W.h(st.x, st.y, 55), give = r < .3 ? { coins: 40 + Math.floor(r * 200) } : r < .5 ? { item: 'herb', n: 2 } : r < .7 ? { item: 'wood', n: 4 } : r < .85 ? { item: 'stone', n: 4 } : { item: 'iron', n: 2 };
    const p = free(px, py); I.chests.push({ id: 'c_' + st.type + '_' + st.x + '_' + st.y, x: p.x, y: p.y, rar: 'common', give, open: false });
  });

  I.add = function (id, n, d) { // d = Rest-Haltbarkeit des (einen) Exemplars
    n = n === undefined ? 1 : n;
    if (!it(id) || !(n > 0)) return false;
    I.bag[id] = Math.min(I.MAXSTACK, (I.bag[id] || 0) + Math.floor(n));
    if (durMax(id)) { const a = I.dur[id] = I.dur[id] || []; while (a.length < I.bag[id]) a.push(d === undefined ? durMax(id) : d); a.length = I.bag[id]; }
    touch(); return true;
  };
  I.remove = function (id, n, i) { // i = Exemplar-Index (Waffen); ohne i geht das am stärksten abgenutzte
    n = n === undefined ? 1 : n;
    if (!(I.bag[id] >= n) || !(n > 0)) return false;
    I.bag[id] -= n; if (I.bag[id] <= 0) delete I.bag[id];
    const a = I.dur[id]; if (a) for (let k = 0; k < n; k++) a.splice(i !== undefined ? i : a.indexOf(Math.min(...a)), 1); if (a && !a.length) delete I.dur[id];
    touch(); return true;
  };
  I.spend = function (n) { if (!(n >= 0) || I.coins < n) return false; I.coins -= n; touch(); return true; };
  I.owned = id => (I.bag[id] > 0) || D.slots.some(s => I.eq[s] === id);
  I.lvl = id => I.up[id] || 0;
  I.name = id => T('it_' + id) + (I.lvl(id) ? ' +' + I.lvl(id) : '');
  I.addCoins = function (n) { if (!(n > 0)) return 0; I.coins += Math.floor(n); touch(); return Math.floor(n); };
  I.coinDrop = type => { const r = D.coins[type]; return r ? rnd(r[0], r[1]) : 5; };

  // Ausrüsten: Gegenstand wandert aus dem Beutel in den Slot, der alte zurück in den Beutel
  I.equip = function (id, i) {
    const d = it(id);
    if (!d || !d.slot || !(I.bag[id] > 0)) return false;
    const old = I.eq[d.slot], od = I.edur[d.slot], nd = I.dur[id] && I.dur[id][i || 0];
    I.remove(id, 1, i || 0); if (old) I.add(old, 1, od);
    I.eq[d.slot] = id; if (nd !== undefined) I.edur[d.slot] = nd; else delete I.edur[d.slot]; touch(); return true;
  };
  I.unequip = function (slot) {
    const id = I.eq[slot]; if (!id) return false;
    I.add(id, 1, I.edur[slot]); delete I.eq[slot]; delete I.edur[slot]; touch(); return true;
  };
  I.durOf = slot => I.eq[slot] && durMax(I.eq[slot]) ? (I.edur[slot] === undefined ? durMax(I.eq[slot]) : I.edur[slot]) : null;
  // Nutzung: je Treffer 1 Punkt Abnutzung; bei 0 zerbricht die Waffe (Aufruf aus allen drei Kampfmodi)
  I.wear = function (slots) {
    slots.forEach(s => {
      const id = I.eq[s], m = durMax(id); if (!m) return;
      const v = (I.edur[s] === undefined ? m : I.edur[s]) - 1;
      if (v > 0) { I.edur[s] = v; return; }
      delete I.eq[s]; delete I.edur[s];
      if (SW.UI && SW.UI.banner) SW.UI.banner(T('wpn_broke', T('it_' + id)));
    });
    if (!I.eq.ranged && typeof document !== 'undefined') { const b = document.getElementById('cb-ranged'); if (b) b.style.display = 'none'; }
    touch();
  };
  I.candidates = slot => Object.keys(I.bag).filter(id => I.bag[id] > 0 && it(id) && it(id).slot === slot);

  // Summe aller Ausrüstungsboni (wird von SW.Char.combat() genutzt)
  I.bonus = function () {
    const b = { atk: 0, def: 0, hp: 0, crit: 0, rec: 0, dodge: 0, ambush: 0, parry: 0, counter: 0, kiCost: 0, kiRegen: 0, critDmg: 0, rdmg: 0, rwind: 0, rrec: 0 };
    D.slots.forEach(s => {
      const id = I.eq[s], d = it(id); if (!d) return;
      for (const k in d.fx) b[k] += d.fx[k];
      const l = I.lvl(id); // Verbesserungen des Schmieds
      if (l) { if (d.slot === 'ranged') b.rdmg += D.upFx.rdmg * l; else if (d.type === 'weapon') b.atk += D.upFx.atk * l; else if (d.type === 'armor') b.def += D.upFx.def * l; }
    });
    return b;
  };
  const r1 = v => Math.round(v * 10) / 10;
  I.fxLines = function (fx) {
    const o = [], p = v => Math.round(Math.abs(v) * 100);
    if (fx.atk) o.push(T('fx_atk', p(fx.atk)));
    if (fx.def) o.push(T('fx_def', r1(fx.def)));
    if (fx.hp) o.push(T('fx_hp', r1(fx.hp)));
    if (fx.crit) o.push(T('fx_crit', r1(fx.crit)));
    if (fx.rec) o.push(T(fx.rec < 0 ? 'fx_fast' : 'fx_slow', p(fx.rec)));
    if (fx.dodge) o.push(T(fx.dodge > 0 ? 'fx_dodge_up' : 'fx_dodge_dn', p(fx.dodge)));
    if (fx.ambush) o.push(T('fx_ambush', p(fx.ambush)));
    if (fx.counter) o.push(T('fx_counter', p(fx.counter)));
    if (fx.kiCost) o.push(T('fx_kicost', p(fx.kiCost)));
    if (fx.kiRegen) o.push(T('fx_kiregen', p(fx.kiRegen)));
    if (fx.critDmg) o.push(T('fx_critdmg', p(fx.critDmg)));
    if (fx.parry) o.push(T('fx_parry', Math.round(fx.parry * 1000)));
    if (fx.rdmg) o.push(T('fx_rdmg', r1(fx.rdmg)));
    if (fx.rrec) o.push(T('fx_rrec', r1(fx.rrec)));
    if (fx.rwind) o.push(T('fx_rwind', p(fx.rwind)));
    return o;
  };

  // ---------- Truhen: jede nur einmal, Inhalt = genau ein Eintrag ----------
  I.open = function (c) {
    if (!c || c.open) return false;
    const g = c.give; let txt;
    if (g.coins) { I.addCoins(g.coins); txt = T('found_coins', g.coins); }
    else if (g.ess) { SW.Essence.add(g.ess); txt = g.ess + ' ' + T('ess'); }
    else if (g.scroll) { if (!SW.Skills.findScroll(g.scroll)) return false; txt = T('scr_found'); }
    else if (g.item) { if (!I.add(g.item, g.n || 1)) return false; txt = T('it_' + g.item) + ((g.n || 1) > 1 ? ' ×' + g.n : ''); }
    else return false;
    c.open = true; touch();
    if (SW.UI && SW.UI.banner) SW.UI.banner(T('found') + ' ' + txt);
    return true;
  };
  I.check = function (p) {
    if (SW.Combat.active || SW.paused) return;
    for (let i = 0; i < I.chests.length; i++) {
      const c = I.chests[i];
      if (!c.open && Math.hypot(c.x - p.x, c.y - p.y) < 1.3) { I.open(c); return; }
    }
  };

  I.dump = () => ({ coins: I.coins, bag: Object.assign({}, I.bag), eq: Object.assign({}, I.eq), up: Object.assign({}, I.up), chests: I.chests.filter(c => c.open).map(c => c.id), dur: JSON.parse(JSON.stringify(I.dur)), edur: Object.assign({}, I.edur) });
  I.load = function (d) {
    if (!d || typeof d !== 'object') return;
    if (typeof d.coins === 'number' && isFinite(d.coins) && d.coins >= 0) I.coins = Math.floor(d.coins);
    I.bag = {};
    for (const id in (d.bag || {})) { const n = d.bag[id]; if (it(id) && typeof n === 'number' && n > 0) I.bag[id] = Math.min(I.MAXSTACK, Math.floor(n)); }
    if (d.eq && typeof d.eq === 'object') { I.eq = {}; D.slots.forEach(s => { const id = d.eq[s]; if (id && it(id) && it(id).slot === s) I.eq[s] = id; }); }
    I.dur = {}; I.edur = {};
    for (const id in I.bag) if (durMax(id)) { const a = (d.dur || {})[id] || []; I.dur[id] = Array.from({ length: I.bag[id] }, (_, k) => typeof a[k] === 'number' && a[k] > 0 ? Math.min(durMax(id), a[k]) : durMax(id)); } // alte Stände: voll
    for (const s in I.eq) { const v = (d.edur || {})[s]; if (durMax(I.eq[s]) && typeof v === 'number' && v > 0) I.edur[s] = Math.min(durMax(I.eq[s]), v); }
    I.up = {};
    for (const id in (d.up || {})) { const n = d.up[id]; if (it(id) && (it(id).type === 'weapon' || it(id).type === 'armor') && typeof n === 'number' && n >= 1) I.up[id] = Math.min(D.upMax, Math.floor(n)); }
    (d.chests || []).forEach(id => { const c = I.chests.find(x => x.id === id); if (c) c.open = true; });
  };

  // ---------- Menüseiten ----------
  const H = SW.Menus.h, el = H.el, add = H.add, btn = H.btn, page = H.page, refresh = H.refresh;
  let sel = null;
  const ORD = { weapon: 0, armor: 1, res: 2 };
  const cmp = (a, b) => (ORD[it(a).type] - ORD[it(b).type]) || T('it_' + a).localeCompare(T('it_' + b));
  const lines = (root, fx) => { const l = I.fxLines(fx); l.forEach(s => add(root, el('div', 'ok', s))); return l.length; };
  // Item-Icons liegen relativ zur GitHub-Pages-Root unter assets/images/items/icons/.
  const icon = (id, cls) => { const img = document.createElement('img'); img.className = cls || 'item-icon'; img.src = 'assets/images/items/icons/' + id + '.png'; img.alt = I.name(id); img.loading = 'lazy'; img.onerror = () => { img.style.display = 'none'; }; return img; };
  const rarChip = d => el('span', 'chip r_' + d.rar, T('rar_' + d.rar));

  let cat = 'weapon', srt = 'type';
  const CATS = ['weapon', 'armor', 'res'], SORTS = ['type', 'rar', 'dur', 'name']; // Zelda-Tabs + Sortierung
  const RAR = D.rarities || ['common', 'uncommon', 'rare', 'epic', 'legendary'];
  const durBar = (v, m) => { const b = el('span', 'dur' + (v / m <= .25 ? ' low' : '')), i = el('i'); i.style.width = Math.round(v / m * 100) + '%'; return add(b, i); };
  const durTxt = (v, m) => T('dur') + ': ' + v + '/' + m;
  SW.Menus.inventory = function (p) {
    const root = page(p, T('tab_inventory'));
    add(root, add(el('div', 'row'), el('span', 'chip', T('coins') + ': ' + I.coins)));
    const tabs = el('div', 'row');
    CATS.forEach(c => add(tabs, btn(T('ty_' + c), c === cat ? 'pri' : '', () => { cat = c; sel = null; refresh(); })));
    add(tabs, btn(T('sort') + ': ' + T('sort_' + srt), '', () => { srt = SORTS[(SORTS.indexOf(srt) + 1) % SORTS.length]; refresh(); }));
    add(root, tabs);
    // Ausgerüstet: Tippen = ablegen
    if (cat !== 'res') {
      const eqr = el('div', 'row');
      D.slots.filter(s => { const id = I.eq[s]; return id ? it(id).type === cat : D.items.some(x => x.slot === s && x.type === cat); }).forEach(s => {
        const id = I.eq[s], dv = I.durOf(s);
        add(eqr, id ? btn(T('eqs_' + s) + ': ' + I.name(id) + (dv !== null ? ' (' + dv + ')' : '') + ' ✕', 'r_' + it(id).rar, () => { I.unequip(s); refresh(); }) : el('span', 'chip dim', T('eqs_' + s) + ': ' + T('empty')));
      });
      add(root, eqr);
    }
    // Eintraege: Waffen je Exemplar (eigene Haltbarkeit), sonst gestapelt
    const es = [];
    Object.keys(I.bag).forEach(id => {
      if (!(I.bag[id] > 0) || !it(id) || it(id).type !== cat) return;
      const a = I.dur[id];
      if (a) a.forEach((v, i) => es.push({ id, i, v, m: I.DUR[it(id).rar], key: id + '#' + i }));
      else es.push({ id, key: id });
    });
    const byName = (x, y) => T('it_' + x.id).localeCompare(T('it_' + y.id)) || (x.v || 0) - (y.v || 0);
    es.sort(srt === 'rar' ? (x, y) => RAR.indexOf(it(y.id).rar) - RAR.indexOf(it(x.id).rar) || byName(x, y)
      : srt === 'dur' ? (x, y) => (x.v === undefined) - (y.v === undefined) || (x.v - y.v) || byName(x, y)
      : srt === 'name' ? byName : (x, y) => (ORD[it(x.id).type] - ORD[it(y.id).type]) || (it(x.id).slot || '').localeCompare(it(y.id).slot || '') || byName(x, y));
    if (!es.length) { add(root, el('div', 'dim', T('bag_empty'))); return; }
    if (!es.some(e => e.key === sel)) sel = es[0].key;
    const cur = es.find(e => e.key === sel);
    const split = el('div', 'split inv'), grid = el('div', 'grid'), det = el('div', 'detail');
    es.forEach(e => {
      const b = el('button', 'cell item-cell r_' + it(e.id).rar + (e.key === sel ? ' sel' : ''));
      add(b, icon(e.id), el('span', 'item-cell-name', I.name(e.id)));
      if (e.v !== undefined) add(b, durBar(e.v, e.m)); else if (I.bag[e.id] > 1) add(b, el('small', '', '×' + I.bag[e.id]));
      b.onclick = () => { sel = e.key; refresh(); };
      add(grid, b);
    });
    for (let n = es.length, tot = Math.max(20, Math.ceil(n / 5) * 5); n < tot; n++) add(grid, el('div', 'cell empty')); // leere Felder wie im Entwurf (5 Spalten, min. 4 Reihen)
    const d = it(cur.id);
    add(det, add(el('div', 'item-detail-head'), icon(cur.id, 'item-icon item-icon-large'), add(el('div'), el('h3', '', I.name(cur.id)), add(el('div', 'row'), rarChip(d), el('span', 'chip', T('ty_' + d.type) + (d.slot ? ' · ' + T('eqs_' + d.slot) : ''))))));
    add(det, el('div', 'dim', T('itd_' + cur.id)));
    if (d.type === 'weapon') add(det, el('div', cur.v !== undefined ? 'ok' : 'dim', cur.v !== undefined ? durTxt(cur.v, cur.m) : T('dur') + ': ' + T('dur_inf')));
    lines(det, d.fx);
    if (d.slot) add(det, btn(T('equip'), 'pri', () => { I.equip(cur.id, cur.i); refresh(); }));
    add(split, grid, det); add(root, split);
  };

  return I;
})();
