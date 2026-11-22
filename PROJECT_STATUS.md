# PROJECT_STATUS (gekürzt, Stand 0.13.0, Cache v77)

**Repo:** `index.html` im Root, `css/main.css`, `js/*.js`, `assets/`, `docs/` (Spec). Ladereihenfolge in `index.html` (arena3d.js nach worldcombat.js, vor main.js). Spiel: Canvas 2D, keine Abhängigkeiten, GitHub Pages, iPhone Querformat.
**Aktuell:** 0.13.0 = Phase 11 + 13 (Dateien gesendet, Prüfung ausstehend, Gerätetest offen). Zuvor 0.12.4 (Breathe-Button entfernt). Zuvor 0.12.3 (Fix nach Gerätetest) = Phase 8 + 9A + 9B + 10. Dateien gesendet (2 Lieferungen), Browser-Tests bestanden (Details 0.12.0), **Gerätetest offen**. Gerätetests 0.10.x/0.11.0: laut Nutzer durchgeführt (ohne Protokoll).
**Arbeitsregeln:** nur freigegebene Phase; Dateien einzeln mit Repo-Pfad liefern; nichts als getestet melden, was nicht lief; Status nach jeder Lieferung aktualisieren.

## 0.13.0 – Phase 11 (Atem automatisch) + Phase 13 (A*)
- **Atem automatisch (Nutzerwunsch):** kein Button. `worldcombat.js`/`combat.js`: Atem = nicht blocken/angreifen/ausweichen/getroffen (Welt zusätzlich: nicht laufen); `arena3d.js`: zusätzlich Joystick in Ruhe. Ki-Regen +22*breathMul und Yin-Statistik wie zuvor. Skilltexte `sw4`/`km5` (`skills-data.js`, `lang-de.js`) und Yin-Hinweis (`menus.js`, `lang-de.js`) auf "ruhig stehen" umformuliert. **Balance-Platzhalter:** Ki-Regen im Stand jetzt immer aktiv -> evtl. zu stark, am Gerät prüfen.
- **A* für Welt-Gegner:** `worldcombat.js astar()` (Gitter um Start/Ziel, 8 Richtungen, keine Eckenschnitte, max 900 Knoten, Neuberechnung alle 0,6 s nur ohne Sichtlinie); kein Weg -> alter Umweg (0.12.0) bleibt Rückfall.
- **Geändert:** js/worldcombat.js, js/combat.js, js/arena3d.js, js/skills-data.js, js/lang-de.js, js/menus.js, js/config.js, index.html (v77), PROJECT_STATUS.md.
- **Getestet (tatsächlich):** node-Syntaxprüfung aller geänderten JS (ok); A* isoliert in node (Pfad um Wand mit Lücke gefunden, vollständig blockiert -> null, 200 Suchen = 118 ms). **Nicht getestet:** Spiel im Browser, Gegner im echten Spiel, Auto-Atem im Kampf, Arena, Gerät, Regression (Speichern/Quests/Inventar).
- **Nicht umgesetzt (Zeit):** Phase 12 Trainingsbereich, Phase 14 neue Region, Balancing-Durchgang.

## 0.12.4
- **Breathe-Button entfernt** (Nutzerwunsch): `js/combat.js` (Button-Liste), `css/main.css` (`#cb-breath`), `js/config.js` (Version), `index.html` (v76). Syntax `combat.js` geprüft (node); Gerätetest offen.
- **Bewusst belassen:** Atem-Logik (Taste B, Ki-Regen, Yin) und Skills `sw4`, `km5` (Atem-Bonus) -> auf Touch nicht mehr auslösbar. **Entscheidung offen:** Skills umbauen/entfernen.
- **Bekannt, vom Nutzer vorerst ignoriert:** schwarzes/blaues Bild und schwarzer Balken unten (iOS) treten weiter auf. Nutzer: alles andere getestet, Buttons, Gegner-Spawn, Laufen OK (Gerät).

