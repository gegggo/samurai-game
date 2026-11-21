'use strict';
// MOVED: Koordinaten Weltumbau (tools/move_content.py)
// Dorf-Wiederaufbau Hinode (Phase 5c). Namensraum SW.Village.
// Stufe wird nur aus dem Quest-Status abgeleitet (nichts Neues im Spielstand, alte Spielstände bleiben gültig).
// 0 besetzt | 1 befreit (elder1) | 2 Erste Hilfe (elder4) | 3 Häuser repariert (elder5) | 4 Schmiede (elder6) | 5 vollständig (+ elder2 Zaun)
// Sichtbar: beschädigte Häuser (s.dmg), zurückgekehrte Dorfbewohner (Shop.npcs mit amb), Schmiedeglut (render.js).
SW.Village = (function () {
  const W = SW.World, V = { stage: 0 }, T = (k, n) => SW.t(k, n);
  const done = id => !!(SW.Quests && SW.Quests.st[id] === 'done');
  V.calc = () => !done('elder1') ? 0 : !done('elder4') ? 1 : !done('elder5') ? 2 : !done('elder6') ? 3 : !done('elder2') ? 4 : 5;
  // Zurückgekehrte Bewohner: erscheinen ab Stufe at
  const FOLK = [
    { id: 'v_1', at: 2, x: 882.5, y: 1177.5, robe: '#8a6a4a', hat: '#4a3a2a' },
    { id: 'v_2', at: 3, x: 893.5, y: 1178.5, robe: '#4a6a7a', hat: '#c8b070' },
    { id: 'v_3', at: 5, x: 875.5, y: 1179.5, robe: '#7a4a5a', hat: '#2a2a30' }
  ];
  const houses = () => W.S.filter(s => s.type === 'house').slice(0, 8); // die 8 Dorfhäuser (zuerst erzeugt)
  function apply() {
    const fixed = V.stage >= 5 ? 8 : V.stage >= 3 ? 4 : 0;
    houses().forEach((s, i) => { s.dmg = i >= fixed; });
    FOLK.forEach(f => {
      if (V.stage < f.at || SW.Shop.npcs.some(n => n.id === f.id)) return;
      const p = SW.Shop.free(f.x, f.y);
      SW.Shop.npcs.push({ id: f.id, role: 'villager', q: false, amb: true, x: p.x, y: p.y, robe: f.robe, hat: f.hat });
    });
  }
  // announce = true: Text der neuen Stufe zurückgeben (für das Banner)
  V.update = function (announce) {
    const old = V.stage; V.stage = V.calc(); apply();
    return announce && V.stage > old ? T('vg_up', T('vg_' + V.stage)) : '';
  };
  V.card = function () {
    const H = SW.Menus.h, el = H.el, add = H.add, c = el('div', 'card');
    add(c, add(el('div', 'row'), el('b', '', T('vg_title')), el('span', 'chip', T('vg_' + V.stage))));
    add(c, el('div', 'dim', V.stage >= 5 ? T('vg_done') : T('vg_next') + ': ' + T('vgn_' + V.stage)));
    return c;
  };
  V.update(false);
  return V;
})();
