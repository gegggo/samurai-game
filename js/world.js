'use strict';
// Weltgenerierung: deterministisch, Chunk-Cache. Keine Kachel-Arrays für die ganze Welt.
SW.World = (function () {
  const T = { GRASS: 0, FOREST: 1, BAMBOO: 2, ROCK: 3, WATER: 4, DEEP: 5, PATH: 6, BRIDGE: 7, SAND: 8, STONE: 9, CAVE: 10, DIRT: 11, SNOW: 12, ASH: 13, LAVA: 14, DUNE: 15, STAIR: 16, WALL: 17, SEA: 18 };
  const O = { NONE: 0, TREE: 1, BAMBOO: 2, BOULDER: 3, PILLAR: 4 };
  const PAL = [[98,142,70],[58,102,58],[118,150,84],[112,108,112],[58,128,168],[34,88,134],[180,150,100],[130,92,58],[214,196,146],[150,148,150],[58,52,66],[150,122,86],[232,238,244],[74,62,60],[226,92,34],[226,190,120],[176,170,160],[160,138,110],[0,0,0]];
  // Regionen 0-8: Dorf, Bambus, Schrein, Wald, See, Gebirge, Ruinen, Banditen, Höhlen; 9-16 siehe Namen reg_N. Mitten aus dem Layout (CEN).
  const ROCKY = [2, 2, .66, 2, 2, .56, 2, 2, .58, 2, 2, 2];
  const DENS = [.05, .08, .12, .2, .03, .07, .05, .07, .05, .14, .12, .06, .07, .04, .02, .03, .05, .1, .06, .08];

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

  // ---------- Layout (Form der Welt) ----------
  // Segmente aus js/layout*.js: Rechteck, Zellgitter (0 Meer, reg+1 Land, 128+reg+1 See), Mittelpunkte, Straßen, Flüsse. Außerhalb aller Segmente ist Meer.
  const SEG = (SW.Layouts || []).map(s => {
    const g = new Uint8Array(s.w * s.h), rows = s.rows.split('|');
    for (let y = 0; y < s.h; y++) { let x = 0; rows[y].split(',').forEach(tk => { const p = tk.split('*'), n = p[1] ? +p[1] : 1; g.fill(parseInt(p[0], 36), y * s.w + x, y * s.w + x + n); x += n; }); }
    return { x0: s.x0, y0: s.y0, x1: s.x1, y1: s.y1, c: s.cell, w: s.w, g, centers: s.centers || {}, roads: s.roads || [], rivers: s.rivers || [] };
  });
  const CAMP = [600, 1500]; // 0.20.2: Banditenlager in Western Woods (vorher CEN[7])
  const CEN = []; // Regionsmitte je Region (Mirror Lake = Seemitte). Strukturen und Inhalte hängen daran.
  SEG.forEach(s => Object.keys(s.centers).forEach(k => { CEN[+k] = s.centers[k]; }));
  function code(x, y) {
    // Spaeter geladene Layout-Segmente duerfen als Region-Overlay an bestehendes Land
    // anschliessen. Leere Overlay-Zellen fallen weiterhin auf aeltere Segmente zurueck.
    for (let i = SEG.length - 1; i >= 0; i--) {
      const s = SEG[i];
      if (x >= s.x0 && x < s.x1 && y >= s.y0 && y < s.y1) { const v = s.g[(((y - s.y0) / s.c) | 0) * s.w + (((x - s.x0) / s.c) | 0)]; if (v) return v; }
    }
    return 0;
  }
  const warpX = (x, y) => x + (vn(x / 12, y / 12, 11) - .5) * 6, warpY = (x, y) => y + (vn(x / 12, y / 12, 12) - .5) * 6; // unregelmäßige Ränder
  function regionAt(x, y) { const c = code(warpX(x, y), warpY(x, y)); return c ? (c & 127) - 1 : 0; }

  // 20-Tile-Übergang an Erweiterungen: 60% neuere Region, 40% angrenzendes Altterrain.
  // 10 Tiles Suchradius auf jeder Seite ergibt zusammen einen 20 Tiles breiten Übergang.
  const MIX_DIRS = [[1,0],[-1,0],[0,1],[0,-1],[.70710678,.70710678],[.70710678,-.70710678],[-.70710678,.70710678],[-.70710678,-.70710678]];
  const MIX_STEPS = [5, 10], MIX_THRESHOLD = .539;
  function blendRegion(reg, wx, wy, x, y) {
    let neighbor = -1, nearest = 11;
    for (const d of MIX_DIRS) {
      for (const dist of MIX_STEPS) {
        const v = code(wx + d[0] * dist, wy + d[1] * dist);
        if (!v || v > 127) break; // Küsten und Seen bleiben scharf abgegrenzt.
        const other = v - 1;
        if (other !== reg) {
          if (Math.max(reg, other) >= 17 && dist < nearest) { neighbor = other; nearest = dist; }
          break;
        }
      }
    }
    if (neighbor < 0) return reg;
    const older = Math.min(reg, neighbor), newer = Math.max(reg, neighbor);
    // Geklumptes, deterministisches Rauschen statt zufälliger Einzelpixel: ca. 60% neu / 40% alt.
    return fbm(x * 1.8, y * 1.8, 200 + older * 31 + newer * 17) < MIX_THRESHOLD ? newer : older;
  }
  function terrainRegionAt(x, y) {
    const wx = warpX(x, y), wy = warpY(x, y), v = code(wx, wy);
    if (!v) return 0;
    const reg = (v & 127) - 1;
    return v > 127 ? reg : blendRegion(reg, wx, wy, x, y);
  }
  // Linien (Straßen, Flüsse): geglättet, in 64er-Felder einsortiert (Abfrage nur im eigenen Feld, Segmente 8 Kacheln überlappt)
  function chaikin(p) { const q = [p[0]]; for (let i = 0; i < p.length - 1; i++) { const a = p[i], b = p[i + 1]; q.push([a[0] * .75 + b[0] * .25, a[1] * .75 + b[1] * .25], [a[0] * .25 + b[0] * .75, a[1] * .25 + b[1] * .75]); } q.push(p[p.length - 1]); return q; }
  function lineIndex(key) {
    const m = new Map();
    SEG.forEach(s => s[key].forEach(pl => {
      const p = chaikin(chaikin(pl));
      for (let i = 0; i < p.length - 1; i++) {
        const a = p[i], b = p[i + 1], sg = [a[0], a[1], b[0], b[1]];
        for (let bx = (Math.min(a[0], b[0]) - 8) >> 6; bx <= (Math.max(a[0], b[0]) + 8) >> 6; bx++) for (let by = (Math.min(a[1], b[1]) - 8) >> 6; by <= (Math.max(a[1], b[1]) + 8) >> 6; by++) { const k = bx + by * 1000; if (!m.has(k)) m.set(k, []); m.get(k).push(sg); }
      }
    }));
    return m;
  }
  function lineDist(m, x, y) {
    const l = m.get((x >> 6) + (y >> 6) * 1000); if (!l) return 99;
    let d = 9801;
    for (let i = 0; i < l.length; i++) {
      const s = l[i], dx = s[2] - s[0], dy = s[3] - s[1], t = Math.max(0, Math.min(1, ((x - s[0]) * dx + (y - s[1]) * dy) / (dx * dx + dy * dy || 1))), ex = x - s[0] - dx * t, ey = y - s[1] - dy * t;
      d = Math.min(d, ex * ex + ey * ey);
    }
    return Math.sqrt(d);
  }
  const RI = lineIndex('roads'), VI = lineIndex('rivers');
  const roadDist = (x, y) => lineDist(RI, x, y);
  const WW = SW.CFG.W, HH = SW.CFG.H, K = CEN[16] || [0, 0], LK = CEN[4] || [0, 0]; // K = Karst Spires, LK = Seemitte

  // Karst: sechs schmale Berge, Lage relativ zur Mitte K. Plateau (p = Anteil), Treppe auf der Südseite. Dorf Berg 1 (Mitte), Tempel Berg 2 (Ost), Windturm Berg 3 (West), Wolkenturm Berg 4 (Nord), Berg 5 (Süd), Berg 6 (fern im Osten).
  const MT = [[-40, 0, 18, 34, .36], [50, 0, 22, 66, .09], [-150, 0, 20, 32, .36], [-40, -110, 22, 30, .36], [-40, 110, 22, 30, .36], [150, 0, 20, 34, .36]].map(a => ({ x: K[0] + a[0], y: K[1] + a[1], rx: a[2], ry: a[3], p: a[4] }));
  const BR = [[-39, 49, -2, -1], [-149, -41, -2, -1], [-41, -40, -109, -3], [-41, -40, 3, 109], [51, 149, -2, -1]].map(b => [K[0] + b[0], K[0] + b[1], K[1] + b[2], K[1] + b[3]]); // Brücken (x0, x1, y0, y1): Dorf-Ost, Dorf-West, Dorf-Nord, Dorf-Süd, Tempel-Ost
  function mtn(x, y) { // 0 Boden, 1 Fels, 2 Treppe, 3 Dorf-Plateau (Gras), 4 Plateau (Stein)
    for (let i = 0; i < MT.length; i++) {
      const m = MT[i], dx = x - m.x, dy = y - m.y, e = (dx / m.rx) * (dx / m.rx) + (dy / m.ry) * (dy / m.ry);
      if (e > 1.08) continue;
      if (e < m.p) return i ? 4 : 3;
      if (Math.abs(dx) < 2 && dy > 0) return 2;
      if (e < 1) return 1;
    }
    return 0;
  }
  function biome(reg, x, y, m) {
    if (reg === 16) {
      const k = mtn(x, y);
      if (k < 3 && BR.some(b => x >= b[0] && x <= b[1] && y >= b[2] && y <= b[3])) return T.BRIDGE;
      if (k) return k === 1 ? T.ROCK : k === 2 ? T.STAIR : k === 3 ? T.GRASS : T.STONE;
    }
    const d = Math.hypot(x - m[0], y - m[1]), f = fbm(x, y, 50 + reg);
    if (d < 9) return T.STONE; // Plattform um den Schrein
    if (reg === 12) return d > 22 && f > .64 ? T.ROCK : T.SNOW;
    if (reg === 13) return d > 28 && f > .7 ? T.ROCK : d > 22 && f > .62 ? T.LAVA : T.ASH;
    if (reg === 14) { const o = Math.hypot(x - m[0] - 22, y - m[1]); return o < 8 ? T.WATER : o < 11 ? T.GRASS : d > 30 && f > .75 ? T.ROCK : T.DUNE; } // Oase
    if (reg === 15) return f > .62 ? T.SAND : T.GRASS; // Sun Coast
    if (reg === 17) return f > .72 ? T.FOREST : T.GRASS; // Sakura Grove
    if (reg === 18) return Math.abs(x - m[0]) < 24 && Math.abs(y - m[1]) < 17 ? T.STONE : d > 40 && f > .68 ? T.ROCK : T.GRASS; // Verlassene Festung: Steinhof
    if (reg === 19) return d < 18 ? T.STONE : d > 42 && f > .62 ? T.ROCK : f > .58 ? T.FOREST : T.GRASS; // Phase 25: Flüsterklamm
    return T.GRASS; // 16 Karst
  }
  // Gelände einer Landkachel je Region (procedural)
  function ground(reg, x, y, rd) {
    if (reg >= 12) return biome(reg, x, y, CEN[reg]);
    const m = CEN[reg] || [x, y], dx = x - m[0], dy = y - m[1], d2 = dx * dx + dy * dy;
    if (reg >= 9) {
      if (reg === 9) return d2 < 64 ? T.STONE : T.FOREST;
      if (d2 < (reg === 10 ? 144 : 64)) return T.STONE; // Plattform um den Schrein
      if (reg === 11) { const f = fbm(x, y, 41); return d2 > 169 && f > .66 ? T.WATER : f > .6 ? T.SAND : T.GRASS; } // Tümpel mit Sandrand
      return T.GRASS;
    }
    if (reg === 2 && d2 < 196) return T.STONE;
    if (reg === 6 && Math.abs(dx) < 12 && Math.abs(dy) < 9) return T.STONE;
    if (reg === 8 && d2 < 2500) return T.CAVE;
    if (reg === 7 && Math.abs(dx) < 21 && Math.abs(dy) < 15) return T.DIRT;
    if (reg === 3 && Math.abs(x - CAMP[0]) < 21 && Math.abs(y - CAMP[1]) < 15) return T.DIRT;
    if (reg === 0 && Math.abs(dx) < 7 && Math.abs(dy) < 7) return T.DIRT;
    if (ROCKY[reg] < 1 && Math.hypot(dx, dy) > 45 && rd > 3 && fbm(x, y, 5) > ROCKY[reg]) return T.ROCK;
    if (reg === 1) return T.BAMBOO;
    if (reg === 3) return T.FOREST;
    if (reg === 7 && fbm(x, y, 8) > .6) return T.DIRT;
    return T.GRASS;
  }
  function terrain(x, y) {
    if (x < 0 || y < 0 || x >= WW || y >= HH) return T.SEA;
    const wx = warpX(x, y), wy = warpY(x, y), c = code(wx, wy);
    if (!c) return T.SEA; // Meer: schwarz, nicht betretbar
    const baseReg = (c & 127) - 1, rd = lineDist(RI, wx, wy), road = rd < 1.6;
    if (c > 127) return road ? T.BRIDGE : code(wx + 7, wy) > 127 && code(wx - 7, wy) > 127 && code(wx, wy + 7) > 127 && code(wx, wy - 7) > 127 ? T.DEEP : T.WATER; // See
    if (lineDist(VI, wx, wy) < 2.5) return road ? T.BRIDGE : T.WATER; // Fluss, Brücke wo ein Weg kreuzt
    const reg = blendRegion(baseReg, wx, wy, x, y);
    if (road && !(reg === 16 && mtn(x, y))) return T.PATH; // Karst-Berge gehen vor Wegen
    const g = ground(reg, x, y, rd);
    if (g === T.GRASS || g === T.FOREST || g === T.BAMBOO || g === T.DIRT) { // Sandsaum an Küste und Ufer
      const a = code(wx + 3, wy), b = code(wx - 3, wy), d = code(wx, wy + 3), e = code(wx, wy - 3);
      if (!a || !b || !d || !e || a > 127 || b > 127 || d > 127 || e > 127) return T.SAND;
    }
    return g;
  }

  // ---------- Strukturen ----------
  const S = [], B = new Map(), bk = (bx, by) => bx + by * 1000;
  function add(type, x, y, w, hh, solid) {
    if (type === 'tent') {
      // Das gesamte Zelt-Footprint muss auf begehbarem Land liegen; Felswände sind ausgeschlossen.
      const clear = (ax, ay) => {
        for (let yy = Math.floor(ay); yy < Math.ceil(ay + hh); yy++) {
          for (let xx = Math.floor(ax); xx < Math.ceil(ax + w); xx++) if (!land(xx, yy)) return false;
        }
        return !S.some(q => q.solid && ax < q.x + q.w && ax + w > q.x && ay < q.y + q.h && ay + hh > q.y);
      };
      if (!clear(x, y)) {
        let found = null;
        for (let r = 2; r <= 48 && !found; r += 2) for (let a = 0; a < 24 && !found; a++) {
          const ang = a / 24 * Math.PI * 2, ax = Math.round(x + Math.cos(ang) * r), ay = Math.round(y + Math.sin(ang) * r);
          if (clear(ax, ay)) found = [ax, ay];
        }
        if (found) { x = found[0]; y = found[1]; }
        else return null; // Kein gültiger Platz: Zelt überspringen, nicht in einer Felswand erzeugen.
      }
    }
    const s = { type, x, y, w, h: hh, solid: solid !== false, v: h(x, y, 9) };
    if (s.solid && w >= 4 && hh >= 3 && (type === 'house' || type === 'hall' || type === 'hut' || type === 'shrine')) { s.door = true; s.d0 = Math.floor((w - 1) / 2); s.d1 = Math.floor(w / 2); } // 0.15.0 begehbar: Wandring solid, Tür unten Mitte, Innenraum frei
    S.push(s); return s;
  }
  function land(x, y) { const t = terrain(x, y); return t !== T.WATER && t !== T.DEEP && t !== T.ROCK && t !== T.WALL && t !== T.LAVA && t !== T.BRIDGE && t !== T.SEA; }
  function onLand(x, y, w, hh, dx, dy) {
    for (let i = 0; i < 40; i++) {
      if (land(x, y) && land(x + w, y) && land(x, y + hh) && land(x + w, y + hh)) break;
      x += dx; y += dy;
    }
    return [Math.round(x), Math.round(y)];
  }
  const POI = [];
  function build() {
    const [vx, vy] = CEN[0];                       // Hinode Village
    [[-18,-11],[-10,-11],[6,-11],[13,-11],[-18,5],[-10,5],[6,5],[13,5]].forEach(o => add('house', vx + o[0], vy + o[1], 6, 5).grp = 'hinode');
    const [bx, by] = CEN[1];                       // Bamboo Forest: verlassene Hütten
    [[-25,-12],[18,8],[-30,10]].forEach(o => add('hut', bx + o[0], by + o[1], 4, 4));
    const [sx, sy] = CEN[2];                       // Mountain Shrine
    add('shrine', sx + 5, sy - 12, 10, 6);
    [[-3, 18],[3, 18],[-3, 27],[3, 27]].forEach(o => add('toriipost', sx + o[0], sy + o[1], 1, 1));
    add('lintel', sx - 3, sy + 18, 7, 1, false); add('lintel', sx - 3, sy + 27, 7, 1, false);
    add('hut', CEN[3][0] - 20, CEN[3][1] + 15, 4, 4); // Einsiedlerhütte (Western Woods)
    // Fischerhütten am See: erste bei den Fischern (Schrein/NPC), die anderen am Ufer
    const shore = a => { const co = Math.cos(a), si = Math.sin(a); let r = 0; while (r < 700 && code(LK[0] + co * r, LK[1] + si * r) > 127) r += 4; return r + 6; };
    [[100, 1], [200, -1], [300, 1]].forEach((a, i) => {
      const ang = a[0] * Math.PI / 180 * 1.1 + i, r = shore(ang);
      const p = onLand(i ? LK[0] + Math.cos(ang) * r : LK[0] - 90, i ? LK[1] + Math.sin(ang) * r : LK[1] + 246, 4, 3, Math.cos(ang) * 2, Math.sin(ang) * 2);
      add('hut', p[0], p[1], 4, 3);
      if (i === 0) POI.push({ id: 'fishers', x: p[0], y: p[1] });
    });
    add('tower', CEN[5][0] + 6, CEN[5][1] - 8, 2, 2); // Aussichtsturm (Iron Peaks)
    const [rx, ry] = CEN[6];                       // Forgotten Ruins
    for (let dx = -12; dx <= 12; dx++) for (let dy = -9; dy <= 9; dy++) {
      if (Math.abs(dx) !== 12 && Math.abs(dy) !== 9) continue;
      if (Math.abs(dx) <= 2 || Math.abs(dy) <= 2) continue;
      if (h(rx + dx, ry + dy, 41) > .4) add('ruinwall', rx + dx, ry + dy, 1, 1);
    }
    [[-7,-5],[7,-5],[-7,5],[7,5]].forEach(o => add('pillar', rx + o[0], ry + o[1], 1, 1));
    [[-35,-20],[28,15],[-30,22]].forEach(o => add('ruinhouse', rx + o[0], ry + o[1], 5, 4));
    const [cx, cy] = CAMP;                         // Bandit Camp (Western Woods)
    add('palisade', cx - 21, cy - 15, 19, 1); add('palisade', cx + 3, cy - 15, 19, 1);
    add('palisade', cx - 21, cy + 15, 19, 1); add('palisade', cx + 3, cy + 15, 19, 1);
    add('palisade', cx - 21, cy - 14, 1, 11); add('palisade', cx - 21, cy + 4, 1, 11);
    add('palisade', cx + 21, cy - 14, 1, 11); add('palisade', cx + 21, cy + 4, 1, 11);
    [[-23,-17],[22,-17],[-23,15],[22,15]].forEach(o => add('tower', cx + o[0], cy + o[1], 2, 2));
    add('hall', cx + 7, cy - 12, 9, 6);
    [[-17,-10],[-9,-10],[7,6],[13,6]].forEach(o => add('tent', cx + o[0], cy + o[1], 4, 3));
    add('tent', cx - 17, cy + 6, 4, 3);
    add('cage', cx - 10, cy + 8, 2, 2); add('cage', cx - 7, cy + 8, 2, 2);
    const [kx, ky] = CEN[8];                       // Hollow Caves: Höhlentempel
    add('shrine', kx + 5, ky - 14, 10, 6);
    [[-8,-8],[8,8],[-8,8],[8,-8]].forEach(o => add('pillar', kx + o[0], ky + o[1], 1, 1));
    [[-8, -12], [2, -12], [-8, 2], [2, 2]].forEach(o => add('house', K[0] - 40 + o[0], K[1] + o[1], 6, 5).grp = 'peak'); // Bergdorf (Berg 1)
    add('shrine', K[0] + 45, K[1] - 11, 10, 6); // Tempel (Berg 2)
    add('shrine', K[0] - 155, K[1] - 10, 10, 6); // Windturm-Schrein (Berg 3)
    add('tower', K[0] - 46, K[1] - 124, 2, 2); add('hut', K[0] - 34, K[1] - 122, 4, 4); // Wolkenturm (Berg 4)
    add('tower', K[0] - 41, K[1] + 105, 2, 2); add('tower', K[0] + 149, K[1] - 3, 2, 2); // Berg 5 (Süd), Berg 6 (fern im Osten)
    if (CEN[17]) { const [ax, ay] = CEN[17]; add('shrine', ax + 5, ay - 12, 10, 6); add('hut', ax - 26, ay + 10, 4, 4).grp = 'sakura'; add('hut', ax + 30, ay + 14, 4, 4).grp = 'sakura'; } // Sakura Grove: Schrein, Gärtnerhütte, Rasthütte
    { // 0.17.0 Phase 16: Sakura-Stadt (Edo-Stil), Hauptstraße West-Ost, 2 Hausreihen + Kaufmannshalle. Gruppe sakuratown (village.js nutzt Gruppen-IDs, kein Index).
      for (let i = 0; i < 6; i++) { add('house', 4100 + 14 * i, 1478, 6, 5).grp = 'sakuratown'; add('house', 4107 + 14 * i, 1504, 6, 5).grp = 'sakuratown'; }
      add('hall', 4192, 1476, 12, 7);
    }
    if (CEN[19]) { // Phase 25: Pilot-Region – Lager und Dungeon
      const [mx,my]=CEN[19], cx=mx-150, cy=my+70, dx=mx+145, dy=my-55;
      add('palisade',cx-22,cy-15,19,1); add('palisade',cx+4,cy-15,19,1); add('palisade',cx-22,cy+15,19,1); add('palisade',cx+4,cy+15,19,1);
      add('palisade',cx-22,cy-14,1,11); add('palisade',cx+22,cy-14,1,11);
      [[-24,-17],[23,-17],[-24,15],[23,15]].forEach(o=>add('tower',cx+o[0],cy+o[1],2,2));
      add('hall',cx+6,cy-11,10,6); [[-15,-9],[-7,-9],[8,6]].forEach(o=>add('tent',cx+o[0],cy+o[1],4,3)); add('cage',cx-7,cy+8,2,2);
      for(let ox=-20;ox<=20;ox++) for(let oy=-14;oy<=14;oy++) if((Math.abs(ox)===20||Math.abs(oy)===14)&&!(oy===14&&Math.abs(ox)<=3)) add('ruinwall',dx+ox,dy+oy,1,1);
      [[-13,-9],[13,-9],[-13,9],[13,9]].forEach(o=>add('pillar',dx+o[0],dy+o[1],1,1));
    }
    if (CEN[18]) { // 0.16.0 Phase 14: Verlassene Festung (Region 18): Ruinenmauer mit Südtor und Lücken, 4 Türme, Bergfried (begehbar). Kein 'hut'/'house' hier (village.js zählt Hütten/Häuser per Index).
      const [fx, fy] = CEN[18];
      for (let dx = -24; dx <= 24; dx++) for (let dy = -17; dy <= 17; dy++) {
        if (Math.abs(dx) !== 24 && Math.abs(dy) !== 17) continue;
        if (dy === 17 && Math.abs(dx) <= 3) continue; // Südtor
        if (h(fx + dx, fy + dy, 61) > .3) add('ruinwall', fx + dx, fy + dy, 1, 1);
      }
      [[-27, -20], [26, -20], [-27, 18], [26, 18]].forEach(o => add('tower', fx + o[0], fy + o[1], 2, 2));
      add('hall', fx - 7, fy - 14, 14, 8); [[-14, 4], [14, 4], [-14, -4], [14, -4]].forEach(o => add('pillar', fx + o[0], fy + o[1], 1, 1));
    }
    { const [gx, gy] = CEN[10]; add('hall', gx - 9, gy - 19, 14, 8); [[-6, -1], [-2, -1], [6, -1]].forEach(o => add('dummy', gx + o[0], gy + o[1], 1, 1)); } // 0.14.0 Meistertempel + Trainingsplatz (Steingarten)
    // Index
    S.forEach(indexStructure);
    const fl = SEG[0] && SEG[0].rivers[1] ? SEG[0].rivers[1][0] : LK; // Wasserfall: Quelle des Ostflusses
    POI.push({ id: 'village', x: vx, y: vy }, { id: 'huts', x: bx - 23, y: by - 10 }, { id: 'shrine', x: sx + 10, y: sy - 8 },
      { id: 'hermit', x: CEN[3][0] - 18, y: CEN[3][1] + 17 }, { id: 'lake', x: LK[0], y: LK[1] }, { id: 'lookout', x: CEN[5][0] + 7, y: CEN[5][1] - 7 },
      { id: 'falls', x: fl[0], y: fl[1] }, { id: 'ruins', x: rx, y: ry }, { id: 'camp', x: cx, y: cy }, { id: 'cave', x: kx + 10, y: ky - 11 },
      { id: 'grove', x: CEN[9][0], y: CEN[9][1] }, { id: 'garden', x: CEN[10][0], y: CEN[10][1] }, { id: 'marsh', x: CEN[11][0], y: CEN[11][1] },
      { id: 'frost', x: CEN[12][0], y: CEN[12][1] }, { id: 'ember', x: CEN[13][0], y: CEN[13][1] }, { id: 'dunes', x: CEN[14][0], y: CEN[14][1] }, { id: 'coast', x: CEN[15][0], y: CEN[15][1] },
      { id: 'karst', x: K[0], y: K[1] }, { id: 'peakvillage', x: K[0] - 40, y: K[1] }, { id: 'temple', x: K[0] + 50, y: K[1] - 5 }, { id: 'windspire', x: K[0] - 150, y: K[1] }, { id: 'cloudspire', x: K[0] - 40, y: K[1] - 110 });
    if (CEN[17]) POI.push({ id: 'sakura', x: CEN[17][0], y: CEN[17][1] }, { id: 'sakuratown', x: 4170, y: 1491 });
    if (CEN[19]) POI.push({ id: 'mist', x: CEN[19][0], y: CEN[19][1] }, { id: 'pilotcamp', x: CEN[19][0]-150, y: CEN[19][1]+70 }, { id: 'pilotdungeon', x: CEN[19][0]+145, y: CEN[19][1]-55 });
    if (CEN[18]) POI.push({ id: 'fortress', x: CEN[18][0], y: CEN[18][1] });
  }

  // Dauerhafte Quest-Bauten. Werden aus dem Quest-Spielstand rekonstruiert.
  let questFence = false;
  function indexStructure(s) {
    for (let bx2 = Math.floor(s.x / 32); bx2 <= Math.floor((s.x + s.w - 1) / 32); bx2++)
      for (let by2 = Math.floor(s.y / 32); by2 <= Math.floor((s.y + s.h - 1) / 32); by2++) {
        const k = bk(bx2, by2); if (!B.has(k)) B.set(k, []); B.get(k).push(s);
      }
  }
  function buildVillageFence() {
    if (questFence) return;
    questFence = true;
    // Zwei sichtbare Zaunsegmente mit einer offenen Durchfahrt südlich des Dorfes.
    const y = CEN[0][1] + 13;
    const a = add('fence', CEN[0][0] - 25, y, 20, 1);
    const b = add('fence', CEN[0][0] + 5, y, 20, 1);
    indexStructure(a); indexStructure(b);
  }

  function structSolid(x, y) {
    const l = B.get(bk(x >> 5, y >> 5));
    if (!l) return false;
    for (let i = 0; i < l.length; i++) { const s = l[i]; if (s.solid && x >= s.x && x < s.x + s.w && y >= s.y && y < s.y + s.h) {
      if (!s.door) return true;
      const dx = x - s.x, dy = y - s.y;
      if ((dx === 0 || dy === 0 || dx === s.w - 1 || dy === s.h - 1) && !(dy === s.h - 1 && dx >= s.d0 && dx <= s.d1)) return true;
    } }
    return false;
  }
  function nearStruct(x, y, m) {
    for (let bx = Math.floor((x - m) / 32); bx <= Math.floor((x + m) / 32); bx++)
      for (let by = Math.floor((y - m) / 32); by <= Math.floor((y + m) / 32); by++) {
        const l = B.get(bk(bx, by)); if (!l) continue;
        for (let i = 0; i < l.length; i++) { const s = l[i]; if (x >= s.x - m && x < s.x + s.w + m && y >= s.y - m && y < s.y + s.h + m) return true; }
      }
    return false;
  }
  // Keine Objekte (Bäume, Felsen) rund um Orte: [Mitte x, Mitte y, Halbbreite, Halbhöhe]
  const ZONES = [[CEN[2][0], CEN[2][1], 20, 20], [CEN[8][0], CEN[8][1], 52, 52], [CEN[0][0], CEN[0][1], 26, 20], [CAMP[0], CAMP[1], 24, 18], [CEN[6][0], CEN[6][1], 15, 12]];
  for (let r = 9; r <= 19; r++) if (CEN[r]) ZONES.push([CEN[r][0], CEN[r][1], 10, 10]);
  if (CEN[17]) ZONES.push([4170, 1491, 80, 40]); // Sakura-Stadt: keine Bäume
  function objAt(x, y, t) {
    if (t !== T.GRASS && t !== T.FOREST && t !== T.BAMBOO && t !== T.CAVE && t !== T.SNOW && t !== T.ASH && t !== T.DUNE) return 0;
    const reg = terrainRegionAt(x, y);
    if (reg === 16 && mtn(x, y)) return 0;
    // Bambus-Teleportpunkt und Hauptweg zum Dorf freihalten; Bambus bleibt zusätzlich durchquerbar.
    if (reg === 1 && (Math.hypot(x - CEN[1][0], y - CEN[1][1]) < 30 || roadDist(x, y) < 7.5)) return 0;
    if (h(x, y, 77) >= (t === T.CAVE ? .06 : DENS[reg] === undefined ? .05 : DENS[reg])) return 0;
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
    const k = cx * 8192 + cy; let c = cache.get(k);
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
  function t(x, y) { if (x < 0 || y < 0 || x >= WW || y >= HH) return T.SEA; return chunk(x >> 4, y >> 4).t[(y & 15) * 16 + (x & 15)]; }
  function o(x, y) { if (x < 0 || y < 0 || x >= WW || y >= HH) return 0; return chunk(x >> 4, y >> 4).o[(y & 15) * 16 + (x & 15)]; }
  function solid(x, y) {
    const tt = t(x, y);
    return tt === T.ROCK || tt === T.WALL || tt === T.LAVA || tt === T.WATER || tt === T.DEEP || tt === T.SEA || (o(x, y) !== 0 && o(x, y) !== O.BAMBOO) || structSolid(x, y);
  }
  build();
  return { mtn, WIDTH: WW, HEIGHT: HH, T, O, PAL, S, POI, CEN, h, terrain, regionAt, terrainRegionAt, t, o, solid, buildVillageFence, spawn: { x: CEN[0][0] + .5, y: CEN[0][1] + 3.5 } };
})();
