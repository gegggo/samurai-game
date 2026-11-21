'use strict';
// Zoom sperren (iOS Safari ignoriert user-scalable=no): Doppeltipp, Pinch und Gesten abfangen
(function () {
  const st = document.createElement('style'); st.textContent = '*{touch-action:manipulation}html,body,#game,.cb{touch-action:none}#menu-panel,#menu-tabs{touch-action:pan-y}'; document.head.appendChild(st);
  ['gesturestart', 'gesturechange', 'gestureend', 'dblclick'].forEach(n => document.addEventListener(n, e => e.preventDefault(), { passive: false }));
  document.addEventListener('touchmove', e => { if (e.touches.length > 1 || (e.scale && e.scale !== 1)) e.preventDefault(); }, { passive: false });
  let lt = 0;
  document.addEventListener('touchend', e => { const n = Date.now(); if (n - lt < 320 && !(e.target.closest && e.target.closest('button'))) e.preventDefault(); lt = n; }, { passive: false });
})();
// Fehleranzeige: zeigt JS-Fehler direkt auf dem Bildschirm (Test auf dem Handy)
function showErr(t) {
  let d = document.getElementById('errbox');
  if (!d) { d = document.createElement('div'); d.id = 'errbox'; d.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:99;background:#800;color:#fff;font:12px monospace;padding:6px;white-space:pre-wrap;max-height:40%;overflow:auto'; document.body.appendChild(d); }
  d.textContent += t + '\n';
}
window.addEventListener('error', e => { if (e.target && e.target.tagName) return; showErr((e.filename || '').split('/').pop() + ':' + e.lineno + ' ' + e.message); });
(window.__e || []).forEach(showErr); // Fehler beim Laden der Skripte (fehlende Datei / Fehler beim Start)
// Start und Hauptschleife.
(function () {
  const canvas = document.getElementById('game'), ctx = canvas.getContext('2d');
  SW.cam = { x: SW.Player.x, y: SW.Player.y };
  function resize() {
    SW.dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = canvas.clientWidth || window.innerWidth, h = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.floor(w * SW.dpr); canvas.height = Math.floor(h * SW.dpr);
    SW.Render.resize(canvas.width, canvas.height);
  }
  let frozenKey = '', frozenAt = 0;
  const later = () => {
    setTimeout(vpFix, 150); setTimeout(vpFix, 600);
    ['UI', 'Render', 'Combat'].forEach(m => { try { SW[m] && SW[m].resume && SW[m].resume(); } catch (e) { /* egal */ } });
    frozenKey = ''; // Standbild hinter dem Menü neu zeichnen (iOS leert die Zeichenfläche beim Tabwechsel/Screenshot)
    last = performance.now();
    SW.Input.reset();
    resize();
    const rs = () => { resize(); try { SW.UI.resume(); } catch (e) { /* egal */ } };
    setTimeout(rs, 250);
    setTimeout(rs, 700);
    setTimeout(rs, 1500);
  };
  // iOS-Fehler: nach Screenshot bleibt die Seitenbreite auf Hochformat (z. B. 393 statt 852) haengen -> halber schwarzer Bildschirm.
  // Erkennung: Gerät liegt quer (window.orientation +-90), Fensterbreite aber kleiner als die lange Seite. Behebung: Viewport-Meta neu setzen, sonst Neuladen (Spielstand wird vorher gespeichert).
  let vpTry = 0, vpForced = false;
  const longSide = () => Math.max(screen.width, screen.height);
  const isLandscape = () => (typeof window.orientation === 'number' && Math.abs(window.orientation) === 90) || (screen.orientation && /landscape/.test(screen.orientation.type || ''));
  const landscapeBroken = () => isLandscape() && window.innerWidth < longSide() * .8;
  const vpMeta = () => document.querySelector('meta[name=viewport]');
  let vpOrig = null;
  function vpRestore() { const m = vpMeta(); if (m && vpOrig) { m.setAttribute('content', vpOrig); } vpForced = false; frozenKey = ''; resize(); }
  function vpFix() {
    const m = vpMeta(); if (!m) return;
    if (vpOrig === null) vpOrig = m.getAttribute('content');
    if (!landscapeBroken()) { vpTry = 0; if (vpForced && isLandscape()) { /* Zwangsbreite bleibt, solange Querformat */ } else if (vpForced) vpRestore(); return; }
    vpTry++;
    if (vpTry === 1) { // Stufe 1: Skalierung minimal ändern
      m.setAttribute('content', 'width=device-width, initial-scale=1.0001, viewport-fit=cover');
      setTimeout(() => { m.setAttribute('content', vpOrig); frozenKey = ''; resize(); }, 80);
    } else if (vpTry === 2 || vpTry === 3) { // Stufe 2: Breite fest auf lange Seite setzen
      vpForced = true; m.setAttribute('content', 'width=' + longSide() + ', initial-scale=1, viewport-fit=cover');
      setTimeout(() => { frozenKey = ''; resize(); }, 80);
    } else if (vpTry > 5) { // Stufe 3: Neuladen (Spielstand vorher speichern), nicht in Schleife
      let n = 0; try { n = +sessionStorage.getItem('sw_vp') || 0; } catch (e) { /* egal */ }
      if (Date.now() - n < 8000) return;
      try { sessionStorage.setItem('sw_vp', Date.now()); } catch (e) { /* egal */ }
      try { SW.Save.save(); } catch (e) { /* egal */ }
      location.reload();
    }
  }
  setInterval(() => { if (!document.hidden) vpFix(); }, 400);
  window.addEventListener('resize', () => { frozenKey = ''; resize(); setTimeout(vpFix, 150); });
  window.addEventListener('focus', () => { frozenKey = ''; });
  window.addEventListener('orientationchange', later);
  window.addEventListener('pageshow', () => { vpTry = 0; later(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { vpTry = 0; later(); } });
  canvas.addEventListener('contextlost', e => { e.preventDefault(); showErr('Canvas-Kontext verloren; warte auf Wiederherstellung.'); });
  canvas.addEventListener('contextrestored', later);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);
  resize();
  SW.Input.init(canvas);
  SW.UI.init();
  SW.Combat.init();
  SW.Save.load();
  SW.Skills.check();
  SW.Title.show();
  setTimeout(() => document.getElementById('loading').classList.add('done'), Math.max(0, 1500 - performance.now())); // Ladebildschirm: mindestens 1,5 s sichtbar
  // Schutz: ist css/main.css veraltet oder fehlt, erscheint eine Warnung im Spiel
  const cssOk = () => getComputedStyle(document.getElementById('mini')).position === 'fixed';
  let last = performance.now(), time = 0;
  let lastFrameAt = performance.now();
  function step(now) {
    lastFrameAt = performance.now();
    try {
      const dt = Math.min(.05, Math.max(0, (now - last) / 1000)); last = now; time += dt;
      if (Math.abs(canvas.clientWidth * SW.dpr - canvas.width) > 2 || Math.abs(canvas.clientHeight * SW.dpr - canvas.height) > 2) resize();
      if (SW.Trials && SW.Trials.active) {
        SW.Input.update(); SW.Trials.update(dt, SW.Input.vec); SW.Trials.draw(ctx, canvas.width, canvas.height, time);
      } else if (SW.Combat.active) {
        SW.Combat.update(dt); SW.Combat.draw(ctx, canvas.width, canvas.height, time);
      } else {
        if (!SW.paused) {
          SW.Input.update();
          SW.Player.update(dt, SW.Input.vec);
          const k = 1 - Math.exp(-dt * 8);
          SW.cam.x += (SW.Player.x - SW.cam.x) * k; SW.cam.y += (SW.Player.y - SW.cam.y) * k;
          SW.Combat.check(SW.Player);
          SW.Inv.check(SW.Player);
          SW.Shrines.check(SW.Player);
          SW.Time.update(dt);
          SW.Save.tick(dt);
        }
        SW.Shop.update(SW.Player);
        // Hinter offenem Menü steht die Welt still: nur einmal je Fenstergröße zeichnen (spart viel Rechenzeit, Menü reagiert schneller)
        const dk = canvas.width + 'x' + canvas.height;
        if (!(SW.UI.isOpen() && frozenKey === dk && now - frozenAt < 1000)) { SW.Render.draw(ctx, canvas.width, canvas.height, time); frozenKey = SW.UI.isOpen() ? dk : ''; frozenAt = now; } // im Menü: höchstens 1 Bild pro Sekunde als Sicherheit
        SW.UI.update(dt);
        ctx.fillStyle = 'rgba(244,236,216,.55)'; ctx.font = Math.round(canvas.height / 40) + 'px sans-serif'; ctx.textAlign = 'left';
        ctx.fillText('v' + SW.version, 56 * SW.dpr, canvas.height - 10 * SW.dpr);
        if (!cssOk()) { ctx.fillStyle = '#e0452f'; ctx.font = '700 ' + Math.round(canvas.height / 22) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('css/main.css veraltet - komplett ersetzen', canvas.width / 2, canvas.height / 8); }
      }
    } catch (e) {
      showErr('Frame-Fehler: ' + (e && e.message ? e.message : e));
    }
  }
  // Zeichenschleife mit Watchdog: bleibt sie nach Screenshot/Tabwechsel stehen, wird sie neu gestartet
  let gen = 0;
  function startLoop() { const g = ++gen; const f = now => { if (g !== gen) return; try { step(now); } finally { requestAnimationFrame(f); } }; requestAnimationFrame(f); }
  startLoop();
  // Diagnose: bei Auffälligkeit (Viewport schmal, Schleife steht) erscheint eine kleine Textzeile oben links
  let dg = null, dgUntil = 0;
  setInterval(() => {
    const stalled = !document.hidden && performance.now() - lastFrameAt > 1500;
    if (stalled) startLoop();
    const bad = landscapeBroken() || stalled;
    const now = Date.now();
    if (bad) dgUntil = now + 6000;
    if (now < dgUntil) {
      if (!dg) { dg = document.createElement('div'); dg.style.cssText = 'position:fixed;left:0;top:0;z-index:98;background:#036;color:#fff;font:11px monospace;padding:3px;white-space:pre-wrap;pointer-events:none'; document.body.appendChild(dg); }
      const vv = window.visualViewport;
      dg.textContent = 'VP iw=' + window.innerWidth + ' cw=' + document.documentElement.clientWidth + ' vv=' + (vv ? Math.round(vv.width) + '@' + vv.scale.toFixed(2) : '-') + ' ow=' + window.orientation + ' sw=' + screen.width + 'x' + screen.height + ' try=' + vpTry + ' forced=' + vpForced + ' stalled=' + stalled + ' cv=' + canvas.clientWidth + 'x' + canvas.clientHeight;
    } else if (dg) { dg.remove(); dg = null; }
  }, 500);
})();
