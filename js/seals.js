'use strict';
SW.Seals = (function () {
  const D = SW.Data, T = (k, n) => SW.t(k, n), found = new Set();
  const list = (D.spots || []).filter(s => s.seal && s.seal !== 'final');
  const altar = Object.assign({ id: 'five_seals_altar', region: 6, x: 800, y: 2320 }, D.sealAltar || {});
  const portal = Object.assign({ id: 'final_boss_portal', region: 6, x: 850, y: 2320 }, D.sealPortal || {});
  let deposited = false, portalOpen = false;
  const S = { list, altar, portal };
  S.count = () => found.size;
  S.isDeposited = () => deposited;
  S.isOpen = () => portalOpen;
  S.altarVisible = () => !!(SW.Inscriptions && SW.Inscriptions.isGateOpened());
  S.bossesVisible = () => !!(SW.Quests && SW.Quests.st.main_seals === 'active');
  S.visibleBoss = spot => spot && (spot.seal === 'final' ? portalOpen : S.bossesVisible());
  S.targets = () => list.filter(s => !s.dead && !found.has(s.seal)).map(s => { const p = SW.Combat && SW.Combat.spot(s.id); return { x: p ? p.x : s.x, y: p ? p.y : s.y }; });
  S.bossDefeated = function (spot) {
    if (!spot || !spot.seal || spot.seal === 'final' || !list.some(s => s.id === spot.id) || found.has(spot.seal)) return null;
    found.add(spot.seal); if (SW.Save) SW.Save.touch(); return spot.seal;
  };
  S.nearAltar = p => S.altarVisible() && SW.Quests && SW.Quests.status('main_altar') === 'active' && Math.hypot(p.x - altar.x, p.y - altar.y) < 2.8 ? altar : null;
  S.deposit = function () {
    if (deposited || found.size !== list.length || !SW.Quests || SW.Quests.status('main_altar') !== 'active') return false;
    deposited = true; portalOpen = true; if (SW.Save) SW.Save.touch(); return true;
  };
  S.interactAltar = function () {
    if (found.size !== list.length) { if (SW.UI) SW.UI.banner(T('seal_altar_need') + ' ' + T('seal_progress', found.size)); return false; }
    if (!S.deposit()) return false;
    SW.Quests.complete('main_altar'); SW.Quests.accept('main_final');
    if (SW.UI) SW.UI.banner(T('seal_deposited'));
    return true;
  };
  S.blocks = (x, y) => S.altarVisible() && !portalOpen && Math.abs(x - portal.x) < 1.2 && Math.abs(y - portal.y) < .8;
  S.drawAltar = function (c, x, y, u, time) {
    const colors = ['#d84b4b','#55b978','#777b8d','#65b8e8','#b77be0'];
    c.save(); c.fillStyle = '#292b32'; c.fillRect(x-u*.75,y-u*.12,u*1.5,u*.42);
    c.fillStyle = '#77716a'; c.fillRect(x-u*.58,y-u*.48,u*1.16,u*.4);
    for(let i=0;i<5;i++){const xx=x+(i-2)*u*.22, yy=y-u*(.72+Math.sin(time*2+i)*.025);c.fillStyle=colors[i];c.beginPath();c.moveTo(xx,yy-u*.18);c.lineTo(xx+u*.12,yy);c.lineTo(xx,yy+u*.16);c.lineTo(xx-u*.12,yy);c.closePath();c.fill();}
    c.strokeStyle=deposited?'#f8e6a2':'#9a927f';c.lineWidth=Math.max(1,u*.045);c.strokeRect(x-u*.62,y-u*.48,u*1.24,u*.4);c.restore();
  };
  S.drawPortal = function (c, x, y, u, time) {
    c.save(); c.strokeStyle=portalOpen?'#8ce0d0':'#b49a65';c.lineWidth=Math.max(2,u*.12);
    c.beginPath();c.moveTo(x-u*.62,y);c.lineTo(x-u*.62,y-u*1.45);c.quadraticCurveTo(x,y-u*2.15,x+u*.62,y-u*1.45);c.lineTo(x+u*.62,y);c.stroke();
    c.fillStyle=portalOpen?'rgba(75,190,165,.32)':'rgba(40,28,48,.65)';c.fillRect(x-u*.48,y-u*1.38,u*.96,u*1.35);
    if(portalOpen){c.globalAlpha=.45+.25*Math.sin(time*3);c.fillStyle='#b9fff0';c.fillRect(x-u*.35,y-u*1.2,u*.7,u*1.1);}
    c.restore();
  };
  S.dump = () => ({ found: Array.from(found), deposited, portalOpen });
  S.load = function (d) {
    found.clear(); if (d && Array.isArray(d.found)) d.found.forEach(id => { if (list.some(s => s.seal === id)) found.add(id); });
    deposited = !!(d && d.deposited && found.size === list.length); portalOpen = !!(d && d.portalOpen && deposited);
    list.forEach(s => { if (found.has(s.seal)) { const spot = SW.Combat && SW.Combat.spot(s.id); if (spot) spot.dead = true; } });
  };
  return S;
})();
