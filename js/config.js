'use strict';
// Globaler Namespace, Konstanten, zentrale Texte (Sprachsystem folgt Phase 6).
const SW = {
  version: '0.40.0',
  CFG: { W: 8000, H: 5200, SPEED: 5, OV: 8 }, // Welt wächst nach rechts/unten (Ursprung oben links); neue Regionen als Segment js/layout-<name>.js
  lang: (function () { try { const l = localStorage.getItem('sw_lang'); return l === 'de' ? 'de' : 'en'; } catch (e) { return 'en'; } })(),
  paused: false,
  TEXT: { en: {
    menu: 'Menu', close: 'Close', locked: 'Coming in phase {n}',
    discovered: 'Discovered: {n}', loading: 'Mapping the land…',
    pin_max: 'Marker limit reached (10). Remove one first.', pin_at: 'Marker at X {n}', pin_remove: 'Remove marker', travel_loading: 'Travelling to {n}…', travel_to: 'Travel to {n}?', travel_off: '{n} is not activated yet', travel_go: 'Travel', travel_cancel: 'Cancel', travel_blocked: 'Travel not possible now',
    leg_village: 'Village', leg_temple: 'Temple', leg_camp: 'Camp', leg_place: 'Place',
    tab_map: 'Map', tab_inventory: 'Inventory', tab_equipment: 'Equipment', tab_skills: 'Skills',
    tab_skilltree: 'Skilltree', tab_quests: 'Quests', tab_character: 'Character', master_scrolls: 'Read found scrolls',
    tab_karma: 'Karma & Yin-Yang', tab_settings: 'Settings',
    reg_0: 'Hinode Village', reg_1: 'Bamboo Forest', reg_2: 'Mountain Shrine',
    reg_3: 'Western Woods', reg_4: 'Mirror Lake', reg_5: 'Iron Peaks',
    reg_6: 'Forgotten Ruins', reg_7: 'Bandit Camp', reg_8: 'Hollow Caves', reg_9: 'Moonlit Grove', poi_grove: 'Moonlit Grove', reg_10: 'Stone Garden', reg_11: 'Reed Marsh', poi_garden: 'Stone Garden', poi_marsh: 'Reed Marsh',
    reg_12: 'Frostpeaks', reg_13: 'Ember Crater', reg_14: 'Dust Dunes', reg_15: 'Sun Coast', reg_16: 'Karst Spires', poi_frost: 'Frostpeaks', poi_ember: 'Ember Crater', poi_dunes: 'Dust Dunes', poi_coast: 'Sun Coast', poi_karst: 'Karst Spires', reg_20: 'Dragonwall', reg_21: 'Spirit Valley', reg_22: 'Frostwall', reg_23: 'Cloudsteppe', reg_24: 'Jade Highlands', reg_25: 'Verdant Basin', poi_dragonwall: 'Dragonwall', poi_spiritvalley: 'Spirit Valley', poi_frostwall: 'Frostwall', poi_cloudsteppe: 'Cloudsteppe', poi_jadehighlands: 'Jade Highlands', poi_peakvillage: 'Peak Village', poi_temple: 'Sky Temple', poi_gaptemple: 'Tide Temple', poi_windspire: 'Wind Spire', poi_cloudspire: 'Cloud Spire',
    poi_village: 'Hinode Village', poi_huts: 'Abandoned Huts', poi_shrine: 'Great Shrine',
    poi_hermit: 'Hermit Hut', poi_lake: 'Mirror Lake', poi_lookout: 'Lookout Point',
    poi_falls: 'Waterfall', poi_ruins: 'Old Temple Ruins', poi_camp: 'Bandit Camp',
    poi_cave: 'Cave Temple', poi_fishers: "Fishers' Huts",
    combat_attack: 'Strike', combat_heavy: 'Heavy', combat_ranged: 'Ranged', combat_block: 'Block', combat_dodge: 'Dodge',
    combat_special: 'Special', combat_breath: 'Breathe', sprint: 'Sprint', combat_victory: 'Victory', combat_defeat: 'Defeated',
    combat_phase: 'Phase {n}!', combat_parry: 'Parry!', combat_counter: 'Counter!', combat_noki: 'Not enough Stamina',
    combat_lock: 'Lock', lock_on: 'Lock-on: ON', lock_off: 'Lock-on: OFF', lock_on_short: 'Lock', lock_off_short: 'Free', combat_charge: 'CHARGED ATTACK', combat_charge_hint: 'Hold Heavy to charge', combat_dodge_ok: 'Evaded', combat_guard_break: 'Guard broken',
    dir_0: 'N', dir_1: 'NE', dir_2: 'E', dir_3: 'SE', dir_4: 'S', dir_5: 'SW', dir_6: 'W', dir_7: 'NW',
    hud_hp: 'HP', hud_ki: 'Stamina', coins: 'Ryō', drop_iron: 'Iron ×{n}', fx_rwind: 'Ranged wind-up -{n}%',
    set_save: 'Save data', set_wipe: 'Delete save', set_wipe_ask: 'Delete all progress? This cannot be undone.', set_wipe_yes: 'Delete', set_wipe_no: 'Cancel',
    set_lang: 'Language', lang_en: 'English', lang_de: 'Deutsch',
    enemy_bandit: 'Bandit', enemy_ronin: 'Ronin', enemy_samurai: 'Samurai', enemy_spearman: 'Spearman',
    enemy_mini_ruby: 'Ruby Mountain Warden', enemy_mini_emerald: 'Emerald Serpent', enemy_mini_onyx: 'Onyx Shadow Warrior', enemy_mini_sapphire: 'Sapphire Frost Beast', enemy_mini_amethyst: 'Amethyst Dragon Guard', enemy_swift: 'Swift Swordsman', enemy_armored: 'Armored Warrior', enemy_elite: 'Elite Guard', enemy_boss: 'Bandit Chief', enemy_boss_warden: 'Ruin Warden', enemy_boss_mist: 'Mist Guardian', enemy_boss_monk: 'Iron Peak Monk', enemy_boss_oni: 'Cave Oni', seal_found: 'Gemstone recovered: {n}', seal_progress: 'Gemstones: {n}/5', seal_altar: 'Altar of the Five Seals', seal_altar_need: 'The altar requires all five gemstones.', seal_deposited: 'All five gemstones are in place. The final gate opens.', seal_portal: 'The final gate', open_seal_altar: 'Place the gemstones', seal_gem_ruby: 'Ruby', seal_gem_emerald: 'Emerald', seal_gem_onyx: 'Onyx', seal_gem_sapphire: 'Sapphire', seal_gem_amethyst: 'Amethyst', qn_main_seals: 'The Five Seals', qd_main_seals: 'Five powerful guardians have appeared across the land. Defeat each one and recover its gemstone.', qo_main_seals: 'Defeat all five guardians', qdone_main_seals: 'All five gemstones are yours. The altar beyond the forgotten gate can now be used.', qn_main_altar: 'The Altar of the Five Seals', qd_main_altar: 'Take the five gemstones to the ancient altar beyond the gate and place them in their sockets.', qo_main_altar: 'Place all five gemstones at the altar', qdone_main_altar: 'The five seals awaken. The final gate opens, revealing the path to the last enemy.', qn_main_final: 'The Last Enemy', qd_main_final: 'The final gate is open. Enter the passage and defeat the ancient Oni.', qo_main_final: 'Defeat the ancient Oni', qdone_main_final: 'The ancient Oni has fallen. Return to the Master and report what happened.', enemy_shadow: 'Shadow Clan Assassin', amb_warn: 'Shadow Clan ambush!'
  } },
  setLang(l) {
    this.lang = l === 'de' ? 'de' : 'en';
    try { localStorage.setItem('sw_lang', this.lang); } catch (e) { /* Speicher gesperrt */ }
    document.documentElement.lang = this.lang;
  },
  t(k, n) {
    let s = (this.TEXT[this.lang] || {})[k];
    if (s === undefined) s = this.TEXT.en[k] || k;
    return n === undefined ? s : s.replace('{n}', n);
  }
};
SW.CFG.OV = Math.max(8, Math.ceil(Math.max(SW.CFG.W, SW.CFG.H) / 640)); // Kartenauflösung (Kacheln je Bildpunkt) wächst mit der Welt