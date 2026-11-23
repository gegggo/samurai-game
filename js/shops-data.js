'use strict';
// MOVED: Koordinaten Weltumbau (tools/move_content.py)
// Händler-, Schmied- und Herstellungsdaten (Phase 4b). Alle Werte Platzhalter bis Balancing.
SW.Data = SW.Data || {};
(function () {
  const D = SW.Data;
  // Daten (NPCs, Waren, Rezepte, Stufen) liegen seit Phase 20 in data/shops.json und data/world.json.
  const B = D.balance || {}, edition = B.edition || 'lite';
  const base = { common: 40, uncommon: 120, rare: 320, epic: 800, legendary: 0 };
  const res = { wood: 12, iron: 30, stone: 10, herb: 15 };
  const priceFactor = Number((B.priceFactor || {})[edition]) || 1;
  D.upMax = Number((B.upgradeMax || {})[edition]) || 3;
  D.priceFactor = priceFactor;
  D.price = function (id) {
    const d = D.itemMap[id]; if (!d) return 0;
    if (d.type === 'res') return res[id] || 0;
    return Math.round(base[d.rar] * (d.slot === 'main' || d.slot === 'side' ? 1 : .8) * priceFactor);
  };
  D.sellPrice = id => { const p = D.price(id); return p > 0 ? Math.max(1, Math.floor(p * .4)) : 0; }; // 0 = nicht verkäuflich
  const rarIdx = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };
  // Kosten für Stufe lvl -> lvl+1: Münzen + Eisen
  D.upCost = function (id, lvl) {
    const d = D.itemMap[id], m = 1 + rarIdx[d.rar] * .5;
    return { coins: Math.round(50 * (lvl + 1) * m * priceFactor), iron: lvl + 1 };
  };
  Object.assign(SW.TEXT.en, {
    talk: 'Talk', buy: 'Buy', sell: 'Sell', shop_upgrade: 'Upgrade', shop_craft: 'Craft', craft: 'Craft', upgrade: 'Upgrade',
    max_lvl: 'Maximum level', cannot_sell: 'Cannot be sold', nothing_sell: 'Nothing to sell.', cost: 'Cost', owned: 'Owned',
    up_hint_w: 'Each level: damage +5%.', up_hint_a: 'Each level: defense +0.25.', no_upgrade: 'You own no weapon or armor to improve.',
    npc_weapon: 'Weapon Merchant', npc_armor: 'Armor Merchant', npc_general: 'General Merchant', npc_herb: 'Herbalist', npc_smith: 'Blacksmith',
    hi_weapon: 'Fine blades for a wandering swordsman.', hi_armor: 'Good armor keeps you alive.', hi_general: 'Wood, iron, stone. Whatever you need.',
    hi_herb: 'Herbs for healers and the sick.', hi_smith: 'I forge and improve gear. Bring iron and Ryō.',
    drop_got: 'Item dropped: {n}', drop_iron: 'Iron found: ×{n}', fx_rwind: 'Ranged wind-up -{n}%'
  });
})();
