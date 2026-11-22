'use strict';
// Phase 19 (0.18.0): Speicher-Schnittstelle (Spec 32.1) + App-Schicht (PWA).
// SW.Store: dünne, austauschbare Schicht über localStorage (gleiche Namen wie localStorage, wirft wie dieses). SW.Save nutzt nur noch sie.
// Andere Plattformen (Capacitor, Engine) setzen SW.Store.backend (Objekt mit getItem/setItem/removeItem) statt die Spiellogik zu ändern.
// PWA: Service Worker (sw.js, Netz zuerst, Zwischenspeicher nur als Rückfall) + navigator.storage.persist() (Browser soll Daten nicht löschen).
SW.Store = (function () {
  const S = { backend: null, state: 'unknown', standalone: false, worker: 'off' };
  S.getItem = k => (S.backend || localStorage).getItem(k);
  S.setItem = (k, v) => (S.backend || localStorage).setItem(k, v);
  S.removeItem = k => (S.backend || localStorage).removeItem(k);
  const nav = typeof navigator !== 'undefined' ? navigator : {};
  const set = v => { S.state = v ? 'yes' : 'no'; return S.state; };
  // Abfrage ohne Dialog: 'yes' | 'no' | 'unknown' (Browser kennt die Funktion nicht)
  S.refresh = () => nav.storage && nav.storage.persisted ? nav.storage.persisted().then(set, () => S.state) : Promise.resolve(S.state);
  // Bitte um dauerhaften Speicher (manche Browser fragen den Nutzer, Safari entscheidet selbst)
  S.ask = () => nav.storage && nav.storage.persist ? nav.storage.persist().then(set, () => S.state) : Promise.resolve(S.state);
  S.ios = /iPhone|iPad|iPod/.test(nav.userAgent || '') || (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1);
  try { S.standalone = !!(window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || nav.standalone === true; } catch (e) { /* egal */ }
  S.refresh();
  const once = () => { removeEventListener('pointerdown', once, true); removeEventListener('keydown', once, true); S.ask(); };
  addEventListener('pointerdown', once, true); addEventListener('keydown', once, true); // erst nach erster Eingabe (Safari verlangt Nutzeraktion)
  if ('serviceWorker' in nav && /^https?:$/.test(location.protocol)) {
    nav.serviceWorker.register('sw.js?v=' + SW.version).then(() => { S.worker = 'on'; }, () => { S.worker = 'fail'; });
  }
  return S;
})();
