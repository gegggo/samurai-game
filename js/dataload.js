'use strict';
// Daten-Lader (Phase 20): liest data/*.json (Liste: data/index.json) synchron in SW.Data, bevor die Datenskripte laufen.
// Synchron mit Absicht: alle späteren Skripte lesen SW.Data beim Start; Dateien sind klein, gleiche Herkunft, Service Worker liefert sie offline.
// Fehler: Meldung im Ladebild statt stillem Absturz.
(function () {
  SW.Data = SW.Data || {};
  const get = u => { const x = new XMLHttpRequest(); x.open('GET', u + '?v=' + SW.version, false); x.send(); if (x.status !== 200 && x.status !== 0) throw new Error(u + ' (' + x.status + ')'); return JSON.parse(x.responseText); };
  try { get('data/index.json').files.forEach(f => Object.assign(SW.Data, get('data/' + f))); SW.dataOk = true; }
  catch (e) { SW.dataOk = false; SW.dataError = String(e && e.message || e); window.__e && window.__e.push('data: ' + SW.dataError); const l = document.getElementById('loading'); if (l) l.textContent = 'Data error: ' + SW.dataError; throw e; }
})();
