#!/usr/bin/env python3
"""Erzeugt js/layout-interstice.js als additives Regions-Overlay.
Region 25 schliesst die natuerliche Landluecke zwischen Sun Coast,
Abandoned Fortress, Cloudsteppe und Jade Highlands.
Aufruf im Repository-Root: python3 tools/make_layout_interstice.py
"""
import json
import math
import re
from collections import deque
from pathlib import Path

CELL = 8
X0, Y0, X1, Y1 = 2440, 2640, 4080, 3376
W, H = (X1 - X0) // CELL, (Y1 - Y0) // CELL
CENTER = (3260, 3050)
SHAPES = [
    (3260, 3050, 650, 280, 1.0),
    (2860, 3000, 350, 175, 0.4),
    (3650, 2920, 360, 220, 2.1),
    (3520, 3220, 420, 170, 2.7),
    (2800, 2860, 380, 190, 0.9),
]
SOURCE = Path('js/layout-frontier.js')
OUTPUT = Path('js/layout-interstice.js')


def parse_layout(path):
    source = path.read_text(encoding='utf-8')
    match = re.search(r"Object\.assign\((\{.*?\}),\s*\{\s*rows:\s*'([^']*)'\s*\}\)", source, re.S)
    if not match:
        raise RuntimeError(f'Layout-Metadaten nicht lesbar: {path}')
    meta = json.loads(match.group(1))
    rows = []
    for line in match.group(2).split('|'):
        row = []
        for token in line.split(','):
            parts = token.split('*')
            value = int(parts[0], 36)
            count = int(parts[1]) if len(parts) > 1 else 1
            row.extend([value] * count)
        if len(row) != meta['w']:
            raise RuntimeError(f'Ungueltige Zeilenbreite: {len(row)} statt {meta["w"]}')
        rows.append(row)
    if len(rows) != meta['h']:
        raise RuntimeError(f'Ungueltige Zeilenhoehe: {len(rows)} statt {meta["h"]}')
    return meta, rows


def source_code(meta, rows, x, y):
    gx = (x - meta['x0']) // CELL
    gy = (y - meta['y0']) // CELL
    if not (0 <= gx < meta['w'] and 0 <= gy < meta['h']):
        return 0
    return rows[gy][gx]


def ellipse_score(x, y, spec):
    cx, cy, rx, ry, phase = spec
    angle = math.atan2(y - cy, x - cx)
    wobble = 1 + .035 * math.sin(3 * angle + phase) + .022 * math.sin(6 * angle + phase * .7)
    score = ((x - cx) / (rx * wobble)) ** 2 + ((y - cy) / (ry * wobble)) ** 2
    return score if score < 1 else None


def in_region(x, y):
    return any(ellipse_score(x, y, shape) is not None for shape in SHAPES)


def base36(value):
    chars = '0123456789abcdefghijklmnopqrstuvwxyz'
    if value == 0:
        return '0'
    out = ''
    while value:
        value, rem = divmod(value, 36)
        out = chars[rem] + out
    return out


def rle(values):
    out = []
    i = 0
    while i < len(values):
        j = i + 1
        while j < len(values) and values[j] == values[i]:
            j += 1
        token = base36(int(values[i]))
        out.append(f'{token}*{j-i}' if j-i > 1 else token)
        i = j
    return ','.join(out)


def main():
    source_meta, source_rows = parse_layout(SOURCE)
    grid = [[0] * W for _ in range(H)]
    count = 0
    for gy in range(H):
        for gx in range(W):
            x, y = X0 + gx * CELL + CELL // 2, Y0 + gy * CELL + CELL // 2
            if source_code(source_meta, source_rows, x, y) == 0 and in_region(x, y):
                grid[gy][gx] = 26
                count += 1

    # Validierung: eine zusammenhaengende neue Flaeche und direkter Kontakt zu allen vier Zielregionen.
    seen = set()
    components = 0
    contacts = {15: 0, 18: 0, 23: 0, 24: 0}
    directions = ((1, 0), (-1, 0), (0, 1), (0, -1))
    for gy in range(H):
        for gx in range(W):
            if grid[gy][gx] != 26:
                continue
            for dx, dy in directions:
                nx, ny = gx + dx, gy + dy
                if 0 <= nx < W and 0 <= ny < H:
                    px, py = X0 + nx * CELL + CELL // 2, Y0 + ny * CELL + CELL // 2
                    value = source_code(source_meta, source_rows, px, py)
                    if value in (16, 19, 24, 25):
                        contacts[value - 1] += 1
            start = gy * W + gx
            if start in seen:
                continue
            components += 1
            queue = deque([start])
            seen.add(start)
            while queue:
                current = queue.popleft()
                x, y = current % W, current // W
                for dx, dy in directions:
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < W and 0 <= ny < H:
                        nxt = ny * W + nx
                        if grid[ny][nx] == 26 and nxt not in seen:
                            seen.add(nxt)
                            queue.append(nxt)

    if count < 5000 or components != 1 or any(v < 10 for v in contacts.values()):
        raise RuntimeError(f'Kartenpruefung fehlgeschlagen: Zellen={count}, Komponenten={components}, Kontakte={contacts}')

    metadata = {
        'id': 'interstice', 'x0': X0, 'y0': Y0, 'x1': X1, 'y1': Y1,
        'cell': CELL, 'w': W, 'h': H,
        'centers': {'25': list(CENTER)}, 'roads': [], 'rivers': [],
    }
    output = (
        "'use strict';\n"
        '// Region 25: organischer Landanschluss zwischen Sun Coast, Abandoned Fortress, Cloudsteppe und Jade Highlands.\n'
        '// Additives Overlay: vorhandene Landzellen und Seen bleiben unangetastet; keine Bruecken oder Wege.\n'
        'SW.Layouts = SW.Layouts || [];\n'
        'SW.Layouts.push(Object.assign(' + json.dumps(metadata, separators=(',', ':')) +
        ", { rows: '" + '|'.join(rle(row) for row in grid) + "' }));\n"
    )
    OUTPUT.write_text(output, encoding='utf-8')
    print(f'Erstellt: {OUTPUT} ({count} Rasterzellen; Kontakte: {contacts})')


if __name__ == '__main__':
    main()
