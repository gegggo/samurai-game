'use strict';
// Kampfsystem (Phase 2): Arena-Duell in Ego-Perspektive, Gegner-KI, Bossphasen.
// Einzelduell. Mehrgegnerkämpfe folgen später (S.foe wird dann zur Liste).
SW.Combat = (function () {
  const W = SW.World, D = SW.Data, TAU = 6.2832, PARRY = .22, DODGE = .38, SWING = .18;
  const K = { active: false, spots: [] };
  const held = { block: false, breath: false };
  let S = null, bgc = null, bgk = '';
  const $ = id => document.getElementById(id), T = (k, n) => SW.t(k, n);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => t * t * (3 - 2 * t);
  const R = i => { const s = Math.sin(i * 12.9898) * 43758.5453; return s - Math.floor(s); };
  const ph = () => S.def.phases ? S.def.phases[S.phase] : S.def;

  // ---------- Begegnungen in der Welt ----------
  function free(x, y) {
    for (let r = 0; r < 40; r++) {
      const n = r ? r * 8 : 1;
      for (let a = 0; a < n; a++) {
        const g = a / n * TAU, px = Math.floor(x + Math.cos(g) * r), py = Math.floor(y + Math.sin(g) * r);
        if (!W.solid(px, py) && !W.solid(px + 1, py) && !W.solid(px, py + 1) && !W.solid(px - 1, py)) return { x: px + .5, y: py + .5 };
      }
    }
    return { x, y };
  }
  D.spots.forEach(s => { const p = free(s.x, s.y); K.spots.push({ id: s.id, type: s.type, x: p.x, y: p.y, dead: false, night: !!s.night, respawn: !!s.respawn, kv: s.kv, tier: s.tier }); });

  // 0.11.0: jeder Schrein hat mindestens 2 Wächter in 22 Kacheln (fehlende werden ergänzt, feste IDs g_<schrein>_<n>, gespeichert wie alle Gegner)
  (function () {
    const light = ['bandit', 'ronin', 'spearman'], mid = ['ronin', 'swift', 'spearman', 'samurai'], hard = ['samurai', 'armored', 'swift', 'spearman'];
    (SW.Data.shrines || []).forEach((sh, si) => {
      const c = free(sh.x, sh.y);
      let have = K.spots.filter(e => !e.night && !e.amb && Math.hypot(e.x - c.x, e.y - c.y) < 22).length;
      const reg = W.regionAt(Math.floor(c.x), Math.floor(c.y)), L = (reg >= 12 || reg === 5 || reg === 8 || reg === 16) ? hard : (reg === 0 || reg === 1 || reg === 3) ? light : mid;
      for (let n = 1; have < 2; n++, have++) {
        const g = (si * 2.4 + n * 3.1) % TAU, p = free(c.x + Math.cos(g) * 6, c.y + Math.sin(g) * 6);
        K.spots.push({ id: 'g_' + sh.id + '_' + n, type: L[(si + n) % L.length], x: p.x, y: p.y, dead: false, night: false, respawn: false, kv: undefined, tier: sh.tier });
      }
    });
  })();

  K.playerStats = function () { return SW.Char ? SW.Char.combat() : D.player; }; // echte Charakterwerte (Phase 3)

  // Nachtgegner: nur nachts aktiv; wiederkehrende kommen mit jeder neuen Nacht zurück
  K.on = s => !s.dead && (!s.night || SW.Time.period() === 'night') && (s.kv === undefined || SW.Karma.v <= s.kv); // kv: Kopfgeldjäger erscheinen bei schlechtem Ruf
  // Schattenclan-Hinterhalt (Phase 8, wie die Yiga in BOTW): bei Karma <= -30 spawnt nach einer Wegstrecke ein Angreifer nahe dem Spieler und läuft auf ihn zu.
  // Bleibt bis zum Tod eines der beiden, auch wenn das Karma wieder steigt. Weicht der Spieler > 12 Kacheln aus (Flucht, Hängenbleiben), teleportiert er sich neben ihn; Schnellreise (Sprung > 5 Kacheln pro Bild) lässt ihn verschwinden. Nicht gespeichert, keine Karma-Belohnung. Schlechterer Ruf (<= -70) = kürzere Abstände.
  const AMB = { walked: 0, next: 160, last: null, t: 0 };
  function ambush(p) {
    const dt = Math.min(.05, (performance.now() - AMB.t) / 1000); AMB.t = performance.now();
    let a = K.spots.find(s => s.amb);
    const jump = AMB.last ? Math.hypot(p.x - AMB.last.x, p.y - AMB.last.y) : 0, moved = jump; AMB.last = { x: p.x, y: p.y };
    if (a) {
      const d = Math.hypot(p.x - a.x, p.y - a.y);
      if (a.dead || jump > 5) { K.spots.splice(K.spots.indexOf(a), 1); AMB.walked = 0; AMB.next = rnd(SW.Karma.v <= -70 ? 70 : 110, SW.Karma.v <= -70 ? 130 : 200); return; }
      if (d > 12) { const g = rnd(0, TAU), q = free(p.x + Math.cos(g) * 8, p.y + Math.sin(g) * 8); if (Math.hypot(q.x - p.x, q.y - p.y) >= 4) { a.x = q.x; a.y = q.y; } return; }
      const sp = 3.2 * dt, nx = a.x + (p.x - a.x) / d * sp, ny = a.y + (p.y - a.y) / d * sp;
      if (!W.solid(Math.floor(nx), Math.floor(a.y))) a.x = nx;
      if (!W.solid(Math.floor(a.x), Math.floor(ny))) a.y = ny;
      return;
    }
    if (SW.Karma.v > -30) return;
    AMB.walked += Math.min(1, moved); // Schnellreise/Sprünge zählen höchstens 1 Kachel
    if (AMB.walked < AMB.next) return;
    const g = rnd(0, TAU), q = free(p.x + Math.cos(g) * 8, p.y + Math.sin(g) * 8);
    if (Math.hypot(q.x - p.x, q.y - p.y) < 4) return; // kein freier Platz in der Nähe: später erneut
    K.spots.push({ id: 'amb', type: 'shadow', x: q.x, y: q.y, dead: false, night: false, respawn: false, amb: true });
    if (SW.UI && SW.UI.banner) SW.UI.banner(T('amb_warn'));
  }
  // Index id -> Gegnerpunkt (Quests/Speichern); neu aufgebaut, wenn sich die Anzahl ändert. shortcut: Tausch gleicher Länge (amb) wird nicht bemerkt, amb wird nie per ID gesucht.
  let IDX = null, IDXN = -1;
  K.spot = id => { if (!IDX || IDXN !== K.spots.length) { IDX = new Map(); K.spots.forEach(e => IDX.set(e.id, e)); IDXN = K.spots.length; } return IDX.get(id) || null; };
  const TM = { hp: 1, dmg: 1, xp: 1, coins: 1 };
  K.tm = s => (D.balance.tierMul || {})[s && s.tier] || TM; // Multiplikatoren je Gegner-Tier (data/balance.json)
  K.boss = s => !!(s.trial || (D.enemies[s.type] && D.enemies[s.type].phases)); // Arena-Gegner (Boss/Schrein-Duell)
  K.check = function (p) {
    if (K.active) return;
    ambush(p);
    const nt = SW.Time.period() === 'night';
    if (nt && !K.wasNight) K.spots.forEach(s => { if (s.respawn) s.dead = false; });
    K.wasNight = nt;
    for (let i = 0; i < K.spots.length; i++) {
      const s = K.spots[i];
      if (K.boss(s) && K.on(s) && Math.hypot(s.x - p.x, s.y - p.y) < 1.6) { K.start(s); return; } // normale Gegner: Weltkampf (worldcombat.js)
    }
  };

  K.start = function (spot) {
    if (SW.Arena && SW.Arena.start) { SW.Arena.start(spot); return; } // 0.11.0: Boss-Arena in Pseudo-3D (arena3d.js); altes Duell bleibt als Rückfall unten
    const def = D.enemies[spot.type], ps = K.playerStats(), reg = W.regionAt(Math.floor(spot.x), Math.floor(spot.y));
    S = {
      ps, spot, def, arena: def.arena || D.regionArena[reg], hp: Math.round(def.hp * K.tm(spot).hp), max: Math.round(def.hp * K.tm(spot).hp), php: ps.hp, pmax: ps.hp, ki: ps.ki, kmax: ps.ki,
      st: { heavy: 0, special: 0, counter: 0, parry: 0, dodge: 0, block: 0, breath: 0 }, rew: null, invT: 0,
      state: 'intro', t: 0, phase: 0, pm: null, buf: null, chain: 0, chainT: 0,
      block: false, blockT: 0, noBlockT: 1, parryOk: false, bl: 0, dodgeT: 0, dodgeCd: 0, side: 1,
      breath: false, counterT: 0, hurt: 0, shake: 0, msg: '', msgT: 0, msgCol: '#fff', floats: [], fswing: 0, spark: 0,
      foe: { st: 'idle', t: 0, dur: 1, wait: 1.3, guarding: false, atk: null, hits: 0, flash: 0 }
    };
    held.block = held.breath = false;
    if (ps.ranged) D.moves.shot = { wind: ps.ranged.wind, rec: ps.ranged.rec, dmg: ps.ranged.dmg, ranged: true, anim: 'shot' };
    { const rb = $('cb-ranged'); if (rb) rb.style.display = ps.ranged ? '' : 'none'; }
    [0, 1].forEach(i => {
      const b = $('cb-s' + i), id = SW.Skills.slots[i];
      if (b) { const on = !!(id && ps.slots[i]); b.style.display = on ? '' : 'none'; b.textContent = on ? T('sk_' + id) : ''; }
    });
    K.active = true; SW.paused = true; SW.Input.reset();
    document.body.classList.add('combat');
  };

  function end() {
    const won = S.state === 'win';
    if (!won && S.spot.amb) S.spot.dead = true; // Spieler besiegt: Angreifer ist fertig, wird beim nächsten check entfernt
    if (!won) { const P = SW.Player; P.x = W.spawn.x; P.y = W.spawn.y; SW.cam.x = P.x; SW.cam.y = P.y; }
    S = null; K.active = false; SW.paused = false; held.block = held.breath = false;
    SW.Input.reset(); document.body.classList.remove('combat');
    SW.Save.save();
  }
  const outT = () => S.state === 'win' ? 5.5 : 2.4;

  function say(txt, col) { S.msg = txt; S.msgCol = col || '#fff'; S.msgT = 1.1; }
  function flt(txt, col) { S.floats.push({ x: .5 + rnd(-.08, .08), t: 0, txt, col }); }

  // ---------- Spieleraktionen ----------
  const kiCost = m => Math.ceil(m.ki * S.ps.kiCostMul);
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
    if (S.pm && S.pm.t < S.pm.end) return; // nicht mitten aus dem Schlag heraus
    { const kc = Math.ceil(D.dodgeKi * S.ps.kiCostMul); if (S.ki < kc) { say(T('combat_noki'), '#8cf'); return; } S.ki -= kc; }
    S.pm = null; S.buf = null; S.chain = 0; S.dodgeT = DODGE; S.dodgeCd = .9 * S.ps.dodgeCdMul; S.side = -S.side; S.breath = false;
  }

  function playerHit(pm) {
    const m = pm.m, f = S.foe, ps = S.ps, nm = pm.name;
    if (m.heal) { const h = Math.round(S.pmax * m.heal); S.php = Math.min(S.pmax, S.php + h); flt('+' + h, '#7fe08a'); return; }
    const heavyish = nm === 'heavy' || nm === 'special' || nm === 'counter' || !!m.guardBreak || m.dmg >= 30;
    let dmg = m.dmg * ps.atk;
    if (nm === 'counter') dmg *= ps.counterMul;
    if (f.st === 'wind') dmg *= 1 + ps.ambush;
    if (f.guarding && nm !== 'counter' && !m.ignoreGuard) {
      if (m.ranged) dmg *= .5; // Geschosse durchdringen die Deckung nur halb
      else if (m.guardBreak || nm === 'special') { f.guarding = false; f.st = 'stagger'; f.t = 0; f.dur = .9; f.hits = 0; say(T('combat_guard_break'), '#ffd27a'); }
      else dmg *= .25;
    } else if (S.def.armor && !heavyish) dmg *= 1 - S.def.armor;
    if (f.st === 'rec' || f.st === 'stagger') dmg *= 1.3;
    const crit = Math.random() < ps.crit; if (crit) dmg *= ps.critMul || 1.5;
    dmg = Math.max(1, Math.round(dmg));
    S.hp -= dmg; f.flash = .1; if (!m.ranged) S.ki = Math.min(S.kmax, S.ki + 4); // Fernkampf lädt kein Ki auf
    flt(dmg + (crit ? '!' : ''), crit ? '#ff9a3c' : heavyish ? '#ffd27a' : '#fff');
    if (heavyish && f.st === 'wind' && !(f.atk && f.atk.unblock)) { f.st = 'stagger'; f.t = 0; f.dur = .6; f.hits = 0; }
    if (S.hp <= 0) { S.hp = 0; S.state = 'win'; S.t = 0; S.spot.dead = true; S.pm = null; reward(); return; }
    if (S.def.phases) {
      const r = S.hp / S.max; let n = S.phase;
      while (n + 1 < S.def.phases.length && r <= S.def.phases[n + 1].at) n++;
      if (n > S.phase) { S.phase = n; f.st = 'stagger'; f.t = 0; f.dur = 1.2; f.hits = 0; f.guarding = false; say(T('combat_phase', n + 1), '#ff7a5a'); S.shake = .4; }
    }
  }

  // ---------- Gegner-KI ----------
  function foeIdle() {
    const f = S.foe, p = ph();
    f.st = 'idle'; f.t = 0; f.wait = rnd(p.gap[0], p.gap[1]);
    f.guarding = Math.random() < p.guard;
    if (f.guarding) f.wait = Math.max(f.wait, 1.1);
  }
  function hurtPlayer(dmg, blocked) {
    S.php -= dmg; flt('-' + Math.max(1, Math.round(dmg)), blocked ? '#9cf' : '#ff6a5a');
    if (blocked) S.shake = Math.max(S.shake, .12);
    else { S.hurt = .3; S.shake = .3; if (S.pm && !S.pm.hitN) S.pm = null; S.buf = null; S.breath = false; }
    if (S.php <= 0) { S.php = 0; S.state = 'lose'; S.t = 0; S.pm = null; }
  }
  function foeStrike() {
    const f = S.foe, A = f.atk, ps = S.ps, p = ph();
    S.fswing = SWING; f.hits--;
    const dmg = Math.max(1, A.dmg * (S.def.dmg || 1) * K.tm(S.spot).dmg - ps.def);
    if (S.dodgeT > 0 || S.invT > 0) { say(T('combat_dodge_ok'), '#cfe'); S.ki = Math.min(S.kmax, S.ki + 3); S.st.dodge++; }
    else if (S.block && !A.unblock && S.parryOk && S.blockT <= ps.parry) {
      S.st.parry++;
      f.st = 'stagger'; f.t = 0; f.dur = 1.1; f.hits = 0; S.counterT = 1.4;
      S.ki = Math.min(S.kmax, S.ki + 8); S.spark = .25; S.shake = .15; say(T('combat_parry'), '#ffe27a');
      return;
    } else if (S.block && !A.unblock) { S.spark = .12; S.st.block++; hurtPlayer(dmg * (A.block !== undefined ? A.block : .2) * ps.blockMul / .2, true); }
    else hurtPlayer(dmg, false);
    if (S.state !== 'fight') return;
    if (f.hits > 0) { f.t = 0; f.dur = (A.gap || .3) / p.speed; } else { f.st = 'rec'; f.t = 0; f.dur = A.rec / p.speed; }
  }

  // ---------- Belohnungen (Phase 3): jedes System bekommt nur seinen Teil ----------
  function reward() {
    if (S.spot.trial) { const o = SW.Trials.duelWon(S.spot.trial); Object.assign(o, { coins: 0, items: [], karma: 0, secret: null }); S.rew = o; SW.Save.touch(); return; } // Schrein-Duell: nur Prüfungsbelohnung, keine Münzen/Beute
    S.rew = grant(S.spot, S.st); SW.Save.touch();
  }
  // Belohnung für einen besiegten Gegner (Arena und Weltkampf): spot = Gegnerpunkt, st = Kampfstatistik für Yin/Yang
  function grant(spot, st) {
    const R = D.rewards[spot.type] || { xp: 10 }, C = SW.Char, xp = Math.round(R.xp * K.tm(spot).xp), out = { xp, coins: 0, items: [], ess: [], karma: 0, secret: null, lv: [], yy: { yin: 0, yang: 0 } };
    out.lv = C.addXp(xp);
    out.coins = SW.Inv.addCoins(Math.round(SW.Inv.coinDrop(spot.type) * K.tm(spot).coins));
    const dr = D.drops && D.drops[spot.id]; if (dr && SW.Inv.add(dr, 1)) out.items.push(T('drop_got', T('it_' + dr)));
    if (spot.amb && Math.random() < .1 && SW.Inv.add('katana_shadow', 1)) out.items.push(T('drop_wpn', T('it_katana_shadow'))); // Schattenclan: 10 % Waffe
    if (R.ess && !spot.respawn && SW.Essence.add(R.ess)) out.ess.push(R.ess + ' ' + T('ess')); // wiederkehrende Nachtgegner geben keine Essence (kein Farmen)
    if (R.karma) out.karma = SW.Karma.add('foe_' + spot.type, R.karma);
    if (R.secret && SW.Skills.award(R.secret)) out.secret = T('secret_got', T('sk_' + R.secret));
    out.yy = SW.YinYang.fromCombat(st);
    SW.Save.touch();
    return out;
  }
  K.grant = grant;

  // ---------- Update ----------
  function fight(dt) {
    const ps = S.ps, f = S.foe, p = ph();
    S.invT = Math.max(0, S.invT - dt);
    S.dodgeCd = Math.max(0, S.dodgeCd - dt); S.dodgeT = Math.max(0, S.dodgeT - dt); S.hurt = Math.max(0, S.hurt - dt);
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
    if (held.block && S.pm && S.pm.t >= S.pm.end) { S.pm = null; S.chain = 0; } // Block beendet Erholung
    if (!S.pm && S.buf && S.hurt <= 0 && S.dodgeT <= 0) { const b = S.buf; S.buf = null; act(b.kind); }
    const want = held.block && !S.pm && S.dodgeT <= 0 && S.hurt <= 0;
    if (want && !S.block) { S.parryOk = S.noBlockT >= .35; S.blockT = 0; }
    if (want) { S.blockT += dt; S.noBlockT = 0; } else S.noBlockT += dt;
    S.block = want; S.bl = clamp(S.bl + (want ? 1 : -1) * dt * 9, 0, 1);
    S.breath = !want && !S.pm && S.dodgeT <= 0 && S.hurt <= 0;
    if (S.breath) S.st.breath += dt;
    S.ki = Math.min(S.kmax, S.ki + (ps.kiRegen + (S.breath ? 22 * ps.breathMul : 0)) * dt);

    f.flash = Math.max(0, f.flash - dt); S.fswing = Math.max(0, S.fswing - dt); f.t += dt;
    if (f.st === 'idle') {
      if (f.t >= f.wait) {
        const list = p.atk, A = D.attacks[list[(Math.random() * list.length) | 0]];
        f.atk = A; f.hits = A.hits || 1; f.st = 'wind'; f.t = 0; f.dur = A.wind / p.speed; f.guarding = false;
      }
    } else if (f.st === 'wind') { if (f.t >= f.dur) foeStrike(); }
    else if (f.t >= f.dur) foeIdle();
  }

  K.update = function (dt) {
    if (SW.Arena && SW.Arena.active) { SW.Arena.update(dt); return; }
    if (!S) return;
    S.t += dt;
    S.shake = Math.max(0, S.shake - dt); S.spark = Math.max(0, S.spark - dt); S.msgT = Math.max(0, S.msgT - dt);
    for (let i = S.floats.length - 1; i >= 0; i--) { S.floats[i].t += dt; if (S.floats[i].t > 1) S.floats.splice(i, 1); }
    if (S.state === 'intro') { if (S.t > 1.3) { S.state = 'fight'; S.t = 0; } return; }
    if (S.state === 'win' || S.state === 'lose') { if (S.t > outT()) end(); return; }
    fight(dt);
  };

  // ---------- Eingabe (Touch-Buttons + Tastatur zum Testen) ----------
  K.init = function () {
    const box = $('cbt');
    const defs = [['block', 'combat_block', 'hold'], ['dodge', 'combat_dodge'], ['attack', 'combat_attack'],
                  ['heavy', 'combat_heavy'], ['special', 'combat_special'], ['s0', ''], ['s1', ''], ['ranged', 'combat_ranged'], ['lock', 'combat_lock']];
    defs.forEach(d => {
      const b = document.createElement('button'); b.id = 'cb-' + d[0]; b.className = 'cb'; b.textContent = d[1] ? T(d[1]) : '';
      const wc = () => SW.WCombat && SW.WCombat.active && !K.active; // Weltkampf: gleiche Buttons, andere Logik
      const ar = () => SW.Arena && SW.Arena.active;
      const down = e => { e.preventDefault(); if (d[0] === 'lock') { if (wc()) SW.WCombat.toggleLock(); return; } b.classList.add('on'); if (ar()) SW.Arena.press(d[0]); else if (wc()) SW.WCombat.press(d[0]); else if (d[2]) held[d[0]] = true; else if (d[0] === 'dodge') dodge(); else act(d[0]); };
      const up = e => { e.preventDefault(); b.classList.remove('on'); if (ar()) SW.Arena.release(d[0]); if (SW.WCombat) SW.WCombat.release(d[0]); if (d[2]) held[d[0]] = false; };
      b.addEventListener('pointerdown', down); b.addEventListener('pointerup', up);
      b.addEventListener('pointercancel', up); b.addEventListener('pointerleave', up);
      b.addEventListener('contextmenu', e => e.preventDefault());
      if (d[0] === 'lock') b.classList.toggle('lk', SW.WCombat.lock);
      box.appendChild(b);
    });
    window.addEventListener('keydown', e => {
      if (!K.active) return; const k = e.key.toLowerCase();
      if (k === ' ') held.block = true; else if (k === 'b') held.breath = true;
      else if (e.repeat) return;
      else if (k === 'j') act('attack'); else if (k === 'k') act('heavy'); else if (k === 'l') act('special'); else if (k === 'u') act('s0'); else if (k === 'i') act('s1'); else if (k === 'h') act('ranged');
      else if (k === 'x' || k === 'shift') dodge();
    });
    window.addEventListener('keyup', e => { const k = e.key.toLowerCase(); if (k === ' ') held.block = false; else if (k === 'b') held.breath = false; });
  };

  // ---------- Darstellung: Gegnerfigur (Kampf und Welt) ----------
  function body(c, def, o) {
    const L = def.look, F = o.flash, col = k => F ? '#fff' : k, dx = Math.cos(o.ang), dy = Math.sin(o.ang);
    c.lineCap = 'round'; c.lineJoin = 'round';
    if (L.cape) { c.fillStyle = col(L.cape); c.beginPath(); c.moveTo(-13, -57); c.lineTo(13, -57); c.lineTo(24, -4); c.lineTo(-24, -4); c.closePath(); c.fill(); }
    c.fillStyle = col(L.legs); c.beginPath(); c.moveTo(-15, 0); c.lineTo(15, 0); c.lineTo(11, -31); c.lineTo(-11, -31); c.closePath(); c.fill();
    c.fillStyle = col(L.cloth); c.fillRect(-11, -58, 22, 28);
    c.fillStyle = col(L.trim); c.fillRect(-11, -34, 22, 4);
    if (L.plate) { c.fillStyle = col(L.plate); c.fillRect(-11, -56, 22, 14); c.fillRect(-17, -61, 10, 8); c.fillRect(7, -61, 10, 8); }
    c.fillStyle = col('#e0b58f'); c.beginPath(); c.arc(0, -67, 8.5, 0, TAU); c.fill();
    if (L.helm) {
      c.fillStyle = col(L.helm); c.beginPath(); c.arc(0, -68, 10.5, Math.PI, 0); c.lineTo(11, -64); c.lineTo(-11, -64); c.closePath(); c.fill();
      c.fillStyle = col(L.trim); c.beginPath(); c.moveTo(0, -79); c.lineTo(-5, -88); c.lineTo(0, -83); c.lineTo(5, -88); c.closePath(); c.fill();
      if (def.phases) { c.fillStyle = col(L.trim); c.beginPath(); c.moveTo(-9, -74); c.lineTo(-15, -86); c.lineTo(-4, -77); c.fill(); c.beginPath(); c.moveTo(9, -74); c.lineTo(15, -86); c.lineTo(4, -77); c.fill(); }
    } else {
      c.fillStyle = col(L.hair); c.beginPath(); c.arc(0, -68, 9, Math.PI, 0); c.closePath(); c.fill();
      c.beginPath(); c.arc(3, -78, 3.6, 0, TAU); c.fill();
    }
    if (L.mask) { c.fillStyle = col(L.mask); c.fillRect(-8.5, -66, 17, 6); }
    if (!F) { c.fillStyle = '#1c1612'; c.fillRect(-5, -68, 3, 1.5); c.fillRect(2, -68, 3, 1.5); }
    c.strokeStyle = col(L.cloth); c.lineWidth = 6;
    c.beginPath(); c.moveTo(-11, -54); c.lineTo(-17, -38); c.stroke();
    c.beginPath(); c.moveTo(11, -54); c.lineTo(o.hx, o.hy); c.stroke();
    c.fillStyle = col('#e0b58f'); c.beginPath(); c.arc(-17, -37, 3.2, 0, TAU); c.fill();
    const tx = o.hx + dx * o.len, ty = o.hy + dy * o.len;
    if (o.glow) { c.save(); c.globalAlpha = .5; c.strokeStyle = o.glow; c.lineWidth = 9; c.beginPath(); c.moveTo(o.hx, o.hy); c.lineTo(tx, ty); c.stroke(); c.restore(); }
    if (def.weapon === 'spear') {
      c.strokeStyle = col('#6b4a2c'); c.lineWidth = 2.6; c.beginPath(); c.moveTo(o.hx - dx * 18, o.hy - dy * 18); c.lineTo(tx, ty); c.stroke();
      c.fillStyle = col('#d9e0e6'); c.beginPath(); c.moveTo(tx + dx * 9, ty + dy * 9); c.lineTo(tx - dy * 2.6, ty + dx * 2.6); c.lineTo(tx + dy * 2.6, ty - dx * 2.6); c.closePath(); c.fill();
    } else {
      c.strokeStyle = col('#2a2024'); c.lineWidth = 3.2; c.beginPath(); c.moveTo(o.hx - dx * 8, o.hy - dy * 8); c.lineTo(o.hx, o.hy); c.stroke();
      c.strokeStyle = col('#d9e0e6'); c.lineWidth = 2.8; c.beginPath(); c.moveTo(o.hx, o.hy); c.lineTo(tx, ty); c.stroke();
      c.strokeStyle = col('#b8923a'); c.lineWidth = 2; c.beginPath(); c.moveTo(o.hx - dy * 4, o.hy + dx * 4); c.lineTo(o.hx + dy * 4, o.hy - dx * 4); c.stroke();
    }
    c.fillStyle = col('#e0b58f'); c.beginPath(); c.arc(o.hx, o.hy, 3.4, 0, TAU); c.fill();
  }

  function foePose(f, fsw, fdef) {
    f = f || S.foe; fsw = fsw === undefined ? fsw : fsw; fdef = fdef || S.def;
    const spear = fdef.weapon === 'spear', len = spear ? 64 : 44, A = f.atk, th = A && A.kind === 'thrust';
    const o = { ang: spear ? -.35 : -.9, hx: 17, hy: -38, len, flash: f.flash > 0, tilt: 0, glow: null };
    if (fsw > 0) {
      const q = 1 - fsw / SWING;
      if (th) { o.ang = 2.6; o.hx = lerp(26, -6, q); o.hy = lerp(-44, -46, q); o.len = len * lerp(.9, 1.25, q); }
      else { o.ang = lerp(-2.3, 1.7, q); o.hx = lerp(12, 4, q); o.hy = lerp(-86, -44, q); }
    } else if (f.st === 'wind') {
      const e = ease(clamp(f.t / f.dur, 0, 1));
      if (th) { o.ang = 2.6; o.hx = lerp(17, 28, e); o.hy = lerp(-38, -44, e); }
      else { o.ang = lerp(o.ang, -2.3, e); o.hx = lerp(17, 12, e); o.hy = lerp(-38, -86, e); }
      if (e > .55) o.glow = A.unblock ? '#b06cff' : '#ff5a3c';
    } else if (f.guarding) { o.ang = -1.57; o.hx = 2; o.hy = -48; }
    else if (f.st === 'stagger') { o.tilt = -.14; o.ang = -.3; o.hx = 21; o.hy = -30; }
    return o;
  }

  // Gegner in der Weltansicht (wird von render.js aufgerufen)
  K.drawWorld = function (c, sx, sy, u, time, spot) {
    const def = D.enemies[spot.type], w = spot.w, k = u / 62 * (def.phases ? 1.2 : 1);
    c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(sx, sy, u * .4, u * .12, 0, 0, TAU); c.fill();
    c.save(); c.translate(sx, sy); c.scale(k * (w && w.dir < 0 ? -1 : 1), k);
    body(c, def, w && w.st !== 'dead' ? foePose(w, w.sw, def) : { ang: def.weapon === 'spear' ? -.35 : -.9, hx: 17, hy: -38, len: def.weapon === 'spear' ? 64 : 44, flash: false, glow: null });
    c.restore();
    const by = sy - u * 1.75 * (def.phases ? 1.2 : 1) + Math.sin(time * 3 + spot.x) * u * .05, r = u * .12;
    if (w) { // Weltkampf: Lebensbalken, Angriffswarnung
      const bw = u * 1.0; c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(sx - bw / 2 - 1, by - u * .1 - 1, bw + 2, u * .12 + 2);
      c.fillStyle = '#d6453a'; c.fillRect(sx - bw / 2, by - u * .1, bw * Math.max(0, Math.min(1, w.hp / w.max)), u * .12);
      if (w.st === 'wind') { c.fillStyle = w.atk && w.atk.unblock ? '#b06cff' : '#ff4a2e'; c.font = '700 ' + Math.round(u * .6) + 'px sans-serif'; c.textAlign = 'center'; c.fillText('!', sx, by - u * .22); }
      return;
    }
    c.fillStyle = '#e0452f'; c.beginPath(); c.moveTo(sx, by - r); c.lineTo(sx + r, by); c.lineTo(sx, by + r); c.lineTo(sx - r, by); c.fill();
  };

  // ---------- Darstellung: Arena ----------
  function bg(cw, ch) {
    const key = S.arena + cw + 'x' + ch;
    if (bgk === key) return bgc;
    const A = D.arenas[S.arena], w = Math.round(cw * 1.2), hz = ch * .5;
    if (!bgc) bgc = document.createElement('canvas');
    bgc.width = w; bgc.height = ch;
    const c = bgc.getContext('2d');
    let g = c.createLinearGradient(0, 0, 0, hz); g.addColorStop(0, A.sky[0]); g.addColorStop(1, A.sky[1]); c.fillStyle = g; c.fillRect(0, 0, w, hz);
    g = c.createLinearGradient(0, hz, 0, ch); g.addColorStop(0, A.gnd[0]); g.addColorStop(1, A.gnd[1]); c.fillStyle = g; c.fillRect(0, hz, w, ch - hz);
    const tri = (x, y, bw, bh, col) => { c.fillStyle = col; c.beginPath(); c.moveTo(x - bw / 2, y); c.lineTo(x, y - bh); c.lineTo(x + bw / 2, y); c.fill(); };
    const tile = col => {
      c.strokeStyle = col; c.lineWidth = 2;
      for (let i = -12; i <= 12; i++) { c.beginPath(); c.moveTo(w / 2 + i * w * .02, hz); c.lineTo(w / 2 + i * w * .12, ch); c.stroke(); }
      for (let j = 1; j < 9; j++) { const y = hz + (ch - hz) * Math.pow(j / 9, 1.8); c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
    };
    switch (A.deco) {
      case 'trees':
        for (let i = 0; i < 34; i++) tri(R(i) * w, hz + ch * .01, ch * (.1 + R(i + 40) * .08), ch * (.16 + R(i + 80) * .16), '#2d5532');
        for (let i = 0; i < 22; i++) { const x = R(i + 200) * w, hh = ch * (.2 + R(i + 240) * .16); tri(x, hz + ch * .05, ch * .15, hh, '#3d7040'); c.fillStyle = '#4a3322'; c.fillRect(x - ch * .008, hz + ch * .05, ch * .016, ch * .04); }
        break;
      case 'bamboo':
        for (let i = 0; i < 64; i++) {
          const z = R(i + 7), x = R(i) * w, ww = ch * (.008 + z * .02), by = hz + (ch - hz) * (.02 + z * .5);
          c.fillStyle = z < .5 ? '#4f7f3a' : '#6aa04a'; c.fillRect(x, 0, ww, by);
          c.fillStyle = 'rgba(0,0,0,.18)'; for (let y = ch * .08 + R(i + 3) * ch * .1; y < by; y += ch * (.1 + z * .08)) c.fillRect(x - 1, y, ww + 2, ch * .006);
        }
        break;
      case 'temple': {
        c.fillStyle = '#b5352b'; const gx = w / 2, gw = ch * .34;
        c.fillRect(gx - gw / 2, hz - ch * .3, ch * .03, ch * .3); c.fillRect(gx + gw / 2 - ch * .03, hz - ch * .3, ch * .03, ch * .3);
        c.fillRect(gx - gw * .62, hz - ch * .32, gw * 1.24, ch * .035); c.fillRect(gx - gw * .5, hz - ch * .25, gw, ch * .02);
        for (const sx of [.2, .8]) { c.fillStyle = '#8c887e'; c.fillRect(w * sx, hz - ch * .12, ch * .05, ch * .14); c.fillRect(w * sx - ch * .02, hz - ch * .16, ch * .09, ch * .04); c.fillStyle = '#ffd27a'; c.fillRect(w * sx + ch * .012, hz - ch * .1, ch * .026, ch * .04); }
        tile('rgba(0,0,0,.14)'); break;
      }
      case 'plateau':
        c.fillStyle = '#7d93a8'; c.beginPath(); c.moveTo(0, hz); for (let i = 0; i <= 12; i++) c.lineTo(i / 12 * w, hz - ch * (.12 + R(i + 5) * .22)); c.lineTo(w, hz); c.fill();
        c.fillStyle = '#5f7488'; c.beginPath(); c.moveTo(0, hz); for (let i = 0; i <= 9; i++) c.lineTo(i / 9 * w, hz - ch * (.04 + R(i + 60) * .12)); c.lineTo(w, hz); c.fill();
        for (let i = 0; i < 16; i++) { c.fillStyle = 'rgba(40,38,34,.35)'; c.beginPath(); c.ellipse(R(i + 90) * w, hz + ch * (.1 + R(i + 30) * .38), ch * .05, ch * .018, 0, 0, TAU); c.fill(); }
        break;
      case 'camp': {
        c.fillStyle = '#4a3322';
        for (let x = 0; x < w; x += ch * .045) { const hh = ch * (.15 + R(x) * .04); c.beginPath(); c.moveTo(x, hz + ch * .03); c.lineTo(x, hz - hh + ch * .03); c.lineTo(x + ch * .02, hz - hh - ch * .02 + ch * .03); c.lineTo(x + ch * .04, hz - hh + ch * .03); c.lineTo(x + ch * .04, hz + ch * .03); c.fill(); }
        tri(w * .22, hz + ch * .1, ch * .3, ch * .22, '#8c7a58'); tri(w * .78, hz + ch * .1, ch * .3, ch * .22, '#7a6a4c');
        g = c.createRadialGradient(w * .12, hz + ch * .22, 0, w * .12, hz + ch * .22, ch * .22); g.addColorStop(0, 'rgba(255,170,60,.6)'); g.addColorStop(1, 'rgba(255,170,60,0)'); c.fillStyle = g; c.fillRect(0, hz, w * .4, ch * .5);
        break;
      }
      case 'cavern': {
        // Höhle: Felswand mit Stalaktiten, matt leuchtende Kristalle
        c.fillStyle = '#17121e'; c.fillRect(0, 0, w, hz * .55);
        for (let i = 0; i < 26; i++) { const x = R(i + 300) * w, hh = ch * (.06 + R(i + 340) * .2); c.fillStyle = i % 2 ? '#241d2e' : '#2d2538'; c.beginPath(); c.moveTo(x - ch * .03, 0); c.lineTo(x, hh); c.lineTo(x + ch * .03, 0); c.fill(); }
        for (let i = 0; i < 14; i++) { const x = R(i + 400) * w, hh = ch * (.04 + R(i + 440) * .1); tri(x, hz + ch * .02, ch * .05, hh, i % 3 ? '#2a2333' : '#3a2f4a'); }
        for (let i = 0; i < 7; i++) { const x = R(i + 500) * w, y = hz - ch * (.02 + R(i + 540) * .1); g = c.createRadialGradient(x, y, 0, x, y, ch * .1); g.addColorStop(0, 'rgba(190,110,255,.55)'); g.addColorStop(1, 'rgba(190,110,255,0)'); c.fillStyle = g; c.fillRect(x - ch * .1, y - ch * .1, ch * .2, ch * .2); tri(x, y + ch * .02, ch * .02, ch * .05, '#c79bff'); }
        tile('rgba(0,0,0,.2)'); break;
      }
      case 'ruins':
        for (let i = 0; i < 9; i++) {
          const x = (i + .5) / 9 * w + (R(i) - .5) * ch * .1, hh = ch * (.1 + R(i + 11) * .26), pw = ch * (.05 + R(i + 22) * .03);
          c.fillStyle = '#8b877d'; c.fillRect(x - pw / 2, hz - hh + ch * .06, pw, hh); c.fillStyle = '#6d6a62'; c.fillRect(x - pw / 2, hz + ch * .06 - hh * .3, pw, hh * .3);
          if (R(i + 33) > .5) { c.fillStyle = '#a49f93'; c.fillRect(x - pw * .7, hz - hh + ch * .05, pw * 1.4, ch * .018); }
        }
        tile('rgba(0,0,0,.16)'); break;
    }
    bgk = key; return bgc;
  }

  // ---------- Darstellung: Spielerwaffe (Ego) ----------
  const REST = { hx: .84, hy: 1.0, a: -1.95, l: .75 };
  const RAISE = { shot: { hx: .84, hy: .96, a: -1.95 }, normal: { hx: .9, hy: .88, a: -1.3 }, quick: { hx: .88, hy: .93, a: -1.6 }, heavy: { hx: .93, hy: .7, a: -.9 }, special: { hx: .74, hy: .97, a: -2.5 }, counter: { hx: .9, hy: .9, a: -1.2 } };
  const END = { shot: { hx: .82, hy: 1.0, a: -1.9 }, normal: { hx: .42, hy: .95, a: -3.4 }, quick: { hx: .5, hy: .98, a: -3.0 }, heavy: { hx: .36, hy: 1.02, a: -3.7 }, special: { hx: .56, hy: .78, a: -1.57, l: .85 }, counter: { hx: .38, hy: .95, a: -3.5 } };
  const BLOCK = { hx: .55, hy: 1.06, a: -1.4, l: .75 };
  const pmix = (a, b, t) => ({ hx: lerp(a.hx, b.hx, t), hy: lerp(a.hy, b.hy, t), a: lerp(a.a, b.a, t), l: lerp(a.l || .75, b.l || .75, t) });
  // Zeit innerhalb des aktuellen Schlags (bei Mehrfachtreffern wiederholt sich die Schlagbewegung)
  function pmT(pm) {
    const m = pm.m, t = pm.t;
    if (pm.n < 2 || t < m.wind) return t;
    const g = m.gap, k = Math.min(pm.n - 1, Math.floor((t - m.wind) / g));
    return t < pm.end ? m.wind + (t - m.wind - k * g) : t - (pm.n - 1) * g;
  }
  function playerPose(time) {
    let o = pmix(REST, REST, 0);
    const pm = S.pm;
    if (pm) {
      const m = pm.m, Ra = RAISE[pm.anim], E = END[pm.anim], t = pmT(pm);
      if (t < m.wind) o = pmix(REST, Ra, ease(t / m.wind));
      else if (t < m.wind + SWING) o = pmix(Ra, E, (t - m.wind) / SWING);
      else o = pmix(E, REST, ease(clamp((t - m.wind - SWING) / (pm.rec - SWING), 0, 1)));
    }
    if (S.bl > 0) o = pmix(o, BLOCK, ease(S.bl));
    if (S.breath) o.hy += .05;
    o.hx += Math.sin(time * 1.7) * .004; o.hy += Math.cos(time * 1.3) * .004;
    return o;
  }
  function blade(c, cw, ch, o, al, glow, hands) {
    const hx = o.hx * cw, hy = o.hy * ch, L = o.l * ch, dx = Math.cos(o.a), dy = Math.sin(o.a), tx = hx + dx * L, ty = hy + dy * L;
    c.save(); c.lineCap = 'round'; c.globalAlpha = al;
    if (glow) { c.globalAlpha = al * .45; c.strokeStyle = glow; c.lineWidth = ch * .06; c.beginPath(); c.moveTo(hx, hy); c.lineTo(tx, ty); c.stroke(); c.globalAlpha = al; }
    c.strokeStyle = '#2a2024'; c.lineWidth = ch * .032; c.beginPath(); c.moveTo(hx - dx * ch * .2, hy - dy * ch * .2); c.lineTo(hx, hy); c.stroke();
    c.strokeStyle = '#d9e0e6'; c.lineWidth = ch * .026; c.beginPath(); c.moveTo(hx, hy); c.lineTo(tx, ty); c.stroke();
    c.strokeStyle = '#fff'; c.lineWidth = ch * .007; c.beginPath(); c.moveTo(hx + dy * ch * .007, hy - dx * ch * .007); c.lineTo(tx + dy * ch * .004, ty - dx * ch * .004); c.stroke();
    c.fillStyle = '#b8923a'; c.beginPath(); c.arc(hx, hy, ch * .027, 0, TAU); c.fill();
    if (hands) {
      for (const k of [.07, .16]) {
        const px = hx - dx * ch * k, py = hy - dy * ch * k;
        c.strokeStyle = '#27345c'; c.lineWidth = ch * .1; c.beginPath(); c.moveTo(px, py); c.lineTo(px + ch * .12, ch * 1.2); c.stroke();
        c.fillStyle = '#e0b58f'; c.beginPath(); c.arc(px, py, ch * .042, 0, TAU); c.fill();
      }
    }
    c.restore();
  }

  // ---------- Darstellung: Frame ----------
  K.gfx = { blade, REST, RAISE, END, BLOCK, pmix, pmT, SWING }; // von arena3d.js genutzt (Waffe in Ego-Ansicht)
  function bar(c, x, y, w, h, r, col, back) {
    c.fillStyle = back || 'rgba(0,0,0,.55)'; c.fillRect(x - 2, y - 2, w + 4, h + 4);
    c.fillStyle = col; c.fillRect(x, y, w * clamp(r, 0, 1), h);
  }
  function txt(c, s, x, y, size, col, al) {
    c.font = '700 ' + size + 'px Georgia, serif'; c.textAlign = al || 'center'; c.textBaseline = 'middle';
    c.fillStyle = 'rgba(0,0,0,.65)'; c.fillText(s, x + size * .06, y + size * .06); c.fillStyle = col; c.fillText(s, x, y);
  }

  K.draw = function (c, cw, ch, time) {
    if (SW.Arena && SW.Arena.active) { SW.Arena.draw(c, cw, ch, time); return; }
    if (!S) return;
    const u = ch / 100, dpr = SW.dpr || 1, f = S.foe;
    const dod = S.dodgeT > 0 ? Math.sin(Math.PI * (1 - S.dodgeT / DODGE)) * cw * .09 * S.side : 0;
    c.save();
    if (S.shake > 0) c.translate(rnd(-1, 1) * S.shake * u * 4, rnd(-1, 1) * S.shake * u * 4);
    c.drawImage(bg(cw, ch), -cw * .1 - dod * .7, 0);
    // Gegner
    const s = ch * .0088, fx = cw / 2 - dod * 1.3, fy = ch * .9, po = foePose();
    c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(fx, fy, s * 28, s * 6, 0, 0, TAU); c.fill();
    c.save(); c.translate(fx, fy + Math.sin(time * 2.2) * s * .8); c.scale(s, s); c.translate(0, -30); c.rotate(po.tilt); c.translate(0, 30);
    body(c, S.def, po); c.restore();
    if (f.st === 'wind' && po.glow) txt(c, '!', fx, fy - s * 96, u * 9, po.glow);
    // Waffe
    const pp = playerPose(time);
    const tt = S.pm ? pmT(S.pm) : 0;
    if (S.pm && tt >= S.pm.m.wind && tt < S.pm.m.wind + SWING) {
      const q = (tt - S.pm.m.wind) / SWING, Ra = RAISE[S.pm.anim], E = END[S.pm.anim];
      for (let i = 3; i >= 1; i--) blade(c, cw, ch, pmix(Ra, E, clamp(q - i * .12, 0, 1)), .16, null, false);
    }
    const glow = S.pm ? (S.pm.m.glow || (S.pm.name === 'special' ? '#7fd0ff' : S.pm.name === 'counter' ? '#ffe27a' : null)) : null;
    blade(c, cw, ch, pp, 1, glow, true);
    // Geschoss (Wurfstern oder Pfeil) fliegt zum Gegner, solange der Vorlauf läuft
    if (S.pm && S.pm.name === 'shot' && tt < S.pm.m.wind + SWING) {
      const q = clamp(tt / (S.pm.m.wind + SWING * .4), 0, 1), ax = cw * .72, ay = ch * .95, bx = fx, by = ch * .46;
      const px = ax + (bx - ax) * q, py = ay + (by - ay) * q - Math.sin(q * Math.PI) * ch * .08, sz = ch * (.05 - q * .03);
      c.save(); c.translate(px, py);
      if (S.ps.ranged.id.indexOf('bow') === 0) {
        c.rotate(Math.atan2(by - ay, bx - ax)); c.strokeStyle = '#d8d0b8'; c.lineWidth = ch * .008; c.beginPath(); c.moveTo(-sz * 2, 0); c.lineTo(sz * 2, 0); c.stroke();
        c.fillStyle = '#c9ccd2'; c.beginPath(); c.moveTo(sz * 2, 0); c.lineTo(sz * 1.4, -sz * .3); c.lineTo(sz * 1.4, sz * .3); c.fill();
      } else {
        c.rotate(q * 14); c.fillStyle = '#cfd5dc'; c.beginPath();
        for (let i = 0; i < 8; i++) { const r = i % 2 ? sz * .35 : sz; const a = i / 8 * TAU; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
        c.closePath(); c.fill();
      }
      c.restore();
    }
    if (S.spark > 0) { const sx = (pp.hx + Math.cos(pp.a) * pp.l * .55 * ch / cw) * cw, sy = (pp.hy + Math.sin(pp.a) * pp.l * .55) * ch; c.fillStyle = 'rgba(255,255,255,' + S.spark * 3 + ')'; c.beginPath(); c.arc(sx, sy, ch * .07 * (1.2 - S.spark), 0, TAU); c.fill(); }
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
    // Übergänge und Ergebnis
    if (S.state === 'intro') {
      c.fillStyle = 'rgba(0,0,0,' + clamp(1 - S.t / .7, 0, 1) + ')'; c.fillRect(0, 0, cw, ch);
      txt(c, T('enemy_' + S.spot.type), cw / 2, ch * .45, u * 9, '#f4ecd8');
    } else if (S.state === 'win' || S.state === 'lose') {
      c.fillStyle = 'rgba(0,0,0,' + clamp(S.t / .6, 0, .5) + ')'; c.fillRect(0, 0, cw, ch);
      txt(c, T(S.state === 'win' ? 'combat_victory' : 'combat_defeat'), cw / 2, ch * (S.state === 'win' && S.rew ? .26 : .45), u * (S.state === 'win' && S.rew ? 11 : 13), S.state === 'win' ? '#ffe27a' : '#e0452f');
      if (S.state === 'win' && S.rew && S.t > .5) {
        const r = S.rew, L = ['+' + r.xp + ' XP'];
        r.lv.forEach(x => L.push(x)); if (r.coins) L.push('+' + r.coins + ' ' + T('coins')); r.ess.forEach(x => L.push('+' + x));
        if (r.karma) L.push('Karma ' + (r.karma > 0 ? '+' : '') + r.karma);
        if (r.yy.yin) L.push('Yin +' + r.yy.yin); if (r.yy.yang) L.push('Yang +' + r.yy.yang);
        r.items.forEach(x => L.push(x));
        if (r.secret) L.push(r.secret);
        const y0 = ch * .42, avail = ch * .95 - y0;
        let cols = 1, rows = L.length, step = Math.min(u * 5.2, avail / rows);
        if (step < u * 3.8) { cols = 2; rows = Math.ceil(L.length / 2); step = Math.min(u * 5.2, avail / rows); }
        L.forEach((s, i) => {
          const col = cols === 1 ? 0 : (i < rows ? 0 : 1), row = cols === 1 ? i : i % rows, x = cols === 1 ? cw / 2 : cw * (col ? .66 : .34);
          txt(c, s, x, y0 + row * step, step * .8, i && r.lv.indexOf(s) >= 0 || s === r.secret || r.items.indexOf(s) >= 0 ? '#ffe27a' : '#f4ecd8');
        });
      }
      if (S.t > outT() - .6) { c.fillStyle = 'rgba(0,0,0,' + clamp((S.t - outT() + .6) / .6, 0, 1) + ')'; c.fillRect(0, 0, cw, ch); }
    }
  };

  K.debug = function () { return S; }; // nur für Tests
  K.resume = function () { bgk = ''; }; // Arena-Hintergrund nach iOS-Speicherbereinigung neu zeichnen
  return K;
})();
