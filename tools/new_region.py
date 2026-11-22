#!/usr/bin/env python3
"""Phase 20 Teil 2: Generator-Geruest fuer eine neue Insel-Region (Region >= 19). Im Repo-Root:
  python3 tools/new_region.py ID REG "Name EN" "Name DE" CX CY RX RY [--link X1,Y,X2] [--tier N]
Legt an: js/layout-ID.js (Segment, additiv zu js/layout.js), js/region-ID.js (Texte reg_/poi_/shr_ EN+DE),
Schrein ID in data/world.json (ed/tier gesetzt), Script-Tags in index.html. sw.js liest die Tags selbst.
--link: waagerechter Landstreifen (Y, von X1 bis X2, 30 breit) als Verbindung zu einer anderen Insel; er darf bestehendes Land beruehren.
Die Insel selbst darf kein bestehendes Land ueberlappen (Abbruch). Danach: Inhalt in data/world.json, Bauten in js/world.js
(Muster: `if (CEN[18]) {...}`), dann `python3 tools/validate_data.py` und Cache-Version in index.html/config.js erhoehen.
Nicht noetig: Biome/DENS/Kartenfarbe haben Standardwerte (Gras, .05, Farbe von Region 0) -- spaeter in world.js/ui.js anpassen."""
import sys, re, json, math, glob, os
a = [x for x in sys.argv[1:]]; link = None; tier = 2
if '--link' in a: i = a.index('--link'); link = [int(v) for v in a[i + 1].split(',')]; del a[i:i + 2]
if '--tier' in a: i = a.index('--tier'); tier = int(a[i + 1]); del a[i:i + 2]
if len(a) != 8: sys.exit(__doc__)
RID, REG, EN, DE = a[0], int(a[1]), a[2], a[3]; CX, CY, RX, RY = map(int, a[4:8])
if not re.fullmatch(r'[a-z0-9]+', RID) or REG < 19 or tier not in (1, 2, 3): sys.exit('ID klein/alphanumerisch, REG >= 19, tier 1-3')
if os.path.exists('js/layout-%s.js' % RID): sys.exit('js/layout-%s.js existiert schon' % RID)
CELL, WW, HH = 8, 5000, 3000
M = 40  # Rand um die Insel
X0, Y0 = max(0, (CX - int(RX * 1.2) - M) // CELL * CELL), max(0, (CY - int(RY * 1.2) - M) // CELL * CELL)
X1, Y1 = min(WW, -(-(CX + int(RX * 1.2) + M) // CELL) * CELL), min(HH, -(-(CY + int(RY * 1.2) + M) // CELL) * CELL)
if link: X0, X1 = min(X0, link[0] - 8, link[2] - 8) // CELL * CELL, -(-(max(X1, link[0] + 8, link[2] + 8)) // CELL) * CELL; X0 = max(0, X0); X1 = min(WW, X1); Y0 = min(Y0, (link[1] - 20) // CELL * CELL); Y1 = max(Y1, -(-(link[1] + 20) // CELL) * CELL)
W, H = (X1 - X0) // CELL, (Y1 - Y0) // CELL; LAND = REG + 1
def island(x, y):
    t = math.atan2(y - CY, x - CX); w = 1 + .07 * math.sin(3 * t + 1) + .05 * math.sin(5 * t + 2)
    return ((x - CX) / (RX * w)) ** 2 + ((y - CY) / (RY * w)) ** 2 < 1
def strip(x, y): return bool(link) and link[0] <= x < link[2] and abs(y - link[1]) < 15
cells = [[LAND if island(X0 + i * CELL + 4, Y0 + j * CELL + 4) or strip(X0 + i * CELL + 4, Y0 + j * CELL + 4) else 0 for i in range(W)] for j in range(H)]
def load(path):  # bestehende Segmente lesen
    t = open(path).read(); s = json.loads(t[t.index('Object.assign(') + 14:t.index(', { rows:')]); g = {}
    for y, r in enumerate(t[t.index("rows: '") + 7:t.rindex("'")].split('|')):
        x = 0
        for tk in r.split(','):
            v, _, n = tk.partition('*'); n = int(n or 1)
            if int(v, 36): g.update({(s['x0'] + (x + k) * s['cell'], s['y0'] + y * s['cell']): 1 for k in range(n)})
            x += n
    return s['cell'], g
for p in sorted(glob.glob('js/layout*.js')):
    c, g = load(p)
    for j in range(H):
        for i in range(W):
            if cells[j][i] and not strip(X0 + i * CELL + 4, Y0 + j * CELL + 4) and g.get((((X0 + i * CELL + 4) // c) * c, ((Y0 + j * CELL + 4) // c) * c)): sys.exit('Ueberlappt bestehendes Land (%s) bei ~%d,%d. Andere Position/Groesse waehlen.' % (p, X0 + i * CELL, Y0 + j * CELL))
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
roads = [[[link[0], link[1]], [link[2], link[1]], [CX, CY]]] if link else []
d = {"id": RID, "x0": X0, "y0": Y0, "x1": X1, "y1": Y1, "cell": CELL, "w": W, "h": H, "centers": {str(REG): [CX, CY]}, "roads": roads, "rivers": []}
open('js/layout-%s.js' % RID, 'w').write("'use strict';\n// ERZEUGT von tools/new_region.py. Segment %s (Region %d), additiv zu js/layout.js. Nicht von Hand aendern.\nSW.Layouts = SW.Layouts || [];\nSW.Layouts.push(Object.assign(%s, { rows: '%s' }));\n" % (RID, REG, json.dumps(d, separators=(',', ':')), '|'.join(rle(r) for r in cells)))
q = lambda s: s.replace("'", "\\'")
open('js/region-%s.js' % RID, 'w').write("'use strict';\n// ERZEUGT von tools/new_region.py. Texte Region %d (%s). Platzhalter, bitte pruefen.\n(function () {\n  const en = SW.TEXT.en, de = (SW.TEXT.de = SW.TEXT.de || {});\n  Object.assign(en, { reg_%d: '%s', poi_%s: '%s', shr_%s: '%s Shrine' });\n  Object.assign(de, { reg_%d: '%s', poi_%s: '%s', shr_%s: '%s-Schrein' });\n})();\n" % (REG, RID, REG, q(EN), RID, q(EN), RID, q(EN), REG, q(DE), RID, q(DE), RID, q(DE)))
w = json.load(open('data/world.json'))
if any(s['id'] == RID for k in ('spots', 'shrines', 'chests', 'npcs') for s in w[k]): sys.exit('ID %s in data/world.json schon vergeben' % RID)
w['shrines'].append({"id": RID, "x": CX + .5, "y": CY + .5, "ed": "lite", "tier": tier}); json.dump(w, open('data/world.json', 'w'), indent=1, ensure_ascii=False)
h = open('index.html').read(); v = re.search(r'\?v=(\d+)', h).group(1)
h = re.sub(r'(<script src="js/layout[^\n]*\n)(?!<script src="js/layout)', lambda m: m.group(1) + '<script src="js/layout-%s.js?v=%s" defer></script>\n' % (RID, v), h, 1)
h = re.sub(r'(<script src="js/lang-de\.js[^\n]*\n)', lambda m: m.group(1) + '<script src="js/region-%s.js?v=%s" defer></script>\n' % (RID, v), h, 1)
open('index.html', 'w').write(h)
print('OK: Region %d "%s" bei %d,%d. Dateien: js/layout-%s.js, js/region-%s.js; Schrein %s in data/world.json; index.html angepasst.' % (REG, EN, CX, CY, RID, RID, RID))
