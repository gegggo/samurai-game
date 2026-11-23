'use strict';
// UI: Minimap, Regionsbanner, Hauptmenü (Phase 1: nur Map aktiv), Entdeckung von Orten.
SW.UI = (function () {
  const W = SW.World, OV = SW.CFG.OV, WW = W.WIDTH, HH = W.HEIGHT, OSW = Math.ceil(WW / OV), OSH = Math.ceil(HH / OV); // Kartenbild skaliert mit CFG.W/H (OV wächst mit der Welt)
  const $ = id => document.getElementById(id);
  const TABS = [['map', 1], ['inventory', 4], ['equipment', 4], ['skills', 3], ['skilltree', 3], ['quests', 4], ['character', 3], ['karma', 3], ['settings', 1]];
  const U = { disc: new Set(), seen: new Set(), sel: null, pins: [], pin: null, view: { z: 1, x: WW / 2, y: HH / 2 } };
  let cmp, posEl, posK = '', cmpK = -1, mini, mc, ov, oc, ov2, oc2, ovRow = 0, reg = -1, banner, bt = 0, menu, panel, mapC, mapT = 0, mt = 0, tab = 'map', open = false;

  U.init = function () {
    cmp = $('compass');
    posEl = document.createElement('div'); posEl.id = 'pos'; document.body.appendChild(posEl); // Koordinaten unter der Minikarte
    mini = $('mini'); mc = mini.getContext('2d'); banner = $('banner'); menu = $('menu'); panel = $('menu-panel');
    ov = document.createElement('canvas'); ov.width = OSW; ov.height = OSH; oc = ov.getContext('2d');
    oc.fillStyle = '#000'; oc.fillRect(0, 0, OSW, OSH);
    ov2 = document.createElement('canvas'); ov2.width = OSW; ov2.height = OSH; oc2 = ov2.getContext('2d');
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
    menu.classList.toggle('maptab', k === 'map'); // Karte füllt das Panel neben der Tab-Spalte
    if (k === 'map') {
      mapC = document.createElement('canvas'); mapC.id = 'world-map'; panel.appendChild(mapC);
      U.view.z = 0; U.view.x = WW / 2; U.view.y = HH / 2; sizeMap(); mapEvents(); drawMap();
    }
    else if (SW.Menus && SW.Menus[k]) SW.Menus[k](panel);
  }
  // Sprachwechsel: Tab-Beschriftungen neu setzen
  U.relabel = function () {
    [...$('menu-tabs').children].forEach(b => { b.firstChild.nodeValue = SW.t('tab_' + b.dataset.k); if (b.disabled) b.title = SW.t('locked', 4); });
  };
  // Nach Tabwechsel/Screenshot: iOS kann Offscreen-Canvas leeren -> Übersichtsbild neu aufbauen
  U.resume = function () {
    try {
      const m = W.CEN[0], x = Math.floor(m[0] / OV), y = Math.floor(m[1] / OV);
      if (ovRow >= OSH && oc2.getImageData(x, y, 1, 1).data[3] === 0) { ovRow = 0; cb = null; oc.fillStyle = '#000'; oc.fillRect(0, 0, OSW, OSH); }
    } catch (e) { /* egal */ }
    if (open && tab === 'map' && mapC) { sizeMap(); drawMap(); }
  };
  U.isOpen = () => open;
  U.open = function (k) { if (!open) toggle(true); selectTab(k); };
  // Schnellreise: Tipp auf Schrein wählt ihn, Knopf reist dorthin
  const ZMAX = 5 * Math.max(1, WW / 2400); // Zoomstufe wächst mit der Welt
  // Inhaltsrahmen der Karte: Landfläche (Meer ausgenommen), damit die Karte im Panel zentriert steht
  let cb = null;
  function content() {
    if (cb) return cb;
    const fb = [0, 0, WW, HH];
    if (ovRow < OSH) return fb; // Bild noch im Aufbau
    try {
      const d = oc2.getImageData(0, 0, OSW, OSH).data; let x0 = OSW, y0 = OSH, x1 = -1, y1 = -1;
      for (let y = 0; y < OSH; y++) for (let x = 0; x < OSW; x++) { const k = (y * OSW + x) * 4; if (d[k + 3] > 0 && d[k] + d[k + 1] + d[k + 2] > 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
      if (x1 < 0) return fb;
      const pad = 3; cb = [Math.max(0, (x0 - pad) * OV), Math.max(0, (y0 - pad) * OV), Math.min(WW, (x1 + 1 + pad) * OV), Math.min(HH, (y1 + 1 + pad) * OV)];
      return cb;
    } catch (e) { return fb; }
  }
  const zmin = A => { const b = content(), cw = b[2] - b[0], ch = b[3] - b[1]; return Math.min(WW / cw, A * WW / ch); }; // ganze Landfläche sichtbar
  function clampView() {
    const v = U.view, A = mapC ? mapC.height / mapC.width : 1;
    v.z = Math.max(zmin(A), Math.min(ZMAX, v.z));
    const hx = WW / v.z / 2, hy = hx * A, b = content();
    v.x = hx * 2 >= b[2] - b[0] ? (b[0] + b[2]) / 2 : Math.max(b[0] + hx, Math.min(b[2] - hx, v.x));
    v.y = hy * 2 >= b[3] - b[1] ? (b[1] + b[3]) / 2 : Math.max(b[1] + hy, Math.min(b[3] - hy, v.y));
  }
  // Zoom um einen Bildschirmpunkt (fx, fy = 0..1 im Kartenbild), Punkt bleibt unter dem Finger
  function zoomAt(f, fx, fy) {
    const v = U.view, A = mapC.height / mapC.width, wx = v.x + (fx - .5) * WW / v.z, wy = v.y + (fy - .5) * A * WW / v.z;
    v.z = Math.max(zmin(A), Math.min(ZMAX, v.z * f));
    v.x = wx - (fx - .5) * WW / v.z; v.y = wy - (fy - .5) * A * WW / v.z; clampView(); drawMap();
  }
  function mapTap(cx, cy) {
    const r = mapC.getBoundingClientRect(), v = U.view;
    const wx = v.x + ((cx - r.left) / r.width - .5) * WW / v.z, wy = v.y + ((cy - r.top) / r.height - .5) * r.height / r.width * WW / v.z;
    const lim = 38 / r.width * WW / v.z; let best = null, bd = lim;
    const pi = U.pins.findIndex(q => Math.hypot(q.x - wx, q.y - wy) < lim * .8); // Tipp auf eigene Markierung: entfernen anbieten
    if (pi >= 0) { U.sel = null; U.pin = pi; drawMap(); travelBar(null); pinBar(pi); return; }
    U.pin = null;
    SW.Shrines.list.forEach(s => { if (!SW.Shrines.isFound(s.id)) return; const d = Math.hypot(s.x - wx, s.y - wy); if (d < bd) { bd = d; best = s.id; } });
    U.sel = best; drawMap(); travelBar(best);
  }
  // Karten-Markierungen (0.22.1): langes Druecken setzt einen Punkt (max. 10), Tipp darauf bietet Entfernen an. Gespeichert im Spielstand (pins).
  const MAXPIN = 10;
  U.longPress = function (cx, cy) {
    const r = mapC.getBoundingClientRect(), v = U.view;
    const wx = v.x + ((cx - r.left) / r.width - .5) * WW / v.z, wy = v.y + ((cy - r.top) / r.height - .5) * r.height / r.width * WW / v.z;
    if (wx < 0 || wy < 0 || wx > WW || wy > HH) return;
    if (U.pins.length >= MAXPIN) { showBanner(SW.t('pin_max')); return; }
    U.pins.push({ x: Math.round(wx), y: Math.round(wy) }); U.pin = null; SW.Save.touch(); drawMap();
    if (navigator.vibrate) { try { navigator.vibrate(20); } catch (e) { /* optional */ } }
  };
  function pinBar(i) {
    const old = document.getElementById('travel-bar'); if (old) old.remove();
    const q = U.pins[i], bar = document.createElement('div'); bar.id = 'travel-bar'; // gleiche Leiste/Formatierung wie Schnellreise
    const lbl = document.createElement('span'); lbl.textContent = SW.t('pin_at', q.x + ' · Y ' + q.y); bar.appendChild(lbl);
    const rm = document.createElement('button'); rm.className = 'btn'; rm.textContent = SW.t('pin_remove'); rm.onclick = () => { U.pins.splice(i, 1); U.pin = null; bar.remove(); SW.Save.touch(); drawMap(); }; bar.appendChild(rm);
    const no = document.createElement('button'); no.className = 'btn'; no.textContent = SW.t('travel_cancel'); no.onclick = () => { U.pin = null; bar.remove(); drawMap(); }; bar.appendChild(no);
    ['pointerdown', 'pointerup'].forEach(n => bar.addEventListener(n, e => e.stopPropagation()));
    panel.appendChild(bar);
  }
  U.dumpPins = () => U.pins.map(q => [q.x, q.y]);
  U.loadPins = d => { U.pins = Array.isArray(d) ? d.filter(a => Array.isArray(a) && isFinite(a[0]) && isFinite(a[1])).slice(0, MAXPIN).map(a => ({ x: +a[0], y: +a[1] })) : []; };
  // Schnellreise: Tipp auf entdeckten Schrein -> Leiste mit Name, Reisen und Abbrechen (nur aktivierte Schreine sind Ziele)
  let traveling = false;
  function travelBar(id) {
    const old = document.getElementById('travel-bar'); if (old) old.remove();
    if (!id) return;
    const on = SW.Shrines.isOn(id), bar = document.createElement('div'); bar.id = 'travel-bar';
    const lbl = document.createElement('span'); lbl.textContent = on ? SW.t('travel_to', SW.Shrines.name(id)) : SW.t('travel_off', SW.Shrines.name(id)); bar.appendChild(lbl);
    if (on) {
      const go = document.createElement('button'); go.className = 'btn'; go.textContent = SW.t('travel_go');
      go.onclick = () => {
        if (traveling) return;
        if (!SW.Shrines.canTravel(id)) { lbl.textContent = SW.t('travel_blocked'); return; }
        traveling = true; U.sel = null; bar.remove();
        const ld = document.getElementById('loading'), tx = document.createElement('div'); tx.className = 'ltxt'; tx.textContent = SW.t('travel_loading', SW.Shrines.name(id)); ld.appendChild(tx);
        ld.classList.remove('done'); // Ladebild einblenden (ca. 1,6 s gesamt)
        setTimeout(() => { SW.Shrines.travel(id); toggle(false); }, 800);
        setTimeout(() => { ld.classList.add('done'); traveling = false; setTimeout(() => tx.remove(), 700); }, 1600);
      };
      bar.appendChild(go);
    }
    const no = document.createElement('button'); no.className = 'btn'; no.textContent = SW.t('travel_cancel'); no.onclick = () => { U.sel = null; bar.remove(); drawMap(); }; bar.appendChild(no);
    ['pointerdown', 'pointerup'].forEach(n => bar.addEventListener(n, e => e.stopPropagation()));
    panel.appendChild(bar);
  }
  // Karte: ein Finger = verschieben, zwei Finger = zoomen, kurzer Tipp = Schrein wählen, Mausrad = zoomen
  function mapEvents() {
    const c = mapC, P = new Map(); let moved = 0, multi = false, last = 0, lm = null, lpT = 0, lp = false;
    const span = () => { const a = [...P.values()]; return Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) || 1; };
    const mid = () => { const a = [...P.values()]; return { x: (a[0].x + a[1].x) / 2, y: (a[0].y + a[1].y) / 2 }; };
    c.style.touchAction = 'none';
    c.addEventListener('pointerdown', e => { try { c.setPointerCapture(e.pointerId); } catch (x) { /* optional */ } P.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (P.size === 1) { moved = 0; multi = false; lp = false; clearTimeout(lpT); const sx = e.clientX, sy = e.clientY; lpT = setTimeout(() => { if (P.size === 1 && !multi && moved <= 8) { lp = true; U.longPress(sx, sy); } }, 550); } else { multi = true; clearTimeout(lpT); last = span(); lm = mid(); } e.preventDefault(); });
    c.addEventListener('pointermove', e => {
      const p = P.get(e.pointerId); if (!p) return;
      const r = c.getBoundingClientRect(), v = U.view, W2 = WW;
      if (P.size >= 2) {
        P.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const sp = span(), m = mid(); if (lm) { v.x -= (m.x - lm.x) / r.width * W2 / v.z; v.y -= (m.y - lm.y) / r.width * W2 / v.z; } lm = m; zoomAt(sp / last, (m.x - r.left) / r.width, (m.y - r.top) / r.height); last = sp; return;
      }
      const dx = e.clientX - p.x, dy = e.clientY - p.y; moved += Math.abs(dx) + Math.abs(dy);
      p.x = e.clientX; p.y = e.clientY;
      if (moved > 8) { v.x -= dx / r.width * W2 / v.z; v.y -= dy / r.width * W2 / v.z; clampView(); drawMap(); }
    });
    const end = e => {
      const had = P.has(e.pointerId); P.delete(e.pointerId); clearTimeout(lpT);
      if (had && !multi && !lp && P.size === 0 && moved <= 8 && e.type === 'pointerup') mapTap(e.clientX, e.clientY);
      if (P.size === 0) multi = false;
    };
    c.addEventListener('pointerup', end); c.addEventListener('pointercancel', end);
    c.addEventListener('wheel', e => { e.preventDefault(); const r = c.getBoundingClientRect(); zoomAt(e.deltaY < 0 ? 1.25 : .8, (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height); }, { passive: false });
  }
  // Menü neu aufbauen (Scrollposition bleibt)
  U.refresh = function () { const y = panel.scrollTop; selectTab(tab); panel.scrollTop = y; };
  function sizeMap() { const d = SW.dpr || 1, w = Math.max(1, panel.clientWidth), h = Math.max(1, panel.clientHeight); mapC.style.width = w + 'px'; mapC.style.height = h + 'px'; mapC.width = Math.round(w * d); mapC.height = Math.round(h * d); clampView(); }
  function showBanner(txt) { banner.textContent = txt; banner.style.opacity = 1; bt = 2.8; }
  U.banner = showBanner;
  const XP_REGION = 10, XP_POI = 15; // Erkundungs-XP (Platzhalter)
  function explore(n) { const m = SW.Char.addXp(n); if (m.length) showBanner(m.join(' ')); }

  // Flächenfarbe je Region (Index = W.regionAt)
  const RCOL = [[143, 160, 95], [74, 122, 58], [138, 130, 112], [58, 100, 56], [64, 112, 96], [126, 118, 108], [118, 106, 92], [140, 100, 60], [88, 78, 98], [44, 84, 56], [128, 126, 120], [88, 112, 70], [225, 232, 238], [118, 62, 42], [214, 176, 98], [205, 190, 140], [140, 124, 108], [214, 150, 176], [132, 112, 104]];
  // Übersichtsbild der Welt, schrittweise erzeugt (blockiert den Start nicht)
  function stepOverview() {
    if (ovRow >= OSH) return;
    const n = Math.min(Math.max(1, Math.floor(7200 / OSW)), OSH - ovRow), img = oc.createImageData(OSW, n); // ca. 7200 Bildpunkte je Bild, blockiert nichts
    for (let j = 0; j < n; j++) for (let i = 0; i < OSW; i++) {
      const c = W.PAL[W.terrain(i * OV + OV / 2 | 0, (ovRow + j) * OV + OV / 2 | 0)], k = (j * OSW + i) * 4;
      img.data[k] = c[0]; img.data[k + 1] = c[1]; img.data[k + 2] = c[2]; img.data[k + 3] = 255;
    }
    oc.putImageData(img, 0, ovRow);
    // Kartenbild im Stil des World Draft: Meer schwarz, Regionen als Flächen, Wasser, Wege, heller Küstenrand
    const im2 = oc2.createImageData(OSW, n), TT = W.T, h = OV / 4 | 0;
    for (let j = 0; j < n; j++) for (let i = 0; i < OSW; i++) {
      const X0 = i * OV + OV / 2 | 0, Y0 = (ovRow + j) * OV + OV / 2 | 0, t = W.terrain(X0, Y0), k = (j * OSW + i) * 4;
      let c = [0, 0, 0];
      if (t !== TT.SEA) {
        c = RCOL[W.regionAt(X0, Y0)] || RCOL[0];
        if (t === TT.DEEP) c = [32, 70, 150]; else if (t === TT.WATER) c = [58, 110, 190]; else if (t === TT.LAVA) c = [200, 70, 30]; else if (t === TT.SAND) c = [222, 204, 150];
        else for (let q = 0; q < 4; q++) { const u = W.terrain(X0 + (q & 1 ? h : -h), Y0 + (q & 2 ? h : -h)); if (u === TT.PATH || u === TT.BRIDGE) { c = [226, 200, 140]; break; } if (u === TT.WATER) c = [58, 110, 190]; }
        if (t !== TT.WATER && t !== TT.DEEP && (W.terrain(X0 - OV, Y0) === TT.SEA || W.terrain(X0 + OV, Y0) === TT.SEA || W.terrain(X0, Y0 - OV) === TT.SEA || W.terrain(X0, Y0 + OV) === TT.SEA)) c = [201, 185, 138]; // Küstenlinie
      }
      im2.data[k] = c[0]; im2.data[k + 1] = c[1]; im2.data[k + 2] = c[2]; im2.data[k + 3] = 255;
    }
    oc2.putImageData(im2, 0, ovRow); ovRow += n;
  }

  function drawMini(p) {
    const w = mini.width, sp = 60, k = w / sp, sx = p.x / OV - sp / 2, sy = p.y / OV - sp / 2;
    mc.fillStyle = '#0b0b0f'; mc.fillRect(0, 0, w, w);
    mc.drawImage(ov, -sx * k, -sy * k, OSW * k, OSH * k);
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
    U.pins.forEach((q, i) => { // Markierung wie auf der Karte (gelb, Nummer)
      const x = (q.x / OV - sx) * k, y = (q.y / OV - sy) * k, r = w * .05;
      mc.fillStyle = '#f2c14e'; mc.strokeStyle = '#000'; mc.lineWidth = 1.5; mc.beginPath(); mc.arc(x, y, r, 0, 6.2832); mc.fill(); mc.stroke();
      mc.font = '700 ' + Math.round(r * 1.5) + 'px sans-serif'; mc.textAlign = 'center'; mc.textBaseline = 'middle'; mc.fillStyle = '#000'; mc.fillText(String(i + 1), x, y + 1);
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

  // Ortssymbole der Karte
  const KIND = { village: 'v', peakvillage: 'v', fishers: 'v', hermit: 'v', huts: 'v', temple: 't', ruins: 't', cave: 't', shrine: 't', camp: 'c', fortress: 'c', sakuratown: 'v' };
  function poiIcon(c, k, x, y, r, got, d) {
    c.save(); c.globalAlpha = got ? 1 : .85; c.lineJoin = 'round'; c.lineWidth = 1.6 * d; c.strokeStyle = got ? '#fff' : 'rgba(15,20,30,.9)';
    c.beginPath();
    if (k === 'v') { c.fillStyle = '#f0a43c'; c.moveTo(x - r, y - r * .1); c.lineTo(x, y - r); c.lineTo(x + r, y - r * .1); c.lineTo(x + r * .7, y - r * .1); c.lineTo(x + r * .7, y + r * .8); c.lineTo(x - r * .7, y + r * .8); c.lineTo(x - r * .7, y - r * .1); c.closePath(); }
    else if (k === 't') { c.fillStyle = '#d9503f'; c.moveTo(x - r * 1.1, y - r * .8); c.lineTo(x + r * 1.1, y - r * .8); c.lineTo(x + r * .8, y - r * .35); c.lineTo(x + r * .55, y - r * .35); c.lineTo(x + r * .55, y + r * .9); c.lineTo(x + r * .25, y + r * .9); c.lineTo(x + r * .25, y - r * .35); c.lineTo(x - r * .25, y - r * .35); c.lineTo(x - r * .25, y + r * .9); c.lineTo(x - r * .55, y + r * .9); c.lineTo(x - r * .55, y - r * .35); c.lineTo(x - r * .8, y - r * .35); c.closePath(); }
    else if (k === 'c') { c.fillStyle = '#b8472a'; c.moveTo(x, y - r); c.lineTo(x + r * 1.1, y + r * .8); c.lineTo(x - r * 1.1, y + r * .8); c.closePath(); }
    else { r *= .8; c.fillStyle = got ? '#f2c14e' : 'rgba(242,193,78,.55)'; c.moveTo(x, y - r); c.lineTo(x + r, y); c.lineTo(x, y + r); c.lineTo(x - r, y); c.closePath(); }
    c.fill(); c.stroke(); c.restore();
  }

  function drawMap() {
    if (!mapC) return;
    const c = mapC.getContext('2d'), s = mapC.width, hh = mapC.height, p = SW.Player, v = U.view, ppw = s / WW * v.z, d = SW.dpr || 1;
    const X = wx => (wx - v.x) * ppw + s / 2, Y = wy => (wy - v.y) * ppw + hh / 2;
    c.fillStyle = '#000'; c.fillRect(0, 0, s, hh);
    c.imageSmoothingEnabled = v.z < 2.5;
    { // nur sichtbaren Ausschnitt des Übersichtsbildes zeichnen (riesige Zielgrößen verträgt iOS nicht, Bild wurde schwarz)
      const sx0 = Math.max(0, (v.x - s / 2 / ppw) / OV), sy0 = Math.max(0, (v.y - hh / 2 / ppw) / OV), sx1 = Math.min(OSW, (v.x + s / 2 / ppw) / OV), sy1 = Math.min(OSH, (v.y + hh / 2 / ppw) / OV);
      const dr = im => c.drawImage(im, sx0, sy0, sx1 - sx0, sy1 - sy0, X(sx0 * OV), Y(sy0 * OV), (sx1 - sx0) * OV * ppw, (sy1 - sy0) * OV * ppw);
      if (sx1 > sx0 && sy1 > sy0) { dr(ov2); if (v.z > 2) { c.globalAlpha = Math.min(1, (v.z - 2) / 1.5); dr(ov); c.globalAlpha = 1; } } // beim Hineinzoomen Gelände-Detail wie Minimap einblenden (genauer Marker setzen)
    }
    c.strokeStyle = 'rgba(232,224,208,.6)'; c.lineWidth = 2; c.strokeRect(1, 1, s - 2, hh - 2);
    c.font = (11 * d) + 'px sans-serif'; c.textAlign = 'center';
    // Namen: alle Regionen und Orte stehen auf der Karte, noch nicht besuchte gedämpft. Schreine bleiben an Entdeckung gebunden (Schnellreise).
    const used = []; // belegte Textfelder: überlappende Namen entfallen (beim Hineinzoomen erscheinen sie)
    const lab = (s, x, y, a, big) => { c.font = '700 ' + ((big ? 14 : 11) * d) + 'px sans-serif'; const tw = c.measureText(s).width / 2 + 3 * d, th = (big ? 14 : 11) * d; if (used.some(u => Math.abs(u[0] - x) < u[2] + tw && Math.abs(u[1] - y) < u[3] + th)) return; used.push([x, y, tw, th / 2]); c.globalAlpha = a; c.lineJoin = 'round'; c.lineWidth = 3 * d; c.strokeStyle = 'rgba(15,20,30,.85)'; c.strokeText(s, x, y); c.fillStyle = '#fff'; c.fillText(s, x, y); c.globalAlpha = 1; };
    const poiNames = W.POI.map(o => SW.t('poi_' + o.id));
    for (let r = 0; r < W.CEN.length; r++) { const n = SW.t('reg_' + r), m = W.CEN[r]; if (m && poiNames.indexOf(n) < 0) lab(n, X(m[0]), Y(m[1]) - 14 * d, U.seen.has(r) ? 1 : .75, 1); } // gleichnamige Orte nicht doppelt beschriften
    // Orte: Symbol je Art (Dorf = Haus, Tempel/Ruine/Höhle = Tor, Lager = Zelt, sonst Raute). Alle immer sichtbar, unentdeckte gedämpft.
    const pois = W.POI.slice().sort((a, b) => (KIND[b.id] ? 1 : 0) - (KIND[a.id] ? 1 : 0) || U.disc.has(b.id) - U.disc.has(a.id));
    pois.slice().reverse().forEach(o => poiIcon(c, KIND[o.id] || 'n', X(o.x), Y(o.y), 7 * d, U.disc.has(o.id), d)); // wichtige Symbole zuletzt = obenauf
    pois.forEach(o => { // Beschriftung: wichtige zuerst, Ausweichpositionen gegen Überlappung
      const x = X(o.x), y = Y(o.y), got = U.disc.has(o.id), s = SW.t('poi_' + o.id);
      const dys = KIND[o.id] ? [17, -13, 31, -27] : [16, -12];
      c.font = '700 ' + (11 * d) + 'px sans-serif';
      const tw = c.measureText(s).width / 2 + 3 * d, th = 11 * d;
      for (const dy of dys) {
        const ly = y + dy * d;
        if (used.some(u => Math.abs(u[0] - x) < u[2] + tw && Math.abs(u[1] - ly) < u[3] + th)) continue;
        used.push([x, ly, tw, th / 2]); c.globalAlpha = got ? 1 : .8; c.lineJoin = 'round'; c.lineWidth = 3 * d; c.strokeStyle = 'rgba(15,20,30,.85)'; c.strokeText(s, x, ly); c.fillStyle = '#fff'; c.fillText(s, x, ly); c.globalAlpha = 1; break;
      }
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
    U.pins.forEach((q, i) => { // Markierung: gelber Tropfen mit Nummer
      const x = X(q.x), y = Y(q.y), r = 8 * d; c.fillStyle = '#f2c14e'; c.strokeStyle = '#1a1a1a'; c.lineWidth = 1.5 * d;
      c.beginPath(); c.arc(x, y - r * 1.5, r, 0, 6.2832); c.moveTo(x - r * .7, y - r * .9); c.lineTo(x, y); c.lineTo(x + r * .7, y - r * .9); c.fill(); c.stroke();
      c.fillStyle = '#1a1a1a'; c.font = 'bold ' + (10 * d) + 'px sans-serif'; c.fillText(String(i + 1), x, y - r * 1.5 + 3.5 * d);
      if (U.pin === i) { c.strokeStyle = '#fff'; c.lineWidth = 2.5 * d; c.beginPath(); c.arc(x, y - r * 1.5, r * 1.6, 0, 6.2832); c.stroke(); }
    });
    c.fillStyle = '#e0452f'; c.strokeStyle = '#fff'; c.lineWidth = 2 * d; c.beginPath(); c.arc(X(p.x), Y(p.y), 5 * d, 0, 6.2832); c.fill(); c.stroke();
    // eigene Position als Koordinaten (Kacheln, Weltmaß CFG.W x CFG.H)
    const pt = 'X ' + Math.floor(p.x) + ' · Y ' + Math.floor(p.y); c.font = (13 * d) + 'px sans-serif'; c.textAlign = 'left';
    c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(8 * d, 8 * d, c.measureText(pt).width + 12 * d, 22 * d); c.fillStyle = '#fff'; c.fillText(pt, 14 * d, 24 * d); c.textAlign = 'center';
    // Legende unten links
    c.font = (11 * d) + 'px sans-serif'; c.textAlign = 'left'; let lx = 12 * d; const ly = hh - 14 * d;
    [['v', 'leg_village'], ['t', 'leg_temple'], ['c', 'leg_camp'], ['n', 'leg_place']].forEach(e => {
      const t = SW.t(e[1]), w = c.measureText(t).width; c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(lx - 4 * d, ly - 11 * d, 28 * d + w, 22 * d);
      poiIcon(c, e[0], lx + 7 * d, ly, 7 * d, true, d); c.fillStyle = '#fff'; c.fillText(t, lx + 20 * d, ly + 4 * d); lx += 36 * d + w;
    }); c.textAlign = 'center';
  }

  U.update = function (dt) {
    const p = SW.Player;
    stepOverview();
    const r = W.regionAt(Math.floor(p.x), Math.floor(p.y));
    if (r !== reg) {
      const first = reg === -1, fresh = !U.seen.has(r); reg = r; U.seen.add(r); showBanner(SW.t('reg_' + r));
      if (!first) { if (fresh) explore(XP_REGION); SW.Save.touch(); } // Autosave bei jedem Gebietswechsel
    }
    W.POI.forEach(o => {
      if (!U.disc.has(o.id) && Math.hypot(o.x - p.x, o.y - p.y) < 40) { U.disc.add(o.id); showBanner(SW.t('discovered', SW.t('poi_' + o.id))); explore(XP_POI); SW.Save.touch(); }
    });
    if (bt > 0) { bt -= dt; if (bt <= 0) banner.style.opacity = 0; }
    const hd = Math.round((((p.face * 180 / Math.PI + 90) % 360) + 360) % 360 / 45) % 8;
    if (hd !== cmpK) { cmpK = hd; cmp.textContent = SW.t('dir_' + hd); }
    const pk = 'X ' + Math.floor(p.x) + ' · Y ' + Math.floor(p.y);
    if (pk !== posK) { posK = pk; posEl.textContent = pk; }
    mt -= dt; if (mt <= 0) { mt = .1; drawMini(p); }
    if (open) { mapT -= dt; if (mapT <= 0) { mapT = .3; drawMap(); } }
  };
  return U;
})();
