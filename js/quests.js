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
  const spot = id => SW.Combat.spots.find(s => s.id === id) || null;
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
    for (const t in (r.ess || {})) p.push(r.ess[t] + ' ' + T('ess_' + t));
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
    for (const t in (rew.ess || {})) SW.Essence.add(t, rew.ess[t]);
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
    const r = q.req || [], p = [];
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
    const mine = D.quests.filter(q => q.giver === cur.id);
    let refused = false;
    mine.forEach(q => {
      const s = Q.status(q.id);
      if (s === 'ready') add(body, btn(T('q_report') + ': ' + T('qn_' + q.id), 'pri', () => go(q.id)));
      else if (s === 'avail') { if (Q.refuses()) refused = true; else add(body, btn(T('q_offer') + ': ' + T('qn_' + q.id), '', () => go(q.id))); }
      else if (s === 'active') add(body, el('div', 'dim', T('qn_' + q.id) + ' – ' + Q.objText(q)));
      else if (Q.storyOpen(q) && !Q.refuses()) add(body, el('div', 'dim', T('qn_' + q.id) + ' – ' + T('q_locked') + ': ' + needText(q)));
    });
    if (refused) add(body, el('div', 'no', T('q_refuse')));
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

  // ---------- Quest-Menü ----------
  SW.Menus.quests = function (p) {
    const root2 = H.page(p, T('tab_quests'));
    if (SW.Village) add(root2, SW.Village.card());
    const group = (title, list) => {
      if (!list.length) return;
      add(root2, el('h3', '', title));
      list.forEach(q => {
        const s = Q.status(q.id), card = el('div', 'card');
        add(card, add(el('div', 'row'), el('b', '', T('qn_' + q.id)), el('span', 'chip', T('qs_' + (s === 'ready' ? 'ready' : s === 'done' ? 'done' : 'active')))));
        add(card, el('div', 'dim', T('qd_' + q.id)));
        add(card, el('div', '', T('q_goal') + ': ' + Q.objText(q)));
        add(card, el('div', 'dim', T('q_from') + ': ' + T('npc_' + npc(q.giver).role)));
        add(card, el('div', 'ok', T('q_reward') + ': ' + (q.choice ? q.choice.map(c => Q.rewText(c.rew)).join('  /  ') : Q.rewText(q.rew))));
        if (s === 'done' && Q.ch[q.id]) add(card, el('div', 'dim', T('qc_' + q.id + '_' + Q.ch[q.id])));
        add(root2, card);
      });
    };
    const act = D.quests.filter(q => { const s = Q.status(q.id); return s === 'active' || s === 'ready'; });
    const done = D.quests.filter(q => Q.status(q.id) === 'done');
    if (!act.length && !done.length) add(root2, el('div', 'dim', T('q_none')));
    group(T('q_active'), act); group(T('q_finished'), done);
  };
  return Q;
})();
