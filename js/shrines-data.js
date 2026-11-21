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
    { id: 'frost', x: 740.5, y: 694 }, { id: 'ember', x: 3036.5, y: 814 }, { id: 'dunes', x: 1132.5, y: 2510 }, { id: 'coast', x: 1980.5, y: 2598 }, { id: 'karst', x: 2860.5, y: 1926 }, { id: 'peak', x: 2910.5, y: 1936 }, { id: 'windspire', x: 2710.5, y: 1936 }, { id: 'cloudspire', x: 2825.5, y: 1832.5 }       // Schilfmarsch (Region 11)
  ];
  Object.assign(SW.TEXT.en, {
    pray: 'Pray', shrine_on: 'Shrine awakened: {n}', shrine_found: 'Shrine found: {n}', shrine_travel: 'Traveled to {n}',
    travel: 'Travel', travel_none: 'Not awakened yet. Pray at the shrine first.', travel_hint: 'Tap an awakened shrine on the map to travel there.',
    map_zoom_hint: 'Two fingers: zoom. One finger: move.', shrine_state_on: 'Awakened', shrine_state_off: 'Dormant',
    shr_village: 'Hinode Shrine', shr_bamboo: 'Bamboo Shrine', shr_mountain: 'Mountain Shrine', shr_hermit: 'Hermit Shrine',
    shr_lookout: 'Lookout Shrine', shr_fishers: 'Lakeside Shrine', shr_ruins: 'Ruin Shrine', shr_cave: 'Cave Shrine', shr_grove: 'Grove Shrine', shr_garden: 'Garden Shrine', shr_marsh: 'Marsh Shrine', shr_frost: 'Frost Shrine', shr_ember: 'Crater Shrine', shr_dunes: 'Dune Shrine', shr_coast: 'Coast Shrine', shr_karst: 'Spire Shrine', shr_peak: 'Summit Shrine', shr_windspire: 'Wind Shrine', shr_cloudspire: 'Cloud Shrine'
  });
})();
