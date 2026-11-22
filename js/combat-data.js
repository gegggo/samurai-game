'use strict';
// MOVED: Koordinaten Weltumbau (tools/move_content.py)
// Kampfdaten (Phase 2). Platzhalterwerte, Balancing folgt in Phase 3 und 6.
SW.Data = SW.Data || {};
// Basiswerte des Spielers. Phase 3 ersetzt das über SW.Combat.playerStats().
SW.Data.player = { hp: 100, ki: 100, kiRegen: 3, atk: 1, def: 0 };
// Spieleraktionen: wind = Vorlauf bis Treffer, rec = Erholung, dmg = Schaden, ki = Kosten
SW.Data.moves = {
  quick:   { wind: .18, rec: .24, dmg: 6 },
  normal:  { wind: .32, rec: .34, dmg: 10 },
  heavy:   { wind: .65, rec: .55, dmg: 22, guardBreak: true },
  special: { wind: .45, rec: .50, dmg: 34, ki: 40 },
  counter: { wind: .15, rec: .30, dmg: 26 }
};
// Gegnerangriffe: wind = Vorwarnung, rec = Erholung, hits/gap = Mehrfachtreffer,
// block = Schadensanteil trotz Block (Standard .2), unblock = nur Ausweichen hilft
SW.Data.attacks = {
  slash:  { kind: 'slash',  wind: .75, rec: .65, dmg: 8 },
  heavy:  { kind: 'slash',  wind: 1.1, rec: .95, dmg: 16, block: .45 },
  thrust: { kind: 'thrust', wind: .55, rec: .60, dmg: 9 },
  flurry: { kind: 'slash',  wind: .60, rec: .90, dmg: 5, hits: 3, gap: .32 },
  rage:   { kind: 'slash',  wind: 1.4, rec: 1.2, dmg: 24, unblock: true },
  // Phase 2b: Bossangriffe
  sweep:  { kind: 'slash',  wind: .85, rec: .80, dmg: 10, hits: 2, gap: .45 },
  storm:  { kind: 'slash',  wind: .70, rec: 1.10, dmg: 5, hits: 5, gap: .26 },
  crush:  { kind: 'slash',  wind: 1.25, rec: 1.10, dmg: 20, block: .7 }
};
// Gegnertypen. dmg = Schadensfaktor, speed = Tempo, gap = Pause zwischen Angriffen (s),
// guard = Chance auf Verteidigung, armor = Schadensminderung gegen leichte Treffer
SW.Data.enemies = {
  bandit:   { hp: 40,  dmg: 1,   speed: 1,    gap: [1.4, 2.2], guard: .05, atk: ['slash', 'slash', 'heavy'], weapon: 'sword',
              look: { cloth: '#6b4a2f', trim: '#3b2a1a', hair: '#1a1410', mask: '#4a4a52', legs: '#33302b' } },
  ronin:    { hp: 60,  dmg: 1,   speed: 1,    gap: [1.1, 1.8], guard: .15, atk: ['slash', 'thrust', 'slash', 'flurry'], weapon: 'sword',
              look: { cloth: '#56606e', trim: '#2c3340', hair: '#1a1a20', legs: '#2a2f3a' } },
  samurai:  { hp: 85,  dmg: 1.2, speed: 1.05, gap: [1.0, 1.6], guard: .25, atk: ['slash', 'heavy', 'flurry', 'thrust'], weapon: 'sword',
              look: { cloth: '#8c2b27', trim: '#d1a84a', helm: '#2a2a30', plate: '#6b1d1b', legs: '#2a2226' } },
  spearman: { hp: 60,  dmg: 1,   speed: 1.1,  gap: [1.0, 1.7], guard: .10, atk: ['thrust', 'thrust', 'heavy'], weapon: 'spear',
              look: { cloth: '#4d6b4a', trim: '#2a3a28', hair: '#1a1a14', legs: '#2b3328' } },
  swift:    { hp: 50,  dmg: 1,   speed: 1.45, gap: [.7, 1.2],  guard: .10, atk: ['slash', 'flurry', 'flurry', 'thrust'], weapon: 'sword',
              look: { cloth: '#2f3d66', trim: '#8fa8d8', hair: '#101018', mask: '#2f3d66', legs: '#1d2440' } },
  armored:  { hp: 130, dmg: 1.3, speed: .8,   gap: [1.3, 2.0], guard: .35, armor: .3, atk: ['heavy', 'slash', 'heavy'], weapon: 'sword',
              look: { cloth: '#5a5a62', trim: '#9a9aa2', helm: '#3a3a42', plate: '#6a6a74', legs: '#2c2c34' } },
  elite:    { hp: 150, dmg: 1.4, speed: 1.2,  gap: [.8, 1.3],  guard: .30, atk: ['slash', 'flurry', 'heavy', 'thrust'], weapon: 'sword',
              look: { cloth: '#2a2a32', trim: '#c9a23a', helm: '#1c1c22', plate: '#3a3a44', legs: '#1c1c22' } },
  // Schattenclan (Phase 8): Hinterhalt bei schlechtem Karma, siehe combat.js ambush()
  shadow:   { hp: 70,  dmg: 1.1, speed: 1.3,  gap: [.8, 1.3],  guard: .15, atk: ['slash', 'flurry', 'thrust', 'slash'], weapon: 'sword',
              look: { cloth: '#1a1a22', trim: '#b3262b', hair: '#101018', mask: '#b3262b', legs: '#14141a' } },
  boss:     { hp: 260, dmg: 1.3, weapon: 'sword',
              look: { cloth: '#5b1a1a', trim: '#d1a84a', helm: '#2a1010', plate: '#7a2020', cape: '#3a0e0e', legs: '#1c1010' },
              phases: [
                { at: 1,   speed: 1,   gap: [1.2, 1.8], guard: .15, atk: ['slash', 'slash', 'heavy'] },
                { at: .66, speed: 1.2, gap: [.9, 1.4],  guard: .20, atk: ['slash', 'flurry', 'heavy', 'thrust'] },
                { at: .33, speed: 1.4, gap: [.6, 1.0],  guard: .10, atk: ['flurry', 'flurry', 'heavy', 'thrust', 'rage'] }
              ] },
  // Phase 2b: weitere Bosse mit eigener Arena, eigenem Aussehen und eigenen Phasen
  boss_warden: { hp: 300, dmg: 1.35, weapon: 'sword', arena: 'warden',
              look: { cloth: '#3b4a5a', trim: '#9fd0c8', helm: '#20262e', plate: '#4d5f70', cape: '#26323f', legs: '#1a2028' },
              phases: [
                { at: 1,  speed: 1.05, gap: [1.1, 1.7], guard: .20, atk: ['slash', 'thrust', 'heavy'] },
                { at: .6, speed: 1.2,  gap: [.9, 1.4],  guard: .25, atk: ['sweep', 'flurry', 'thrust', 'heavy'] },
                { at: .3, speed: 1.4,  gap: [.6, 1.0],  guard: .15, atk: ['sweep', 'flurry', 'flurry', 'rage', 'thrust'] }
              ] },
  boss_monk:   { hp: 340, dmg: 1.25, weapon: 'spear', arena: 'summit',
              look: { cloth: '#c28a2e', trim: '#6b2d1d', hair: '#15110e', legs: '#5c3a1c' },
              phases: [
                { at: 1,   speed: 1.1,  gap: [1.0, 1.6], guard: .20, atk: ['thrust', 'thrust', 'slash'] },
                { at: .65, speed: 1.25, gap: [.8, 1.3],  guard: .30, atk: ['thrust', 'flurry', 'sweep', 'heavy'] },
                { at: .35, speed: 1.45, gap: [.55, 1.0], guard: .20, atk: ['flurry', 'storm', 'thrust', 'crush'] }
              ] },
  boss_oni:    { hp: 420, dmg: 1.5, weapon: 'sword', arena: 'oni',
              look: { cloth: '#2a1636', trim: '#c43a3a', helm: '#1a0f22', mask: '#9a2b2b', plate: '#3b1f4a', cape: '#1a0f22', legs: '#140b1a' },
              phases: [
                { at: 1,   speed: 1.1,  gap: [1.0, 1.5], guard: .25, atk: ['heavy', 'slash', 'sweep'] },
                { at: .66, speed: 1.3,  gap: [.8, 1.2],  guard: .30, atk: ['sweep', 'flurry', 'heavy', 'thrust'] },
                { at: .4,  speed: 1.45, gap: [.6, 1.0],  guard: .20, atk: ['storm', 'flurry', 'crush', 'rage'] },
                { at: .2,  speed: 1.6,  gap: [.45, .8],  guard: .10, atk: ['storm', 'storm', 'rage', 'crush'] }
              ] }
};
// Arenen (prozedural). deco bestimmt die Kulisse.
SW.Data.arenas = {
  clearing: { sky: ['#9cc4d6', '#dbe8c9'], gnd: ['#5f8f45', '#34592b'], deco: 'trees' },
  bamboo:   { sky: ['#b8d8b0', '#e4efc8'], gnd: ['#6a9a4a', '#35602a'], deco: 'bamboo' },
  temple:   { sky: ['#e8b98a', '#f3e2bd'], gnd: ['#a9a49a', '#6b675f'], deco: 'temple' },
  plateau:  { sky: ['#8fb0cc', '#d8e2ea'], gnd: ['#8a8780', '#55524d'], deco: 'plateau' },
  camp:     { sky: ['#c7886a', '#e9c79a'], gnd: ['#8a6a46', '#4f3a24'], deco: 'camp' },
  ruins:    { sky: ['#7e8ca3', '#bfc4c8'], gnd: ['#7d7a72', '#45433e'], deco: 'ruins' },
  // Phase 2b: Boss-Arenen
  warden:   { sky: ['#5d6a85', '#a9b0c2'], gnd: ['#6f6c66', '#3b3a36'], deco: 'ruins' },
  summit:   { sky: ['#7fa6d6', '#e6eef6'], gnd: ['#9aa3ab', '#5f666d'], deco: 'plateau' },
  oni:      { sky: ['#1b1424', '#352a42'], gnd: ['#3a3340', '#1a161e'], deco: 'cavern' },
  ember:    { sky: ['#4a1a14', '#c0582e'], gnd: ['#4a3a36', '#1e1614'], deco: 'cavern' },
  dunes:    { sky: ['#e8c78a', '#f6e6bf'], gnd: ['#d9b877', '#a68450'], deco: 'plateau' },
  cavern:   { sky: ['#1f1a28', '#3a3346'], gnd: ['#4a4450', '#221e28'], deco: 'cavern' }
};
// Region (Index wie in world.js) -> Arena
SW.Data.regionArena = ['clearing', 'bamboo', 'temple', 'clearing', 'clearing', 'plateau', 'ruins', 'camp', 'cavern', 'bamboo', 'temple', 'clearing', 'summit', 'ember', 'dunes', 'clearing', 'plateau', 'clearing'];
// Begegnungen in der Welt (Phase 2: feste Testpunkte; echte Gegner-Spawns folgen in Phase 5).
// Position wird beim Start auf die nächste freie Kachel gesetzt.
SW.Data.spots = [
  { id: 'e_train',  type: 'bandit',   x: 885, y: 1180 },
  { id: 'e_bamboo', type: 'bandit',   x: 1586, y: 775 },
  { id: 'e_west',   type: 'ronin',    x: 490, y: 1680 },
  { id: 'e_shrine', type: 'spearman', x: 2492, y: 580 },
  { id: 'e_ruins',  type: 'samurai',  x: 740, y: 2290 },
  { id: 'e_east1',  type: 'swift',    x: 3320, y: 1578 },
  { id: 'e_east2',  type: 'armored',  x: 3430, y: 1553 },
  { id: 'e_cave',   type: 'elite',    x: 2692, y: 2402 },
  { id: 'e_boss',   type: 'boss',     x: 1652, y: 2196 },
  // Phase 2b: weitere Gegnerpunkte (Richtwerte, werden auf freie Kacheln gesetzt)
  { id: 'e_bamboo2', type: 'bandit',   x: 1686, y: 860 },
  { id: 'e_bamboo3', type: 'ronin',    x: 1456, y: 690 },
  { id: 'e_bamboo4', type: 'bandit',   x: 1616, y: 680 },
  { id: 'e_shrine2', type: 'spearman', x: 2432, y: 390 },
  { id: 'e_shrine3', type: 'samurai',  x: 2592, y: 530 },
  { id: 'e_west2',   type: 'bandit',   x: 390, y: 1780 },
  { id: 'e_west3',   type: 'spearman', x: 560, y: 1600 },
  { id: 'e_lake1',   type: 'ronin',    x: 2139, y: 1560 },
  { id: 'e_east3',   type: 'swift',    x: 3240, y: 1468 },
  { id: 'e_east4',   type: 'armored',  x: 3490, y: 1498 },
  { id: 'e_ruins2',  type: 'ronin',    x: 660, y: 2190 },
  { id: 'e_ruins3',  type: 'swift',    x: 820, y: 2370 },
  { id: 'e_camp1',   type: 'bandit',   x: 1582, y: 2128 },
  { id: 'e_camp2',   type: 'bandit',   x: 1732, y: 2148 },
  { id: 'e_camp3',   type: 'ronin',    x: 1632, y: 2278 },
  { id: 'e_camp4',   type: 'samurai',  x: 1712, y: 2288 },
  { id: 'e_cave2',   type: 'swift',    x: 2636, y: 2432 },
  { id: 'e_cave3',   type: 'armored',  x: 2782, y: 2302 },
  { id: 'e_grove1',  type: 'ronin',    x: 1302, y: 1189 },
  { id: 'e_grove2',  type: 'spearman', x: 1367, y: 1134 },
  { id: 'e_grove3',  type: 'swift',    x: 1332, y: 1209 },
  // Steingarten (Region 10) und Schilfmarsch (Region 11)
  { id: 'e_garden1', type: 'samurai',  x: 2267, y: 1022 },
  { id: 'e_garden2', type: 'armored',  x: 2322, y: 987 },
  { id: 'e_garden3', type: 'spearman', x: 2292, y: 1047 },
  { id: 'e_marsh1',  type: 'bandit',   x: 1275, y: 2006 },
  { id: 'e_marsh2',  type: 'swift',    x: 1330, y: 1976 },
  { id: 'e_marsh3',  type: 'ronin',    x: 1300, y: 2031 },
  // Karst Spires: Himmelstempel (Berg 2), Windturm (Berg 3), Wolkenturm (Berg 4)
  { id: 'e_temple1', type: 'armored', x: 2910, y: 1943 }, { id: 'e_temple2', type: 'samurai', x: 2910, y: 1915 },
  { id: 'e_wind1',   type: 'swift',   x: 2718, y: 1944 }, { id: 'e_wind2',   type: 'spearman', x: 2702, y: 1916 },
  { id: 'e_cloud1',  type: 'ronin',   x: 2810, y: 1828 }, { id: 'e_cloud2',  type: 'samurai',  x: 2830, y: 1826 },
  // Karst Berg 5 (Süd) und Berg 6 (fern im Osten), neu im Weltumbau
  { id: 'e_spire5', type: 'ronin', x: 2820, y: 2040 }, { id: 'e_spire6', type: 'swift', x: 3006, y: 1928 },
  // 0.10.1: Zusatzgegner (Gruppen in allen Regionen + 2 Wächter an jedem neuen Schrein). Richtwerte, werden auf freie Kacheln gesetzt. Typ nach Regionsstufe, kein Elite/Boss -> keine Essence.
  { id: 'e_x1', type: 'samurai', x: 3429, y: 2341 }, { id: 'e_x2', type: 'samurai', x: 3425, y: 2341 },
  { id: 'e_x3', type: 'swift', x: 3425, y: 2349 }, { id: 'e_x4', type: 'swift', x: 1537, y: 2929 },
  { id: 'e_x5', type: 'spearman', x: 1541, y: 2929 }, { id: 'e_x6', type: 'samurai', x: 2247, y: 2129 },
  { id: 'e_x7', type: 'swift', x: 2237, y: 2131 }, { id: 'e_x8', type: 'swift', x: 2243, y: 2131 },
  { id: 'e_x9', type: 'ronin', x: 1055, y: 1641 }, { id: 'e_x10', type: 'bandit', x: 1049, y: 1639 },
  { id: 'e_x11', type: 'spearman', x: 1061, y: 1643 }, { id: 'e_x12', type: 'swift', x: 2395, y: 2787 },
  { id: 'e_x13', type: 'spearman', x: 2397, y: 2791 }, { id: 'e_x14', type: 'armored', x: 275, y: 2311 },
  { id: 'e_x15', type: 'swift', x: 269, y: 2311 }, { id: 'e_x16', type: 'spearman', x: 367, y: 967 },
  { id: 'e_x17', type: 'samurai', x: 365, y: 971 }, { id: 'e_x18', type: 'spearman', x: 361, y: 967 },
  { id: 'e_x19', type: 'ronin', x: 1759, y: 1733 }, { id: 'e_x20', type: 'spearman', x: 1763, y: 1737 },
  { id: 'e_x21', type: 'bandit', x: 1757, y: 1739 }, { id: 'e_x22', type: 'samurai', x: 3583, y: 1999 },
  { id: 'e_x23', type: 'samurai', x: 3591, y: 1999 }, { id: 'e_x24', type: 'swift', x: 2499, y: 1563 },
  { id: 'e_x25', type: 'spearman', x: 2503, y: 1569 }, { id: 'e_x26', type: 'samurai', x: 939, y: 1987 },
  { id: 'e_x27', type: 'swift', x: 935, y: 1979 }, { id: 'e_x28', type: 'samurai', x: 939, y: 1983 },
  { id: 'e_x29', type: 'swift', x: 3079, y: 2453 }, { id: 'e_x30', type: 'swift', x: 3083, y: 2447 },
  { id: 'e_x31', type: 'swift', x: 3079, y: 2449 }, { id: 'e_x32', type: 'spearman', x: 1523, y: 2601 },
  { id: 'e_x33', type: 'armored', x: 1531, y: 2593 }, { id: 'e_x34', type: 'spearman', x: 1525, y: 2595 },
  { id: 'e_x35', type: 'armored', x: 2309, y: 2457 }, { id: 'e_x36', type: 'samurai', x: 2303, y: 2455 },
  { id: 'e_x37', type: 'spearman', x: 2053, y: 1865 }, { id: 'e_x38', type: 'ronin', x: 2045, y: 1865 },
  { id: 'e_x39', type: 'bandit', x: 2051, y: 1869 }, { id: 'e_x40', type: 'ronin', x: 2397, y: 1859 },
  { id: 'e_x41', type: 'spearman', x: 2401, y: 1867 }, { id: 'e_x42', type: 'swift', x: 2399, y: 1863 },
  { id: 'e_x43', type: 'swift', x: 3281, y: 2069 }, { id: 'e_x44', type: 'swift', x: 3275, y: 2067 },
  { id: 'e_x45', type: 'bandit', x: 2085, y: 1261 }, { id: 'e_x46', type: 'ronin', x: 2075, y: 1261 },
  { id: 'e_x47', type: 'armored', x: 1253, y: 2831 }, { id: 'e_x48', type: 'swift', x: 1253, y: 2835 },
  { id: 'e_x49', type: 'bandit', x: 181, y: 1205 }, { id: 'e_x50', type: 'spearman', x: 181, y: 1201 },
  { id: 'e_x51', type: 'ronin', x: 187, y: 1209 }, { id: 'e_x52', type: 'swift', x: 2111, y: 2905 },
  { id: 'e_x53', type: 'armored', x: 2103, y: 2907 }, { id: 'e_x54', type: 'samurai', x: 2107, y: 2903 },
  { id: 'e_x55', type: 'spearman', x: 1745, y: 1293 }, { id: 'e_x56', type: 'ronin', x: 1749, y: 1301 },
  { id: 'e_x57', type: 'bandit', x: 1747, y: 1297 }, { id: 'e_x58', type: 'ronin', x: 1351, y: 1683 },
  { id: 'e_x59', type: 'bandit', x: 1359, y: 1687 }, { id: 'e_x60', type: 'bandit', x: 1353, y: 1689 },
  { id: 'e_x61', type: 'spearman', x: 2533, y: 2169 }, { id: 'e_x62', type: 'swift', x: 2529, y: 2165 },
  { id: 'e_x63', type: 'spearman', x: 1825, y: 2883 }, { id: 'e_x64', type: 'samurai', x: 1827, y: 2877 },
  { id: 'e_x65', type: 'bandit', x: 639, y: 1017 }, { id: 'e_x66', type: 'spearman', x: 643, y: 1021 },
  { id: 'e_x67', type: 'ronin', x: 2001, y: 2295 }, { id: 'e_x68', type: 'swift', x: 1995, y: 2289 },
  { id: 'e_x69', type: 'spearman', x: 1997, y: 2293 }, { id: 'e_x70', type: 'ronin', x: 1355, y: 2305 },
  { id: 'e_x71', type: 'ronin', x: 1353, y: 2309 }, { id: 'e_x72', type: 'armored', x: 409, y: 2061 },
  { id: 'e_x73', type: 'spearman', x: 405, y: 2057 }, { id: 'e_x74', type: 'spearman', x: 403, y: 2053 },
  { id: 'e_x75', type: 'swift', x: 1083, y: 2215 }, { id: 'e_x76', type: 'swift', x: 1087, y: 2205 },
  { id: 'e_x77', type: 'swift', x: 3045, y: 2191 }, { id: 'e_x78', type: 'swift', x: 3039, y: 2185 },
  { id: 'e_x79', type: 'spearman', x: 1143, y: 1389 }, { id: 'e_x80', type: 'spearman', x: 1131, y: 1393 },
  { id: 'e_x81', type: 'spearman', x: 3061, y: 1673 }, { id: 'e_x82', type: 'swift', x: 3059, y: 1681 },
  { id: 'e_x83', type: 'ronin', x: 939, y: 929 }, { id: 'e_x84', type: 'ronin', x: 931, y: 927 },
  { id: 'e_x85', type: 'samurai', x: 2653, y: 2751 }, { id: 'e_x86', type: 'samurai', x: 2645, y: 2747 },
  { id: 'e_x87', type: 'swift', x: 2649, y: 2743 }, { id: 'e_x88', type: 'spearman', x: 1555, y: 1871 },
  { id: 'e_x89', type: 'samurai', x: 1557, y: 1877 }, { id: 'e_x90', type: 'spearman', x: 129, y: 1087 },
  { id: 'e_x91', type: 'swift', x: 137, y: 1085 }, { id: 'e_x92', type: 'armored', x: 3485, y: 2275 },
  { id: 'e_x93', type: 'swift', x: 3477, y: 2283 }, { id: 'e_x94', type: 'swift', x: 1517, y: 2915 },
  { id: 'e_x95', type: 'samurai', x: 1513, y: 2925 }, { id: 'e_x96', type: 'ronin', x: 2183, y: 2075 },
  { id: 'e_x97', type: 'ronin', x: 2179, y: 2091 }, { id: 'e_x98', type: 'bandit', x: 2321, y: 1555 },
  { id: 'e_x99', type: 'spearman', x: 2325, y: 1555 }, { id: 'e_x100', type: 'spearman', x: 251, y: 2209 },
  { id: 'e_x101', type: 'armored', x: 249, y: 2221 }, { id: 'e_x102', type: 'bandit', x: 1827, y: 1185 },
  { id: 'e_x103', type: 'ronin', x: 1833, y: 1185 }, { id: 'e_x104', type: 'samurai', x: 2425, y: 2753 },
  { id: 'e_x105', type: 'swift', x: 2439, y: 2753 }, { id: 'e_x106', type: 'swift', x: 1737, y: 2201 },
  { id: 'e_x107', type: 'samurai', x: 1737, y: 2197 }, { id: 'e_x108', type: 'bandit', x: 1023, y: 1605 },
  { id: 'e_x109', type: 'ronin', x: 1031, y: 1601 }, { id: 'e_x110', type: 'swift', x: 3635, y: 1869 },
  { id: 'e_x111', type: 'ronin', x: 3633, y: 1879 }, { id: 'e_x112', type: 'spearman', x: 479, y: 1315 },
  { id: 'e_x113', type: 'spearman', x: 493, y: 1325 }, { id: 'e_x114', type: 'armored', x: 3099, y: 2439 },
  { id: 'e_x115', type: 'armored', x: 3103, y: 2445 }, { id: 'e_x116', type: 'spearman', x: 1433, y: 1551 },
  { id: 'e_x117', type: 'bandit', x: 1415, y: 1561 },
  // Bosse
  { id: 'e_warden',  type: 'boss_warden', x: 710, y: 2390 },
  { id: 'e_monk',    type: 'boss_monk',   x: 3440, y: 1648 },
  { id: 'e_oni',     type: 'boss_oni',    x: 2682, y: 2492 }
];
// Belohnungen je Gegnertyp (Phase 3, Platzhalter bis Balancing). xp = Erfahrung, ess = Essence (Zahl; BALANCE-PLATZHALTER), karma = Ruf, secret = geheime Technik.
// Münzen folgen in Phase 4, Gegenstände ebenfalls.
SW.Data.rewards = {
  bandit:   { xp: 12, karma: 2 },
  ronin:    { xp: 20 },
  samurai:  { xp: 35 },
  spearman: { xp: 25 },
  swift:    { xp: 28 },
  armored:  { xp: 40 },
  elite:    { xp: 70, ess: 2, karma: 3 },
  shadow:   { xp: 30 },
  boss:     { xp: 200, ess: 2, karma: 8, secret: 'cross' },
  boss_warden: { xp: 260, ess: 3, karma: 5, secret: 'ironwill' },
  boss_monk:   { xp: 320, ess: 3, karma: 5, secret: 'stillwater' },
  boss_oni:    { xp: 420, ess: 4, karma: 6, secret: 'oniwrath' }
};
// Phase 7d: Kopfgeldjäger (kv = erscheinen bei Karma <= kv, einmalig besiegbar, gespeichert über 'defeated')
SW.Data.spots.push(
  { id: 'h_1', type: 'samurai', x: 954, y: 1202, kv: -30 },
  { id: 'h_2', type: 'armored', x: 824, y: 1272, kv: -30 }
);
// Phase 7c: Nachtgegner (nur nachts sichtbar). respawn: jede Nacht neu, nicht gespeichert. Ohne respawn: einmalig (Quest 'watch1').
SW.Data.spots.push(
  { id: 'n_quest', type: 'samurai',  x: 884, y: 1242, night: true },
  { id: 'n_south', type: 'swift',    x: 436, y: 1372, night: true, respawn: true },
  { id: 'n_east',  type: 'ronin',    x: 1156, y: 780, night: true, respawn: true },
  { id: 'n_mid',   type: 'spearman', x: 1887, y: 1030, night: true, respawn: true },
  { id: 'n_lake',  type: 'armored',  x: 1487, y: 1430, night: true, respawn: true }
);

// 0.9.26: Frostpeaks, Ember Crater, Dust Dunes, Sun Coast (je 3 einmalige Gegner; Belohnung nach Typ, keine Essence; Platzhalter)
SW.Data.spots.push(
  { id: 'e_frost1', type: 'spearman', x: 705, y: 670 },
  { id: 'e_frost2', type: 'swift',    x: 780, y: 720 },
  { id: 'e_frost3', type: 'armored',  x: 745, y: 745 },
  { id: 'e_ember1', type: 'ronin',    x: 3000, y: 790 },
  { id: 'e_ember2', type: 'samurai',  x: 3075, y: 840 },
  { id: 'e_ember3', type: 'armored',  x: 3040, y: 870 },
  { id: 'e_dunes1', type: 'bandit',   x: 1095, y: 2485 },
  { id: 'e_dunes2', type: 'ronin',    x: 1170, y: 2540 },
  { id: 'e_dunes3', type: 'spearman', x: 1130, y: 2565 },
  { id: 'e_coast1', type: 'bandit',   x: 1945, y: 2570 },
  { id: 'e_coast2', type: 'swift',    x: 2020, y: 2620 },
  { id: 'e_coast3', type: 'ronin',    x: 1985, y: 2640 }
);
