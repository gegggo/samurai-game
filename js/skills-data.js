'use strict';
// Skilltree-Daten (Phase 3). Werte sind Platzhalter bis zum Balancing.
// Kosten: sp = Skillpunkte, ess = Essence (Zahl, nur hier verwendbar). Gesamt 31 Essence = ganzer Baum bezahlbar (Angebot 35; BALANCE-PLATZHALTER). Yin/Yang: Felder yin/yang/balance werden beim Lernen verbraucht (Gleichgewicht: halber Wert je Seite). Passive wirken immer, aktive werden ausgerüstet.
(function () {
  const c = (sp, ess) => ({ sp, ess });
  SW.Data.branches = ['sm', 'sw', 'df', 'km'];
  SW.Data.skills = [
    // A. Schwertmeister
    { id: 'sm1', br: 'sm', tier: 1, type: 'passive', lvl: 1,  req: [],            cost: c(1, 1),  fx: { dmg: .10 } },
    { id: 'sm2', br: 'sm', tier: 2, type: 'passive', lvl: 4,  req: ['sm1'],       cost: c(1, 1),  fx: { rec: .10 } },
    { id: 'sm3', br: 'sm', tier: 2, type: 'passive', lvl: 4,  req: ['sm1'],       cost: c(1, 1),  fx: { crit: 5 }, yang: 25 },
    { id: 'sm4', br: 'sm', tier: 3, type: 'active',  lvl: 8,  req: ['sm2'],       cost: c(2, 2), move: 'dblstrike', yang: 30 },
    { id: 'sm5', br: 'sm', tier: 4, type: 'active',  lvl: 12, req: ['sm3', 'sm4'], cost: c(2, 3),    move: 'cleave', yang: 40, karma: 10 },
    // B. Schattenkrieger
    { id: 'sw1', br: 'sw', tier: 1, type: 'passive', lvl: 1,  req: [],            cost: c(1, 1),  fx: { dodgeCd: .20 } },
    { id: 'sw2', br: 'sw', tier: 2, type: 'passive', lvl: 4,  req: ['sw1'],       cost: c(1, 1),  fx: { ambush: .30 } },
    { id: 'sw4', br: 'sw', tier: 2, type: 'passive', lvl: 4,  req: ['sw1'],       cost: c(1, 1),  fx: { breath: .30 } },
    { id: 'sw3', br: 'sw', tier: 3, type: 'active',  lvl: 8,  req: ['sw1'],       cost: c(2, 2), move: 'shadowstep', yin: 30 },
    { id: 'sw5', br: 'sw', tier: 4, type: 'active',  lvl: 12, req: ['sw2', 'sw3'], cost: c(2, 3),    move: 'flurry', yin: 40 },
    // C. Verteidiger
    { id: 'df1', br: 'df', tier: 1, type: 'passive', lvl: 1,  req: [],            cost: c(1, 1),  fx: { hpFlat: 15 } },
    { id: 'df2', br: 'df', tier: 2, type: 'passive', lvl: 4,  req: ['df1'],       cost: c(1, 1),  fx: { blockMul: .10 } },
    { id: 'df3', br: 'df', tier: 2, type: 'passive', lvl: 4,  req: ['df1'],       cost: c(1, 1),  fx: { parry: .10 }, yin: 25 },
    { id: 'df4', br: 'df', tier: 3, type: 'passive', lvl: 8,  req: ['df3'],       cost: c(2, 2), fx: { counter: .40 }, yin: 30 },
    { id: 'df5', br: 'df', tier: 3, type: 'active',  lvl: 8,  req: ['df2'],       cost: c(2, 2), move: 'mend', yin: 30, karma: 10 },
    // D. Ki-Meister
    { id: 'km1', br: 'km', tier: 1, type: 'passive', lvl: 1,  req: [],            cost: c(1, 1),  fx: { kiFlat: 20 } },
    { id: 'km2', br: 'km', tier: 2, type: 'passive', lvl: 4,  req: ['km1'],       cost: c(1, 1),  fx: { kiRegen: .50 } },
    { id: 'km3', br: 'km', tier: 2, type: 'passive', lvl: 4,  req: ['km1'],       cost: c(1, 1),  fx: { kiCost: .20 } },
    { id: 'km4', br: 'km', tier: 3, type: 'active',  lvl: 8,  req: ['km2'],       cost: c(2, 2), move: 'kiwave', balance: 30 },
    { id: 'km5', br: 'km', tier: 4, type: 'passive', lvl: 12, req: ['km2', 'km3'], cost: c(2, 3),    fx: { breath: 1 }, balance: 40, karma: 20 }
  ];
  // Geheime Techniken: kommen von Gegnern (nicht kaufbar), danach gesperrt bis alle Bedingungen erfüllt sind. Kein Essence.
  SW.Data.secrets = [
    { id: 'cross', move: 'cross', lvl: 20, karma: 60, yang: 60 },
    { id: 'ironwill', move: 'ironwill', lvl: 18, karma: 30, yin: 60 },
    { id: 'stillwater', move: 'stillwater', lvl: 22, karma: 50, balance: 60 },
    { id: 'oniwrath', move: 'oniwrath', lvl: 25, karma: 70, yang: 70 }
  ];
  // Schriftrollen (Meister): Fund in Truhe (give: { scroll: id }), Meister entziffert gegen Yin/Yang (verbraucht) + Mindestlevel.
  // Neue Rolle = ein Eintrag hier + ein Move + Texte sk_/skd_ + eine Truhe. Werte BALANCE-PLATZHALTER.
  SW.Data.scrolls = [
    { id: 'sc_wind', move: 'windcut', lvl: 6, yin: 0, yang: 25 },
    { id: 'sc_mount', move: 'mountain', lvl: 8, yin: 25, yang: 0 }
  ];
  SW.Data.resetCost = 2; // BALANCE-PLATZHALTER

  // Zusätzliche Kampfaktionen der aktiven Fähigkeiten (anim = Waffenanimation aus combat.js)
  Object.assign(SW.Data.moves, {
    dblstrike:  { wind: .28, rec: .45, dmg: 7,  hits: 2, gap: .22, ki: 25, anim: 'normal' },
    cleave:     { wind: .80, rec: .70, dmg: 42, ki: 45, anim: 'heavy', guardBreak: true },
    shadowstep: { wind: .15, rec: .35, dmg: 16, ki: 25, anim: 'quick', inv: .5, glow: '#9a7bd8' },
    flurry:     { wind: .30, rec: .60, dmg: 5,  hits: 3, gap: .16, ki: 40, anim: 'quick', ignoreGuard: true, glow: '#9a7bd8' },
    mend:       { wind: .40, rec: .60, dmg: 0,  heal: .2, ki: 40, anim: 'special', glow: '#7fe08a' },
    kiwave:     { wind: .50, rec: .55, dmg: 30, ki: 35, anim: 'special', ignoreGuard: true, glow: '#7fd0ff' },
    cross:      { wind: .70, rec: .80, dmg: 55, hits: 2, gap: .20, ki: 60, anim: 'heavy', guardBreak: true, glow: '#ffe27a' },
    ironwill:   { wind: .45, rec: .65, dmg: 28, ki: 45, anim: 'special', guardBreak: true, glow: '#9fc8e8' },
    stillwater: { wind: .35, rec: .55, dmg: 22, ki: 40, anim: 'special', inv: .35, glow: '#70c9df' },
    windcut:    { wind: .20, rec: .45, dmg: 24, ki: 30, anim: 'quick', ignoreGuard: true, glow: '#bfe9ff' },
    mountain:   { wind: .35, rec: .60, dmg: 18, ki: 35, anim: 'special', inv: .4, glow: '#9fd0a0' },
    oniwrath:   { wind: .85, rec: .95, dmg: 78, ki: 75, anim: 'heavy', hits: 2, gap: .24, guardBreak: true, glow: '#e36a55' }
  });

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
