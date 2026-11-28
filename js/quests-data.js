'use strict';
// MOVED: Koordinaten Weltumbau (tools/move_content.py)
// Quest-, Dialog- und Quest-NPC-Daten (Phase 5b). Alle Werte Platzhalter bis Balancing.
// Ziel-Typen: kill (Gegnerpunkt besiegt) | shrine (Schrein erweckt) | have (Gegenstand abgeben, wird verbraucht).
// req: done = Quest davor, level, karma (Mindestwert). choice = Entscheidung beim Abschluss (Karma-Folgen).
// Belohnungen: coins, xp, ess (Zahl), karma. Essence nur als Belohnung, ausgegeben wird sie nur im Skilltree.
SW.Data = SW.Data || {};
(function () {
  const D = SW.Data;
  // Daten (NPCs, Quests) liegen seit Phase 20 in data/quests.json und data/world.json.
  Object.assign(SW.TEXT.en, {
    npc_prisoner: 'Prisoner', dl_prisoner_neu: 'Please. The bandits keep us in cages.', dl_prisoner_pos: 'You are the wanderer people speak of. Please help me!', dl_prisoner_neg: 'Stay away from me. I know what you are.',
    npc_sage: 'Temple Sage', dl_sage_neu: 'The temple opens its doors to those who walk with care.', dl_sage_pos: 'Your name is spoken kindly even here, in the clouds. Sit with me.', dl_sage_neg: 'The temple does not know you.',
    qn_sage1: 'Wind Over the Spires', qd_sage1: 'The Wind Shrine on the western spire has been silent for years. Cross the bridges and pray there.', qo_sage1: 'Pray at the Wind Shrine (west spire)', qdone_sage1: 'I felt the wind return. Thank you, wanderer.',
    npc_elder: 'Village Elder', npc_hermit: 'Hermit', npc_fisher: 'Fisher', npc_watch: 'Night Watchman',
    dl_watch_neu: 'Quiet nights are rare. Something stalks the road south of the village after dark.',
    dl_watch_pos: 'Hinode sleeps easier with you around. Will you help me again tonight?',
    dl_watch_neg: 'Keep your distance. I watch you, wanderer.',
    qn_watch1: 'Shadow on the Road', qd_watch1: 'A masked swordsman haunts the road south of the village, but only at night. Find him and end it. I only speak at night.', qo_watch1: 'Defeat the night stalker south of the village (night only)', qdone_watch1: 'The road is quiet. Thank you, wanderer.',
    npc_master: 'Master', dl_master_neu: 'The bandit chief carried a fragment of an older script. Its scattered signs point to a sealed gate in the Forgotten Ruins.', dl_master_pos: 'You found the signs. Bring me their full sequence, and I will show you what they reveal.', dl_master_neg: 'Your reputation troubles me, but the old script matters more than our quarrel.',
    qn_main_glyphs: 'The Forgotten Script', qd_main_glyphs: 'Twelve old stone signs are scattered across distant regions. Find each one, record its letter in the dictionary, and return to me.', qo_main_glyphs: 'Find all 12 forgotten signs', qdone_main_glyphs: 'The letters form a warning: THE GATE OPENS. I know where the forgotten entrance lies.',
    qn_main_gate: 'The Hidden Entrance', qd_main_gate: 'The signs revealed an entrance in the Forgotten Ruins. Reach the sealed gate and open it. Then return to me.', qo_main_gate: 'Open the forgotten gate in the ruins', qdone_main_gate: 'The gate is open. Beyond it lies a place absent from every known map. The final trail begins there.',
    glyph_book: 'Old Dictionary', glyph_found: 'Ancient sign discovered', glyph_letter: 'Translated letter: {n}', glyph_count: 'Collected signs: {n}', glyph_unknown: 'Not yet discovered', glyph_phrase: 'THE GATE OPENS', glyph_book_hint: 'The letters are recorded in the order of the old inscription.', read_glyph: 'Read inscription', open_gate: 'Examine gate', gate_locked_hint: 'The gate has appeared, but you should speak with the Master first.', gate_need_quest: 'The Master has not yet asked you to open the gate.', gate_opened: 'The ancient gate opens. A forgotten passage lies beyond it.', gate_title: 'The Forgotten Gate', glyph_title: 'Ancient Stone Sign', q_story: 'Main story',
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
    qn_elder7: 'Ronin on the Ridge', qd_elder7: 'A ronin camps north of the village and scares the farmers. Drive him off.', qo_elder7: 'Defeat the ronin north of the village', qdone_elder7: 'The farmers can sleep again.',
    qn_elder8: 'Pray at the Grove', qd_elder8: 'The Moonlit Grove shrine is untended. Pray there for the village.', qo_elder8: 'Pray at the Moonlit Grove shrine', qdone_elder8: 'The grove is at peace. Good.',
    qn_elder9: 'The Chief\'s Scouts', qd_elder9: 'A bandit scout watches our roads for the chief. Take him out before you face the chief.', qo_elder9: 'Defeat the bandit scout', qdone_elder9: 'No more eyes on us. Now the chief is open to you.',
    qn_elder3: 'The Bandit Chief', qd_elder3: 'The chief of the bandit camp in the Western Woods keeps the region in fear. End it. Only for those we trust.', qo_elder3: 'Defeat the Bandit Chief in the Western Woods', qdone_elder3: 'The chief is fallen! You are a hero of Hinode.',
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
