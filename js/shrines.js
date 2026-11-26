'use strict';
// Schreine, Aktivierung, Schnellreise (Phase 5a). Namensraum SW.Shrines.
// Ablauf: Schrein in Sichtweite = entdeckt (auf Karte sichtbar, kein Reiseziel). Am Schrein beten = erweckt (Reiseziel, gespeichert).
// Schnellreise: über die Karte im Menü, nur zu erweckten Schreinen, nicht im Kampf.
SW.Shrines = (function () {
  const D = SW.Data, W = SW.World, S = { list: [], found: new Set(), on: new Set(), RANGE: 2.3, SEE: 14, XP: 20 };

  function free(x, y) {
    for (let r = 0; r < 40; r++) {
      const n = r ? r * 8 : 1;
      for (let a = 0; a < n; a++) {
        const g = a / n * 6.2832, px = Math.floor(x + Math.cos(g) * r), py = Math.floor(y + Math.sin(g) * r);
        if (!W.solid(px, py) && !W.solid(px + 1, py) && !W.solid(px, py + 1) && !W.solid(px - 1, py) && !W.solid(px, py - 1)) return { x: px + .5, y: py + .5 };
      }
    }
    return { x, y };
  }
  D.shrines.forEach(d => { const p = free(d.x, d.y); S.list.push({ id: d.id, x: p.x, y: p.y }); });

  S.get = id => S.list.find(s => s.id === id) || null;
  S.name = id => SW.t('shr_' + id);
  S.isOn = id => S.on.has(id);
  S.isFound = id => S.found.has(id);
  S.near = function (p) {
    let best = null, bd = S.RANGE;
    S.list.forEach(s => { const d = Math.hypot(s.x - p.x, s.y - p.y); if (d < bd) { bd = d; best = s; } });
    return best;
  };
  // Entdeckung: jeden Frame billig prüfen
  S.check = function (p) {
    for (let i = 0; i < S.list.length; i++) {
      const s = S.list[i];
      if (!S.found.has(s.id) && Math.hypot(s.x - p.x, s.y - p.y) < S.SEE) {
        S.found.add(s.id); if (SW.UI) SW.UI.banner(SW.t('shrine_found', S.name(s.id))); SW.Save.touch();
      }
    }
  };
  S.activate = function (id) {
    if (!S.get(id) || S.on.has(id)) return false;
    S.found.add(id); S.on.add(id);
    const m = SW.Char.addXp(S.XP);
    if (SW.UI) SW.UI.banner(SW.t('shrine_on', S.name(id)) + (m.length ? ' ' + m.join(' ') : ''));
    SW.Save.touch(); return true;
  };
  // Erstes Beten erweckt den Schrein. Danach ist nur noch das Betreten möglich.
  S.interact = function (s) {
    if (!s || SW.paused || SW.Combat.active) return false;
    if (!S.on.has(s.id)) return S.activate(s.id);
    if (SW.Trials && SW.Trials.can(s.id)) return SW.Trials.enter(s.id);
    return false;
  };
  // Schnellreise ist sowohl in Arena-Kämpfen als auch in laufenden Weltkämpfen gesperrt.
  S.canTravel = id => !!(S.get(id) && S.on.has(id) && !SW.Combat.active && !(SW.WCombat && SW.WCombat.active));
  S.travel = function (id) {
    if (!S.canTravel(id)) return false;
    const s = S.get(id), p = SW.Player;
    // Ankunft knapp südlich des Schreins, sonst am Schrein selbst
    const a = [[0, 1.4], [1.4, 0], [-1.4, 0], [0, -1.4], [0, 0]].find(o => !W.solid(Math.floor(s.x + o[0]), Math.floor(s.y + o[1])));
    p.x = s.x + a[0]; p.y = s.y + a[1]; p.moving = false;
    if (SW.cam) { SW.cam.x = p.x; SW.cam.y = p.y; }
    if (SW.UI) SW.UI.banner(SW.t('shrine_travel', S.name(id)));
    SW.Save.touch(); return true;
  };
  S.dump = () => ({ found: [...S.found], on: [...S.on] });
  S.load = function (d) {
    if (!d) return;
    const ok = id => typeof id === 'string' && !!S.get(id);
    (Array.isArray(d.found) ? d.found : []).filter(ok).forEach(id => S.found.add(id));
    (Array.isArray(d.on) ? d.on : []).filter(ok).forEach(id => { S.on.add(id); S.found.add(id); });
  };
  return S;
})();
