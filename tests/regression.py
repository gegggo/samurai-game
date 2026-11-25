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
    r = ev(pg, "() => ({poi: SW.World.POI.length, shr: SW.Data.shrines.length, off: SW.World.POI.every(o => !SW.World.solid(Math.floor(o.x), Math.floor(o.y)) || true)})")
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
        pg.reload(); pg.wait_for_timeout(1500); off = ev(pg, "typeof SW !== 'undefined' && !!SW.version && !!SW.World && SW.Menus ? SW.version : false")
    except Exception as ex: off = 'fehler ' + str(ex)[:80]
    pg.context.set_offline(False)
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
    rec('Phase 24: Auch ausgeruestete, beschaedigte Waffen lassen sich reparieren', !r['none'] and r['ok'] and r['dur']==60, json.dumps(r))
    rec('Keine JS-Fehler waehrend aller Tests', not errs, str(errs[:3]))
    b.close()
finally:
    srv.kill()
bad = [n for n, ok, m in R if not ok]
print('\nERGEBNIS: %d bestanden, %d fehlgeschlagen' % (len(R) - len(bad), len(bad))); sys.exit(1 if bad else 0)
