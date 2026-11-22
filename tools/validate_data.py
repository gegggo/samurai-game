#!/usr/bin/env python3
"""Daten-Validator (Phase 20). Aufruf im Repo-Root: python3 "tools py/validate_data.py"
Headless Chromium. Prueft IDs, Verweise, EN/DE-Texte, Strukturgruppen. Exitcode 1 bei Fehlern. Kein Geraetetest."""
import subprocess, sys, time, json
from playwright.sync_api import sync_playwright
srv = subprocess.Popen([sys.executable, '-m', 'http.server', '8126'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
JS = r"""() => {
  const D = SW.Data, E = [], T = SW.TEXT, W = SW.World;
  const dup = (name, arr, f) => { const s = new Set(); arr.forEach(x => { const k = f(x); if (s.has(k)) E.push('doppelte ID ' + name + ': ' + k); s.add(k); }); return s; };
  const spots = dup('spots', D.spots, x => x.id), shr = dup('shrines', D.shrines, x => x.id), npcs = dup('npcs', D.npcs, x => x.id),
        qs = dup('quests', D.quests, x => x.id), ch = dup('chests', D.chests, x => x.id), its = dup('items', D.items, x => x.id), sk = dup('skills', D.skills, x => x.id);
  const all = new Set(); [...D.spots, ...D.shrines, ...D.npcs, ...D.chests].forEach(x => { if (all.has(x.id)) E.push('ID in mehreren Listen: ' + x.id); all.add(x.id); });
  const tx = (k, why) => { if (!(k in T.en)) E.push('EN fehlt: ' + k + ' (' + why + ')'); if (!(k in T.de)) E.push('DE fehlt: ' + k + ' (' + why + ')'); };
  D.shrines.forEach(s => tx('shr_' + s.id, 'Schrein'));
  D.items.forEach(i => { tx('it_' + i.id, 'Item'); tx('itd_' + i.id, 'Item'); });
  D.quests.forEach(q => { if (!npcs.has(q.giver)) E.push('Quest ' + q.id + ': Geber fehlt ' + q.giver);
    const o = q.obj || {}; if (o.type === 'kill' && !spots.has(o.spot)) E.push('Quest ' + q.id + ': Gegnerpunkt fehlt ' + o.spot);
    if (o.type === 'shrine' && !shr.has(o.shrine || o.id)) E.push('Quest ' + q.id + ': Schrein fehlt');
    ['qn_', 'qd_', 'qo_', 'qdone_'].forEach(p => tx(p + q.id, 'Quest')); });
  D.chests.forEach(c => { const g = c.give || {}; if (g.item && !its.has(g.item)) E.push('Truhe ' + c.id + ': Item fehlt ' + g.item); });
  D.skills.forEach(s => (s.req || []).forEach(r => { if (!sk.has(r)) E.push('Skill ' + s.id + ': Voraussetzung fehlt ' + r); }));
  if (!D.balance || !D.balance.tierMul || !D.balance.editions || !D.balance.editions[D.balance.edition] || !(D.balance.xpMul > 0)) E.push('balance.json unvollstaendig');
  if (!SW.dataOk) E.push('Daten-Lader: data/*.json nicht geladen');
  [['spots', D.spots, 1], ['shrines', D.shrines, 1], ['chests', D.chests, 1], ['npcs', D.npcs, 1], ['quests', D.quests, 1], ['items', D.items, 0], ['skills', D.skills, 0]].forEach(([n, l, t]) => l.forEach(o => {
    if (o.ed !== 'lite' && o.ed !== 'pc') E.push('Tag ed fehlt/ungueltig: ' + n + ' ' + o.id);
    if (t && !(Number.isInteger(o.tier) && o.tier >= 1 && o.tier <= 3)) E.push('Tag tier fehlt/ungueltig: ' + n + ' ' + o.id); }));
  const cnt = g => W.S.filter(s => s.grp === g).length;
  [['hinode', 8], ['peak', 4], ['sakura', 2], ['sakuratown', 12]].forEach(([g, n]) => { if (cnt(g) !== n) E.push('Strukturgruppe ' + g + ': ' + cnt(g) + ' statt ' + n); });
  return { E, n: { spots: D.spots.length, shrines: D.shrines.length, npcs: D.npcs.length, quests: D.quests.length, chests: D.chests.length, items: D.items.length, skills: D.skills.length, struct: W.S.length } };
}"""
try:
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={'width': 852, 'height': 393}); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto('http://localhost:8126/index.html'); pg.wait_for_timeout(1500); r = pg.evaluate(JS); b.close()
finally: srv.terminate()
print(json.dumps(r['n']))
for e in r['E'] + ['JS-Fehler: ' + x for x in errs]: print('FEHLER ' + e)
print('ERGEBNIS: %d Fehler' % (len(r['E']) + len(errs))); sys.exit(1 if r['E'] or errs else 0)