## 0.12.3
- **Kampf-Layout nach Nutzerskizze:** Block (28 %) und Ausweichen darüber in der Zone rechts neben dem Joystick; Skill-Buttons darüber (21 %/+66 px, unter Minimap). Browser 852x393 gemessen/Screenshot, keine Überlappung. Hinweis: Buttons in der linken Hälfte schlucken dort den Joystick-Start (Joystick am linken Rand).
- **Schwarzer Streifen unten (iOS):** `main.js fitH`: prüft zusätzlich die echte Canvas-Höhe, Höhe bleibt im Querformat fest (kein Hin und Her). **Nicht auf dem Gerät geprüft** (Fehler im Browser nicht auslösbar). Workaround des Nutzers: Hochformat und zurück drehen.

## 0.12.2 – Fixes nach Gerätetest (iPhone)
- **Halber schwarzer Bildschirm + rotes/blaues Diagnosefeld:** Ursache laut Protokoll: Drehung ins Hochformat (`iw393x852`, `window.orientation` noch 90) wurde als "BAD" erkannt; Fix 2 erzwang Breite 852 -> Layouthöhe 1847 -> halber Bildschirm. `main.js`: `landscapeBroken` ignoriert Fenster höher als breit (Höhe >= 1,2x Breite); rotes (Vorsitzung) und blaues Diagnosefeld nicht mehr angezeigt (Protokoll bleibt in localStorage `sw_diag_bad`). Browser-Test: kein Fehlerfeld. **Auf dem iPhone nicht geprüft** (Fehler tritt nur beim Drehen/Screenshot auf).
- **Kampf-Layout:** Block/Ausweichen und Skill-Buttons ab 57 % Breite (rechte Mitte), linke Hälfte frei für den Joystick. Keine Überlappung (Browser 852x393 gemessen).
- **Tempo:** `worldcombat.js`: Angriff/Block bremsen das Laufen nicht mehr (nur Ausweichrolle 0, Treffer kurz 0,3).

