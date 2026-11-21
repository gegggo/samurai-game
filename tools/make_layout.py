#!/usr/bin/env python3
"""Draft-Bild -> js/layout.js (Regionsgitter, Straßen, Flüsse, Mittelpunkte).
Aufruf: python3 tools/make_layout.py DRAFT.jpg js/layout.js [preview.png]
Alles Handarbeit steht oben (SEEDS, NODES, EDGES, RIVERS); die Pipeline darunter ist deterministisch."""
import sys, json
import numpy as np, cv2
from scipy import ndimage as ndi
from skimage.segmentation import watershed
from skimage.graph import route_through_array
from skimage.morphology import disk

WW, HH, CELL, MARGIN = 5000, 3000, 8, 60      # Weltmaß (CFG.W/H), Zellgröße in Kacheln, Rand in Kacheln
LAKE_REG = 4                                  # Mirror Lake
# Region -> Startpunkte im Draft (px). Regions-IDs wie reg_N im Spiel. 16 (Karst Spires) fehlt im Draft: Ellipse unten.
SEEDS = {
 12: [(120,260),(250,210),(300,150)], 1: [(400,120),(560,230),(430,250),(520,60)], 2: [(700,100),(650,250),(850,200),(760,60)],
 13: [(980,250),(1060,290),(1000,150)], 0: [(200,330),(300,320),(350,440),(250,420)], 9: [(435,330),(420,430),(470,370)],
 4: [(590,320),(650,330),(520,420),(780,500),(680,580),(580,580),(530,500)], 10: [(730,330),(840,310),(880,420),(740,430),(780,390)],
 5: [(1000,380),(900,560),(1080,520),(950,470),(1050,430)], 3: [(100,450),(160,500),(120,600),(250,540),(300,590)],
 11: [(350,520),(450,500),(400,590),(380,650)], 6: [(130,670),(240,620),(330,670),(200,740)],
 7: [(500,620),(620,650),(480,720),(600,740),(540,870)], 8: [(760,620),(900,650),(1000,720),(850,800),(780,700),(1050,680)],
 14: [(330,800),(400,860)], 15: [(660,780),(760,790),(640,850),(800,860)]}
LAKE_SEEDS = [(600,440),(650,450),(560,450)]
KARST = dict(c=(925,600), r=(100,72), reg=16)  # Karst Spires: SO, zwischen Iron Peaks und Hollow Caves
# Schreine/Orte (Draft px) -> nächstes goldenes Diamant-Zentrum wird gesucht
NODES = dict(bamboo=(483,133), mountain=(777,160), hinode=(259,356), grove=(435,383), garden=(813,365), iron=(1025,485),
             west=(153,541), marsh=(413,596), ruins=(200,716), camp=(554,763), hollow=(895,707), coast=(731,856))
EDGES = [('bamboo','mountain'),('bamboo','hinode'),('hinode','grove'),('grove',(548,424),(685,421),'garden'),('mountain','garden'),('garden','iron'),
         ('iron','hollow'),('hollow','camp'),('camp','ruins'),('hinode','west'),('west','ruins'),('camp',(627,505))]
RIVERS = [((25,688),(545,497)), ((697,385),(1145,357)), ((625,520),(748,905))]

