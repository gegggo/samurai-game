'use strict';
// Weltkampf (Phase A, 0.10.0): normale Gegner kämpfen direkt in der Welt, ohne Szenenwechsel.
// Aggro, Verfolgen, Angriff mit Vorwarnung, Ausweichen, Block/Parade, Spezial, 2 Skill-Plätze.
// Bosse und Schrein-Duelle bleiben in der Arena (combat.js, Phase B). Gegnerdaten, Moves, Belohnungen kommen aus combat-data.js / combat.js.
SW.WCombat = (function () {
  const W = SW.World, D = SW.Data, K = SW.Combat, TAU = 6.2832, SWING = .18, DODGE = .38, RAD = .28;
  const AGGRO = 5.5, LEASH = 13, GRACE = 2.5; // Tiefen in Kacheln; GRACE = Sekunden, die die Kampfbuttons nach dem letzten Gegner bleiben
  const X = { active: false };
  const held = { block: false, breath: false };
  const P = { ps: null, php: 1, pmax: 1, ki: 1, kmax: 1, pm: null, buf: null, chain: 0, chainT: 0, counterT: 0, block: false, blockT: 0, noBlockT: 1, parryOk: false,
    dodgeT: 0, dodgeCd: 0, invT: 0, hurt: 0, dx: 1, dy: 0, fa: 0, swing: 0, spark: 0, msg: '', msgT: 0, msgCol: '#fff', refT: 0, idle: 99, st: { heavy: 0, special: 0, counter: 0, parry: 0, dodge: 0, block: 0, breath: 0 } };
  const floats = [];
  const T = (k, n) => SW.t(k, n), $ = id => document.getElementById(id);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const def = s => D.enemies[s.type];
  const isBoss = s => !!(s.trial || (def(s) && def(s).phases)); // Arena-Gegner
  const reach = s => def(s).weapon === 'spear' ? 1.75 : 1.3;
  const kiCost = m => Math.ceil(m.ki * P.ps.kiCostMul);
  const freeAt = (x, y) => !W.solid(Math.floor(x - RAD), Math.floor(y - RAD)) && !W.solid(Math.floor(x + RAD), Math.floor(y - RAD)) && !W.solid(Math.floor(x - RAD), Math.floor(y + RAD)) && !W.solid(Math.floor(x + RAD), Math.floor(y + RAD));
  function say(t, col) { P.msg = t; P.msgCol = col || '#fff'; P.msgT = 1; }
  function flt(x, y, txt, col) { floats.push({ x, y, txt, col, t: 0 }); if (floats.length > 30) floats.shift(); }
  function foes() { return K.spots.filter(s => s.w && s.w.st !== 'dead'); }
  function nearest(maxd) {
    const p = SW.Player; let b = null, bd = maxd;
    foes().forEach(s => { if (s.w.st === 'return') return; const d = Math.hypot(s.x - p.x, s.y - p.y); if (d < bd) { bd = d; b = s; } });
    return b;
  }
  function refreshPs() {
    P.ps = K.playerStats(); const was = P.pmax; P.pmax = P.ps.hp; P.kmax = P.ps.ki;
    P.php = was === 1 ? P.pmax : Math.min(P.pmax, P.php); P.ki = Math.min(P.kmax, P.ki === 1 ? P.kmax : P.ki);
    if (P.ps.ranged) D.moves.shot = { wind: P.ps.ranged.wind, rec: P.ps.ranged.rec, dmg: P.ps.ranged.dmg, ranged: true, anim: 'shot' };
    [0, 1].forEach(i => {
      const b = $('cb-s' + i), id = SW.Skills.slots[i], on = !!(id && P.ps.slots[i]); // 2 Skill-Plätze: leer = Platzhalter für spätere Fähigkeiten
      if (b) { b.style.display = ''; b.textContent = on ? T('sk_' + id) : '–'; b.classList.toggle('empty', !on); }
    });
    { const rb = $('cb-ranged'); if (rb) rb.style.display = P.ps.ranged ? '' : 'none'; }
  }

  // ---------- Spieleraktionen ----------
  function startMove(name) {
    const m = D.moves[name], n = m.hits || 1, rec = Math.max(SWING + .04, m.rec * P.ps.recMul), t = nearest(3), p = SW.Player;
    P.fa = t ? Math.atan2(t.y - p.y, t.x - p.x) : p.face; // Auto-Ausrichtung auf den nächsten Gegner
    if (Math.abs(Math.cos(P.fa)) > .1) p.dir = Math.cos(P.fa) > 0 ? 1 : -1;
    P.pm = { name, m, t: 0, hitN: 0, n, rec, end: m.wind + (n - 1) * (m.gap || 0) + SWING };
    P.pm.dur = P.pm.end - SWING + rec;
    if (m.ki) P.ki -= kiCost(m);
    if (m.inv) P.invT = m.inv;
    if (name === 'heavy') P.st.heavy++; else if (name === 'counter') P.st.counter++; else if (m.ki) P.st.special++;
    if (name === 'counter') say(T('combat_counter'), '#ffe27a');
  }
  function act(kind) {
    if (!X.active || P.php <= 0) return;
    if (P.pm || P.hurt > 0 || P.dodgeT > 0) { P.buf = { kind, t: .25 }; return; }
    let name;
    if (kind === 'attack') { if (P.counterT > 0) { name = 'counter'; P.counterT = 0; } else if (P.chainT > 0 && P.chain < 3) name = 'quick'; else name = 'normal'; }
    else if (kind === 'heavy') name = 'heavy';
    else if (kind === 'special') { if (P.ki < kiCost(D.moves.special)) { say(T('combat_noki'), '#8cf'); return; } name = 'special'; }
    else if (kind === 's0' || kind === 's1') {
      name = P.ps.slots[+kind[1]]; if (!name) return;
      if (P.ki < kiCost(D.moves[name])) { say(T('combat_noki'), '#8cf'); return; }
    } else if (kind === 'ranged') { if (!P.ps.ranged) return; name = 'shot'; }
    else return;
    startMove(name);
  }
  function dodge() {
    if (!X.active || P.dodgeCd > 0 || P.hurt > 0 || P.php <= 0) return;
    if (P.pm && P.pm.t < P.pm.end) return;
    const v = SW.Input.vec, m = Math.hypot(v.x, v.y), t = nearest(6), p = SW.Player;
    if (m > .2) { P.dx = v.x / m; P.dy = v.y / m; }
    else if (t) { const d = Math.hypot(p.x - t.x, p.y - t.y) || 1; P.dx = (p.x - t.x) / d; P.dy = (p.y - t.y) / d; } // ohne Richtung: vom Gegner weg
    else { P.dx = -Math.cos(p.face); P.dy = -Math.sin(p.face); }
    P.pm = null; P.buf = null; P.chain = 0; P.dodgeT = DODGE; P.dodgeCd = .9 * P.ps.dodgeCdMul;
  }
  X.press = function (k) { if (k === 'block' || k === 'breath') held[k] = true; else if (k === 'dodge') dodge(); else act(k); };
  X.release = function (k) { if (k === 'block' || k === 'breath') held[k] = false; };

  function playerHit(pm) {
    const m = pm.m, nm = pm.name, p = SW.Player, ps = P.ps;
    if (m.heal) { const h = Math.round(P.pmax * m.heal); P.php = Math.min(P.pmax, P.php + h); flt(p.x, p.y, '+' + h, '#7fe08a'); return; }
    const heavyish = nm === 'heavy' || nm === 'special' || nm === 'counter' || !!m.guardBreak || m.dmg >= 30;
    const R = m.ranged ? 7 : nm === 'special' ? 1.9 : 1.6, cone = m.ranged ? .45 : nm === 'special' ? 1.9 : 1.25; // Reichweite in Kacheln, halber Winkel in rad
    const targets = K.spots.filter(s => {
      if (!s.w || s.w.st === 'dead' || s.w.st === 'return') return false;
      const dx = s.x - p.x, dy = s.y - p.y, d = Math.hypot(dx, dy); if (d > R) return false;
      let da = Math.abs(Math.atan2(dy, dx) - P.fa); if (da > Math.PI) da = TAU - da;
      return d < .8 || da <= cone;
    });
    if (m.ranged && targets.length > 1) targets.sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y)).length = 1;
    targets.forEach(s => {
      const w = s.w, d = def(s);
      let dmg = m.dmg * ps.atk;
      if (nm === 'counter') dmg *= ps.counterMul;
      if (w.st === 'wind') dmg *= 1 + ps.ambush;
      if (w.guarding && nm !== 'counter' && !m.ignoreGuard) {
        if (m.ranged) dmg *= .5;
        else if (m.guardBreak || nm === 'special') { w.guarding = false; w.st = 'stagger'; w.t = 0; w.dur = .9; w.hits = 0; say(T('combat_guard_break'), '#ffd27a'); }
        else dmg *= .25;
      } else if (d.armor && !heavyish) dmg *= 1 - d.armor;
      if (w.st === 'rec' || w.st === 'stagger') dmg *= 1.3;
      const crit = Math.random() < ps.crit; if (crit) dmg *= ps.critMul || 1.5;
      dmg = Math.max(1, Math.round(dmg));
      w.hp -= dmg; w.flash = .1; if (!m.ranged) P.ki = Math.min(P.kmax, P.ki + 4);
      flt(s.x, s.y - 1.2, dmg + (crit ? '!' : ''), crit ? '#ff9a3c' : heavyish ? '#ffd27a' : '#fff');
      if (heavyish && w.st === 'wind' && !(w.atk && w.atk.unblock)) { w.st = 'stagger'; w.t = 0; w.dur = .6; w.hits = 0; }
      if (heavyish) push(s, .35);
      if (w.hp <= 0) kill(s);
    });
  }
  function push(s, dist) { // Gegner leicht vom Spieler wegstoßen
    const p = SW.Player, dx = s.x - p.x, dy = s.y - p.y, d = Math.hypot(dx, dy) || 1, nx = s.x + dx / d * dist, ny = s.y + dy / d * dist;
    if (freeAt(nx, s.y)) s.x = nx; if (freeAt(s.x, ny)) s.y = ny;
  }
  function kill(s) {
    s.w.st = 'dead'; s.dead = true;
    const r = K.grant(s, P.st);
    P.st = { heavy: 0, special: 0, counter: 0, parry: 0, dodge: 0, block: 0, breath: 0 };
    const L = [T('combat_victory'), '+' + r.xp + ' XP'];
    r.lv.forEach(x => L.push(x)); if (r.coins) L.push('+' + r.coins + ' ' + T('coins')); r.ess.forEach(x => L.push('+' + x));
    if (r.karma) L.push('Karma ' + (r.karma > 0 ? '+' : '') + r.karma);
    r.items.forEach(x => L.push(x)); if (r.secret) L.push(r.secret);
    if (SW.UI && SW.UI.banner) SW.UI.banner(L.join(' · '));
    s.w = null;
    SW.Save.touch();
  }

  // ---------- Gegner ----------
  function foeIdle(s) {
    const w = s.w, d = def(s); w.st = 'idle'; w.t = 0; w.wait = rnd(d.gap[0], d.gap[1]);
    w.guarding = Math.random() < d.guard; if (w.guarding) w.wait = Math.max(w.wait, 1.1);
  }
  function hurtPlayer(dmg, blocked, s) {
    P.php -= dmg; flt(SW.Player.x, SW.Player.y - 1, '-' + Math.max(1, Math.round(dmg)), blocked ? '#9cf' : '#ff6a5a');
    if (!blocked) { P.hurt = .3; if (P.pm && !P.pm.hitN) P.pm = null; P.buf = null; const p = SW.Player, dx = p.x - s.x, dy = p.y - s.y, d = Math.hypot(dx, dy) || 1; p.push(dx / d * .35, dy / d * .35); }
    if (P.php <= 0) die();
  }
  function strike(s) {
    const w = s.w, A = w.atk, d = def(s), ps = P.ps, p = SW.Player;
    w.sw = SWING; w.hits--;
    const dist = Math.hypot(p.x - s.x, p.y - s.y), dmg = Math.max(1, A.dmg * (d.dmg || 1) - ps.def);
    if (dist > reach(s) + .45) { /* Fehlschlag: Spieler ist außer Reichweite */ }
    else if (P.dodgeT > 0 || P.invT > 0) { say(T('combat_dodge_ok'), '#cfe'); P.ki = Math.min(P.kmax, P.ki + 3); P.st.dodge++; }
    else if (P.block && !A.unblock && P.parryOk && P.blockT <= ps.parry) {
      P.st.parry++; w.st = 'stagger'; w.t = 0; w.dur = 1.1; w.hits = 0; P.counterT = 1.4; P.ki = Math.min(P.kmax, P.ki + 8); P.spark = .25; say(T('combat_parry'), '#ffe27a');
      return;
    } else if (P.block && !A.unblock) { P.spark = .12; P.st.block++; hurtPlayer(dmg * (A.block !== undefined ? A.block : .2) * ps.blockMul / .2, true, s); }
    else hurtPlayer(dmg, false, s);
    if (P.php <= 0) return;
    const sp = d.speed || 1;
    if (w.hits > 0) { w.t = 0; w.dur = (A.gap || .3) / sp; } else { w.st = 'rec'; w.t = 0; w.dur = A.rec / sp; }
  }
  function die() {
    P.php = 0;
    K.spots.forEach(s => { if (s.w) { if (s.amb) s.dead = true; else { s.x = s.w.hx; s.y = s.w.hy; } s.w = null; } });
    const p = SW.Player; p.x = W.spawn.x; p.y = W.spawn.y; SW.cam.x = p.x; SW.cam.y = p.y;
    P.pm = null; P.buf = null; P.dodgeT = 0; P.hurt = 0; P.block = false; held.block = held.breath = false; X.active = false; P.idle = 99;
    P.php = P.pmax; P.ki = P.kmax;
    if (SW.UI && SW.UI.banner) SW.UI.banner(T('combat_defeat'));
    SW.Save.save();
  }
  function moveFoe(s, tx, ty, sp, dt) {
    const dx = tx - s.x, dy = ty - s.y, d = Math.hypot(dx, dy); if (d < .01) return;
    const k = Math.min(d, sp * dt) / d, nx = s.x + dx * k, ny = s.y + dy * k;
    if (freeAt(nx, s.y)) s.x = nx; if (freeAt(s.x, ny)) s.y = ny;
    K.spots.forEach(o => { if (o !== s && o.w && o.w.st !== 'dead') { const ex = s.x - o.x, ey = s.y - o.y, ed = Math.hypot(ex, ey); if (ed < .7 && ed > .001) { const a = s.x + ex / ed * .6 * dt * 3, b = s.y + ey / ed * .6 * dt * 3; if (freeAt(a, s.y)) s.x = a; if (freeAt(s.x, b)) s.y = b; } } });
  }
  function foeUpdate(s, dt) {
    const p = SW.Player, d = def(s); let w = s.w;
    const dist = Math.hypot(p.x - s.x, p.y - s.y);
    if (!w) {
      if (dist > (s.amb ? 8 : AGGRO) || P.php <= 0) return;
      w = s.w = { hp: d.hp, max: d.hp, st: 'chase', t: 0, dur: 1, wait: 1, atk: null, hits: 0, guarding: false, flash: 0, sw: 0, hx: s.x, hy: s.y, dir: 1 };
    }
    w.flash = Math.max(0, w.flash - dt); w.sw = Math.max(0, w.sw - dt); w.t += dt;
    if (Math.abs(p.x - s.x) > .05) w.dir = p.x > s.x ? 1 : -1;
    const hd = Math.hypot(s.x - w.hx, s.y - w.hy), sp = 2.6 * (d.speed || 1), r = reach(s);
    if (w.st === 'return') {
      moveFoe(s, w.hx, w.hy, 4, dt);
      if (hd < .3) { s.x = w.hx; s.y = w.hy; s.w = null; } // zu Hause: voll geheilt
      else if (dist < AGGRO * .7 && P.php > 0) { w.st = 'chase'; w.t = 0; }
      return;
    }
    if (!s.amb && (hd > LEASH || dist > LEASH * .8) && w.st !== 'wind') { w.st = 'return'; return; }
    if (w.st === 'chase') {
      if (dist > r * .85) moveFoe(s, p.x, p.y, sp, dt); else foeIdle(s);
    } else if (w.st === 'idle') {
      if (dist > r + .6) { w.st = 'chase'; return; }
      if (w.t >= w.wait && dist <= r + .5) {
        const list = d.atk, A = D.attacks[list[(Math.random() * list.length) | 0]];
        w.atk = A; w.hits = A.hits || 1; w.st = 'wind'; w.t = 0; w.dur = A.wind / (d.speed || 1); w.guarding = false;
      }
    } else if (w.st === 'wind') { if (w.t >= w.dur) strike(s); }
    else if (w.t >= w.dur) foeIdle(s);
  }

  // ---------- Update ----------
  X.update = function (dt) {
    if (K.active || (SW.Trials && SW.Trials.active)) { held.block = held.breath = false; X.active = false; return; }
    const p = SW.Player;
    if (!P.ps) refreshPs();
    const spots = K.spots; let engaged = false;
    for (let i = 0; i < spots.length; i++) {
      const s = spots[i];
      if (s.dead || isBoss(s) || !K.on(s)) { if (s.w) { s.w = null; } continue; }
      if (!s.w && (Math.abs(s.x - p.x) > 14 || Math.abs(s.y - p.y) > 14)) continue;
      foeUpdate(s, dt);
      if (s.w && s.w.st !== 'return') engaged = true;
      if (P.php <= 0) return;
    }
    if (engaged) { if (!X.active) { refreshPs(); X.active = true; } P.idle = 0; }
    else { P.idle += dt; if (X.active && P.idle > GRACE) { X.active = false; held.block = held.breath = false; P.pm = null; P.buf = null; } }
    if (!X.active) { // außerhalb des Kampfs: Leben und Ki füllen sich wieder
      P.refT += dt; if (P.refT > 1) { P.refT = 0; refreshPs(); }
      P.php = Math.min(P.pmax, P.php + P.pmax * .25 * dt); P.ki = Math.min(P.kmax, P.ki + P.kmax * .5 * dt);
      p.mul = 1; return;
    }
    const ps = P.ps;
    P.invT = Math.max(0, P.invT - dt); P.dodgeCd = Math.max(0, P.dodgeCd - dt); P.dodgeT = Math.max(0, P.dodgeT - dt); P.hurt = Math.max(0, P.hurt - dt);
    P.chainT = Math.max(0, P.chainT - dt); P.counterT = Math.max(0, P.counterT - dt); P.swing = Math.max(0, P.swing - dt); P.spark = Math.max(0, P.spark - dt); P.msgT = Math.max(0, P.msgT - dt);
    if (P.buf) { P.buf.t -= dt; if (P.buf.t <= 0) P.buf = null; }
    if (P.dodgeT > 0) p.push(P.dx * 7 * dt, P.dy * 7 * dt); // Ausweichrolle
    if (P.pm) {
      const pm = P.pm; pm.t += dt;
      while (pm.hitN < pm.n && pm.t >= pm.m.wind + pm.hitN * (pm.m.gap || 0)) { pm.hitN++; P.swing = SWING; playerHit(pm); if (!P.pm) return; }
      if (pm.t >= pm.dur) {
        P.pm = null;
        if (pm.name === 'normal') { P.chain = 1; P.chainT = .55; } else if (pm.name === 'quick') { P.chain++; P.chainT = .55; } else P.chain = 0;
      }
    }
    if (held.block && P.pm && P.pm.t >= P.pm.end) { P.pm = null; P.chain = 0; }
    if (!P.pm && P.buf && P.hurt <= 0 && P.dodgeT <= 0) { const b = P.buf; P.buf = null; act(b.kind); }
    const want = held.block && !P.pm && P.dodgeT <= 0 && P.hurt <= 0;
    if (want && !P.block) { P.parryOk = P.noBlockT >= .35; P.blockT = 0; }
    if (want) { P.blockT += dt; P.noBlockT = 0; } else P.noBlockT += dt;
    P.block = want;
    const moving = Math.hypot(SW.Input.vec.x, SW.Input.vec.y) > .15;
    const breath = held.breath && !want && !P.pm && P.dodgeT <= 0 && P.hurt <= 0 && !moving;
    if (breath) P.st.breath += dt;
    P.ki = Math.min(P.kmax, P.ki + (ps.kiRegen + (breath ? 22 * ps.breathMul : 0)) * dt);
    p.mul = P.dodgeT > 0 ? 0 : P.hurt > 0 ? .3 : P.pm ? .25 : P.block ? .5 : 1;
    for (let i = floats.length - 1; i >= 0; i--) { floats[i].t += dt; if (floats[i].t > 1) floats.splice(i, 1); }
  };
  X.sync = function () { document.body.classList.toggle('wcombat', X.active && !SW.paused && !K.active); };

  // ---------- Darstellung (Überlagerung über der Welt) ----------
  function bar(c, x, y, w, h, r, col) { c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(x - 1, y - 1, w + 2, h + 2); c.fillStyle = col; c.fillRect(x, y, w * clamp(r, 0, 1), h); }
  X.draw = function (c, cw, ch) {
    if (K.active || (SW.Trials && SW.Trials.active)) return;
    const R = SW.Render, u = R.tile || 40, cam = SW.cam, p = SW.Player, ox = Math.round(cw / 2 - cam.x * u), oy = Math.round(ch / 2 - cam.y * u);
    const px = p.x * u + ox, py = (p.y + .3) * u + oy;
    c.save();
    if (X.active && P.ps) {
      if (P.swing > 0) { // Schlagbogen
        const q = 1 - P.swing / SWING, a0 = P.fa - 1.1 + q * 2.2, big = P.pm && P.pm.name === 'special';
        c.strokeStyle = big ? 'rgba(127,208,255,.9)' : 'rgba(255,255,255,.85)'; c.lineWidth = u * (big ? .14 : .09); c.lineCap = 'round';
        c.beginPath(); c.arc(px, py - u * .5, u * (big ? 1.5 : 1.15), a0 - .5, a0); c.stroke();
      }
      if (P.block || P.spark > 0) { c.strokeStyle = P.spark > 0 ? 'rgba(255,226,122,.95)' : 'rgba(156,204,255,.7)'; c.lineWidth = u * .08; c.beginPath(); c.arc(px, py - u * .5, u * .75, P.fa - .9, P.fa + .9); c.stroke(); }
      if (P.dodgeT > 0) { c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.ellipse(px, py - u * .45, u * .35, u * .6, 0, 0, TAU); c.fill(); }
      floats.forEach(f => { c.globalAlpha = 1 - f.t; c.fillStyle = f.col; c.font = '700 ' + Math.round(u * .42) + 'px sans-serif'; c.textAlign = 'center'; c.fillText(f.txt, f.x * u + ox, (f.y + .3) * u + oy - f.t * u * .9); });
      c.globalAlpha = 1;
      // Anzeigen: Leben und Ki oben Mitte
      const bw = Math.min(cw * .3, u * 7), bx = cw / 2 - bw / 2, by = Math.round(u * .3), bh = Math.max(6, Math.round(u * .2));
      bar(c, bx, by, bw, bh, P.php / P.pmax, '#c8453a'); bar(c, bx, by + bh + 4, bw, Math.round(bh * .7), P.ki / P.kmax, '#5aa8e0');
      if (P.msgT > 0) { c.globalAlpha = clamp(P.msgT * 2, 0, 1); c.fillStyle = P.msgCol; c.font = '700 ' + Math.round(u * .5) + 'px Georgia, serif'; c.textAlign = 'center'; c.fillText(P.msg, cw / 2, by + bh * 2 + u * 1.2); c.globalAlpha = 1; }
    }
    c.restore();
  };
  X.pose = function () { return P; }; // nur für Tests
  window.addEventListener('keydown', e => {
    if (!X.active || K.active || SW.paused) return; const k = e.key.toLowerCase();
    if (k === ' ') { held.block = true; e.preventDefault(); } else if (k === 'b') held.breath = true;
    else if (e.repeat) return;
    else if (k === 'j') act('attack'); else if (k === 'k') act('heavy'); else if (k === 'l') act('special'); else if (k === 'u') act('s0'); else if (k === 'i') act('s1'); else if (k === 'h') act('ranged');
    else if (k === 'x' || k === 'shift') dodge();
  });
  window.addEventListener('keyup', e => { const k = e.key.toLowerCase(); if (k === ' ') held.block = false; else if (k === 'b') held.breath = false; });
  return X;
})();
