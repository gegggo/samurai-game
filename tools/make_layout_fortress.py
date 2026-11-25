#!/usr/bin/env python3
"""Erzeugt js/layout-fortress.js (Region 18) als nahtlosen Landanschluss an die Hauptinsel.
Aufruf: python3 py/make_layout_fortress.py js/layout-fortress.js"""
import sys, json, math
X0, Y0, X1, Y1, CELL = 3400, 2000, 5000, 3000, 8
W, H = (X1 - X0) // CELL, (Y1 - Y0) // CELL
CX, CY = 4180, 2480          # Regionsmitte (Schrein, Festungshof)
REG = 18; LAND, LAKE = REG + 1, 128 + REG + 1
def island(x, y):
    a = math.atan2(y - CY, x - CX); wob = 1 + .07 * math.sin(3 * a + 1) + .05 * math.sin(5 * a + 2)
    return ((x - CX) / (300 * wob)) ** 2 + ((y - CY) / (250 * wob)) ** 2 < 1
def blend(x, y):
    h = (((x // (CELL * 2)) * 73856093) ^ ((y // (CELL * 2)) * 19349663) ^ (REG * 83492791)) & 0xffffffff
    return LAND if h % 100 < 70 else 16  # ca. 60% Festung, 40% alte Region 15

def cell(x, y):
    if island(x, y): return LAND
    hw = 52 + 6 * math.sin(x / 41)                                             # 13-15 Layout-Kacheln breiter Landanschluss
    if X0 <= x < 3950 and abs(y - 2300) < hw:
        if x < 3472: return 0                                                   # bestehendes Land der Hauptinsel behalten
        if x < 3632: return blend(x, y)                                         # 20-Kachel-Uebergangszone, 60/40
        return LAND
    if 3900 <= x < 4050 and abs(y - 2300) < hw: return LAND
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
roads = [[[3440, 2300], [3600, 2300], [3800, 2300], [3990, 2310], [4100, 2400], [4180, 2480]],
         [[4180, 2480], [4180, 2545]], [[4180, 2480], [4280, 2470], [4360, 2430]]]
d = {"id": "fortress", "x0": X0, "y0": Y0, "x1": X1, "y1": Y1, "cell": CELL, "w": W, "h": H, "centers": {str(REG): [CX, CY]}, "roads": roads, "rivers": []}
open(sys.argv[1], 'w').write("'use strict';\n// ERZEUGT von py/make_layout_fortress.py. Segment Verlassene Festung (Region 18), additiv zu js/layout.js. Nicht von Hand ändern.\nSW.Layouts = SW.Layouts || [];\nSW.Layouts.push(Object.assign(" + json.dumps(d, separators=(',', ':')) + ", { rows: '" + '|'.join(rows) + "' }));\n")
