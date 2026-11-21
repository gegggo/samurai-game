'use strict';
// Schrein-Prüfungen (Phase 7a). Namensraum SW.Trials.
// Ablauf: Schrein erwecken (Beten) -> Knopf "Enter" -> Innenraum (eigene Kachelkarte, Draufsicht) -> Aufgabe lösen -> Altar berühren -> Belohnung.
// Belohnungen: Yin/Yang (Spielstil), Essence (nur Skilltree), XP. Keine Münzen. Jede Prüfung einmalig, gespeichert in SW.Trials.done.
// Aufgabentypen: blocks (Steinblöcke auf Platten schieben), lanterns (Laternen in gezeigter Farbreihenfolge entzünden).
// Karte: # Wand | . Boden | B Block | P Platte | L Laterne | D Tür (zu bis gelöst) | A Altar | S Start | E Ausgang
SW.Trials = (function () {
  const T = { active: false, done: new Set() }, tr = (k, n) => SW.t(k, n);
  const RAD = .3, SPEED = 4, TAU = 6.2832, COL = ['#e0452f', '#f2c14e', '#4a8fe0', '#f4ecd8'];
  const ROOMS = {
    village: {
      kind: 'blocks', name: 'trn_village', hint: 'tr_hint_blocks', reward: { xp: 40, yin: 3 },
      map: ['###########', '#P##.A.##P#', '#.###D###.#', '#.........#', '#..B...B..#', '#.........#', '#...#.#...#', '#....S....#', '#####E#####']
    },
    bamboo: {
      kind: 'lanterns', name: 'trn_bamboo', hint: 'tr_hint_lanterns', reward: { xp: 40, yin: 2, ess: { common: 1 } }, order: [2, 3, 0, 1],
      map: ['###########', '#####A#####', '#####D#####', '#.........#', '#.L.....L.#', '#....#....#', '#.L.....L.#', '#....S....#', '#####E#####']
    }
  };
  let R = null, btnLeave = null, btnReset = null;

  const blockAt = (x, y) => R.blocks.find(b => b.x === x && b.y === y) || null;
  function solid(x, y) {
    if (x < 0 || y < 0 || x >= R.w || y >= R.h) return true;
    const c = R.g[y][x];
    return c === '#' || c === 'L' || (c === 'D' && !R.open) || !!blockAt(x, y);
  }
  const blocked = (x, y) => solid(Math.floor(x - RAD), Math.floor(y - RAD)) || solid(Math.floor(x + RAD), Math.floor(y - RAD)) ||
    solid(Math.floor(x - RAD), Math.floor(y + RAD)) || solid(Math.floor(x + RAD), Math.floor(y + RAD));

  function build(id) {
    const def = ROOMS[id], h = def.map.length, w = def.map[0].length;
    R = { id, def, w, h, g: [], blocks: [], plates: [], lant: [], lit: [], lt: [], seq: 0, open: false, state: 'play', t: 0, msg: '', msgT: 0, shake: 0, rew: null,
      p: { x: 5.5, y: 7.5, dir: 1, anim: 0, moving: false, face: 1.57 }, push: { k: '', t: 0 } };
    for (let y = 0; y < h; y++) {
      const row = [];
      for (let x = 0; x < w; x++) {
        let c = def.map[y][x];
        if (c === 'B') { R.blocks.push({ x, y, ox: 0, oy: 0 }); c = '.'; }
        else if (c === 'S') { R.p.x = x + .5; R.p.y = y + .5; c = '.'; }
        else if (c === 'P') R.plates.push({ x, y });
        else if (c === 'L') { R.lant.push({ x, y }); R.lit.push(false); R.lt.push(0); }
        row.push(c);
      }
      R.g.push(row);
    }
    R.msg = tr(def.hint); R.msgT = 6;
  }
  function ensure() {
    if (btnLeave) return;
    const mk = (id, fn) => { const b = document.createElement('button'); b.id = id; b.className = 'tr-btn'; b.addEventListener('click', fn); document.body.appendChild(b); return b; };
    btnLeave = mk('tr-leave', () => T.leave()); btnReset = mk('tr-reset', () => T.reset());
  }
  T.can = id => !!ROOMS[id] && !T.done.has(id);
  T.enter = function (id) {
    if (!T.can(id) || SW.Combat.active || SW.paused) return false;
    ensure(); btnLeave.textContent = tr('tr_leave'); btnReset.textContent = tr('tr_reset');
    build(id); T.active = true; document.body.classList.add('trial'); SW.Input.reset(); return true;
  };
  T.leave = function () {
    if (!T.active) return;
    T.active = false; R = null; document.body.classList.remove('trial'); SW.Input.reset(); SW.Save.touch();
  };
  T.reset = function () { if (T.active && R && R.state === 'play') build(R.id); };

  function say(k) { R.msg = tr(k); R.msgT = 3; }
  function claim() {
    const rw = R.def.reward, L = [];
    if (rw.xp) { const m = SW.Char.addXp(rw.xp); L.push('+' + rw.xp + ' XP'); m.forEach(x => L.push(x)); }
    if (rw.yin) { SW.YinYang.gain('yin', rw.yin); L.push('Yin +' + rw.yin); }
    if (rw.yang) { SW.YinYang.gain('yang', rw.yang); L.push('Yang +' + rw.yang); }
    for (const t in (rw.ess || {})) { SW.Essence.add(t, rw.ess[t]); L.push('+' + rw.ess[t] + ' ' + tr('ess_' + t)); }
    T.done.add(R.id); R.rew = L; R.state = 'reward'; R.t = 0;
    if (SW.Skills) SW.Skills.check();
    SW.Save.save();
  }
  function tryPush(sx, sy, dt) {
    const p = R.p, tx = Math.floor(p.x + sx * (RAD + .05)), ty = Math.floor(p.y + sy * (RAD + .05)), b = blockAt(tx, ty);
    if (!b) return false;
    if (sx ? Math.abs(p.y - (b.y + .5)) > .42 : Math.abs(p.x - (b.x + .5)) > .42) return false;
    const key = sx + ',' + sy + ',' + b.x + ',' + b.y;
    if (R.push.k !== key) { R.push.k = key; R.push.t = 0; }
    R.push.t += dt;
    if (R.push.t > .3) {
      const nx = b.x + sx, ny = b.y + sy;
      if (nx >= 0 && ny >= 0 && nx < R.w && ny < R.h && (R.g[ny][nx] === '.' || R.g[ny][nx] === 'P') && !solid(nx, ny)) { b.x = nx; b.y = ny; b.ox = -sx; b.oy = -sy; }
      R.push.t = 0;
    }
    return true;
  }
  T.update = function (dt, v) {
    if (!R) return;
    R.t += dt; R.shake = Math.max(0, R.shake - dt); if (R.msgT > 0) R.msgT -= dt;
    const k = Math.exp(-dt * 16); R.blocks.forEach(b => { b.ox *= k; b.oy *= k; });
    if (R.state === 'reward') { if (R.t > 4.5) T.leave(); return; }
    const p = R.p, m = Math.hypot(v.x, v.y); let pushing = false;
    p.moving = m > .01;
    if (p.moving) {
      const sp = SPEED * Math.min(1, m), dx = v.x / m * sp * dt, dy = v.y / m * sp * dt;
      p.face = Math.atan2(dy, dx); if (Math.abs(dx) > .001) p.dir = dx > 0 ? 1 : -1; p.anim += dt * sp * 2.2;
      if (!blocked(p.x + dx, p.y)) p.x += dx; else if (Math.abs(dx) >= Math.abs(dy) * .8) pushing = tryPush(dx > 0 ? 1 : -1, 0, dt);
      if (!blocked(p.x, p.y + dy)) p.y += dy; else if (Math.abs(dy) >= Math.abs(dx) * .8) pushing = tryPush(0, dy > 0 ? 1 : -1, dt) || pushing;
    } else p.anim = 0;
    if (!pushing) R.push.t = 0;
    if (R.def.kind === 'blocks' && !R.open && R.plates.every(pl => blockAt(pl.x, pl.y))) { R.open = true; say('tr_door'); }
    if (R.def.kind === 'lanterns' && !R.open) {
      R.lant.forEach((l, i) => {
        if (R.lit[i]) return;
        if (Math.hypot(p.x - l.x - .5, p.y - l.y - .5) < 1.25) R.lt[i] += dt; else R.lt[i] = 0;
        if (R.lt[i] < .3) return;
        R.lt[i] = 0;
        if (i === R.def.order[R.seq]) { R.lit[i] = true; R.seq++; if (R.seq >= R.lant.length) { R.open = true; say('tr_door'); } }
        else { R.lit.fill(false); R.seq = 0; R.shake = .5; say('tr_wrong'); }
      });
    }
    if (R.open) {
      for (let y = 0; y < R.h; y++) for (let x = 0; x < R.w; x++) if (R.g[y][x] === 'A' && Math.hypot(p.x - x - .5, p.y - y - .5) < .8) { claim(); return; }
    }
    if (p.y > R.h - .5) T.leave(); // Ausgang
  };

  // ---------- Zeichnen ----------
  function txt(c, s, x, y, size, col, al) { c.font = '700 ' + Math.round(size) + 'px Georgia, serif'; c.textAlign = al || 'center'; c.textBaseline = 'middle'; c.fillStyle = 'rgba(0,0,0,.7)'; c.fillText(s, x + 1.5, y + 1.5); c.fillStyle = col || '#f4ecd8'; c.fillText(s, x, y); }
  function glow(c, x, y, r, col, a) { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); c.globalAlpha = a; c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); c.globalAlpha = 1; }
  T.draw = function (c, cw, ch, time) {
    if (!R) return;
    const u = Math.floor(Math.min(cw / (R.w + 1), ch / (R.h + .8))), ox = Math.round((cw - R.w * u) / 2), oy = Math.round((ch - R.h * u) / 2), dpr = SW.dpr || 1;
    c.fillStyle = '#0b0a10'; c.fillRect(0, 0, cw, ch);
    c.save(); if (R.shake > 0) c.translate((Math.random() - .5) * R.shake * u * .4, 0);
    for (let y = 0; y < R.h; y++) for (let x = 0; x < R.w; x++) {
      const g = R.g[y][x], px = ox + x * u, py = oy + y * u;
      if (g === '#') { c.fillStyle = '#2b2937'; c.fillRect(px, py, u + 1, u + 1); c.fillStyle = '#5a566c'; c.fillRect(px, py, u + 1, u * .78); c.fillStyle = 'rgba(255,255,255,.08)'; c.fillRect(px, py, u + 1, u * .08); continue; }
      c.fillStyle = (x + y) % 2 ? '#3a3846' : '#363442'; c.fillRect(px, py, u + 1, u + 1);
      if (g === 'P') { const on = !!blockAt(x, y); c.fillStyle = on ? '#f2c14e' : '#5a586a'; c.fillRect(px + u * .15, py + u * .15, u * .7, u * .7); c.fillStyle = on ? '#fff0b0' : '#2e2c3a'; c.fillRect(px + u * .25, py + u * .25, u * .5, u * .5); }
      else if (g === 'E') { c.fillStyle = '#7a2e2a'; c.fillRect(px + u * .1, py, u * .8, u + 1); c.fillStyle = '#f2c14e'; c.fillRect(px + u * .1, py, u * .8, u * .06); }
      else if (g === 'D' && !R.open) { c.fillStyle = '#6a4424'; c.fillRect(px, py, u + 1, u + 1); c.fillStyle = '#3e2814'; for (let i = 1; i < 4; i++) c.fillRect(px + u * i / 4 - 1, py, 3, u); c.fillStyle = '#b5352b'; c.beginPath(); c.arc(px + u / 2, py + u / 2, u * .16, 0, TAU); c.fill(); }
    }
    // Objekte nach Tiefe
    const it = [];
    R.blocks.forEach(b => it.push({ y: b.y + b.oy + .5, f: () => block(c, b, ox, oy, u) }));
    R.lant.forEach((l, i) => it.push({ y: l.y + .6, f: () => lantern(c, l, i, ox, oy, u, time) }));
    for (let y = 0; y < R.h; y++) for (let x = 0; x < R.w; x++) if (R.g[y][x] === 'A') it.push({ y: y + .7, f: () => altar(c, x, y, ox, oy, u, time) });
    it.push({ y: R.p.y + .1, f: () => SW.Render.drawPlayer(c, Math.round(ox + R.p.x * u), Math.round(oy + (R.p.y + .3) * u), u, R.p) });
    it.sort((a, b) => a.y - b.y).forEach(o => o.f());
    if (R.def.kind === 'lanterns') {
      const n = R.def.order.length, x0 = ox + R.w * u / 2 - (n - 1) * u * .3;
      R.def.order.forEach((li, i) => { const x = x0 + i * u * .6, y = oy + u * .5; c.fillStyle = COL[li]; c.globalAlpha = i < R.seq ? 1 : .55; c.beginPath(); c.arc(x, y, u * .17, 0, TAU); c.fill(); c.globalAlpha = 1; c.strokeStyle = '#000'; c.lineWidth = 2; c.stroke(); });
    }
    c.restore();
    const vg = c.createRadialGradient(cw / 2, ch / 2, ch * .35, cw / 2, ch / 2, Math.max(cw, ch) * .7); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.6)'); c.fillStyle = vg; c.fillRect(0, 0, cw, ch);
    txt(c, tr(R.def.name), 56 * dpr, ch * .05, Math.max(14 * dpr, u * .4), '#f4ecd8', 'left');
    if (R.msgT > 0 && R.state === 'play') { c.globalAlpha = Math.min(1, R.msgT * 2); txt(c, R.msg, cw / 2, oy + R.h * u + (ch - oy - R.h * u) / 2 - 1, Math.max(13 * dpr, u * .38), '#ffe27a'); c.globalAlpha = 1; }
    if (R.state === 'reward') {
      c.fillStyle = 'rgba(0,0,0,' + Math.min(.6, R.t * 2) + ')'; c.fillRect(0, 0, cw, ch);
      txt(c, tr('tr_done'), cw / 2, ch * .24, u * 1.1, '#ffe27a');
      const L = R.rew, y0 = ch * .42, st = Math.min(u * .7, (ch * .9 - y0) / Math.max(1, L.length));
      if (R.t > .4) L.forEach((s, i) => txt(c, s, cw / 2, y0 + i * st, st * .8, '#f4ecd8'));
    }
    const j = SW.Input.joy;
    if (j.active) { c.strokeStyle = 'rgba(232,224,208,.5)'; c.lineWidth = 3 * dpr; c.beginPath(); c.arc(j.bx * dpr, j.by * dpr, SW.Input.RAD * dpr, 0, TAU); c.stroke(); c.fillStyle = 'rgba(232,224,208,.35)'; c.beginPath(); c.arc(j.cx * dpr, j.cy * dpr, 26 * dpr, 0, TAU); c.fill(); }
  };
  function block(c, b, ox, oy, u) {
    const px = ox + (b.x + b.ox) * u, py = oy + (b.y + b.oy) * u, on = R.g[b.y][b.x] === 'P';
    c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(px + u * .1, py + u * .82, u * .84, u * .14);
    c.fillStyle = '#6e6a7c'; c.fillRect(px + u * .08, py + u * .1, u * .84, u * .8);
    c.fillStyle = on ? '#d8c27a' : '#9a96aa'; c.fillRect(px + u * .08, py + u * .1, u * .84, u * .55);
    c.strokeStyle = on ? '#7a5a10' : '#4a475a'; c.lineWidth = Math.max(2, u * .05); c.strokeRect(px + u * .2, py + u * .2, u * .6, u * .35);
    c.beginPath(); c.moveTo(px + u * .5, py + u * .2); c.lineTo(px + u * .5, py + u * .55); c.stroke();
  }
  function lantern(c, l, i, ox, oy, u, time) {
    const cx = ox + (l.x + .5) * u, by = oy + (l.y + .9) * u, lit = R.lit[i], col = COL[i];
    c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(cx + u * .08, by, u * .3, u * .1, 0, 0, TAU); c.fill();
    c.fillStyle = '#7a7686'; c.fillRect(cx - u * .18, by - u * .25, u * .36, u * .25); c.fillRect(cx - u * .08, by - u * .6, u * .16, u * .36);
    c.fillStyle = '#5a566a'; c.fillRect(cx - u * .3, by - u * .72, u * .6, u * .12);
    c.fillStyle = lit ? col : '#2a2833'; c.fillRect(cx - u * .17, by - u * .6, u * .34, u * .3);
    c.strokeStyle = col; c.lineWidth = Math.max(2, u * .05); c.strokeRect(cx - u * .17, by - u * .6, u * .34, u * .3);
    if (lit) { c.globalCompositeOperation = 'lighter'; glow(c, cx, by - u * .45, u * (1.4 + .1 * Math.sin(time * 6 + i)), col, .7); c.globalCompositeOperation = 'source-over'; }
  }
  function altar(c, x, y, ox, oy, u, time) {
    const cx = ox + (x + .5) * u, by = oy + (y + .9) * u;
    c.fillStyle = '#8a867e'; c.fillRect(cx - u * .32, by - u * .3, u * .64, u * .3); c.fillStyle = '#a9a496'; c.fillRect(cx - u * .24, by - u * .5, u * .48, u * .22);
    if (R.open) { c.globalCompositeOperation = 'lighter'; glow(c, cx, by - u * .75, u * (1.2 + .15 * Math.sin(time * 4)), '#ffd070', .9); c.globalCompositeOperation = 'source-over'; c.fillStyle = '#fff2c0'; c.beginPath(); c.arc(cx, by - u * .75, u * .14, 0, TAU); c.fill(); }
    else { c.fillStyle = '#3a3846'; c.beginPath(); c.arc(cx, by - u * .7, u * .1, 0, TAU); c.fill(); }
  }

  T.debug = () => R; // nur für Tests
  T.dump = () => ({ done: [...T.done] });
  T.load = function (d) {
    if (!d || !Array.isArray(d.done)) return;
    d.done.filter(id => typeof id === 'string' && ROOMS[id]).forEach(id => T.done.add(id));
  };

  Object.assign(SW.TEXT.en, {
    tr_enter: 'Enter', tr_leave: 'Leave', tr_reset: 'Reset', tr_done: 'Trial complete', tr_door: 'The door opens.', tr_wrong: 'The flames die. Try again.',
    tr_hint_blocks: 'Push the stone blocks onto the plates.', tr_hint_lanterns: 'Light the lanterns in the order shown above.',
    trn_village: 'Trial of Stillness', trn_bamboo: 'Trial of Flames'
  });
  SW.TEXT.de = Object.assign(SW.TEXT.de || {}, {
    tr_enter: 'Betreten', tr_leave: 'Verlassen', tr_reset: 'Neustart', tr_done: 'Prüfung bestanden', tr_door: 'Die Tür öffnet sich.', tr_wrong: 'Die Flammen erlöschen. Versuche es erneut.',
    tr_hint_blocks: 'Schiebe die Steinblöcke auf die Platten.', tr_hint_lanterns: 'Entzünde die Laternen in der oben gezeigten Farbreihenfolge.',
    trn_village: 'Prüfung der Stille', trn_bamboo: 'Prüfung der Flammen'
  });
  return T;
})();
