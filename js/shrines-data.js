'use strict';
// Schreindaten (Phase 5a). Position = Richtwert, wird beim Start auf freie Kachel gesetzt. Namen: Schlüssel shr_<id>.
SW.Data = SW.Data || {};
(function () {
  SW.Data.shrines = [
    { id: 'village', x: 400.5, y: 395.5 },   // Hinode Village, nahe Dorfmitte
    { id: 'bamboo', x: 1180, y: 394 },       // Verlassene Hütten im Bambuswald
    { id: 'mountain', x: 2010, y: 396 },     // vor dem Großen Schrein
    { id: 'hermit', x: 382, y: 1221 },       // Einsiedlerhütte im Westwald
    { id: 'lookout', x: 2010, y: 1196 },     // Aussichtsturm Gebirge
    { id: 'fishers', x: 1106, y: 1467 },     // Fischerhütten am See
    { id: 'ruins', x: 400.5, y: 2000.5 },    // Alte Tempelruinen
    { id: 'cave', x: 2010, y: 1994 }         // Höhlentempel
  ];
  Object.assign(SW.TEXT.en, {
    pray: 'Pray', shrine_on: 'Shrine awakened: {n}', shrine_found: 'Shrine found: {n}', shrine_travel: 'Traveled to {n}',
    travel: 'Travel', travel_none: 'Not awakened yet. Pray at the shrine first.', travel_hint: 'Tap an awakened shrine on the map to travel there.',
    map_zoom_hint: 'Two fingers: zoom. One finger: move.', shrine_state_on: 'Awakened', shrine_state_off: 'Dormant',
    shr_village: 'Hinode Shrine', shr_bamboo: 'Bamboo Shrine', shr_mountain: 'Mountain Shrine', shr_hermit: 'Hermit Shrine',
    shr_lookout: 'Lookout Shrine', shr_fishers: 'Lakeside Shrine', shr_ruins: 'Ruin Shrine', shr_cave: 'Cave Shrine'
  });
})();
