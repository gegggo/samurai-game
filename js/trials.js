'use strict';
// Schrein-Prüfungen (Phase 7a). Namensraum SW.Trials.
// Ablauf: Schrein erwecken (Beten) -> Knopf "Enter" -> Innenraum (eigene Kachelkarte, Draufsicht) -> Aufgabe lösen -> Altar berühren -> Belohnung.
// Belohnungen: Yin/Yang (Spielstil), Essence (nur Skilltree), XP. Keine Münzen. Jede Prüfung einmalig, gespeichert in SW.Trials.done.
// Aufgabentypen: blocks, lanterns, switches, mirrors, combo, labyrinth, miniboss und movement.
// Karte: # Wand | . Boden | B Block | P Platte | L Laterne | Q Schalter | V Zeitplatte | M Spiegel | F Lichtquelle | C Kristall | D Tür | A Altar | S Start | E Ausgang
SW.Trials = (function () {
  const T = { active: false, done: new Set() }, tr = (k, n) => SW.t(k, n);
  const RAD = .3, SPEED = 4, TAU = 6.2832, COL = ['#e0452f', '#f2c14e', '#4a8fe0', '#f4ecd8'];
  const ROOMS = {};
  const D = SW.Data;
  // Schwierigkeitsprofil bleibt von Darstellung und Eingabemethode getrennt,
  // damit dieselben Regeln später auch in einer echten 3D-Szene gelten.
  const TIER_RULES = {
    1: { comboTime: 12, barrierPeriod: 3.6, barrierActive: .85 },
    2: { comboTime: 9, barrierPeriod: 3.4, barrierActive: 1.0 },
    3: { comboTime: 7, barrierPeriod: 3.2, barrierActive: 1.1 }
  };
  function challengeProfile(tier) {
    const level = Math.max(1, Math.min(3, Math.floor(Number(tier) || 1)));
    const rules = TIER_RULES[level];
    return { tier: level, comboTime: rules.comboTime, barrierPeriod: rules.barrierPeriod,
      barrierActive: rules.barrierActive, barrierWindow: +(rules.barrierPeriod - rules.barrierActive).toFixed(2) };
  }
  T.challengeProfile = challengeProfile;
  Object.assign(SW.TEXT.en, {
    enemy_shrine_guard: 'Shrine Guardian',
    tr_hint_miniboss: 'Enter the inner ring and defeat the shrine guardian.',
    tr_miniboss_retry: 'The guardian awaits you again. Try once more.',
    tr_hint_movement: 'Cross the three timed barriers. Wait for a safe opening and use the marked checkpoints.',
    tr_movement_checkpoint: 'Checkpoint reached.', tr_movement_hit: 'The barrier pushed you back.', tr_movement_progress: 'Checkpoints'
  });
  const legacy = {
    village: { kind: 'blocks', name: 'trn_village', reward: { xp: 40, yin: 3 } },
    bamboo: { kind: 'lanterns', name: 'trn_bamboo', reward: { xp: 40, yin: 2, ess: 1 } },
    mountain: { kind: 'blocks', name: 'trn_mountain', reward: { xp: 50, yin: 3, ess: 1 } },
    hermit: { kind: 'lanterns', name: 'trn_hermit', reward: { xp: 45, yin: 3 } },
    lookout: { kind: 'blocks', name: 'trn_lookout', reward: { xp: 50, yin: 2, ess: 1 } },
    fishers: { kind: 'lanterns', name: 'trn_fishers', reward: { xp: 45, yin: 2 } },
    ruins: { kind: 'blocks', name: 'trn_ruins', reward: { xp: 60, yin: 3, ess: 2 } },
    cave: { kind: 'blocks', name: 'trn_cave', reward: { xp: 80, yang: 5, ess: 2 } }
  };

  function roomMap(kind, variant) {
    const w = 25, h = 17, g = Array.from({ length: h }, () => Array(w).fill('#'));
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) g[y][x] = '.';

    // Acht Grundrisse: Seitenkammern, Säulenhallen und versetzte Korridore.
    // Die Hauptwege zu den Rätselobjekten bleiben bewusst frei.
    const walls = [
      [[6,6],[6,7],[18,6],[18,7],[8,11],[16,11],[8,12],[16,12]],
      [[6,5],[6,6],[6,7],[18,5],[18,6],[18,7],[9,11],[10,11],[14,11],[15,11]],
      [[8,4],[8,5],[8,6],[16,4],[16,5],[16,6],[8,10],[8,11],[16,10],[16,11]],
      [[3,6],[4,6],[5,6],[6,6],[7,6],[17,6],[18,6],[19,6],[20,6],[21,6],[6,10],[7,10],[8,10],[16,10],[17,10],[18,10]],
      [[5,4],[5,5],[5,11],[5,12],[19,4],[19,5],[19,11],[19,12],[9,7],[9,8],[15,7],[15,8]],
      [[7,3],[7,4],[7,5],[17,3],[17,4],[17,5],[7,11],[7,12],[17,11],[17,12],[10,8],[14,8]],
      [[4,7],[4,8],[4,9],[20,7],[20,8],[20,9],[8,4],[9,4],[15,4],[16,4],[8,12],[9,12],[15,12],[16,12]],
      [[9,4],[9,5],[9,6],[9,7],[15,9],[15,10],[15,11],[15,12],[6,8],[7,8],[17,8],[18,8]]
    ];
    walls[variant % 8].forEach(([x,y]) => { g[y][x] = '#'; });

    g[1][12] = 'A'; g[2][12] = 'D'; g[15][12] = 'S'; g[16][12] = 'E';
    if (kind === 'blocks') {
      const layouts = [
        [[3,12,21],4,9], [[4,12,20],3,11], [[5,12,19],5,10], [[3,11,21],4,10],
        [[4,10,20],5,11], [[5,12,19],3,9], [[3,12,21],5,11], [[4,12,20],4,10]
      ];
      const [xs, py, by] = layouts[variant % 8];
      xs.forEach(x => { g[py][x] = 'P'; g[by][x] = 'B'; });
    } else if (kind === 'lanterns') {
      const sets = [
        [[3,4],[21,4],[3,12],[21,12],[12,8]],
        [[4,4],[20,4],[4,12],[20,12],[12,8]],
        [[3,5],[21,5],[3,11],[21,11],[12,8]],
        [[4,3],[20,3],[4,13],[20,13],[12,9]],
        [[3,4],[21,4],[6,12],[18,12],[12,7]],
        [[5,4],[19,4],[3,11],[21,11],[12,8]],
        [[3,3],[21,3],[3,13],[21,13],[12,8]],
        [[4,5],[20,5],[5,12],[19,12],[12,7]]
      ];
      sets[variant % 8].forEach(([x,y]) => { g[y][x] = 'L'; });
    } else if (kind === 'switches') {
      // Drei Bodenschalter liegen auf gut erreichbaren, voneinander getrennten Wegen.
      [[3,8],[12,13],[21,8]].forEach(([x,y]) => { g[y][x] = 'Q'; });
    } else if (kind === 'labyrinth') {
      // Eigenstaendiges, garantiert verbundenes Labyrinth (Tiefensuche mit Ruecksprung).
      for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) g[y][x] = '#';
      g[1][12] = 'A'; g[2][12] = 'D'; g[15][12] = 'S';
      const start = { x: 11, y: 13 }, stack = [start], visited = new Set([start.x + ',' + start.y]);
      g[start.y][start.x] = '.';
      while (stack.length) {
        const cur = stack[stack.length - 1];
        const dirs = [[2,0],[-2,0],[0,2],[0,-2]];
        const shift = (variant + stack.length) % dirs.length;
        const ordered = dirs.slice(shift).concat(dirs.slice(0, shift));
        const next = ordered.map(([dx,dy]) => ({ x: cur.x + dx, y: cur.y + dy, dx, dy }))
          .filter(n => n.x >= 1 && n.x <= 23 && n.y >= 3 && n.y <= 13 && !visited.has(n.x + ',' + n.y));
        if (!next.length) { stack.pop(); continue; }
        const n = next[0]; visited.add(n.x + ',' + n.y);
        g[cur.y + n.dy / 2][cur.x + n.dx / 2] = '.'; g[n.y][n.x] = '.'; stack.push({ x: n.x, y: n.y });
      }
      // Eingang vom Startpunkt und Ausgang zur verschlossenen Altartuer.
      g[14][12] = '.'; g[13][12] = '.'; g[13][11] = '.'; g[3][12] = '.';
    } else if (kind === 'miniboss') {
      // Kampfarena mit freiem Zentrum; der Wächter startet beim Betreten des inneren Kreises.
      [[6,6],[18,6],[6,10],[18,10]].forEach(([x,y]) => { g[y][x] = '#'; });
    } else if (kind === 'sequence') {
      // Drei Bodenschalter schalten den anschliessenden Zeitparcours frei.
      for (let y = 3; y <= 14; y++) for (let x = 10; x <= 14; x++) g[y][x] = '.';
      [[4,12],[20,12],[12,13]].forEach(([x,y]) => { g[y][x] = 'Q'; });
      [11,8,5].forEach(y => { for (let x = 1; x < w - 1; x++) g[y][x] = '#'; g[y][12] = 'H'; });
      g[9][12] = 'K'; g[6][12] = 'K';
    } else if (kind === 'movement') {
      // Drei zeitgesteuerte Sperren liegen auf einem schmalen Weg zum Altar.
      for (let y = 3; y <= 14; y++) for (let x = 10; x <= 14; x++) g[y][x] = '.';
      [11,8,5].forEach(y => { for (let x = 1; x < w - 1; x++) g[y][x] = '#'; g[y][12] = 'H'; });
      g[9][12] = 'K'; g[6][12] = 'K';
    } else if (kind === 'combo') {
      // Erst die Zeitplatte im Sueden betreten, dann zum Spiegel laufen und ihn drehen.
      g[13][3] = 'V'; g[8][2] = 'F'; g[8][12] = 'M'; g[3][12] = 'C';
      // Der Lichtweg im Kombinationsraum bleibt frei: erst waagerecht zum
      // Spiegel, danach senkrecht nach oben zum Kristall.
      for (let x = 3; x < 12; x++) g[8][x] = '.';
      for (let y = 4; y < 8; y++) g[y][12] = '.';
    } else {
      // Ein Lichtstrahl kommt von Westen; der Spiegel muss ihn nach Norden zum Kristall lenken.
      g[8][2] = 'F'; g[8][12] = 'M'; g[3][12] = 'C';
    }
    // Spiegelung erzeugt weitere Grundrisse, ohne Start, Ausgang oder Altar zu verschieben.
    const mirror = variant >= 8 && kind !== 'combo';
    return g.map(row => (mirror ? row.slice().reverse() : row).join(''));
  }

  function hashId(id) {
    let h = 2166136261;
    for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
    return h >>> 0;
  }
  SW.Shrines.expand();
  if (SW.Combat && SW.Combat.ensureShrineGuards) SW.Combat.ensureShrineGuards(D.shrines.filter(shrine => shrine.generated));
  D.shrines.forEach((shrine, index) => {
    const old = legacy[shrine.id], seed = hashId(shrine.id), kind = old ? old.kind : (seed % 17 === 0 ? 'sequence' : (seed % 13 === 0 ? 'miniboss' : (seed % 11 === 0 ? 'movement' : (seed % 7 === 0 ? 'labyrinth' : (seed % 5 === 0 ? 'combo' : (seed % 4 === 0 ? 'mirrors' : (seed % 4 === 1 ? 'switches' : (seed & 1 ? 'blocks' : 'lanterns'))))))));
    const variant = (seed >>> 4) % 16, order = [0,1,2,3,4];
    for (let i = order.length - 1; i > 0; i--) {
      const j = (seed + i * 13) % (i + 1), t = order[i]; order[i] = order[j]; order[j] = t;
    }
    const tier = shrine.tier || 1;
    ROOMS[shrine.id] = {
      kind, name: old ? old.name : 'shr_' + shrine.id,
      hint: kind === 'sequence' ? 'tr_hint_sequence' : (kind === 'labyrinth' ? 'tr_hint_labyrinth' : (kind === 'miniboss' ? 'tr_hint_miniboss' : (kind === 'movement' ? 'tr_hint_movement' : (kind === 'blocks' ? 'tr_hint_blocks' : (kind === 'lanterns' ? 'tr_hint_lanterns' : (kind === 'switches' ? 'tr_hint_switches' : (kind === 'combo' ? 'tr_hint_combo' : 'tr_hint_mirrors'))))))),
      bossType: 'shrine_guard', tier, reward: old ? old.reward : { xp: 50 + tier * 10, yin: 2 + Math.min(2, tier), ess: tier === 3 ? 1 : 0 },
      map: roomMap(kind, variant), order
    };
  });  let R = null, btnLeave = null, btnReset = null;

  const blockAt = (x, y) => R.blocks.find(b => b.x === x && b.y === y) || null;
  const hazardActive = h => ((R.t + h.offset) % R.rules.barrierPeriod) < R.rules.barrierActive;
  function solid(x, y) {
    if (x < 0 || y < 0 || x >= R.w || y >= R.h) return true;
    const c = R.g[y][x];
    return c === '#' || c === 'L' || c === 'M' || (c === 'D' && !R.open) || (c === 'H' && (R.def.kind === 'sequence' && !R.sequenceReady || R.hazards.some(h => h.x === x && h.y === y && hazardActive(h)))) || !!blockAt(x, y);
  }
  const blocked = (x, y) => solid(Math.floor(x - RAD), Math.floor(y - RAD)) || solid(Math.floor(x + RAD), Math.floor(y - RAD)) ||
    solid(Math.floor(x - RAD), Math.floor(y + RAD)) || solid(Math.floor(x + RAD), Math.floor(y + RAD));

  function build(id) {
    const def = ROOMS[id], h = def.map.length, w = def.map[0].length;
    R = { id, def, w, h, g: [], blocks: [], plates: [], lant: [], lit: [], lt: [], switches: [], swOn: [], mirrors: [], hazards: [], checkpoints: [], checkpoint: { x: 12, y: 15 }, bossStarted: false, bossCooldown: 0, sequenceReady: false, rules: challengeProfile(def.tier), beam: [], beamSolved: false, mirrorCooldown: 0, pressurePlate: null, pressureActive: false, pressureTime: 0, seq: 0, open: false, state: 'play', t: 0, msg: '', msgT: 0, shake: 0, rew: null,
      p: { x: 5.5, y: 7.5, dir: 1, anim: 0, moving: false, face: 1.57 }, push: { k: '', t: 0 } };
    for (let y = 0; y < h; y++) {
      const row = [];
      for (let x = 0; x < w; x++) {
        let c = def.map[y][x];
        if (c === 'B') { R.blocks.push({ x, y, ox: 0, oy: 0 }); c = '.'; }
        else if (c === 'S') { R.p.x = x + .5; R.p.y = y + .5; c = '.'; }
        else if (c === 'P') R.plates.push({ x, y });
        else if (c === 'L') { R.lant.push({ x, y }); R.lit.push(false); R.lt.push(0); }
        else if (c === 'Q') { R.switches.push({ x, y }); R.swOn.push(false); }
        else if (c === 'M') R.mirrors.push({ x, y, orientation: 1 });
        else if (c === 'H') R.hazards.push({ x, y, offset: 0 });
        else if (c === 'K') R.checkpoints.push({ x, y, reached: false });
        else if (c === 'V') R.pressurePlate = { x, y };
        row.push(c);
      }
      R.g.push(row);
    }
    R.msg = tr(def.hint); R.msgT = 6;
    if (def.kind === 'mirrors') traceBeam();
  }
  function ensure() {
    if (btnLeave) return;
    const mk = (id, fn) => { const b = document.createElement('button'); b.id = id; b.className = 'tr-btn'; b.addEventListener('click', fn); document.body.appendChild(b); return b; };
    btnLeave = mk('tr-leave', () => T.leave()); btnReset = mk('tr-reset', () => T.reset());
  }
  T.can = id => !!ROOMS[id] && !T.done.has(id);
  T.enter = function (id) {
    if (!T.can(id) || SW.Combat.active || SW.paused) return false;
    const def = ROOMS[id];
    ensure(); btnLeave.textContent = tr('tr_leave'); btnReset.textContent = tr('tr_reset');
    build(id); T.active = true; document.body.classList.add('trial'); SW.Input.reset(); return true;
  };
  T.leave = function () {
    if (!T.active) return;
    T.active = false; R = null; document.body.classList.remove('trial'); SW.Input.reset(); SW.Save.touch();
  };
  T.reset = function () { if (T.active && R && R.state === 'play') build(R.id); };

  function say(k) { R.msg = tr(k); R.msgT = 3; }
  // Belohnung einmalig vergeben (Raum und Duell). Gibt Anzeige-Daten zurück.
  function grant(id, rw) {
    const o = { xp: rw.xp || 0, lv: SW.Char.addXp(rw.xp || 0), ess: [], yy: { yin: rw.yin || 0, yang: rw.yang || 0 } };
    if (rw.yin) SW.YinYang.gain('yin', rw.yin);
    if (rw.yang) SW.YinYang.gain('yang', rw.yang);
    if (rw.ess) { SW.Essence.add(rw.ess); o.ess.push(rw.ess + ' ' + tr('ess')); }
    T.done.add(id); if (SW.Skills) SW.Skills.check(); SW.Save.save();
    return o;
  }
  T.duelWon = id => {
    const o = grant(id, ROOMS[id].reward);
    if (R && R.id === id && R.def.kind === 'miniboss') {
      const lines = ['+' + o.xp + ' XP'].concat(o.lv);
      if (o.yy.yin) lines.push('Yin +' + o.yy.yin); if (o.yy.yang) lines.push('Yang +' + o.yy.yang);
      o.ess.forEach(x => lines.push('+' + x)); R.rew = lines; R.state = 'reward'; R.t = 0;
    }
    return o;
  };
  function claim() {
    const o = grant(R.id, R.def.reward), L = ['+' + o.xp + ' XP'].concat(o.lv);
    if (o.yy.yin) L.push('Yin +' + o.yy.yin); if (o.yy.yang) L.push('Yang +' + o.yy.yang);
    o.ess.forEach(x => L.push('+' + x));
    R.rew = L; R.state = 'reward'; R.t = 0;
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
  function traceBeam() {
    if (!R || (R.def.kind !== 'mirrors' && R.def.kind !== 'combo')) return;
    if (R.def.kind === 'combo' && !R.pressureActive) { R.beam = []; R.beamSolved = false; return; }
    const x0 = 2, y0 = 8; let x = x0, y = y0, dx = 1, dy = 0, hit = false;
    const path = [{ x: x + .5, y: y + .5 }], seen = new Set();
    for (let step = 0; step < 80; step++) {
      x += dx; y += dy;
      if (x < 0 || y < 0 || x >= R.w || y >= R.h || R.g[y][x] === '#') break;
      path.push({ x: x + .5, y: y + .5 });
      if (R.g[y][x] === 'C') { hit = true; break; }
      if (R.g[y][x] === 'M') {
        const key = x + ',' + y + ',' + dx + ',' + dy;
        if (seen.has(key)) break;
        seen.add(key);
        const m = R.mirrors.find(o => o.x === x && o.y === y);
        if (!m) break;
        if (m.orientation === 0) { const ndx = -dy; dy = -dx; dx = ndx; }
        else { const ndx = dy; dy = dx; dx = ndx; }
      }
    }
    R.beam = path; R.beamSolved = hit;
    if (hit && !R.open) { R.open = true; say('tr_door'); }
  }
  function tryRotateMirror(sx, sy) {
    if (!R || (R.def.kind !== 'mirrors' && R.def.kind !== 'combo') || R.mirrorCooldown > 0) return false;
    const p = R.p;
    const m = R.mirrors.find(o => {
      const dx = o.x + .5 - p.x, dy = o.y + .5 - p.y;
      return Math.hypot(dx, dy) < 1.2 && dx * sx + dy * sy > 0;
    });
    if (!m) return false;
    m.orientation = 1 - m.orientation; R.mirrorCooldown = .45; traceBeam();
    say('tr_mirror_turn'); return true;
  }

  T.update = function (dt, v) {
    if (!R) return;
    R.t += dt; R.shake = Math.max(0, R.shake - dt); R.mirrorCooldown = Math.max(0, R.mirrorCooldown - dt); if (R.msgT > 0) R.msgT -= dt;
    const k = Math.exp(-dt * 16); R.blocks.forEach(b => { b.ox *= k; b.oy *= k; });
    if (R.state === 'reward') { if (R.t > 4.5) T.leave(); return; }
    const p = R.p, m = Math.hypot(v.x, v.y); let pushing = false;
    p.moving = m > .01;
    if (p.moving) {
      const sp = SPEED * Math.min(1, m), dx = v.x / m * sp * dt, dy = v.y / m * sp * dt;
      p.face = Math.atan2(dy, dx); if (Math.abs(dx) > .001) p.dir = dx > 0 ? 1 : -1; p.anim += dt * sp * 2.2;
      if (!blocked(p.x + dx, p.y)) p.x += dx; else if (Math.abs(dx) >= Math.abs(dy) * .8) { pushing = tryPush(dx > 0 ? 1 : -1, 0, dt); tryRotateMirror(dx > 0 ? 1 : -1, 0); }
      if (!blocked(p.x, p.y + dy)) p.y += dy; else if (Math.abs(dy) >= Math.abs(dx) * .8) { pushing = tryPush(0, dy > 0 ? 1 : -1, dt) || pushing; tryRotateMirror(0, dy > 0 ? 1 : -1); }
    } else p.anim = 0;
    // Kombinationsraum: Bei aktivem Timer dreht eine bewusste Annäherung
    // an den Spiegel ihn auch dann, wenn die Kollision durch Tile-Rundung knapp verfehlt wird.
    // Kombinationsraum: Bei aktivem Zeitfenster wird der Spiegel durch
    // gezieltes Zulaufen aus kurzer Distanz zuverlässig in die Zielstellung gedreht.
    if (R.def.kind === 'combo' && R.pressureActive && !R.beamSolved && m > .01) {
      const mirror = R.mirrors[0];
      if (mirror) {
        const tx = mirror.x + .5 - p.x, ty = mirror.y + .5 - p.y;
        const dist = Math.hypot(tx, ty);
        if (dist < 1.6 && v.x * tx + v.y * ty > 0) {
          mirror.orientation = 0;
          R.mirrorCooldown = .45;
          traceBeam();
          say('tr_mirror_turn');
        }
      }
    }
    if (!pushing) R.push.t = 0;
    if (R.def.kind === 'miniboss') {
      if (R.bossStarted && !SW.Combat.active && !T.done.has(R.id)) {
        R.bossStarted = false; R.bossCooldown = 2; R.p.x = 12.5; R.p.y = 14.5; say('tr_miniboss_retry');
      }
      R.bossCooldown = Math.max(0, R.bossCooldown - dt);
      if (!R.bossStarted && R.bossCooldown <= 0 && Math.hypot(p.x - 12.5, p.y - 5.5) < 1.05) {
        R.bossStarted = true;
        SW.Combat.start({ id: 'trial_' + R.id, type: R.def.bossType || 'boss', x: 12.5, y: 5.5, tier: R.def.tier || 1, trial: R.id, dead: false });
        return;
      }
    }
    if (R.def.kind === 'movement' || (R.def.kind === 'sequence' && R.sequenceReady)) {
      R.checkpoints.forEach(cp => {
        if (!cp.reached && Math.hypot(p.x - cp.x - .5, p.y - cp.y - .5) < .62) {
          cp.reached = true; R.checkpoint = { x: cp.x, y: cp.y }; say('tr_movement_checkpoint');
        }
      });
      const hit = R.hazards.find(h => hazardActive(h) && Math.hypot(p.x - h.x - .5, p.y - h.y - .5) < .48);
      if (hit) { p.x = R.checkpoint.x + .5; p.y = R.checkpoint.y + .5; R.shake = .25; say('tr_movement_hit'); }
      if (!R.open && R.checkpoints.every(cp => cp.reached) && p.y < 4.2) { R.open = true; say('tr_door'); }
    }
    if (R.def.kind === 'blocks' && !R.open && R.plates.every(pl => blockAt(pl.x, pl.y))) { R.open = true; say('tr_door'); }
    if (R.def.kind === 'combo' && !R.open) {
      if (!R.pressureActive && R.pressurePlate && Math.hypot(p.x - R.pressurePlate.x - .5, p.y - R.pressurePlate.y - .5) < .62) {
        R.pressureActive = true; R.pressureTime = R.rules.comboTime; traceBeam(); say('tr_combo_start');
      }
      if (R.pressureActive && !R.beamSolved) {
        R.pressureTime = Math.max(0, R.pressureTime - dt);
        if (R.pressureTime <= 0) {
          R.pressureActive = false;
          R.mirrors.forEach(m => { m.orientation = 1; });
          traceBeam(); say('tr_combo_expired');
        }
      }
    }
    if (R.def.kind === 'labyrinth' && !R.open && Math.hypot(p.x - 12.5, p.y - 2.5) < 1.15) { R.open = true; say('tr_door'); }
    if ((R.def.kind === 'switches' || R.def.kind === 'sequence') && !R.open && !R.sequenceReady) {
      R.switches.forEach((sw, i) => {
        if (!R.swOn[i] && Math.hypot(p.x - sw.x - .5, p.y - sw.y - .5) < .62) {
          R.swOn[i] = true;
          if (R.swOn.every(Boolean)) {
            if (R.def.kind === 'sequence') { R.sequenceReady = true; say('tr_sequence_ready'); }
            else { R.open = true; say('tr_door'); }
          }
        }
      });
    }
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
      else if (g === 'F') { c.fillStyle = '#d5a83f'; c.fillRect(px + u * .2, py + u * .2, u * .6, u * .6); c.fillStyle = '#fff2a8'; c.fillRect(px + u * .38, py + u * .38, u * .24, u * .24); }
      else if (g === 'C') { c.fillStyle = '#6bd9e8'; c.beginPath(); c.moveTo(px + u * .5, py + u * .12); c.lineTo(px + u * .88, py + u * .5); c.lineTo(px + u * .5, py + u * .88); c.lineTo(px + u * .12, py + u * .5); c.closePath(); c.fill(); c.strokeStyle = '#d8fbff'; c.lineWidth = Math.max(2, u * .06); c.stroke(); }
      else if (g === 'H') {
        const h = R.hazards.find(o => o.x === x && o.y === y), active = h && hazardActive(h);
        c.fillStyle = active ? '#d94a3f' : '#53616b'; c.fillRect(px + u * .08, py + u * .08, u * .84, u * .84);
        c.strokeStyle = active ? '#ffb09a' : '#8db7bd'; c.lineWidth = Math.max(2, u * .07); c.strokeRect(px + u * .16, py + u * .16, u * .68, u * .68);
        if (active) { c.globalCompositeOperation = 'lighter'; glow(c, px + u / 2, py + u / 2, u * .7, '#ff493b', .45); c.globalCompositeOperation = 'source-over'; }
      }
      else if (g === 'K') {
        const cp = R.checkpoints.find(o => o.x === x && o.y === y), reached = cp && cp.reached;
        c.fillStyle = reached ? '#d5a83f' : '#4b6570'; c.fillRect(px + u * .18, py + u * .18, u * .64, u * .64);
        c.strokeStyle = reached ? '#fff0a0' : '#9ad2d8'; c.lineWidth = Math.max(2, u * .07); c.strokeRect(px + u * .18, py + u * .18, u * .64, u * .64);
      }
      else if (g === 'V') {
        const on = R.pressureActive;
        c.fillStyle = on ? '#d5a83f' : '#686477'; c.fillRect(px + u * .12, py + u * .12, u * .76, u * .76);
        c.strokeStyle = on ? '#fff0a0' : '#aaa5b7'; c.lineWidth = Math.max(2, u * .07); c.strokeRect(px + u * .2, py + u * .2, u * .6, u * .6);
      }
      else if (g === 'Q') {
        const si = R.switches.findIndex(sw => sw.x === x && sw.y === y), on = si >= 0 && R.swOn[si];
        c.fillStyle = on ? '#d5a83f' : '#686477'; c.beginPath(); c.arc(px + u / 2, py + u / 2, u * .3, 0, TAU); c.fill();
        c.strokeStyle = on ? '#fff0a0' : '#aaa5b7'; c.lineWidth = Math.max(2, u * .06); c.stroke();
        c.fillStyle = on ? '#fff3bd' : '#292733'; c.fillRect(px + u * .42, py + u * .42, u * .16, u * .16);
      }
      else if (g === 'D' && !R.open) { c.fillStyle = '#6a4424'; c.fillRect(px, py, u + 1, u + 1); c.fillStyle = '#3e2814'; for (let i = 1; i < 4; i++) c.fillRect(px + u * i / 4 - 1, py, 3, u); c.fillStyle = '#b5352b'; c.beginPath(); c.arc(px + u / 2, py + u / 2, u * .16, 0, TAU); c.fill(); }
    }
    // Objekte nach Tiefe
    const it = [];
    R.blocks.forEach(b => it.push({ y: b.y + b.oy + .5, f: () => block(c, b, ox, oy, u) }));
    R.mirrors.forEach(m => it.push({ y: m.y + .7, f: () => drawMirror(c, m, ox, oy, u) }));
    R.lant.forEach((l, i) => it.push({ y: l.y + .6, f: () => lantern(c, l, i, ox, oy, u, time) }));
    for (let y = 0; y < R.h; y++) for (let x = 0; x < R.w; x++) if (R.g[y][x] === 'A') it.push({ y: y + .7, f: () => altar(c, x, y, ox, oy, u, time) });
    it.push({ y: R.p.y + .1, f: () => SW.Render.drawPlayer(c, Math.round(ox + R.p.x * u), Math.round(oy + (R.p.y + .3) * u), u, R.p) });
    it.sort((a, b) => a.y - b.y).forEach(o => o.f());
    if ((R.def.kind === 'mirrors' || R.def.kind === 'combo') && R.beam.length > 1) {
      c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = R.beamSolved ? '#a8f4ff' : '#f5d875'; c.lineWidth = Math.max(2, u * .12); c.shadowColor = c.strokeStyle; c.shadowBlur = u * .55; c.beginPath();
      R.beam.forEach((p, i) => { const x = ox + p.x * u, y = oy + p.y * u; if (!i) c.moveTo(x, y); else c.lineTo(x, y); }); c.stroke(); c.restore();
    }
    if (R.def.kind === 'combo' && R.pressureActive && !R.beamSolved) {
      txt(c, tr('tr_timer') + ': ' + R.pressureTime.toFixed(1) + 's', cw / 2, ch * .105, Math.max(14 * dpr, u * .42), '#ffe27a');
    }
    if (R.def.kind === 'movement') {
      txt(c, tr('tr_movement_progress') + ': ' + R.checkpoints.filter(cp => cp.reached).length + '/' + R.checkpoints.length, cw / 2, ch * .105, Math.max(14 * dpr, u * .42), '#9fe4e8');
    }
    if (R.def.kind === 'sequence') {
      const count = R.swOn.filter(Boolean).length, passed = R.checkpoints.filter(cp => cp.reached).length;
      const status = R.sequenceReady ? tr('tr_movement_progress') + ': ' + passed + '/' + R.checkpoints.length : tr('tr_sequence_switches') + ': ' + count + '/' + R.switches.length;
      txt(c, status, cw / 2, ch * .105, Math.max(14 * dpr, u * .42), R.sequenceReady ? '#9fe4e8' : '#ffe27a');
    }
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
  function drawMirror(c, m, ox, oy, u) {
    const x = ox + (m.x + .5) * u, y = oy + (m.y + .5) * u;
    c.save(); c.translate(x, y); c.rotate(m.orientation === 0 ? -Math.PI / 4 : Math.PI / 4);
    c.fillStyle = '#454d61'; c.fillRect(-u * .38, -u * .1, u * .76, u * .2);
    c.fillStyle = '#b7eaf0'; c.fillRect(-u * .32, -u * .06, u * .64, u * .12);
    c.strokeStyle = '#e9ffff'; c.lineWidth = Math.max(2, u * .05); c.strokeRect(-u * .32, -u * .06, u * .64, u * .12); c.restore();
  }
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
  T.info = id => { const d = ROOMS[id]; if (!d) return null; const rules = challengeProfile(d.tier); return { w: d.map[0].length, h: d.map.length, kind: d.kind, bossType: d.bossType || null, tier: rules.tier, comboTime: rules.comboTime, barrierPeriod: rules.barrierPeriod, barrierActive: rules.barrierActive, barrierWindow: rules.barrierWindow, layout: hashId(d.map.join('')), objects: d.map.join('').split('').filter(c => c === 'B' || c === 'P' || c === 'L' || c === 'M').length, switches: d.map.join('').split('Q').length - 1, sequence: d.kind === 'sequence', mirrors: d.map.join('').split('M').length - 1, pressure: d.map.join('').split('V').length - 1, hazards: d.map.join('').split('H').length - 1, checkpoints: d.map.join('').split('K').length - 1, walls: d.map.join('').split('#').length - 1 }; };
  T.dump = () => ({ done: [...T.done] });
  T.load = function (d) {
    if (!d || !Array.isArray(d.done)) return;
    d.done.filter(id => typeof id === 'string' && ROOMS[id]).forEach(id => T.done.add(id));
  };

  Object.assign(SW.TEXT.en, {
    tr_enter: 'Enter', tr_leave: 'Leave', tr_reset: 'Reset', tr_done: 'Trial complete', tr_door: 'The door opens.', tr_wrong: 'The flames die. Try again.',
    tr_hint_blocks: 'Explore the chambers and push all three stones onto their plates.', tr_hint_lanterns: 'Explore the shrine grounds and light the five lanterns in the order shown above.', tr_hint_switches: 'Find all three floor switches and step on each one to open the altar door.', tr_hint_mirrors: 'Walk into the mirror to turn it. Redirect the light beam from the western source into the crystal above.', tr_hint_combo: 'Step on the pressure plate, then hurry to the mirror. Turn it before the timer runs out.', tr_hint_labyrinth: 'Find your way through the maze and reach the sealed altar door.', tr_hint_sequence: 'Activate all three floor switches in the lower chamber. This unlocks a timed passage with two checkpoints; cross all three barriers to reach the altar.', tr_sequence_ready: 'All switches are active. The timed passage is unlocked.', tr_sequence_switches: 'Switches', tr_combo_start: 'The mechanism is active. Move!', tr_combo_expired: 'Time ran out. The mirror resets.', tr_timer: 'Time', tr_mirror_turn: 'The mirror turns.',
    trn_village: 'Trial of Stillness', trn_bamboo: 'Trial of Flames', trn_mountain: 'Trial of Stone', trn_hermit: 'Trial of Patience',
    trn_lookout: 'Trial of Balance', trn_fishers: 'Trial of Ripples', trn_ruins: 'Trial of the Ancients', trn_cave: 'Trial of Steel', trn_labyrinth: 'Trial of the Lost Path'
  });
  SW.TEXT.de = Object.assign(SW.TEXT.de || {}, {
    tr_enter: 'Betreten', tr_leave: 'Verlassen', tr_reset: 'Neustart', tr_done: 'Prüfung bestanden', tr_door: 'Die Tür öffnet sich.', tr_wrong: 'Die Flammen erlöschen. Versuche es erneut.',
    tr_hint_blocks: 'Erkunde die Kammern und schiebe alle drei Steine auf ihre Platten.', tr_hint_lanterns: 'Erkunde das Schreinareal und entzünde die fünf Laternen in der oben gezeigten Reihenfolge.', tr_hint_switches: 'Finde alle drei Bodenschalter und tritt auf jeden, um die Altartür zu öffnen.', tr_hint_mirrors: 'Laufe gegen den Spiegel, um ihn zu drehen. Lenke den Lichtstrahl von der westlichen Lichtquelle in den Kristall im Norden.', tr_hint_combo: 'Tritt auf die Druckplatte und laufe dann schnell zum Spiegel. Drehe ihn, bevor die Zeit abläuft.', tr_hint_labyrinth: 'Finde den Weg durch das Labyrinth und erreiche die verschlossene Altartür.', tr_hint_sequence: 'Aktiviere alle drei Bodenschalter in der unteren Kammer. Dadurch wird ein zeitgesteuerter Weg mit zwei Checkpoints freigeschaltet. Überquere alle drei Sperren, um den Altar zu erreichen.', tr_sequence_ready: 'Alle Schalter sind aktiv. Der Zeitparcours ist freigeschaltet.', tr_sequence_switches: 'Schalter', tr_combo_start: 'Der Mechanismus ist aktiv. Beeil dich!', tr_combo_expired: 'Die Zeit ist abgelaufen. Der Spiegel stellt sich zurück.', tr_timer: 'Zeit', tr_mirror_turn: 'Der Spiegel dreht sich.',
    trn_village: 'Prüfung der Stille', trn_bamboo: 'Prüfung der Flammen', trn_mountain: 'Prüfung des Steins', trn_hermit: 'Prüfung der Geduld',
    trn_lookout: 'Prüfung des Gleichgewichts', trn_fishers: 'Prüfung der Wellen', trn_ruins: 'Prüfung der Uralten', trn_cave: 'Prüfung des Stahls', trn_labyrinth: 'Prüfung des Irrwegs'
  });
  return T;
})();
