#!/usr/bin/env python3
"""Erzeugt js/layout-frontier.js mit fuenf direkt angebauten Regionen und einer
moderaten Erweiterung der bisherigen Kernland-Kueste. Alle alten Regionsmittelpunkte
bleiben erhalten; Drachenwall (20) und Tal der Geister (21) werden groessenmaessig
angepasst. Alle fuenf neuen Regionen liegen gemeinsam unterhalb der bestehenden Hauptkarte (0.30.0: um 1800 nach Westen, mittig unter der Suedkueste).
Alle neuen Gebiete bilden breite natuerliche Landanschluesse; es gibt keine Wege/Bruecken.
Aufruf: python3 tools/make_layout_frontier.py js/layout-frontier.js
"""
import json
import math
import re
import sys
from pathlib import Path
import numpy as np
from scipy.ndimage import binary_dilation, distance_transform_edt
from skimage.morphology import disk

CELL = 8
X0, Y0, X1, Y1 = 0, 0, 8000, 5200
W, H = (X1 - X0) // CELL, (Y1 - Y0) // CELL

# Mittelpunktpositionen der bisherigen zwei Regionen bleiben unveraendert.
REGIONS = {
    20: (2900, 4150, 520, 360, 1.2),  # Drachenwall
    21: (4300, 4200, 500, 360, 2.4),  # Tal der Geister
    22: (1600, 3550, 420, 320, 0.7),  # Frostwall
    23: (2500, 3600, 480, 300, 1.8),  # Wolkensteppe
    24: (3700, 3650, 450, 320, 2.8),  # Jadehochland
}

# Abgerundete, organische Landbuchten statt gerader Verbindungskorridore.
# Die Zusatzellipsen gehoeren jeweils zur Region und ueberlappen deren Kern.
REGION_LOBES = {
    20: [(2600, 3850, 600, 320, 0.9), (3200, 3950, 520, 300, 1.5)],
    21: [(3850, 4050, 600, 320, 2.1)],
    22: [(1500, 3220, 600, 300, 0.2)],
    23: [(2100, 3330, 600, 300, 1.4)],
    24: [(3300, 3800, 600, 320, 2.6), (3950, 4000, 430, 280, 2.2)],
}

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
                raise RuntimeError(f'Ungueltige Zeilenbreite in {path.name}: {len(row)} statt {meta["w"]}')
            rows.append(row)
        if len(rows) != meta['h']:
            raise RuntimeError(f'Ungueltige Zeilenhoehe in {path.name}')
        segments.append((meta, rows))
    return segments


EXISTING = load_existing()


def old_code(x, y):
    for meta, rows in reversed(EXISTING):
        if meta['x0'] <= x < meta['x1'] and meta['y0'] <= y < meta['y1']:
            ix = (x - meta['x0']) // CELL
            iy = (y - meta['y0']) // CELL
            value = rows[iy][ix]
            if value:
                return value
    return 0


def ellipse_score(x, y, spec):
    cx, cy, rx, ry, phase = spec
    angle = math.atan2(y - cy, x - cx)
    wobble = 1 + .035 * math.sin(3 * angle + phase) + .022 * math.sin(6 * angle + phase * .7)
    dx = (x - cx) / (rx * wobble)
    dy = (y - cy) / (ry * wobble)
    score = dx * dx + dy * dy
    return score if score < 1 else None


def region_for(x, y):
    # Bestehende Zentren 20/21 und ihre runden Landbuchten behalten die Prioritaet.
    for rid in (21, 20):
        scores = [ellipse_score(x, y, REGIONS[rid])]
        scores.extend(ellipse_score(x, y, shape) for shape in REGION_LOBES.get(rid, []))
        if any(score is not None for score in scores):
            return rid + 1

    # Ueberlappende Nordgebiete werden am naechstgelegenen normierten Kern/Lobus getrennt.
    candidates = []
    for rid in (22, 23, 24):
        scores = [ellipse_score(x, y, REGIONS[rid])]
        scores.extend(ellipse_score(x, y, shape) for shape in REGION_LOBES.get(rid, []))
        scores = [score for score in scores if score is not None]
        if scores:
            candidates.append((min(scores), rid))
    return min(candidates)[1] + 1 if candidates else 0


# Existing main-map regions keep their exact centres and inner borders.
# The coastline is widened modestly; added tiles inherit the nearest existing region.
old_grid = np.zeros((H, W), dtype=np.uint8)
for gy in range(H):
    for gx in range(W):
        x = X0 + gx * CELL + CELL // 2
        y = Y0 + gy * CELL + CELL // 2
        old_grid[gy, gx] = old_code(x, y)

old_land = (old_grid >= 1) & (old_grid <= 20)
old_lakes = (old_grid >= 128) & (old_grid < 256)
# Only the original core regions (0–16) gain a little coastal space; later east/south
# regions are left at their intended size to avoid one large region absorbing the growth.
core_land = (old_grid >= 1) & (old_grid <= 17)
y_idx, x_idx = np.indices((H, W))
expanded_land = binary_dilation(core_land, structure=disk(13))
expanded_land &= (old_grid == 0) & (x_idx * CELL <= 5200) & (y_idx * CELL <= 3200)
_, nearest = distance_transform_edt(~core_land, return_indices=True)
nearest_labels = old_grid[nearest[0], nearest[1]]
expanded_grid = old_grid.copy()
expanded_grid[expanded_land] = nearest_labels[expanded_land]
# Existing lake cells retain their original lake IDs.
expanded_grid[old_lakes] = old_grid[old_lakes]

rows = []
counts = {rid: 0 for rid in range(25)}
for gy in range(H):
    row = []
    for gx in range(W):
        x = X0 + gx * CELL + CELL // 2
        y = Y0 + gy * CELL + CELL // 2
        if expanded_grid[gy, gx]:
            value = int(expanded_grid[gy, gx])
        else:
            value = region_for(x, y)
        if 1 <= value <= 25:
            counts[value - 1] += 1
        row.append(value)
    rows.append(rle(row))

for rid in range(20, 25):
    if counts[rid] < 5000:
        raise RuntimeError(f'Neue Region {rid} ist zu klein oder fehlt: {counts[rid]}')
metadata = {
    'id': 'frontier', 'x0': 0, 'y0': 0, 'x1': X1, 'y1': Y1,
    'cell': CELL, 'w': X1 // CELL, 'h': Y1 // CELL,
    'centers': {
        '20': [2900, 4150], '21': [4300, 4200],
        '22': [1600, 3550], '23': [2500, 3600], '24': [3700, 3650],
    },
    'roads': [], 'rivers': [],
}
output = (
    "'use strict';\n"
    '// Karten-Erweiterung: Regionen 20–24, direkt an die vergroesserte bestehende Landmasse angebaut.\n'
    '// Keine Bruecken/Wege; Zentren und innere alte Regionsflaechen bleiben erhalten.\n'
    'SW.Layouts = SW.Layouts || [];\n'
    'SW.Layouts.push(Object.assign(' + json.dumps(metadata, separators=(',', ':')) +
    ", { rows: '" + '|'.join(rows) + "' }));\n"
)
Path(sys.argv[1]).write_text(output, encoding='utf-8')
print('Erstellt:', sys.argv[1])
for rid, count in counts.items():
    print(f'  Region {rid}: {count:,} Rasterzellen (8x8 Tiles)')