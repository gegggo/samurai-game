#!/usr/bin/env python3
"""Schliesst eingeschlossene kleine Wasserluecken und erzeugt den Kuestentempel.
Aufruf im Repository-Root: python3 tools/make_layout_gap_temple.py
"""
import json
import re
from collections import deque
from pathlib import Path

CELL = 8
WIDTH, HEIGHT = 8000 // CELL, 5200 // CELL
REGION_CODE = 26  # Region-ID 25: Verdant Basin
LAYOUTS = [
    Path('js/layout.js'),
    Path('js/layout-sakura.js'),
    Path('js/layout-fortress.js'),
    Path('js/layout-mist.js'),
    Path('js/layout-landmass.js'),
    Path('js/layout-frontier.js'),
    Path('js/layout-interstice.js'),
]
OUTPUT = Path('js/layout-gap-temples.js')
DIRECTIONS = ((1, 0), (-1, 0), (0, 1), (0, -1))


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
            raise RuntimeError(f'Ungueltige Zeilenbreite in {path}')
        rows.append(row)
    if len(rows) != meta['h']:
        raise RuntimeError(f'Ungueltige Zeilenhoehe in {path}')
    return meta, rows


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
    out, i = [], 0
    while i < len(values):
        j = i + 1
        while j < len(values) and values[j] == values[i]:
            j += 1
        token = base36(int(values[i]))
        out.append(f'{token}*{j-i}' if j-i > 1 else token)
        i = j
    return ','.join(out)


def main():
    grid = bytearray(WIDTH * HEIGHT)
    for path in LAYOUTS:
        meta, rows = parse_layout(path)
        for gy, row in enumerate(rows):
            offset = (meta['y0'] // CELL + gy) * WIDTH + meta['x0'] // CELL
            for gx, value in enumerate(row):
                if value:
                    grid[offset + gx] = value

    seen = bytearray(len(grid))
    components = []
    for start, value in enumerate(grid):
        if value != 0 or seen[start]:
            continue
        queue = deque([start])
        seen[start] = 1
        cells = []
        touches_edge = False
        while queue:
            current = queue.popleft()
            cells.append(current)
            x, y = current % WIDTH, current // WIDTH
            if x == 0 or y == 0 or x == WIDTH - 1 or y == HEIGHT - 1:
                touches_edge = True
            for dx, dy in DIRECTIONS:
                nx, ny = x + dx, y + dy
                if 0 <= nx < WIDTH and 0 <= ny < HEIGHT:
                    nxt = ny * WIDTH + nx
                    if grid[nxt] == 0 and not seen[nxt]:
                        seen[nxt] = 1
                        queue.append(nxt)
        if not touches_edge:
            components.append(cells)

    sizes = sorted(len(c) for c in components)
    if sizes != [4, 41, 1077]:
        raise RuntimeError(f'Unerwartete eingeschlossene Wasserflaechen: {sizes}')

    filled = set()
    for component in components:
        filled.update(component)

    xs = [i % WIDTH for i in filled]
    ys = [i // WIDTH for i in filled]
    x0, y0 = min(xs), min(ys)
    x1, y1 = max(xs) + 1, max(ys) + 1
    rows = []
    for y in range(y0, y1):
        row = [REGION_CODE if y * WIDTH + x in filled else 0 for x in range(x0, x1)]
        rows.append(rle(row))

    # Alle drei Flaechen muessen direkt an bestehendes Land anschliessen.
    contacts = set()
    for i in filled:
        x, y = i % WIDTH, i // WIDTH
        for dx, dy in DIRECTIONS:
            nx, ny = x + dx, y + dy
            if 0 <= nx < WIDTH and 0 <= ny < HEIGHT:
                value = grid[ny * WIDTH + nx]
                if 0 < value < 128:
                    contacts.add(value - 1)
    if not {15, 18, 24, 25}.issubset(contacts):
        raise RuntimeError(f'Landanschluesse fehlen: {sorted(contacts)}')

    metadata = {
        'id': 'gap-temples',
        'x0': x0 * CELL, 'y0': y0 * CELL,
        'x1': x1 * CELL, 'y1': y1 * CELL,
        'cell': CELL, 'w': x1 - x0, 'h': y1 - y0,
        'centers': {}, 'roads': [], 'rivers': [],
    }
    output = (
        "'use strict';\n"
        '// Schliesst drei eingeschlossene Wasserluecken. Die groesste wird zum Kuestentempel-Areal.\n'
        '// Nur leere Rasterzellen werden mit Region 25 gefuellt; bestehende Regionen und Seen bleiben erhalten.\n'
        'SW.Layouts = SW.Layouts || [];\n'
        'SW.Layouts.push(Object.assign(' + json.dumps(metadata, separators=(',', ':')) +
        ", { rows: '" + '|'.join(rows) + "' }));\n"
    )
    OUTPUT.write_text(output, encoding='utf-8')
    print(f'Erstellt: {OUTPUT}; gefuellt: {len(filled)} Zellen; Komponenten: {sizes}; Kontakte: {sorted(contacts)}')


if __name__ == '__main__':
    main()
