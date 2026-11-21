'use strict';
// UI: Minimap, Regionsbanner, Hauptmenü (Phase 1: nur Map aktiv), Entdeckung von Orten.
SW.UI = (function () {
  const W = SW.World, OV = SW.CFG.OV, OS = SW.CFG.WORLD / OV;
  const $ = id => document.getElementById(id);
  const TABS = [['map', 1], ['inventory', 4], ['equipment', 4], ['skills', 3], ['skilltree', 3], ['quests', 4], ['character', 3], ['karma', 3], ['settings', 1]];
  const U = { disc: new Set(), seen: new Set(), sel: null, view: { z: 1, x: 1200, y: 1200 } };
  let cmp, cmpK = -1, mini, mc, ov, oc, ovRow = 0, reg = -1, banner, bt = 0, menu, panel, mapC, mapT = 0, mt = 0, tab = 'map', open = false;

  U.init = function () {
    cmp = $('compass');
    mini = $('mini'); mc = mini.getContext('2d'); banner = $('banner'); menu = $('menu'); panel = $('menu-panel');
    ov = document.createElement('canvas'); ov.width = ov.height = OS; oc = ov.getContext('2d');
    oc.fillStyle = '#0b0b0f'; oc.fillRect(0, 0, OS, OS);
    const tabs = $('menu-tabs');
    TABS.forEach(a => {
      const b = document.createElement('button'); b.textContent = SW.t('tab_' + a[0]); b.dataset.k = a[0];
      if (a[1] > 4) { b.disabled = true; b.title = SW.t('locked', a[1]); const s = document.createElement('small'); s.textContent = 'P' + a[1]; b.appendChild(s); }
      else b.onclick = () => selectTab(a[0]);
      tabs.appendChild(b);
    });
    $('menu-btn').onclick = () => toggle(true);
    $('menu-close').onclick = () => toggle(false);
    resizeMini();
    window.addEventListener('resize', resizeMini);
    window.addEventListener('resize', () => { if (open && tab === 'map' && mapC) { sizeMap(); drawMap(); } });
  };
  function resizeMini() { const d = SW.dpr || 1; mini.width = mini.height = Math.round(mini.clientWidth * d) || 104; }
  function toggle(on) {
    open = on; SW.paused = on; menu.classList.toggle('open', on);
    if (on) { SW.Input.reset(); selectTab(tab); }
  }
  function selectTab(k) {
    tab = k;
    [...$('menu-tabs').children].forEach(b => b.classList.toggle('on', b.dataset.k === k));
    panel.innerHTML = '';
    panel.scrollTop = 0;
    if (k === 'map') { mapC = document.createElement('canvas'); mapC.id = 'world-map'; panel.appendChild(mapC); sizeMap(); mapEvents(); drawMap(); }
    else if (SW.Menus && SW.Menus[k]) SW.Menus[k](panel);
  }
  // Sprachwechsel: Tab-Beschriftungen neu setzen
  U.relabel = function () {
    [...$('menu-tabs').children].forEach(b => { b.firstChild.nodeValue = SW.t('tab_' + b.dataset.k); if (b.disabled) b.title = SW.t('locked', 4); });
  };
  U.isOpen = () => open;
  U.open = function (k) { if (!open) toggle(true); selectTab(k); };
  // Schnellreise: Tipp auf Schrein wählt ihn, Knopf reist dorthin
  const ZMAX = 5;
  function clampView() {
    const v = U.view, W2 = SW.CFG.WORLD, h = W2 / v.z / 2;
    v.z = Math.max(1, Math.min(ZMAX, v.z)); v.x = Math.max(h, Math.min(W2 - h, v.x)); v.y = Math.max(h, Math.min(W2 - h, v.y));
  }
  // Zoom um einen Bildschirmpunkt (fx, fy = 0..1 im Kartenbild), Punkt bleibt unter dem Finger
  function zoomAt(f, fx, fy) {
    const v = U.view, W2 = SW.CFG.WORLD, wx = v.x + (fx - .5) * W2 / v.z, wy = v.y + (fy - .5) * W2 / v.z;
    v.z = Math.max(1, Math.min(ZMAX, v.z * f));
    v.x = wx - (fx - .5) * W2 / v.z; v.y = wy - (fy - .5) * W2 / v.z; clampView(); drawMap();
  }
  function mapTap(cx, cy) {
    const r = mapC.getBoundingClientRect(), v = U.view, W2 = SW.CFG.WORLD;
    const wx = v.x + ((cx - r.left) / r.width - .5) * W2 / v.z, wy = v.y + ((cy - r.top) / r.height - .5) * W2 / v.z;
    const lim = 30 / r.width * W2 / v.z; let best = null, bd = lim;
    SW.Shrines.list.forEach(s => { if (!SW.Shrines.isFound(s.id)) return; const d = Math.hypot(s.x - wx, s.y - wy); if (d < bd) { bd = d; best = s.id; } });
    if (best && SW.Shrines.isOn(best)) { if (SW.Shrines.travel(best)) toggle(false); return; } U.sel = best; drawMap();
  }
  // Karte: ein Finger = verschieben, zwei Finger = zoomen, kurzer Tipp = Schrein wählen, Mausrad = zoomen
  function mapEvents() {
    const c = mapC, P = new Map(); let moved = 0, multi = false, last = 0;
    const span = () => { const a = [...P.values()]; return Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) || 1; };
    const mid = () => { const a = [...P.values()]; return { x: (a[0].x + a[1].x) / 2, y: (a[0].y + a[1].y) / 2 }; };
    c.style.touchAction = 'none';
    c.addEventListener('pointerdown', e => { try { c.setPointerCapture(e.pointerId); } catch (x) { /* optional */ } P.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (P.size === 1) { moved = 0; multi = false; } else { multi = true; last = span(); } e.preventDefault(); });
    c.addEventListener('pointermove', e => {
      const p = P.get(e.pointerId); if (!p) return;
      const r = c.getBoundingClientRect(), v = U.view, W2 = SW.CFG.WORLD;
      if (P.size >= 2) {
        P.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const sp = span(), m = mid(); zoomAt(sp / last, (m.x - r.left) / r.width, (m.y - r.top) / r.height); last = sp; return;
      }
      const dx = e.clientX - p.x, dy = e.clientY - p.y; moved += Math.abs(dx) + Math.abs(dy);
      p.x = e.clientX; p.y = e.clientY;
      if (moved > 8 && v.z > 1) { v.x -= dx / r.width * W2 / v.z; v.y -= dy / r.height * W2 / v.z; clampView(); drawMap(); }
    });
    const end = e => {
      const had = P.has(e.pointerId); P.delete(e.pointerId);
      if (had && !multi && P.size === 0 && moved <= 8 && e.type === 'pointerup') mapTap(e.clientX, e.clientY);
      if (P.size === 0) multi = false;
    };
    c.addEventListener('pointerup', end); c.addEventListener('pointercancel', end);
    c.addEventListener('wheel', e => { e.preventDefault(); const r = c.getBoundingClientRect(); zoomAt(e.deltaY < 0 ? 1.25 : .8, (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height); }, { passive: false });
  }
  // Menü neu aufbauen (Scrollposition bleibt)
  U.refresh = function () { const y = panel.scrollTop; selectTab(tab); panel.scrollTop = y; };
  function sizeMap() { const d = SW.dpr || 1, s = Math.max(1, Math.min(panel.clientWidth - 8, panel.clientHeight - 8)); mapC.style.width = mapC.style.height = s + 'px'; mapC.width = mapC.height = Math.round(s * d); }
  function showBanner(txt) { banner.textContent = txt; banner.style.opacity = 1; bt = 2.8; }
  U.banner = showBanner;
  const XP_REGION = 10, XP_POI = 15; // Erkundungs-XP (Platzhalter)
  function explore(n) { const m = SW.Char.addXp(n); if (m.length) showBanner(m.join(' ')); }

  // Übersichtsbild der Welt, schrittweise erzeugt (blockiert den Start nicht)
  function stepOverview(rows) {
    if (ovRow >= OS) return;
    const n = Math.min(rows, OS - ovRow), img = oc.createImageData(OS, n);
    for (let j = 0; j < n; j++) for (let i = 0; i < OS; i++) {
      const c = W.PAL[W.terrain(i * OV + OV / 2 | 0, (ovRow + j) * OV + OV / 2 | 0)], k = (j * OS + i) * 4;
      img.data[k] = c[0]; img.data[k + 1] = c[1]; img.data[k + 2] = c[2]; img.data[k + 3] = 255;
    }
    oc.putImageData(img, 0, ovRow); ovRow += n;
  }

  function drawMini(p) {
    const w = mini.width, sp = 90, k = w / sp, sx = p.x / OV - sp / 2, sy = p.y / OV - sp / 2;
    mc.fillStyle = '#0b0b0f'; mc.fillRect(0, 0, w, w);
    mc.drawImage(ov, -sx * k, -sy * k, OS * k, OS * k);
    mc.fillStyle = '#f2c14e';
    W.POI.forEach(o => {
      if (!U.disc.has(o.id)) return;
      const x = (o.x / OV - sx) * k, y = (o.y / OV - sy) * k, r = w * .035;
      mc.beginPath(); mc.moveTo(x, y - r); mc.lineTo(x + r, y); mc.lineTo(x, y + r); mc.lineTo(x - r, y); mc.fill();
    });
    SW.Shrines.list.forEach(o => {
      if (!SW.Shrines.isFound(o.id)) return;
      const x = (o.x / OV - sx) * k, y = (o.y / OV - sy) * k, r = w * .03;
      mc.fillStyle = SW.Shrines.isOn(o.id) ? '#e0452f' : '#8a8f9c'; mc.fillRect(x - r, y - r, r * 2, r * 2);
    });
    if (SW.Quests) SW.Quests.targets().forEach(o => {
      const x = (o.x / OV - sx) * k, y = (o.y / OV - sy) * k, r = w * .04;
      mc.fillStyle = '#6fd36f'; mc.strokeStyle = '#000'; mc.lineWidth = 1.5; mc.beginPath(); mc.arc(x, y, r, 0, 6.2832); mc.fill(); mc.stroke();
    });
    mc.font = '700 ' + Math.round(w * .13) + 'px Georgia, serif'; mc.textAlign = 'center'; mc.textBaseline = 'middle';
    [[0, w / 2, w * .1], [2, w * .9, w / 2], [4, w / 2, w * .9], [6, w * .1, w / 2]].forEach(d => {
      const s = SW.t('dir_' + d[0]); mc.fillStyle = 'rgba(0,0,0,.7)'; mc.fillText(s, d[1] + 1, d[2] + 1);
      mc.fillStyle = d[0] === 0 ? '#ff5a4a' : '#f4ecd8'; mc.fillText(s, d[1], d[2]);
    });
    mc.save(); mc.translate(w / 2, w / 2); mc.rotate(p.face + Math.PI / 2);
    mc.fillStyle = '#fff'; mc.strokeStyle = '#000'; mc.lineWidth = 2;
    mc.beginPath(); mc.moveTo(0, -w * .07); mc.lineTo(w * .045, w * .05); mc.lineTo(-w * .045, w * .05); mc.closePath(); mc.fill(); mc.stroke();
    mc.restore();
  }

  function drawMap() {
    if (!mapC) return;
    const c = mapC.getContext('2d'), s = mapC.width, p = SW.Player, v = U.view, W2 = SW.CFG.WORLD, ppw = s / W2 * v.z, d = SW.dpr || 1;
    const X = wx => (wx - v.x) * ppw + s / 2, Y = wy => (wy - v.y) * ppw + s / 2;
    c.fillStyle = '#0b0b0f'; c.fillRect(0, 0, s, s);
    c.imageSmoothingEnabled = v.z < 2.5; c.drawImage(ov, X(0), Y(0), W2 * ppw, W2 * ppw);
    c.strokeStyle = 'rgba(232,224,208,.6)'; c.lineWidth = 2; c.strokeRect(1, 1, s - 2, s - 2);
    c.font = (11 * d) + 'px sans-serif'; c.textAlign = 'center';
    // Namen: alle Regionen und Orte stehen auf der Karte, noch nicht besuchte gedämpft. Schreine bleiben an Entdeckung gebunden (Schnellreise).
    const lab = (s, x, y, a) => { c.globalAlpha = a; c.fillStyle = 'rgba(0,0,0,.65)'; c.fillText(s, x + 1, y + 1); c.fillStyle = '#f4ecd8'; c.fillText(s, x, y); c.globalAlpha = 1; };
    const poiNames = W.POI.map(o => SW.t('poi_' + o.id));
    for (let r = 0; r < 9; r++) { const n = SW.t('reg_' + r); if (poiNames.indexOf(n) < 0) lab(n, X(W.C[r % 3]), Y(W.C[(r / 3) | 0]) - 14 * d, U.seen.has(r) ? 1 : .6); } // gleichnamige Orte nicht doppelt beschriften
    W.POI.forEach(o => {
      const x = X(o.x), y = Y(o.y), r = 5 * d, got = U.disc.has(o.id);
      c.globalAlpha = got ? 1 : .55; c.fillStyle = got ? '#f2c14e' : 'rgba(242,193,78,.0)'; c.strokeStyle = '#f2c14e'; c.lineWidth = 1.5 * d;
      c.beginPath(); c.moveTo(x, y - r); c.lineTo(x + r, y); c.lineTo(x, y + r); c.lineTo(x - r, y); c.closePath(); if (got) c.fill(); else c.stroke(); c.globalAlpha = 1;
      lab(SW.t('poi_' + o.id), x, y + 16 * d, got ? 1 : .7);
    });
    SW.Shrines.list.forEach(o => {
      if (!SW.Shrines.isFound(o.id)) return;
      const x = X(o.x), y = Y(o.y), r = 6 * d, on = SW.Shrines.isOn(o.id);
      c.fillStyle = on ? '#e0452f' : '#8a8f9c'; c.strokeStyle = '#fff'; c.lineWidth = 1.5 * d; c.fillRect(x - r, y - r, r * 2, r * 2); c.strokeRect(x - r, y - r, r * 2, r * 2);
      if (U.sel === o.id) { c.strokeStyle = '#f2c14e'; c.lineWidth = 3 * d; c.beginPath(); c.arc(x, y, r * 2, 0, 6.2832); c.stroke(); }
      if (U.sel === o.id || on) { c.fillStyle = '#fff'; c.fillText(SW.Shrines.name(o.id), x, y + 32 * d); }
    });
    if (SW.Quests) SW.Quests.targets().forEach(o => {
      c.fillStyle = '#6fd36f'; c.strokeStyle = '#000'; c.lineWidth = 1.5 * d; c.beginPath(); c.arc(X(o.x), Y(o.y), 6 * d, 0, 6.2832); c.fill(); c.stroke();
    });
    c.fillStyle = '#e0452f'; c.strokeStyle = '#fff'; c.lineWidth = 2 * d; c.beginPath(); c.arc(X(p.x), Y(p.y), 5 * d, 0, 6.2832); c.fill(); c.stroke();
  }

  U.update = function (dt) {
    const p = SW.Player;
    stepOverview(24);
    const r = W.regionAt(Math.floor(p.x), Math.floor(p.y));
    if (r !== reg) {
      const first = reg === -1, fresh = !U.seen.has(r); reg = r; U.seen.add(r); showBanner(SW.t('reg_' + r));
      if (fresh && !first) { explore(XP_REGION); SW.Save.touch(); }
    }
    W.POI.forEach(o => {
      if (!U.disc.has(o.id) && Math.hypot(o.x - p.x, o.y - p.y) < 40) { U.disc.add(o.id); showBanner(SW.t('discovered', SW.t('poi_' + o.id))); explore(XP_POI); SW.Save.touch(); }
    });
    if (bt > 0) { bt -= dt; if (bt <= 0) banner.style.opacity = 0; }
    const hd = Math.round((((p.face * 180 / Math.PI + 90) % 360) + 360) % 360 / 45) % 8;
    if (hd !== cmpK) { cmpK = hd; cmp.textContent = SW.t('dir_' + hd); }
    mt -= dt; if (mt <= 0) { mt = .1; drawMini(p); }
    if (open) { mapT -= dt; if (mapT <= 0) { mapT = .3; drawMap(); } }
  };
  return U;
})();
