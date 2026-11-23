'use strict';
// Skilltree-Texte (Phase 24). Die 90 Lite-Knoten liegen in data/skills.json.
// Neue Knoten nutzen Namen/Beschreibungen direkt aus data/skills.json. Essence bleibt Skilltree-exklusiv.
(function () {
  const c = (sp, ess) => ({ sp, ess });
  // Daten (Äste, Skills, Techniken, Schriftrollen, Zusatz-Moves) liegen seit Phase 20 in data/skills.json und data/combat.json.

  // Texte (zentrales Textobjekt SW.TEXT, Übersetzung folgt in Phase 6)
  Object.assign(SW.TEXT.en, {
    br_sm: 'Sword Master', br_sw: 'Shadow Warrior', br_df: 'Defender', br_km: 'Ki Master',
    sk_sm1: 'Sharp Edge', skd_sm1: 'Sword damage +10%.',
    sk_sm2: 'Swift Blade', skd_sm2: 'Recovery after attacks 10% shorter.',
    sk_sm3: 'Keen Eye', skd_sm3: 'Critical hit chance +5%.',
    sk_sm4: 'Double Strike', skd_sm4: 'Two quick slashes in a row. Costs Ki.',
    sk_sm5: 'Iron Cleave', skd_sm5: 'Massive overhead cut that breaks guards. Costs Ki.',
    sk_sw1: 'Fleet Foot', skd_sw1: 'Dodge cooldown 20% shorter.',
    sk_sw2: 'Ambush', skd_sw2: 'Hits during an enemy wind-up deal +30% damage.',
    sk_sw4: 'Silent Breath', skd_sw4: 'Standing still in combat restores Ki 30% faster.',
    sk_sw3: 'Shadow Step', skd_sw3: 'Slip away and strike. Brief invulnerability. Costs Ki.',
    sk_sw5: 'Shadow Flurry', skd_sw5: 'Three rapid cuts that ignore guards. Costs Ki.',
    sk_df1: 'Hardened Body', skd_df1: 'Maximum life +15.',
    sk_df2: 'Steady Guard', skd_df2: 'Blocked hits deal only 10% damage.',
    sk_df3: 'Perfect Timing', skd_df3: 'Parry window 0.1 s longer.',
    sk_df4: 'Counter Master', skd_df4: 'Counter attacks deal +40% damage.',
    sk_df5: 'Mend', skd_df5: 'Restore life. Costs Ki.',
    sk_km1: 'Deep Reservoir', skd_km1: 'Maximum Ki +20.',
    sk_km2: 'Flowing Ki', skd_km2: 'Ki regeneration +50%.',
    sk_km3: 'Efficient Ki', skd_km3: 'Ki costs of techniques -20%.',
    sk_km4: 'Ki Wave', skd_km4: 'Wave of energy that ignores guards. Costs Ki.',
    sk_km5: "Heaven's Breath", skd_km5: 'Standing still in combat restores Ki twice as fast.',
    sk_cross: 'Heavenly Cross', skd_cross: 'Secret technique of the Bandit Chief. Two crushing cuts. Costs Ki.',
    sk_ironwill: 'Iron Will', skd_ironwill: 'Secret technique of the Mountain Warden. A focused guard-breaking strike. Costs Ki.',
    sk_stillwater: 'Stillwater', skd_stillwater: 'Secret technique of the Temple Monk. A precise strike with a brief evasive window. Costs Ki.',
    sk_oniwrath: 'Oni Wrath', skd_oniwrath: 'Secret technique of the Oni. Two devastating heavy strikes. Costs Ki.',
    sp: 'Skill points', ap: 'Attribute points', lvl: 'Level', active: 'Active', passive: 'Passive', secret: 'Secret techniques',
    learn: 'Learn', learned: 'Learned', reset: 'Reset skills', reset_ask: 'Reset all skills? You get your skill points back, essence is lost.',
    sk_sc_wind: 'Wind Cut', skd_sc_wind: 'Scroll technique. A fast cut that ignores guard. Costs Ki.',
    sk_sc_mount: 'Mountain Guard', skd_sc_mount: 'Scroll technique. A braced strike with a brief moment of invulnerability. Costs Ki.',
    scr_unread: 'Old scroll (cannot read it)', scr_found: 'an old scroll. The Master in the Stone Garden temple can read it.',
    npc_master: 'Master', train_hint: 'Training yard: the dummies do not strike back.', hi_master: 'Bring me old scrolls. I read them, you pay with Yin and Yang.', master_none: 'You carry no scrolls.', decipher: 'Decipher',
    cost_yin: 'Yin {n} (spent)', cost_yang: 'Yang {n} (spent)', cost_balance: 'Balanced, both {n}+ (half is spent from each)',
    req_lvl: 'Level {n}', req_skill: '{n}', req_yin: 'Yin {n}+', req_yang: 'Yang {n}+', req_karma: 'Karma {n}+',
    req_balance: 'Yin and Yang balanced, both {n}+', req_sp: '{n} skill point(s)', req_ess: '{n}',
    ess: 'Essence',
    lv_up: 'Level {n}!', slot: 'Slot {n}', slot_empty: 'Empty', equip: 'Equip', no_active: 'No active techniques learned yet.',
    st_locked: 'Locked', st_ready: 'Ready', st_active: 'Unlocked', activate: 'Unlock', secret_ready: 'Secret technique ready to unlock!',
    secret_got: 'Secret technique found: {n}', ki_cost: 'Ki {n}', no_passive: 'No passive skills learned yet.'
  });
})();
