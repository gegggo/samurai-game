'use strict';
// MOVED: Koordinaten Weltumbau (tools/move_content.py)
// Gegenstandsdaten (Phase 4a). Alle Werte Platzhalter bis Balancing.
// fx: atk = Schadensbonus (0.1 = +10%), crit = Krit in %-Punkten, hp/def = Flachwerte,
// rec = Erholung (negativ = schneller), dodge = Ausweich-Abklingzeit (positiv = länger), ambush = Hinterhalt-Bonus, parry = Parade-Fenster (s).
SW.Data = SW.Data || {};
(function () {
  const D = SW.Data;
  // Daten (Seltenheiten, Items, Truhen, Drops, Münzen) liegen seit Phase 20 in data/items.json und data/world.json.
  D.itemMap = {}; D.items.forEach(i => { D.itemMap[i.id] = i; });

  const tx = {
    tab_inventory_x: 0,
    drop_wpn: 'Dropped: {n}', coins: 'Ryō', bag_empty: 'Your bag is empty. Open chests to find items.', unequip: 'Unequip', empty: 'Empty',
    found: 'Found:', found_coins: '{n} Ryō', rar_common: 'Common', rar_uncommon: 'Uncommon', rar_rare: 'Rare', rar_epic: 'Epic', rar_legendary: 'Legendary',
    ty_weapon: 'Weapon', ty_armor: 'Armor', ty_res: 'Resource', equipped_total: 'Total equipment bonus', none: 'No bonus',
    eqs_main: 'Main weapon', eqs_side: 'Side weapon', eqs_ranged: 'Ranged weapon', eqs_mask: 'Mask', eqs_helm: 'Helm', eqs_armor: 'Armor', eqs_gloves: 'Gloves', eqs_boots: 'Boots',
    fx_atk: 'Damage +{n}%', fx_crit: 'Crit chance +{n}%', fx_hp: 'Life +{n}', fx_def: 'Defense +{n}',
    fx_fast: 'Recovery {n}% faster', fx_slow: 'Recovery {n}% slower', fx_dodge_up: 'Dodge cooldown +{n}%', fx_dodge_dn: 'Dodge cooldown -{n}%',
    fx_ambush: 'Ambush damage +{n}%', fx_counter: 'Counter damage +{n}%', fx_kicost: 'Ki costs -{n}%', fx_kiregen: 'Ki regeneration +{n}%', fx_critdmg: 'Critical damage +{n}%', fx_rdmg: 'Ranged damage {n}', fx_rrec: 'Cooldown {n} s', upg: 'Upgrade', fx_parry: 'Parry window +{n} ms', no_fit: 'Nothing in your bag fits this slot.',
    dur: 'Durability', dur_inf: 'Unbreakable', wpn_broke: '{n} broke!', sort: 'Sort', sort_type: 'Type', sort_rar: 'Rarity', sort_dur: 'Durability', sort_name: 'Name'
  };
  delete tx.tab_inventory_x;
  D.items.forEach(i => { tx['it_' + i.id] = i.en[0]; tx['itd_' + i.id] = i.en[1]; });
  Object.assign(SW.TEXT.en, tx);
})();
