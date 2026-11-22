#!/usr/bin/env python3
"""Regressionstests (Spec 33.5) im headless Chromium 852x393. Aufruf (im Repo-Root): python3 tests/regression.py
Startet selbst einen lokalen Server. Ergebnis je Test: PASS / FAIL + Kurzergebnis. Kein Geraetetest."""
import subprocess, sys, time, json
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
    b = p.chromium.launch(); errs = []
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
    r = ev(pg, """() => { const S=SW.Skills, C=SW.Char, E=SW.Essence, o={}; const n=S.nodes.find(n=>!n.req&&!(n.reqs&&n.reqs.length)&&n.cost&&!n.yin&&!n.yang&&!n.balance&&!n.karma&&!n.lvl)||S.nodes.find(n=>S.can(n.id));
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
    pg.reload(); pg.wait_for_timeout(1500); pg.context.set_offline(True)
    try:
        pg.reload(); pg.wait_for_timeout(1500); off = ev(pg, "typeof SW !== 'undefined' && !!SW.version && !!SW.World && SW.Menus ? SW.version : false")
    except Exception as ex: off = 'fehler ' + str(ex)[:80]
    pg.context.set_offline(False)
    rec('Phase 19: Offline-Start aus Zwischenspeicher (Seite + Skripte laden ohne Netz)', off == '0.18.0', str(off))
    # 16 Phase 19: Speicherschutz-Abfrage + Hinweis in der Oberflaeche
    r = ev(pg, """async () => { const S=SW.Store; const a=await S.refresh(); const b=await S.ask(); const box=SW.Menus.h.backupBox(); const txt=box.textContent; return {a, b, ui: /Storage protected|Storage not protected|Storage protection unknown/.test(txt)}; }""")
    rec('Phase 19: persist()-Abfrage liefert yes/no/unknown, Einstellungen zeigen Speicherschutz-Hinweis', r['a'] in ('yes', 'no', 'unknown') and r['b'] in ('yes', 'no', 'unknown') and r['ui'], json.dumps(r))
    rec('Keine JS-Fehler waehrend aller Tests', not errs, str(errs[:3]))
    b.close()
finally:
    srv.kill()
bad = [n for n, ok, m in R if not ok]
print('\nERGEBNIS: %d bestanden, %d fehlgeschlagen' % (len(R) - len(bad), len(bad))); sys.exit(1 if bad else 0)
