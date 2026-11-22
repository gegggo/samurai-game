#!/usr/bin/env python3
"""Erzeugt js/layout-sakura.js (Segment Kirschblütenwald, Region 17) im Meer östlich der Insel.
Aufruf: python3 py/make_layout_sakura.py js/layout-sakura.js"""
import sys, json, math
X0, Y0, X1, Y1, CELL = 3560, 1000, 5000, 2000, 8
W, H = (X1 - X0) // CELL, (Y1 - Y0) // CELL
CX, CY = 4350, 1490          # Regionsmitte (Schrein)
REG = 17; LAND, LAKE = REG + 1, 128 + REG + 1
def island(x, y):
    a = math.atan2(y - CY, x - CX); wob = 1 + .07 * math.sin(3 * a + 1) + .05 * math.sin(5 * a + 2)
    return ((x - CX) / (400 * wob)) ** 2 + ((y - CY) / (330 * wob)) ** 2 < 1
def cell(x, y):
    if math.hypot(x - 4420, y - 1560) < 26: return LAKE                         # Teich
    hw = 40 + 8 * math.sin(x / 37)                                              # Landbrücke 80-96 Kacheln breit
    if 3730 <= x < 3790 and abs(y - 1500) < hw: return LAKE                     # Meerenge (Brücke kreuzt sie)
    if island(x, y): return LAND
    if X0 <= x < 4000 and abs(y - 1500) < hw: return LAND                       # Landzunge zur Hauptinsel
    return 0
def rle(r):
    out, i = [], 0
    while i < len(r):
        j = i
        while j < len(r) and r[j] == r[i]: j += 1
        out.append(('%s*%d' % (_b36(r[i]), j - i)) if j - i > 1 else _b36(r[i])); i = j
    return ','.join(out)
def _b36(n):
    d = '0123456789abcdefghijklmnopqrstuvwxyz'; s = ''
    while True:
        s = d[n % 36] + s; n //= 36
        if not n: return s
rows = [rle([cell(X0 + i * CELL + CELL // 2, Y0 + j * CELL + CELL // 2) for i in range(W)]) for j in range(H)]
roads = [[[3600, 1500], [3760, 1500], [3900, 1498], [4100, 1490], [4280, 1486], [4350, 1490]],
         [[4350, 1490], [4440, 1430], [4540, 1390]], [[4350, 1490], [4300, 1580], [4250, 1650]]]
d = {"id": "sakura", "x0": X0, "y0": Y0, "x1": X1, "y1": Y1, "cell": CELL, "w": W, "h": H, "centers": {str(REG): [CX, CY]}, "roads": roads, "rivers": []}
open(sys.argv[1], 'w').write("'use strict';\n// ERZEUGT von py/make_layout_sakura.py. Segment Kirschblütenwald (Region 17), additiv zu js/layout.js. Nicht von Hand ändern.\nSW.Layouts = SW.Layouts || [];\nSW.Layouts.push(Object.assign(" + json.dumps(d, separators=(',', ':')) + ", { rows: '" + '|'.join(rows) + "' }));\n")
