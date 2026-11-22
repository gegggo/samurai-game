'use strict';
// Boss-Arena (Phase B, 0.11.0): kleine runde Arena in Ego-Perspektive (Pseudo-3D), freie Bewegung im BOTW-Stil.
// Gilt für Gegner mit Phasen (4 Bosse) und das Schrein-Duell. Duell-Symbole ▲■▼, Finten und Atem-Fokus sind bewusst NICHT enthalten (Nutzerentscheidung).
// Aufbau für späteren 3D-Ausbau: SIMULATION (x/y in Kacheln auf der Arena-Ebene, Winkel, Zustände) kennt keine Zeichenroutinen.
// ANSICHT (proj(), draw*) bekommt nur Kamera {x, y, yaw} und die Figurenpositionen und kann durch eine echte 3D-Szene ersetzt werden.
// Kamera: Lock-on auf den Boss (wie Z-Targeting), daher braucht Bewegung nur den Joystick: oben = vor, unten = zurück, seitlich = Kreisen.
SW.Arena = (function () {
  const D = SW.Data, K = SW.Combat, W = SW.World, TAU = 6.2832, SWING = .18, DODGE = .38;
  const RA = 9, EYE = 1.5, WALL = 3.4, PSPD = 4.4, ROLL = 7, PREACH = 2.7;
  const A = { active: false }, held = { block: false, breath: false };
  let S = null;
  const T = (k, n) => SW.t(k, n), $ = id => document.getElementById(id);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => t * t * (3 - 2 * t);
  const ph = () => S.def.phases ? S.def.phases[S.phase] : S.def;
  const kiCost = m => Math.ceil(m.ki * S.ps.kiCostMul);
  const REACH = () => S.def.phases ? 2.4 : 2.0;
  const outT = () => S.state === 'win' ? 5.5 : 2.4;
  function shade(hex, f) { const n = parseInt(hex.slice(1), 16); return 'rgb(' + Math.min(255, Math.round((n >> 16 & 255) * f)) + ',' + Math.min(255, Math.round((n >> 8 & 255) * f)) + ',' + Math.min(255, Math.round((n & 255) * f)) + ')'; }

  // ===================== SIMULATION =====================
  A.start = function (spot) {
    const def = D.enemies[spot.type], ps = K.playerStats(), reg = W.regionAt(Math.floor(spot.x), Math.floor(spot.y));
    const name = def.arena || D.regionArena[reg] || 'clearing';
    S = {
      spot, def, ps, ar: D.arenas[name] || D.arenas.clearing, state: 'intro', t: 0, phase: 0, hp: def.hp, max: def.hp,
      php: ps.hp, pmax: ps.hp, ki: ps.ki, kmax: ps.ki, px: -6, py: 0, yaw: 0, pm: null, buf: null, chain: 0, chainT: 0, counterT: 0,
      block: false, blockT: 0, noBlockT: 1, parryOk: false, bl: 0, dodgeT: 0, dodgeCd: 0, dvx: 1, dvy: 0, invT: 0, hurt: 0, shake: 0, spark: 0,
      breath: false, msg: '', msgT: 0, msgCol: '#fff', floats: [], rew: null, fswing: 0, bob: 0,
      st: { heavy: 0, special: 0, counter: 0, parry: 0, dodge: 0, block: 0, breath: 0 },
      boss: { x: 3, y: 0, st: 'idle', t: 0, dur: 1, wait: 1.5, atk: null, hits: 0, guarding: false, flash: 0, sd: Math.random() < .5 ? 1 : -1 }
    };
    held.block = held.breath = false;
    if (ps.ranged) D.moves.shot = { wind: ps.ranged.wind, rec: ps.ranged.rec, dmg: ps.ranged.dmg, ranged: true, anim: 'shot' };
    { const rb = $('cb-ranged'); if (rb) rb.style.display = ps.ranged ? '' : 'none'; }
    [0, 1].forEach(i => {
      const b = $('cb-s' + i), id = SW.Skills.slots[i], on = !!(id && ps.slots[i]);
      if (b) { b.style.display = on ? '' : 'none'; b.textContent = on ? T('sk_' + id) : ''; }
    });
    K.active = true; A.active = true; SW.paused = false; SW.Input.reset();
    document.body.classList.add('combat');
  };
  function finish() {
    const won = S.state === 'win';
    if (!won) { const P = SW.Player; P.x = W.spawn.x; P.y = W.spawn.y; SW.cam.x = P.x; SW.cam.y = P.y; }
    S = null; A.active = false; K.active = false; SW.paused = false; held.block = held.breath = false;
    SW.Input.reset(); document.body.classList.remove('combat');
    SW.Save.save();
  }
  function say(txt, col) { S.msg = txt; S.msgCol = col || '#fff'; S.msgT = 1.1; }
  function flt(txt, col) { S.floats.push({ x: .5 + rnd(-.08, .08), t: 0, txt, col }); }
  const dist = () => Math.hypot(S.boss.x - S.px, S.boss.y - S.py);

  function startMove(name) {
    const m = D.moves[name], n = m.hits || 1, rec = Math.max(SWING + .04, m.rec * S.ps.recMul);
    S.pm = { name, m, anim: m.anim || name, t: 0, hitN: 0, n, rec, end: m.wind + (n - 1) * (m.gap || 0) + SWING };
    S.pm.dur = S.pm.end - SWING + rec;
    if (m.ki) S.ki -= kiCost(m);
    if (m.inv) S.invT = m.inv;
    if (name === 'heavy') S.st.heavy++; else if (name === 'counter') S.st.counter++; else if (m.ki) S.st.special++;
    S.breath = false;
    if (name === 'counter') say(T('combat_counter'), '#ffe27a');
  }
  function act(kind) {
    if (!S || S.state !== 'fight') return;
    if (S.pm || S.hurt > 0 || S.dodgeT > 0) { S.buf = { kind, t: .25 }; return; }
    let name;
    if (kind === 'attack') {
      if (S.counterT > 0) { name = 'counter'; S.counterT = 0; }
      else if (S.chainT > 0 && S.chain < 3) name = 'quick';
      else name = 'normal';
    } else if (kind === 'heavy') name = 'heavy';
    else if (kind === 'special') {
      if (S.ki < kiCost(D.moves.special)) { say(T('combat_noki'), '#8cf'); return; }
      name = 'special';
    } else if (kind === 's0' || kind === 's1') {
      name = S.ps.slots[+kind[1]];
      if (!name) return;
      if (S.ki < kiCost(D.moves[name])) { say(T('combat_noki'), '#8cf'); return; }
    } else if (kind === 'ranged') { if (!S.ps.ranged) return; name = 'shot'; }
    else return;
    startMove(name);
  }
  function dodge() {
    if (!S || S.state !== 'fight' || S.dodgeCd > 0 || S.hurt > 0) return;
    if (S.pm && S.pm.t < S.pm.end) return;
    const v = SW.Input.vec, c = Math.cos(S.yaw), s = Math.sin(S.yaw);
    let f = -v.y, r = v.x; if (Math.hypot(f, r) < .2) { f = -1; r = 0; } // ohne Richtung: nach hinten
    const m = Math.hypot(f, r); f /= m; r /= m;
    S.dvx = f * c - r * s; S.dvy = f * s + r * c;
    S.pm = null; S.buf = null; S.chain = 0; S.dodgeT = DODGE; S.dodgeCd = .9 * S.ps.dodgeCdMul; S.breath = false;
  }
  A.press = function (k) {
    if (k === 'block' || k === 'breath') held[k] = true;
    else if (k === 'dodge') dodge();
    else act(k);
  };
  A.release = function (k) { if (k === 'block' || k === 'breath') held[k] = false; };

  function reward() {
    if (S.spot.trial) { const o = SW.Trials.duelWon(S.spot.trial); Object.assign(o, { coins: 0, items: [], karma: 0, secret: null }); S.rew = o; SW.Save.touch(); return; } // Schrein-Duell: nur Prüfungsbelohnung
    S.rew = K.grant(S.spot, S.st); SW.Save.touch();
  }
  function playerHit(pm) {
    const m = pm.m, f = S.boss, ps = S.ps, nm = pm.name;
    if (m.heal) { const h = Math.round(S.pmax * m.heal); S.php = Math.min(S.pmax, S.php + h); flt('+' + h, '#7fe08a'); return; }
    if (!m.ranged && dist() > PREACH) { flt('…', '#bbb'); return; } // zu weit weg: Schlag geht ins Leere
    const heavyish = nm === 'heavy' || nm === 'special' || nm === 'counter' || !!m.guardBreak || m.dmg >= 30;
    let dmg = m.dmg * ps.atk;
    if (nm === 'counter') dmg *= ps.counterMul;
    if (f.st === 'wind') dmg *= 1 + ps.ambush;
    if (f.guarding && nm !== 'counter' && !m.ignoreGuard) {
      if (m.ranged) dmg *= .5;
      else if (m.guardBreak || nm === 'special') { f.guarding = false; f.st = 'stagger'; f.t = 0; f.dur = .9; f.hits = 0; say(T('combat_guard_break'), '#ffd27a'); }
      else dmg *= .25;
    } else if (S.def.armor && !heavyish) dmg *= 1 - S.def.armor;
    if (f.st === 'rec' || f.st === 'stagger') dmg *= 1.3;
    const crit = Math.random() < ps.crit; if (crit) dmg *= ps.critMul || 1.5;
    dmg = Math.max(1, Math.round(dmg));
    S.hp -= dmg; f.flash = .1; if (!m.ranged) S.ki = Math.min(S.kmax, S.ki + 4);
    flt(dmg + (crit ? '!' : ''), crit ? '#ff9a3c' : heavyish ? '#ffd27a' : '#fff');
    if (heavyish && f.st === 'wind' && !(f.atk && f.atk.unblock)) { f.st = 'stagger'; f.t = 0; f.dur = .6; f.hits = 0; }
    if (S.hp <= 0) { S.hp = 0; S.state = 'win'; S.t = 0; S.spot.dead = true; S.pm = null; reward(); return; }
    if (S.def.phases) {
      const r = S.hp / S.max; let n = S.phase;
      while (n + 1 < S.def.phases.length && r <= S.def.phases[n + 1].at) n++;
      if (n > S.phase) { S.phase = n; f.st = 'stagger'; f.t = 0; f.dur = 1.2; f.hits = 0; f.guarding = false; say(T('combat_phase', n + 1), '#ff7a5a'); S.shake = .4; }
    }
  }
  function hurtPlayer(dmg, blocked) {
    S.php -= dmg; flt('-' + Math.max(1, Math.round(dmg)), blocked ? '#9cf' : '#ff6a5a');
    if (blocked) S.shake = Math.max(S.shake, .12);
    else { S.hurt = .3; S.shake = .3; if (S.pm && !S.pm.hitN) S.pm = null; S.buf = null; S.breath = false; }
    if (S.php <= 0) { S.php = 0; S.state = 'lose'; S.t = 0; S.pm = null; }
  }
  function foeIdle() {
    const f = S.boss, p = ph();
    f.st = 'idle'; f.t = 0; f.wait = rnd(p.gap[0], p.gap[1]);
    f.guarding = Math.random() < p.guard;
    if (f.guarding) f.wait = Math.max(f.wait, 1.1);
  }
  function foeStrike() {
    const f = S.boss, At = f.atk, ps = S.ps, p = ph();
    S.fswing = SWING; f.hits--;
    const dmg = Math.max(1, At.dmg * (S.def.dmg || 1) - ps.def);
    if (dist() > REACH() + .7) { /* Spieler ist weggelaufen: Angriff geht ins Leere */ }
    else if (S.dodgeT > 0 || S.invT > 0) { say(T('combat_dodge_ok'), '#cfe'); S.ki = Math.min(S.kmax, S.ki + 3); S.st.dodge++; }
    else if (S.block && !At.unblock && S.parryOk && S.blockT <= ps.parry) {
      S.st.parry++; f.st = 'stagger'; f.t = 0; f.dur = 1.1; f.hits = 0; S.counterT = 1.4;
      S.ki = Math.min(S.kmax, S.ki + 8); S.spark = .25; S.shake = .15; say(T('combat_parry'), '#ffe27a');
      return;
    } else if (S.block && !At.unblock) { S.spark = .12; S.st.block++; hurtPlayer(dmg * (At.block !== undefined ? At.block : .2) * ps.blockMul / .2, true); }
    else hurtPlayer(dmg, false);
    if (S.state !== 'fight') return;
    if (f.hits > 0) { f.t = 0; f.dur = (At.gap || .3) / p.speed; } else { f.st = 'rec'; f.t = 0; f.dur = At.rec / p.speed; }
  }
  function fight(dt) {
    const ps = S.ps, f = S.boss, p = ph();
    S.invT = Math.max(0, S.invT - dt); S.dodgeCd = Math.max(0, S.dodgeCd - dt); S.dodgeT = Math.max(0, S.dodgeT - dt); S.hurt = Math.max(0, S.hurt - dt);
    S.chainT = Math.max(0, S.chainT - dt); S.counterT = Math.max(0, S.counterT - dt);
    if (S.buf) { S.buf.t -= dt; if (S.buf.t <= 0) S.buf = null; }
    if (S.pm) {
      const pm = S.pm; pm.t += dt;
      while (pm.hitN < pm.n && pm.t >= pm.m.wind + pm.hitN * (pm.m.gap || 0)) { pm.hitN++; playerHit(pm); if (S.state !== 'fight') return; }
      if (pm.t >= pm.dur) {
        S.pm = null;
        if (pm.name === 'normal') { S.chain = 1; S.chainT = .55; } else if (pm.name === 'quick') { S.chain++; S.chainT = .55; } else S.chain = 0;
      }
    }
    if (held.block && S.pm && S.pm.t >= S.pm.end) { S.pm = null; S.chain = 0; }
    if (!S.pm && S.buf && S.hurt <= 0 && S.dodgeT <= 0) { const b = S.buf; S.buf = null; act(b.kind); }
    const want = held.block && !S.pm && S.dodgeT <= 0 && S.hurt <= 0;
    if (want && !S.block) { S.parryOk = S.noBlockT >= .35; S.blockT = 0; }
    if (want) { S.blockT += dt; S.noBlockT = 0; } else S.noBlockT += dt;
    S.block = want; S.bl = clamp(S.bl + (want ? 1 : -1) * dt * 9, 0, 1);
    S.breath = !want && !S.pm && S.dodgeT <= 0 && S.hurt <= 0 && Math.hypot(SW.Input.vec.x, SW.Input.vec.y) <= .15; // Atem automatisch bei Stillstand
    if (S.breath) S.st.breath += dt;
    S.ki = Math.min(S.kmax, S.ki + (ps.kiRegen + (S.breath ? 22 * ps.breathMul : 0)) * dt);

    // --- Spielerbewegung (relativ zur Blickrichtung zum Boss) ---
    SW.Input.update();
    const c = Math.cos(S.yaw), s = Math.sin(S.yaw), v = SW.Input.vec;
    let mx = 0, my = 0;
    if (S.dodgeT > 0) { mx = S.dvx * ROLL; my = S.dvy * ROLL; }
    else if (S.hurt <= 0) {
      const k = S.pm ? .25 : S.block ? .4 : S.breath ? .3 : 1, fw = -v.y, rt = v.x;
      mx = (fw * c - rt * s) * PSPD * k; my = (fw * s + rt * c) * PSPD * k;
    }
    S.bob += Math.hypot(mx, my) * dt * 1.6;
    S.px += mx * dt; S.py += my * dt;
    const d0 = Math.hypot(S.px, S.py); if (d0 > RA - .8) { S.px *= (RA - .8) / d0; S.py *= (RA - .8) / d0; }
    let bx = S.px - f.x, by = S.py - f.y, bd = Math.hypot(bx, by);
    if (bd < 1.6) { bx = bx / (bd || 1) * 1.6; by = by / (bd || 1) * 1.6; S.px = f.x + bx; S.py = f.y + by; }

    // --- Boss-KI ---
    f.flash = Math.max(0, f.flash - dt); S.fswing = Math.max(0, S.fswing - dt); f.t += dt;
    const d = dist(), ux = (S.px - f.x) / (d || 1), uy = (S.py - f.y) / (d || 1), sp = 2.6 * p.speed;
    if (f.st === 'idle') {
      if (d > REACH() - .2) { f.x += ux * sp * dt; f.y += uy * sp * dt; }
      else { f.x += -uy * f.sd * 1.1 * dt; f.y += ux * f.sd * 1.1 * dt; } // kreist um den Spieler
      if (f.t >= f.wait && d <= REACH() + .6) {
        const list = p.atk, At = D.attacks[list[(Math.random() * list.length) | 0]];
        f.atk = At; f.hits = At.hits || 1; f.st = 'wind'; f.t = 0; f.dur = At.wind / p.speed; f.guarding = false; f.sd = Math.random() < .5 ? 1 : -1;
      }
    } else if (f.st === 'wind') { if (f.t >= f.dur) foeStrike(); }
    else if (f.t >= f.dur) foeIdle();
    const fd = Math.hypot(f.x, f.y); if (fd > RA - .8) { f.x *= (RA - .8) / fd; f.y *= (RA - .8) / fd; }
  }
  A.update = function (dt) {
    if (!S) return;
    S.t += dt;
    S.shake = Math.max(0, S.shake - dt); S.spark = Math.max(0, S.spark - dt); S.msgT = Math.max(0, S.msgT - dt);
    for (let i = S.floats.length - 1; i >= 0; i--) { S.floats[i].t += dt; if (S.floats[i].t > 1) S.floats.splice(i, 1); }
    // Lock-on: Kamera dreht weich zum Boss
    const ta = Math.atan2(S.boss.y - S.py, S.boss.x - S.px); let da = ta - S.yaw; while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU;
    S.yaw += da * Math.min(1, dt * 12);
    if (S.state === 'intro') { if (S.t > 1.3) { S.state = 'fight'; S.t = 0; } return; }
    if (S.state === 'win' || S.state === 'lose') { if (S.t > outT()) finish(); return; }
    fight(dt);
  };
  window.addEventListener('keydown', e => {
    if (!A.active) return; const k = e.key.toLowerCase();
    if (k === ' ') held.block = true; else if (k === 'b') held.breath = true;
    else if (e.repeat) return;
    else if (k === 'j') act('attack'); else if (k === 'k') act('heavy'); else if (k === 'l') act('special'); else if (k === 'u') act('s0'); else if (k === 'i') act('s1'); else if (k === 'h') act('ranged');
    else if (k === 'x' || k === 'shift') dodge();
  });
  window.addEventListener('keyup', e => { const k = e.key.toLowerCase(); if (k === ' ') held.block = false; else if (k === 'b') held.breath = false; });

  // ===================== ANSICHT =====================
  let FW = 1, HZ = 0, FOC = 1;
  function proj(x, y, z) { // Welt -> Bildschirm; null = hinter der Kamera
    const dx = x - S.px, dy = y - S.py, c = Math.cos(S.yaw), s = Math.sin(S.yaw), f = dx * c + dy * s, r = -dx * s + dy * c;
    if (f < .2) return null;
    return { x: FW / 2 + r / f * FOC, y: HZ + (EYE - z) / f * FOC, f };
  }
  function line(c, x0, y0, x1, y1) { const a = proj(x0, y0, 0), b = proj(x1, y1, 0); if (!a || !b) return; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); }
  function drawRoom(c, cw, ch) {
    const ar = S.ar;
    let g = c.createLinearGradient(0, 0, 0, HZ); g.addColorStop(0, ar.sky[0]); g.addColorStop(1, ar.sky[1]); c.fillStyle = g; c.fillRect(0, 0, cw, HZ + 1);
    g = c.createLinearGradient(0, HZ, 0, ch); g.addColorStop(0, ar.gnd[0]); g.addColorStop(1, ar.gnd[1]); c.fillStyle = g; c.fillRect(0, HZ, cw, ch - HZ);
    // Wand: Segmente von hinten nach vorn
    const N = 56, segs = [];
    for (let i = 0; i < N; i++) {
      const a0 = i / N * TAU, a1 = (i + 1) / N * TAU, mx = Math.cos((a0 + a1) / 2) * RA - S.px, my = Math.sin((a0 + a1) / 2) * RA - S.py;
      segs.push({ i, a0, a1, f: mx * Math.cos(S.yaw) + my * Math.sin(S.yaw) });
    }
    segs.sort((p, q) => q.f - p.f);
    for (const sg of segs) {
      const x0 = Math.cos(sg.a0) * RA, y0 = Math.sin(sg.a0) * RA, x1 = Math.cos(sg.a1) * RA, y1 = Math.sin(sg.a1) * RA;
      const p0 = proj(x0, y0, 0), p1 = proj(x1, y1, 0), p2 = proj(x1, y1, WALL), p3 = proj(x0, y0, WALL);
      if (!p0 || !p1 || !p2 || !p3) continue;
      c.fillStyle = shade(ar.gnd[1], sg.i % 8 === 0 ? .7 : sg.i % 2 ? 1.2 : 1.35);
      c.beginPath(); c.moveTo(p0.x, p0.y); c.lineTo(p1.x, p1.y); c.lineTo(p2.x, p2.y); c.lineTo(p3.x, p3.y); c.closePath(); c.fill();
      if (sg.i % 8 === 0) { // Pfosten mit Banner
        const q = proj((x0 + x1) / 2, (y0 + y1) / 2, WALL * .85), w = FOC / Math.max(.5, q ? q.f : 1) * .5;
        if (q) { c.fillStyle = shade(ar.sky[0], .55); c.fillRect(q.x - w / 2, q.y, w, w * 2.4); }
      }
    }
    // Bodenmarkierung
    c.strokeStyle = 'rgba(255,255,255,.16)'; c.lineWidth = Math.max(1, ch / 200);
    for (const R of [3, 6, RA - .2]) { const n = 48; for (let i = 0; i < n; i++) line(c, Math.cos(i / n * TAU) * R, Math.sin(i / n * TAU) * R, Math.cos((i + 1) / n * TAU) * R, Math.sin((i + 1) / n * TAU) * R); }
    for (let i = 0; i < 8; i++) line(c, 0, 0, Math.cos(i / 8 * TAU) * RA, Math.sin(i / 8 * TAU) * RA);
  }
  function drawBoss(c, cw, ch, time) {
    const f = S.boss, q = proj(f.x, f.y, 0); if (!q) return;
    const u = FOC / q.f, sd = S.def;
    const w = { st: f.st, t: f.t, dur: f.dur, atk: f.atk, flash: f.flash, guarding: f.guarding, sw: S.fswing, dir: 1, hp: S.hp, max: S.max };
    c.save(); if (S.state === 'win') c.globalAlpha = clamp(1 - S.t / 1.4, 0, 1);
    K.drawWorld(c, q.x, q.y + Math.sin(time * 2.2) * u * .02, u, time, { type: S.spot.type, x: f.x, y: f.y, w });
    c.restore();
  }
  function weapon(c, cw, ch, time) {
    const G = K.gfx, pm = S.pm; let o = G.pmix(G.REST, G.REST, 0);
    if (pm) {
      const m = pm.m, Ra = G.RAISE[pm.anim], E = G.END[pm.anim], t = G.pmT(pm);
      if (t < m.wind) o = G.pmix(G.REST, Ra, ease(t / m.wind));
      else if (t < m.wind + SWING) o = G.pmix(Ra, E, (t - m.wind) / SWING);
      else o = G.pmix(E, G.REST, ease(clamp((t - m.wind - SWING) / (pm.rec - SWING), 0, 1)));
      const tt = t;
      if (tt >= m.wind && tt < m.wind + SWING) { const qq = (tt - m.wind) / SWING; for (let i = 3; i >= 1; i--) G.blade(c, cw, ch, G.pmix(Ra, E, clamp(qq - i * .12, 0, 1)), .16, null, false); }
    }
    if (S.bl > 0) o = G.pmix(o, G.BLOCK, ease(S.bl));
    if (S.breath) o.hy += .05;
    o.hx += Math.sin(time * 1.7) * .004; o.hy += Math.cos(time * 1.3) * .004 + Math.abs(Math.sin(S.bob)) * .012;
    const glow = pm ? (pm.m.glow || (pm.name === 'special' ? '#7fd0ff' : pm.name === 'counter' ? '#ffe27a' : null)) : null;
    G.blade(c, cw, ch, o, 1, glow, true);
    // Wurfgeschoss Richtung Boss
    if (pm && pm.name === 'shot' && pm.t < pm.m.wind + SWING) {
      const b = proj(S.boss.x, S.boss.y, 1.1), q = clamp(pm.t / (pm.m.wind + SWING * .4), 0, 1);
      if (b) { const ax = cw * .72, ay = ch * .95, px = lerp(ax, b.x, q), py = lerp(ay, b.y, q) - Math.sin(q * Math.PI) * ch * .08, sz = ch * (.05 - q * .03);
        c.save(); c.translate(px, py); c.rotate(q * 14); c.fillStyle = '#cfd5dc'; c.beginPath();
        for (let i = 0; i < 8; i++) { const r = i % 2 ? sz * .35 : sz, a = i / 8 * TAU; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
        c.closePath(); c.fill(); c.restore(); }
    }
    if (S.spark > 0) { c.fillStyle = 'rgba(255,255,255,' + S.spark * 3 + ')'; c.beginPath(); c.arc(cw * .5, ch * .62, ch * .07 * (1.2 - S.spark * 2), 0, TAU); c.fill(); }
  }
  function bar(c, x, y, w, h, r, col) { c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(x - 2, y - 2, w + 4, h + 4); c.fillStyle = col; c.fillRect(x, y, w * clamp(r, 0, 1), h); }
  function txt(c, s, x, y, size, col, al) {
    c.font = '700 ' + size + 'px Georgia, serif'; c.textAlign = al || 'center'; c.textBaseline = 'middle';
    c.fillStyle = 'rgba(0,0,0,.65)'; c.fillText(s, x + size * .06, y + size * .06); c.fillStyle = col; c.fillText(s, x, y);
  }
  A.draw = function (c, cw, ch, time) {
    if (!S) return;
    FW = cw; FOC = cw * .62; HZ = ch * .42 + Math.sin(S.bob) * ch * .006;
    const u = ch / 100, dpr = SW.dpr || 1, f = S.boss;
    c.save();
    if (S.shake > 0) c.translate(rnd(-1, 1) * S.shake * u * 4, rnd(-1, 1) * S.shake * u * 4);
    drawRoom(c, cw, ch);
    // Schatten + Boss
    { const q = proj(f.x, f.y, 0); if (q) { const s = FOC / q.f; c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(q.x, q.y, s * .55, s * .14, 0, 0, TAU); c.fill(); } }
    drawBoss(c, cw, ch, time);
    // Lock-on-Marke
    { const q = proj(f.x, f.y, 2.7 * (S.def.phases ? 1.2 : 1)); if (q && S.state !== 'win') { c.fillStyle = 'rgba(224,69,47,.9)'; const r = ch * .016; c.beginPath(); c.moveTo(q.x, q.y + r); c.lineTo(q.x + r, q.y - r); c.lineTo(q.x - r, q.y - r); c.closePath(); c.fill(); } }
    weapon(c, cw, ch, time);
    if (S.counterT > 0) { c.strokeStyle = 'rgba(255,226,122,' + (.45 + .3 * Math.sin(time * 14)) + ')'; c.lineWidth = u * 1.6; c.strokeRect(u, u, cw - 2 * u, ch - 2 * u); }
    if (S.hurt > 0) { c.fillStyle = 'rgba(200,20,20,' + S.hurt * .6 + ')'; c.fillRect(0, 0, cw, ch); }
    c.restore();
    // HUD
    const mg = 56 * dpr, bw = Math.min(cw * .3, 260 * dpr), bh = u * 2.6;
    txt(c, T('hud_hp'), mg, u * 4, u * 3, '#f4ecd8', 'left'); bar(c, mg + u * 5, u * 2.7, bw, bh, S.php / S.pmax, '#c8382c');
    txt(c, T('hud_ki'), mg, u * 9.4, u * 3, '#f4ecd8', 'left'); bar(c, mg + u * 5, u * 8.1, bw * .75, bh, S.ki / S.kmax, '#4aa3df');
    const ew = cw * .34, ex = (cw - ew) / 2;
    txt(c, T('enemy_' + S.spot.type), cw / 2, u * 3.6, u * 3.6, '#f4ecd8');
    bar(c, ex, u * 6.2, ew, bh, S.hp / S.max, S.phase ? '#e0702a' : '#b5352b');
    if (S.def.phases) for (let i = 1; i < S.def.phases.length; i++) { c.fillStyle = '#f4ecd8'; c.fillRect(ex + ew * S.def.phases[i].at - 1, u * 6.2 - 2, 2, bh + 4); }
    if (S.msgT > 0) { c.globalAlpha = Math.min(1, S.msgT * 3); txt(c, S.msg, cw / 2, ch * .22, u * 7, S.msgCol); c.globalAlpha = 1; }
    for (const fl of S.floats) { c.globalAlpha = 1 - fl.t; txt(c, fl.txt, fl.x * cw, ch * .4 - fl.t * u * 12, u * 6, fl.col); }
    c.globalAlpha = 1;
    if (S.state === 'intro') {
      c.fillStyle = 'rgba(0,0,0,' + clamp(1 - S.t / .7, 0, 1) + ')'; c.fillRect(0, 0, cw, ch);
      txt(c, T('enemy_' + S.spot.type), cw / 2, ch * .45, u * 9, '#f4ecd8');
    } else if (S.state === 'win' || S.state === 'lose') {
      const win = S.state === 'win', rw = win && S.rew;
      c.fillStyle = 'rgba(0,0,0,' + clamp(S.t / .6, 0, .5) + ')'; c.fillRect(0, 0, cw, ch);
      txt(c, T(win ? 'combat_victory' : 'combat_defeat'), cw / 2, ch * (rw ? .26 : .45), u * (rw ? 11 : 13), win ? '#ffe27a' : '#e0452f');
      if (rw && S.t > .5) {
        const r = S.rew, L = ['+' + r.xp + ' XP'];
        r.lv.forEach(x => L.push(x)); if (r.coins) L.push('+' + r.coins + ' ' + T('coins')); r.ess.forEach(x => L.push('+' + x));
        if (r.karma) L.push('Karma ' + (r.karma > 0 ? '+' : '') + r.karma);
        if (r.yy.yin) L.push('Yin +' + r.yy.yin); if (r.yy.yang) L.push('Yang +' + r.yy.yang);
        r.items.forEach(x => L.push(x)); if (r.secret) L.push(r.secret);
        const y0 = ch * .42, avail = ch * .95 - y0; let cols = 1, rows = L.length, step = Math.min(u * 5.2, avail / rows);
        if (step < u * 3.8) { cols = 2; rows = Math.ceil(L.length / 2); step = Math.min(u * 5.2, avail / rows); }
        L.forEach((s, i) => {
          const col = cols === 1 ? 0 : (i < rows ? 0 : 1), row = cols === 1 ? i : i % rows, x = cols === 1 ? cw / 2 : cw * (col ? .66 : .34);
          txt(c, s, x, y0 + row * step, step * .8, i && r.lv.indexOf(s) >= 0 || s === r.secret || r.items.indexOf(s) >= 0 ? '#ffe27a' : '#f4ecd8');
        });
      }
      if (S.t > outT() - .6) { c.fillStyle = 'rgba(0,0,0,' + clamp((S.t - outT() + .6) / .6, 0, 1) + ')'; c.fillRect(0, 0, cw, ch); }
    }
  };
  A.debug = function () { return S; }; // nur für Tests
  return A;
})();
