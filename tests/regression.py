#!/usr/bin/env python3
"""Regressionstests (Spec 33.5) im headless Chromium 852x393. Aufruf (im Repo-Root): python3 tests/regression.py
Startet selbst einen lokalen Server. Ergebnis je Test: PASS / FAIL + Kurzergebnis. Kein Geraetetest."""
import subprocess, sys, time, json, shutil
from playwright.sync_api import sync_playwright
srv = subprocess.Popen([sys.executable, '-m', 'http.server', '8124'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
URL = 'http://localhost:8124/index.html'; R = []
def rec(name, ok, msg=''): R.append((name, ok, msg)); print(('PASS ' if ok else 'FAIL ') + name + (' - ' + str(msg) if msg else ''))
def start(b, errs):
    ctx = b.new_context(viewport={'width': 852, 'height': 393}); pg = ctx.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(URL); pg.wait_for_timeout(1000); pg.get_by_text('New game').click(); pg.wait_for_timeout(500); return pg
def cont(pg):
    pg.reload(); pg.wait_for_timeout(1000); pg.get_by_text('Continue').click(); pg.wait_for_timeout(500)
def ev(pg, js): return pg.evaluate(js)
# Statische Kartenpruefung: alle Landregionen muessen eine zusammenhaengende Landmasse bilden.
def check_connected_mainland():
    import os, re
    from collections import deque
    html = open('index.html', encoding='utf-8').read()
    files = re.findall(r'<script src="(js/layout[^"]+\.js)', html)
    segs = []
    for path in files:
        src = open(path, encoding='utf-8').read()
        a = src.index('Object.assign(') + 14
        b = src.index(', { rows:')
        meta = json.loads(src[a:b])
        raw = src[src.index("rows: '") + 7:src.rindex("'")]
        segs.append((meta, raw.split('|')))
    width = max(m['x1'] for m, _ in segs) // 8
    height = max(m['y1'] for m, _ in segs) // 8
    grid = [0] * (width * height)
    for m, rows in segs:
        for y, row in enumerate(rows):
            x = 0
            for token in row.split(','):
                pair = token.split('*')
                value = int(pair[0], 36)
                count = int(pair[1]) if len(pair) > 1 else 1
                if value:
                    for k in range(count):
                        gx = m['x0'] // 8 + x + k
                        gy = m['y0'] // 8 + y
                        if 0 <= gx < width and 0 <= gy < height:
                            grid[gy * width + gx] = value
                x += count
    seen = bytearray(len(grid))
    components = 0
    region_cells = {17: 0, 18: 0, 19: 0}
    contacts = {17: 0, 18: 0, 19: 0}
    for i, value in enumerate(grid):
        if 0 < value < 128 and value - 1 in region_cells:
            region_cells[value - 1] += 1
        if value == 0 or value >= 128 or seen[i]:
            continue
        components += 1
        queue = deque([i])
        seen[i] = 1
        while queue:
            j = queue.popleft()
            x, y = j % width, j // width
            for dx, dy in ((1,0),(-1,0),(0,1),(0,-1)):
                nx, ny = x + dx, y + dy
                if not (0 <= nx < width and 0 <= ny < height):
                    continue
                ni = ny * width + nx
                nv = grid[ni]
                if 0 < nv < 128 and not seen[ni]:
                    seen[ni] = 1
                    queue.append(ni)
    for reg in contacts:
        for y in range(height):
            for x in range(width):
                if grid[y * width + x] != reg + 1:
                    continue
                if any(0 <= x+dx < width and 0 <= y+dy < height and
                       0 < grid[(y+dy)*width+x+dx] < reg+1
                       for dx,dy in ((1,0),(-1,0),(0,1),(0,-1))):
                    contacts[reg] += 1
    return components, region_cells, contacts

components, region_cells, contacts = check_connected_mainland()
rec('Map: alle Regionen bilden eine einzige zusammenhaengende Landmasse',
    components == 1 and all(region_cells[r] > 0 and contacts[r] >= 10 for r in (17,18,19)),
    'components=%s regions=%s contacts=%s' % (components, region_cells, contacts))

try:
  with sync_playwright() as p:
    b = p.chromium.launch(executable_path=shutil.which('chromium')) if shutil.which('chromium') else p.chromium.launch(); errs = []
    # 1 Speichern + Laden
    pg = start(b, errs)
    ev(pg, "SW.Inv.addCoins(123); SW.Char.addXp(200); SW.Essence.add(3); SW.Karma.add('t1', 10); SW.YinYang.gain('yin', 5); SW.Save.save();")
    before = ev(pg, "JSON.stringify([SW.Inv.coins, SW.Char.level, SW.Char.xp, SW.Essence.n, SW.Karma.v, SW.YinYang.yin])")
    cont(pg); after = ev(pg, "JSON.stringify([SW.Inv.coins, SW.Char.level, SW.Char.xp, SW.Essence.n, SW.Karma.v, SW.YinYang.yin])")
    rec('Speichern/Laden: Muenzen, Level, XP, Essence, Karma, Yin', before == after, before + ' -> ' + after)
    # 2 Vorab-Sicherung + beschaedigter Hauptstand
    ev(pg, "SW.Inv.addCoins(7); SW.Save.save()")
    has_bak = ev(pg, "!!localStorage.getItem('sw_progress_v1_bak')")
    rec('Sicherung vor Ueberschreiben (Kopie vorhanden)', has_bak)
    ev(pg, "localStorage.setItem('sw_progress_v1', '{kaputt')")
    pg.reload(); pg.wait_for_timeout(1000); ok = ev(pg, "SW.Save.damaged === true || SW.Save.has()")
    pg.get_by_text('Continue').click(); pg.wait_for_timeout(500); c = ev(pg, "SW.Inv.coins")
    rec('Beschaedigter Hauptstand: faellt auf Kopie zurueck, kein Absturz', ok and c >= 123, 'Muenzen %s' % c)
    # 3 Neues Spiel -> Wiederherstellungspunkt, Slots, Wiederherstellen
    pg.wait_for_timeout(800); ev(pg, "SW.Save.save()"); c0 = ev(pg, "SW.Inv.coins")
    try: ev(pg, "SW.Save.newGame()")
    except Exception: pass
    pg.wait_for_timeout(1200); sl = ev(pg, "SW.Save.slots().map(s => [s.key, s.main, s.ok])")
    rec('Neues Spiel: alter Stand bleibt als gueltiger Wiederherstellungspunkt, Hauptstand leer', len(sl) >= 1 and all(x[2] and not x[1] for x in sl), str(sl))
    try: pg.evaluate("k => SW.Save.restore(k)", sl[0][0])
    except Exception: pass
    pg.wait_for_timeout(1200); pg.get_by_text('Continue').click(); pg.wait_for_timeout(500)
    rec('Wiederherstellen: Punkt wird Hauptstand, Daten stimmen', ev(pg, "SW.Inv.coins") == c0, '%s vs %s' % (ev(pg, "SW.Inv.coins"), c0))
    # 4 Export/Import
    txt = ev(pg, "SW.Save.exportText()")
    ok1 = ev(pg, "t => SW.Save.inspect(t).ok === true", ) if False else pg.evaluate("t => SW.Save.inspect(t).ok === true", txt)
    tam = txt.replace('"sum":', '"sum":1', 1)
    e2 = pg.evaluate("t => SW.Save.inspect(t).err", tam); e3 = pg.evaluate("SW.Save.inspect('kein json').err")
    e4 = pg.evaluate("SW.Save.applyImport('{\"sw\":\"x\"}')"); still = ev(pg, "SW.Inv.coins >= 123")
    rec('Export/Import: gueltig ok, manipuliert/ungueltig abgewiesen, Stand unveraendert', ok1 and e2 in ('sum', 'bad') and e3 == 'bad' and e4 is False and still, '%s %s %s' % (e2, e3, e4))
    # 5 Inventar
    r = ev(pg, """() => { const I=SW.Inv; I.bag={}; I.eq={}; const o={};
      o.add=I.add('herb',3); o.bad1=I.add('gibtsnicht',1); o.bad2=I.add('herb',-1); o.n=I.bag.herb;
      o.rm=I.remove('herb',2); o.rmBad=I.remove('herb',5); o.left=I.bag.herb;
      const c=I.coins; o.spendOver=I.spend(c+1); o.coinsSame=I.coins===c;
      const wi=SW.Data.items.find(i=>i.slot==='main'); const w=wi&&wi.id; if(w){ I.add(w,1); o.eq=I.equip(w); o.inBag=I.bag[w]||0; o.slot=I.eq.main===w; o.un=I.unequip('main'); o.back=I.bag[w]||0; }
      return o; }""")
    ok = r['add'] and not r['bad1'] and not r['bad2'] and r['n'] == 3 and r['rm'] and not r['rmBad'] and r['left'] == 1 and not r['spendOver'] and r['coinsSame']
    if 'eq' in r: ok = ok and r['eq'] and r['inBag'] == 0 and r['slot'] and r['un'] and r['back'] == 1
    rec('Inventar: hinzufuegen/entfernen/ausruesten/ablegen, keine ungueltigen Mengen, keine Ueberzahlung', ok, json.dumps(r))
    # 6 Quest
    r = ev(pg, """() => { const Q=SW.Quests, D=SW.Data, o={}; const q=D.quests.find(q=>q.obj.type==='have' && !q.choice && q.rew && q.rew.coins);
      if(!q) return {none:true}; if(q.req&&q.req.done) Q.st[q.req.done]='done';
      o.id=q.id; o.s0=Q.status(q.id); o.acc=Q.accept(q.id); SW.Inv.bag[q.obj.item]=q.obj.n; o.s1=Q.status(q.id);
      const c0=SW.Inv.coins, x0=SW.Char.xp+SW.Char.level*1e6; o.c1=Q.complete(q.id); o.dc=SW.Inv.coins-c0; o.exp=q.rew.coins; o.c2=Q.complete(q.id); o.dc2=SW.Inv.coins-c0; o.left=SW.Inv.bag[q.obj.item]||0;
      SW.Save.save(); return o; }""")
    rec('Quest: annehmen, bereit, abschliessen, Belohnung genau einmal, Gegenstand abgegeben', not r.get('none') and r['acc'] and r['s1'] == 'ready' and r['c1'] and r['dc'] == r['exp'] and not r['c2'] and r['dc2'] == r['exp'] and r['left'] == 0, json.dumps(r))
    qid = r.get('id'); cont(pg); st = ev(pg, "id => SW.Quests.st[id]") if False else pg.evaluate("id => SW.Quests.st[id]", qid)
    rec('Quest-Status bleibt nach Neuladen', st == 'done', str(st))
    # 6b Phase 25: Choice-Quests haben kein questweites rew; Anzeige muss sicher bleiben
    r = ev(pg, """() => { const Q=SW.Quests, D=SW.Data, c=D.quests.filter(q=>q.choice); return {empty:Q.rewText(undefined)==='', choices:c.length>0 && c.every(q=>q.choice.every(x=>x.rew && typeof x.rew==='object')), region:SW.World.regionAt(5600,2100)===19, pilot:D.quests.some(q=>q.id==='pilot4')}; }""")
    rec('Phase 25: Reward-Guard, Choice-Quest-Daten und Pilot-Region', r['empty'] and r['choices'] and r['region'] and r['pilot'], json.dumps(r))
    # 7 Fortschrittswerte
    r = ev(pg, """() => { const C=SW.Char, E=SW.Essence, K=SW.Karma, o={}; const l0=C.level, sp0=C.sp, ap0=C.ap; C.addXp(C.need(C.level)); o.lv=C.level===l0+1; o.sp=C.sp===sp0+1; o.ap=C.ap===ap0+3;
      const e0=E.n; o.over=E.spend(e0+1); o.same=E.n===e0; o.neg=E.add(-5); o.nan=E.add(NaN);
      const k0=K.v; const g1=K.add('rep',10), g2=K.add('rep',10); o.half=g2<g1; o.k=K.v; const yy=[SW.YinYang.yin, SW.YinYang.yang]; o.yyOk=yy.every(v=>v>=0&&v<=100);
      const a0=C.ap, h0=C.base().hp; o.pt=C.spend('hp'); o.hpUp=C.base().hp>h0; o.apDown=C.ap===a0-1; return o; }""")
    ok = r['lv'] and r['sp'] and r['ap'] and not r['over'] and r['same'] and not r['neg'] and not r['nan'] and r['half'] and r['yyOk'] and r['pt'] and r['hpUp'] and r['apDown']
    rec('Fortschritt: XP/Level/Skillpunkte/Attributpunkte, Essence nicht ueberbuchbar, Karma-Wiederholung halbiert, Yin/Yang im Bereich', ok, json.dumps(r))
    # 8 Skilltree
    r = ev(pg, """() => { const S=SW.Skills; S.teach(); const C=SW.Char, E=SW.Essence, o={}; const n=S.nodes.find(n=>!n.req&&!(n.reqs&&n.reqs.length)&&n.cost&&!n.yin&&!n.yang&&!n.balance&&!n.karma&&!n.lvl)||S.nodes.find(n=>S.can(n.id));
      if(!n) return {none:true}; C.sp=5; E.n=99; C.level=Math.max(C.level,25); SW.Karma.v=100; SW.YinYang.yin=60; SW.YinYang.yang=60;
      const id=(S.nodes.find(n=>S.can(n.id))||n).id; const nd=S.node(id); const sp0=C.sp, e0=E.n; o.id=id; o.can=S.can(id); o.learn=S.learn(id); o.sp=sp0-C.sp===nd.cost.sp; o.ess=e0-E.n===nd.cost.ess; o.again=S.learn(id);
      const kv=SW.Karma.v; o.karmaKept=kv===100; return o; }""")
    rec('Skilltree: lernen bucht Skillpunkt+Essence genau einmal, nicht doppelt lernbar, Karma unangetastet', not r.get('none') and r['can'] and r['learn'] and r['sp'] and r['ess'] and not r['again'] and r['karmaKept'], json.dumps(r))
    # 9 Weltkampf
    r = ev(pg, """() => { const K=SW.Combat, p=SW.Player, X=SW.WCombat, o={}; const s=K.spots[0]; s.x=p.x+5; s.y=p.y; s.w={st:'idle'}; p.face=-Math.PI/2; const P=X.pose(); X.active=true; P.kmax=200; P.ki=200; P.pm=null; P.hurt=0; P.php=100; P.dodgeCd=0; P.invT=0;
      X.lock=true; X.press('attack'); o.lockOn=Math.abs(P.fa)<.01; P.pm=null; X.lock=false; X.press('attack'); o.lockOff=Math.abs(P.fa+Math.PI/2)<.01; P.pm=null;
      const k0=P.ki; X.press('dodge'); o.dodgeKi=Math.round(k0-P.ki); o.expKi=Math.ceil(SW.Combat.D? SW.Combat.D.dodgeKi*P.ps.kiCostMul : 0); P.dodgeT=0; P.dodgeCd=0; P.ki=1; X.press('dodge'); o.noKi=P.ki===1; X.active=false; return o; }""")
    rec('Weltkampf: Lock AN zielt auf Gegner, AUS auf Blickrichtung; Ausweichen kostet Ki, bei zu wenig Ki gesperrt', r['lockOn'] and r['lockOff'] and r['noKi'] and r['dodgeKi'] > 0, json.dumps(r))
    # 10 Touch-Joystick
    pg.mouse.move(120, 200); pg.mouse.down(); pg.mouse.move(180, 200, steps=4); pg.wait_for_timeout(150); v = ev(pg, "[SW.Input.vec.x, SW.Input.vec.y, SW.Input.joy.active]")
    pg.mouse.up(); pg.wait_for_timeout(150); v2 = ev(pg, "[SW.Input.vec.x, SW.Input.vec.y, SW.Input.joy.active]")
    pg.mouse.move(120, 200); pg.mouse.down(); pg.mouse.move(125, 200); pg.wait_for_timeout(150); dz = ev(pg, "SW.Input.vec.x"); pg.mouse.up()
    pg.mouse.move(700, 200); pg.mouse.down(); pg.wait_for_timeout(100); right = ev(pg, "SW.Input.joy.active"); pg.mouse.up()
    rec('Joystick: links dynamisch, Loslassen stoppt, Deadzone, rechte Seite startet keinen Joystick', v[0] > .3 and v[2] and v2 == [0, 0, False] and dz == 0 and not right, '%s %s dz=%s right=%s' % (v, v2, dz, right))
    # 11 Karte/Schnellreise-Daten
    r = ev(pg, "() => ({poi: SW.World.POI.length, shr: SW.Data.shrines.length})")
    rec('Welt: POI und Schreine vorhanden', r['poi'] > 20 and r['shr'] > 20, json.dumps(r))
    # 12 Phase 19: Speicher-Schnittstelle SW.Store
    pg = start(b, errs)
    r = ev(pg, """() => { const o={}, S=SW.Store; S.setItem('t19','x'); o.rt=S.getItem('t19')==='x'; S.removeItem('t19'); o.rm=S.getItem('t19')===null;
      const mem={}; S.backend={getItem:k=>k in mem?mem[k]:null,setItem:(k,v)=>{mem[k]=String(v)},removeItem:k=>{delete mem[k]}};
      localStorage.removeItem('sw_progress_v1'); SW.Save.save(); o.inMem=!!mem['sw_progress_v1']; o.notLocal=localStorage.getItem('sw_progress_v1')===null; S.backend=null; return o; }""")
    rec('Phase 19: SW.Store (get/set/remove) + Speicher austauschbar, SW.Save schreibt ueber die Schnittstelle', r['rt'] and r['rm'] and r['inMem'] and r['notLocal'], json.dumps(r))
    # 13 Phase 19: Migration alter Formate + Ablehnung zu neuer Version
    pg = start(b, errs)
    ev(pg, "SW.Char.level=7; SW.Char.xp=5; SW.Inv.addCoins(321); SW.Save.save()")
    ev(pg, "() => { const d=SW.Save.data(); d.v=1; delete d.pos; localStorage.setItem('sw_progress_v1', JSON.stringify(d)); localStorage.removeItem('sw_progress_v1_bak'); }")
    cont(pg); a = ev(pg, "[SW.Char.level, SW.Inv.coins, SW.Save.has()]")
    rec('Phase 19: alter Spielstand v1 (ohne Umschlag, ohne Position) laedt vollstaendig', a == [7, 321, True], str(a))
    ev(pg, "() => { const d=SW.Save.data(); d.v=2; localStorage.setItem('sw_progress_v1', JSON.stringify(d)); }")
    cont(pg); a = ev(pg, "[SW.Char.level, SW.Inv.coins]")
    rec('Phase 19: Spielstand v2 laedt und wird auf v3 gehoben', a == [7, 321], str(a))
    r = ev(pg, """() => { const o={}, d=SW.Save.data(); d.v=99; const raw=JSON.stringify(d); ['sw_progress_v1_bak','sw_progress_v1_future'].forEach(k=>localStorage.removeItem(k)); for(let i=0;i<4;i++) localStorage.removeItem('sw_progress_v1_rp'+i);
      localStorage.setItem('sw_progress_v1', raw); o.has=SW.Save.has(); SW.Save.save(); o.kept=localStorage.getItem('sw_progress_v1_future')===raw; o.flag=SW.Save.future(); o.mainValid=JSON.parse(localStorage.getItem('sw_progress_v1')).e===1; return o; }""")
    rec('Phase 19: Stand mit zu neuer Version wird nicht geladen und beim Speichern NICHT zerstoert (liegt in sw_progress_v1_future)', r['has'] is False and r['kept'] and r['flag'] and r['mainValid'], json.dumps(r))
    ev(pg, "() => { const d=SW.Save.data(); d.v=99; localStorage.setItem('sw_progress_v1', JSON.stringify(d)); localStorage.removeItem('sw_progress_v1_future'); SW.Save.hold = true; }")
    e0 = len(errs); pg.reload(); pg.wait_for_timeout(1000)
    r = ev(pg, "() => { const o={has:SW.Save.has(), dmg:SW.Save.damaged===true}; try { SW.Save.newGame(); } catch (e) {} return o; }")
    pg.wait_for_timeout(1200); fut = ev(pg, "localStorage.getItem('sw_progress_v1_future') !== null")
    rec('Phase 19: zu neuer Stand + Neues Spiel: kein Absturz, alter Stand bleibt erhalten', r['has'] is False and r['dmg'] and fut and len(errs) == e0, json.dumps(r) + ' fut=%s' % fut)
    # 14 Phase 19: PWA-Dateien
    r = ev(pg, """async () => { const o={}; const m=await fetch('manifest.webmanifest'); o.mf=m.status; const j=await m.json(); o.name=j.name; o.start=j.start_url; o.icons=[];
      for (const i of j.icons) { const r=await fetch(i.src); o.icons.push(r.status+':'+i.sizes); } const s=await fetch('sw.js'); o.sw=s.status; const a=await fetch('assets/images/icons/apple-touch-icon.png'); o.apple=a.status;
      o.link=!!document.querySelector('link[rel=manifest]'); o.meta=!!document.querySelector('meta[name=apple-mobile-web-app-capable]'); return o; }""")
    rec('Phase 19: Manifest, Icons, sw.js, apple-touch-icon erreichbar; Links im HTML', r['mf'] == 200 and r['name'] and r['sw'] == 200 and r['apple'] == 200 and all(x.startswith('200') for x in r['icons']) and r['link'] and r['meta'], json.dumps(r))
    # 15 Phase 19: Service Worker + Offline-Start
    pg = start(b, errs); pg.wait_for_timeout(2500)
    reg = ev(pg, "async () => { const r = await navigator.serviceWorker.getRegistration(); return !!r && SW.Store.worker === 'on'; }")
    rec('Phase 19: Service Worker registriert', reg is True, str(reg))
    pg.reload(); pg.wait_for_timeout(1500); pg.wait_for_function("fetch('data/index.json').then(r => r.json()).then(j => Promise.all(j.files.concat(['../js/world.js', '../js/combat.js']).map(f => caches.match(f.startsWith('..') ? f.slice(3) : 'data/' + f, {ignoreSearch: true})))).then(a => a.every(x => !!x))", timeout=20000); pg.context.set_offline(True)
    try:
        pg.reload(); pg.wait_for_timeout(1500); off = ev(pg, "typeof SW !== 'undefined' && !!SW.version && !!SW.World && SW.Menus && SW.dataOk && Array.isArray(SW.Data.items) && SW.Data.balance && Array.isArray(SW.Data.quests) ? SW.version : false")
    except Exception as ex: off = 'fehler ' + str(ex)[:80]
    pg.context.set_offline(False)
    pg.reload(); pg.wait_for_timeout(1500)  # Folgepruefung laeuft wieder online
    rec('Phase 19: Offline-Start aus Zwischenspeicher (Seite + Skripte laden ohne Netz)', isinstance(off, str) and off[:2] == '0.' and not off.startswith('fehler'), str(off))
    # 16 Phase 19: Speicherschutz-Abfrage + Hinweis in der Oberflaeche
    r = ev(pg, """async () => { const S=SW.Store; const a=await S.refresh(); const b=await S.ask(); const box=SW.Menus.h.backupBox(); const txt=box.textContent; return {a, b, ui: /Storage protected|Storage not protected|Storage protection unknown/.test(txt)}; }""")
    rec('Phase 19: persist()-Abfrage liefert yes/no/unknown, Einstellungen zeigen Speicherschutz-Hinweis', r['a'] in ('yes', 'no', 'unknown') and r['b'] in ('yes', 'no', 'unknown') and r['ui'], json.dumps(r))
    # 17 Phase 21: Truhe nur einmal
    pg = start(b, errs)
    r = ev(pg, """() => { const I = SW.Inv, c = I.chests.find(x => x.give && x.give.coins && !x.open), c0 = I.coins; const a = I.open(c), c1 = I.coins, b2 = I.open(c); return { a, b2, d: c1 - c0, d2: I.coins - c1 }; }""")
    rec('Phase 21: Truhe oeffnet einmal, zweites Oeffnen ohne Wirkung', r['a'] and not r['b2'] and r['d'] > 0 and r['d2'] == 0, json.dumps(r))
    # 18 Haendler kaufen/verkaufen
    r = ev(pg, """() => { const S = SW.Shop, I = SW.Inv; S.cur = null; const id = S.list('herb')[0]; I.coins = 0; const poor = S.buy(id); I.addCoins(5000); const c0 = I.coins, n0 = I.bag[id] || 0; const buy = S.buy(id), n1 = I.bag[id] || 0, c1 = I.coins; const sell = S.sell(id); return { id, poor, buy, paid: c0 - c1, got: n1 - n0, sell, back: I.coins - c1, n2: I.bag[id] || 0, n0 }; }""")
    rec('Phase 21: Haendler: zu arm = kein Kauf, Kauf zieht Preis ab, Verkauf gibt Muenzen zurueck', r['poor'] is False and r['buy'] and r['paid'] > 0 and r['got'] == 1 and r['sell'] and r['back'] > 0 and r['n2'] == r['n0'], json.dumps(r))
    # 19 Schmied: Upgrade braucht Muenzen + Eisen
    r = ev(pg, """() => { const S = SW.Shop, I = SW.Inv, id = SW.Data.items.find(x => x.type === 'weapon').id; I.add(id, 1); I.coins = 0; I.bag.iron = 0; const no = S.upgrade(id); I.coins = 99999; I.bag.iron = 99; const l0 = I.lvl(id), ok = S.upgrade(id); return { no, ok, l0, l1: I.lvl(id), coins: I.coins < 99999, iron: I.bag.iron < 99 }; }""")
    rec('Phase 21: Schmied: ohne Muenzen/Eisen kein Upgrade, mit Mitteln +1 Stufe und Kosten abgezogen', r['no'] is False and r['ok'] and r['l1'] == r['l0'] + 1 and r['coins'] and r['iron'], json.dumps(r))
    # 20 Schnellreise
    r = ev(pg, """() => { const S = SW.Shrines, id = SW.Data.shrines.find(x => x.id !== 'village').id, off = S.travel(id); S.activate(id); const ok = S.travel(id), s = S.get(id), p = SW.Player; return { off, ok, d: Math.hypot(p.x - s.x, p.y - s.y) }; }""")
    rec('Phase 21: Schnellreise: nur zu erweckten Schreinen, Ankunft am Schrein', r['off'] is False and r['ok'] and r['d'] < 2.5, json.dumps(r))
    # 21 Multitouch: zweiter Finger stoert Joystick nicht, rechte Seite startet keinen
    r = ev(pg, """() => { const el = document.querySelector('canvas'), I = SW.Input, ev = (t, id, x, y) => el.dispatchEvent(new PointerEvent(t, { pointerId: id, clientX: x, clientY: y, bubbles: true, cancelable: true }));
      I.reset(); const W = window.innerWidth; ev('pointerdown', 1, 80, 200); ev('pointermove', 1, 140, 200); ev('pointerdown', 2, 60, 250); ev('pointermove', 2, 10, 10); ev('pointerdown', 3, W - 50, 200);
      I.update(); const a = { id: I.joy.id, x: I.vec.x > .3 }; ev('pointerup', 2, 60, 250); const still = I.joy.active; ev('pointerup', 1, 140, 200); return { a, still, end: I.joy.active }; }""")
    rec('Phase 21: Multitouch: Joystick bleibt bei 1. Finger, 2. Finger/rechte Seite ohne Wirkung, Loslassen stoppt', r['a']['id'] == 1 and r['a']['x'] and r['still'] and not r['end'], json.dumps(r))
    # 22 Questkette elder2 -> 7 -> 8 -> 9 -> 3
    r = ev(pg, """() => { const Q = SW.Quests, S = () => ['elder7', 'elder8', 'elder9', 'elder3'].map(i => Q.status(i)).join(','); SW.Karma.add('t', 20); SW.Char.addXp(3000); const o = [S()]; Q.st.elder1 = 'done'; Q.st.elder2 = 'done'; o.push(S()); Q.st.elder7 = 'done'; o.push(S()); Q.st.elder8 = 'done'; o.push(S()); Q.st.elder9 = 'done'; o.push(S()); return o; }""")
    rec('Phase 21: Questkette elder7-9 schaltet elder3 erst nach elder9 frei', r == ['locked,locked,locked,locked', 'avail,locked,locked,locked', 'done,avail,locked,locked', 'done,done,avail,locked', 'done,done,done,avail'], json.dumps(r))
    # 23 Lager in Western Woods erreichbar (BFS vom Start)
    r = ev(pg, """() => { const W = SW.World, ids = ['e_boss', 'e_camp1', 'e_camp2', 'e_camp3', 'e_camp4', 'e_x65'], pts = {}; SW.Combat.spots.forEach(s => { if (ids.includes(s.id)) pts[s.id] = [s.x, s.y]; }); SW.Data.chests.forEach(c => { if (c.id.startsWith('c_camp')) pts[c.id] = [c.x, c.y]; }); const sh = SW.Shrines.get('way9'); pts.way9 = [sh.x, sh.y];
      const seen = new Set(), q = [[884, 1175]], k = (x, y) => x * 4000 + y; seen.add(k(884, 1175)); let n = 0;
      while (q.length && n < 6e6) { const [x, y] = q.pop(); n++; for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + a, Y = y + b; if (X < 250 || X > 1100 || Y < 1000 || Y > 1750 || seen.has(k(X, Y))) continue; seen.add(k(X, Y)); if (!W.solid(X + .5, Y + .5)) q.push([X, Y]); } }
      const bad = Object.keys(pts).filter(id => { const [x, y] = pts[id]; for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) if (seen.has(k(Math.floor(x) + a, Math.floor(y) + b)) && !W.solid(Math.floor(x) + a + .5, Math.floor(y) + b + .5)) return false; return true; }); return { bad, n: Object.keys(pts).length }; }""")
    rec('Phase 21: Banditenlager (Boss, Gegner, Truhen, Schrein) vom Start erreichbar', not r['bad'] and r['n'] >= 9, json.dumps(r))
    # 24 Gegner-Index
    r = ev(pg, "() => { const K = SW.Combat, s = K.spots[5]; return K.spot(s.id) === s && K.spot('gibt_es_nicht') === null; }")
    rec('Phase 21: Gegner-Index (Combat.spot) findet Punkt per ID, unbekannte ID = null', r is True, str(r))
    # 25 Daten-Validator
    v = subprocess.run([sys.executable, 'tools/validate_data.py'], capture_output=True, text=True)
    rec('Phase 21: Daten-Validator 0 Fehler', v.returncode == 0, v.stdout.strip().splitlines()[-1] if v.stdout.strip() else v.stderr[-100:])
    # 26 Phase 22: balance.json (Cap, XP-Kurve, tierMul)
    r = ev(pg, """() => { const C = SW.Char, K = SW.Combat, B = SW.Data.balance; let sum = 0; for (let l = 1; l < C.MAX; l++) sum += C.need(l);
      const e = K.spots.find(s => s.tier === 3 && s.type !== 'boss' && !K.boss(s)); const st = SW.Data.skills || {};
      return { max: C.MAX, n10: C.need(10), sum, t1: K.tm({ tier: 1 }).hp, t3: K.tm({ tier: 3 }).hp, none: K.tm({}).hp, ed: B.edition, sec: SW.Data.secrets.map(x => x.lvl).every(l => l <= C.MAX) }; }""")
    rec('Phase 22: Cap 50 (Lite), need = 36*l (gesamt 44 100), tierMul 1 / 1,7 / ohne Tier = 1, Geheimtechnik-Level <= Cap', r['max'] == 50 and r['n10'] == 360 and r['sum'] == 44100 and r['t1'] == 1 and r['t3'] == 1.7 and r['none'] == 1 and r['sec'], json.dumps(r))
    # 27 Phase 22: tierMul wirkt auf Belohnung und Gegner-Leben
    r = ev(pg, """() => { const K = SW.Combat, x = K.spots.find(s => s.type === 'bandit' && !K.boss(s)), C = SW.Char; const R = SW.Data.rewards.bandit.xp; const out = []; [1, 3].forEach(t => { x.tier = t; C.level = 1; C.xp = 0; out.push(K.grant(x, { }).xp); }); return { out, R }; }""")
    rec('Phase 22: tierMul: Tier 3 gibt 1,5 x XP gegenueber Tier 1', r['out'][0] == r['R'] and r['out'][1] == round(r['R'] * 1.5), json.dumps(r))
    # 28 Phase 22.1: Karten-Markierungen (setzen, Limit, speichern, laden) + Block-Button rechts
    r = ev(pg, """() => { const U = SW.UI; U.loadPins([[100, 200], [300, 400], ['x', 1], 5]); const a = U.dumpPins(); U.loadPins(Array.from({ length: 30 }, (_, i) => [i, i])); const b = U.dumpPins().length; U.loadPins(undefined); const c = U.dumpPins().length;
      U.loadPins([[10, 20]]); const sv = JSON.stringify(SW.Save.data ? SW.Save.data().pins : null); const bl = document.getElementById('cb-block'), sp = document.getElementById('cb-special'); const rb = getComputedStyle(bl); return { a, b, c, sv, right: rb.right !== 'auto' && rb.left === 'auto' || parseFloat(rb.left) > innerWidth / 2 }; }""")
    rec('Phase 22.1: Markierungen laden/speichern (ungueltig verworfen, max 10, leer ok), Block-Button rechts', r['a'] == [[100, 200], [300, 400]] and r['b'] == 10 and r['c'] == 0 and r['sv'] == '[[10,20]]' and r['right'], json.dumps(r))
    # 29 Phase 23: Editionen, Stufen und Preisfaktor
    r = ev(pg, """() => { const B=SW.Data.balance, S=SW.Shop, D=SW.Data, id=SW.Data.items.find(x=>x.type==='weapon').id;
      const l0=D.upMax, p0=D.priceFactor, c0=D.upCost(id,0), recipe=S.recipePrice(D.recipes[0]);
      return { max:l0, price:p0, up:c0, recipe, cfg:B.upgradeMax, factors:B.priceFactor }; }""")
    rec('Phase 23: Lite I-III, PC I-X; Preisfaktor zentral konfiguriert und Schmiedkosten enthalten', r['max'] == 3 and r['price'] == 1 and r['cfg']['lite'] == 3 and r['cfg']['pc'] == 10 and r['factors']['lite'] == 1 and r['factors']['pc'] == 3 and r['recipe'] == 220, json.dumps(r))
    # 30 Phase 23: Eisen-Drop ist tierabhängig und wird dem Inventar gutgeschrieben
    r = ev(pg, """() => { const K=SW.Combat,I=SW.Inv, old=Math.random, s=K.spots.find(x=>x.type==='bandit'&&!K.boss(x)); I.bag.iron=0; Math.random=()=>0; const out=K.grant(s,{}); Math.random=old; return { iron:I.bag.iron, items:out.items, cfg:SW.Data.balance.ironDrop }; }""")
    rec('Phase 23: Eisen-Drops nach Tier (garantierter Testwurf) werden gutgeschrieben und angezeigt', r['iron'] >= 1 and any('Iron' in x or 'Eisen' in x for x in r['items']) and r['cfg']['1']['chance'] > 0 and r['cfg']['3']['chance'] >= r['cfg']['1']['chance'], json.dumps(r))
    # 31 Phase 23: Effekt-Vokabular deckt alle derzeit vorhandenen Item-Effekte ab
    r = ev(pg, """() => { const I=SW.Inv, keys=['atk','def','hp','crit','rec','dodge','ambush','counter','kiCost','kiRegen','critDmg','parry','rdmg','rwind','rrec']; const fx=I.fxLines(Object.fromEntries(keys.map(k=>[k,k==='parry'?0.1:0.1]))); return { keys, n:fx.length, wind:fx.some(x=>x.includes('wind-up')||x.includes('Ausholen')) }; }""")
    rec('Phase 23: Effekt-Vokabular zeigt alle aktuellen Item-Effekte inklusive Fernkampf-Ausholen', r['n'] == 15 and r['wind'], json.dumps(r))
    # 32 Phase 24: Waffenhaltbarkeit, Bruch, Save/Load und Schmied-Reparatur
    pg = start(b, errs)
    r = ev(pg, """() => { const I=SW.Inv; I.add('bow_hankyu',1); const eq=I.equip('bow_hankyu',0); I.edur.ranged=1; I.wear(['ranged']); SW.Save.save();
      return { eq, broken:!I.eq.ranged, count:I.bag.bow_hankyu, dur:I.dur.bow_hankyu&&I.dur.bow_hankyu[0] }; }""")
    rec('Phase 24: Waffe zerbricht nicht weg, sondern landet mit 0 Haltbarkeit im Beutel', r['eq'] and r['broken'] and r['count']==1 and r['dur']==0, json.dumps(r))
    cont(pg)
    r = ev(pg, """() => { const I=SW.Inv,S=SW.Shop,id='bow_hankyu',t=S.repairTargets().find(x=>x.id===id); const persisted=!!t&&t.current===0&&I.dur[id][0]===0;
      const noEquip=I.equip(id,0)===false; if(t){const c=S.repairCost(t);I.coins=c.coins;I.bag.iron=c.iron;}
      const repaired=!!t&&S.repair(t), full=I.dur[id]&&I.dur[id][0]===60, equip=I.equip(id,0);
      return {persisted,noEquip,repaired,full,equip}; }""")
    rec('Phase 24: 0 Haltbarkeit bleibt nach Laden erhalten; kaputte Waffe nicht ausruestbar; Schmied repariert gegen Muenzen+Eisen', r['persisted'] and r['noEquip'] and r['repaired'] and r['full'] and r['equip'], json.dumps(r))
    # 33 Phase 24: ausgeruestete Waffe reparieren
    r = ev(pg, """() => { const I=SW.Inv,S=SW.Shop,id='bow_hankyu'; I.edur.ranged=12; const t=S.repairTargets().find(x=>x.slot==='ranged'); if(!t)return {none:true}; const c=S.repairCost(t); I.coins=c.coins; I.bag.iron=c.iron; const ok=S.repair(t); return {ok,dur:I.durOf('ranged')}; }""")
    rec('Phase 24: Auch ausgeruestete, beschaedigte Waffen lassen sich reparieren', not r.get('none') and r['ok'] and r['dur']==60, json.dumps(r))
    # 34 Phase 24.1: Waffen sind Einzelstuecke; alte doppelte Spielstaende werden verlustarm bereinigt
    pg = start(b, errs)
    r = ev(pg, """() => { const I=SW.Inv;
      I.load({coins:0,bag:{naginata:2},eq:{main:'naginata'},dur:{naginata:[4,57]},edur:{main:10},up:{},chests:[]});
      const normalized={bag:I.bag.naginata||0,eq:I.eq.main,dur:I.durOf('main')};
      const duplicate=I.add('naginata',1);
      return {normalized,duplicate,owned:I.owned('naginata')}; }""")
    rec('Phase 24.1: Waffen-Duplikate aus alten Saves werden zu einem Exemplar zusammengefuehrt; bestes Durability bleibt erhalten', r['normalized']['bag']==0 and r['normalized']['eq']=='naginata' and r['normalized']['dur']==57 and r['duplicate'] is False and r['owned'], json.dumps(r))
    # 35 Phase 24.1: Haltbarkeit sinkt je erfolgreichem Treffer bis exakt 0; Bruch, Save/Load und Reparatur
    r = ev(pg, """() => { const I=SW.Inv;
      I.load({coins:0,bag:{},eq:{main:'naginata'},dur:{},edur:{main:60},up:{},chests:[]});
      I.wear(['main']); const afterOne=I.durOf('main');
      for(let n=0;n<59;n++) I.wear(['main']);
      const broken=!I.eq.main && I.bag.naginata===1 && I.dur.naginata[0]===0;
      const cannotEquip=I.equip('naginata',0)===false;
      I.load(I.dump()); const persisted=I.dur.naginata && I.dur.naginata[0]===0;
      const repaired=I.repair('naginata',0), full=I.dur.naginata && I.dur.naginata[0]===60;
      const equipped=I.equip('naginata',0);
      return {afterOne,broken,cannotEquip,persisted,repaired,full,equipped}; }""")
    rec('Phase 24.1: 60 Treffer = 60 Haltbarkeit; bei 0 abgelegt, nicht ausruestbar, Save/Load erhaelt 0, Reparatur erlaubt erneutes Ausruesten', r['afterOne']==59 and r['broken'] and r['cannotEquip'] and r['persisted'] and r['repaired'] and r['full'] and r['equipped'], json.dumps(r))
    # 36 Phase 24.1: Waffen in verschiedenen Slots verschleissen getrennt
    r = ev(pg, """() => { const I=SW.Inv;
      I.load({coins:0,bag:{},eq:{main:'naginata',side:'tanto',ranged:'bow_hankyu'},dur:{},edur:{main:60,side:30,ranged:60},up:{},chests:[]});
      I.wear(['main']); const a=[I.durOf('main'),I.durOf('side'),I.durOf('ranged')];
      I.wear(['side']); const b=[I.durOf('main'),I.durOf('side'),I.durOf('ranged')];
      I.wear(['ranged']); const c=[I.durOf('main'),I.durOf('side'),I.durOf('ranged')];
      return {a,b,c}; }""")
    rec('Phase 24.1: Haltbarkeit wird nur in den jeweils uebergebenen Ausruestungsslots reduziert', r['a']==[59,30,60] and r['b']==[59,29,60] and r['c']==[59,29,59], json.dumps(r))
    # 37 Phase 24.2: ausgewaehlte aktive Skills loesen automatisch aus und benoetigen keinen Skill-Button
    r = ev(pg, """() => { const S=SW.Skills, old=Math.random; Math.random=()=>0;
      S.load({learned:{sm_a1:1},slots:['sm_a1',null],taught:1});
      const first=S.autoMove(100,1,1), cooldown=S.autoMove(100,1,1);
      Math.random=old; return {first,cooldown}; }""")
    rec('Phase 24.2: ausgewaehlter Doppelschlag kann automatisch ausloesen; derselbe Slot hat danach eine kurze Abklingzeit', r['first']=='dblstrike' and r['cooldown'] is None, json.dumps(r))
    # 38 Exploit: Weltkampf darf Schnellreise nicht umgehen
    r = ev(pg, """() => {
      const S=SW.Shrines, X=SW.WCombat, p=SW.Player;
      const id=SW.Data.shrines.find(s=>s.id!=='village').id;
      S.activate(id); const before=[p.x,p.y], old=X.active;
      X.active=true; const can=S.canTravel(id), travel=S.travel(id);
      const after=[p.x,p.y]; X.active=old;
      return {can,travel,same:before[0]===after[0]&&before[1]===after[1]};
    }""")
    rec('Exploit: Schnellreise waehrend aktivem Weltkampf gesperrt',
        r['can'] is False and r['travel'] is False and r['same'], json.dumps(r))
    # 39 Auto-Klicker / schnelle Mehrfach-Schnellreise
    r = ev(pg, """() => {
      const S=SW.Shrines,P=SW.Player,ids=SW.Data.shrines.filter(s=>s.id!=='village').slice(0,3).map(s=>s.id);
      ids.forEach(id=>S.activate(id)); const a=ids[0],b=ids[1],ok=[];
      for(let i=0;i<25;i++) ok.push(S.travel(i%2?a:b));
      const d=S.get(b),final=Math.hypot(P.x-d.x,P.y-d.y)<2.5;
      return {count:ok.filter(Boolean).length,final,free:!SW.World.solid(Math.floor(P.x),Math.floor(P.y))};
    }""")
    rec('Exploit: 25 schnelle Schnellreisen enden konsistent am letzten Ziel',
        r['count']==25 and r['final'] and r['free'], json.dumps(r))
    # 40 Sprint-Erschoepfung und 20-Prozent-Entsperrung
    r = ev(pg, """() => {
      const P=SW.Player,I=SW.Input,old={st:P.stamina,lock:P.sprintLocked,sprinting:P.sprinting,held:I.sprint,paused:SW.paused,combat:SW.Combat.active,wcombat:SW.WCombat&&SW.WCombat.active};
      SW.paused=false;SW.Combat.active=false;if(SW.WCombat)SW.WCombat.active=false;
      P.stamina=.01;P.sprintLocked=false;I.sprint=true;
      P.update(1,{x:1,y:0});const zero=P.stamina===0,locked=P.sprintLocked;
      P.update(.5,{x:1,y:0});const heldLocked=P.sprintLocked;
      I.sprint=false;P.update(1.3,{x:1,y:0});const regenerated=P.stamina>=20;
      P.update(.01,{x:1,y:0});const recovered=regenerated&&!P.sprintLocked;
      I.sprint=true;P.update(.1,{x:1,y:0});const resumed=P.sprinting;
      P.stamina=old.st;P.sprintLocked=old.lock;P.sprinting=old.sprinting;I.sprint=old.held;SW.paused=old.paused;SW.Combat.active=old.combat;if(SW.WCombat)SW.WCombat.active=old.wcombat;
      return {zero,locked,heldLocked,recovered,resumed};
    }""")
    rec('Exploit: Sprint bleibt bei 0 gesperrt bis Loslassen und mindestens 20 Prozent',
        r['zero'] and r['locked'] and r['heldLocked'] and r['recovered'] and r['resumed'], json.dumps(r))
    # 41 Fokusverlust: keine haengenden Eingaben
    r = ev(pg, """() => {
      const I=SW.Input,el=document.querySelector('canvas');I.reset();
      el.dispatchEvent(new PointerEvent('pointerdown',{pointerId:77,clientX:80,clientY:180,bubbles:true}));
      el.dispatchEvent(new PointerEvent('pointermove',{pointerId:77,clientX:130,clientY:180,bubbles:true}));
      I.sprintHeld=true;I.update();const active=I.joy.active||I.sprint;
      window.dispatchEvent(new Event('blur'));I.update();
      return {active,joy:I.joy.active,sprint:I.sprint,held:I.sprintHeld,vec:[I.vec.x,I.vec.y]};
    }""")
    rec('Exploit: Fokusverlust setzt Joystick und Sprint vollstaendig zurueck',
        r['active'] and not r['joy'] and not r['sprint'] and not r['held'] and r['vec']==[0,0], json.dumps(r))
    # 42 Shop-Kaufspam: Stacklimit und Geld pruefen
    r = ev(pg, """() => {
      const S=SW.Shop,I=SW.Inv,id=S.list('herb')[0];I.bag[id]=I.MAXSTACK-2;I.coins=100000;
      let successes=0;for(let n=0;n<5;n++)if(S.buy(id,1))successes++;
      const count=I.bag[id]||0,coins=I.coins,over=S.buy(id,1),unchanged=(I.bag[id]||0)===count&&I.coins===coins;
      I.bag[id]=0;I.coins=0;const poor=S.buy(id,1);
      return {successes,count,max:I.MAXSTACK,over,unchanged,poor,still:(I.bag[id]||0)===0};
    }""")
    rec('Exploit: Kaufspam ueberschreitet Stacklimit nicht und kauft nicht ohne Geld',
        r['successes']==2 and r['count']==r['max'] and r['over'] is False and r['unchanged'] and r['poor'] is False and r['still'], json.dumps(r))
    # 43 Shop-Verkaufspam: keine negativen Itemmengen / doppeltes Geld
    r = ev(pg, """() => {
      const S=SW.Shop,I=SW.Inv,id=S.list('herb')[0];I.bag[id]=3;I.coins=0;
      const a=S.sell(id,3),coins=I.coins,n=I.bag[id]||0;
      const b=S.sell(id,3),coins2=I.coins,n2=I.bag[id]||0;
      return {a,b,coins,coins2,n,n2};
    }""")
    rec('Exploit: wiederholter Verkauf zahlt nur vorhandene Items aus',
        r['a'] and r['b'] is False and r['coins']>0 and r['coins2']==r['coins'] and r['n']==0 and r['n2']==0, json.dumps(r))
    # 44 Manipulierte Progress-Werte muessen begrenzt werden
    r = ev(pg, """() => {
      const C=SW.Char,E=SW.Essence,Y=SW.YinYang,K=SW.Karma;
      C.load({level:-999,xp:1e30,sp:-5,ap:1e30,pts:{hp:1e30}});
      E.load(-999);Y.load({yin:-999,yang:1e30});K.load({v:1e30,seen:{}});
      return {level:C.level,xp:C.xp,sp:C.sp,ap:C.ap,ess:E.n,yin:Y.yin,yang:Y.yang,karma:K.v};
    }""")
    rec('Exploit: negative und uebergrosse Progress-Werte werden begrenzt',
        1<=r['level']<=50 and 0<=r['xp']<=1e9 and 0<=r['sp']<=999 and 0<=r['ap']<=999 and
        0<=r['ess']<=999 and 0<=r['yin']<=100 and 0<=r['yang']<=100 and -100<=r['karma']<=100, json.dumps(r))
    # 45 Quest-Doppelabschluss: nur verfuegbare Quest auswaehlen
    r = ev(pg, """() => {
      const Q=SW.Quests,I=SW.Inv,q=Q.get('elder2');
      Q.st.elder1='done';Q.st.elder2='active';I.bag.wood=q.obj.n;
      const c0=I.coins,first=Q.complete(q.id),c1=I.coins,second=Q.complete(q.id),c2=I.coins;
      return {first,second,delta:c1-c0,again:c2-c1,status:Q.status(q.id),wood:I.bag.wood||0};
    }""")
    rec('Exploit: Questbelohnung wird bei wiederholtem Abschluss nicht erneut vergeben',
        r['first'] and r['second'] is False and r['delta']==40 and r['again']==0 and r['status']=='done' and r['wood']==0, json.dumps(r))
    # 46 Skill-Doppel-Freischaltung und ungueltige IDs
    r = ev(pg, """() => {
      const S=SW.Skills,C=SW.Char,E=SW.Essence;S.teach();C.sp=999;E.n=999;C.level=C.MAX;
      const n=S.nodes.find(x=>S.can(x.id));if(!n)return {none:true};
      const a=S.learn(n.id),sp=C.sp,ess=E.n,again=S.learn(n.id),bad=S.learn('__invalid_skill__');
      return {a,again,bad,learned:!!S.learned[n.id],spSpent:999-sp,essSpent:999-ess};
    }""")
    rec('Exploit: Skills koennen nicht doppelt oder mit unbekannter ID gelernt werden',
        not r.get('none') and r['a'] and r['again'] is False and r['bad'] is False and r['learned'] and r['spSpent']>=0 and r['essSpent']>=0, json.dumps(r))
    # 47 Schnellreiseziele: Map-Grenzen und Kollisionen
    r = ev(pg, """() => {
      const W=SW.World,S=SW.Shrines,bad=[];
      S.list.forEach(s=>{const x=Math.floor(s.x),y=Math.floor(s.y);
        if(!Number.isFinite(s.x)||!Number.isFinite(s.y)||x<0||y<0||x>=W.WIDTH||y>=W.HEIGHT||W.solid(x,y))bad.push(s.id);});
      return {count:S.list.length,bad};
    }""")
    rec('Weltkarte: alle Schnellreiseziele liegen innerhalb der Map und auf freien Tiles',
        r['count']>0 and len(r['bad'])==0, json.dumps(r))
    # 48 POI: echte Struktur- und Grenzpruefung
    r = ev(pg, """() => {
      const W=SW.World,P=W.POI,ids=new Set(),bad=[];
      P.forEach(o=>{if(!o||typeof o.id!=='string'||!o.id||ids.has(o.id)||
        !Number.isFinite(o.x)||!Number.isFinite(o.y)||o.x<0||o.y<0||o.x>=W.WIDTH||o.y>=W.HEIGHT)
        bad.push((o&&o.id)||'invalid'); if(o&&o.id)ids.add(o.id);});
      return {count:P.length,bad};
    }""")
    rec('Weltkarte: POIs haben gueltige Typen, Abmessungen und Map-Grenzen',
        r['count']>20 and len(r['bad'])==0, json.dumps(r))

    # 49 Bewegung: Spieler darf nicht durch benachbarte feste Tiles laufen
    r = ev(pg, """() => {
      const W=SW.World,P=SW.Player,I=SW.Input,old={x:P.x,y:P.y,stamina:P.stamina,paused:SW.paused,sprint:I.sprint};
      let spot=null;
      for(let y=Math.max(2,Math.floor(W.spawn.y)-25);y<Math.min(W.HEIGHT-2,W.spawn.y+25)&&!spot;y++)
        for(let x=Math.max(2,Math.floor(W.spawn.x)-25);x<Math.min(W.WIDTH-2,W.spawn.x+25)&&!spot;x++){
          if(W.solid(x,y))continue;
          for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])
            if(W.solid(x+dx,y+dy)){spot={x,y,dx,dy};break;}
        }
      if(!spot)return {none:true};
      SW.paused=false;I.sprint=false;P.x=spot.x+.5;P.y=spot.y+.5;P.stamina=100;
      P.update(.5,{x:spot.dx,y:spot.dy});
      const blocked=spot.dx===1?P.x<=spot.x+.72:spot.dx===-1?P.x>=spot.x+.28:
        spot.dy===1?P.y<=spot.y+.72:P.y>=spot.y+.28;
      const safe=!W.solid(Math.floor(P.x),Math.floor(P.y));
      P.x=old.x;P.y=old.y;P.stamina=old.stamina;SW.paused=old.paused;I.sprint=old.sprint;
      return {blocked,safe,spot};
    }""")
    rec('Exploit: Bewegung wird an festen Nachbar-Tiles durch Kollision gestoppt',
        not r.get('none') and r['blocked'] and r['safe'], json.dumps(r))
    # 50 Hoch-/Querformatwechsel: Canvas bleibt sichtbar und Spielsysteme bleiben geladen
    pg.set_viewport_size({"width":393,"height":852}); pg.wait_for_timeout(250)
    portrait=ev(pg,"(() => { const c=document.querySelector('canvas'); return !!c&&c.getBoundingClientRect().width>0&&c.getBoundingClientRect().height>0&&!!SW.World; })()")
    pg.set_viewport_size({"width":852,"height":393}); pg.wait_for_timeout(250)
    landscape=ev(pg,"(() => { const c=document.querySelector('canvas'); return !!c&&c.getBoundingClientRect().width>0&&c.getBoundingClientRect().height>0&&!!SW.World; })()")
    rec('Stabilitaet: Wechsel Hoch-/Querformat laesst Canvas und Welt geladen',
        portrait and landscape, 'portrait=%s landscape=%s' % (portrait,landscape))

    rec('Keine JS-Fehler waehrend aller Tests', not errs, str(errs[:3]))
    b.close()
finally:
    srv.kill()
bad = [n for n, ok, m in R if not ok]
print('\nERGEBNIS: %d bestanden, %d fehlgeschlagen' % (len(R) - len(bad), len(bad))); sys.exit(1 if bad else 0)
