#!/usr/bin/env python3
"""Einmaliger Umzug der Ortskoordinaten (Stand 0.9.15, Welt 2400x2400) in die Draft-Welt.
Regel: alte Region -> Mittelpunkt der neuen Region, relative Lage bleibt; danach auf die nächste
brauchbare Landzelle der gleichen Region (kein See/Meer/Fluss-Nähe) einrasten. Feinschliff (Fels, Objekte, Mauern) macht das Spiel beim Start (free()).
Aufruf (im Repo-Root): python3 tools/move_content.py   -- läuft nur einmal je Datei (Markierung MOVED)."""
import re, json, sys, math
import numpy as np, cv2
from scipy import ndimage as ndi

FILES = ['combat-data', 'shops-data', 'items-data', 'quests-data', 'shrines-data', 'village']
OLD_C = [400, 1200, 2000]
OLD_MINI = [(800, 800, 80), (1600, 800, 80), (800, 1600, 80), (100, 100, 190), (2300, 100, 190), (100, 2300, 190), (2300, 2300, 190), (1600, 1600, 215)]
MARK = '// MOVED: Koordinaten Weltumbau (tools/move_content.py)'

def load_layout(path='js/layout.js'):
    t = open(path).read(); j = t[t.index('Object.assign(') + 14:t.index(', { rows:')]; seg = json.loads(j)
    rows = t[t.index("rows: '") + 7:t.rindex("'")].split('|'); g = np.zeros((seg['h'], seg['w']), np.uint8)
    for y, r in enumerate(rows):
        x = 0
        for tok in r.split(','):
            v, _, n = tok.partition('*'); n = int(n or 1); g[y, x:x + n] = int(v, 36); x += n
    return seg, g

def old_region(x, y):
    for i, (cx, cy, r) in enumerate(OLD_MINI):
        if (x - cx) ** 2 + (y - cy) ** 2 < r * r: return 9 + i, cx, cy
    c, r = min(2, int(x // 800)), min(2, int(y // 800)); return r * 3 + c, OLD_C[c], OLD_C[r]

def main():
    seg, g = load_layout(); C = seg['cell']; cen = {int(k): v for k, v in seg['centers'].items()}
    wet = ndi.binary_dilation((g == 0) | (g >= 128), iterations=2)                 # 16 Kacheln Abstand zu Meer/See
    rm = np.zeros(g.shape, np.uint8)
    for rv in seg['rivers']: cv2.polylines(rm, [np.array(rv, np.int32).reshape(-1, 1, 2) // C], False, 1, 1)
    bad = wet | (cv2.dilate(rm, np.ones((5, 5), np.uint8)) > 0)
    near = {}
    def snap(reg, x, y):
        if reg not in near:
            m = (g == reg + 1) & ~bad
            near[reg] = ndi.distance_transform_edt(~m, return_indices=True)[1]
        j, i = min(max(int(y // C), 0), g.shape[0] - 1), min(max(int(x // C), 0), g.shape[1] - 1)
        if g[j, i] == reg + 1 and not bad[j, i]: return x, y
        jj, ii = near[reg][0][j, i], near[reg][1][j, i]
        return ii * C + C / 2 + (x % C) / C * 0, jj * C + C / 2
    moved = []
    def fix(m):
        x, y = float(m.group(1)), float(m.group(2)); reg, ox, oy = old_region(x, y)
        nx, ny = cen[reg][0] + x - ox, cen[reg][1] + y - oy; sx, sy = snap(reg, nx, ny)
        half = lambda old, new: (math.floor(new) + .5) if old % 1 == .5 else round(new)
        fmt = lambda v: ('%d' % v) if v % 1 == 0 else ('%.1f' % v)
        r = (fmt(half(x, sx)), fmt(half(y, sy)))
        if (sx, sy) != (nx, ny): moved.append((m.group(0), reg, r))
        return 'x: %s, y: %s' % r
    n = 0
    for f in FILES:
        p = 'js/%s.js' % f; s = open(p).read()
        if MARK in s: print('übersprungen (schon verschoben):', p); continue
        s, k = re.subn(r'\bx:\s*(-?[\d.]+),\s*y:\s*(-?[\d.]+)', fix, s); n += k
        s = s.replace("'use strict';\n", "'use strict';\n" + MARK + '\n', 1); open(p, 'w').write(s)
        print(p, k, 'Koordinaten')
    print('gesamt', n, '| zusätzlich eingerastet:', len(moved))
    for a, reg, b in moved: print('  ', a, '-> reg', reg, b)

if __name__ == '__main__': main()
