'use strict';
// Tag- und Nachtwechsel (Phase 5a). Namensraum SW.Time. Zeit läuft nur im freien Spiel (nicht im Menü/Kampf).
// Ein voller Tag = DAY Sekunden. Die Welt wird per Multiplikation eingefärbt (render.js), Lichter leuchten nachts.
SW.Time = (function () {
  const T = { DAY: 720, h: 8, per: '' };
  // Stunde -> Färbung (RGB, multipliziert mit der Szene). 255,255,255 = keine Änderung.
  const KEY = [[0, 70, 82, 150], [5, 78, 90, 155], [6.5, 255, 205, 170], [8, 255, 236, 212], [10, 255, 255, 255],
    [16, 255, 250, 236], [18.5, 255, 190, 150], [20.5, 120, 104, 156], [22, 72, 84, 150], [24, 70, 82, 150]];
  const NAMES = [[5, 'morning'], [10, 'noon'], [16, 'evening'], [21, 'night']];
  T.period = function () { const h = T.h; return h >= 21 || h < 5 ? 'night' : h >= 16 ? 'evening' : h >= 10 ? 'noon' : 'morning'; };
  T.tint = function () {
    const h = T.h; let i = 1; while (i < KEY.length - 1 && KEY[i][0] < h) i++;
    const a = KEY[i - 1], b = KEY[i], f = (h - a[0]) / (b[0] - a[0]);
    const r = Math.round(a[1] + (b[1] - a[1]) * f), g = Math.round(a[2] + (b[2] - a[2]) * f), bl = Math.round(a[3] + (b[3] - a[3]) * f);
    // lamp: 0 bei Tag, 1 bei tiefer Nacht (Stärke der Lichter)
    const lamp = Math.max(0, Math.min(1, (1 - (r + g + bl) / 765) * 2.6 - .25));
    return { css: 'rgb(' + r + ',' + g + ',' + bl + ')', on: r + g + bl < 750, lamp };
  };
  T.update = function (dt) {
    T.h = (T.h + dt * 24 / T.DAY) % 24;
    const p = T.period();
    if (p !== T.per) {
      const first = T.per === '';
      T.per = p;
      if (!first && SW.UI) SW.UI.banner(SW.t('time_' + p));
    }
  };
  T.clock = function () { const m = Math.floor(T.h * 60) % 1440, a = Math.floor(m / 60), b = m % 60; return (a < 10 ? '0' : '') + a + ':' + (b < 10 ? '0' : '') + b; };
  T.dump = () => ({ h: Math.round(T.h * 100) / 100 });
  T.load = function (d) { if (d && typeof d.h === 'number' && isFinite(d.h)) { T.h = ((d.h % 24) + 24) % 24; T.per = T.period(); } };
  T.per = T.period();
  Object.assign(SW.TEXT.en, { time_morning: 'Morning', time_noon: 'Midday', time_evening: 'Evening', time_night: 'Night' });
  return T;
})();
