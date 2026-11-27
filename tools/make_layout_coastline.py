#!/usr/bin/env python3
"""Rundet die Aussenkueste der Hauptlandmasse mit einem kreisfoermigen Closing.
Nur leere Rasterzellen werden ergaenzt; vorhandene Regionen und Seen bleiben erhalten.
"""
import json
import re
from collections import deque
from pathlib import Path

CELL = 8
WIDTH, HEIGHT = 8000 // CELL, 5200 // CELL
RADIUS = 16  # 128 Weltkacheln; runde, flache Kuesteneinbuchtungen
LAYOUTS = [
    Path('js/layout.js'),
    Path('js/layout-sakura.js'),
    Path('js/layout-fortress.js'),
    Path('js/layout-mist.js'),
    Path('js/layout-landmass.js'),
    Path('js/layout-frontier.js'),
    Path('js/layout-interstice.js'),
    Path('js/layout-gap-temples.js'),
]
OUTPUT = Path('js/layout-coastline.js')


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


def close_mask(mask):
    # Kreisscheibe als Structuring Element; Prefix-Summen halten die Laufzeit gering.
    prefix = [[0] * (WIDTH + 1) for _ in range(HEIGHT)]
    for y in range(HEIGHT):
        p = prefix[y]
        for x in range(WIDTH):
            p[x + 1] = p[x] + mask[y * WIDTH + x]
    dilated = bytearray(WIDTH * HEIGHT)
    for y in range(HEIGHT):
        for x in range(WIDTH):
            for dy in range(-RADIUS, RADIUS + 1):
                yy = y + dy
                if yy < 0 or yy >= HEIGHT:
                    continue
                dx = int((RADIUS * RADIUS - dy * dy) ** 0.5)
                a, b = max(0, x - dx), min(WIDTH - 1, x + dx)
                if prefix[yy][b + 1] - prefix[yy][a]:
                    dilated[y * WIDTH + x] = 1
                    break
    d_prefix = [[0] * (WIDTH + 1) for _ in range(HEIGHT)]
    for y in range(HEIGHT):
        p = d_prefix[y]
        for x in range(WIDTH):
            p[x + 1] = p[x] + dilated[y * WIDTH + x]
    closed = bytearray(WIDTH * HEIGHT)
    for y in range(HEIGHT):
        for x in range(WIDTH):
            keep = True
            for dy in range(-RADIUS, RADIUS + 1):
                yy = y + dy
                if yy < 0 or yy >= HEIGHT:
                    keep = False
                    break
                dx = int((RADIUS * RADIUS - dy * dy) ** 0.5)
                a, b = x - dx, x + dx
                if a < 0 or b >= WIDTH or d_prefix[yy][b + 1] - d_prefix[yy][a] != b - a + 1:
                    keep = False
                    break
            if keep:
                closed[y * WIDTH + x] = 1
    return closed


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

    land = bytearray(1 if 0 < value < 128 else 0 for value in grid)
    closed = close_mask(land)

    # Multi-source BFS: jede neue Kuestenzelle erhaelt die naechstgelegene bestehende Region.
    owner = bytearray(WIDTH * HEIGHT)
    queue = deque()
    for i, value in enumerate(grid):
        if 0 < value < 128:
            owner[i] = value
            queue.append(i)
    while queue:
        i = queue.popleft()
        x, y = i % WIDTH, i // WIDTH
        for n in (i - 1 if x else -1, i + 1 if x + 1 < WIDTH else -1,
                  i - WIDTH if y else -1, i + WIDTH if y + 1 < HEIGHT else -1):
            if n >= 0 and grid[n] == 0 and owner[n] == 0:
                owner[n] = owner[i]
                queue.append(n)

    filled = [i for i in range(len(grid)) if grid[i] == 0 and closed[i]]
    if not filled:
        raise RuntimeError('Keine Kuestenzellen zum Runden gefunden')
    if not all(owner[i] for i in filled):
        raise RuntimeError('Kuesten-Zellen ohne angrenzende Region gefunden')
    target = (2847 // CELL) * WIDTH + (987 // CELL)
    if target not in set(filled):
        raise RuntimeError('Der Kuestenuebergang bei X987/Y2847 wurde nicht geschlossen')

    # Ovaler Sicherheitsrahmen (gedrehte Ellipse entlang der NW-SO-Ausrichtung).
    cx, cy, angle, rx, ry = 2685, 2319, 28.37 * 3.141592653589793 / 180, 3900, 2700
    import math
    c, s = math.cos(angle), math.sin(angle)
    max_q = 0.0
    for i, value in enumerate(grid):
        if 0 < value < 128 or (value == 0 and closed[i]):
            x, y = (i % WIDTH) * CELL + CELL / 2, (i // WIDTH) * CELL + CELL / 2
            dx, dy = x - cx, y - cy
            u, v = dx * c + dy * s, -dx * s + dy * c
            q = (u / rx) ** 2 + (v / ry) ** 2
            max_q = max(max_q, q)
    if max_q > 1:
        raise RuntimeError(f'Land liegt ausserhalb des ovalen Kartenrahmens: {max_q:.4f}')

    xs = [i % WIDTH for i in filled]
    ys = [i // WIDTH for i in filled]
    x0, y0, x1, y1 = min(xs), min(ys), max(xs) + 1, max(ys) + 1
    rows = []
    for y in range(y0, y1):
        row = [owner[y * WIDTH + x] if (y * WIDTH + x) in set(filled) else 0 for x in range(x0, x1)]
        rows.append(rle(row))
    metadata = {'id': 'coastline-rounding', 'x0': x0 * CELL, 'y0': y0 * CELL,
                'x1': x1 * CELL, 'y1': y1 * CELL, 'cell': CELL,
                'w': x1 - x0, 'h': y1 - y0, 'centers': {}, 'roads': [], 'rivers': []}
    output = ("'use strict';\n"
              '// Generiert von tools/make_layout_coastline.py. Rundet flache Kuesteneinbuchtungen, ohne bestehendes Land oder Seen zu ueberschreiben.\n'
              'SW.Layouts = SW.Layouts || [];\n'
              'SW.Layouts.push(Object.assign(' + json.dumps(metadata, separators=(',', ':')) +
              ", { rows: '" + '|'.join(rows) + "' }));\n")
    OUTPUT.write_text(output, encoding='utf-8')
    print(f'Erstellt: {OUTPUT}; gerundete Kuestenzellen: {len(filled)}; ovaler Rahmen max q={max_q:.4f}')


if __name__ == '__main__':
    main()
