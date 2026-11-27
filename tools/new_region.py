#!/usr/bin/env python3
"""Generator fuer eine neue, nahtlos angebaute Region (REG >= 20).
Aufruf im Projekt-Root:
  python3 tools/new_region.py ID REG "Name EN" "Name DE" CX CY RX RY [--tier N]
Die Region wird als organische Landflaeche direkt an die Hauptkarte angebaut.
Es werden keine Inseln, Bruecken oder Verbindungskorridore erzeugt. Die neue Flaeche
muss das bestehende Land breit ueberlappen; bestehende Land- und Seetiles bleiben
unveraendert. Die 60/40-Mischung am Rand entsteht durch terrainRegionAt in world.js.
Erzeugt Layout/Textdateien, Schrein-Datensatz und Script-Tags. Danach Inhalte/Bauten ergaenzen
und tools/validate_data.py ausfuehren."""
import sys, re, json, math, glob, os
a = [x for x in sys.argv[1:]]; tier = 2
if '--link' in a: sys.exit('--link wird nicht mehr unterstuetzt: CX/CY/RX/RY muessen die neue Landflaeche direkt an die Hauptkarte anbauen.')
if '--tier' in a: i = a.index('--tier'); tier = int(a[i + 1]); del a[i:i + 2]
if len(a) != 8: sys.exit(__doc__)
RID, REG, EN, DE = a[0], int(a[1]), a[2], a[3]; CX, CY, RX, RY = map(int, a[4:8])
if not re.fullmatch(r'[a-z0-9]+', RID) or REG < 20 or tier not in (1, 2, 3): sys.exit('ID klein/alphanumerisch, REG >= 20, tier 1-3')
if os.path.exists('js/layout-%s.js' % RID): sys.exit('js/layout-%s.js existiert schon' % RID)
CELL, WW, HH = 8, 6200, 3200
LAND = REG + 1
X0, Y0 = max(0, (CX - int(RX * 1.2) - 40) // CELL * CELL), max(0, (CY - int(RY * 1.2) - 40) // CELL * CELL)
X1, Y1 = min(WW, -(-(CX + int(RX * 1.2) + 40) // CELL) * CELL), min(HH, -(-(CY + int(RY * 1.2) + 40) // CELL) * CELL)

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

# Bestehende Land- und Seetiles sammeln. Sie duerfen nicht ueberschrieben werden.
existing, occupied = {}, set()
for path in sorted(glob.glob('js/layout*.js')):
    c, part = load(path)
    for pos, value in part.items():
        occupied.add(pos)
        if value < 128: existing[pos] = value

# Neue Flaeche als breite, organische Erweiterung rasterisieren. Ueberlappende
# bestehende Zellen bleiben unveraendert; nur Meer wird mit der neuen Region gefuellt.
island_cells = []
for y in range(Y0, Y1, CELL):
    for x in range(X0, X1, CELL):
        if island(x + CELL / 2, y + CELL / 2) and (x, y) not in occupied:
            island_cells.append((x, y))
if not island_cells: sys.exit('Die Erweiterung enthaelt keine neuen Landzellen.')

# Der neue Landkoerper muss breit direkt an bestehendes Land anschliessen.
touch = set()
for x, y in island_cells:
    for p in ((x-CELL,y),(x+CELL,y),(x,y-CELL),(x,y+CELL)):
        if p in existing: touch.add(p)
if len(touch) < 10:
    sys.exit('Die Flaeche beruehrt die Hauptlandmasse nicht breit genug (%d Kontaktzellen). CX/CY/RX/RY anpassen.' % len(touch))
xs, ys = [p[0] for p in touch], [p[1] for p in touch]
if max(max(xs)-min(xs), max(ys)-min(ys)) < CELL * 8:
    sys.exit('Der Landanschluss ist zu schmal. Die Ueberlappung muss mindestens 8 Layoutzellen breit sein.')

all_points = island_cells
X0 = max(0, min(x for x,y in all_points) - CELL*2); Y0 = max(0, min(y for x,y in all_points) - CELL*2)
X1 = min(WW, max(x for x,y in all_points) + CELL*3); Y1 = min(HH, max(y for x,y in all_points) + CELL*3)
W, H = (X1-X0)//CELL, (Y1-Y0)//CELL
cellmap = {p: LAND for p in island_cells}
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
print('OK: Region %d "%s" bei %d,%d als breite Landflaeche angebaut; %d neue Landzellen, 60/40-Uebergang ueber world.js. Dateien: js/layout-%s.js, js/region-%s.js; Schrein %s in data/world.json; index.html angepasst.' % (REG, EN, CX, CY, len(island_cells), RID, RID, RID))
