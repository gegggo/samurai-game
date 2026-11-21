'use strict';
// Spielfigur: Position, Bewegung, Kollision.
SW.Player = (function () {
  const W = SW.World, RAD = .28;
  const p = { x: W.spawn.x, y: W.spawn.y, face: Math.PI / 2, dir: 1, anim: 0, moving: false };
  function blocked(x, y) {
    return W.solid(Math.floor(x - RAD), Math.floor(y - RAD)) || W.solid(Math.floor(x + RAD), Math.floor(y - RAD)) ||
           W.solid(Math.floor(x - RAD), Math.floor(y + RAD)) || W.solid(Math.floor(x + RAD), Math.floor(y + RAD));
  }
  p.update = function (dt, v) {
    const m = Math.hypot(v.x, v.y);
    p.moving = m > .01;
    if (!p.moving) { p.anim = 0; return; }
    const sp = SW.CFG.SPEED * Math.min(1, m), dx = v.x / m * sp * dt, dy = v.y / m * sp * dt;
    p.face = Math.atan2(dy, dx);
    if (Math.abs(dx) > .001) p.dir = dx > 0 ? 1 : -1;
    p.anim += dt * sp * 2.2;
    if (!blocked(p.x + dx, p.y)) p.x += dx;
    if (!blocked(p.x, p.y + dy)) p.y += dy;
  };
  return p;
})();
