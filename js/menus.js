'use strict';
// Menüseiten (Phase 3): Character, Skills, Skilltree, Karma & Yin-Yang. Aufruf aus ui.js: SW.Menus[tab](panel).
SW.Menus = (function () {
  const M = {}, T = (k, n) => SW.t(k, n);
  let br = 'sm', sel = null, skillQuery = '', skillFilter = 'all', mapScale = 1, mapX = 0, mapY = 0;
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
  const add = (p, ...c) => { c.forEach(x => { if (x) p.appendChild(x); }); return p; };
  const refresh = () => SW.UI.refresh();
  const bar = (r, col) => { const b = el('div', 'bar'), i = el('i'); i.style.width = Math.max(0, Math.min(100, r * 100)) + '%'; i.style.background = col; return add(b, i); };
  const btn = (txt, cls, fn, off) => { const b = el('button', 'btn ' + (cls || ''), txt); b.disabled = !!off; b.onclick = fn; return b; };
  const reqRows = list => { const w = el('div', 'reqs'); list.forEach(r => add(w, el('div', r.ok ? 'ok' : 'no', (r.ok ? '✓ ' : '✗ ') + r.text))); return w; };
  const page = (p, title) => { const root = el('div', 'pn'); add(root, el('h3', '', title)); p.appendChild(root); return root; };

  M.character = function (p) {
    const C = SW.Char, b = C.base(), cs = C.combat(), root = page(p, T('tab_character'));
    add(root, add(el('div', 'row'), el('b', '', T('lvl') + ' ' + C.level),
      bar(C.level >= C.MAX ? 1 : C.xp / C.need(C.level), '#c8a24a'),
      el('span', 'chip', C.level >= C.MAX ? 'MAX' : C.xp + ' / ' + C.need(C.level) + ' XP')));
    add(root, add(el('div', 'row'), el('span', 'chip', T('sp') + ': ' + C.sp), el('span', 'chip', T('ap') + ': ' + C.ap)));
    const rows = [
      ['hp', T('st_hp'), Math.round(cs.hp)], ['ki', T('st_ki'), Math.round(cs.ki)], ['atk', T('st_atk'), '×' + cs.atk.toFixed(2)],
      ['def', T('st_def'), cs.def.toFixed(1)], ['end', T('st_end'), Math.round(b.end)], ['crit', T('st_crit'), (cs.crit * 100).toFixed(1) + '%']
    ];
    rows.forEach(r => {
      const row = el('div', 'row stat');
      add(row, el('span', 'lbl', r[1]), el('b', 'val', String(r[2])));
      add(row, btn('+', 'pri sq', () => { C.spend(r[0]); refresh(); }, C.ap < 1 || (r[0] === 'crit' && b.crit >= 40)));
      add(root, row);
    });
  };

  M.skills = function (p) {
    const S = SW.Skills, D = SW.Data, root = page(p, T('tab_skills'));
    const row = el('div', 'row');
    [0, 1].forEach(i => {
      const id = S.slots[i], box = el('button', 'btn slotbox', T('slot', i + 1) + ': ' + (id ? T('sk_' + id) : T('slot_empty')));
      box.onclick = () => { S.unequip(i); refresh(); };
      add(row, box);
    });
    add(root, row);
    const acts = S.nodes.filter(n => n.type === 'active' && S.learned[n.id]).map(n => n.id).concat(D.secrets.filter(s => S.sec[s.id] === 2).map(s => s.id), D.scrolls.filter(s => S.scr[s.id] === 2).map(s => s.id));
    if (!acts.length) add(root, el('div', 'dim', T('no_active')));
    acts.forEach(id => {
      const m = D.moves[S.moveOf(id)], line = el('div', 'row card');
      add(line, el('b', '', T('sk_' + id)), el('span', 'chip', T('ki_cost', Math.ceil(m.ki * SW.Char.combat().kiCostMul))));
      [0, 1].forEach(i => add(line, btn(T('slot', i + 1), S.slots[i] === id ? 'pri' : '', () => { S.equip(id, i); refresh(); })));
      add(root, line, el('div', 'dim', T('skd_' + id)));
    });
    const sec = S.secrets();
    if (sec.length) {
      add(root, el('h3', '', T('secret')));
      sec.forEach(s => {
        const st = S.sec[s.id], line = el('div', 'row card');
        add(line, el('b', '', T('sk_' + s.id)), el('span', 'chip', st === 2 ? T('st_active') : S.secReady(s.id) ? T('st_ready') : T('st_locked')));
        if (st === 1) add(line, btn(T('activate'), 'pri', () => { S.activate(s.id); refresh(); }, !S.secReady(s.id)));
        add(root, line, el('div', 'dim', T('skd_' + s.id)));
        if (st === 1) add(root, reqRows(S.secReqs(s.id)));
      });
    }
    add(root, el('h3', '', T('passive')));
    const ps = S.nodes.filter(n => n.type === 'passive' && S.learned[n.id]);
    if (!ps.length) add(root, el('div', 'dim', T('no_passive')));
    ps.forEach(n => add(root, el('div', 'card', T('sk_' + n.id) + ' – ' + T('skd_' + n.id))));
  };

  M.skilltree = function (p) {
    const S = SW.Skills, E = SW.Essence, root = page(p, T('tab_skilltree'));
    const head = el('div', 'row');
    add(head, el('span', 'chip', T('sp') + ': ' + SW.Char.sp), el('span', 'chip ess', T('ess') + ' ' + E.n));
    add(root, head);
    const brs = el('div', 'row skill-branches');
    SW.Data.branches.forEach(b => add(brs, btn(T('br_' + b), b === br ? 'pri' : '', () => { br = b; sel = null; refresh(); })));
    add(root, brs);
    const tools = el('div', 'row skill-tools'), search = el('input', 'skill-search');
    search.type = 'search'; search.placeholder = 'Fähigkeit suchen…'; search.value = skillQuery;
    search.oninput = () => {
      skillQuery = search.value.toLowerCase();
      viewport.querySelectorAll('.skill-node').forEach(b => { b.hidden = !(b.dataset.search || '').includes(skillQuery) && (skillFilter === 'all' || b.dataset.type === skillFilter); });
    };
    const filter = document.createElement('select'); filter.className = 'skill-filter';
    [['all','Alle'],['passive','Passiv'],['active','Aktiv'],['special','Spezial']].forEach(([v,t]) => { const o=document.createElement('option'); o.value=v; o.textContent=t; filter.appendChild(o); });
    filter.value = skillFilter; filter.onchange = () => { skillFilter = filter.value; refresh(); };
    add(tools, search, filter); add(root, tools);

    const viewport = el('div', 'skill-viewport'), canvas = el('div', 'skill-canvas');
    canvas.style.transform = `translate(${mapX}px,${mapY}px) scale(${mapScale})`;
    const matches = n => (!skillQuery || (n.name + ' ' + n.desc).toLowerCase().includes(skillQuery.toLowerCase())) &&
      (skillFilter === 'all' || n.type === skillFilter);
    const branchNodes = S.nodes.filter(n => n.br === br), specials = S.specials.filter(n => n.br === br);
    const selected = [...branchNodes, ...specials].find(n => n.id === sel);
    if (!selected) sel = (branchNodes.find(matches) || specials.find(matches) || branchNodes[0] || specials[0] || {}).id;
    const tree = el('div', 'skill-branch-tree');
    add(tree, el('h4','',T('br_'+br)));
    const lines = [];
    for (let line=1; line<=5; line++) {
      const row=el('div','skill-line');
      const nodes=branchNodes.filter(n=>n.type==='passive' && n.line===line).sort((a,b)=>a.rank-b.rank);
      nodes.forEach(n=>{
        const state=S.learned[n.id]?'done':S.can(n.id)?'av':'';
        const b=btn((S.learned[n.id]?'✓ ':'')+n.name,'skill-node '+state+(sel===n.id?' sel':''),()=>{sel=n.id;refresh();});
        b.title=n.desc; b.dataset.search=(n.name+' '+n.desc).toLowerCase(); b.dataset.type=n.type; b.hidden=!matches(n); add(row,b);
      });
      if(nodes.length) { lines.push(row); add(tree,row); }
    }
    const actives=branchNodes.filter(n=>n.type==='active');
    const activeRow=el('div','skill-line skill-active-line');
    actives.forEach(n=>{
      const state=S.learned[n.id]?'done':S.can(n.id)?'av':'';
      const b=btn((S.learned[n.id]?'✓ ':'')+n.name,'skill-node active-node '+state+(sel===n.id?' sel':''),()=>{sel=n.id;refresh();});
      b.title=n.desc; b.dataset.search=(n.name+' '+n.desc).toLowerCase(); b.dataset.type=n.type; b.hidden=!matches(n); add(activeRow,b);
    });
    add(tree,el('h4','','Aktive Techniken')); add(tree,activeRow);
    if (specials.length) {
      add(tree,el('h4','','Spezialfähigkeiten'));
      const sr=el('div','skill-line skill-special-line');
      specials.forEach(n=>{
        const state=S.specialLearned[n.id]?'done':S.canSpecial(n.id)?'av':'';
        const b=btn((S.specialLearned[n.id]?'✓ ':'')+n.name,'skill-node special-node '+state+(sel===n.id?' sel':''),()=>{sel=n.id;refresh();});
        b.title=n.desc; b.dataset.search=(n.name+' '+n.desc).toLowerCase(); b.dataset.type='special'; b.hidden=!matches({...n,type:'special'}); add(sr,b);
      });
      add(tree,sr);
    }
    add(canvas,tree); add(viewport,canvas); add(root,viewport);
    const links=(SW.Data.crossLinks||[]).filter(x=>x.from===br||x.to===br);
    if(links.length){const cross=el('div','skill-crosslinks');add(cross,el('b','','Verbindungen zu anderen Ästen:'));
      links.forEach(x=>add(cross,el('span','chip',T('br_'+(x.from===br?x.to:x.from))+' · '+x.label)));
      add(root,cross);
    }
    const detail=el('div','skill-detail');
    const n=[...branchNodes,...specials].find(x=>x.id===sel);
    if(n) {
      add(detail,el('h3','',n.name),el('div','dim',n.desc));
      if(n.type==='special') {
        const req=S.specialReqs(n.id);
        add(detail,el('span','chip','Spezialfähigkeit · '+(S.specialLearned[n.id]?'Freigeschaltet':'Gesperrt')));
        add(detail,el('div','dim','Freischaltung ist vorbereitet; der eigentliche Spezialeffekt wird später integriert.'));
        if(S.specialLearned[n.id]) add(detail,el('div','ok','✓ Freigeschaltet'));
        else add(detail,reqRows(req),btn('Freischalten','pri',()=>{S.unlockSpecial(n.id);refresh();},!S.canSpecial(n.id)));
      } else {
        add(detail,el('div','chip',n.type==='active'?'Aktive Technik':'Passive Fähigkeit'));
        if(n.type==='active') add(detail,el('div','dim','Grundgerüst: nutzt vorerst eine vorhandene Kampfaktion; individuelle Technik-Effekte folgen später.'));
        if(S.learned[n.id]) add(detail,el('div','ok','✓ '+T('learned')));
        else add(detail,reqRows(S.reqs(n.id)),btn(T('learn')+' · '+n.cost.sp+' SP / '+n.cost.ess+' Essence','pri',()=>{S.learn(n.id);refresh();},!S.can(n.id)));
      }
    }
    add(root,detail);
    add(root,btn(T('reset')+' ('+S.resetText()+')','',()=>{if(confirm(T('reset_ask'))){S.reset();refresh();}},!S.spent||!SW.Essence.has(S.resetCost())));

    // iPhone: ein Finger verschiebt, zwei Finger zoomen. Keine Abhängigkeit von Zusatzbibliotheken.
    const pts=new Map(); let start=null, pinch=0;
    const moveMap = () => {
      if(pts.size===1&&start){const a=[...pts.values()][0];mapX=start.ox+a.x-start.x;mapY=start.oy+a.y-start.y;}
      else if(pts.size===2){const a=[...pts.values()],d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);if(pinch>0)mapScale=Math.max(.65,Math.min(1.8,mapScale*d/pinch));pinch=d;}
      canvas.style.transform=`translate(${mapX}px,${mapY}px) scale(${mapScale})`;
    };
    // Touch separat behandeln, damit das Verschieben keine Node-Taps verschluckt.
    viewport.addEventListener('touchstart',e=>{
      pts.clear();Array.from(e.touches).forEach((t,i)=>pts.set(i,{x:t.clientX,y:t.clientY}));
      if(pts.size===1){const a=[...pts.values()][0];start={x:a.x,y:a.y,ox:mapX,oy:mapY};}
      if(pts.size===2){const a=[...pts.values()];pinch=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);start=null;}
    },{passive:false});
    viewport.addEventListener('touchmove',e=>{
      e.preventDefault();pts.clear();Array.from(e.touches).forEach((t,i)=>pts.set(i,{x:t.clientX,y:t.clientY}));moveMap();
    },{passive:false});
    const touchEnd=e=>{pts.clear();Array.from(e.touches).forEach((t,i)=>pts.set(i,{x:t.clientX,y:t.clientY}));pinch=0;start=null;if(pts.size===1){const a=[...pts.values()][0];start={x:a.x,y:a.y,ox:mapX,oy:mapY};}};
    viewport.addEventListener('touchend',touchEnd);viewport.addEventListener('touchcancel',touchEnd);
    viewport.onpointerdown=e=>{if(e.pointerType==='touch')return;pts.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pts.size===1)start={x:e.clientX,y:e.clientY,ox:mapX,oy:mapY};};
    viewport.onpointermove=e=>{if(e.pointerType==='touch'||!pts.has(e.pointerId))return;pts.set(e.pointerId,{x:e.clientX,y:e.clientY});moveMap();};
    const end=e=>{if(e.pointerType==='touch')return;pts.delete(e.pointerId);if(!pts.size)start=null;};
    viewport.onpointerup=end;viewport.onpointercancel=end;
  };

  M.karma = function (p) {
    const K = SW.Karma, Y = SW.YinYang, root = page(p, T('tab_karma'));
    add(root, add(el('div', 'row'), el('b', '', 'Karma'), bar((K.v + 100) / 200, K.v >= 0 ? '#6fbf73' : '#c8553c'),
      el('span', 'chip', Math.round(K.v) + ' · ' + T('kr_' + K.rank()))));
    add(root, el('div', 'dim', T('kr_hint')));
    add(root, add(el('div', 'row'), el('b', 'lbl', 'Yin'), bar(Y.yin / 100, '#6aa7e0'), el('span', 'chip', String(Math.round(Y.yin)))));
    add(root, add(el('div', 'row'), el('b', 'lbl', 'Yang'), bar(Y.yang / 100, '#e0703a'), el('span', 'chip', String(Math.round(Y.yang)))));
    add(root, el('div', 'dim', T('yy_hint')));
  };

  // Export/Import-Bereich (Einstellungen + Startbildschirm). done(): nach Abbruch zur Ausgangsansicht zurück.
  function backupBox(done) {
    const S = SW.Save, box = el('div', 'card'), msg = el('div', 'dim'), inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.json,application/json,text/plain'; inp.style.display = 'none';
    const lastD = () => { const t = S.lastExport(); return t ? new Date(t).toLocaleDateString(SW.lang === 'de' ? 'de-DE' : 'en-GB') : T('bk_never'); };
    const say = (k, cls) => { msg.className = cls || 'dim'; msg.textContent = T(k); };
    const dl = (text, name) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000); S.markExported(); say('bk_dl', 'ok'); };
    const doExport = () => {
      const text = S.exportText(); if (!text) return say('bk_none', 'no');
      const name = S.exportName();
      try {
        const f = new File([text], name, { type: 'application/json' });
        if (navigator.canShare && navigator.canShare({ files: [f] })) {
          navigator.share({ files: [f], title: 'Samurai Wanderer' }).then(() => { S.markExported(); say('bk_shared', 'ok'); }, e => { if (e && e.name === 'AbortError') say('bk_cancel'); else dl(text, name); });
          return;
        }
      } catch (e) { /* kein Teilen möglich */ }
      dl(text, name);
    };
    inp.onchange = () => {
      const f = inp.files && inp.files[0]; inp.value = ''; if (!f) return;
      if (f.size > 5e6) return say('bk_bad', 'no');
      const rd = new FileReader();
      rd.onerror = () => say('bk_bad', 'no');
      rd.onload = () => {
        const text = String(rd.result), r = S.inspect(text);
        if (!r.ok) return say(r.err === 'sum' ? 'bk_sum' : r.err === 'new' ? 'bk_new' : 'bk_bad', 'no');
        const i = r.info, d = new Date(i.ts), t = i.ts ? d.toLocaleDateString(SW.lang === 'de' ? 'de-DE' : 'en-GB') : '–';
        box.innerHTML = '';
        add(box, el('div', '', T('bk_ask').replace('{a}', t).replace('{b}', Math.floor(i.pt / 3600) + ':' + String(Math.floor(i.pt % 3600 / 60)).padStart(2, '0') + ' h').replace('{c}', i.lvl)),
          add(el('div', 'row'), btn(T('ok'), 'on', () => { if (!S.applyImport(text)) { build(); say('bk_fail', 'no'); } }), btn(T('set_wipe_no'), '', () => { build(); if (done) done(); })));
      };
      rd.readAsText(f);
    };
    function build() {
      box.innerHTML = '';
      add(box, el('b', '', T('bk_title')), el('div', 'dim', T('bk_hint') + ' ' + T('bk_last') + ': ' + lastD()), add(el('div', 'row'), btn(T('bk_export'), 'pri', doExport), btn(T('bk_import'), '', () => inp.click())), msg, inp);
      if (S.backupDue()) say('bk_due', 'no');
      const ST = SW.Store, pv = el('div', 'dim'); add(box, pv); // Phase 19: Speicherschutz-Hinweis
      const showPv = () => { pv.textContent = T('pv_' + ST.state) + (ST.ios && !ST.standalone ? ' ' + T('pv_ios') : ''); };
      showPv(); ST.refresh().then(showPv);
    }
    build(); return box;
  }

  M.settings = function (p) {
    const root = page(p, T('tab_settings')), row = el('div', 'row');
    add(root, el('b', '', T('set_lang')));
    ['en', 'de'].forEach(l => add(row, btn(T('lang_' + l), SW.lang === l ? 'on' : '', () => { SW.setLang(l); SW.UI.relabel(); refresh(); })));
    add(root, row);
    add(root, el('b', '', T('set_save')));
    const box = el('div', 'row'), ask = () => {
      box.innerHTML = '';
      add(box, el('span', '', T('set_wipe_ask')), btn(T('set_wipe_yes'), 'on', () => SW.Save.clear()), btn(T('set_wipe_no'), '', () => { box.innerHTML = ''; add(box, first); }));
    }, first = btn(T('set_wipe'), '', ask);
    add(box, first); add(root, box);
    add(root, backupBox());
  };

  M.h = { el, add, btn, page, refresh, backupBox };
  return M;
})();

