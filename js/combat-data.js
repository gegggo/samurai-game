'use strict';
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
SW.Data.regionArena = ['clearing', 'bamboo', 'temple', 'clearing', 'clearing', 'plateau', 'ruins', 'camp', 'cavern', 'bamboo', 'temple', 'clearing', 'summit', 'ember', 'dunes', 'clearing', 'plateau'];
// Begegnungen in der Welt (Phase 2: feste Testpunkte; echte Gegner-Spawns folgen in Phase 5).
// Position wird beim Start auf die nächste freie Kachel gesetzt.
SW.Data.spots = [
  { id: 'e_train',  type: 'bandit',   x: 401,  y: 408 },
  { id: 'e_bamboo', type: 'bandit',   x: 1230, y: 395 },
  { id: 'e_west',   type: 'ronin',    x: 430,  y: 1180 },
  { id: 'e_shrine', type: 'spearman', x: 2000, y: 520 },
  { id: 'e_ruins',  type: 'samurai',  x: 400,  y: 2030 },
  { id: 'e_east1',  type: 'swift',    x: 1980, y: 1230 },
  { id: 'e_east2',  type: 'armored',  x: 2090, y: 1205 },
  { id: 'e_cave',   type: 'elite',    x: 2000, y: 2030 },
  { id: 'e_boss',   type: 'boss',     x: 1200, y: 2008 },
  // Phase 2b: weitere Gegnerpunkte (Richtwerte, werden auf freie Kacheln gesetzt)
  { id: 'e_bamboo2', type: 'bandit',   x: 1330, y: 480 },
  { id: 'e_bamboo3', type: 'ronin',    x: 1100, y: 310 },
  { id: 'e_bamboo4', type: 'bandit',   x: 1260, y: 300 },
  { id: 'e_shrine2', type: 'spearman', x: 1940, y: 330 },
  { id: 'e_shrine3', type: 'samurai',  x: 2100, y: 470 },
  { id: 'e_west2',   type: 'bandit',   x: 330,  y: 1280 },
  { id: 'e_west3',   type: 'spearman', x: 500,  y: 1100 },
  { id: 'e_lake1',   type: 'ronin',    x: 1452, y: 1330 },
  { id: 'e_east3',   type: 'swift',    x: 1900, y: 1120 },
  { id: 'e_east4',   type: 'armored',  x: 2150, y: 1150 },
  { id: 'e_ruins2',  type: 'ronin',    x: 320,  y: 1930 },
  { id: 'e_ruins3',  type: 'swift',    x: 480,  y: 2110 },
  { id: 'e_camp1',   type: 'bandit',   x: 1130, y: 1940 },
  { id: 'e_camp2',   type: 'bandit',   x: 1280, y: 1960 },
  { id: 'e_camp3',   type: 'ronin',    x: 1180, y: 2090 },
  { id: 'e_camp4',   type: 'samurai',  x: 1260, y: 2100 },
  { id: 'e_cave2',   type: 'swift',    x: 1944, y: 2060 },
  { id: 'e_cave3',   type: 'armored',  x: 2090, y: 1930 },
  { id: 'e_grove1',  type: 'ronin',    x: 770,  y: 825 },
  { id: 'e_grove2',  type: 'spearman', x: 835,  y: 770 },
  { id: 'e_grove3',  type: 'swift',    x: 800,  y: 845 },
  // Steingarten (Region 10) und Schilfmarsch (Region 11)
  { id: 'e_garden1', type: 'samurai',  x: 1575, y: 810 },
  { id: 'e_garden2', type: 'armored',  x: 1630, y: 775 },
  { id: 'e_garden3', type: 'spearman', x: 1600, y: 835 },
  { id: 'e_marsh1',  type: 'bandit',   x: 775,  y: 1610 },
  { id: 'e_marsh2',  type: 'swift',    x: 830,  y: 1580 },
  { id: 'e_marsh3',  type: 'ronin',    x: 800,  y: 1635 },
  // Karst Spires: Himmelstempel (Berg 2), Windturm (Berg 3), Wolkenturm (Berg 4)
  { id: 'e_temple1', type: 'armored', x: 1650, y: 1611 }, { id: 'e_temple2', type: 'samurai', x: 1650, y: 1583 },
  { id: 'e_wind1',   type: 'swift',   x: 1458, y: 1612 }, { id: 'e_wind2',   type: 'spearman', x: 1442, y: 1584 },
  { id: 'e_cloud1',  type: 'ronin',   x: 1550, y: 1496 }, { id: 'e_cloud2',  type: 'samurai',  x: 1570, y: 1494 },
  // Bosse
  { id: 'e_warden',  type: 'boss_warden', x: 370,  y: 2130 },
  { id: 'e_monk',    type: 'boss_monk',   x: 2100, y: 1300 },
  { id: 'e_oni',     type: 'boss_oni',    x: 1990, y: 2120 }
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
  boss:     { xp: 200, ess: 2, karma: 8, secret: 'cross' },
  boss_warden: { xp: 260, ess: 3, karma: 5, secret: 'ironwill' },
  boss_monk:   { xp: 320, ess: 3, karma: 5, secret: 'stillwater' },
  boss_oni:    { xp: 420, ess: 4, karma: 6, secret: 'oniwrath' }
};
// Phase 7d: Kopfgeldjäger (kv = erscheinen bei Karma <= kv, einmalig besiegbar, gespeichert über 'defeated')
SW.Data.spots.push(
  { id: 'h_1', type: 'samurai', x: 470, y: 430, kv: -30 },
  { id: 'h_2', type: 'armored', x: 340, y: 500, kv: -30 }
);
// Phase 7c: Nachtgegner (nur nachts sichtbar). respawn: jede Nacht neu, nicht gespeichert. Ohne respawn: einmalig (Quest 'watch1').
SW.Data.spots.push(
  { id: 'n_quest', type: 'samurai',  x: 400,  y: 470, night: true },
  { id: 'n_south', type: 'swift',    x: 400,  y: 800, night: true, respawn: true },
  { id: 'n_east',  type: 'ronin',    x: 800,  y: 400, night: true, respawn: true },
  { id: 'n_mid',   type: 'spearman', x: 1200, y: 800, night: true, respawn: true },
  { id: 'n_lake',  type: 'armored',  x: 800,  y: 1200, night: true, respawn: true }
);
