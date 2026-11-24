'use strict';
// Quest-System (Phase 5b). Namensraum SW.Quests. Gespeichert wird nur der Status je Quest (aktiv/erledigt, Entscheidung).
// Fortschritt wird aus der Welt abgeleitet (Gegner besiegt, Schrein erweckt, Beutel-Inhalt), damit nichts doppelt gespeichert wird.
// Braucht SW.Menus.h (menus.js). SW.Shop, SW.Combat, SW.Shrines werden erst zur Laufzeit benutzt.
SW.Quests = (function () {
  const D = SW.Data, Q = { st: {}, ch: {} }, T = (k, n) => SW.t(k, n);
  const get = id => D.quests.find(q => q.id === id) || null;
  Q.get = get;
  const npc = id => SW.Shop.npcs.find(n => n.id === id) || null;
  const tone = () => SW.Karma.v >= 30 ? 'pos' : SW.Karma.v <= -30 ? 'neg' : 'neu';
  const spot = id => SW.Combat.spot(id);
  const banner = t => { if (SW.UI) SW.UI.banner(t); };

  Q.refuses = () => SW.Karma.v <= -30; // schlechter Ruf: Dorfältester gibt keine neuen Quests
  Q.storyOpen = q => !q.req || !q.req.done || Q.st[q.req.done] === 'done';
  Q.reqOk = function (q) {
    const r = q.req || {};
    return Q.storyOpen(q) && (!r.level || SW.Char.level >= r.level) && (r.karma === undefined || SW.Karma.v >= r.karma);
  };
  Q.have = q => q.obj.type === 'have' ? (SW.Inv.bag[q.obj.item] || 0) : 0;
  Q.met = function (q) {
    const o = q.obj;
    if (o.type === 'kill') { const s = spot(o.spot); return !!(s && s.dead); }
    if (o.type === 'shrine') return SW.Shrines.isOn(o.shrine);
    if (o.type === 'have') return Q.have(q) >= o.n;
    return false;
  };
  Q.status = function (id) {
    const q = get(id); if (!q) return 'locked';
    const s = Q.st[id];
    if (s === 'done') return 'done';
    if (s === 'active') return Q.met(q) ? 'ready' : 'active';
    return Q.reqOk(q) ? 'avail' : 'locked';
  };
  Q.accept = function (id) {
    if (Q.status(id) !== 'avail' || Q.refuses()) return false;
    Q.st[id] = 'active'; SW.Save.touch(); banner(T('q_new', T('qn_' + id))); return true;
  };
  Q.rewText = function (r) {
    const p = [];
    if (r.coins) p.push(r.coins + ' ' + T('coins'));
    if (r.xp) p.push(r.xp + ' XP');
    if (r.ess) p.push(r.ess + ' ' + T('ess'));
    if (r.karma) p.push('Karma ' + (r.karma > 0 ? '+' : '') + r.karma);
    return p.join(' · ');
  };
  Q.objText = function (q) {
    const o = q.obj;
    return T('qo_' + q.id) + (o.type === 'have' ? ' (' + Math.min(Q.have(q), o.n) + '/' + o.n + ')' : '');
  };
  // Abschluss: Gegenstände abgeben, jedes System bekommt nur seinen Teil (Münzen, XP, Essence, Karma)
  Q.complete = function (id, choice) {
    const q = get(id); if (!q || Q.status(id) !== 'ready') return false;
    let rew = q.rew, ch = null;
    if (q.choice) { ch = q.choice.find(c => c.id === choice); if (!ch) return false; rew = ch.rew; }
    if (q.obj.type === 'have' && !SW.Inv.remove(q.obj.item, q.obj.n)) return false;
    let lv = [], vt = '';
    if (rew.coins) SW.Inv.addCoins(rew.coins);
    if (rew.xp) lv = SW.Char.addXp(rew.xp);
    if (rew.ess) SW.Essence.add(rew.ess);
    if (rew.karma) SW.Karma.add('quest_' + id, rew.karma);
    Q.st[id] = 'done'; if (ch) Q.ch[id] = ch.id;
    if (id === 'elder2' && SW.World.buildVillageFence) SW.World.buildVillageFence();
    if (SW.Village) vt = SW.Village.update(true);
    SW.Save.touch();
    banner(T('q_done', T('qn_' + id)) + (lv.length ? ' ' + lv.join(' ') : '') + (vt ? ' · ' + vt : ''));
    return true;
  };
  // Marker über NPCs: 2 = Abgabe bereit, 1 = neue Quest, 0 = nichts
  Q.mark = function (npcId) {
    let best = 0;
    for (let i = 0; i < D.quests.length; i++) {
      const q = D.quests[i]; if (q.giver !== npcId) continue;
      const s = Q.status(q.id);
      if (s === 'ready') return 2;
      if (s === 'avail' && !Q.refuses()) best = 1;
    }
    return best;
  };
  // Zielpunkte für Minimap und Karte
  Q.targets = function () {
    const out = [];
    D.quests.forEach(q => {
      const s = Q.status(q.id);
      if (s === 'ready') { const n = npc(q.giver); if (n && SW.Shop.on(n)) out.push({ x: n.x, y: n.y }); }
      else if (s === 'active') {
        const o = q.obj, t = o.type === 'kill' ? spot(o.spot) : o.type === 'shrine' ? SW.Shrines.get(o.shrine) : null;
        if (t) out.push({ x: t.x, y: t.y });
      }
    });
    return out;
  };
  Q.dump = () => ({ st: Object.assign({}, Q.st), ch: Object.assign({}, Q.ch) });
  Q.load = function (d) {
    if (!d || typeof d !== 'object') return;
    const st = d.st || {}, ch = d.ch || {};
    D.quests.forEach(q => {
      if (st[q.id] === 'active' || st[q.id] === 'done') Q.st[q.id] = st[q.id];
      if (q.choice && typeof ch[q.id] === 'string' && q.choice.some(c => c.id === ch[q.id])) Q.ch[q.id] = ch[q.id];
    });
    if (Q.st.elder2 === 'done' && SW.World.buildVillageFence) SW.World.buildVillageFence();
    if (SW.Village) SW.Village.update(false);
  };

  // ---------- Dialog ----------
  const H = SW.Menus.h, el = H.el, add = H.add, btn = H.btn;
  let root, body, titleEl, cur = null, view = null;
  function ensure() {
    if (root) return;
    root = el('div'); root.id = 'dlg';
    const head = el('div', 'shop-h'); titleEl = el('h3');
    add(head, titleEl, btn(T('close'), '', () => Q.close()));
    body = el('div'); body.id = 'dlg-body';
    add(root, head, body); document.body.appendChild(root);
  }
  const go = v => { view = v; render(); };
  const needText = q => {
    const r = q.req || {}, p = [];
    if (r.level) p.push(T('lvl') + ' ' + r.level);
    if (r.karma !== undefined) p.push('Karma ' + r.karma);
    return p.join(', ');
  };
  function detail(id) {
    const q = get(id), s = Q.status(id);
    add(body, el('h3', '', T('qn_' + id)), el('div', 'dlgtext', T(s === 'ready' ? 'qdone_' + id : 'qd_' + id)));
    add(body, el('div', 'dim', T('q_goal') + ': ' + Q.objText(q)));
    if (s === 'avail') {
      add(body, el('div', 'ok', T('q_reward') + ': ' + Q.rewText(q.rew)));
      add(body, add(el('div', 'row'), btn(T('q_accept'), 'pri', () => { Q.accept(id); go(null); }), btn(T('q_back'), '', () => go(null))));
    } else if (s === 'ready') {
      if (q.choice) {
        add(body, el('div', 'dim', T('q_choose')));
        q.choice.forEach(c => add(body, add(el('div', 'row card'), btn(T('qc_' + id + '_' + c.id), 'pri', () => { Q.complete(id, c.id); go(null); }), el('span', 'dim', Q.rewText(c.rew)))));
      } else {
        add(body, el('div', 'ok', T('q_reward') + ': ' + Q.rewText(q.rew)));
        add(body, btn(T('q_complete'), 'pri', () => { Q.complete(id); go(null); }));
      }
      add(body, btn(T('q_back'), '', () => go(null)));
    } else add(body, btn(T('q_back'), '', () => go(null)));
  }
  function render() {
    if (!cur) return;
    titleEl.textContent = T('npc_' + cur.role); body.innerHTML = '';
    if (view) { detail(view); return; }
    add(body, el('div', 'dlgtext', T('dl_' + cur.role + '_' + tone())));
    // Gruppen: Abgabe > neu > aktiv > gesperrt (nur nächste Stufe) > erledigt (nur Anzahl)
    const mine = D.quests.filter(q => q.giver === cur.id), G = { ready: [], avail: [], active: [], locked: [], done: [] };
    mine.forEach(q => { const s = Q.status(q.id); if (s !== 'locked' || (Q.storyOpen(q) && needText(q))) G[s].push(q); });
    const sec = (k, h, fn) => { if (G[k].length) { add(body, el('h4', '', h)); G[k].forEach(fn); } };
    sec('ready', T('qs_ready'), q => add(body, btn(T('q_report') + ': ' + T('qn_' + q.id), 'pri', () => go(q.id))));
    if (Q.refuses()) { if (G.avail.length) add(body, el('div', 'no', T('q_refuse'))); }
    else sec('avail', T('q_offer'), q => add(body, btn(T('qn_' + q.id), '', () => go(q.id))));
    sec('active', T('qs_active'), q => add(body, el('div', 'dim', T('qn_' + q.id) + ' – ' + Q.objText(q))));
    if (!Q.refuses()) sec('locked', T('q_locked'), q => add(body, el('div', 'dim', T('qn_' + q.id) + ' – ' + needText(q))));
    if (G.done.length) add(body, el('div', 'dim', '✓ ' + T('qs_done') + ': ' + G.done.length));
  }
  Q.open = function (n) {
    if (!n || SW.paused || SW.Combat.active) return false;
    ensure(); cur = n; view = null;
    SW.paused = true; SW.Input.reset(); root.classList.add('open'); render(); return true;
  };
  Q.close = function () {
    if (!cur) return;
    cur = null; view = null; if (root) root.classList.remove('open');
    SW.paused = false; SW.Input.reset(); SW.Save.touch();
  };

  // ---------- Quest-Menü (Zelda-Stil: Liste links, Details rechts) ----------
  let qsel = null;
  SW.Menus.quests = function (p) {
    const root2 = H.page(p, T('tab_quests')), rank = { ready: 0, active: 1, done: 2 };
    const all = D.quests.filter(q => rank[Q.status(q.id)] !== undefined).sort((a, b) => rank[Q.status(a.id)] - rank[Q.status(b.id)]);
    if (!all.length) add(root2, el('div', 'dim', T('q_none')));
    else {
      if (!all.some(q => q.id === qsel)) qsel = all[0].id;
      const lay = el('div', 'qlay'), list = el('div', 'qlist'), det = el('div', 'qdet card');
      all.forEach(q => {
        const s = Q.status(q.id), b = el('button', 'btn qrow' + (q.id === qsel ? ' on' : '') + (s === 'done' ? ' qdone' : ''));
        add(b, el('b', '', (s === 'ready' ? '❢ ' : '') + T('qn_' + q.id)), el('div', 'qsub', T('qs_' + s) + ' · ' + T('npc_' + npc(q.giver).role)));
        b.onclick = () => { qsel = q.id; SW.UI.refresh(); };
        add(list, b);
      });
      const q = get(qsel), s = Q.status(qsel);
      add(det, el('h3', '', T('qn_' + qsel)), el('div', 'chip', T('qs_' + s)), el('div', 'dlgtext', T('qd_' + qsel)));
      add(det, el('div', '', T('q_goal') + ': ' + Q.objText(q)), el('div', 'dim', T('q_from') + ': ' + T('npc_' + npc(q.giver).role)));
      add(det, el('div', 'ok', T('q_reward') + ': ' + (q.choice ? q.choice.map(c => Q.rewText(c.rew)).join('  /  ') : Q.rewText(q.rew))));
      if (s === 'done' && Q.ch[qsel]) add(det, el('div', 'dim', T('qc_' + qsel + '_' + Q.ch[qsel])));
      add(lay, list, det); add(root2, lay);
    }
    if (SW.Village) add(root2, SW.Village.card());
  };
  return Q;
})();
