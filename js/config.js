'use strict';
// Globaler Namespace, Konstanten, zentrale Texte (Sprachsystem folgt Phase 6).
const SW = {
  version: '0.6.0',
  CFG: { WORLD: 2400, SPEED: 5, OV: 8 },
  lang: (function () { try { const l = localStorage.getItem('sw_lang'); return l === 'de' ? 'de' : 'en'; } catch (e) { return 'en'; } })(),
  paused: false,
  TEXT: { en: {
    menu: 'Menu', close: 'Close', locked: 'Coming in phase {n}',
    discovered: 'Discovered: {n}', loading: 'Mapping the land…',
    tab_map: 'Map', tab_inventory: 'Inventory', tab_equipment: 'Equipment', tab_skills: 'Skills',
    tab_skilltree: 'Skilltree', tab_quests: 'Quests', tab_character: 'Character',
    tab_karma: 'Karma & Yin-Yang', tab_settings: 'Settings',
    reg_0: 'Hinode Village', reg_1: 'Bamboo Forest', reg_2: 'Mountain Shrine',
    reg_3: 'Western Woods', reg_4: 'Mirror Lake', reg_5: 'Iron Peaks',
    reg_6: 'Forgotten Ruins', reg_7: 'Bandit Camp', reg_8: 'Hollow Caves',
    poi_village: 'Hinode Village', poi_huts: 'Abandoned Huts', poi_shrine: 'Great Shrine',
    poi_hermit: 'Hermit Hut', poi_lake: 'Mirror Lake', poi_lookout: 'Lookout Point',
    poi_falls: 'Waterfall', poi_ruins: 'Old Temple Ruins', poi_camp: 'Bandit Camp',
    poi_cave: 'Cave Temple', poi_fishers: "Fishers' Huts",
    combat_attack: 'Strike', combat_heavy: 'Heavy', combat_ranged: 'Ranged', combat_block: 'Block', combat_dodge: 'Dodge',
    combat_special: 'Special', combat_breath: 'Breathe', combat_victory: 'Victory', combat_defeat: 'Defeated',
    combat_phase: 'Phase {n}!', combat_parry: 'Parry!', combat_counter: 'Counter!', combat_noki: 'Not enough Ki',
    combat_dodge_ok: 'Evaded', combat_guard_break: 'Guard broken',
    dir_0: 'N', dir_1: 'NE', dir_2: 'E', dir_3: 'SE', dir_4: 'S', dir_5: 'SW', dir_6: 'W', dir_7: 'NW',
    hud_hp: 'HP', hud_ki: 'Ki',
    set_save: 'Save data', set_wipe: 'Delete save', set_wipe_ask: 'Delete all progress? This cannot be undone.', set_wipe_yes: 'Delete', set_wipe_no: 'Cancel',
    set_lang: 'Language', lang_en: 'English', lang_de: 'Deutsch',
    enemy_bandit: 'Bandit', enemy_ronin: 'Ronin', enemy_samurai: 'Samurai', enemy_spearman: 'Spearman',
    enemy_swift: 'Swift Swordsman', enemy_armored: 'Armored Warrior', enemy_elite: 'Elite Guard', enemy_boss: 'Bandit Chief', enemy_boss_warden: 'Ruin Warden', enemy_boss_monk: 'Iron Peak Monk', enemy_boss_oni: 'Cave Oni'
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
