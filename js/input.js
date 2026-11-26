'use strict';
// Eingabe: virtueller Joystick (links, Touch) + Tastatur (zum Testen am Rechner).
SW.Input = (function () {
  const I = { vec: { x: 0, y: 0 }, joy: { active: false, id: -1, bx: 0, by: 0, cx: 0, cy: 0 }, RAD: 60 };
  const keys = {};
  function vecFromJoy() {
    const j = I.joy; let dx = j.cx - j.bx, dy = j.cy - j.by, d = Math.hypot(dx, dy);
    if (d > I.RAD) { // Finger weiter als Radius: Joystick-Mitte wird hinterhergezogen (dynamisch)
      const k = (d - I.RAD) / d; j.bx += dx * k; j.by += dy * k;
      dx = j.cx - j.bx; dy = j.cy - j.by; d = Math.hypot(dx, dy);
    }
    const m = Math.min(1, d / I.RAD);
    if (m < .15) return { x: 0, y: 0 };
    return { x: dx / (d || 1) * m, y: dy / (d || 1) * m };
  }
  I.reset = function () { I.joy.active = false; I.joy.id = -1; for (const k in keys) keys[k] = false; I.vec.x = I.vec.y = 0; };
  I.update = function () {
    if (SW.paused) { I.vec.x = I.vec.y = 0; return; }
    let kx = (keys.ArrowRight || keys.d ? 1 : 0) - (keys.ArrowLeft || keys.a ? 1 : 0);
    let ky = (keys.ArrowDown || keys.s ? 1 : 0) - (keys.ArrowUp || keys.w ? 1 : 0);
    if (kx || ky) { const m = Math.hypot(kx, ky); I.vec.x = kx / m; I.vec.y = ky / m; }
    else if (I.joy.active) { const v = vecFromJoy(); I.vec.x = v.x; I.vec.y = v.y; }
    else { I.vec.x = 0; I.vec.y = 0; }
  };
  I.init = function (el) {
    el.addEventListener('pointerdown', e => {
      if (SW.paused || I.joy.active || e.clientX > window.innerWidth * .55) return;
      e.preventDefault();
      Object.assign(I.joy, { active: true, id: e.pointerId, bx: e.clientX, by: e.clientY, cx: e.clientX, cy: e.clientY });
      try { el.setPointerCapture(e.pointerId); } catch (x) {}
    });
    el.addEventListener('pointermove', e => { if (I.joy.active && e.pointerId === I.joy.id) { I.joy.cx = e.clientX; I.joy.cy = e.clientY; } });
    const end = e => { if (I.joy.active && e.pointerId === I.joy.id) { I.joy.active = false; I.joy.id = -1; } };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
    window.addEventListener('keydown', e => { keys[e.key.length === 1 ? e.key.toLowerCase() : e.key] = true; });
    window.addEventListener('keyup', e => { keys[e.key.length === 1 ? e.key.toLowerCase() : e.key] = false; });
    window.addEventListener('blur', I.reset);
  };
  return I;
})();
