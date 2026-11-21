'use strict';
// MOVED: Koordinaten Weltumbau (tools/move_content.py)
// Schreindaten (Phase 5a). Position = Richtwert, wird beim Start auf freie Kachel gesetzt. Namen: Schlüssel shr_<id>.
SW.Data = SW.Data || {};
(function () {
  SW.Data.shrines = [
    { id: 'village', x: 884.5, y: 1167.5 },   // Hinode Village, nahe Dorfmitte
    { id: 'bamboo', x: 1536, y: 774 },       // Verlassene Hütten im Bambuswald
    { id: 'mountain', x: 2502, y: 456 },     // vor dem Großen Schrein
    { id: 'hermit', x: 442, y: 1721 },       // Einsiedlerhütte im Westwald
    { id: 'lookout', x: 3350, y: 1544 },     // Aussichtsturm Gebirge
    { id: 'fishers', x: 1793, y: 1697 },     // Fischerhütten am See
    { id: 'ruins', x: 740.5, y: 2260.5 },    // Alte Tempelruinen
    { id: 'cave', x: 2702, y: 2366 },        // Höhlentempel
    { id: 'grove', x: 1332.5, y: 1158 },       // Mondscheinhain (Region 9)
    { id: 'garden', x: 2292.5, y: 1006 },     // Steingarten (Region 10)
    { id: 'marsh', x: 1300.5, y: 1990 },
    { id: 'frost', x: 740.5, y: 694 }, { id: 'ember', x: 3036.5, y: 814 }, { id: 'dunes', x: 1132.5, y: 2510 }, { id: 'coast', x: 1980.5, y: 2598 }, { id: 'karst', x: 2860.5, y: 1926 }, { id: 'peak', x: 2910.5, y: 1936 }, { id: 'windspire', x: 2710.5, y: 1936 }, { id: 'cloudspire', x: 2825.5, y: 1832.5 },       // Schilfmarsch (Region 11)
    // 0.10.1: Wegschreine (neue Schreine in den Lücken der Karte); Wächtergegner e_x* stehen in combat-data.js
    { id: 'way1', x: 135.5, y: 1093.5 }, { id: 'way2', x: 3485.5, y: 2285.5 }, { id: 'way3', x: 1521.5, y: 2925.5 }, { id: 'way4', x: 2181.5, y: 2083.5 }, { id: 'way5', x: 2317.5, y: 1549.5 }, { id: 'way6', x: 243.5, y: 2213.5 }, { id: 'way7', x: 1831.5, y: 1195.5 }, { id: 'way8', x: 2431.5, y: 2759.5 }, { id: 'way9', x: 1727.5, y: 2199.5 }, { id: 'way10', x: 1033.5, y: 1609.5 }, { id: 'way11', x: 3643.5, y: 1875.5 }, { id: 'way12', x: 489.5, y: 1315.5 }, { id: 'way13', x: 3107.5, y: 2437.5 }, { id: 'way14', x: 1425.5, y: 1557.5 }
  ];
  Object.assign(SW.TEXT.en, {
    pray: 'Pray', shrine_on: 'Shrine awakened: {n}', shrine_found: 'Shrine found: {n}', shrine_travel: 'Traveled to {n}',
    travel: 'Travel', travel_none: 'Not awakened yet. Pray at the shrine first.', travel_hint: 'Tap an awakened shrine on the map to travel there.',
    map_zoom_hint: 'Two fingers: zoom. One finger: move.', shrine_state_on: 'Awakened', shrine_state_off: 'Dormant',
    shr_village: 'Hinode Shrine', shr_bamboo: 'Bamboo Shrine', shr_mountain: 'Mountain Shrine', shr_hermit: 'Hermit Shrine',
    shr_lookout: 'Lookout Shrine', shr_fishers: 'Lakeside Shrine', shr_ruins: 'Ruin Shrine', shr_cave: 'Cave Shrine', shr_grove: 'Grove Shrine', shr_garden: 'Garden Shrine', shr_marsh: 'Marsh Shrine', shr_frost: 'Frost Shrine', shr_ember: 'Crater Shrine', shr_dunes: 'Dune Shrine', shr_coast: 'Coast Shrine', shr_karst: 'Spire Shrine', shr_peak: 'Summit Shrine', shr_windspire: 'Wind Shrine', shr_cloudspire: 'Cloud Shrine'
  });
  SW.TEXT.de = SW.TEXT.de || {};
  Object.assign(SW.TEXT.en, {"shr_way1": "Waystone Shrine: Frostpeaks", "shr_way2": "Waystone Shrine: Sun Coast", "shr_way3": "Waystone Shrine: Sun Coast II", "shr_way4": "Waystone Shrine: Hollow Caves", "shr_way5": "Waystone Shrine: Mirror Lake", "shr_way6": "Waystone Shrine: Forgotten Ruins", "shr_way7": "Waystone Shrine: Mirror Lake II", "shr_way8": "Waystone Shrine: Sun Coast III", "shr_way9": "Waystone Shrine: Bandit Camp", "shr_way10": "Waystone Shrine: Reed Marsh", "shr_way11": "Waystone Shrine: Iron Peaks", "shr_way12": "Waystone Shrine: Hinode Village", "shr_way13": "Waystone Shrine: Sun Coast IV", "shr_way14": "Waystone Shrine: Mirror Lake III"});
  Object.assign(SW.TEXT.de, {"shr_way1": "Wegschrein: Frostgipfel", "shr_way2": "Wegschrein: Sonnenküste", "shr_way3": "Wegschrein: Sonnenküste II", "shr_way4": "Wegschrein: Hohlhöhlen", "shr_way5": "Wegschrein: Spiegelsee", "shr_way6": "Wegschrein: Vergessene Ruinen", "shr_way7": "Wegschrein: Spiegelsee II", "shr_way8": "Wegschrein: Sonnenküste III", "shr_way9": "Wegschrein: Banditenlager", "shr_way10": "Wegschrein: Schilfmarsch", "shr_way11": "Wegschrein: Eisgipfel", "shr_way12": "Wegschrein: Dorf Hinode", "shr_way13": "Wegschrein: Sonnenküste IV", "shr_way14": "Wegschrein: Spiegelsee III"});
})();