## 0.12.0 – Phase 8, 9A, 9B (Dateien gesendet, Prüfung siehe unten)
- **Phase 8 (NPCs+Quests Regionen 12–16):** neu `js/regions-content.js` (Daten EN+DE): NPCs `n_trapper` (Frostpeaks), `n_pilgrim` (Ember), `n_nomad` (Dunes), `n_sailor` (Coast), `n_climber` (Karst); je 2 Quests (kill/shrine/have, `dunes2` mit Karma-Entscheidung), 4 Quest-Gegner `e_frostq/emberq/dunesq/coastq`. Werte Platzhalter.
- **Phase 9A (klein):** `worldcombat.js` `moveFoe`: Hindernisse umgehen (kein A*, Richtungssuche, Seite gemerkt); `X.swingQ()` + `render.js drawPlayer`: Schwert schwingt beim Weltangriff (Platzhalter, Phase 29 ersetzt).
- **Phase 9B (neue Region 17 Sakura Grove):** `js/layout-sakura.js` (Segment 3560–5000 x 1000–2000, erzeugt von `py/make_layout_sakura.py`), Landzunge + Brücke über Meerenge von Iron Peaks, Teich, Straßen. `world.js` (Biome, Strukturen Schrein/2 Hütten, POI, Zone), rosa Bäume (`render.js`), Kartenfarbe (`ui.js`), Arena (`combat-data.js`). Inhalte in `regions-content.js`: Schrein `sakura`, 3 Truhen, 4 Gegner (+2 Wächter auto), NPC `n_gardener`, Quests `sakura1/2`. Welt `CFG.W/H` unverändert (Meer rechts war frei).
- **Phase 10 (0.12.1, vom Nutzer freigegeben):** (1) `worldcombat.js playerHit`: Schlag trifft Zivilisten (sichtbare NPCs im Schlagbogen) = Karma -4 je NPC (Wiederholung halbiert via `Karma.add('hit_<id>')`), Meldung; (2) `village.js`: Peak Village (Häuser beschädigt bis `karst2`, Bewohner ab `karst1`) und Sakura (Hütten beschädigt bis `sakura2`, Bewohner ab `sakura1`), Karte im Quest-Menü; (3) `css/main.css`: Skill-Buttons `cb-s0/1` nach unten Mitte (58 %), Joystick-Zone links frei. Tests (Chromium): Stufen 0->1/2, Schäden, Bewohner, Karma -4 beim Treffen, Buttonposition 494–630 px (Joystick-Grenze 468 px), keine JS-Fehler. Nicht geprüft: Gerät, Button-Erreichbarkeit mit Daumen. Früher: Vorschläge: (1) negative Karma-Quellen (unschuldige NPCs angreifen) = neues System -> Freigabe nötig; (2) Dorf-Wiederaufbau für Peak Village/Sakura; (3) Trainingsbereich + Duell 33.6 (vom Nutzer zurückgestellt auf nach Polish).
- **Geänderte Dateien:** index.html (v72, 2 neue Skripte), js/config.js (0.12.0), js/world.js, js/render.js, js/ui.js, js/combat-data.js, js/worldcombat.js, NEU js/layout-sakura.js, NEU js/regions-content.js, NEU py/make_layout_sakura.py.
- **Lieferung 2 (ersetzt Lieferung 1 bei `js/worldcombat.js`):** Pfadfinden nachgebessert (Umweg bis Sichtlinie frei, `los()`); Lieferung-1-Version hing an Wänden.
- **Tests 0.12.0 (headless Chromium 852x393, tatsächlich ausgeführt):**
  - bestanden: Start ohne JS-Fehler (`__e` leer, 1x 404 Konsole: nur Favicon, nicht geprüft); alle 11 Sakura-Ziele (Schrein, NPC, 4 Gegner+2 Wächter, 3 Truhen) vom Brückenstart erreichbar (BFS Schritt 1), Brückenstart mit Lookout-Schrein verbunden; Quest-NPCs 12–16 und Quest-Gegner von ihrem Schrein aus erreichbar; Quest-Ablauf frost1/frost2/dunes1/dunes2 (annehmen, bereit, abschließen, keine doppelte Belohnung, Kräuter abgegeben, Karma-Entscheidung +6), Quest-Speichern/Laden; Texte EN+DE vollständig für alle neuen Quests/Rollen/Region; Schnellreise zum Sakura-Schrein; Karte zeigt Insel + Brücke (Screenshot); Dialog Gärtnerin; Schrein erwecken; Speichern/Laden (Karma, Essence, Münzen, Quest); Boss-Arena startet; Touch-Joystick (Start/Deadzone/Loslassen, rechte Seite löst keinen Joystick aus); Weltkampf-Buttons erscheinen; Strike per Touch löst Angriff aus; Pfadfinden: Gegner umgeht 3x5-Wand und erreicht den Spieler (~10 s, langsam); Schwertbogen-Zeichnen ohne Fehler.
  - Hinweis: Skill-Button `cb-s1` (links unten) liegt in der Joystick-Zone; Joystick-Start dort wird vom Button geschluckt (Verhalten unverändert, Design offen).
  - NICHT geprüft: echtes iPhone/Touch-Feeling, gleichzeitig Joystick + Angriff sauber (nur Angriff bestätigt), Wiederherstellungspunkte-Rotation/Import/Export diesmal nicht erneut, Gegnerdichte/Leistung Sakura, Balancing, Optik der Brücke vor Ort, Region 17 nachts, Kampf in Region 17 per Hand, Regionen 12–15 NPC-Optik.
- **Bekannt:** Gegner-Umweg kein echtes A* (große Felsen = Leine/Rückkehr); Karte: Landzunge nach Sakura schmal; Sakura-Schrein-Gebäude `shrine` nutzt Standardzeichnung.

