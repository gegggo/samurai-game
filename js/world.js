'use strict';
// Weltgenerierung: deterministisch, Chunk-Cache. Keine Kachel-Arrays für die ganze Welt.
SW.World = (function () {
  const N = SW.CFG.WORLD, R = N / 3, C = [R / 2, R * 1.5, R * 2.5];
  const T = { GRASS: 0, FOREST: 1, BAMBOO: 2, ROCK: 3, WATER: 4, DEEP: 5, PATH: 6, BRIDGE: 7, SAND: 8, STONE: 9, CAVE: 10, DIRT: 11, SNOW: 12, ASH: 13, LAVA: 14, DUNE: 15, STAIR: 16, WALL: 17 };
  const O = { NONE: 0, TREE: 1, BAMBOO: 2, BOULDER: 3, PILLAR: 4 };
  const PAL = [[98,142,70],[58,102,58],[118,150,84],[112,108,112],[58,128,168],[34,88,134],[180,150,100],[130,92,58],[214,196,146],[150,148,150],[58,52,66],[150,122,86],[232,238,244],[74,62,60],[226,92,34],[226,190,120],[176,170,160],[160,138,110]];
  // Regionen: 0 NW Dorf, 1 N Bambus, 2 NO Schrein, 3 W Wald, 4 Mitte See, 5 O Gebirge, 6 SW Ruinen, 7 S Banditen, 8 SO Höhlen
  const ROCKY = [2, 2, .66, 2, 2, .56, 2, 2, .58, 2, 2, 2];
  const DENS = [.05, .34, .12, .2, .03, .07, .05, .07, .05, .14, .12, .06, .07, .04, .02, .03, .05];

  function h(x, y, s) {
    let n = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 1442695041)) | 0;
    n = Math.imul(n ^ (n >>> 13), 1274126177); n ^= n >>> 16;
    return (n >>> 0) / 4294967296;
  }
  function vn(x, y, s) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = h(xi, yi, s), b = h(xi + 1, yi, s), c = h(xi, yi + 1, s), d = h(xi + 1, yi + 1, s);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(x, y, s) { return vn(x / 40, y / 40, s) * .6 + vn(x / 15, y / 15, s + 1) * .3 + vn(x / 6, y / 6, s + 2) * .1; }

  const GX = 800, GY = 800; // Region 9: Moonlit Grove (Kreis, r 80) in der Lücke zwischen Dorf, Wald und See
  // Kleine Kreisregionen (r 80): 9 Hain, 10 Steingarten, 11 Schilfmarsch. Region = Index + 9.
  // 12 Frostpeaks (Schnee), 13 Ember Crater (Vulkan), 14 Dust Dunes (Wüste), 15 Sun Coast (Küste), 16 Karst Spires (hohe Felstürme); r = Radius
  const MINI = [{ x: 800, y: 800 }, { x: 1600, y: 800 }, { x: 800, y: 1600 }, { x: 100, y: 100, r: 190 }, { x: 2300, y: 100, r: 190 }, { x: 100, y: 2300, r: 190 }, { x: 2300, y: 2300, r: 190 }, { x: 1600, y: 1600, r: 150 }];
  function regionAt(x, y) {
    for (let i = 0; i < MINI.length; i++) if ((x - MINI[i].x) * (x - MINI[i].x) + (y - MINI[i].y) * (y - MINI[i].y) < (MINI[i].r || 80) * (MINI[i].r || 80)) return 9 + i;
    const wx = x + (vn(x / 50, y / 50, 11) - .5) * 120, wy = y + (vn(x / 50, y / 50, 12) - .5) * 120;
    const cx = Math.min(2, Math.max(0, Math.floor(wx / R))), cy = Math.min(2, Math.max(0, Math.floor(wy / R)));
    return cy * 3 + cx;
  }
  // Wege: 3 senkrechte + 3 waagrechte, in Regionsmitte gerade, dazwischen leicht geschwungen
  function wob(t, s) {
    const d = Math.min(Math.abs(t - C[0]), Math.abs(t - C[1]), Math.abs(t - C[2]));
    return (vn(t / 30, s, 31) - .5) * 40 * Math.min(1, d / 60);
  }
  function roadDist(x, y) {
    let m = 1e9;
    for (let i = 0; i < 3; i++) m = Math.min(m, Math.abs(x - (C[i] + wob(y, i))), Math.abs(y - (C[i] + wob(x, i + 3))));
    return m;
  }
  const RA = [1750, 150], RB = [1350, 1090];
  function riverDist(x, y) {
    const dx = RB[0] - RA[0], dy = RB[1] - RA[1];
    let t = ((x - RA[0]) * dx + (y - RA[1]) * dy) / (dx * dx + dy * dy);
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(x - (RA[0] + dx * t + Math.sin(t * 14) * 18), y - (RA[1] + dy * t + Math.cos(t * 11) * 18));
  }

  // Karst: zwei schmale Berge. Plateau (p = Anteil), Treppe auf der Südseite, Brücke y 1598-1599. Dorf auf Berg 1, Tempel auf Berg 2.
  const MT = [{ x: 1560, y: 1600, rx: 18, ry: 34, p: .36 }, { x: 1650, y: 1600, rx: 22, ry: 66, p: .09 }];
  function mtn(x, y) { // 0 Boden, 1 Fels, 2 Treppe, 3 Plateau
    for (let i = 0; i < 2; i++) {
      const m = MT[i], dx = x - m.x, dy = y - m.y, e = (dx / m.rx) * (dx / m.rx) + (dy / m.ry) * (dy / m.ry);
      if (e > 1.08) continue;
      if (e < m.p) return 3;
      if (Math.abs(dx) < 2 && dy > 0) return 2;
      if (e < 1) return 1;
    }
    return 0;
  }
  function biome(reg, x, y, m) {
    if (reg === 16) {
      const k = mtn(x, y);
      if ((y === 1598 || y === 1599) && x > 1560 && x < 1650 && k !== 3) return T.BRIDGE;
      if (k) return k === 1 ? T.ROCK : k === 2 ? T.STAIR : x >= 1640 ? T.STONE : T.GRASS;
    }
    const d = Math.hypot(x - m.x, y - m.y), f = fbm(x, y, 50 + reg);
    if (d < 9) return T.STONE; // Plattform um den Schrein
    if (reg === 12) return d > 22 && f > .64 ? T.ROCK : T.SNOW;
    if (reg === 13) return d > 28 && f > .7 ? T.ROCK : d > 22 && f > .62 ? T.LAVA : T.ASH;
    if (reg === 14) { const o = Math.hypot(x - m.x - 22, y - m.y); return o < 8 ? T.WATER : o < 11 ? T.GRASS : d > 30 && f > .75 ? T.ROCK : T.DUNE; } // Oase
    if (reg === 15) { const c = Math.hypot(N - x, N - y); return c < 80 ? T.DEEP : c < 105 ? T.WATER : c < 118 || f > .62 ? T.SAND : T.GRASS; }
    return T.GRASS; // 16 Karst
  }
  function terrain(x, y) {
    if (x < 5 || y < 5 || x >= N - 5 || y >= N - 5) return T.WALL; // Große Mauer
    const rd = roadDist(x, y), road = rd < 1.6;
    const lc = Math.hypot(x - 1200, y - 1200);
    let water = false, deep = false, ld = 999;
    if (lc > 28 && lc < 340) { ld = lc + (fbm(x, y, 21) - .5) * 90; if (ld < 260) { water = true; deep = ld < 190; } }
    if (!water && riverDist(x, y) < 2.2) water = true;
    if (water) return road ? T.BRIDGE : deep ? T.DEEP : T.WATER;
    if (road) return T.PATH;
    if (ld < 275) return T.SAND;
    const reg = regionAt(x, y);
    if (reg >= 9) {
      if (reg >= 12) return biome(reg, x, y, MINI[reg - 9]);
      const m = MINI[reg - 9], d2 = (x - m.x) * (x - m.x) + (y - m.y) * (y - m.y);
      if (reg === 9) return d2 < 64 ? T.STONE : T.FOREST;
      if (d2 < (reg === 10 ? 144 : 64)) return T.STONE; // Plattform um den Schrein
      if (reg === 11) { const f = fbm(x, y, 41); return d2 > 169 && f > .66 ? T.WATER : f > .6 ? T.SAND : T.GRASS; } // Tümpel mit Sandrand
      return T.GRASS;
    }
    const cx = C[reg % 3], cy = C[(reg / 3) | 0], dx = x - cx, dy = y - cy;
    if (reg === 2 && dx * dx + dy * dy < 196) return T.STONE;
    if (reg === 6 && Math.abs(dx) < 12 && Math.abs(dy) < 9) return T.STONE;
    if (reg === 8 && dx * dx + dy * dy < 2500) return T.CAVE;
    if (reg === 7 && Math.abs(dx) < 21 && Math.abs(dy) < 15) return T.DIRT;
    if (reg === 0 && Math.abs(dx) < 7 && Math.abs(dy) < 7) return T.DIRT;
    if (ROCKY[reg] < 1 && Math.hypot(dx, dy) > 45 && rd > 3 && fbm(x, y, 5) > ROCKY[reg]) return T.ROCK;
    if (reg === 1) return T.BAMBOO;
    if (reg === 3) return T.FOREST;
    if (reg === 7 && fbm(x, y, 8) > .6) return T.DIRT;
    return T.GRASS;
  }

  // ---------- Strukturen ----------
  const S = [], B = new Map();
  function add(type, x, y, w, hh, solid) { const s = { type, x, y, w, h: hh, solid: solid !== false, v: h(x, y, 9) }; S.push(s); return s; }
  function land(x, y) { const t = terrain(x, y); return t !== T.WATER && t !== T.DEEP && t !== T.ROCK && t !== T.WALL && t !== T.LAVA && t !== T.BRIDGE; }
  function onLand(x, y, w, hh, dx, dy) {
    for (let i = 0; i < 40; i++) {
      if (land(x, y) && land(x + w, y) && land(x, y + hh) && land(x + w, y + hh)) break;
      x += dx; y += dy;
    }
    return [Math.round(x), Math.round(y)];
  }
  const POI = [];
  function build() {
    const [vx, vy] = [C[0], C[0]];
    [[-18,-11],[-10,-11],[6,-11],[13,-11],[-18,5],[-10,5],[6,5],[13,5]].forEach(o => add('house', vx + o[0], vy + o[1], 6, 5));
    const bx = C[1], by = C[0];
    [[-25,-12],[18,8],[-30,10]].forEach(o => add('hut', bx + o[0], by + o[1], 4, 4));
    const sx = C[2], sy = C[0];
    add('shrine', sx + 5, sy - 12, 10, 6);
    [[-3, 18],[3, 18],[-3, 27],[3, 27]].forEach(o => add('toriipost', sx + o[0], sy + o[1], 1, 1));
    add('lintel', sx - 3, sy + 18, 7, 1, false); add('lintel', sx - 3, sy + 27, 7, 1, false);
    add('hut', C[0] - 20, C[1] + 15, 4, 4);
    [[100, 1], [200, -1], [300, 1]].forEach((a, i) => {
      const ang = a[0] * Math.PI / 180 * 1.1 + i;
      const p = onLand(1200 + Math.cos(ang) * 262, 1200 + Math.sin(ang) * 262, 4, 3, Math.cos(ang) * 2, Math.sin(ang) * 2);
      add('hut', p[0], p[1], 4, 3);
      if (i === 0) POI.push({ id: 'fishers', x: p[0], y: p[1] });
    });
    add('tower', C[2] + 6, C[1] - 8, 2, 2);
    const rx = C[0], ry = C[2];
    for (let dx = -12; dx <= 12; dx++) for (let dy = -9; dy <= 9; dy++) {
      if (Math.abs(dx) !== 12 && Math.abs(dy) !== 9) continue;
      if (Math.abs(dx) <= 2 || Math.abs(dy) <= 2) continue;
      if (h(rx + dx, ry + dy, 41) > .4) add('ruinwall', rx + dx, ry + dy, 1, 1);
    }
    [[-7,-5],[7,-5],[-7,5],[7,5]].forEach(o => add('pillar', rx + o[0], ry + o[1], 1, 1));
    [[-35,-20],[28,15],[-30,22]].forEach(o => add('ruinhouse', rx + o[0], ry + o[1], 5, 4));
    const cx = C[1], cy = C[2];
    add('palisade', cx - 21, cy - 15, 19, 1); add('palisade', cx + 3, cy - 15, 19, 1);
    add('palisade', cx - 21, cy + 15, 19, 1); add('palisade', cx + 3, cy + 15, 19, 1);
    add('palisade', cx - 21, cy - 14, 1, 11); add('palisade', cx - 21, cy + 4, 1, 11);
    add('palisade', cx + 21, cy - 14, 1, 11); add('palisade', cx + 21, cy + 4, 1, 11);
    [[-23,-17],[22,-17],[-23,15],[22,15]].forEach(o => add('tower', cx + o[0], cy + o[1], 2, 2));
    add('hall', cx + 7, cy - 12, 9, 6);
    [[-17,-10],[-9,-10],[7,6],[13,6]].forEach(o => add('tent', cx + o[0], cy + o[1], 4, 3));
    add('tent', cx - 17, cy + 6, 4, 3);
    add('cage', cx - 10, cy + 8, 2, 2); add('cage', cx - 7, cy + 8, 2, 2);
    const kx = C[2], ky = C[2];
    add('shrine', kx + 5, ky - 14, 10, 6);
    [[-8,-8],[8,8],[-8,8],[8,-8]].forEach(o => add('pillar', kx + o[0], ky + o[1], 1, 1));
    for (let i = 600; i < N; i += 600) { add('tower', i, 1, 2, 2); add('tower', i, N - 3, 2, 2); add('tower', 1, i, 2, 2); add('tower', N - 3, i, 2, 2); } // Wachtürme an der Mauer
    [[-8, -12], [2, -12], [-8, 2], [2, 2]].forEach(o => add('house', 1560 + o[0], 1600 + o[1], 6, 5)); // Bergdorf (Berg 1)
    add('shrine', 1645, 1589, 10, 6); // Tempel (Berg 2)
    // Index
    S.forEach(s => {
      for (let bx2 = Math.floor(s.x / 32); bx2 <= Math.floor((s.x + s.w - 1) / 32); bx2++)
        for (let by2 = Math.floor(s.y / 32); by2 <= Math.floor((s.y + s.h - 1) / 32); by2++) {
          const k = bx2 + by2 * 100; if (!B.has(k)) B.set(k, []); B.get(k).push(s);
        }
    });
    POI.push({ id: 'village', x: vx, y: vy }, { id: 'huts', x: bx - 23, y: by - 10 }, { id: 'shrine', x: sx + 10, y: sy - 8 },
      { id: 'hermit', x: C[0] - 18, y: C[1] + 17 }, { id: 'lake', x: 1200, y: 1200 }, { id: 'lookout', x: C[2] + 7, y: C[1] - 7 },
      { id: 'falls', x: RA[0], y: RA[1] }, { id: 'ruins', x: rx, y: ry }, { id: 'camp', x: cx, y: cy }, { id: 'cave', x: kx + 10, y: ky - 11 }, { id: 'grove', x: GX, y: GY }, { id: 'garden', x: 1600, y: 800 }, { id: 'marsh', x: 800, y: 1600 }, { id: 'frost', x: 100, y: 100 }, { id: 'ember', x: 2300, y: 100 }, { id: 'dunes', x: 100, y: 2300 }, { id: 'coast', x: 2300, y: 2300 }, { id: 'karst', x: 1600, y: 1600 }, { id: 'peakvillage', x: 1560, y: 1600 }, { id: 'temple', x: 1650, y: 1595 });
  }

  // Dauerhafte Quest-Bauten. Werden aus dem Quest-Spielstand rekonstruiert.
  let questFence = false;
  function indexStructure(s) {
    for (let bx2 = Math.floor(s.x / 32); bx2 <= Math.floor((s.x + s.w - 1) / 32); bx2++)
      for (let by2 = Math.floor(s.y / 32); by2 <= Math.floor((s.y + s.h - 1) / 32); by2++) {
        const k = bx2 + by2 * 100; if (!B.has(k)) B.set(k, []); B.get(k).push(s);
      }
  }
  function buildVillageFence() {
    if (questFence) return;
    questFence = true;
    // Zwei sichtbare Zaunsegmente mit einer offenen Durchfahrt südlich des Dorfes.
    const y = C[0] + 13;
    const a = add('fence', C[0] - 25, y, 20, 1);
    const b = add('fence', C[0] + 5, y, 20, 1);
    indexStructure(a); indexStructure(b);
  }

  function structSolid(x, y) {
    const l = B.get((x >> 5) + (y >> 5) * 100);
    if (!l) return false;
    for (let i = 0; i < l.length; i++) { const s = l[i]; if (s.solid && x >= s.x && x < s.x + s.w && y >= s.y && y < s.y + s.h) return true; }
    return false;
  }
  function nearStruct(x, y, m) {
    for (let bx = Math.floor((x - m) / 32); bx <= Math.floor((x + m) / 32); bx++)
      for (let by = Math.floor((y - m) / 32); by <= Math.floor((y + m) / 32); by++) {
        const l = B.get(bx + by * 100); if (!l) continue;
        for (let i = 0; i < l.length; i++) { const s = l[i]; if (x >= s.x - m && x < s.x + s.w + m && y >= s.y - m && y < s.y + s.h + m) return true; }
      }
    return false;
  }
  const ZONES = [[C[2], C[0], 20, 20], [C[2], C[2], 52, 52], [C[0], C[0], 26, 20], [C[1], C[2], 24, 18], [C[0], C[2], 15, 12], [GX, GY, 10, 10], [1600, 800, 10, 10], [800, 1600, 10, 10], [100, 100, 10, 10], [2300, 100, 10, 10], [100, 2300, 10, 10], [2300, 2300, 10, 10], [1600, 1600, 10, 10]];
  function objAt(x, y, t) {
    if (t !== T.GRASS && t !== T.FOREST && t !== T.BAMBOO && t !== T.CAVE && t !== T.SNOW && t !== T.ASH && t !== T.DUNE) return 0;
    const reg = regionAt(x, y);
    if (reg === 16 && mtn(x, y)) return 0;
    if (h(x, y, 77) >= (t === T.CAVE ? .06 : DENS[reg])) return 0;
    for (let i = 0; i < ZONES.length; i++) { const z = ZONES[i]; if (Math.abs(x - z[0]) < z[2] && Math.abs(y - z[1]) < z[3] && t !== T.CAVE) return 0; }
    if (roadDist(x, y) < 3.5 || nearStruct(x, y, 1.5)) return 0;
    if (t === T.CAVE) return O.BOULDER;
    const r = h(x, y, 78);
    if (reg === 12) return r < .75 ? O.TREE : O.BOULDER;
    if (reg === 13 || reg === 14) return O.BOULDER;
    if (reg === 1) return O.BAMBOO;
    if (reg === 10) return r < .45 ? O.BOULDER : r < .7 ? O.PILLAR : O.TREE;
    if (reg === 5 || reg === 8) return r < .55 ? O.BOULDER : O.TREE;
    if (reg === 6) return r < .15 ? O.PILLAR : r < .35 ? O.BOULDER : O.TREE;
    return O.TREE;
  }

  // ---------- Chunk-Cache ----------
  const CS = 16, cache = new Map();
  function chunk(cx, cy) {
    const k = cx * 1000 + cy; let c = cache.get(k);
    if (c) return c;
    c = { t: new Uint8Array(256), o: new Uint8Array(256) };
    for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) {
      const x = cx * 16 + i, y = cy * 16 + j, t = terrain(x, y);
      c.t[j * 16 + i] = t; c.o[j * 16 + i] = objAt(x, y, t);
    }
    cache.set(k, c);
    if (cache.size > 220) cache.delete(cache.keys().next().value);
    return c;
  }
  function t(x, y) { if (x < 0 || y < 0 || x >= N || y >= N) return T.ROCK; return chunk(x >> 4, y >> 4).t[(y & 15) * 16 + (x & 15)]; }
  function o(x, y) { if (x < 0 || y < 0 || x >= N || y >= N) return 0; return chunk(x >> 4, y >> 4).o[(y & 15) * 16 + (x & 15)]; }
  function solid(x, y) {
    const tt = t(x, y);
    return tt === T.ROCK || tt === T.WALL || tt === T.LAVA || tt === T.WATER || tt === T.DEEP || o(x, y) !== 0 || structSolid(x, y);
  }
  build();
  return { mtn, N, T, O, PAL, S, POI, MINI, h, terrain, regionAt, t, o, solid, buildVillageFence, C, spawn: { x: C[0] + .5, y: C[0] + 3.5 } };
})();
