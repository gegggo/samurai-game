#!/usr/bin/env python3
"""Generator fuer eine neue, nahtlos angebaute Region (REG >= 20).
Aufruf im Projekt-Root:
  python3 tools/new_region.py ID REG "Name EN" "Name DE" CX CY RX RY [--tier N]
Die Region wird automatisch mit dem naechsten bestehenden Land verbunden. Der Anschluss
ist ein organischer Landkorridor (10-20 Layout-Kacheln breit), keine Bruecke. In der
Uebergangszone gehoeren ca. 60% der neuen Kacheln zur neuen Region und 40% zur
angrenzenden alten Region. --link bleibt nur aus Kompatibilitaet mit alten Aufrufen erhalten.
Erzeugt Layout/Textdateien, Schrein-Datensatz und Script-Tags. Danach Inhalte/Bauten ergaenzen
und tools/validate_data.py ausfuehren."""
import sys, re, json, math, glob, os
a = [x for x in sys.argv[1:]]; link = None; tier = 2
if '--link' in a: i = a.index('--link'); link = [int(v) for v in a[i + 1].split(',')]; del a[i:i + 2]
if '--tier' in a: i = a.index('--tier'); tier = int(a[i + 1]); del a[i:i + 2]
if len(a) != 8: sys.exit(__doc__)
RID, REG, EN, DE = a[0], int(a[1]), a[2], a[3]; CX, CY, RX, RY = map(int, a[4:8])
if not re.fullmatch(r'[a-z0-9]+', RID) or REG < 20 or tier not in (1, 2, 3): sys.exit('ID klein/alphanumerisch, REG >= 19, tier 1-3')
if os.path.exists('js/layout-%s.js' % RID): sys.exit('js/layout-%s.js existiert schon' % RID)
CELL, WW, HH = 8, 5000, 3000
M = 40
LAND = REG + 1
X0, Y0 = max(0, (CX - int(RX * 1.2) - M) // CELL * CELL), max(0, (CY - int(RY * 1.2) - M) // CELL * CELL)
X1, Y1 = min(WW, -(-(CX + int(RX * 1.2) + M) // CELL) * CELL), min(HH, -(-(CY + int(RY * 1.2) + M) // CELL) * CELL)
if link:
    X0 = max(0, min(X0, link[0] - 8, link[2] - 8) // CELL * CELL)
    X1 = min(WW, -(-max(X1, link[0] + 8, link[2] + 8) // CELL) * CELL)
    Y0 = max(0, min(Y0, (link[1] - 20) // CELL * CELL))
    Y1 = min(HH, -(-max(Y1, link[1] + 20) // CELL) * CELL)

def island(x, y):
    t = math.atan2(y - CY, x - CX); w = 1 + .07 * math.sin(3 * t + 1) + .05 * math.sin(5 * t + 2)
    return ((x - CX) / (RX * w)) ** 2 + ((y - CY) / (RY * w)) ** 2 < 1

def load(path):
    t = open(path).read(); seg = json.loads(t[t.index('Object.assign(') + 14:t.index(', { rows:')]); g = {}
    for y, row in enumerate(t[t.index("rows: '") + 7:t.rindex("'")].split('|')):
        x = 0
        for token in row.split(','):
            v, _, n = token.partition('*'); n = int(n or 1); value = int(v, 36)
            if value:
                for k in range(n): g[(seg['x0'] + (x + k) * seg['cell'], seg['y0'] + y * seg['cell'])] = value
            x += n
    return seg['cell'], g

# Bestehende Landzellen aller Segmente sammeln; neue Region darf keine davon ueberdecken.
existing = {}
for path in sorted(glob.glob('js/layout*.js')):
    c, part = load(path)
    for (x, y), value in part.items():
        if value < 128: existing[(x, y)] = value

island_cells = []
for y in range(Y0, Y1, CELL):
    for x in range(X0, X1, CELL):
        if island(x + CELL / 2, y + CELL / 2):
            if (x, y) in existing:
                sys.exit('Neue Insel ueberlappt bestehendes Land bei %d,%d. Andere Position/Groesse waehlen.' % (x, y))
            island_cells.append((x, y))
if not island_cells: sys.exit('Die neue Insel enthaelt keine Landzellen.')

# Automatischer, organischer Landanschluss statt Bruecke.
connector = {}
if not link:
    old_points = list(existing)
    if not old_points: sys.exit('Kein bestehendes Land zum Anbauen gefunden.')
    try:
        import numpy as np
        from scipy.spatial import cKDTree
        tree = cKDTree(np.asarray(old_points, dtype=float))
        distances, indexes = tree.query(np.asarray(island_cells, dtype=float), k=1)
        n = int(np.argmin(distances)); new_anchor = island_cells[n]; old_anchor = old_points[int(indexes[n])]
    except Exception:
        # Fallback ohne SciPy: grobe Suche auf ausgeduennten Landpunkten.
        sample = old_points[::max(1, len(old_points) // 12000)]
        new_sample = island_cells[::max(1, len(island_cells) // 1200)]
        new_anchor, old_anchor = min(((a, b) for a in new_sample for b in sample), key=lambda pair: (pair[0][0]-pair[1][0])**2 + (pair[0][1]-pair[1][1])**2)
    old_code = existing[old_anchor]
    # Bresenham im Layout-Raster, danach organisch verbreiterter Korridor.
    x0, y0 = old_anchor[0] // CELL, old_anchor[1] // CELL
    x1, y1 = new_anchor[0] // CELL, new_anchor[1] // CELL
    dx, dy = abs(x1-x0), abs(y1-y0); sx = 1 if x0 < x1 else -1; sy = 1 if y0 < y1 else -1; err = dx-dy
    path_cells = []
    while True:
        path_cells.append((x0, y0))
        if x0 == x1 and y0 == y1: break
        e2 = 2*err
        if e2 > -dy: err -= dy; x0 += sx
        if e2 < dx: err += dx; y0 += sy
    radius = 6 + (REG % 5)  # 13-21 Layout-Kacheln Gesamtbreite
    for px, py in path_cells:
        for oy in range(-radius, radius + 1):
            for ox in range(-radius, radius + 1):
                if ox*ox + oy*oy > radius*radius: continue
                gx, gy = (px + ox) * CELL, (py + oy) * CELL
                if not (0 <= gx < WW and 0 <= gy < HH) or (gx, gy) in existing or (gx, gy) in island_cells: continue
                # Cluster statt Schachbrett: stabile 60/40-Aufteilung ueber grobe 2x2-Zellen.
                h = ( ((gx // (CELL*2))*73856093) ^ ((gy // (CELL*2))*19349663) ^ (REG*83492791) ) & 0xffffffff
                cluster_new = (h % 100) < 60
                connector[(gx, gy)] = LAND if cluster_new else old_code
else:
    # Legacy-Aufruf: alter Landstreifen; bestehendes Land wird nicht ueberschrieben.
    for y in range(Y0, Y1, CELL):
        for x in range(X0, X1, CELL):
            if link[0] <= x + CELL/2 < link[2] and abs(y + CELL/2 - link[1]) < 15 and (x,y) not in existing:
                connector[(x,y)] = LAND

all_points = island_cells + list(connector)
X0 = max(0, min(x for x,y in all_points) - CELL*2); Y0 = max(0, min(y for x,y in all_points) - CELL*2)
X1 = min(WW, max(x for x,y in all_points) + CELL*3); Y1 = min(HH, max(y for x,y in all_points) + CELL*3)
W, H = (X1-X0)//CELL, (Y1-Y0)//CELL
cellmap = {p: LAND for p in island_cells}; cellmap.update(connector)
cells = [[cellmap.get((X0+i*CELL, Y0+j*CELL), 0) for i in range(W)] for j in range(H)]

def b36(n):
    d = '0123456789abcdefghijklmnopqrstuvwxyz'; s = ''
    while True:
        s = d[n % 36] + s; n //= 36
        if not n: return s
def rle(r):
    o, i = [], 0
    while i < len(r):
        j = i
        while j < len(r) and r[j] == r[i]: j += 1
        o.append(('%s*%d' % (b36(r[i]), j - i)) if j - i > 1 else b36(r[i])); i = j
    return ','.join(o)
roads = []
d = {"id": RID, "x0": X0, "y0": Y0, "x1": X1, "y1": Y1, "cell": CELL, "w": W, "h": H, "centers": {str(REG): [CX, CY]}, "roads": roads, "rivers": []}
open('js/layout-%s.js' % RID, 'w').write("'use strict';\n// ERZEUGT von tools/new_region.py. Segment %s (Region %d), additiv zu js/layout.js. Nicht von Hand aendern.\nSW.Layouts = SW.Layouts || [];\nSW.Layouts.push(Object.assign(%s, { rows: '%s' }));\n" % (RID, REG, json.dumps(d, separators=(',', ':')), '|'.join(rle(r) for r in cells)))
q = lambda s: s.replace("'", "\\'")
open('js/region-%s.js' % RID, 'w').write("'use strict';\n// ERZEUGT von tools/new_region.py. Texte Region %d (%s). Platzhalter, bitte pruefen.\n(function () {\n  const en = SW.TEXT.en, de = (SW.TEXT.de = SW.TEXT.de || {});\n  Object.assign(en, { reg_%d: '%s', poi_%s: '%s', shr_%s: '%s Shrine' });\n  Object.assign(de, { reg_%d: '%s', poi_%s: '%s', shr_%s: '%s-Schrein' });\n})();\n" % (REG, RID, REG, q(EN), RID, q(EN), RID, q(EN), REG, q(DE), RID, q(DE), RID, q(DE)))
w = json.load(open('data/world.json'))
if any(s['id'] == RID for k in ('spots', 'shrines', 'chests', 'npcs') for s in w[k]): sys.exit('ID %s in data/world.json schon vergeben' % RID)
w['shrines'].append({"id": RID, "x": CX + .5, "y": CY + .5, "ed": "lite", "tier": tier}); json.dump(w, open('data/world.json', 'w'), indent=1, ensure_ascii=False)
index_path = 'index.html' if os.path.exists('index.html') else 'root/index.html'
h = open(index_path).read(); v = re.search(r'\?v=(\d+)', h).group(1)
h = re.sub(r'(<script src="js/layout[^\n]*\n)(?!<script src="js/layout)', lambda m: m.group(1) + '<script src="js/layout-%s.js?v=%s" defer></script>\n' % (RID, v), h, 1)
h = re.sub(r'(<script src="js/lang-de\.js[^\n]*\n)', lambda m: m.group(1) + '<script src="js/region-%s.js?v=%s" defer></script>\n' % (RID, v), h, 1)
open(index_path, 'w').write(h)
print('OK: Region %d "%s" bei %d,%d; Landanschluss %d Zellen, 60/40-Uebergang. Dateien: js/layout-%s.js, js/region-%s.js; Schrein %s in data/world.json; index.html angepasst.' % (REG, EN, CX, CY, len(connector), RID, RID, RID))