## 0.11.0 – Phase B + Wächter
- **Wächter:** `combat.js`: jeder Schrein >= 2 Gegner in 22 Kacheln; fehlende als `g_<schrein>_<n>` (feste ID, einmalig, gespeichert). 214 Gegnerpunkte gesamt.
- **Boss-Arena:** `js/arena3d.js` (`SW.Arena`, neu geschrieben, da Datei aus abgebrochener Sitzung fehlte). Rund (Radius 9), Ego-Pseudo-3D, Lock-on, freie Bewegung (Joystick vor/zurück/kreisen), Ausweichrolle, Block/Parade, Moves/Spezial/Skill-Slots/Fernkampf, Boss-KI (annähern, kreisen, Vorwarnung, Weglaufen = Treffer geht ins Leere), Bossphasen, Belohnung via `K.grant` / `Trials.duelWon`. KEINE ▲■▼/Finten/Atem-Fokus (Nutzerentscheidung, weicht von Spec 33.6 ab). Simulation und Ansicht getrennt (`proj()`/`draw*`) für späteren 3D-Ausbau.
- **Eingriffe `combat.js`:** `K.start/update/draw` delegieren an Arena; Buttons routen; `K.gfx` exportiert Waffenzeichnung. Altes Duell bleibt als Rückfall.
- **Geprüft (headless Chromium 852x393):** Start ohne JS-Fehler; Schreine haben Gegner; Weltkampf am Schrein startet; Bosse boss/warden/monk gewonnen, oni verloren (Niederlage ok); Neuladen behält besiegte Bosse; Schrein-Duell (elite): 0 Münzen, 80 XP; Playwright-Touch auf Strike löst Angriff aus.
- **NICHT geprüft:** echtes iPhone (Touch, Joystick in Arena), Balancing, Optik/Größe, Gegnerdichte/Gefühl.
- **Bekannt:** kein Near-Clipping der Wandsegmente; Boss-Mini-Lebensbalken doppelt zur HUD; Welt-Gegner ohne Pfadfinden, keine Schwertanimation Spieler (Welt).

## 0.10.x – Duell-Umbau Phase A (Gerätetest offen)
- 0.10.0: `js/worldcombat.js` (`SW.WCombat`): normale Gegner kämpfen direkt in der Welt (Aggro 5,5, Leine 13, Vorwarnung "!", Ausweichen/Block/Parade, Spezial, 2 Skill-Slots, Kampfbuttons nur im Kampf). Gegner-HP nicht gespeichert. Niederlage = Rückkehr zum Start. Belohnung `K.grant`.
- 0.10.1: iOS-Balken-Fix `fitH()` in `main.js` (Gegenmaßnahme, beobachten); +117 Gegner `e_x1..117`, +14 Wegschreine `way1..14` (+20 XP beim Erwecken), alle erreichbar geprüft.

