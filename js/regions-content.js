'use strict';
// Phase 8/9B (0.12.0): Quests + NPCs für Regionen 12-16 und neue Region 17 (Sakura Grove, js/layout-sakura.js).
// Reine Daten, hängt an SW.Data (npcs, quests, spots, chests, shrines). Alle Belohnungen/Werte Platzhalter bis Balancing.
SW.Data = SW.Data || {};
(function () {
  const D = SW.Data, de = (SW.TEXT.de = SW.TEXT.de || {}), en = SW.TEXT.en;
  // Richtwerte, Positionen werden beim Start auf freie Kacheln gesetzt
  D.shrines.push({ id: 'sakura', x: 4360, y: 1486 });
  D.shrines.push({ id: 'fortress', x: 4180, y: 2488 }); // Phase 14: Verlassene Festung (Region 18)
  D.chests.push(
    { id: 'c_fort1', x: 4160, y: 2470, rar: 'rare', give: { ess: 1 } }, { id: 'c_fort2', x: 4215, y: 2512, rar: 'uncommon', give: { coins: 220 } }, { id: 'c_fort3', x: 4120, y: 2510, rar: 'common', give: { item: 'iron', n: 3 } },
    { id: 'c_sakura1', x: 4330, y: 1450, rar: 'rare', give: { ess: 1 } },
    { id: 'c_sakura2', x: 4440, y: 1500, rar: 'uncommon', give: { coins: 160 } },
    { id: 'c_sakura3', x: 4290, y: 1530, rar: 'common', give: { item: 'herb', n: 5 } }
  );
  D.spots.push(
    { id: 'e_frostq', type: 'armored', x: 800, y: 640 }, { id: 'e_emberq', type: 'samurai', x: 3090, y: 880 },
    { id: 'e_dunesq', type: 'swift', x: 1190, y: 2570 }, { id: 'e_coastq', type: 'ronin', x: 2040, y: 2650 },
    { id: 'e_fort1', type: 'spearman', x: 4150, y: 2490 }, { id: 'e_fort2', type: 'ronin', x: 4215, y: 2475 }, { id: 'e_fort3', type: 'armored', x: 4180, y: 2455 }, { id: 'e_fort4', type: 'swift', x: 4110, y: 2520 }, { id: 'e_fortq', type: 'samurai', x: 4230, y: 2455 },
    { id: 'e_sakura1', type: 'swift', x: 4290, y: 1450 }, { id: 'e_sakura2', type: 'samurai', x: 4420, y: 1420 },
    { id: 'e_sakura3', type: 'spearman', x: 4300, y: 1560 }, { id: 'e_sakuraq', type: 'samurai', x: 4500, y: 1400 }
  );
  // Quest-NPCs (q: true). Rollen: trapper, pilgrim, nomad, sailor, climber, gardener
  D.npcs.push(
    { id: 'n_trapper', role: 'trapper', q: true, x: 726, y: 712, robe: '#6a7a8a', hat: '#e4eef2' },
    { id: 'n_pilgrim', role: 'pilgrim', q: true, x: 3020, y: 832, robe: '#8a3a2a', hat: '#3a2a26' },
    { id: 'n_nomad', role: 'nomad', q: true, x: 1120, y: 2528, robe: '#b88a4a', hat: '#e8d9a8' },
    { id: 'n_sailor', role: 'sailor', q: true, x: 1968, y: 2616, robe: '#3a6a8a', hat: '#e8e0c8' },
    { id: 'n_climber', role: 'climber', q: true, x: 2822, y: 1935, robe: '#5a6a4a', hat: '#a89a6a' },
    { id: 'n_veteran', role: 'veteran', q: true, x: 4205, y: 2500, robe: '#7a6a5a', hat: '#2a2a30' },
    { id: 'n_gardener', role: 'gardener', q: true, x: 4325, y: 1500, robe: '#c8789a', hat: '#f4d8e2' },
    { id: 'n_st_weapon', role: 'weapon', x: 4118, y: 1491, robe: '#7a2e2a', hat: '#2a2a30' }, { id: 'n_st_armor', role: 'armor', x: 4136, y: 1491, robe: '#3a4a6a', hat: '#5a5a62' },
    { id: 'n_st_general', role: 'general', x: 4154, y: 1491, robe: '#7a6a3a', hat: '#4a3a22' }, { id: 'n_st_herb', role: 'herb', x: 4172, y: 1491, robe: '#3f6b4a', hat: '#2a4a30' },
    { id: 'n_st_smith', role: 'smith', x: 4190, y: 1491, robe: '#5a4a44', hat: '#1c1c20' } // Sakura-Stadt (0.17.0)
  );
  const kill = (id, giver, spot, rew, req) => ({ id, giver, req, obj: { type: 'kill', spot }, rew });
  const have = (id, giver, item, n, rew, req) => ({ id, giver, req, obj: { type: 'have', item, n }, rew });
  D.quests.push(
    kill('frost1', 'n_trapper', 'e_frostq', { coins: 120, xp: 90, karma: 5 }),
    { id: 'frost2', giver: 'n_trapper', req: { done: 'frost1' }, obj: { type: 'shrine', shrine: 'way1' }, rew: { xp: 100, ess: 1, karma: 3 } },
    kill('ember1', 'n_pilgrim', 'e_emberq', { coins: 150, xp: 110, karma: 5 }),
    have('ember2', 'n_pilgrim', 'iron', 6, { coins: 100, xp: 100, ess: 1, karma: 4 }, { done: 'ember1' }),
    kill('dunes1', 'n_nomad', 'e_dunesq', { coins: 140, xp: 100, karma: 5 }),
    { id: 'dunes2', giver: 'n_nomad', req: { done: 'dunes1' }, obj: { type: 'have', item: 'herb', n: 3 }, choice: [{ id: 'free', rew: { xp: 60, karma: 6 } }, { id: 'sell', rew: { xp: 30, coins: 90, karma: -8 } }] },
    kill('coast1', 'n_sailor', 'e_coastq', { coins: 130, xp: 100, karma: 5 }),
    have('coast2', 'n_sailor', 'wood', 8, { coins: 90, xp: 90, ess: 1, karma: 4 }, { done: 'coast1' }),
    { id: 'karst1', giver: 'n_climber', obj: { type: 'shrine', shrine: 'cloudspire' }, rew: { xp: 110, karma: 3 } },
    kill('karst2', 'n_climber', 'e_spire5', { coins: 160, xp: 120, ess: 1, karma: 4 }, { done: 'karst1' }),
    kill('sakura1', 'n_gardener', 'e_sakuraq', { coins: 170, xp: 130, karma: 5 }),
    have('sakura2', 'n_gardener', 'wood', 5, { coins: 80, xp: 100, ess: 1, karma: 4 }, { done: 'sakura1' }),
    kill('fort1', 'n_veteran', 'e_fortq', { coins: 190, xp: 140, karma: 5 }),
    have('fort2', 'n_veteran', 'iron', 6, { coins: 100, xp: 110, ess: 1, karma: 4 }, { done: 'fort1' })
  );
  const E = {
    poi_sakuratown: 'Sakura Town', reg_18: 'Abandoned Fortress', poi_fortress: 'Abandoned Fortress', shr_fortress: 'Fortress Shrine',
    npc_veteran: 'Veteran', dl_veteran_neu: 'I held this wall once. Now a samurai squats in our courtyard.', dl_veteran_pos: 'Your steps are steady, wanderer. The wall remembers good soldiers.', dl_veteran_neg: 'I have seen your kind on the other side of the gate.',
    qn_fort1: 'Reclaim the Courtyard', qd_fort1: 'A samurai has claimed the fortress courtyard. Drive him out.', qo_fort1: 'Defeat the samurai in the Abandoned Fortress', qdone_fort1: 'The courtyard is ours again. Thank you.',
    qn_fort2: 'Mend the Gate', qd_fort2: 'The south gate needs iron fittings. Bring 6 iron.', qo_fort2: 'Bring iron to the veteran', qdone_fort2: 'The gate will hold again.',
    reg_17: 'Sakura Grove', poi_sakura: 'Sakura Grove', shr_sakura: 'Sakura Shrine',
    npc_trapper: 'Trapper', dl_trapper_neu: 'Cold bites here. A guard in iron has taken the pass.', dl_trapper_pos: 'The snow remembers kind feet. Help me once more?', dl_trapper_neg: 'Keep your distance. The mountain does not forgive.',
    npc_pilgrim: 'Pilgrim', dl_pilgrim_neu: 'We came to the crater to pray. Raiders came after us.', dl_pilgrim_pos: 'Blessings on you, wanderer. The fire is kind today.', dl_pilgrim_neg: 'Your shadow is longer than your sword.',
    npc_nomad: 'Nomad', dl_nomad_neu: 'The dunes hide many things. A fast blade hides among them.', dl_nomad_pos: 'Your name travels farther than our caravans.', dl_nomad_neg: 'I trade with no one who frightens children.',
    npc_sailor: 'Sailor', dl_sailor_neu: 'Smugglers use our coast. My boat rots while they laugh.', dl_sailor_pos: 'Good tides follow you, friend.', dl_sailor_neg: 'The sea remembers what you did.',
    npc_climber: 'Climber', dl_climber_neu: 'The spires are beautiful and deadly. Want to see the top?', dl_climber_pos: 'You climb like the wind. Join me.', dl_climber_neg: 'Heights are no place for those with a dark heart.',
    npc_gardener: 'Gardener', dl_gardener_neu: 'The blossoms fall early this year. Armed men trample the grove.', dl_gardener_pos: 'The trees bloom for you, wanderer.', dl_gardener_neg: 'Do not step on my flowers.',
    qn_frost1: 'Iron on the Pass', qd_frost1: 'An armored warrior blocks the snowy pass. Drive him off.', qo_frost1: 'Defeat the armored warrior in the Frostpeaks', qdone_frost1: 'The pass is open. Thank you.',
    qn_frost2: 'Light the Waystone', qd_frost2: 'A waystone shrine in the cold west has gone dark. Pray there so travelers find it.', qo_frost2: 'Pray at the Frostpeaks waystone shrine', qdone_frost2: 'I see the light from here. Well done.',
    qn_ember1: 'Cinder Raiders', qd_ember1: 'Raiders hide in the ash and rob pilgrims. Find their leader.', qo_ember1: 'Defeat the raider at Ember Crater', qdone_ember1: 'The ash is quiet again.',
    qn_ember2: 'Iron for the Pilgrims', qd_ember2: 'We want to rebuild our shrine gate. Bring 6 iron.', qo_ember2: 'Bring iron to the pilgrim', qdone_ember2: 'The gate will stand again. Bless you.',
    qn_dunes1: 'Blade in the Sand', qd_dunes1: 'A fast swordsman strikes our caravans and vanishes in the dunes. End it.', qo_dunes1: 'Defeat the swordsman in the Dust Dunes', qdone_dunes1: 'The caravans can pass. Thank you.',
    qn_dunes2: 'Herbs for the Caravan', qd_dunes2: 'Many in my caravan have fever. I need 3 healing herbs.', qo_dunes2: 'Bring healing herbs to the nomad', qdone_dunes2: 'You have the herbs. What will you ask in return?', qc_dunes2_free: 'Give them freely', qc_dunes2_sell: 'Demand payment',
    qn_coast1: "Smugglers' Cove", qd_coast1: 'A ronin guards the smugglers hidden along the coast. Remove him.', qo_coast1: 'Defeat the ronin at the Sun Coast', qdone_coast1: 'The cove is free. Thanks.',
    qn_coast2: 'Mend the Pier', qd_coast2: 'My pier is rotten. Bring 8 wood.', qo_coast2: 'Bring wood to the sailor', qdone_coast2: 'The pier is whole again.',
    qn_karst1: 'Cloud Prayer', qd_karst1: 'Reach the Cloud Spire shrine in the north and pray there.', qo_karst1: 'Pray at the Cloud Shrine', qdone_karst1: 'You made it! The wind welcomes you.',
    qn_karst2: 'Guardian of the South Spire', qd_karst2: 'A ronin guards the southern spire. Make it safe for climbers.', qo_karst2: 'Defeat the ronin on the south spire', qdone_karst2: 'Climbers can pass. Thank you.',
    qn_sakura1: 'Trampled Blossoms', qd_sakura1: 'A samurai camps in the northeast of the grove and tramples it. Drive him out.', qo_sakura1: 'Defeat the samurai in the Sakura Grove', qdone_sakura1: 'The grove can breathe again.',
    qn_sakura2: 'Repair the Pavilion', qd_sakura2: 'The old pavilion leaks. Bring 5 wood.', qo_sakura2: 'Bring wood to the gardener', qdone_sakura2: 'Tea will be served under dry roofs again.'
  };
  const G = {
    poi_sakuratown: 'Sakura-Stadt', reg_18: 'Verlassene Festung', poi_fortress: 'Verlassene Festung', shr_fortress: 'Festungsschrein',
    npc_veteran: 'Veteran', dl_veteran_neu: 'Ich habe diese Mauer einst gehalten. Jetzt hockt ein Samurai in unserem Hof.', dl_veteran_pos: 'Dein Schritt ist fest, Wanderer. Die Mauer erinnert sich an gute Krieger.', dl_veteran_neg: 'Deinesgleichen habe ich auf der anderen Seite des Tores gesehen.',
    qn_fort1: 'Den Hof zurückerobern', qd_fort1: 'Ein Samurai hat den Festungshof besetzt. Vertreibe ihn.', qo_fort1: 'Besiege den Samurai in der Verlassenen Festung', qdone_fort1: 'Der Hof gehört uns wieder. Danke.',
    qn_fort2: 'Das Tor flicken', qd_fort2: 'Das Südtor braucht Eisenbeschläge. Bring 6 Eisen.', qo_fort2: 'Bring Eisen zum Veteranen', qdone_fort2: 'Das Tor wird wieder halten.',
    reg_17: 'Sakura-Hain', poi_sakura: 'Sakura-Hain', shr_sakura: 'Sakura-Schrein',
    npc_trapper: 'Fallensteller', dl_trapper_neu: 'Hier beißt die Kälte. Ein Krieger in Eisen hält den Pass.', dl_trapper_pos: 'Der Schnee erinnert sich an gute Schritte. Hilfst du mir noch einmal?', dl_trapper_neg: 'Bleib fern. Der Berg vergibt nicht.',
    npc_pilgrim: 'Pilger', dl_pilgrim_neu: 'Wir kamen zum Krater, um zu beten. Räuber folgten uns.', dl_pilgrim_pos: 'Segen auf dich, Wanderer. Das Feuer ist heute gnädig.', dl_pilgrim_neg: 'Dein Schatten ist länger als dein Schwert.',
    npc_nomad: 'Nomade', dl_nomad_neu: 'Die Dünen verbergen vieles. Auch eine schnelle Klinge.', dl_nomad_pos: 'Dein Name reist weiter als unsere Karawanen.', dl_nomad_neg: 'Ich handle nicht mit Leuten, die Kinder erschrecken.',
    npc_sailor: 'Seemann', dl_sailor_neu: 'Schmuggler nutzen unsere Küste. Mein Boot verrottet, während sie lachen.', dl_sailor_pos: 'Gute Gezeiten folgen dir, Freund.', dl_sailor_neg: 'Das Meer erinnert sich an deine Taten.',
    npc_climber: 'Bergsteiger', dl_climber_neu: 'Die Spitzen sind schön und tödlich. Willst du hinauf?', dl_climber_pos: 'Du kletterst wie der Wind. Komm mit.', dl_climber_neg: 'Für dunkle Herzen ist die Höhe kein Ort.',
    npc_gardener: 'Gärtnerin', dl_gardener_neu: 'Die Blüten fallen dieses Jahr früh. Bewaffnete trampeln den Hain nieder.', dl_gardener_pos: 'Die Bäume blühen für dich, Wanderer.', dl_gardener_neg: 'Tritt nicht auf meine Blumen.',
    qn_frost1: 'Eisen am Pass', qd_frost1: 'Ein gepanzerter Krieger versperrt den verschneiten Pass. Vertreibe ihn.', qo_frost1: 'Besiege den gepanzerten Krieger in den Frostgipfeln', qdone_frost1: 'Der Pass ist frei. Danke.',
    qn_frost2: 'Wegstein entzünden', qd_frost2: 'Ein Wegschrein im kalten Westen ist erloschen. Bete dort, damit Reisende ihn finden.', qo_frost2: 'Bete am Wegschrein der Frostgipfel', qdone_frost2: 'Ich sehe das Licht von hier. Gut gemacht.',
    qn_ember1: 'Aschenräuber', qd_ember1: 'Räuber verstecken sich in der Asche und berauben Pilger. Finde ihren Anführer.', qo_ember1: 'Besiege den Räuber am Glutkrater', qdone_ember1: 'Die Asche ist wieder still.',
    qn_ember2: 'Eisen für die Pilger', qd_ember2: 'Wir wollen unser Schreintor wieder aufbauen. Bring 6 Eisen.', qo_ember2: 'Bring Eisen zum Pilger', qdone_ember2: 'Das Tor wird wieder stehen. Gesegnet seist du.',
    qn_dunes1: 'Klinge im Sand', qd_dunes1: 'Ein schneller Schwertkämpfer überfällt unsere Karawanen und verschwindet in den Dünen. Beende das.', qo_dunes1: 'Besiege den Schwertkämpfer in den Staubdünen', qdone_dunes1: 'Die Karawanen können passieren. Danke.',
    qn_dunes2: 'Kräuter für die Karawane', qd_dunes2: 'Viele in meiner Karawane haben Fieber. Ich brauche 3 Heilkräuter.', qo_dunes2: 'Bring Heilkräuter zum Nomaden', qdone_dunes2: 'Du hast die Kräuter. Was verlangst du dafür?', qc_dunes2_free: 'Freiwillig geben', qc_dunes2_sell: 'Bezahlung verlangen',
    qn_coast1: 'Schmugglerbucht', qd_coast1: 'Ein Ronin bewacht die Schmuggler an der Küste. Entferne ihn.', qo_coast1: 'Besiege den Ronin an der Sonnenküste', qdone_coast1: 'Die Bucht ist frei. Danke.',
    qn_coast2: 'Den Steg reparieren', qd_coast2: 'Mein Steg ist morsch. Bring 8 Holz.', qo_coast2: 'Bring Holz zum Seemann', qdone_coast2: 'Der Steg ist wieder heil.',
    qn_karst1: 'Wolkengebet', qd_karst1: 'Erreiche den Wolkenturm-Schrein im Norden und bete dort.', qo_karst1: 'Bete am Wolkenschrein', qdone_karst1: 'Du hast es geschafft! Der Wind heißt dich willkommen.',
    qn_karst2: 'Wächter der Südspitze', qd_karst2: 'Ein Ronin bewacht die südliche Spitze. Mach sie sicher für Bergsteiger.', qo_karst2: 'Besiege den Ronin auf der Südspitze', qdone_karst2: 'Bergsteiger können passieren. Danke.',
    qn_sakura1: 'Zertrampelte Blüten', qd_sakura1: 'Ein Samurai lagert im Nordosten des Hains und trampelt ihn nieder. Vertreibe ihn.', qo_sakura1: 'Besiege den Samurai im Sakura-Hain', qdone_sakura1: 'Der Hain kann wieder atmen.',
    qn_sakura2: 'Pavillon reparieren', qd_sakura2: 'Der alte Pavillon ist undicht. Bring 5 Holz.', qo_sakura2: 'Bring Holz zur Gärtnerin', qdone_sakura2: 'Tee gibt es bald wieder unter trockenem Dach.'
  };
  Object.assign(en, E); Object.assign(de, G);
})();
