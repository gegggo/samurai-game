'use strict';
// Händler, Schmied, Interaktion (Phase 4b). Namensraum SW.Shop. Zahlungsmittel: nur Münzen (+ Ressourcen beim Schmied).
// Braucht inventory.js (SW.Inv) und menus.js (SW.Menus.h).
SW.Shop = (function () {
  const D = SW.Data, W = SW.World, I = SW.Inv, TAU = 6.2832, T = (k, n) => SW.t(k, n);
  const S = { npcs: [], cur: null, tab: 'buy', RANGE: 2.3 };
  const it = id => D.itemMap[id];

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
  S.free = free;
  D.npcs.forEach(n => { const p = free(n.x, n.y); S.npcs.push({ id: n.id, role: n.role, q: !!n.q, night: !!n.night, gone: n.gone, kmin: n.kmin, x: p.x, y: p.y, robe: n.robe, hat: n.hat }); });

  // Karma wirkt auf Preise: guter Ruf = Rabatt, schlechter Ruf = Aufschlag; bei sehr schlechtem Ruf verweigern Kräuter- und Allgemeinhändler
  const KM = { revered: .8, honored: .9, neutral: 1, distrusted: 1.2, despised: 1.35 };
  S.mul = () => KM[SW.Karma.rank()] || 1;
  S.price = id => { const p = D.price(id); return p > 0 ? Math.max(1, Math.round(p * S.mul())) : 0; };
  S.refuses = role => SW.Karma.rank() === 'despised' && (role === 'herb' || role === 'general' || role === 'armor');
  S.list = role => D.stock[role].concat((D.stockK[role] || []).filter(e => SW.Karma.v >= e.k).map(e => e.id)); // Basisware + Karma-Ware

  // ---------- Geschäftslogik (ohne Oberfläche, testbar) ----------
  S.buy = function (id, amount) {
    const list = S.cur ? S.list(S.cur.role) : [].concat(...Object.keys(D.stock).map(S.list));
    if (S.cur && S.refuses(S.cur.role)) return false;
    const p = S.price(id), have = I.bag[id] || 0, item = it(id);
    amount = Math.floor(Number(amount) || 1);
    if (item && item.type === 'weapon' && I.owned(id)) return false;
    amount = Math.min(amount, item && item.type === 'weapon' ? 1 : I.MAXSTACK - have, p > 0 ? Math.floor(I.coins / p) : 0);
    if (!it(id) || p <= 0 || list.indexOf(id) < 0 || amount < 1) return false;
    if (!I.spend(p * amount)) return false;
    return I.add(id, amount);
  };
  S.buyMax = id => S.buy(id, Math.min(I.MAXSTACK - (I.bag[id] || 0), Math.floor(I.coins / Math.max(1, S.price(id)))));
  S.sell = function (id, amount) {
    if (S.cur && S.refuses(S.cur.role)) return false;
    const v = D.sellPrice(id);
    amount = Math.min(Math.floor(Number(amount) || 1), I.bag[id] || 0);
    if (!v || amount < 1) return false; // nicht verkäuflich (Legendäres) oder nicht im Beutel; Ausgerüstetes bleibt sicher
    I.remove(id, amount); I.addCoins(v * amount); return true;
  };
  S.sellAll = id => S.sell(id, I.bag[id] || 0);
  const repairFactor = { common: 2, uncommon: 2, rare: 3, epic: 4 };
  S.repairTargets = function () {
    const out = [];
    D.slots.forEach(slot => {
      const id = I.eq[slot], max = id && I.DUR[it(id).rar] || 0, current = I.durOf(slot);
      if (max && current !== null && current < max) out.push({ id, slot, current, max, key: 'eq:' + slot });
    });
    Object.keys(I.dur).forEach(id => {
      const max = I.DUR[it(id).rar] || 0;
      (I.dur[id] || []).forEach((current, index) => {
        if (max && current < max) out.push({ id, index, current, max, key: 'bag:' + id + ':' + index });
      });
    });
    return out;
  };
  S.repairCost = target => {
    const missing = target.max - target.current, factor = repairFactor[it(target.id).rar] || 2;
    return { coins: Math.ceil(missing * factor * (D.priceFactor || 1)), iron: Math.max(1, Math.ceil(missing / 20)) };
  };
  S.canRepair = function (target) {
    if (!target) return false;
    const cost = S.repairCost(target);
    return I.coins >= cost.coins && (I.bag.iron || 0) >= cost.iron;
  };
  S.repair = function (target) {
    if (!target || !S.canRepair(target)) return false;
    const cost = S.repairCost(target);
    if (!I.spend(cost.coins)) return false;
    if (!I.remove('iron', cost.iron)) { I.addCoins(cost.coins); return false; }
    const ok = I.repair(target.id, target.index, target.slot);
    if (!ok) { I.addCoins(cost.coins); I.add('iron', cost.iron); return false; }
    return true;
  };
  S.upgradable = id => it(id) && (it(id).type === 'weapon' || it(id).type === 'armor') && I.owned(id);
  S.canUpgrade = function (id) {
    if (!S.upgradable(id)) return false;
    const l = I.lvl(id); if (l >= D.upMax) return false;
    const c = D.upCost(id, l); return I.coins >= c.coins && (I.bag.iron || 0) >= c.iron;
  };
  S.upgrade = function (id) {
    if (!S.canUpgrade(id)) return false;
    const l = I.lvl(id), c = D.upCost(id, l);
    I.spend(c.coins); I.remove('iron', c.iron); I.up[id] = l + 1; SW.Save.touch(); return true;
  };
  S.recipePrice = r => Math.round(r.coins * (D.priceFactor || 1));
  S.craftMax = function (r) {
    const coinMax = S.recipePrice(r) > 0 ? Math.floor(I.coins / S.recipePrice(r)) : I.MAXSTACK;
    const resourceMax = Object.keys(r.res).reduce((m, k) => r.res[k] > 0 ? Math.min(m, Math.floor((I.bag[k] || 0) / r.res[k])) : m, I.MAXSTACK);
    if (it(r.id) && it(r.id).type === 'weapon' && I.owned(r.id)) return 0;
    return Math.max(0, Math.min(coinMax, resourceMax, it(r.id) && it(r.id).type === 'weapon' ? 1 : I.MAXSTACK - (I.bag[r.id] || 0)));
  };
  S.canCraft = function (r, amount) { return S.craftMax(r) >= (amount || 1); };
  S.craft = function (r, amount) {
    amount = Math.floor(Number(amount) || 1);
    if (amount < 1 || !S.canCraft(r, amount)) return false;
    I.spend(S.recipePrice(r) * amount); for (const k in r.res) I.remove(k, r.res[k] * amount);
    return I.add(r.id, amount);
  };
  S.on = n => (!n.night || SW.Time.period() === 'night') && (n.kmin === undefined || SW.Karma.v >= n.kmin) && !(n.gone && SW.Quests && SW.Quests.st[n.gone] === 'done'); // Nacht-NPCs nur nachts; gone = weg nach Quest
  S.near = function (p) {
    let best = null, bd = S.RANGE;
    S.npcs.forEach(n => { if (n.amb || !S.on(n)) return; const d = Math.hypot(n.x - p.x, n.y - p.y); if (d < bd) { bd = d; best = n; } });
    return best;
  };

  // ---------- Oberfläche ----------
  const H = SW.Menus.h, el = H.el, add = H.add, btn = H.btn;
  let root, body, tabsEl, titleEl, coinsEl, act;
  function ensure() {
    if (root) return;
    root = el('div'); root.id = 'shop';
    const head = el('div', 'shop-h');
    titleEl = el('h3'); coinsEl = el('span', 'chip');
    const close = btn(T('close'), '', () => S.close());
    add(head, titleEl, coinsEl, close);
    tabsEl = el('div', 'row shop-t'); body = el('div'); body.id = 'shop-body';
    add(root, head, tabsEl, body); document.body.appendChild(root);
  }
  const tabsFor = role => role === 'smith' ? ['upgrade', 'repair', 'craft'] : role === 'master' ? [] : ['buy', 'sell'];
  const costTxt = o => Object.keys(o).map(k => o[k] + ' ' + T('it_' + k)).join(', ');
  const nameChip = id => el('span', 'chip r_' + it(id).rar, I.name(id));
  const info = id => el('span', 'dim', I.fxLines(it(id).fx).join(' · '));
  function quantityInput(max) {
    const input = el('input', 'shop-quantity');
    input.type = 'number'; input.inputMode = 'numeric'; input.min = '1';
    input.max = String(Math.max(1, max)); input.value = '1';
    input.setAttribute('aria-label', T('quantity') || 'Quantity');
    return input;
  }

  // Meister: gefundene Schriftrollen gegen Yin/Yang entziffern (Daten: SW.Data.scrolls)
  function masterBody() {
    const K = SW.Skills, list = SW.Data.scrolls.filter(s => K.scr[s.id]);
    const first = !K.taught; K.teach();
    if (first) add(body, el('div', 'card', T('master_teach')));
    add(body, el('div', 'dim', T('hi_master')));
    if (!list.length) add(body, el('div', 'dim', T('master_none')));
    list.forEach(s => {
      const r = el('div', 'row card'), done = K.scr[s.id] === 2;
      add(r, el('b', '', done ? T('sk_' + s.id) : T('scr_unread')));
      if (done) add(r, el('span', 'dim', T('st_active')));
      else {
        add(r, el('span', 'dim', [T('req_lvl', s.lvl), s.yin ? T('cost_yin', s.yin) : '', s.yang ? T('cost_yang', s.yang) : ''].filter(Boolean).join(' · ')));
        add(r, btn(T('decipher'), 'pri', () => { K.decipher(s.id); render(); }, !K.canDecipher(s.id)));
      }
      add(body, r);
      if (done) add(body, el('div', 'dim', T('skd_' + s.id)));
    });
  }
  function render() {
    if (!S.cur) return;
    const scrollTop = body ? body.scrollTop : 0;
    const role = S.cur.role, tabs = tabsFor(role);
    titleEl.textContent = T('npc_' + role); coinsEl.textContent = T('coins') + ': ' + I.coins;
    tabsEl.innerHTML = '';
    tabs.forEach(t => add(tabsEl, btn(T(t === 'buy' ? 'buy' : t === 'sell' ? 'sell' : t === 'upgrade' ? 'shop_upgrade' : t === 'repair' ? 'shop_repair' : 'shop_craft'), t === S.tab ? 'pri' : '', () => { S.tab = t; render(); })));
    body.innerHTML = '';
    if (role === 'master') { masterBody(); return; }
    if (S.refuses(role)) { add(body, el('div', 'no', T('refuse_' + role))); return; }
    add(body, el('div', 'dim', T('hi_' + role)));
    if (S.mul() !== 1 && S.tab === 'buy') add(body, el('div', S.mul() < 1 ? 'ok' : 'no', T('karma_price', (S.mul() < 1 ? '' : '+') + Math.round((S.mul() - 1) * 100) + '%')));
    if (S.tab === 'buy') {
      S.list(role).forEach(id => {
        const p = S.price(id), r = add(el('div', 'row card'), nameChip(id), info(id));
        if (it(id).type === 'weapon' ? I.owned(id) : I.bag[id]) add(r, el('span', 'dim', it(id).type === 'weapon' ? T('owned') : T('owned') + ' ' + I.bag[id]));
        const max = it(id).type === 'weapon' && I.owned(id) ? 0 : Math.min(it(id).type === 'weapon' ? 1 : I.MAXSTACK - (I.bag[id] || 0), Math.floor(I.coins / Math.max(1, p)));
        const qty = quantityInput(max);
        add(r, btn(T('buy') + ' ' + p, 'pri', () => { S.buy(id, 1); render(); }, max < 1));
        add(r, qty, btn('Buy X', 'pri', () => { S.buy(id, qty.value); render(); }, max < 1));
        add(r, btn('Buy Max', '', () => { S.buyMax(id); render(); }, max < 1));
        add(body, r);
      });
    } else if (S.tab === 'sell') {
      const ids = Object.keys(I.bag).filter(id => I.bag[id] > 0 && it(id));
      if (!ids.length) add(body, el('div', 'dim', T('nothing_sell')));
      ids.forEach(id => {
        const v = D.sellPrice(id), r = add(el('div', 'row card'), nameChip(id), el('span', 'dim', '×' + I.bag[id]));
        if (v) {
          const qty = quantityInput(I.bag[id]);
          add(r, btn(T('sell') + ' ' + v, '', () => { S.sell(id, 1); render(); }));
          add(r, qty, btn('Sell X', '', () => { S.sell(id, qty.value); render(); }));
          add(r, btn('Sell All', '', () => { S.sellAll(id); render(); }));
        } else add(r, el('span', 'dim', T('cannot_sell')));
        add(body, r);
      });
    } else if (S.tab === 'repair') {
      const targets = S.repairTargets();
      if (!targets.length) add(body, el('div', 'dim', T('repair_none')));
      targets.forEach(target => {
        const c = S.repairCost(target), place = target.slot ? T('eqs_' + target.slot) : T('repair_bag');
        const r = add(el('div', 'row card'), nameChip(target.id), el('span', 'dim', target.current + '/' + target.max), el('span', 'dim', place));
        add(r, el('span', 'dim', T('cost') + ': ' + c.coins + ' ' + T('coins') + ', ' + c.iron + ' ' + T('it_iron')));
        add(r, btn(T('shop_repair'), 'pri', () => { S.repair(target); render(); }, !S.canRepair(target)));
        add(body, r);
      });
    } else if (S.tab === 'upgrade') {
      const ids = D.items.filter(d => S.upgradable(d.id)).map(d => d.id);
      if (!ids.length) add(body, el('div', 'dim', T('no_upgrade')));
      else add(body, el('div', 'dim', T('up_hint_w') + ' ' + T('up_hint_a')));
      ids.forEach(id => {
        const l = I.lvl(id), r = add(el('div', 'row card'), nameChip(id), info(id));
        if (l >= D.upMax) add(r, el('span', 'ok', T('max_lvl')));
        else { const c = D.upCost(id, l); add(r, el('span', 'dim', T('cost') + ': ' + c.coins + ' ' + T('coins') + ', ' + c.iron + ' ' + T('it_iron')), btn(T('upgrade'), 'pri', () => { S.upgrade(id); render(); }, !S.canUpgrade(id))); }
        add(body, r);
      });
    } else {
      D.recipes.forEach(rc => {
        const r = add(el('div', 'row card'), nameChip(rc.id), info(rc.id));
        if (I.owned(rc.id)) add(r, el('span', 'dim', T('owned')));
        add(r, el('span', 'dim', T('cost') + ': ' + S.recipePrice(rc) + ' ' + T('coins') + (Object.keys(rc.res).length ? ', ' + costTxt(rc.res) : '')));
        const max = S.craftMax(rc), qty = quantityInput(max);
        add(r, btn(T('craft'), 'pri', () => { S.craft(rc, 1); render(); }, max < 1));
        add(r, qty, btn('Craft X', 'pri', () => { S.craft(rc, qty.value); render(); }, max < 1));
        add(r, btn('Craft Max', '', () => { S.craft(rc, max); render(); }, max < 1));
        add(body, r);
      });
    }
    body.scrollTop = scrollTop;
  }
  S.open = function (npc) {
    if (!npc || SW.paused || SW.Combat.active) return false;
    if (npc.q && SW.Quests) return SW.Quests.open(npc);
    ensure(); S.cur = npc; S.tab = tabsFor(npc.role)[0];
    SW.paused = true; SW.Input.reset(); root.classList.add('open'); if (act) act.style.display = 'none';
    render(); return true;
  };
  S.close = function () {
    if (!S.cur) return;
    S.cur = null; if (root) root.classList.remove('open');
    SW.paused = false; SW.Input.reset(); SW.Save.touch();
  };
  // Interaktionsknopf: nur sichtbar, wenn ein NPC nah ist
  S.update = function (p) {
    if (!act) {
      act = el('button', '', T('talk')); act.id = 'act-btn'; act.style.display = 'none';
      act.addEventListener('click', () => {
        const n = S.near(SW.Player);
        if (n) S.open(n); else { const sh = SW.Shrines && SW.Shrines.near(SW.Player); if (sh) SW.Shrines.interact(sh); }
      });
      document.body.appendChild(act);
    }
    const busy = SW.paused || SW.Combat.active || (SW.Trials && SW.Trials.active), n = busy ? null : S.near(p), sh = (busy || n || !SW.Shrines) ? null : SW.Shrines.near(p);
    const activated = !!(sh && SW.Shrines.isOn(sh.id));
    const canEnter = !!(activated && SW.Trials && SW.Trials.can(sh.id));
    const want = (n || sh) ? 'block' : 'none';
    const lbl = n ? T('talk') : activated ? (canEnter ? T('tr_enter') : T('tr_done')) : T('pray');
    act.disabled = !!(sh && activated && !canEnter);
    if (act.style.display !== want) act.style.display = want;
    if (act.textContent !== lbl) act.textContent = lbl;
  };
  return S;
})();