def main(src, out, prev=None):
    im = cv2.cvtColor(cv2.imread(src), cv2.COLOR_BGR2RGB); H, W, _ = im.shape; a = im.astype(int)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    sea = (b > r + 25) & (g < 100)
    sea[:110, :560] = True; sea[:80, 1050:] = True                      # Titeltext/Kompass liegen im Meer
    sea = ndi.binary_opening(sea, disk(2)); lab, n = ndi.label(~sea)     # Insel = größte Nicht-Meer-Fläche
    isl = lab == (1 + np.argmax(ndi.sum(~sea, lab, range(1, n + 1)))); isl = ndi.binary_fill_holes(isl)
    ys, xs = np.nonzero(isl); y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
    S = (HH - 2 * MARGIN) / (y1 - y0 + 1)                                 # Kacheln pro Draft-Pixel, an Höhe ausgerichtet
    OX, OY = MARGIN - x0 * S, MARGIN - y0 * S
    # Regionen: Wasserscheide auf geglättetem Farbverlauf (Text/Wege/Linien durch Median entfernt)
    sm = cv2.GaussianBlur(cv2.medianBlur(im, 9), (0, 0), 1.5)
    lb = cv2.cvtColor(sm, cv2.COLOR_RGB2LAB).astype(float)
    el = sum(np.hypot(ndi.sobel(lb[..., k], 0), ndi.sobel(lb[..., k], 1)) for k in range(3))
    white = (r > 215) & (g > 215) & (b > 200) & isl; el = el + 40 * ndi.binary_dilation(white, disk(1))  # weiße Grenzlinien sperren
    mk = np.zeros((H, W), np.int32); mk[~isl] = 1                                 # 1 = Meer, 2.. = Regionen, 40 = See
    for reg, pts in SEEDS.items():
        for x, y in pts: cv2.circle(mk, (x, y), 5, 2 + reg, -1)
    for x, y in LAKE_SEEDS: cv2.circle(mk, (x, y), 5, 40, -1)
    L = watershed(el, mk); L = L.astype(np.int32)
    lakem = (b > r + 40) & (g >= 100) & isl; lakem = ndi.binary_opening(lakem, disk(7))   # See = große blaue Fläche (Flüsse sind dünn)
    lab, n = ndi.label(lakem); lk = lab == lab[450, 600]; lk = ndi.binary_closing(lk, disk(5)); lk = ndi.binary_fill_holes(lk)
    L[L == 40] = 2 + LAKE_REG; L[lk] = 1000 + 128 + LAKE_REG + 1              # See-Pixel markieren (Region 4)
    cy, cx = np.mgrid[:H, :W]; ke = ((cx - KARST['c'][0]) / KARST['r'][0]) ** 2 + ((cy - KARST['c'][1]) / KARST['r'][1]) ** 2 < 1
    L[ke & (L >= 2) & (L < 1000)] = 2 + KARST['reg']
    reg = np.where(L >= 1000, L - 1000, np.where(L == 1, 0, L - 1)); reg = reg.astype(np.int32)  # 0 Meer, reg+1 Land, 128+reg+1 See
    reg = np.where(isl | (reg == 0), reg, 0)
    for v in np.unique(reg):                                         # Inselchen (< 1500 px) einer Region dem Nachbarn geben
        if v == 0: continue
        lab, n = ndi.label(reg == v)
        for k in range(1, n + 1):
            m = lab == k
            if m.sum() < 1500 and m.sum() < (reg == v).sum():
                reg[m] = 0; i = ndi.distance_transform_edt(reg == 0, return_indices=True)[1]; reg[m] = reg[i[0][m], i[1][m]] if False else v
                oth = ndi.binary_dilation(m, disk(3)) & ~m & (reg != v) & (reg != 0)
                if oth.any(): reg[m] = np.bincount(reg[oth]).argmax()
    # Mehrheitsfilter gegen Rauschen (3 Durchläufe, 5x5)
    for _ in range(3):
        idx = np.unique(reg); cnt = np.stack([cv2.blur((reg == v).astype(np.float32), (7, 7)) for v in idx]); reg = idx[np.argmax(cnt, 0)]
    # Zellgitter
    cw, chh = WW // CELL, HH // CELL; grid = np.zeros((chh, cw), np.uint8)
    for j in range(chh):
        for i in range(cw):
            px, py = int(((i + .5) * CELL - OX) / S), int(((j + .5) * CELL - OY) / S)
            if 0 <= px < W and 0 <= py < H: grid[j, i] = reg[py, px]
    # Flussnähe sperren: Mittelpunkte und verschobene Inhalte sollen nicht im Wasser landen
    rivers_px = None
    # Mittelpunkte werden nach den Flüssen berechnet (siehe unten)
    # Wege: kostengünstigster Pfad über wegfarbene Pixel zwischen goldenen Schrein-Rauten
    gold = (r > 215) & (g > 160) & (g < 215) & (b < 100); gl, gn = ndi.label(gold)
    cm = ndi.center_of_mass(gold, gl, range(1, gn + 1)); sz = ndi.sum(gold, gl, range(1, gn + 1))
    cm = [(c[1], c[0]) for c, s in zip(cm, sz) if s > 20]
    def node(p): q = min(cm, key=lambda c: (c[0]-p[0])**2 + (c[1]-p[1])**2); return q if (q[0]-p[0])**2 + (q[1]-p[1])**2 < 900 else p
    road = (r > 190) & (g > 170) & (b > 100) & (b < g - 25) & (r - b > 40); inland = ndi.binary_erosion(isl, disk(9))
    rcost = np.where(road, 1.0, 40.0); rcost[~inland] = 400.0
    def trace(p, q, cost):
        path, _ = route_through_array(cost, (int(p[1]), int(p[0])), (int(q[1]), int(q[0])), fully_connected=True, geometric=True)
        pts = np.array([(x, y) for y, x in path], np.int32).reshape(-1, 1, 2)
        return cv2.approxPolyDP(pts, 2.0, False).reshape(-1, 2)
    def tiles(pl): return [[int(x * S + OX), int(y * S + OY)] for x, y in pl]
    roads = []
    def pt(v): return node(NODES[v]) if isinstance(v, str) else v
    for e in EDGES:                                                   # Kante = Folge aus Knoten/Via-Punkten
        pl = []
        for k in range(len(e) - 1): pl += list(trace(pt(e[k]), pt(e[k + 1]), rcost))
        roads.append(tiles(pl))
    rivm = (b > r + 55) & (g > 95) & ~ndi.binary_dilation(lk, disk(2)); rivc = np.where(rivm, 1.0, 40.0)
    rivers = [tiles(trace(p, q, rivc)) for p, q in RIVERS]
    rm = np.zeros((chh, cw), np.uint8)
    for rv in rivers: cv2.polylines(rm, [np.array(rv, np.int32).reshape(-1, 1, 2) // CELL], False, 1, 1)
    rm = cv2.dilate(rm, np.ones((5, 5), np.uint8)) > 0                    # ca. 20 Kacheln Puffer je Seite
    cen, rad = {}, {}
    for rid in range(17):
        if rid == LAKE_REG:                                               # Mirror Lake: Mittelpunkt = Seemitte
            yy, xx = np.nonzero(grid == 128 + rid + 1); cen[rid] = [int(xx.mean() * CELL + CELL / 2), int(yy.mean() * CELL + CELL / 2)]; continue
        m = (grid == rid + 1) & ~rm
        d = ndi.distance_transform_edt(np.pad(m, 1))[1:-1, 1:-1]; j, i = np.unravel_index(np.argmax(d), d.shape)
        cen[rid] = [int(i * CELL + CELL / 2), int(j * CELL + CELL / 2)]; rad[rid] = int(d[j, i] * CELL)
    print('Radius um Mittelpunkt (Kacheln):', rad)
    shr = {k: [int(node(v)[0] * S + OX), int(node(v)[1] * S + OY)] for k, v in NODES.items()}
    # RLE
    def b36(v): return np.base_repr(int(v), 36).lower()
    rows = []
    for j in range(chh):
        rw = grid[j]; ch = np.nonzero(np.diff(rw))[0] + 1; st = np.concatenate([[0], ch]); en = np.concatenate([ch, [cw]])
        rows.append(','.join(b36(rw[s]) + ('*' + str(e - s) if e - s > 1 else '') for s, e in zip(st, en)))
    seg = dict(id='base', x0=0, y0=0, x1=WW, y1=HH, cell=CELL, w=cw, h=chh, centers=cen, nodes=shr, scale=round(S, 4), roads=roads, rivers=rivers)
    js = ("'use strict';\n// ERZEUGT von tools/make_layout.py aus dem World Draft. Nicht von Hand ändern.\n"
          "// Zellwert: 0 Meer, reg+1 Land, 128+reg+1 See. Zeile = Läufe 'wert*anzahl' (base36), Zeilen mit '|' getrennt. Koordinaten in Kacheln.\n"
          "SW.Layouts = SW.Layouts || [];\nSW.Layouts.push(Object.assign(" + json.dumps(seg, separators=(',', ':')) + ", { rows: '" + '|'.join(rows) + "' }));\n")
    open(out, 'w').write(js)
    print('Insel Skala %.3f Kacheln/px, Breite %d Höhe %d, Größe %d KB, Straßen %d, Flüsse %d' % (S, (x1 - x0) * S, (y1 - y0) * S, len(js) // 1024, len(roads), len(rivers)))
    print('Mittelpunkte', cen)
    if prev:
        ov = im.copy(); bd = (reg != cv2.dilate(reg.astype(np.uint8), np.ones((3, 3), np.uint8))) | (reg != cv2.erode(reg.astype(np.uint8), np.ones((3, 3), np.uint8)))
        ov[bd] = (255, 0, 255); cv2.imwrite(prev + '.draft.png', cv2.cvtColor(ov, cv2.COLOR_RGB2BGR))
        pal = {0:(0,0,0),1:(143,160,95),2:(74,122,58),3:(138,130,112),4:(58,100,56),5:(64,112,96),6:(126,118,108),7:(118,106,92),8:(140,100,60),9:(88,78,98),10:(44,84,56),11:(128,126,120),12:(88,112,70),13:(225,232,238),14:(118,62,42),15:(214,176,98),16:(205,190,140),17:(200,60,200)}
        pv = np.zeros((chh, cw, 3), np.uint8)
        for j in range(chh):
            for i in range(cw):
                v = grid[j, i]; pv[j, i] = (58, 110, 190) if v >= 128 else pal.get(int(v), (255, 0, 255))
        pv = cv2.resize(pv, (cw * 2, chh * 2), interpolation=cv2.INTER_NEAREST)
        for rd in roads: cv2.polylines(pv, [np.array(rd) // (CELL // 2)], False, (240, 220, 150), 2)
        for rv in rivers: cv2.polylines(pv, [np.array(rv) // (CELL // 2)], False, (90, 170, 255), 2)
        for k, (x, y) in shr.items(): cv2.circle(pv, (x // (CELL // 2), y // (CELL // 2)), 4, (255, 200, 0), -1)
        for k, (x, y) in cen.items(): cv2.circle(pv, (x // (CELL // 2), y // (CELL // 2)), 5, (255, 0, 0), 1); cv2.putText(pv, str(k), (x // (CELL // 2) + 6, y // (CELL // 2)), 0, .5, (255, 255, 255), 1)
        cv2.imwrite(prev, cv2.cvtColor(pv, cv2.COLOR_RGB2BGR))

if __name__ == '__main__':
    main(*sys.argv[1:4])
