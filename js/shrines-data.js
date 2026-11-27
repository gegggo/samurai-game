'use strict';
// MOVED: Koordinaten Weltumbau (tools/move_content.py)
// Schreindaten (Phase 5a). Position = Richtwert, wird beim Start auf freie Kachel gesetzt. Namen: Schlüssel shr_<id>.
SW.Data = SW.Data || {};
(function () {
  Object.assign(SW.TEXT.en, {
    pray: 'Pray', shrine_on: 'Shrine awakened: {n}', shrine_found: 'Shrine found: {n}', shrine_travel: 'Traveled to {n}',
    travel: 'Travel', travel_none: 'Not awakened yet. Pray at the shrine first.', travel_hint: 'Tap an awakened shrine on the map to travel there.',
    map_zoom_hint: 'Two fingers: zoom. One finger: move.', shrine_state_on: 'Awakened', shrine_state_off: 'Dormant',
    shr_village: 'Hinode Shrine', shr_bamboo: 'Bamboo Shrine', shr_mountain: 'Mountain Shrine', shr_hermit: 'Hermit Shrine',
    shr_lookout: 'Lookout Shrine', shr_fishers: 'Lakeside Shrine', shr_ruins: 'Ruin Shrine', shr_cave: 'Cave Shrine', shr_grove: 'Grove Shrine', shr_garden: 'Garden Shrine', shr_marsh: 'Marsh Shrine', shr_frost: 'Frost Shrine', shr_ember: 'Crater Shrine', shr_dunes: 'Dune Shrine', shr_coast: 'Coast Shrine', shr_karst: 'Spire Shrine', shr_peak: 'Summit Shrine', shr_windspire: 'Wind Shrine', shr_cloudspire: 'Cloud Shrine', shr_gaptemple: 'Tide Temple'
  });
  SW.TEXT.de = SW.TEXT.de || {};
  Object.assign(SW.TEXT.en, {"shr_way1": "Waystone Shrine: Frostpeaks", "shr_way2": "Waystone Shrine: Sun Coast", "shr_way3": "Waystone Shrine: Sun Coast II", "shr_way4": "Waystone Shrine: Hollow Caves", "shr_way5": "Waystone Shrine: Mirror Lake", "shr_way6": "Waystone Shrine: Forgotten Ruins", "shr_way7": "Waystone Shrine: Mirror Lake II", "shr_way8": "Waystone Shrine: Sun Coast III", "shr_way9": "Waystone Shrine: Bandit Camp", "shr_way10": "Waystone Shrine: Reed Marsh", "shr_way11": "Waystone Shrine: Iron Peaks", "shr_way12": "Waystone Shrine: Hinode Village", "shr_way13": "Waystone Shrine: Sun Coast IV", "shr_way14": "Waystone Shrine: Mirror Lake III", "shr_gaptemple": "Tide Temple"});
  Object.assign(SW.TEXT.de, {"shr_way1": "Wegschrein: Frostgipfel", "shr_way2": "Wegschrein: Sonnenküste", "shr_way3": "Wegschrein: Sonnenküste II", "shr_way4": "Wegschrein: Hohlhöhlen", "shr_way5": "Wegschrein: Spiegelsee", "shr_way6": "Wegschrein: Vergessene Ruinen", "shr_way7": "Wegschrein: Spiegelsee II", "shr_way8": "Wegschrein: Sonnenküste III", "shr_way9": "Wegschrein: Banditenlager", "shr_way10": "Wegschrein: Schilfmarsch", "shr_way11": "Wegschrein: Eisgipfel", "shr_way12": "Wegschrein: Dorf Hinode", "shr_way13": "Wegschrein: Sonnenküste IV", "shr_way14": "Wegschrein: Spiegelsee III", "shr_gaptemple": "Gezeitentempel"});
})();
