'use strict';
// MOVED: Koordinaten Weltumbau (tools/move_content.py)
// Quest-, Dialog- und Quest-NPC-Daten (Phase 5b). Alle Werte Platzhalter bis Balancing.
// Ziel-Typen: kill (Gegnerpunkt besiegt) | shrine (Schrein erweckt) | have (Gegenstand abgeben, wird verbraucht).
// req: done = Quest davor, level, karma (Mindestwert). choice = Entscheidung beim Abschluss (Karma-Folgen).
// Belohnungen: coins, xp, ess (Zahl), karma. Essence nur als Belohnung, ausgegeben wird sie nur im Skilltree.
SW.Data = SW.Data || {};
(function () {
  const D = SW.Data;
  // Quest-NPCs (q: true = nur Quests, kein Handel). Position wird beim Start auf freie Kachel gesetzt.
  D.npcs.push(
    { id: 'n_elder', role: 'elder', q: true, x: 887.5, y: 1176.5, robe: '#c9c3b0', hat: '#8a8a90' },
    { id: 'n_hermit', role: 'hermit', q: true, x: 446.5, y: 1724.5, robe: '#5a4a34', hat: '#3a3226' },
    { id: 'n_fisher', role: 'fisher', q: true, x: 1788.5, y: 1700.5, robe: '#3a5a6a', hat: '#c8b070' },
    { id: 'n_pris1', role: 'prisoner', q: true, gone: 'pris1', x: 1578.5, y: 2132.5, robe: '#6a6258', hat: '#3a3530' }, // Gefangene im Banditenlager (7d)
    { id: 'n_pris2', role: 'prisoner', q: true, gone: 'pris2', x: 1736.5, y: 2152.5, robe: '#58626a', hat: '#30353a' },
    { id: 'n_pris3', role: 'prisoner', q: true, gone: 'pris3', x: 1628.5, y: 2274.5, robe: '#62586a', hat: '#35303a' },
    { id: 'n_sage', role: 'sage', q: true, kmin: 30, x: 2906.5, y: 1938.5, robe: '#e8e0c8', hat: '#b08a2e' }, // Weiser im Himmelstempel: nur bei Karma >= 30
    { id: 'n_watch', role: 'watch', q: true, night: true, x: 876.5, y: 1184.5, robe: '#2a3350', hat: '#14161f' } // Nachtwächter: nur nachts im Dorf
  );
  D.quests = [
    // 7d: Gefangene. Wache besiegen, dann entscheiden: befreien (+Karma) oder gegen Lösegeld ausliefern (-Karma)
    { id: 'pris1', giver: 'n_pris1', obj: { type: 'kill', spot: 'e_camp1' }, choice: [{ id: 'free', rew: { xp: 40, karma: 6 } }, { id: 'sell', rew: { xp: 20, coins: 80, karma: -10 } }] },
    { id: 'pris2', giver: 'n_pris2', obj: { type: 'kill', spot: 'e_camp2' }, choice: [{ id: 'free', rew: { xp: 40, karma: 6 } }, { id: 'sell', rew: { xp: 20, coins: 80, karma: -10 } }] },
    { id: 'pris3', giver: 'n_pris3', obj: { type: 'kill', spot: 'e_camp3' }, choice: [{ id: 'free', rew: { xp: 40, karma: 6 } }, { id: 'sell', rew: { xp: 20, coins: 80, karma: -10 } }] },
    { id: 'elder1', giver: 'n_elder', obj: { type: 'kill', spot: 'e_train' }, rew: { coins: 80, xp: 50, karma: 5 } },
    { id: 'elder2', giver: 'n_elder', req: { done: 'elder1' }, obj: { type: 'have', item: 'wood', n: 6 }, rew: { coins: 40, xp: 40, ess: 1, karma: 4 } },
    { id: 'elder3', giver: 'n_elder', req: { done: 'elder2', level: 3, karma: 10 }, obj: { type: 'kill', spot: 'e_boss' }, rew: { coins: 300, xp: 150, ess: 2, karma: 10 } },
    { id: 'elder4', giver: 'n_elder', req: { done: 'elder1' }, obj: { type: 'have', item: 'herb', n: 3 }, rew: { coins: 30, xp: 40, karma: 4 } },
    { id: 'elder5', giver: 'n_elder', req: { done: 'elder4' }, obj: { type: 'have', item: 'wood', n: 10 }, rew: { coins: 60, xp: 60, karma: 4 } },
    { id: 'elder6', giver: 'n_elder', req: { done: 'elder5' }, obj: { type: 'have', item: 'iron', n: 5 }, rew: { coins: 80, xp: 70, ess: 1, karma: 4 } },
    { id: 'hermit1', giver: 'n_hermit', obj: { type: 'shrine', shrine: 'mountain' }, rew: { xp: 70, ess: 1, karma: 3 } },
    { id: 'sage1', giver: 'n_sage', obj: { type: 'shrine', shrine: 'windspire' }, rew: { xp: 90, ess: 1, karma: 3 } },
    { id: 'watch1', giver: 'n_watch', obj: { type: 'kill', spot: 'n_quest' }, rew: { coins: 60, xp: 80, karma: 4 } },
    { id: 'fisher1', giver: 'n_fisher', obj: { type: 'have', item: 'herb', n: 2 },
      choice: [{ id: 'free', rew: { xp: 40, karma: 6 } }, { id: 'sell', rew: { xp: 20, coins: 80, karma: -8 } }] }
  ];
  Object.assign(SW.TEXT.en, {
    npc_prisoner: 'Prisoner', dl_prisoner_neu: 'Please. The bandits keep us in cages.', dl_prisoner_pos: 'You are the wanderer people speak of. Please help me!', dl_prisoner_neg: 'Stay away from me. I know what you are.',
    npc_sage: 'Temple Sage', dl_sage_neu: 'The temple opens its doors to those who walk with care.', dl_sage_pos: 'Your name is spoken kindly even here, in the clouds. Sit with me.', dl_sage_neg: 'The temple does not know you.',
    qn_sage1: 'Wind Over the Spires', qd_sage1: 'The Wind Shrine on the western spire has been silent for years. Cross the bridges and pray there.', qo_sage1: 'Pray at the Wind Shrine (west spire)', qdone_sage1: 'I felt the wind return. Thank you, wanderer.',
    npc_elder: 'Village Elder', npc_hermit: 'Hermit', npc_fisher: 'Fisher', npc_watch: 'Night Watchman',
    dl_watch_neu: 'Quiet nights are rare. Something stalks the road south of the village after dark.',
    dl_watch_pos: 'Hinode sleeps easier with you around. Will you help me again tonight?',
    dl_watch_neg: 'Keep your distance. I watch you, wanderer.',
    qn_watch1: 'Shadow on the Road', qd_watch1: 'A masked swordsman haunts the road south of the village, but only at night. Find him and end it. I only speak at night.', qo_watch1: 'Defeat the night stalker south of the village (night only)', qdone_watch1: 'The road is quiet. Thank you, wanderer.',
    dl_elder_neu: 'Wanderer. Bandits make our roads unsafe. Will you help us?',
    dl_elder_pos: 'Honored wanderer! The village speaks well of you. Please, sit.',
    dl_elder_neg: 'You are not welcome here. Your name brings fear, not hope.',
    dl_hermit_neu: 'Few climb this far. The mountain shrine has gone quiet.',
    dl_hermit_pos: 'Your steps are light, friend. The shrines will hear you.',
    dl_hermit_neg: 'I feel a shadow on you. Still, the shrine does not turn anyone away.',
    dl_fisher_neu: 'The lake gives, the lake takes. My boy is sick.',
    dl_fisher_pos: 'You are the one who helps people. Please, I need you again.',
    dl_fisher_neg: 'I have little. Do not take it from me.',
    karma_price: 'Karma price: {n}', refuse_herb: 'I do not serve you. Your deeds are known here.', refuse_armor: 'I forge no armor for you. Go.', refuse_general: 'Not for you. Leave my stall.',
    q_offer: 'Quest', q_report: 'Report', q_accept: 'Accept', q_back: 'Back', q_complete: 'Complete', q_refuse: 'The elder refuses to give you work. Earn back trust first.',
    q_locked: 'Needs', q_new: 'New quest: {n}', q_done: 'Quest complete: {n}', q_none: 'No quests yet. Talk to people.',
    q_active: 'Active', q_finished: 'Completed', qs_active: 'In progress', qs_ready: 'Ready to report', qs_done: 'Done',
    q_goal: 'Goal', q_reward: 'Reward', q_choose: 'Choose:', q_from: 'From',
    qn_elder1: 'Bandit at the Gate', qd_elder1: 'A bandit lurks near the village and robs travelers. Drive him off.', qo_elder1: 'Defeat the bandit near the village', qdone_elder1: 'The road is safe again. You have our thanks.',
    qn_elder2: 'Rebuild the Fence', qd_elder2: 'Our fence is broken. Bring 6 wood. Chests in the bamboo forest hold some, the merchant sells it.', qo_elder2: 'Bring wood to the elder', qdone_elder2: 'This will hold. The village grows safer.',
    qn_elder3: 'The Bandit Chief', qd_elder3: 'The chief of the bandit camp in the south keeps the region in fear. End it. Only for those we trust.', qo_elder3: 'Defeat the Bandit Chief in the south', qdone_elder3: 'The chief is fallen! You are a hero of Hinode.',
    qn_elder4: 'Tend the Wounded', qd_elder4: 'Several villagers were hurt by the bandits. Bring 3 healing herbs. The herbalist sells them.', qo_elder4: 'Bring healing herbs to the elder', qdone_elder4: 'The wounded will recover. Some who fled are coming home.',
    qn_elder5: 'Repair the Houses', qd_elder5: 'Roofs are broken and walls torn. Bring 10 wood so we can mend the main houses.', qo_elder5: 'Bring wood to the elder', qdone_elder5: 'Hammers ring again. The main houses stand firm.',
    qn_elder6: 'Rekindle the Forge', qd_elder6: 'The smith has no iron to restart his forge. Bring 5 iron.', qo_elder6: 'Bring iron to the elder', qdone_elder6: 'The forge burns again. Hinode lives.',
    vg_title: 'Hinode Village', vg_next: 'Next', vg_done: 'Fully restored',
    vg_0: 'Occupied by bandits', vg_1: 'Liberated', vg_2: 'First aid given', vg_3: 'Main houses repaired', vg_4: 'Forge rekindled', vg_5: 'Fully restored',
    vg_up: 'Hinode: {n}',
    vgn_0: 'Defeat the bandit at the gate', vgn_1: 'Tend the Wounded (elder)', vgn_2: 'Repair the Houses (elder)', vgn_3: 'Rekindle the Forge (elder)', vgn_4: 'Rebuild the Fence (elder)',
    qn_hermit1: 'Wake the Mountain Shrine', qd_hermit1: 'Travel to the Great Shrine in the northeast and pray there.', qo_hermit1: 'Pray at the Mountain Shrine', qdone_hermit1: 'I feel it. The mountain speaks again. Thank you.',
    qn_fisher1: 'Medicine for My Son', qd_fisher1: 'My son has a fever. The herbalist in the village sells healing herbs. Please bring 2.', qo_fisher1: 'Bring healing herbs to the fisher', qdone_fisher1: 'You have the herbs. What will you ask in return?',
    qc_fisher1_free: 'Give them freely', qc_fisher1_sell: 'Demand payment'
  });
  for (let i = 1; i <= 3; i++) Object.assign(SW.TEXT.en, {
    ['qn_pris' + i]: 'Caged Prisoner ' + i, ['qd_pris' + i]: 'The bandits keep me in this cage. Defeat the guard watching it and I am free.', ['qo_pris' + i]: 'Defeat the guard of the cage',
    ['qdone_pris' + i]: 'The guard is down. What will you do with me?', ['qc_pris' + i + '_free']: 'Set them free', ['qc_pris' + i + '_sell']: 'Hand them over for ransom'
  });
})();