## 0.9.x – Zusammenfassung (Browser-Tests bestanden; Nutzer meldet Gerätetests durchgeführt, ohne Einzelprotokoll)
- **Welt:** 5000x3000 Kacheln, Insel links oben, rechts Meer (Platz für Erweiterung via `js/layout-<n>.js`, `SW.Layouts`). `layout.js` aus Draft-Bild per `tools/make_layout.py` (lokal `py/`), Inhalte per `move_content.py` verschoben. 17 Regionen (0–16, u. a. Moonlit Grove 9, Stone Garden 10, Reed Marsh 11, Frostpeaks 12, Ember Crater 13, Dust Dunes 14, Sun Coast 15, Karst Spires 16 mit 6 Bergen/Brücken/Bergdorf/Himmelstempel). Je Region Schrein, POI, Arena, Texte EN+DE; Regionen 12–15 Gegner/Truhen, keine NPCs/Quests. `free()` sucht bis Radius 40.
- **Karte/UI:** Vollbild-Rechteckkarte mit Zoom/Pan, Symbole + Legende, Schnellreise-Leiste mit Bestätigung (nur aktivierte Schreine), Reise mit Ladebild (`assets/images/ui/loading.jpg`, Platzhalter), Rotate-Hinweis. Dynamischer Joystick (folgt dem Finger).
- **Speichern (Phase 6):** Startbildschirm (`title.js`), Hauptstand + 4 Wiederherstellungspunkte, Prüfsumme, Umschlag, Migration, Autosave bei Ereignissen/Gebietswechsel/Position, Export/Import (`SW.Save`, JSON mit Prüfsumme, Teilen-Menü iOS, Erinnerung >7 Tage).
- **Diagnose iOS-Schwarzbild nach Screenshot:** `SW.Diag` Protokoll + rotes Feld, `vpFix`, Watchdog; Problem laut Nutzer gelöst (beobachten); Diagnose bleibt vorerst.
- **Fortschritt:** Essence = eine Zahl, nur Skilltree (Baum 31, Angebot 35, Platzhalter). Yin/Yang: nur Skilltree-Voraussetzung und beim Lernen verbraucht (Nutzer-Spezifikationsänderung, überschreibt 33.2/33.3 für den Skilltree), Gleichgewichtsknoten verbrauchen halben Wert je Seite; Karma wird nie verbraucht. Skillpunkte 1/Level. Geheime Boss-Techniken (cross, ironwill, stillwater, oniwrath): erhalten -> gesperrt -> Level/Karma/Yin-Yang, keine Essence. Meister `n_master` + 2 Schriftrollen (`sc_wind`, `sc_mount`, Truhen `c_scroll1/2`, Entziffern kostet Level + Yin/Yang).
- **Karma-Weltreaktionen:** Karma-Ware (ab 30/70), Händler verweigern bei <= -70, Weiser `n_sage` ab 30, Kopfgeldjäger `h_1/2` bei <= -30, Schattenclan-Hinterhalt bei <= -30 (Drop `katana_shadow` 10 %), Gefangene `n_pris1-3` (Freilassen/Ausliefern).
- **Truhen:** 9 Hütten-/Torii-Truhen automatisch (`c_hut_x_y`), +8 Truhen in Regionen 12–15; je Truhe genau ein Eintrag, einmalig.

## Phase 0–8 (Basis, auf iPhone bestätigt bzw. Browser-Tests bestanden)
- Phase 0–5c: Grundspiel, Menüs, Inventar/Ausrüstung/Münzen/Truhen (4a), Händler/Schmied/Legendäres (4b), NPCs/Quests/Schreine/Schnellreise/Tag-Nacht.
- 7a/7b Schrein-Prüfungen (`trials.js`, 7 Räume: Block- und Laternenrätsel, Höhlenschrein = Duell gegen Elite, nur XP/Yin/Yang/Essence). 7c Nachtgegner + Nacht-NPC `n_watch`. 7d Gefangene + Kopfgeldjäger. Phase 8: Fortschrittssysteme.

## Balance-Platzhalter (alle vorläufig)
Essence-Kosten `skills-data.js`; Belohnungen `combat-data.js` (rewards), `items-data.js`, `quests-data.js`, `trials.js`; Essence-Start `progress.js`; Karma-Schwellen `skills-data.js`; Arena-/Weltkampf-Tempo und Reichweiten.

## Offen
- Gerätetest 0.10.x/0.11.0 (Weltkampf, Arena per Touch, Gegnerdichte, Balancing, Leistung mit 214 Gegnern, 33 Schreine auf Karte).
- Spec 33.6 / Trainingsbereich 27.8 (Puppen) offen; Boss-Arena bewusst ohne Duell-Symbole.
- Weitere Regionen (Kirschblütenwald, Stadt, Festung), NPCs/Quests in Regionen 12–16, Gegner-Pfadfinden, Spieler-Schwertanimation (Welt), weitere negative Karma-Quellen, Block-Raum-Auto-Reset, Phase 29 (Polish) unberührt.
- Hinweis: Ladebild liegt auf GitHub unter `assets/images/ui/loading.jpg` (lokales Zip: `assets/loading.jpg`); Zip-Datei hieß teils `js/config .js` (Leerzeichen) – Dateinamen prüfen.

## Nächster Schritt
Prüfung 0.13.0: Browser-Test (Weltkampf, Arena, Gegner um Felsen) + Gerätetest. Danach Phase 12 (Trainingsbereich) oder 14 (Region).
