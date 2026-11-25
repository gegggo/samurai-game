#!/usr/bin/env python3
"""Prueft, ob Sakura und Festung ohne Wasserluecke an aelteres Land anschliessen.

Aufruf im Projekt-Root: python3 tests/layout_connectivity.py
Prueft dieselbe Overlay-Prioritaet wie js/world.js (spaeter geladene Segmente zuerst).
"""
import collections
import glob
import json
import math
import re
import sys


def load_segments():
    segments = []
    for path in sorted(glob.glob("js/layout*.js")):
        text = open(path, encoding="utf-8").read()
        match = re.search(r"Object\.assign\((\{.*?\}), \{ rows: '([^']*)' \}\)\);", text, re.S)
        if not match:
            continue
        meta = json.loads(match.group(1))
        rows = []
        for row in match.group(2).split("|"):
            values = []
            for token in row.split(","):
                value, sep, count = token.partition("*")
                values.extend([int(value, 36)] * (int(count) if sep else 1))
            if len(values) != meta["w"]:
                raise ValueError("%s: Zeile hat %d statt %d Zellen" % (path, len(values), meta["w"]))
            rows.append(values)
        if len(rows) != meta["h"]:
            raise ValueError("%s: %d statt %d Zeilen" % (path, len(rows), meta["h"]))
        segments.append((meta, rows, path))
    if not segments:
        raise ValueError("Keine Layout-Segmente gefunden")
    return segments


SEGMENTS = load_segments()


def code(x, y):
    # Muss mit der Reihenfolge in js/world.js uebereinstimmen.
    for meta, rows, _ in reversed(SEGMENTS):
        if meta["x0"] <= x < meta["x1"] and meta["y0"] <= y < meta["y1"]:
            value = rows[int((y - meta["y0"]) / meta["cell"])][int((x - meta["x0"]) / meta["cell"])]
            if value:
                return value
    return 0


def connected_to_old_land(start, region, old_x):
    sx, sy = start
    origin = (sx // 8 * 8 + 4, sy // 8 * 8 + 4)
    queue = collections.deque([origin])
    seen = {origin}
    while queue:
        x, y = queue.popleft()
        value = code(x, y)
        if x < old_x and value and (value & 127) - 1 != region:
            return True, len(seen)
        for point in ((x + 8, y), (x - 8, y), (x, y + 8), (x, y - 8)):
            nx, ny = point
            if point in seen or nx < 0 or ny < 0 or nx >= 5000 or ny >= 3000 or not code(nx, ny):
                continue
            seen.add(point)
            queue.append(point)
    return False, len(seen)


def blend_ratio(region, x0, x1, cy, base_width, amplitude, period, y0, y1):
    new = old = 0
    for y in range(y0, y1, 8):
        for x in range(x0, x1, 8):
            px, py = x + 4, y + 4
            if abs(py - cy) >= base_width + amplitude * math.sin(px / period):
                continue
            h = (((px // 16) * 73856093) ^ ((py // 16) * 19349663) ^ (region * 83492791)) & 0xffffffff
            if h % 100 < 60:
                new += 1
            else:
                old += 1
    total = new + old
    return new / total if total else 0, total


def main():
    checks = [
        ("Sakura", (4350, 1490), 17, 3560, (3660, 3820, 1500, 40, 8, 37, 1000, 2000)),
        ("Festung", (4180, 2480), 18, 3472, (3472, 3632, 2300, 52, 6, 41, 2000, 3000)),
    ]
    failed = False
    for name, center, region, old_x, blend_args in checks:
        connected, visited = connected_to_old_land(center, region, old_x)
        ratio, total = blend_ratio(region, *blend_args)
        ok = connected and total > 0 and 0.45 <= ratio <= 0.65
        print("%s: %s; Anschluss=%s; neuer Biome-Anteil=%.1f%% (%d Zellen)" %
              (name, "PASS" if ok else "FAIL", connected, ratio * 100, total))
        failed |= not ok
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
