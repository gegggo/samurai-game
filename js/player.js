'use strict';
// Spielfigur: Position, Bewegung, Kollision.
SW.Player = (function () {
  const W = SW.World, RAD = .28;
  const p = { x: W.spawn.x, y: W.spawn.y, face: Math.PI / 2, dir: 1, anim: 0, moving: false, mul: 1, stamina: 100, maxStamina: 100, sprinting: false }; // mul = Tempofaktor (Weltkampf)
  function blocked(x, y) {
    return W.solid(Math.floor(x - RAD), Math.floor(y - RAD)) || W.solid(Math.floor(x + RAD), Math.floor(y - RAD)) ||
           W.solid(Math.floor(x - RAD), Math.floor(y + RAD)) || W.solid(Math.floor(x + RAD), Math.floor(y + RAD));
  }
  p.update = function (dt, v) {
    const m = Math.hypot(v.x, v.y);
    p.moving = m > .01;
    const sprint = !!(SW.Input.sprint && p.moving && p.stamina > 0 && !SW.paused && !SW.Combat.active && !(SW.WCombat && SW.WCombat.active));
    p.sprinting = sprint;
    if (sprint) p.stamina = Math.max(0, p.stamina - 24 * dt);
    else p.stamina = Math.min(p.maxStamina, p.stamina + 16 * dt);
    const sf = document.getElementById('world-stamina-fill');
    if (sf) sf.style.width = (p.stamina / p.maxStamina * 100) + '%';
    if (!p.moving) { p.anim = 0; return; }
    const sp = SW.CFG.SPEED * (sprint ? 1.65 : 1) * Math.min(1, m) * p.mul, dx = v.x / m * sp * dt, dy = v.y / m * sp * dt;
    p.face = Math.atan2(dy, dx);
    if (Math.abs(dx) > .001) p.dir = dx > 0 ? 1 : -1;
    p.anim += dt * sp * 2.2;
    if (!blocked(p.x + dx, p.y)) p.x += dx;
    if (!blocked(p.x, p.y + dy)) p.y += dy;
  };
  // Verschiebung mit Kollision (Ausweichrolle, Rückstoß)
  p.push = function (dx, dy) { if (!blocked(p.x + dx, p.y)) p.x += dx; if (!blocked(p.x, p.y + dy)) p.y += dy; };
  return p;
})();
