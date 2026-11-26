'use strict';
// Daten-Lader (Phase 20): liest data/*.json (Liste: data/index.json) synchron in SW.Data, bevor die Datenskripte laufen.
// Synchron mit Absicht: alle späteren Skripte lesen SW.Data beim Start.
// Offline-Fallback: erfolgreicher Download wird lokal zwischengespeichert, da synchrone XHR nicht zuverlässig vom Service Worker abgefangen werden.
(function () {
  SW.Data = SW.Data || {};
  const get = u => {
    const key = 'sw_data_cache_v1:' + u, x = new XMLHttpRequest();
    try {
      x.open('GET', u + '?v=' + SW.version, false);
      x.send();
      if (x.status === 200) {
        const raw = x.responseText, parsed = JSON.parse(raw);
        try { localStorage.setItem(key, raw); } catch (e) { /* Speicher kann voll oder gesperrt sein */ }
        return parsed;
      }
    } catch (e) { /* offline oder Netzwerkfehler: lokalen Datenstand versuchen */ }
    try {
      const cached = localStorage.getItem(key);
      if (cached) return JSON.parse(cached);
    } catch (e) { /* beschädigter Cache wird nicht verwendet */ }
    throw new Error(u + ' (offline/cache unavailable)');
  };
  try { get('data/index.json').files.forEach(f => Object.assign(SW.Data, get('data/' + f))); SW.dataOk = true; }
  catch (e) { SW.dataOk = false; SW.dataError = String(e && e.message || e); window.__e && window.__e.push('data: ' + SW.dataError); const l = document.getElementById('loading'); if (l) l.textContent = 'Data error: ' + SW.dataError; throw e; }
})();
