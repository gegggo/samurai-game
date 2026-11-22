'use strict';
// Phase 8/9B (0.12.0): Quests + NPCs für Regionen 12-16 und neue Region 17 (Sakura Grove, js/layout-sakura.js).
// Reine Daten, hängt an SW.Data (npcs, quests, spots, chests, shrines). Alle Belohnungen/Werte Platzhalter bis Balancing.
SW.Data = SW.Data || {};
(function () {
  const D = SW.Data, de = (SW.TEXT.de = SW.TEXT.de || {}), en = SW.TEXT.en;
  // Daten (Schreine, Truhen, Gegnerpunkte, NPCs, Quests) liegen seit Phase 20 in data/*.json; hier nur noch Texte.
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