Object.assign(SW.TEXT.en, {
  pv_yes: 'Storage protected: the browser keeps your save.', pv_no: 'Storage not protected: the browser may delete it. Add the game to your Home Screen and export regularly.', pv_unknown: 'Storage protection unknown. Export regularly.',
  pv_ios: 'Note: the Home Screen app has its own storage. Export in Safari first, then import in the app.',
  back: 'Back', bk_title: 'Backup', bk_hint: 'Export saves your progress as a file (Share menu → Save to Files). Do this regularly: the browser can delete local data.', bk_last: 'Last export', bk_never: 'never',
  bk_export: 'Export save', bk_import: 'Import save', bk_due: 'Time for a backup: please export your save.', bk_none: 'No valid save to export.',
  bk_shared: 'Save exported.', bk_dl: 'Save file downloaded.', bk_cancel: 'Export cancelled.', bk_bad: 'This is not a valid Samurai Wanderer save file.',
  bk_sum: 'The file is damaged (checksum wrong). Nothing was changed.', bk_new: 'The file comes from a newer game version. Nothing was changed.', bk_fail: 'Import failed. Nothing was changed.',
  bk_ask: 'Import the save from {a} (play time {b}, level {c})? Your current save becomes restore point 1. The oldest restore point is deleted.',
  st_hp: 'Life', st_ki: 'Ki', st_atk: 'Attack', st_def: 'Defense', st_end: 'Endurance', st_crit: 'Crit chance',
  kr_neutral: 'Neutral', kr_honored: 'Honored', kr_revered: 'Revered', kr_distrusted: 'Distrusted', kr_despised: 'Despised',
  kr_hint: 'Helping others and stopping bandits raises Karma. Repeating the same deed counts less each time.',
  yy_hint: 'Yang grows through heavy attacks and techniques. Yin grows through parries, dodges, blocks and standing calm in a fight. Each fight counts only a little. Spent when learning skilltree skills.'
});
