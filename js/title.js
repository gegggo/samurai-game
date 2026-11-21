'use strict';
// Startbildschirm + Spielstandauswahl (Phase 6). Namensraum SW.Title. Schlicht und funktional; Gestaltung folgt in Phase 29.
// Fortsetzen / Spielstand laden (Tausch, nichts geht verloren) / Neues Spiel (mit Warnung) / Sprache.
SW.Title = (function () {
  const H = SW.Menus.h, el = H.el, add = H.add, btn = H.btn, T = (k, n) => SW.t(k, n), S = SW.Save, X = {};
  let root, body;
  const loc = () => SW.lang === 'de' ? 'de-DE' : 'en-GB';
  const date = ts => { if (!ts) return '–'; const d = new Date(ts); return d.toLocaleDateString(loc()) + ' ' + d.toLocaleTimeString(loc(), { hour: '2-digit', minute: '2-digit' }); };
  const dur = s => Math.floor(s / 3600) + ':' + String(Math.floor(s % 3600 / 60)).padStart(2, '0') + ' h';
  const label = s => s.main ? T('slot_main') : T('slot_rp', s.n);
  const close = () => { S.hold = false; root.classList.remove('open'); SW.paused = false; SW.Input.reset(); };
  const fill = (tpl, o) => tpl.replace(/\{(\w+)\}/g, (m, k) => o[k]);
  const row = (...c) => add(el('div', 'row'), ...c);
  function lang() { return row(...['en', 'de'].map(l => btn(T('lang_' + l), SW.lang === l ? 'on' : '', () => { SW.setLang(l); SW.UI.relabel(); main(); }))); }
  function confirm(text, yes, no) { body.innerHTML = ''; add(body, el('div', '', text), row(btn(T('ok'), 'on', yes), btn(T('set_wipe_no'), '', no))); }
  function list() {
    body.innerHTML = ''; add(body, el('h3', '', T('t_load')));
    S.slots().forEach(s => {
      const r = el('div', 'row card');
      add(r, el('b', '', label(s)), el('span', 'dim', s.ok ? T('lvl') + ' ' + s.lvl + ' · ' + dur(s.pt) + ' · ' + date(s.ts) + ' · ' + T('reg_' + s.reg) + ' · ' + s.shr + ' ' + T('t_shr') + ' · ' + s.def + ' ' + T('t_def') : T('t_damaged')));
      if (!s.main) add(r, btn(T('t_load'), 'pri', () => confirm(fill(T('t_load_ask'), { a: date(s.ts), b: dur(s.pt) }), () => S.restore(s.key), list), !s.ok));
      add(body, r);
    });
    add(body, row(btn(T('back'), '', main)));
  }
  function main() {
    body.innerHTML = ''; const has = S.has(), sl = S.slots(), m = sl.find(s => s.main && s.ok);
    add(body, el('h1', '', 'Samurai Wanderer'));
    if (S.damaged) add(body, el('div', 'no', T('t_broken')));
    if (m) add(body, el('div', 'dim', label(m) + ': ' + T('lvl') + ' ' + m.lvl + ' · ' + dur(m.pt) + ' · ' + date(m.ts)));
    add(body, row(btn(T('t_continue'), 'pri', close, !has)), row(btn(T('t_load'), '', list, sl.length < 1 || (sl.length === 1 && sl[0].main && !S.damaged))),
      row(btn(T('t_new'), '', () => { if (has) confirm(T('t_new_ask'), S.newGame, main); else close(); })), lang());
  }
  X.show = function () {
    if (!root) { root = el('div'); root.id = 'title'; body = el('div', 'pn'); add(root, body); document.body.appendChild(root); }
    S.hold = true; SW.paused = true; root.classList.add('open'); main();
  };
  return X;
})();
Object.assign(SW.TEXT.en, {
  t_continue: 'Continue', t_load: 'Load save', t_new: 'New game', t_damaged: 'Damaged', t_shr: 'shrines', t_def: 'foes defeated', ok: 'Yes', slot_main: 'Main save', slot_rp: 'Restore point {n}',
  t_load_ask: 'Load the save from {a} (play time {b})? Nothing is deleted: your current save takes the place of this one.',
  t_new_ask: 'Start a new game? Your current save becomes restore point 1. The oldest restore point is deleted.',
  t_broken: 'The main save is damaged. Choose a restore point or start a new game.'
});
