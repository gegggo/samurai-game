#!/usr/bin/env python3
"""Tag-Werkzeug (Phase 20): ergaenzt in data/*.json fehlende Tags `ed` (lite|pc) und `tier` (1-3 je Region).
Aufruf im Repo-Root: python3 "tools py/tag_data.py"   (--force ueberschreibt vorhandene Tags)
tier-Regel = vorhandene Einteilung aus js/combat.js (Waechter-Level): Regionen 0,1,3 = 1 | 12+,5,8,16 = 3 | Rest = 2.
Das ist nur ein Tag, ohne Spielwirkung. Multiplikatoren (tierMul) folgen in Phase 22 (balance.json).
Neue Eintraege ohne Tags: Skript erneut laufen lassen, dann `python3 "tools py/validate_data.py"`."""
import subprocess, sys, time, json
from playwright.sync_api import sync_playwright
FORCE = '--force' in sys.argv
def tier(reg): return 3 if (reg >= 12 or reg in (5, 8, 16)) else 1 if reg in (0, 1, 3) else 2
srv = subprocess.Popen([sys.executable, '-m', 'http.server', '8129'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
try:
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(); pg.goto('http://localhost:8129/index.html'); pg.wait_for_timeout(1500)
        def regs(lst): return pg.evaluate("l => l.map(o => SW.World.regionAt(Math.floor(o.x), Math.floor(o.y)))", lst)
        W = json.load(open('data/world.json', encoding='utf-8')); n = 0
        def tag(o, ed=True, t=None):
            global n
            if ed and (FORCE or 'ed' not in o): o['ed'] = 'lite'; n += 1
            if t is not None and (FORCE or 'tier' not in o): o['tier'] = t; n += 1
        for k in ('spots', 'shrines', 'chests', 'npcs'):
            for o, r in zip(W[k], regs(W[k])): tag(o, True, tier(r))
        npc = {o['id']: o['tier'] for o in W['npcs']}
        json.dump(W, open('data/world.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        Q = json.load(open('data/quests.json', encoding='utf-8'))
        for q in Q['quests']: tag(q, True, npc.get(q['giver'], 1))
        json.dump(Q, open('data/quests.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        for f, k in (('items', 'items'), ('skills', 'skills')):
            J = json.load(open('data/%s.json' % f, encoding='utf-8'))
            for o in J[k]: tag(o, True)
            json.dump(J, open('data/%s.json' % f, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        b.close()
finally: srv.terminate()
print('Tags gesetzt:', n)
