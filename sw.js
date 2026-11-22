'use strict';
// Service Worker (Phase 19). Netz zuerst: online immer frische Dateien (kein veralteter Code); offline kommt der Zwischenspeicher.
// Version steht im Skript-Link (sw.js?v=...); neue Version = neuer Worker, alter Zwischenspeicher wird gelöscht. Spielstände liegen NICHT hier (localStorage).
const V = new URL(self.location.href).searchParams.get('v') || '0', C = 'sw-app-' + V;
self.addEventListener('install', e => {
  e.waitUntil((async () => { // Dateien aus index.html lesen und vorab sichern; fehlende Datei darf nicht abbrechen
    const c = await caches.open(C);
    try {
      const html = await (await fetch('index.html', { cache: 'no-cache' })).text(), urls = new Set(['./', 'index.html', 'manifest.webmanifest']);
      for (const m of html.matchAll(/(?:src|href)="([^"#]+)"|url\(([^)]+)\)/g)) { const u = (m[1] || m[2] || '').replace(/['"]/g, ''); if (u && !/^(https?:|data:|\/\/)/.test(u)) urls.add(u); }
      try { const ix = await (await fetch('data/index.json', { cache: 'no-cache' })).json(); urls.add('data/index.json'); ix.files.forEach(f => urls.add('data/' + f)); } catch (e2) { /* Datenliste fehlt: Laufzeit-Zwischenspeicher */ }
      await Promise.allSettled([...urls].map(u => c.add(u)));
    } catch (err) { /* offline beim Installieren: Laufzeit-Zwischenspeicher füllt sich später */ }
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('sw-app-') && k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== self.location.origin) return;
  e.respondWith(fetch(r).then(res => {
    if (res && res.ok && res.type === 'basic') { const cp = res.clone(); caches.open(C).then(c => c.put(r, cp)); }
    return res;
  }).catch(() => caches.match(r, { ignoreSearch: true }).then(m => m || (r.mode === 'navigate' ? caches.match('index.html', { ignoreSearch: true }) : Response.error()))));
});
