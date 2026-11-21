'use strict';
// Menüseiten (Phase 3): Character, Skills, Skilltree, Karma & Yin-Yang. Aufruf aus ui.js: SW.Menus[tab](panel).
SW.Menus = (function () {
  const M = {}, T = (k, n) => SW.t(k, n);
  let br = 'sm', sel = null;
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
  const add = (p, ...c) => { c.forEach(x => { if (x) p.appendChild(x); }); return p; };
  const refresh = () => SW.UI.refresh();
  const bar = (r, col) => { const b = el('div', 'bar'), i = el('i'); i.style.width = Math.max(0, Math.min(100, r * 100)) + '%'; i.style.background = col; return add(b, i); };
  const btn = (txt, cls, fn, off) => { const b = el('button', 'btn ' + (cls || ''), txt); b.disabled = !!off; b.onclick = fn; return b; };
  const reqRows = list => { const w = el('div', 'reqs'); list.forEach(r => add(w, el('div', r.ok ? 'ok' : 'no', (r.ok ? '✓ ' : '✗ ') + r.text))); return w; };
  const page = (p, title) => { const root = el('div', 'pn'); add(root, el('h3', '', title)); p.appendChild(root); return root; };

  M.character = function (p) {
    const C = SW.Char, b = C.base(), cs = C.combat(), root = page(p, T('tab_character'));
    add(root, add(el('div', 'row'), el('b', '', T('lvl') + ' ' + C.level),
      bar(C.level >= C.MAX ? 1 : C.xp / C.need(C.level), '#c8a24a'),
      el('span', 'chip', C.level >= C.MAX ? 'MAX' : C.xp + ' / ' + C.need(C.level) + ' XP')));
    add(root, add(el('div', 'row'), el('span', 'chip', T('sp') + ': ' + C.sp), el('span', 'chip', T('ap') + ': ' + C.ap)));
    const rows = [
      ['hp', T('st_hp'), Math.round(cs.hp)], ['ki', T('st_ki'), Math.round(cs.ki)], ['atk', T('st_atk'), '×' + cs.atk.toFixed(2)],
      ['def', T('st_def'), cs.def.toFixed(1)], ['end', T('st_end'), Math.round(b.end)], ['crit', T('st_crit'), (cs.crit * 100).toFixed(1) + '%']
    ];
    rows.forEach(r => {
      const row = el('div', 'row stat');
      add(row, el('span', 'lbl', r[1]), el('b', 'val', String(r[2])));
      add(row, btn('+', 'pri sq', () => { C.spend(r[0]); refresh(); }, C.ap < 1 || (r[0] === 'crit' && b.crit >= 40)));
      add(root, row);
    });
  };

  M.skills = function (p) {
    const S = SW.Skills, D = SW.Data, root = page(p, T('tab_skills'));
    const row = el('div', 'row');
    [0, 1].forEach(i => {
      const id = S.slots[i], box = el('button', 'btn slotbox', T('slot', i + 1) + ': ' + (id ? T('sk_' + id) : T('slot_empty')));
      box.onclick = () => { S.unequip(i); refresh(); };
      add(row, box);
    });
    add(root, row);
    const acts = S.nodes.filter(n => n.type === 'active' && S.learned[n.id]).map(n => n.id).concat(D.secrets.filter(s => S.sec[s.id] === 2).map(s => s.id));
    if (!acts.length) add(root, el('div', 'dim', T('no_active')));
    acts.forEach(id => {
      const m = D.moves[S.moveOf(id)], line = el('div', 'row card');
      add(line, el('b', '', T('sk_' + id)), el('span', 'chip', T('ki_cost', Math.ceil(m.ki * SW.Char.combat().kiCostMul))));
      [0, 1].forEach(i => add(line, btn(T('slot', i + 1), S.slots[i] === id ? 'pri' : '', () => { S.equip(id, i); refresh(); })));
      add(root, line, el('div', 'dim', T('skd_' + id)));
    });
    const sec = S.secrets();
    if (sec.length) {
      add(root, el('h3', '', T('secret')));
      sec.forEach(s => {
        const st = S.sec[s.id], line = el('div', 'row card');
        add(line, el('b', '', T('sk_' + s.id)), el('span', 'chip', st === 2 ? T('st_active') : S.secReady(s.id) ? T('st_ready') : T('st_locked')));
        if (st === 1) add(line, btn(T('activate'), 'pri', () => { S.activate(s.id); refresh(); }, !S.secReady(s.id)));
        add(root, line, el('div', 'dim', T('skd_' + s.id)));
        if (st === 1) add(root, reqRows(S.secReqs(s.id)));
      });
    }
    add(root, el('h3', '', T('passive')));
    const ps = S.nodes.filter(n => n.type === 'passive' && S.learned[n.id]);
    if (!ps.length) add(root, el('div', 'dim', T('no_passive')));
    ps.forEach(n => add(root, el('div', 'card', T('sk_' + n.id) + ' – ' + T('skd_' + n.id))));
  };

  M.skilltree = function (p) {
    const S = SW.Skills, E = SW.Essence, root = page(p, T('tab_skilltree'));
    const head = el('div', 'row'); add(head, el('span', 'chip', T('sp') + ': ' + SW.Char.sp));
    E.TYPES.forEach(t => add(head, el('span', 'chip ess_' + t, T('ess_' + t) + ' ' + E.n[t])));
    add(root, head);
    const brs = el('div', 'row');
    SW.Data.branches.forEach(b => add(brs, btn(T('br_' + b), b === br ? 'pri' : '', () => { br = b; sel = null; refresh(); })));
    add(root, brs);
    const list = S.nodes.filter(n => n.br === br).sort((a, b) => a.tier - b.tier);
    if (!sel || !list.some(n => n.id === sel)) sel = list[0].id;
    const split = el('div', 'split'), col = el('div', 'nodes'), det = el('div', 'detail');
    list.forEach(n => {
      const st = S.learned[n.id] ? 'done' : S.can(n.id) ? 'av' : '';
      const b = el('button', 'node ' + st + (sel === n.id ? ' sel' : ''), (S.learned[n.id] ? '✓ ' : '') + T('sk_' + n.id) + '  ·  ' + n.tier + ' · ' + T(n.type));
      b.onclick = () => { sel = n.id; refresh(); };
      add(col, b);
    });
    const n = S.node(sel);
    add(det, el('h3', '', T('sk_' + n.id)), el('div', 'chip', T(n.type)), el('div', 'dim', T('skd_' + n.id)));
    if (S.learned[n.id]) add(det, el('div', 'ok', '✓ ' + T('learned')));
    else add(det, reqRows(S.reqs(n.id)), btn(T('learn'), 'pri', () => { S.learn(n.id); refresh(); }, !S.can(n.id)));
    add(split, col, det); add(root, split);
    add(root, btn(T('reset') + ' (' + S.resetText() + ')', '', () => { if (confirm(T('reset_ask'))) { S.reset(); refresh(); } }, !S.spent || !SW.Essence.has(S.resetCost())));
  };

  M.karma = function (p) {
    const K = SW.Karma, Y = SW.YinYang, root = page(p, T('tab_karma')), bo = Y.bonus();
    add(root, add(el('div', 'row'), el('b', '', 'Karma'), bar((K.v + 100) / 200, K.v >= 0 ? '#6fbf73' : '#c8553c'),
      el('span', 'chip', Math.round(K.v) + ' · ' + T('kr_' + K.rank()))));
    add(root, el('div', 'dim', T('kr_hint')));
    add(root, add(el('div', 'row'), el('b', 'lbl', 'Yin'), bar(Y.yin / 100, '#6aa7e0'), el('span', 'chip', String(Math.round(Y.yin)))));
    add(root, add(el('div', 'row'), el('b', 'lbl', 'Yang'), bar(Y.yang / 100, '#e0703a'), el('span', 'chip', String(Math.round(Y.yang)))));
    const info = [];
    if (bo.atk) info.push(T('yy_atk', Math.round(bo.atk * 100)));
    if (bo.def) info.push(T('yy_def', Math.round(bo.def * 100)));
    if (bo.balance) info.push(T('yy_bal'));
    if (!info.length) info.push(T('yy_none'));
    info.forEach(s => add(root, el('div', 'ok', s)));
    add(root, el('div', 'dim', T('yy_hint')));
  };

  M.settings = function (p) {
    const root = page(p, T('tab_settings')), row = el('div', 'row');
    add(root, el('b', '', T('set_lang')));
    ['en', 'de'].forEach(l => add(row, btn(T('lang_' + l), SW.lang === l ? 'on' : '', () => { SW.setLang(l); SW.UI.relabel(); refresh(); })));
    add(root, row);
    add(root, el('b', '', T('set_save')));
    const box = el('div', 'row'), ask = () => {
      box.innerHTML = '';
      add(box, el('span', '', T('set_wipe_ask')), btn(T('set_wipe_yes'), 'on', () => SW.Save.clear()), btn(T('set_wipe_no'), '', () => { box.innerHTML = ''; add(box, first); }));
    }, first = btn(T('set_wipe'), '', ask);
    add(box, first); add(root, box);
  };

  M.h = { el, add, btn, page, refresh };
  return M;
})();

Object.assign(SW.TEXT.en, {
  st_hp: 'Life', st_ki: 'Ki', st_atk: 'Attack', st_def: 'Defense', st_end: 'Endurance', st_crit: 'Crit chance',
  kr_neutral: 'Neutral', kr_honored: 'Honored', kr_revered: 'Revered', kr_distrusted: 'Distrusted', kr_despised: 'Despised',
  kr_hint: 'Helping others and stopping bandits raises Karma. Repeating the same deed counts less each time.',
  yy_atk: 'Yang surplus: attack +{n}%', yy_def: 'Yin surplus: defense +{n}%', yy_bal: 'Balance: Ki regeneration +25%, crit chance +3%',
  yy_none: 'No Yin-Yang bonus yet.',
  yy_hint: 'Yang grows through heavy attacks and techniques. Yin grows through parries, dodges, blocks and breathing. Each fight counts only a little.'
});
