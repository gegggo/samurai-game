'use strict';
// Rendering: stilisierte schräge Draufsicht (Canvas 2D). Nur sichtbare Kacheln/Objekte.
SW.Render = (function () {
  const W = SW.World, T = W.T, O = W.O, TAU = 6.2832;
  const R = { tile: 40 };
  let shades = null, vign = null, vw = 0, vh = 0;

  function mkShades() {
    shades = W.PAL.map(c => { const a = []; for (let i = 0; i < 8; i++) { const k = .9 + i * .026; a.push('rgb(' + (c[0] * k | 0) + ',' + (c[1] * k | 0) + ',' + (c[2] * k | 0) + ')'); } return a; });
  }
  function shadow(c, x, y, rx, ry) { c.fillStyle = 'rgba(0,0,0,.22)'; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.fill(); }
  function poly(c, pts, bx, by, u) { c.beginPath(); c.moveTo(bx + pts[0][0] * u, by + pts[0][1] * u); for (let i = 1; i < pts.length; i++) c.lineTo(bx + pts[i][0] * u, by + pts[i][1] * u); c.closePath(); c.fill(); }

  // ---------- Terrain ----------
  function drawTerrain(c, x0, x1, y0, y1, ox, oy, u, time) {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const t = W.t(x, y), v = W.h(x, y, 3), px = x * u + ox, py = y * u + oy;
      c.fillStyle = shades[t][(v * 8) | 0]; c.fillRect(px, py, u + 1, u + 1);
      if (t <= T.BAMBOO || t === T.DIRT) {
        const r = W.h(x, y, 4);
        if (r < .4) {
          c.strokeStyle = 'rgba(255,255,255,.13)'; c.lineWidth = Math.max(1, u * .04); c.beginPath();
          c.moveTo(px + r * u * 2, py + u * .6); c.lineTo(px + r * u * 2 - u * .05, py + u * .4);
          c.moveTo(px + u * .6, py + u * .8); c.lineTo(px + u * .65, py + u * .6); c.stroke();
        }
        if (t === T.GRASS && W.h(x, y, 6) < .03) { c.fillStyle = W.h(x, y, 7) < .5 ? '#f2b8c6' : '#f1de7a'; c.beginPath(); c.arc(px + u * .5, py + u * .5, u * .06, 0, TAU); c.fill(); }
      } else if (t === T.WATER || t === T.DEEP || t === T.LAVA) {
        if (W.h(x, y, 7) < .3) {
          c.strokeStyle = 'rgba(255,255,255,.22)'; c.lineWidth = Math.max(1, u * .05); c.beginPath();
          const s = Math.sin(time * 1.4 + v * 6) * u * .12;
          c.moveTo(px + u * .2 + s, py + u * .5); c.lineTo(px + u * .6 + s, py + u * .5); c.stroke();
        }
      } else if (t === T.ROCK) {
        if (W.t(x, y + 1) !== T.ROCK) { c.fillStyle = 'rgba(20,20,30,.38)'; c.fillRect(px, py + u * .62, u + 1, u * .38 + 1); }
        else if (W.h(x, y, 5) < .3) { c.fillStyle = 'rgba(255,255,255,.09)'; c.fillRect(px + u * .15, py + u * .2, u * .4, u * .12); }
        // Berg-Details: Licht links/oben, Schatten rechts, Risse
        if (W.t(x - 1, y) !== T.ROCK) { c.fillStyle = 'rgba(255,255,255,.16)'; c.fillRect(px, py, u * .14, u + 1); }
        if (W.t(x + 1, y) !== T.ROCK) { c.fillStyle = 'rgba(20,20,30,.28)'; c.fillRect(px + u * .86, py, u * .14 + 1, u + 1); }
        if (W.t(x, y - 1) !== T.ROCK) { c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(px, py, u + 1, u * .12); }
        if (W.h(x, y, 6) > .82) { c.strokeStyle = 'rgba(30,30,40,.4)'; c.lineWidth = Math.max(1, u * .05); c.beginPath(); c.moveTo(px + u * .3, py + u * .15); c.lineTo(px + u * .5, py + u * .5); c.lineTo(px + u * .4, py + u * .85); c.stroke(); }
      } else if (t === T.STAIR) {
        c.strokeStyle = 'rgba(40,36,30,.5)'; c.lineWidth = Math.max(1, u * .05); c.beginPath();
        for (let i = 1; i < 4; i++) { c.moveTo(px, py + u * i / 4); c.lineTo(px + u, py + u * i / 4); } c.stroke();
      } else if (t === T.WALL) {
        c.strokeStyle = 'rgba(50,35,25,.5)'; c.lineWidth = Math.max(1, u * .04); c.beginPath();
        c.moveTo(px, py + u * .5); c.lineTo(px + u, py + u * .5); c.moveTo(px + u * (y & 1 ? .3 : .7), py); c.lineTo(px + u * (y & 1 ? .3 : .7), py + u * .5); c.stroke();
        if (W.t(x, y + 1) !== T.WALL) { c.fillStyle = 'rgba(20,14,10,.4)'; c.fillRect(px, py + u * .62, u + 1, u * .38 + 1); }
      } else if (t === T.BRIDGE) {
        c.strokeStyle = 'rgba(40,25,10,.55)'; c.lineWidth = Math.max(1, u * .05); c.beginPath();
        for (let i = 1; i < 4; i++) { c.moveTo(px, py + u * i / 4); c.lineTo(px + u, py + u * i / 4); } c.stroke();
      } else if (t === T.STONE || t === T.CAVE) {
        c.strokeStyle = 'rgba(0,0,0,.22)'; c.lineWidth = 1; c.strokeRect(px + .5, py + .5, u, u);
      } else if (t === T.PATH && W.h(x, y, 4) < .25) {
        c.fillStyle = 'rgba(90,70,40,.35)'; c.beginPath(); c.arc(px + u * W.h(x, y, 8), py + u * .6, u * .05, 0, TAU); c.fill();
      }
    }
  }

  // ---------- Objekte ----------
  function tree(c, bx, by, u, v, sn, pk) {
    const s = .85 + v * .45, maple = v > .9;
    shadow(c, bx + u * .18, by, u * .42 * s, u * .14 * s);
    c.fillStyle = '#4a3424'; c.fillRect(bx - u * .07 * s, by - u * .45 * s, u * .14 * s, u * .45 * s);
    const g = sn ? ['#3f5f58', '#6a8c86', '#e4eef2'] : pk ? ['#b8607e', '#e48eaa', '#f8c8d8'] : maple ? ['#8f3a2a', '#b04a2c', '#d0653a'] : ['#2f6b3a', '#3a8244', '#4b9a52'];
    for (let i = 0; i < 3; i++) {
      const w = (.62 - i * .14) * u * s, top = by - u * (1.05 + i * .5) * s, bot = by - u * (.35 + i * .5) * s;
      c.fillStyle = g[i]; c.beginPath(); c.moveTo(bx, top); c.lineTo(bx + w, bot); c.lineTo(bx - w, bot); c.closePath(); c.fill();
    }
  }
  function bamboo(c, bx, by, u, v) {
    shadow(c, bx + u * .15, by, u * .35, u * .1);
    for (let i = 0; i < 3; i++) {
      const f = (v * 7 + i * .37) % 1, ox = (i - 1) * .22 * u + (v - .5) * .1 * u, hg = (2.2 + f) * u, lean = (i - 1) * .04 * u;
      c.strokeStyle = i === 1 ? '#6fae4b' : '#5f9b43'; c.lineWidth = Math.max(2, u * .09); c.beginPath(); c.moveTo(bx + ox, by); c.lineTo(bx + ox + lean, by - hg); c.stroke();
      c.strokeStyle = '#3f6f2c'; c.lineWidth = Math.max(1, u * .03); c.beginPath();
      for (let k = 1; k * .55 * u < hg; k++) { const yy = by - k * .55 * u, xx = bx + ox + lean * (k * .55 * u / hg); c.moveTo(xx - u * .06, yy); c.lineTo(xx + u * .06, yy); } c.stroke();
      c.fillStyle = '#8cc75a'; c.beginPath(); c.ellipse(bx + ox + lean + u * .14, by - hg + u * .1, u * .2, u * .06, -.5, 0, TAU); c.ellipse(bx + ox + lean - u * .14, by - hg + u * .3, u * .2, u * .06, .5, 0, TAU); c.fill();
    }
  }
  function boulder(c, bx, by, u, v) {
    const s = (.8 + v * .5) * u; shadow(c, bx + u * .15, by, u * .45 * (s / u), u * .13);
    c.fillStyle = '#6f737b'; poly(c, [[-.42,0],[-.5,-.35],[-.2,-.7],[.25,-.72],[.5,-.38],[.42,0]], bx, by, s);
    c.fillStyle = '#9a9ea6'; poly(c, [[-.2,-.7],[.25,-.72],[.1,-.4],[-.3,-.35]], bx, by, s);
  }
  function pillar(c, bx, by, u, v) {
    const hg = (.9 + v * .6) * u; shadow(c, bx + u * .15, by, u * .3, u * .1);
    c.fillStyle = '#8f8a7e'; c.fillRect(bx - u * .22, by - hg, u * .44, hg);
    c.fillStyle = '#6d695f'; c.fillRect(bx + u * .05, by - hg, u * .17, hg);
    c.fillStyle = '#a9a496'; poly(c, [[-.22,0],[-.22,0],[-.1,-.12],[.05,0],[.22,-.1],[.22,0]], bx, by - hg, u);
  }

  // ---------- Strukturen ----------
  const PALS = {
    house: ['#d9c9a6', '#3c4c5e', '#5a3b2a'], hall: ['#bfa57a', '#7a2e2a', '#4a2a1e'],
    hut: ['#8a6b46', '#a58b4a', '#4a3220'], tower: ['#6b4a30', '#454a58', '#3a2818'], shrine: ['#efe6d0', '#2f3340', '#b5352b']
  };
  function building(c, s, sx, sy, u) {
    const P = PALS[s.type], w = s.w * u, hh = s.h * u, bot = sy + hh, wallH = Math.min(1.5, s.h * .45) * u;
    c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(sx + u * .3, bot - u * .15, w, u * .35);
    c.fillStyle = P[0]; c.fillRect(sx + u * .1, bot - wallH, w - u * .2, wallH);
    c.fillStyle = P[2];
    for (let i = 0; i <= s.w; i++) if (i === 0 || i === s.w || s.type !== 'tower') c.fillRect(sx + u * .1 + (w - u * .2) * i / s.w - u * .04, bot - wallH, u * .08, wallH);
    c.fillRect(sx + w / 2 - u * .3, bot - wallH * .75, u * .6, wallH * .75);
    c.fillStyle = 'rgba(0,0,0,.28)'; c.fillRect(sx + w / 2 - u * .24, bot - wallH * .7, u * .48, wallH * .7);
    const eave = bot - wallH + u * .12, ridge = sy - u * .25, ins = Math.min(w * .22, u * 1.2);
    c.fillStyle = P[1]; c.beginPath(); c.moveTo(sx - u * .3, eave); c.lineTo(sx + w + u * .3, eave); c.lineTo(sx + w - ins, ridge); c.lineTo(sx + ins, ridge); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,.12)'; c.beginPath(); c.moveTo(sx + ins, ridge); c.lineTo(sx + w - ins, ridge); c.lineTo(sx + w - ins - u * .1, ridge + (eave - ridge) * .35); c.lineTo(sx + ins + u * .1, ridge + (eave - ridge) * .35); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = Math.max(1, u * .04); c.beginPath();
    for (let i = 1; i < 4; i++) { const yy = ridge + (eave - ridge) * i / 4, k = i / 4; c.moveTo(sx + ins - (ins + u * .3) * k, yy); c.lineTo(sx + w - ins + (ins + u * .3) * k, yy); } c.stroke();
    if (s.dmg) { // beschädigtes Dorfhaus (5c): Loch im Dach, Trümmer
      const mx = sx + w * .62, my = ridge + (eave - ridge) * .55;
      c.fillStyle = 'rgba(20,12,8,.85)'; c.beginPath(); c.moveTo(mx - u * .55, my - u * .25); c.lineTo(mx + u * .2, my - u * .4); c.lineTo(mx + u * .6, my + u * .1); c.lineTo(mx - u * .1, my + u * .35); c.closePath(); c.fill();
      c.fillStyle = '#5a3b2a'; c.fillRect(mx - u * .4, my - u * .1, u * .7, u * .07);
      c.fillStyle = '#6a4a2c'; c.fillRect(sx + u * .2, bot - u * .12, u * .7, u * .1); c.fillRect(sx + w - u * 1.1, bot - u * .2, u * .6, u * .09);
    }
    if (s.type === 'shrine') {
      c.fillStyle = P[2];
      for (let i = 0; i <= s.w; i += 2) c.fillRect(sx + u * .1 + (w - u * .2) * i / s.w - u * .1, bot - wallH, u * .2, wallH);
    }
  }
  function tent(c, s, sx, sy, u) {
    const w = s.w * u, bot = sy + s.h * u;
    shadow(c, sx + w / 2 + u * .3, bot, w * .5, u * .25);
    c.fillStyle = s.v < .5 ? '#a9442f' : '#c8b88a'; c.beginPath(); c.moveTo(sx, bot); c.lineTo(sx + w, bot); c.lineTo(sx + w / 2, bot - u * 2); c.closePath(); c.fill();
    c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.moveTo(sx + w / 2, bot - u * 2); c.lineTo(sx + w, bot); c.lineTo(sx + w / 2, bot); c.closePath(); c.fill();
    c.fillStyle = '#2a1e16'; c.beginPath(); c.moveTo(sx + w / 2 - u * .35, bot); c.lineTo(sx + w / 2 + u * .35, bot); c.lineTo(sx + w / 2, bot - u * .9); c.closePath(); c.fill();
  }
  function palisade(c, s, sx, sy, u) {
    const horiz = s.w >= s.h, n = (horiz ? s.w : s.h) * 2;
    for (let i = 0; i < n; i++) {
      const x = horiz ? sx + i * u * .5 : sx + u * .3, yb = horiz ? sy + u * .9 : sy + (i + 1) * u * .5;
      c.fillStyle = i % 2 ? '#6a4a2c' : '#7a5632'; c.fillRect(x, yb - u * 1.7, u * .4, u * 1.7);
      c.beginPath(); c.moveTo(x, yb - u * 1.7); c.lineTo(x + u * .2, yb - u * 2.0); c.lineTo(x + u * .4, yb - u * 1.7); c.fill();
    }
  }
  function toriiPost(c, s, sx, sy, u) { shadow(c, sx + u * .6, sy + u, u * .4, u * .12); c.fillStyle = '#b5352b'; c.fillRect(sx + u * .25, sy + u - u * 2.9, u * .5, u * 2.9); c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(sx + u * .55, sy + u - u * 2.9, u * .2, u * 2.9); }
  function lintel(c, s, sx, sy, u) {
    const w = s.w * u, y = sy + u - u * 2.85;
    c.fillStyle = '#b5352b'; c.fillRect(sx + u * .25, y + u * .5, w - u * .5, u * .22);
    c.fillStyle = '#1e1b22'; c.beginPath(); c.moveTo(sx - u * .3, y + u * .1); c.lineTo(sx + u * .2, y - u * .1); c.lineTo(sx + w - u * .2, y - u * .1); c.lineTo(sx + w + u * .3, y + u * .1); c.lineTo(sx + w + u * .2, y + u * .4); c.lineTo(sx - u * .2, y + u * .4); c.closePath(); c.fill();
  }
  function ruinwall(c, s, sx, sy, u) { const hg = (.35 + s.v * .6) * u; shadow(c, sx + u * .6, sy + u, u * .5, u * .12); c.fillStyle = '#8a857a'; c.fillRect(sx + u * .05, sy + u - hg, u * .9, hg); c.fillStyle = '#6d695f'; c.fillRect(sx + u * .05, sy + u - hg * .3, u * .9, hg * .3); c.fillStyle = '#a39e92'; c.fillRect(sx + u * .05, sy + u - hg, u * .9, u * .1); }
  function ruinhouse(c, s, sx, sy, u) {
    const w = s.w * u, hh = s.h * u; c.strokeStyle = '#7d786d'; c.lineWidth = u * .35; c.lineCap = 'butt';
    c.beginPath(); c.moveTo(sx, sy + hh); c.lineTo(sx, sy + hh * .3); c.moveTo(sx, sy + hh); c.lineTo(sx + w * .55, sy + hh); c.moveTo(sx + w, sy + hh); c.lineTo(sx + w, sy + hh * .6); c.moveTo(sx + w * .15, sy + hh * .1); c.lineTo(sx + w * .6, sy + hh * .1); c.stroke();
    c.fillStyle = 'rgba(70,65,60,.35)'; c.fillRect(sx + u * .3, sy + u * .6, w - u * .6, hh - u * 1.0);
  }
  function cage(c, s, sx, sy, u) {
    const w = s.w * u, hh = s.h * u; shadow(c, sx + w / 2 + u * .2, sy + hh, w * .5, u * .2);
    c.fillStyle = 'rgba(30,20,10,.45)'; c.fillRect(sx, sy + hh - u * 1.4, w, u * 1.4);
    c.strokeStyle = '#6a4a2c'; c.lineWidth = u * .08; c.beginPath();
    for (let i = 0; i <= 6; i++) { const x = sx + w * i / 6; c.moveTo(x, sy + hh - u * 1.4); c.lineTo(x, sy + hh); } c.stroke();
    c.fillStyle = '#6a4a2c'; c.fillRect(sx - u * .05, sy + hh - u * 1.5, w + u * .1, u * .15);
  }
  function fence(c, s, sx, sy, u) {
    const x = sx, y = sy - u * .55, w = s.w * u;
    c.fillStyle = '#4a2e1d'; c.fillRect(x, y, w, u * .16);
    c.fillStyle = '#8b6038'; c.fillRect(x, y - u * .28, w, u * .12);
    for (let i = 0; i <= s.w; i += 2) {
      c.fillStyle = '#684329'; c.fillRect(x + i * u - u * .07, y - u * .38, u * .14, u * .65);
      c.fillStyle = '#a87949'; c.fillRect(x + i * u - u * .04, y - u * .36, u * .05, u * .58);
    }
  }
  function dummy(c, s, sx, sy, u) { // Trainingspuppe (Platzhalter bis Phase 29)
    const x = sx + u / 2 + (s.fl > 0 ? Math.sin(s.fl * 60) * u * .06 : 0), b = sy + u * .9;
    shadow(c, x, b, u * .4, u * .1);
    c.fillStyle = '#6a4a2c'; c.fillRect(x - u * .07, b - u * 1.5, u * .14, u * 1.5); c.fillRect(x - u * .4, b - u * 1.15, u * .8, u * .12);
    c.fillStyle = s.fl > 0 ? '#f2dd9a' : '#c8b070'; c.fillRect(x - u * .24, b - u * 1.3, u * .48, u * .75);
    c.beginPath(); c.arc(x, b - u * 1.55, u * .2, 0, 6.3); c.fill();
    c.fillStyle = '#a9442f'; c.fillRect(x - u * .24, b - u * .85, u * .48, u * .1);
  }
  function interior(c, s, sx, sy, u) { // 0.15.0 Spieler im Haus: Dach/Fassade weg, Boden + Wandring (Platzhalter bis Phase 29)
    const P = PALS[s.type], w = s.w * u, hh = s.h * u;
    c.fillStyle = '#7a5c3c'; c.fillRect(sx, sy, w, hh);
    c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = Math.max(1, u * .03); c.beginPath();
    for (let i = 1; i < s.w; i++) { c.moveTo(sx + i * u, sy); c.lineTo(sx + i * u, sy + hh); } c.stroke();
    c.fillStyle = P[2]; c.fillRect(sx, sy, w, u); c.fillRect(sx, sy, u, hh); c.fillRect(sx + w - u, sy, u, hh);
    const d0 = (s.d0) * u, d1 = (s.d1 + 1) * u;
    c.fillRect(sx, sy + hh - u, d0, u); c.fillRect(sx + d1, sy + hh - u, w - d1, u);
    c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(sx + u, sy + u, w - 2 * u, u * .25);
  }
  function drawStruct(c, s, ox, oy, u) {
    const sx = s.x * u + ox, sy = s.y * u + oy;
    switch (s.type) {
      case 'house': case 'hall': case 'hut': case 'tower': case 'shrine': if (s.in) interior(c, s, sx, sy, u); else building(c, s, sx, sy, u); break;
      case 'tent': tent(c, s, sx, sy, u); break;
      case 'palisade': palisade(c, s, sx, sy, u); break;
      case 'fence': fence(c, s, sx, sy, u); break;
      case 'toriipost': toriiPost(c, s, sx, sy, u); break;
      case 'lintel': lintel(c, s, sx, sy, u); break;
      case 'ruinwall': ruinwall(c, s, sx, sy, u); break;
      case 'ruinhouse': ruinhouse(c, s, sx, sy, u); break;
      case 'cage': cage(c, s, sx, sy, u); break;
      case 'pillar': pillar(c, sx + u / 2, sy + u * .85, u, s.v); break;
      case 'dummy': dummy(c, s, sx, sy, u); break;
    }
  }

  // ---------- Truhen (Phase 4) ----------
  function chest(c, s, sx, sy, u, time) {
    const rc = SW.Data.rarityCol[s.rar] || '#b9b2a2', w = u * .72, h = u * .4, x = sx - w / 2, y = sy - h;
    shadow(c, sx, sy, u * .4, u * .1);
    if (!s.open && s.rar !== 'common') { c.save(); c.globalAlpha = .25 + .15 * Math.sin(time * 3 + s.x); c.fillStyle = rc; c.beginPath(); c.ellipse(sx, sy - h * .5, u * .6, u * .45, 0, 0, TAU); c.fill(); c.restore(); }
    c.fillStyle = s.open ? '#4a3626' : '#7a5230'; c.fillRect(x, y, w, h);
    c.fillStyle = rc; c.fillRect(x, y + h * .42, w, h * .12); c.fillRect(x + w * .1, y, w * .08, h); c.fillRect(x + w * .82, y, w * .08, h);
    if (s.open) { c.fillStyle = '#1c130c'; c.fillRect(x + w * .06, y - h * .05, w * .88, h * .22); c.fillStyle = '#5a3d24'; c.fillRect(x, y - h * .55, w, h * .22); }
    else { c.fillStyle = '#8c6038'; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(sx, y - h * .85, x + w, y); c.closePath(); c.fill(); c.fillStyle = rc; c.fillRect(sx - w * .06, y + h * .1, w * .12, h * .22); }
  }

  // ---------- Schreine und Nachtlicht (Phase 5a) ----------
  function shrineObj(c, s, sx, sy, u, time) {
    const on = SW.Shrines.isOn(s.id);
    shadow(c, sx, sy, u * .55, u * .14);
    c.fillStyle = '#6e6a64'; c.fillRect(sx - u * .42, sy - u * .16, u * .84, u * .16);
    c.fillStyle = '#8a867e'; c.fillRect(sx - u * .3, sy - u * .46, u * .6, u * .3);
    c.fillStyle = on ? '#b5352b' : '#5a4a4a';
    c.fillRect(sx - u * .34, sy - u * 1.3, u * .1, u * .84); c.fillRect(sx + u * .24, sy - u * 1.3, u * .1, u * .84);
    c.fillRect(sx - u * .5, sy - u * 1.42, u, u * .12); c.fillRect(sx - u * .38, sy - u * 1.16, u * .76, u * .07);
    const f = on ? .75 + .25 * Math.sin(time * 5 + s.x) : .3;
    c.fillStyle = on ? 'rgba(255,205,100,' + f + ')' : 'rgba(130,160,230,.4)';
    c.beginPath(); c.arc(sx, sy - u * .72, u * (on ? .13 : .09), 0, TAU); c.fill();
  }
  let glowSpr = null;
  function glowSprite() {
    if (glowSpr) return glowSpr;
    glowSpr = document.createElement('canvas'); glowSpr.width = glowSpr.height = 128;
    const g = glowSpr.getContext('2d'), r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    r.addColorStop(0, 'rgba(255,190,90,.9)'); r.addColorStop(.35, 'rgba(255,150,60,.35)'); r.addColorStop(1, 'rgba(255,120,40,0)');
    g.fillStyle = r; g.fillRect(0, 0, 128, 128); return glowSpr;
  }
  const GLOWTYPES = { house: 1, hall: 1, hut: 1, tent: 1, tower: 1, shrine: 1 };
  const glows = [];

  // ---------- Alte Schriftzeichen und versiegeltes Tor ----------
  function inscription(c,s,sx,sy,u,time){const w=u*.62,h=u*.74,x=sx-w/2,y=sy-h;shadow(c,sx,sy,u*.38,u*.1);c.fillStyle='#484a4b';c.beginPath();c.moveTo(x+w*.12,y);c.lineTo(x+w*.88,y);c.lineTo(x+w,y+h*.12);c.lineTo(x+w*.94,y+h);c.lineTo(x+w*.06,y+h);c.lineTo(x,y+h*.12);c.closePath();c.fill();c.fillStyle='#77756d';c.fillRect(x+w*.1,y+h*.08,w*.8,h*.82);c.strokeStyle='rgba(25,27,29,.55)';c.lineWidth=Math.max(1,u*.025);c.strokeRect(x+w*.1,y+h*.08,w*.8,h*.82);if(SW.Inscriptions)SW.Inscriptions.drawMark(c,s,sx,sy-h*.52,u*.34);c.fillStyle='rgba(224,190,115,'+(.24+.12*Math.sin(time*2+s.shape))+')';c.beginPath();c.arc(sx,sy-h*.5,u*.42,0,TAU);c.fill();}
  function forgottenGate(c,sx,sy,u,opened,time){shadow(c,sx,sy,u*.85,u*.13);c.fillStyle='#393a3b';c.fillRect(sx-u*.58,sy-u*1.65,u*.19,u*1.65);c.fillRect(sx+u*.39,sy-u*1.65,u*.19,u*1.65);c.fillStyle='#77766e';c.fillRect(sx-u*.7,sy-u*1.82,u*1.4,u*.23);c.fillRect(sx-u*.66,sy-u*.12,u*1.32,u*.14);c.fillStyle=opened?'rgba(75,150,170,.82)':'rgba(16,18,24,.92)';c.fillRect(sx-u*.35,sy-u*1.48,u*.7,u*1.35);c.strokeStyle=opened?'rgba(155,226,228,.95)':'rgba(205,174,112,.7)';c.lineWidth=u*.055;c.strokeRect(sx-u*.35,sy-u*1.48,u*.7,u*1.35);if(opened){c.fillStyle='rgba(96,190,205,'+(.25+.12*Math.sin(time*2.5))+')';c.beginPath();c.ellipse(sx,sy-u*.8,u*.48,u*.75,0,0,TAU);c.fill();}}

  // ---------- NPCs (Phase 4b) ----------
  function npc(c, s, sx, sy, u, time) {
    shadow(c, sx, sy, u * .3, u * .1);
    const by = sy - Math.abs(Math.sin(time * 2 + s.x)) * u * .02;
    c.fillStyle = '#2b2b33'; c.fillRect(sx - u * .14, by - u * .4, u * .28, u * .4);
    c.fillStyle = s.robe; c.beginPath(); c.moveTo(sx - u * .24, by - u * .38); c.lineTo(sx + u * .24, by - u * .38); c.lineTo(sx + u * .17, by - u * .95); c.lineTo(sx - u * .17, by - u * .95); c.closePath(); c.fill();
    if (s.role === 'smith') { c.fillStyle = '#3a2a22'; c.fillRect(sx - u * .14, by - u * .75, u * .28, u * .36); c.fillStyle = '#9a9aa2'; c.fillRect(sx + u * .2, by - u * .7, u * .22, u * .09); }
    if (s.role === 'weapon') { c.strokeStyle = '#d9e0e6'; c.lineWidth = u * .04; c.beginPath(); c.moveTo(sx - u * .3, by - u * .2); c.lineTo(sx - u * .3, by - u * .9); c.stroke(); }
    c.fillStyle = '#e3bf9a'; c.beginPath(); c.arc(sx, by - u * 1.08, u * .13, 0, TAU); c.fill();
    c.fillStyle = s.hat; c.beginPath(); c.moveTo(sx - u * .24, by - u * 1.12); c.lineTo(sx, by - u * 1.38); c.lineTo(sx + u * .24, by - u * 1.12); c.closePath(); c.fill();
    if (s.amb) return;
    if (s.role === 'smith' && SW.Village && SW.Village.stage >= 4) { c.fillStyle = 'rgba(255,' + Math.round(110 + Math.sin(time * 9 + 1) * 40) + ',30,.9)'; c.fillRect(sx + u * .3, by - u * .3, u * .14, u * .1); }
    const mk = SW.Quests ? SW.Quests.mark(s.id) : 0; // 2 = Abgabe bereit, 1 = neue Quest
    if (s.q && !mk) return;
    const my = by - u * 1.6 + Math.sin(time * 3 + s.x) * u * .04, r = mk ? u * .15 : u * .1;
    c.fillStyle = mk === 2 ? '#6fd36f' : '#f2c14e'; c.beginPath(); c.moveTo(sx, my - r); c.lineTo(sx + r, my); c.lineTo(sx, my + r); c.lineTo(sx - r, my); c.fill();
    if (mk) { c.save(); c.fillStyle = '#1a1208'; c.font = '700 ' + Math.round(u * .19) + 'px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(mk === 2 ? '?' : '!', sx, my + 1); c.restore(); }
  }

  // ---------- Spieler ----------
  function drawPlayer(c, sx, sy, u, p) {
    const d = p.dir, a = p.anim, bob = p.moving ? Math.abs(Math.sin(a)) * u * .05 : 0, sw = p.moving ? Math.sin(a) * u * .14 : 0;
    shadow(c, sx, sy, u * .3, u * .1);
    c.lineCap = 'round';
    c.strokeStyle = '#1e2433'; c.lineWidth = u * .16;
    c.beginPath(); c.moveTo(sx - u * .08, sy - u * .45); c.lineTo(sx - u * .08 + sw, sy - u * .03); c.moveTo(sx + u * .08, sy - u * .45); c.lineTo(sx + u * .08 - sw, sy - u * .03); c.stroke();
    const by = sy - bob;
    c.fillStyle = '#2b3d6b'; c.beginPath(); c.moveTo(sx - u * .2, by - u * .42); c.lineTo(sx + u * .2, by - u * .42); c.lineTo(sx + u * .17, by - u * .95); c.lineTo(sx - u * .17, by - u * .95); c.closePath(); c.fill();
    c.fillStyle = '#c9b57a'; c.fillRect(sx - u * .2, by - u * .55, u * .4, u * .08);
    c.strokeStyle = '#1b1b1f'; c.lineWidth = u * .07; c.beginPath(); c.moveTo(sx - d * u * .22, by - u * .5 + u * .05); c.lineTo(sx + d * u * .38, by - u * .5 - u * .22); c.stroke();
    c.strokeStyle = '#c9b57a'; c.lineWidth = u * .03; c.beginPath(); c.moveTo(sx - d * u * .22, by - u * .45); c.lineTo(sx - d * u * .3, by - u * .42); c.stroke();
    const sq = SW.WCombat && SW.WCombat.swingQ && SW.WCombat.swingQ(); // 0.12.0 Schwerthieb: Klinge schwingt in einem Bogen (Platzhalter bis Phase 29)
    if (sq) {
      const ag = sq.a - 1.1 + sq.q * 2.2, hx = sx + d * u * .1, hy = by - u * .55;
      c.strokeStyle = '#e6ecf2'; c.lineWidth = u * .07; c.beginPath(); c.moveTo(hx, hy); c.lineTo(hx + Math.cos(ag) * u * .85, hy + Math.sin(ag) * u * .5 - u * .1); c.stroke();
    }
    c.fillStyle = '#e3bf9a'; c.beginPath(); c.arc(sx, by - u * 1.08, u * .13, 0, TAU); c.fill();
    c.fillStyle = '#17141a'; c.beginPath(); c.arc(sx, by - u * 1.12, u * .135, Math.PI, 0); c.fill();
    c.beginPath(); c.arc(sx - d * u * .1, by - u * 1.28, u * .07, 0, TAU); c.fill();
  }

  // ---------- Frame ----------
  const items = [];
  R.resize = function (w, h) { vign = null; vw = w; vh = h; };
  R.resume = function () { glowSpr = null; vign = null; }; // iOS verwirft Offscreen-Canvas
  R.draw = function (c, cw, ch, time) {
    if (!shades) mkShades();
    const u = R.tile = Math.max(28, Math.round(ch / 9.5)), cam = SW.cam, p = SW.Player;
    const ox = Math.round(cw / 2 - cam.x * u), oy = Math.round(ch / 2 - cam.y * u);
    const x0 = Math.floor(cam.x - cw / 2 / u) - 1, x1 = Math.ceil(cam.x + cw / 2 / u) + 1;
    const y0 = Math.floor(cam.y - ch / 2 / u) - 1, y1 = Math.ceil(cam.y + ch / 2 / u) + 1;
    drawTerrain(c, x0, x1, y0, y1, ox, oy, u, time);
    items.length = 0; glows.length = 0;
    for (let y = y0; y <= y1 + 3; y++) for (let x = x0; x <= x1; x++) { const o = W.o(x, y); if (o) items.push({ k: o, x, y, key: y + .85 }); }
    for (let i = 0; i < W.S.length; i++) {
      const s = W.S[i];
      if (s.x + s.w < x0 - 2 || s.x > x1 + 2 || s.y + s.h < y0 - 1 || s.y - 4 > y1 + 1) continue;
      s.in = !!s.door && p.x > s.x && p.x < s.x + s.w && p.y > s.y && p.y < s.y + s.h; // Spieler im Haus -> Innenansicht zuerst zeichnen
      items.push({ k: -1, s, key: s.in ? s.y - 100 : s.y + s.h - .01 });
      if (GLOWTYPES[s.type]) glows.push(s.x + s.w / 2, s.y + s.h - .4, s.type === 'tent' ? 2.4 : 3.2);
    }
    const sp = SW.Combat.spots;
    for (let i = 0; i < sp.length; i++) { const e = sp[i]; if (SW.Combat.on(e) && e.x > x0 - 1 && e.x < x1 + 1 && e.y > y0 - 1 && e.y < y1 + 2) items.push({ k: -3, s: e, key: e.y + .3 }); }
    const chs = SW.Inv.chests;
    for (let i = 0; i < chs.length; i++) { const e = chs[i]; if (e.x > x0 - 1 && e.x < x1 + 1 && e.y > y0 - 1 && e.y < y1 + 2) items.push({ k: -4, s: e, key: e.y + .3 }); }
    const np = SW.Shop.npcs;
    for (let i = 0; i < np.length; i++) { const e = np[i]; if (SW.Shop.on(e) && e.x > x0 - 1 && e.x < x1 + 1 && e.y > y0 - 1 && e.y < y1 + 2) items.push({ k: -5, s: e, key: e.y + .3 }); }
    const shr = SW.Shrines.list;
    for (let i = 0; i < shr.length; i++) { const e = shr[i]; if (e.x > x0 - 1 && e.x < x1 + 1 && e.y > y0 - 1 && e.y < y1 + 2) { items.push({ k: -6, s: e, key: e.y + .3 }); glows.push(e.x, e.y - .7, SW.Shrines.isOn(e.id) ? 5 : 2.2); } }
    if(SW.Inscriptions){SW.Inscriptions.list.forEach(e=>{if(!SW.Inscriptions.isFound(e.id)&&e.x>x0-1&&e.x<x1+1&&e.y>y0-1&&e.y<y1+2){items.push({k:-7,s:e,key:e.y+.3});glows.push(e.x,e.y-.45,1.15);}});if(SW.Inscriptions.gateVisible()){const e=SW.Inscriptions.gate;if(e.x>x0-2&&e.x<x1+2&&e.y>y0-2&&e.y<y1+2){items.push({k:-8,s:e,key:e.y+.3});glows.push(e.x,e.y-1,SW.Inscriptions.isGateOpened()?4:1.6);}}}
    items.push({ k: -2, key: p.y + .3 });
    items.sort((a, b) => a.key - b.key);
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (it.k === -2) { drawPlayer(c, Math.round(p.x * u + ox), Math.round((p.y + .3) * u + oy), u, p); continue; }
      if (it.k === -1) { drawStruct(c, it.s, ox, oy, u); continue; }
      if (it.k === -8) { forgottenGate(c,Math.round(it.s.x*u+ox),Math.round((it.s.y+.3)*u+oy),u,SW.Inscriptions.isGateOpened(),time); continue; }
      if (it.k === -7) { inscription(c,it.s,Math.round(it.s.x*u+ox),Math.round((it.s.y+.3)*u+oy),u,time); continue; }
      if (it.k === -6) { shrineObj(c, it.s, Math.round(it.s.x * u + ox), Math.round((it.s.y + .3) * u + oy), u, time); continue; }
      if (it.k === -5) { npc(c, it.s, Math.round(it.s.x * u + ox), Math.round((it.s.y + .3) * u + oy), u, time); continue; }
      if (it.k === -4) { chest(c, it.s, Math.round(it.s.x * u + ox), Math.round((it.s.y + .3) * u + oy), u, time); continue; }
      if (it.k === -3) { SW.Combat.drawWorld(c, Math.round(it.s.x * u + ox), Math.round((it.s.y + .3) * u + oy), u, time, it.s); continue; }
      const bx = it.x * u + ox + u / 2, by = (it.y + .85) * u + oy, v = W.h(it.x, it.y, 12);
      if (it.k === O.TREE) tree(c, bx, by, u, v, W.t(it.x, it.y) === T.SNOW, W.regionAt(it.x, it.y) === 17); else if (it.k === O.BAMBOO) bamboo(c, bx, by, u, v);
      else if (it.k === O.BOULDER) boulder(c, bx, by, u, v); else if (it.k === O.PILLAR) pillar(c, bx, by, u, v);
    }
    const tn = SW.Time.tint();
    if (tn.on) { c.globalCompositeOperation = 'multiply'; c.fillStyle = tn.css; c.fillRect(0, 0, cw, ch); c.globalCompositeOperation = 'source-over'; }
    if (tn.lamp > .04 && glows.length) {
      const sp = glowSprite(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, tn.lamp);
      for (let i = 0; i < glows.length; i += 3) { const r = glows[i + 2] * u; c.drawImage(sp, glows[i] * u + ox - r, glows[i + 1] * u + oy - r, r * 2, r * 2); }
      c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    }
    if (!vign || vw !== cw || vh !== ch) {
      vw = cw; vh = ch; vign = c.createRadialGradient(cw / 2, ch / 2, ch * .45, cw / 2, ch / 2, Math.max(cw, ch) * .75);
      vign.addColorStop(0, 'rgba(0,0,0,0)'); vign.addColorStop(1, 'rgba(8,6,14,.45)');
    }
    c.fillStyle = vign; c.fillRect(0, 0, cw, ch);
    const j = SW.Input.joy, dpr = SW.dpr || 1;
    if (j.active) {
      c.strokeStyle = 'rgba(232,224,208,.5)'; c.lineWidth = 3 * dpr; c.beginPath(); c.arc(j.bx * dpr, j.by * dpr, SW.Input.RAD * dpr, 0, TAU); c.stroke();
      c.fillStyle = 'rgba(232,224,208,.35)'; c.beginPath(); c.arc(j.cx * dpr, j.cy * dpr, 26 * dpr, 0, TAU); c.fill();
    }
  };
  R.drawPlayer = drawPlayer;
  return R;
})();
