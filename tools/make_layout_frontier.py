#!/usr/bin/env python3
"""Erzeugt js/layout-frontier.js mit zwei organisch angebauten Regionen.
Drachenwall (20) und Tal der Geister (21) erweitern die bestehende Landmasse.
Es werden keine Wege oder Brücken zwischen den Regionen angelegt.
Aufruf: python3 tools/make_layout_frontier.py js/layout-frontier.js
"""
import json
import math
import re
import sys
from pathlib import Path

CELL = 8
X0, Y0, X1, Y1 = 5200, 700, 8000, 3880
W, H = (X1 - X0) // CELL, (Y1 - Y0) // CELL
REG_DRAGON, REG_SPIRIT = 20, 21
LAND_DRAGON, LAND_SPIRIT = REG_DRAGON + 1, REG_SPIRIT + 1

ROOT = Path(__file__).resolve().parents[1]
OLD_LAYOUTS = [
    ROOT / 'js/layout.js',
    ROOT / 'js/layout-sakura.js',
    ROOT / 'js/layout-fortress.js',
    ROOT / 'js/layout-mist.js',
    ROOT / 'js/layout-landmass.js',
]

def base36(value):
    chars = '0123456789abcdefghijklmnopqrstuvwxyz'
    if value == 0:
        return '0'
    result = ''
    while value:
        value, rem = divmod(value, 36)
        result = chars[rem] + result
    return result

def rle(values):
    output = []
    i = 0
    while i < len(values):
        j = i + 1
        while j < len(values) and values[j] == values[i]:
            j += 1
        token = base36(values[i])
        output.append(f'{token}*{j-i}' if j-i > 1 else token)
        i = j
    return ','.join(output)

def load_existing():
    segments = []
    pattern = re.compile(r"Object\.assign\((\{.*?\}),\s*\{\s*rows:\s*'([^']*)'\s*\}\)", re.S)
    for path in OLD_LAYOUTS:
        source = path.read_text(encoding='utf-8')
        match = pattern.search(source)
        if not match:
            raise RuntimeError(f'Layout-Metadaten nicht lesbar: {path.name}')
        meta = json.loads(match.group(1))
        rows = []
        for row_text in match.group(2).split('|'):
            row = []
            for token in row_text.split(','):
                pair = token.split('*')
                value = int(pair[0], 36)
                count = int(pair[1]) if len(pair) > 1 else 1
                row.extend([value] * count)
            if len(row) != meta['w']:
                raise RuntimeError(f'Ungültige Zeilenbreite in {path.name}: {len(row)} statt {meta["w"]}')
            rows.append(row)
        if len(rows) != meta['h']:
            raise RuntimeError(f'Ungültige Zeilenhöhe in {path.name}')
        segments.append((meta, rows))
    return segments

EXISTING = load_existing()
def old_code(x, y):
    # Gleiche Reihenfolge wie index.html: spätere vorhandene Segmente liegen oben.
    for meta, rows in reversed(EXISTING):
        if meta['x0'] <= x < meta['x1'] and meta['y0'] <= y < meta['y1']:
            ix = (x - meta['x0']) // CELL
            iy = (y - meta['y0']) // CELL
            value = rows[iy][ix]
            if value:
                return value
    return 0

def inside_ellipse(x, y, cx, cy, rx, ry, phase):
    angle = math.atan2(y - cy, x - cx)
    wobble = 1 + .045 * math.sin(3 * angle + phase) + .027 * math.sin(6 * angle + phase * .7)
    dx = (x - cx) / (rx * wobble)
    dy = (y - cy) / (ry * wobble)
    return dx * dx + dy * dy < 1

def near_segment(x, y, a, b, radius):
    ax, ay = a
    bx, by = b
    vx, vy = bx - ax, by - ay
    length2 = vx * vx + vy * vy
    t = max(0.0, min(1.0, ((x - ax) * vx + (y - ay) * vy) / length2))
    px, py = ax + t * vx, ay + t * vy
    return (x - px) ** 2 + (y - py) ** 2 <= radius * radius

def region_for(x, y):
    in_spirit = inside_ellipse(x, y, 7000, 2910, 1000, 900, 2.4)
    in_dragon = inside_ellipse(x, y, 6650, 1570, 1000, 850, 1.2)
    if in_spirit:
        return LAND_SPIRIT
    if in_dragon:
        return LAND_DRAGON
    # Breite, natürlich geformte Landhälse – ausdrücklich keine Wege/Brücken.
    if near_segment(x, y, (5260, 2390), (6370, 2790), 410):
        return LAND_SPIRIT
    if near_segment(x, y, (5480, 1780), (6050, 1870), 360):
        return LAND_DRAGON
    return 0

rows = []
counts = {REG_DRAGON: 0, REG_SPIRIT: 0}
for gy in range(H):
    row = []
    for gx in range(W):
        x = X0 + gx * CELL + CELL // 2
        y = Y0 + gy * CELL + CELL // 2
        # Bereits vorhandenes Terrain bleibt unverändert. Neue Zellen füllen nur Meer.
        if old_code(x, y):
            value = 0
        else:
            value = region_for(x, y)
        if value:
            counts[value - 1] += 1
        row.append(value)
    rows.append(rle(row))

if min(counts.values()) < 5000:
    raise RuntimeError(f'Neue Regionen sind zu klein oder fehlen: {counts}')

metadata = {
    'id': 'frontier', 'x0': X0, 'y0': Y0, 'x1': X1, 'y1': Y1,
    'cell': CELL, 'w': W, 'h': H,
    'centers': {'20': [6650, 1570], '21': [7000, 2910]},
    'roads': [], 'rivers': [],
}
output = (
    "'use strict';\n"
    '// Map-Erweiterung – zwei additive Landregionen: Drachenwall (20) und Tal der Geister (21).\n'
    '// Das Segment füllt ausschließlich Meer; bestehendes Land bleibt unverändert. Keine Brücken/Wege.\n'
    'SW.Layouts = SW.Layouts || [];\n'
    'SW.Layouts.push(Object.assign(' + json.dumps(metadata, separators=(',', ':')) +
    ", { rows: '" + '|'.join(rows) + "' }));\n"
)
Path(sys.argv[1]).write_text(output, encoding='utf-8')
print(f'Erstellt: {sys.argv[1]} | Drachenwall: {counts[20]} Zellen | Tal der Geister: {counts[21]} Zellen')