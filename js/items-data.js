'use strict';
// Gegenstandsdaten (Phase 4a). Alle Werte Platzhalter bis Balancing.
// fx: atk = Schadensbonus (0.1 = +10%), crit = Krit in %-Punkten, hp/def = Flachwerte,
// rec = Erholung (negativ = schneller), dodge = Ausweich-Abklingzeit (positiv = länger), ambush = Hinterhalt-Bonus, parry = Parade-Fenster (s).
SW.Data = SW.Data || {};
(function () {
  const D = SW.Data;
  D.rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
  D.rarityCol = { common: '#b9b2a2', uncommon: '#6fbf73', rare: '#5aa0e0', epic: '#b07ae0', legendary: '#f2c14e' };
  D.slots = ['main', 'side', 'ranged', 'helm', 'mask', 'armor', 'gloves', 'boots'];
  // [id, type, slot, rarity, fx, Name, Beschreibung]
  const L = [
    ['katana_worn', 'weapon', 'main', 'common', {}, 'Worn Katana', 'A battered blade. Reliable, nothing more.'],
    ['katana_steel', 'weapon', 'main', 'uncommon', { atk: .10 }, 'Steel Katana', 'Well-folded steel with a keen edge.'],
    ['katana_temper', 'weapon', 'main', 'rare', { atk: .18, crit: 3 }, 'Tempered Katana', 'Hardened edge, balanced for precise cuts.'],
    ['nodachi', 'weapon', 'main', 'uncommon', { atk: .30, rec: .20 }, 'Nodachi', 'Huge two-handed sword. Hits hard, recovers slowly.'],
    ['spear', 'weapon', 'main', 'common', { atk: .05, ambush: .20 }, 'Yari Spear', 'Punishes enemies who wind up an attack.'],
    ['naginata', 'weapon', 'main', 'rare', { atk: .20, rec: .10, parry: .03 }, 'Naginata', 'Curved polearm with a forgiving parry.'],
    ['tanto', 'weapon', 'side', 'common', { crit: 2 }, 'Tanto', 'Short dagger. Finds weak spots.'],
    ['wakizashi', 'weapon', 'side', 'uncommon', { crit: 3, rec: -.05 }, 'Wakizashi', 'Companion blade. Quicker recovery.'],
    ['tanto_night', 'weapon', 'side', 'epic', { crit: 5, ambush: .15 }, 'Night Tanto', 'Black dagger from the old ruins.'],
    ['hat_straw', 'armor', 'helm', 'common', { def: .3 }, 'Straw Hat', 'Keeps off the sun, and little else.'],
    ['helm_iron', 'armor', 'helm', 'uncommon', { def: .8, hp: 4 }, 'Iron Helm', 'Plain iron cap.'],
    ['helm_kabuto', 'armor', 'helm', 'rare', { def: 1.2, hp: 8, dodge: .03 }, 'Kabuto', 'Samurai war helmet.'],
    ['kimono', 'armor', 'armor', 'common', { def: .3 }, 'Travel Kimono', 'Simple cloth clothing.'],
    ['armor_light', 'armor', 'armor', 'uncommon', { def: .8, hp: 5 }, 'Light Samurai Armor', 'Lacquered plates, easy to move in.'],
    ['armor_heavy', 'armor', 'armor', 'rare', { def: 2.2, hp: 20, dodge: .15 }, 'Heavy Samurai Armor', 'Full plate. Tough, but dodging takes longer.'],
    ['gloves_cloth', 'armor', 'gloves', 'common', { def: .2 }, 'Cloth Wraps', 'Hand wraps.'],
    ['kote_leather', 'armor', 'gloves', 'uncommon', { def: .5, crit: 1 }, 'Leather Kote', 'Supple forearm guards.'],
    ['kote_iron', 'armor', 'gloves', 'rare', { def: .9, hp: 4 }, 'Iron Kote', 'Heavy armored gauntlets.'],
    ['tabi', 'armor', 'boots', 'common', { def: .2 }, 'Tabi Socks', 'Split-toe cloth shoes.'],
    ['boots_leather', 'armor', 'boots', 'uncommon', { def: .4, dodge: -.04 }, 'Leather Boots', 'Light and quiet.'],
    ['boots_iron', 'armor', 'boots', 'rare', { def: .8, dodge: .05 }, 'Iron Greaves', 'Shin guards with iron plates.'],
    ['katana_counter', 'weapon', 'main', 'legendary', { atk: .22, counter: .5, parry: .04 }, 'Counterfang', 'Blade of the Bandit Chief. Counter attacks hit far harder.'],
    ['katana_moon', 'weapon', 'main', 'legendary', { atk: .15, kiCost: .2, kiRegen: .3 }, 'Moonlit Blade', 'Ki flows freely: techniques cost less, Ki returns faster.'],
    ['nodachi_reaper', 'weapon', 'main', 'legendary', { atk: .30, rec: .15, crit: 4, critDmg: .5 }, 'Reaper Nodachi', 'Slow, but every critical hit cuts deeper.'],
    ['tanto_warden', 'weapon', 'side', 'legendary', { crit: 6, ambush: .25, critDmg: .3 }, "Warden's Edge", 'Dagger of the Ruin Warden. Strikes hard from the shadows.'],
    ['naginata_monk', 'weapon', 'main', 'legendary', { atk: .26, rec: .12, parry: .06, counter: .3 }, 'Peak Naginata', 'Polearm of the Iron Peak Monk. Wide parry, brutal counters.'],
    ['armor_oni', 'armor', 'armor', 'legendary', { def: 3.2, hp: 40, counter: .25 }, 'Oni Plate', 'Lacquered plate of the Cave Oni. Tough and unforgiving.'],
    // Phase 4c: Fernkampf (rdmg = Schaden je Wurf/Schuss, rwind = Vorlauf s, rrec = Erholung s) und Masken
    ['shuriken', 'weapon', 'ranged', 'common', { rdmg: 5, rwind: .20, rrec: .30 }, 'Shuriken', 'Throwing stars. Quick, light hits from range.'],
    ['shuriken_steel', 'weapon', 'ranged', 'uncommon', { rdmg: 7, rwind: .20, rrec: .28, crit: 2 }, 'Steel Shuriken', 'Balanced throwing stars. Hit harder and sometimes crit.'],
    ['bow_hankyu', 'weapon', 'ranged', 'rare', { rdmg: 14, rwind: .50, rrec: .70 }, 'Hankyu Short Bow', 'Compact bow. Slow to draw, hits hard.'],
    ['bow_yumi', 'weapon', 'ranged', 'epic', { rdmg: 19, rwind: .55, rrec: .75, crit: 3 }, 'Yumi Longbow', 'Tall asymmetric bow. Powerful, precise shots.'],
    ['mask_cloth', 'armor', 'mask', 'common', { def: .3 }, 'Cloth Mask', 'Plain face wrap.'],
    ['mask_oni_half', 'armor', 'mask', 'uncommon', { def: .6, crit: 1 }, 'Half Oni Mask', 'Fierce lacquered half mask.'],
    ['mask_kitsune', 'armor', 'mask', 'rare', { def: .8, ambush: .08, dodge: -.03 }, 'Kitsune Mask', 'Fox mask. Light on the feet, sharp for ambushes.'],
    ['wood', 'res', null, 'common', {}, 'Wood', 'Building material for repairs.'],
    ['iron', 'res', null, 'common', {}, 'Iron', 'Raw iron for the smith.'],
    ['stone', 'res', null, 'common', {}, 'Stone', 'Building material.'],
    ['herb', 'res', null, 'common', {}, 'Healing Herb', 'Used by healers and villagers.']
  ];
  D.items = L.map(a => ({ id: a[0], type: a[1], slot: a[2], rar: a[3], fx: a[4] }));
  D.itemMap = {}; D.items.forEach(i => { D.itemMap[i.id] = i; });
  // Truhen: genau EIN Eintrag je Truhe. give: {coins:n} | {ess:[Art,n]} | {item:id, n}
  D.chests = [
    { id: 'c_vil1', x: 372, y: 372, rar: 'common', give: { coins: 30 } },
    { id: 'c_vil2', x: 428, y: 446, rar: 'common', give: { item: 'herb', n: 2 } },
    { id: 'c_bam1', x: 1160, y: 340, rar: 'common', give: { item: 'tanto', n: 1 } },
    { id: 'c_bam2', x: 1255, y: 470, rar: 'uncommon', give: { coins: 60 } },
    { id: 'c_bam3', x: 1130, y: 445, rar: 'common', give: { item: 'wood', n: 4 } },
    { id: 'c_shr1', x: 2040, y: 330, rar: 'uncommon', give: { item: 'helm_iron', n: 1 } },
    { id: 'c_shr2', x: 1975, y: 420, rar: 'uncommon', give: { ess: ['common', 1] } },
    { id: 'c_west1', x: 360, y: 1150, rar: 'common', give: { item: 'spear', n: 1 } },
    { id: 'c_west2', x: 470, y: 1260, rar: 'uncommon', give: { coins: 50 } },
    { id: 'c_lake1', x: 1520, y: 1180, rar: 'rare', give: { item: 'katana_steel', n: 1 } },
    { id: 'c_east1', x: 1950, y: 1180, rar: 'rare', give: { item: 'iron', n: 4 } },
    { id: 'c_east2', x: 2110, y: 1290, rar: 'rare', give: { item: 'armor_heavy', n: 1 } },
    { id: 'c_ruin1', x: 330, y: 1960, rar: 'rare', give: { ess: ['refined', 1] } },
    { id: 'c_ruin2', x: 460, y: 2050, rar: 'epic', give: { item: 'tanto_night', n: 1 } },
    { id: 'c_camp1', x: 1150, y: 1975, rar: 'uncommon', give: { coins: 80 } },
    { id: 'c_camp2', x: 1240, y: 2050, rar: 'rare', give: { item: 'armor_light', n: 1 } },
    { id: 'c_cave1', x: 1960, y: 1990, rar: 'epic', give: { ess: ['rare', 1] } },
    { id: 'c_cave2', x: 2060, y: 2060, rar: 'epic', give: { item: 'katana_temper', n: 1 } },
    { id: 'c_peak1', x: 2089, y: 1149, rar: 'epic', give: { item: 'bow_yumi', n: 1 } },
    { id: 'c_hut1', x: 1211, y: 432, rar: 'uncommon', give: { item: 'mask_oni_half', n: 1 } }
  ];
  // Legendäre Waffen: einmalige Belohnung für den Sieg über diesen Gegner (Gegner bleiben besiegt)
  D.drops = { e_boss: 'katana_counter', e_cave: 'katana_moon', e_ruins: 'nodachi_reaper', e_warden: 'tanto_warden', e_monk: 'naginata_monk', e_oni: 'armor_oni' };
  // Münzen je Gegnertyp [min, max]
  D.coins = { bandit: [6, 12], ronin: [10, 18], samurai: [18, 30], spearman: [12, 20], swift: [14, 22], armored: [22, 34], elite: [40, 60], boss: [120, 160], boss_warden: [140, 190], boss_monk: [160, 210], boss_oni: [200, 260] };

  const tx = {
    tab_inventory_x: 0,
    coins: 'Coins', bag_empty: 'Your bag is empty. Open chests to find items.', unequip: 'Unequip', empty: 'Empty',
    found: 'Found:', found_coins: '{n} coins', rar_common: 'Common', rar_uncommon: 'Uncommon', rar_rare: 'Rare', rar_epic: 'Epic', rar_legendary: 'Legendary',
    ty_weapon: 'Weapon', ty_armor: 'Armor', ty_res: 'Resource', equipped_total: 'Total equipment bonus', none: 'No bonus',
    eqs_main: 'Main weapon', eqs_side: 'Side weapon', eqs_ranged: 'Ranged weapon', eqs_mask: 'Mask', eqs_helm: 'Helm', eqs_armor: 'Armor', eqs_gloves: 'Gloves', eqs_boots: 'Boots',
    fx_atk: 'Damage +{n}%', fx_crit: 'Crit chance +{n}%', fx_hp: 'Life +{n}', fx_def: 'Defense +{n}',
    fx_fast: 'Recovery {n}% faster', fx_slow: 'Recovery {n}% slower', fx_dodge_up: 'Dodge cooldown +{n}%', fx_dodge_dn: 'Dodge cooldown -{n}%',
    fx_ambush: 'Ambush damage +{n}%', fx_counter: 'Counter damage +{n}%', fx_kicost: 'Ki costs -{n}%', fx_kiregen: 'Ki regeneration +{n}%', fx_critdmg: 'Critical damage +{n}%', fx_rdmg: 'Ranged damage {n}', fx_rrec: 'Cooldown {n} s', upg: 'Upgrade', fx_parry: 'Parry window +{n} ms', no_fit: 'Nothing in your bag fits this slot.'
  };
  delete tx.tab_inventory_x;
  L.forEach(a => { tx['it_' + a[0]] = a[5]; tx['itd_' + a[0]] = a[6]; });
  Object.assign(SW.TEXT.en, tx);
})();
