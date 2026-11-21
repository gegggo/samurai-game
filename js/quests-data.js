'use strict';
// Quest-, Dialog- und Quest-NPC-Daten (Phase 5b). Alle Werte Platzhalter bis Balancing.
// Ziel-Typen: kill (Gegnerpunkt besiegt) | shrine (Schrein erweckt) | have (Gegenstand abgeben, wird verbraucht).
// req: done = Quest davor, level, karma (Mindestwert). choice = Entscheidung beim Abschluss (Karma-Folgen).
// Belohnungen: coins, xp, ess {Art:n}, karma. Essence nur als Belohnung, ausgegeben wird sie nur im Skilltree.
SW.Data = SW.Data || {};
(function () {
  const D = SW.Data;
  // Quest-NPCs (q: true = nur Quests, kein Handel). Position wird beim Start auf freie Kachel gesetzt.
  D.npcs.push(
    { id: 'n_elder', role: 'elder', q: true, x: 403.5, y: 404.5, robe: '#c9c3b0', hat: '#8a8a90' },
    { id: 'n_hermit', role: 'hermit', q: true, x: 386.5, y: 1224.5, robe: '#5a4a34', hat: '#3a3226' },
    { id: 'n_fisher', role: 'fisher', q: true, x: 1101.5, y: 1470.5, robe: '#3a5a6a', hat: '#c8b070' }
  );
  D.quests = [
    { id: 'elder1', giver: 'n_elder', obj: { type: 'kill', spot: 'e_train' }, rew: { coins: 80, xp: 50, karma: 5 } },
    { id: 'elder2', giver: 'n_elder', req: { done: 'elder1' }, obj: { type: 'have', item: 'wood', n: 6 }, rew: { coins: 40, xp: 40, ess: { common: 1 }, karma: 4 } },
    { id: 'elder3', giver: 'n_elder', req: { done: 'elder2', level: 3, karma: 10 }, obj: { type: 'kill', spot: 'e_boss' }, rew: { coins: 300, xp: 150, ess: { refined: 1 }, karma: 10 } },
    { id: 'elder4', giver: 'n_elder', req: { done: 'elder1' }, obj: { type: 'have', item: 'herb', n: 3 }, rew: { coins: 30, xp: 40, karma: 4 } },
    { id: 'elder5', giver: 'n_elder', req: { done: 'elder4' }, obj: { type: 'have', item: 'wood', n: 10 }, rew: { coins: 60, xp: 60, karma: 4 } },
    { id: 'elder6', giver: 'n_elder', req: { done: 'elder5' }, obj: { type: 'have', item: 'iron', n: 5 }, rew: { coins: 80, xp: 70, ess: { common: 1 }, karma: 4 } },
    { id: 'hermit1', giver: 'n_hermit', obj: { type: 'shrine', shrine: 'mountain' }, rew: { xp: 70, ess: { common: 2 }, karma: 3 } },
    { id: 'fisher1', giver: 'n_fisher', obj: { type: 'have', item: 'herb', n: 2 },
      choice: [{ id: 'free', rew: { xp: 40, karma: 6 } }, { id: 'sell', rew: { xp: 20, coins: 80, karma: -8 } }] }
  ];
  Object.assign(SW.TEXT.en, {
    npc_elder: 'Village Elder', npc_hermit: 'Hermit', npc_fisher: 'Fisher',
    dl_elder_neu: 'Wanderer. Bandits make our roads unsafe. Will you help us?',
    dl_elder_pos: 'Honored wanderer! The village speaks well of you. Please, sit.',
    dl_elder_neg: 'You are not welcome here. Your name brings fear, not hope.',
    dl_hermit_neu: 'Few climb this far. The mountain shrine has gone quiet.',
    dl_hermit_pos: 'Your steps are light, friend. The shrines will hear you.',
    dl_hermit_neg: 'I feel a shadow on you. Still, the shrine does not turn anyone away.',
    dl_fisher_neu: 'The lake gives, the lake takes. My boy is sick.',
    dl_fisher_pos: 'You are the one who helps people. Please, I need you again.',
    dl_fisher_neg: 'I have little. Do not take it from me.',
    karma_price: 'Karma price: {n}', refuse_herb: 'I do not serve you. Your deeds are known here.', refuse_general: 'Not for you. Leave my stall.',
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
})();
