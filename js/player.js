'use strict';
// Spielfigur: Position, Bewegung, Kollision.
SW.Player = (function () {
  const W = SW.World, RAD = .28;
  const p = { x: W.spawn.x, y: W.spawn.y, face: Math.PI / 2, dir: 1, anim: 0, moving: false, mul: 1, stamina: 100, maxStamina: 100, sprinting: false, sprintLocked: false }; // mul = Tempofaktor (Weltkampf)
  function blocked(x, y) {
    return W.solid(Math.floor(x - RAD), Math.floor(y - RAD)) || W.solid(Math.floor(x + RAD), Math.floor(y - RAD)) ||
           W.solid(Math.floor(x - RAD), Math.floor(y + RAD)) || W.solid(Math.floor(x + RAD), Math.floor(y + RAD));
  }
  p.update = function (dt, v) {
    const m = Math.hypot(v.x, v.y);
    p.moving = m > .01;
    const sprintHeld = !!SW.Input.sprint;
    // Exhaustion lock: releasing the key/button and restoring at least 20% is required.
    if (!sprintHeld && p.sprintLocked && p.stamina >= p.maxStamina * .2) p.sprintLocked = false;
    let sprint = !!(sprintHeld && p.moving && p.stamina > 0 && !p.sprintLocked && !SW.paused && !SW.Combat.active && !(SW.WCombat && SW.WCombat.active));
    if (sprint) {
      p.stamina = Math.max(0, p.stamina - 24 * dt);
      if (p.stamina <= 0) { p.sprintLocked = true; sprint = false; }
    } else p.stamina = Math.min(p.maxStamina, p.stamina + 16 * dt);
    p.sprinting = sprint;
    const sf = document.getElementById('world-stamina-fill');
    if (sf) sf.style.width = (p.stamina / p.maxStamina * 100) + '%';
    const sprintButton = document.getElementById('world-sprint');
    if (sprintButton) sprintButton.classList.toggle('exhausted', p.sprintLocked);
    if (!p.moving) { p.anim = 0; return; }
    const sp = SW.CFG.SPEED * (sprint ? 1.65 : 1) * Math.min(1, m) * p.mul, dx = v.x / m * sp * dt, dy = v.y / m * sp * dt;
    p.face = Math.atan2(dy, dx);
    if (Math.abs(dx) > .001) p.dir = dx > 0 ? 1 : -1;
    p.anim += dt * sp * 2.2;
    // Große dt-Werte (z. B. nach einem Tab-Wechsel) dürfen keine dünnen Hindernisse überspringen.
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / .2));
    const sx = dx / steps, sy = dy / steps;
    for (let i = 0; i < steps; i++) {
      if (!blocked(p.x + sx, p.y)) p.x += sx;
      if (!blocked(p.x, p.y + sy)) p.y += sy;
    }
  };
  // Verschiebung mit Kollision (Ausweichrolle, Rückstoß)
  p.push = function (dx, dy) { if (!blocked(p.x + dx, p.y)) p.x += dx; if (!blocked(p.x, p.y + dy)) p.y += dy; };
  return p;
})();
