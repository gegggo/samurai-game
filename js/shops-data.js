'use strict';
// Händler-, Schmied- und Herstellungsdaten (Phase 4b). Alle Werte Platzhalter bis Balancing.
SW.Data = SW.Data || {};
(function () {
  const D = SW.Data;
  // NPCs im Startdorf (Position wird beim Start auf freie Kachel gesetzt)
  D.npcs = [
    { id: 'n_weapon', role: 'weapon', x: 389.5, y: 399.5, robe: '#7a2e2a', hat: '#2a2a30' },
    { id: 'n_armor', role: 'armor', x: 395.5, y: 399.5, robe: '#3a4a6a', hat: '#5a5a62' },
    { id: 'n_general', role: 'general', x: 405.5, y: 399.5, robe: '#7a6a3a', hat: '#4a3a22' },
    { id: 'n_herb', role: 'herb', x: 411.5, y: 399.5, robe: '#3f6b4a', hat: '#2a4a30' },
    { id: 'n_smith', role: 'smith', x: 417.5, y: 399.5, robe: '#5a4a44', hat: '#1c1c20' }
  ];
  // Warenangebot (unbegrenzt). Seltene Ausrüstung gibt es nur beim Schmied; Legendäres nie im Handel.
  D.stock = {
    weapon: ['tanto', 'spear', 'wakizashi', 'katana_steel', 'nodachi', 'shuriken', 'shuriken_steel'],
    armor: ['hat_straw', 'mask_cloth', 'kimono', 'gloves_cloth', 'tabi', 'helm_iron', 'armor_light', 'kote_leather', 'boots_leather'],
    general: ['wood', 'iron', 'stone'],
    herb: ['herb']
  };
  // Schmied: Herstellung (Münzen + Ressourcen)
  D.recipes = [
    { id: 'naginata', coins: 220, res: { iron: 5, wood: 4 } },
    { id: 'katana_temper', coins: 350, res: { iron: 8, wood: 2 } },
    { id: 'helm_kabuto', coins: 200, res: { iron: 5 } },
    { id: 'armor_heavy', coins: 450, res: { iron: 12, wood: 3 } },
    { id: 'kote_iron', coins: 150, res: { iron: 4 } },
    { id: 'boots_iron', coins: 150, res: { iron: 4 } },
    { id: 'bow_hankyu', coins: 260, res: { wood: 6, iron: 2 } },
    { id: 'mask_kitsune', coins: 220, res: { iron: 3, herb: 2 } }
  ];
  D.upMax = 3;
  D.upFx = { atk: .05, def: .25, rdmg: 1 }; // Bonus je Verbesserungsstufe: Waffen Schaden, Rüstung Verteidigung
  const base = { common: 40, uncommon: 120, rare: 320, epic: 800, legendary: 0 };
  const res = { wood: 12, iron: 30, stone: 10, herb: 15 };
  D.price = function (id) {
    const d = D.itemMap[id]; if (!d) return 0;
    if (d.type === 'res') return res[id] || 0;
    return Math.round(base[d.rar] * (d.slot === 'main' || d.slot === 'side' ? 1 : .8));
  };
  D.sellPrice = id => { const p = D.price(id); return p > 0 ? Math.max(1, Math.floor(p * .4)) : 0; }; // 0 = nicht verkäuflich
  const rarIdx = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };
  // Kosten für Stufe lvl -> lvl+1: Münzen + Eisen
  D.upCost = function (id, lvl) {
    const d = D.itemMap[id], m = 1 + rarIdx[d.rar] * .5;
    return { coins: Math.round(50 * (lvl + 1) * m), iron: lvl + 1 };
  };
  Object.assign(SW.TEXT.en, {
    talk: 'Talk', buy: 'Buy', sell: 'Sell', shop_upgrade: 'Upgrade', shop_craft: 'Craft', craft: 'Craft', upgrade: 'Upgrade',
    max_lvl: 'Maximum level', cannot_sell: 'Cannot be sold', nothing_sell: 'Nothing to sell.', cost: 'Cost', owned: 'Owned',
    up_hint_w: 'Each level: damage +5%.', up_hint_a: 'Each level: defense +0.25.', no_upgrade: 'You own no weapon or armor to improve.',
    npc_weapon: 'Weapon Merchant', npc_armor: 'Armor Merchant', npc_general: 'General Merchant', npc_herb: 'Herbalist', npc_smith: 'Blacksmith',
    hi_weapon: 'Fine blades for a wandering swordsman.', hi_armor: 'Good armor keeps you alive.', hi_general: 'Wood, iron, stone. Whatever you need.',
    hi_herb: 'Herbs for healers and the sick.', hi_smith: 'I forge and improve gear. Bring iron and coins.',
    drop_got: 'Legendary item: {n}'
  });
})();
