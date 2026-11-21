# PROJECT_STATUS

**Cache-Version:** v69 (Spielversion 0.10.0)
**Aktuelle Phase:** 0.10.0 = Duell-Umbau Phase A (Weltkampf normale Gegner; Dateien gesendet, Gerätetest offen). Danach Phase B (Boss-Arena Ego-Pseudo-3D, noch NICHT begonnen). Davor: 0.9.1 = Balancing-Runde (Essence vereinheitlicht, Karma/Yin-Yang geprüft, Autosave Gebietswechsel, 2 neue Regionen). Status: Dateien gesendet, Browser-Tests bestanden, Gerätetest offen. Davor Phase 6 (0.9.0, Gerätetest offen). Davor Phase 8 – Fortschrittssysteme (erste Erweiterung umgesetzt). Phase 7a–7d integriert und im Browser stabil geprüft (siehe unten), Gerätetest offen.

**Repository:** `index.html` im Root, `css/main.css`, JavaScript unter `js/`, Spezifikation unter `docs/`.

## 0.10.0 – Duell-Umbau Phase A: Weltkampf für normale Gegner (Dateien gesendet – Gerätetest offen)
- **Entscheidungen (Nutzer):** Normale Gegner direkt in der Welt (laufen, ausweichen, angreifen, Spezial, 2 Skill-Plätze), kein Moduswechsel. Bosse später in kleiner Arena in Ego-Pseudo-3D (Phase B, so bauen, dass später echtes 3D möglich ist). Boss-Arena: nur freier BOTW-Stil, KEINE ▲■▼/Finten/Atem-Fokus (weicht von Spec 33.6 ab, ausdrückliche Nutzerentscheidung; Kap. 33.6/Trainingsbereich 27.8 bleiben offen).
- **Neu:** `js/worldcombat.js` (`SW.WCombat`): Aggro 5,5 Kacheln, Leine 13, Verfolgen, Angriff mit Vorwarnung (rotes „!“, lila bei unblockbar), Reichweite Schwert 1,3 / Speer 1,75. Spieler: Angriff/Kette, schwer, Spezial, Skill-Slot 0/1 (leer = Platzhalter „–“), Fernkampf, Block mit Parade, Ausweichrolle (i-Frames), Atem (stehend). Auto-Ausrichtung auf nächsten Gegner. Anzeigen Leben/Ki oben Mitte, Gegner-Lebensbalken, Schlagbogen, Schadenszahlen. Kampfbuttons nur sichtbar im Kampf (+2,5 s Nachlauf, `body.wcombat`).
- **Regeln:** Spielerwerte/Moves/Gegnerdaten unverändert aus `combat-data.js`/`SW.Char.combat()`. Leben+Ki füllen sich außer Kampf wieder. Niederlage = Rückkehr zum Startpunkt, Gegner zurückgesetzt (wie Arena). Belohnung über `SW.Combat.grant(spot, st)` (aus `reward()` herausgelöst, gleiche Werte wie vorher). Gegner-Lebenspunkte werden nicht gespeichert.
- **Arena bleibt für:** Gegner mit `phases` (4 Bosse) und Schrein-Duell (`K.boss(spot)`). Hinterhalt (Schattenclan) = Weltkampf (Bewegung weiter über `ambush()`).
- **Geändert:** `js/worldcombat.js` (neu), `js/combat.js` (K.boss, K.grant, foePose/drawWorld parametrisiert, Buttons delegieren), `js/player.js` (mul, push), `js/main.js` (Update/Overlay/sync), `css/main.css`, `index.html` (v69), `js/config.js` (0.10.0), `PROJECT_STATUS.md`.
- **Geprüft (headless Chromium 852x393, nur Rauchtest):** Start ohne JS-Fehler; Spieler nähert sich `e_train` -> Aggro, Kampfbuttons erscheinen (`body.wcombat`), Angriff per Taste J + Ausweichen X, Gegner besiegt (+12 XP), Kampf endet ohne Fehler.
- **NICHT geprüft:** Touch-Bedienung/Button-Lage auf dem iPhone, Balancing (Gegnertempo 2,6 Kacheln/s, Reichweiten, Aggro), mehrere Gegner gleichzeitig, Parade/Block-Timing, Tod/Respawn, Fernkampf, Skill-Slots mit echtem Skill, Hinterhalt im Weltkampf, Regression Arena-Boss/Schrein-Duell, Speichern/Laden nach Kampf, mobile Querformat-Ansicht.
- **Bekannt/offen:** Spieler-Schwertanimation fehlt (nur Schlagbogen), Gegner umgehen Hindernisse nur per Gleiten (kein Pfadfinden), Gegner-Respawn-Position nach Tod = Heimat.

## 0.9.27 – Export/Import des Spielstands (Spec 33.4) (Dateien gesendet – Gerätetest offen)
- `SW.Save`: `exportText()`, `inspect()`, `applyImport()`, `exportName()`, `lastExport()/markExported()`, `backupDue()`. Datei = JSON `{sw:'save', fmt:1, gv, ts, sum, raw}`; `raw` = Umschlag des Hauptstands (eigene Prüfsumme), `sum` = Prüfsumme über `raw`. Import prüft Format, Prüfsumme, Version (zu neu -> abgelehnt) und ändert vorher nichts. Beim Import wird der aktuelle Stand Wiederherstellungspunkt 1 (Kopie vor dem Ersetzen), dann Neuladen.
- UI: `Menus.h.backupBox` (Einstellungen + Startbildschirm-Button „Sicherung“). Export per `navigator.share` mit Datei (iPhone-Teilen-Menü), Fallback Download. Hinweis „Zeit für Sicherung“ bei >7 Tagen seit letztem Export (bzw. nie exportiert und >30 min Spielzeit); Zeitpunkt in `localStorage sw_last_export`.
- Textschlüssel `back`, `bk_*` (en in `menus.js`, de in `lang-de.js`).
- **Geändert:** `js/progress.js`, `js/menus.js`, `js/title.js`, `js/lang-de.js`, `js/config.js` (0.9.27), `index.html` (v66), `PROJECT_STATUS.md`.
- **Geprüft (headless Chromium 852x393, Playwright):** Export erzeugt gültige Datei; `inspect` erkennt manipulierte (Prüfsumme), fremde und zu neue Dateien; Import-Round-Trip (Karma 10 -> 0 wie in Datei, alter Stand in Wiederherstellungspunkt 1); UI-Upload defekter Datei zeigt Fehler, gültiger Datei zeigt Rückfrage; keine neuen JS-Fehler.
- **Nicht geprüft:** echtes iPhone-Teilen-Menü / „In Dateien sichern“, Dateiauswahl auf iOS (Gerätetest offen).
- **Bekannt (vorher vorhanden):** Ladebild liegt im Repo unter `assets/images/ui/loading.jpg` (Zip-Stand wich ab); Pfad inline in index.html + css/main.css so gesetzt.

## 0.9.26 – Inhalt für Frostpeaks, Ember Crater, Dust Dunes, Sun Coast (Dateien gesendet – Gerätetest offen)
- Bisher hatten diese 4 Regionen nur Schrein + Ort. Jetzt je 3 einmalige Gegner (`e_frost1-3`, `e_ember1-3`, `e_dunes1-3`, `e_coast1-3`; Typen bandit/ronin/spearman/swift/samurai/armored, Belohnung nach Typ aus `SW.Data.rewards`) und je 2 Truhen (`c_frost1-2`, `c_ember1-2`, `c_dunes1-2`, `c_coast1-2`; nur Münzen oder Ressourcen, je genau 1 Eintrag). KEINE Essence, KEIN Elite/Boss: Essence-Bilanz (Angebot 35 / Baum 47) unverändert. Alle Zahlen Platzhalter.
- Kein neues System; vorhandene Spot-/Truhen-Datenstrukturen. Keine neuen Texte nötig (Gegnertypen/Items vorhanden).
- **Geändert:** `js/combat-data.js`, `js/items-data.js`, `js/config.js` (0.9.26), `index.html` (v65), `PROJECT_STATUS.md`.
- **Geprüft (headless Chromium 852x393, Playwright):** Start ohne JS-Fehler. Erreichbarkeit per Suchlauf vom Start (4-Nachbarn, Interaktion Radius 2) mit tatsächlichen Laufzeitpositionen nach `free()`: alle 66 Gegnerpunkte, 42 Truhen, 19 NPCs, 19 Schreine erreichbar; einzige Ausnahme Ort `lake` (liegt bewusst im Wasser). Landfläche zu >99 % erreichbar. Alle 12 neuen Gegner und 8 Truhen liegen in der richtigen Region (12–15). Truhe öffnet genau einmal (Kräuter +4 bzw. Münzen +140, zweites Öffnen ohne Wirkung), steht danach im Speicherstand.
- **Alter Befund widerlegt:** Boss `e_oni` und `e_cave2`/`c_cave2` wirken vor `free()` unerreichbar, sind es nach `free()` aber nicht.
- **NICHT geprüft:** iPhone, Kampf von Hand gegen die neuen Gegner, Schwierigkeit/Balancing, Optik der Regionen.
- **Lokal-Hinweis:** Beim Headless-Test lieferte ein Asset 404 (Ladebild-Pfad `assets/loading.jpg` lokal vs. `assets/images/ui/loading.jpg` auf GitHub); auf GitHub funktioniert es laut Gerätetest.

## Gerätetest-Meldung Nutzer (iPhone, nach 0.9.25)
- Nutzer meldet: alle bisher offenen Gerätetests durchgeführt (7a–7d, Phase 6, Phase 8, 0.9.1–0.9.25 inkl. Regionen, Autosave, Schnellreise, Screenshot-Schwarzbild). Keine Fehler gemeldet. Einzelergebnisse je Test wurden nicht übermittelt; Status daher: **auf Gerät durchgeführt (Nutzerbericht), ohne Einzelprotokoll**.
- Nutzer gibt weiteren Auftrag: offene Aufgaben abarbeiten (siehe Abschnitt "Offen"), Dateien einzeln liefern.

## 0.9.25 – Diagnose: Ablauf der Korrekturstufen mitschreiben (Dateien gesendet – Prüfung ausstehend)
- **Gerätetest 0.9.24:** Log der Fehl-Sitzung kam an. Ablauf: Start Hochformat 393x793 -> Drehung auf 852x393 (normal) -> `touch` (Screenshot) -> `resize`: `iw393x852 cw393x852 cv852x852 vv393 o90` = **Fenster springt auf Hochformat-Maße, Gerät bleibt quer (o90)** -> `BAD`. Canvas (cv852x852) passt dann nicht zur Layoutbreite 393. Echter Auslöser ist ein iOS-Größensprung beim Screenshot, nicht meine Korrektur. Video: nach Screenshot-Vorschau wird Bild oben dunkel, unten schwarz.
- **Unbekannt:** Zeilen nach `BAD` waren am Rand abgeschnitten. Nicht bekannt, ob Stufe 1/2/Neuladen liefen und was sie bewirkten.
- **Änderung `js/main.js`:** Log schreibt `fix1/fix2/fix3`, `fix1res/fix2res`, `reload`. Rotes Feld oben, kleinere Schrift, 28 Zeilen, ohne `sc`/`sa`. Archiv 26 Zeilen je Fehl-Sitzung.
- **Geändert:** `js/main.js`, `js/config.js` (0.9.25), `index.html` (v64), `PROJECT_STATUS.md`.
- **Geprüft:** `node --check` bestanden. NICHT geprüft: Browser, Gerät.
- **Gerätetest 0.9.25:** Spiel läuft in Safari-Tab und als Home-Bildschirm-App (Dorf, Menü, Karte, Zoom ok). Screenshot-Schwarzbild auf v0.9.25 NICHT erneut getestet. Das gezeigte rote Feld stammt noch aus der 0.9.24-Sitzung (23:31, daher ohne `fix`-Zeilen). Neuer Hinweis darin: nach `BAD` wächst die Layouthöhe auf `cw852x1847` / `cv852x1847` (Seitenverhältnis 393x852 skaliert auf Breite 852) -> Canvas-Größe wächst nach dem Größensprung.
- **Gerätetest 0.9.25 (Nachtrag):** Screenshot-Schwarzbild tritt auf iPhone nicht mehr auf (Nutzerbericht, Safari + Home-App). Ursache nicht eindeutig belegt (vermutlich Fehlalarm-Eingriffe von `vpFix` entfernt/entprellt). Als gelöst beobachten; Diagnose-Protokoll bleibt vorerst drin.
- ~~NÄCHSTER SCHRITT (erledigt):~~ Gerätetest wie zuvor (Screenshot bis schwarz, Spiel schließen, öffnen, Feld fotografieren). Danach gezielte Korrektur (z. B. Layout auf feste Pixelgröße erzwingen) anhand der `fix`-Zeilen.

## 0.9.24 – Diagnose-Protokoll repariert, Fehlalarm beim Start entfernt (Dateien gesendet – Prüfung ausstehend)
- **Gerätetest 0.9.23 (iPhone, Home-Bildschirm-App):** Screenshot -> Bildschirm halb schwarz/blau -> Spiel reagiert auf nichts, Tabwechsel hilft nicht, nur komplett schließen + neu öffnen. DIAG-Feld erschien, enthielt aber nur 5 Zeilen (1 s): `pageshow iw393x852 cw393 o90` -> `BAD cw852 o90` -> `blur` -> `visibilitychange h1` -> `orientationchange o0`.
- **Auswertung:** Protokoll stammt aus einer kurzen Folge-Sitzung, nicht aus der Schwarzbild-Sitzung (jeder Start löschte das Log). Die BAD-Zeile ist ein Fehlalarm: `innerWidth` 393 (Hochformat), aber Layoutbreite `cw` 852 = Drehübergang beim Start. `vpFix` griff dadurch ggf. unnötig in den Viewport ein (Meta ändern, Zwangsbreite, Neuladen). Ob diese Eingriffe das Schwarzbild mit verursachen, ist unbekannt.
- **Änderung `js/main.js`:** (1) Log wird nur archiviert (`sw_diag_bad`), wenn die Sitzung BAD/STALL enthält; kurze Normal-Sitzungen überschreiben nichts; Schließen des roten Felds leert das Archiv. (2) `landscapeBroken` verlangt zusätzlich schmale Layoutbreite `cw`. (3) Eingriff erst nach 3 Prüfungen in Folge (ca. 1,2 s). (4) Log enthält zusätzlich Layouthöhe, Canvasgröße, Screengröße, Standalone-Flag und eine `touch`-Zeile (max. 1 je 3 s), um zu sehen, ob Berührungen im Schwarzzustand ankommen.
- **Geändert:** `js/main.js`, `js/config.js` (0.9.24), `index.html` (v63), `PROJECT_STATUS.md`.
- **Geprüft:** `node --check js/main.js` bestanden. NICHT ausgeführt: Browser-/Gerätetest, Diag-Logik im Browser. Schwarzbild-Ursache weiter offen.
- **Auffall (Foto):** Spielfläche endet ca. 54 CSS-px über Bildschirmunterkante (dunkler Streifen unten) auch direkt nach Neustart. Ursache unbekannt, beobachten.
- **NÄCHSTER SCHRITT:** Gerätetest: Screenshot bis schwarz, 5 s warten, 2x auf Bildschirm tippen, Spiel schließen, neu öffnen, rotes Feld fotografieren (muss mehrere Zeilen mit `touch` zeigen). Danach Dateien prüfen und Ursache eingrenzen.

## 0.9.23 – Reise mit Ladebild, Diagnose-Protokoll (Dateien gesendet, Gerätetest offen)
- 0.9.22: Schnellreise-Tipp auf iPhone bestätigt (Ursache war CSS-zoom um die Karte).
- **Reise:** Knopf "Reisen" blendet das Ladebild mit Text "Reise nach X…" ein (Wechsel bei 0,8 s, Ausblenden bei 1,6 s). Doppeltipp gesperrt.
- **Schwarzbild nach Screenshot (weiter offen, bleibt dauerhaft halb schwarz, auch im Spiel):** Auf dem Foto ist nur ein 393x393-Bereich links mit Körperfarbe sichtbar, nichts gezeichnet (auch keine Diagnosezeile). Vermutung: iOS-Layout-Fehler + verworfene Compositing-Ebenen. Neu: `SW.Diag` schreibt Ereignisse (visibilitychange, pagehide, pageshow, resize, orientationchange, focus, blur, freeze, resume, Herzschlag bei Größenänderung, BAD/STALL) in `localStorage['sw_diag']`. Beim nächsten Start (nach 2,5 s) erscheint bei BAD/STALL ein rotes Feld "DIAG letzte Sitzung", antippen = schließen.
- **Geändert:** `js/main.js`, `js/ui.js`, `js/config.js`, `js/lang-de.js`, `css/main.css`, `index.html` (v62), `PROJECT_STATUS.md`.
- **Geprüft:** `node --check`; Chromium 852x393: Ladebild-Ablauf (Text, Positionswechsel, Ausblenden), Protokoll schreibt, keine JS-Fehler. NICHT geprüft: iPhone.
- **OFFEN:** Schwarzbild: nach Auftreten Spiel schließen und neu öffnen, rotes DIAG-Feld fotografieren.

## 0.9.22 – Schnellreise-Tipp (Ursache CSS-zoom), Schleife-Watchdog, Diagnose (Dateien gesendet, Gerätetest offen)
- 0.9.20/0.9.21 auf iPhone bestätigt, ABER: Tipp auf Schrein/Reisen ging auf dem iPhone nicht, Halbbild schwarz nach Screenshot/Tabwechsel bei hineingezoomter Karte weiterhin.
- **Tipp-Ursache (vermutet):** `#menu` hat `zoom: .85`. WebKit rechnet `getBoundingClientRect` unter CSS-zoom anders als Touch-Koordinaten -> Tipp trifft ca. 10-15 % daneben (Chromium verhält sich anders, deshalb im Headless-Test nicht aufgefallen). Fix: im Karten-Tab kein zoom um die Karte (`#menu.maptab { zoom: 1 }`), Tab-Spalte und Schließen-Knopf behalten `.85`.
- **Schwarzbild:** Ursache weiter unklar. Neu: Zeichenschleife mit Watchdog (startet neu, wenn >1,5 s kein Bild), Diagnosezeile oben links (blau, `VP iw=… cw=… vv=… ow=… try=…`) erscheint bei schmalem Viewport oder stehender Schleife.
- **Geändert:** `js/main.js`, `js/config.js`, `css/main.css`, `index.html` (v61), `PROJECT_STATUS.md`.
- **Geprüft:** `node --check`, Chromium 852x393: Karte, Reiseleiste, Reisen ok, keine JS-Fehler. NICHT geprüft: iPhone (beide Punkte).
- **OFFEN:** Gerätetest. Bei Schwarzbild: Screenshot der blauen Diagnosezeile (falls sichtbar) oder Meldung, dass nichts erscheint.

## 0.9.21 – Schnellreise-Leiste, Zoom-Schwarzbild, dynamischer Joystick (Dateien gesendet, Gerätetest offen)
- **Schnellreise:** Tipp auf entdeckten Schrein wählt ihn und blendet unten auf der Karte eine Leiste ein: "Reisen nach X?" mit Reisen/Abbrechen (nur aktivierte Schreine reisbar, nicht aktivierte zeigen Hinweis). Vorher reiste Tipp sofort, ohne Bestätigung (Spec 27.5).
- **Schwarzbild bei Karten-Zoom + Screenshot:** Übersichtsbild wird nur noch als sichtbarer Ausschnitt gezeichnet (vorher riesige Zielgröße bis ca. 14000 px). Resume-Neuzeichnen zusätzlich bei 0,25/0,7/1,5 s.
- **Joystick dynamisch:** Wird der Finger weiter als der Radius von der Mitte gezogen, wandert die Joystick-Mitte mit. Rest unverändert (Aufsetzpunkt links, Totzone).
- **Geändert:** `js/input.js`, `js/ui.js`, `js/main.js`, `js/config.js`, `js/lang-de.js`, `css/main.css`, `index.html` (v60), `PROJECT_STATUS.md`.
- **Geprüft:** `node --check`; Chromium 852x393 (Maus): Joystick folgt (Mitte 100 -> 240 bei Zug auf 300), Leiste erscheint, Reisen funktioniert, Menü schließt, keine JS-Fehler. NICHT geprüft: iPhone-Touch, Screenshot-Schwarzbild auf Gerät.

## 0.9.20 – Kartensymbole und Legende (Dateien gesendet, Gerätetest offen)
- 0.9.19 (Karte zentriert, Schwarzbild-Fix) auf iPhone bestätigt.
- Karte: alle 23 Orte immer mit Symbol (Haus = Dorf/Hütte, Tor = Tempel/Ruine/Höhle/Schrein, Zelt = Lager, Raute = sonstige Orte); unentdeckte gedämpft. Beschriftung wichtige Orte zuerst, mit Ausweichpositionen; Legende unten links (EN/DE).
- Geändert: `js/ui.js`, `js/config.js`, `js/lang-de.js`, `index.html` (v59), `PROJECT_STATUS.md`.
- Geprüft: `node --check`, Chromium 852x393 Karte ohne JS-Fehler. NICHT geprüft: iPhone.
- Hinweis: Karst-Gruppe (Sky Temple, Peak Village, Wind Spire, Cloud Spire) eng, einzelne Namen erscheinen erst beim Hineinzoomen.

## 0.9.19 – Karte zentriert, Schwarzbild-Fix (Dateien gesendet, Gerätetest offen)
- **Karte:** Start im Menü zeigt ganze Landfläche zentriert (Inhaltsrahmen aus Übersichtsbild, Meer ausgenommen). Verschieben/Zoom klemmt auf diesen Rahmen. Hintergrund einheitlich schwarz.
- **Schwarzbild nach Screenshot/Tabwechsel (iOS):** (1) Resume-Hooks `UI/Render/Combat.resume` leeren/neu bauen verworfene Offscreen-Canvas (Übersichtsbild, Glow, Arena). (2) `vpFix` dreistufig: Skalierung ändern -> Viewport-Breite fest auf lange Seite -> Neuladen (Spielstand vorher gespeichert, max. alle 8 s). Prüfintervall 400 ms.
- **Geändert:** `js/ui.js`, `js/main.js`, `js/render.js`, `js/combat.js`, `js/config.js`, `index.html` (v58), `PROJECT_STATUS.md`.
- **Geprüft:** `node --check` alle JS ok; Chromium 852x393: Karte zentriert, keine JS-Fehler, visibilitychange-Simulation ok. **NICHT geprüft:** iPhone (Schwarzbild-Fix nur per Code, nicht reproduzierbar im Headless-Browser).
- **OFFEN:** Gerätetest: Screenshot und Tabwechsel in Spiel + Menü. Falls weiter schwarz: Bildschirm-Zustand melden (halb/ganz schwarz, Minimap sichtbar?).

## 0.9.16–0.9.18 – Weltumbau nach World Draft (Teile A, B, C in einem Zug gebaut, NICHT getestet)
**Stand:** Dateien gebaut, Browser- und Gerätetest offen (auf Wunsch zuerst nur Dateien geliefert). Nur Syntaxprüfung (`node --check`, alle JS) und zwei Lade-Smoketests in Node (Strukturen nicht im Wasser/Fels; alle 126 Orteinträge finden eine freie Kachel) liefen.
- **Weltmaß:** `CFG.W = 5000`, `CFG.H = 3000` (`config.js`). Ursprung (0,0) oben links. Die Insel (3600 x 2880 Kacheln, Draft gleichmäßig skaliert, 3.114 Kacheln je Draft-Pixel, Rand 60) belegt links oben. Rechts davon (x > 3700) ist Meer, reserviert für neue Regionen. `CFG.OV` (Kartenauflösung) wächst automatisch mit der Welt.
- **Layout:** `tools/make_layout.py` liest das Draft-Bild (Wasserscheide auf Farbverlauf mit Handpunkten je Region, Texte/Linien per Median entfernt, Mehrheitsfilter, Straßen/Flüsse per Kostenpfad) und schreibt `js/layout.js` (Zellgitter 8 Kacheln, RLE, 17 Regionen, See, 12 Straßen, 3 Flüsse, Regionsmitten `centers`). Wer das Draft ändert: Skript neu laufen lassen (`python3 tools/make_layout.py DRAFT.jpg js/layout.js vorschau.png`), Vorschau prüfen.
- **Karst Spires:** Ellipse im Südosten zwischen Iron Peaks und Hollow Caves (im Skript `KARST`). Jetzt 6 Spires: Bergdorf, Himmelstempel, Windturm, Wolkenturm + neu Berg 5 (Süd, Brücke vom Dorf) und Berg 6 (fern im Osten, Brücke vom Tempel). Je Spire 1 Gegner (`e_spire5` Ronin, `e_spire6` Swift) und 1 Truhe (`c_spire5`, `c_spire6`). Berge haben Vorrang vor Wegen.
- **`world.js`:** liest `SW.Layouts` (alle Segmente). Meer = neue Kachel `SEA` (schwarz, solid). Sandsaum an Küste und Seeufer. See, Flüsse, Wege aus dem Layout, Brücke wo Weg Wasser kreuzt. Gelände je Region bleibt procedural. Strukturen hängen an `CEN[region]` (Regionsmitten). Große Mauer und Randtürme entfallen (Meer ist die Grenze). Exporte: `WIDTH`, `HEIGHT`, `CEN` (ersetzen `N`, `C`, `MINI`).
- **Erweiterung:** neues Segment = Datei `js/layout-<name>.js` mit `SW.Layouts.push({ id, x0, y0, x1, y1, cell, w, h, rows, centers, roads, rivers })`, vor `world.js` in `index.html` laden, `CFG.W/H` erhöhen, Einträge mit absoluten Koordinaten an die Datenlisten hängen. Wachstum nach links/oben nur über feste Konstante (`CFG.OX/OY`), noch nicht eingebaut (nicht nötig, solange nur rechts/unten gewachsen wird). Spielstand speichert absolute Koordinaten.
- **Inhalte (Teil B):** `tools/move_content.py` (einmalig, Markierung `MOVED` in der Datei) hat 125 Koordinaten verschoben: alte Region -> Mittelpunkt der neuen Region, relative Lage bleibt, dann auf Landzelle der gleichen Region (kein See/Meer/Fluss) eingerastet (2 Einträge). Betroffen: `combat-data`, `shops-data`, `items-data`, `quests-data`, `shrines-data`, `village`. IDs unverändert. `free()` in `shops/combat/shrines/inventory` sucht jetzt bis Radius 40 (vorher 10/14), weil einige Einträge weiter vom freien Platz liegen (5 Einträge brauchten 11 bis 16).
- **Karte (Teil C):** Kartenbild und Minimap mit `WIDTH` x `HEIGHT`, Meer schwarz, helle Küstenlinie, Flüsse/Wege. Zoom und Verschieben rechteckig. Namen überlappen nicht mehr (Textfelder-Prüfung, entdeckte Orte zuerst; beim Hineinzoomen erscheinen die übrigen).
- **Alte Spielstände:** Fortschritts-IDs bleiben, Position wird nur übernommen, wenn die Kachel in der neuen Welt begehbar ist (sonst Start).
- **Ordner der Skripte:** Auf GitHub liegen `make_layout.py` und `move_content.py` in `/tools`. Auf dem Handy (lokaler Stand) liegen sie im Ordner `py`. Gleiche Dateien, nur anderer Ordnername. Aufruf im Repo-Root: `python3 tools/make_layout.py DRAFT.jpg js/layout.js vorschau.png` (lokal `py/…`).
- **Geändert:** `js/config.js`, `js/layout.js` (neu), `js/world.js`, `js/ui.js`, `js/progress.js`, `js/combat-data.js`, `js/shops-data.js`, `js/items-data.js`, `js/quests-data.js`, `js/shrines-data.js`, `js/village.js`, `js/shops.js`, `js/combat.js`, `js/shrines.js`, `js/inventory.js`, `index.html` (v57, `layout.js` vor `world.js`), `tools/make_layout.py` (neu), `tools/move_content.py` (neu), `PROJECT_STATUS.md`.
- **OFFEN / nächster Schritt:** (1) Chromium 852x393: Start, Neues Spiel, Karte, Schnellreise, Konsole ohne Fehler. (2) Erreichbarkeitstest in Node (Suche vom Start): alle Schreine, Orte, NPCs, Gegner, Truhen erreichbar, Landfläche über 95 % erreichbar. (3) iPhone-Test, vor allem Ladezeit und Karte (OV 8, Bild 625x375). (4) Sichtprüfung: Dorf/Camp/Ruinen/Höhlen nicht auf Weg oder Fluss, Karst-Brücken, Bergdorf, Brücken über dem Seeweg (Weg Moonlit Grove -> Stone Garden quert den See, wird dort Brücke).
- **Bekannte Risiken:** Draft-Regionsgrenzen sind per Farbe/Wasserscheide geschätzt (kleine Abweichungen, z. B. Stone Garden mit schmaler Zunge); Sun Coast und Reed Marsh haben im Draft keinen Weg; Wasserfall und See-Ort liegen im Wasser (nur Karten-/Entdeckungspunkt); Region Mirror Lake ist groß (See in der Mitte, Fischerhütten am Südufer); Sun-Coast-Bucht (alte Weltecke) entfällt. Performance Gelände: pro Kachel zusätzlich Layout- und Liniensuche, nicht auf dem Gerät gemessen.

## 0.9.15 – Weltkarte im Stil des World Draft
- Kartenbild (`ov2` in `ui.js`) zeigt Regionen als Flächenfarben (`RCOL`), Wasser, Lava, Sand, Wege/Brücken als helle Linien, hellen Küstenrand um die Welt. Außerhalb der Welt schwarz. Beschriftung fett mit dunklem Rand, Regionsnamen größer. Minimap bleibt auf dem Geländebild (`ov`).
- Bewusst NICHT geändert: Weltgelände und Ortskoordinaten. Die Karte zeigt die echte Welt, nicht das Draft-Layout (Inselform, Regionspositionen).
- Geändert: `js/ui.js`, `js/config.js`, `index.html` (v54), `PROJECT_STATUS.md`. `css/main.css` unverändert seit 0.9.14.
- Geprüft (Chromium 852x393): Karte mit Regionsfarben, Wegen, Küstenrand, keine JS-Fehler. NICHT geprüft: iPhone, Ladezeit des Kartenbilds auf dem Gerät (zweites Bild wird beim Start schrittweise erzeugt).
- OFFEN: Draft-Layout als echte Weltform = Umbau `world.js`, nur nach Freigabe. Überlappende Beschriftungen Windspire/Sky Temple/Cloud Spire.

## 0.9.14 – Menü und Karte gleichzeitig
- Tab-Spalte bleibt auf der Karten-Seite sichtbar, Karte füllt rechts das Panel. Vollbild-Modus `maponly` und Knopf `map-tabs` entfernt (jetzt `maptab`).
- Geändert: `js/ui.js`, `css/main.css`, `js/config.js`, `index.html` (v53), `PROJECT_STATUS.md`.
- Geprüft (Chromium 852x393): Tabs + Karte nebeneinander, Karte 673x393, Tabwechsel Inventar -> Karte ok, keine JS-Fehler. NICHT geprüft: iPhone.
- OFFEN: Weltlayout wie "World Draft" (Inselform, Regionen, Straßen) = Umbau von `world.js`, verschiebt Orte; nur nach Freigabe. Beschriftungen Windspire/Sky Temple/Cloud Spire überlappen auf der Karte.

## Abgeschlossen (auf iPhone bestätigt)
Phase 0–3, 4a, 4b, 5a, 5b, 5c. Patch v30 (Siegbildschirm-Liste, Viewport-Fix nach Screenshot) bestätigt.

## Neu in 7a (Schrein-Prüfungen, Zelda-Stil)
- Ablauf: Schrein beten (erwecken) -> Knopf "Enter/Betreten" -> Innenraum -> Aufgabe lösen -> Altar berühren -> Belohnung. Danach öffnet der Knopf wieder die Karma-Seite.
- Neue Datei `js/trials.js` (SW.Trials). Eigene Kachelräume, Joystick, Knöpfe Leave und Reset. Verlassen = Raum startet beim nächsten Betreten neu.
- Aufgaben: Steinblöcke auf Platten schieben (Schrein Hinode: Yin +3, XP); Laternen in angezeigter Farbreihenfolge entzünden (Bambus-Schrein: Yin +2, 1 Common Essence, XP). Falsche Reihenfolge löscht alle Flammen.
- Belohnungen nur Yin/Yang, Essence (nur Skilltree), XP. Keine Münzen. Einmalig, gespeichert (`tr` im Spielstand, alte Stände bleiben gültig).
- Geändert: shrines.js (interact), shops.js (Knopf), render.js (drawPlayer exportiert), progress.js (Speichern), main.js (Schleife), main.css, index.html.
- Geprüft (headless Chromium 852x393): Betreten, beide Prüfungen lösbar, Belohnung, Speichern/Neuladen, Reset, Leave, falsche Laternenreihenfolge, keine JS-Fehler.
- NICHT geprüft: Touch-Steuerung im Raum, Schiebegefühl auf dem iPhone, Optik auf dem Gerät.

## Neu in 7b
- 6 weitere Prüfungen: Berg (Steinblöcke, 3 Platten, Yin 3, Essence Common), Einsiedler (Laternen, Yin 3), Aussicht (Blöcke mit Wänden, Yin 2, Common), Fischer (Laternen, Yin 2), Ruinen (3 Blöcke/3 Platten, Yin 3, Refined). Alle nur XP, Yin/Yang, Essence, keine Münzen.
- Duell-Prüfung Höhlenschrein (Yang 5, XP 80, 1 Refined): Kampf gegen Elitegegner direkt aus dem Schrein. Sieg = Belohnung einmalig, keine Münzen/Karma/Beute. Niederlage = erneut versuchbar.
- Geändert: `js/trials.js` (Räume, Duell, `grant()`), `js/combat.js` (Reward-Hook für Schrein-Duell), `index.html` (v32), `js/config.js`.
- Geprüft: Sokoban-Solver (alle Blockräume lösbar, Tür/Altar danach erreichbar), Laternenräume (Tür/Altar erreichbar), Chromium 852x393: alle 7 Räume lösen + Belohnung, Duell gewinnen (Münzen/Karma unverändert, Yang steigt), Speichern/Neuladen, keine JS-Fehler.
- NICHT geprüft: Touch/Optik der neuen Räume auf dem iPhone, Schwierigkeit des Elite-Duells für Menschen, Balancing der Belohnungen.

## Neu in 7c
- 5 Nachtgegner-Spots (`night:true`): nur 21:00–05:00 sichtbar und kampfauslösend. 4 davon `respawn:true` (kehren jede Nacht zurück, nicht gespeichert, keine Dauer-Farm-Sperre). `n_quest` (Samurai) einmalig.
- Nacht-NPC `n_watch` (Nachtwache): nur nachts sichtbar/ansprechbar. Quest `watch1`: besiege `n_quest` → 60 Münzen, 80 XP, 4 Karma. Texte EN + DE.
- Neu: `SW.Combat.on(spot)`, `SW.Shop.on(npc)`. Geändert: `js/combat-data.js`, `combat.js`, `render.js`, `shops.js`, `quests.js`, `quests-data.js`, `lang-de.js`, `progress.js`, `config.js`, `index.html` (v33).
- Geprüft (Chromium 852x393): Tag = alle Nachtspots/NPC inaktiv, Nacht = aktiv; Quest annehmen → Kampf → bereit → abgeben (+60 Münzen); Respawn-Spot kehrt nach Tag→Nacht zurück, Quest-Gegner bleibt tot; Speicherstand enthält nur `n_quest`; keine JS-Fehler.
- NICHT geprüft: Touch/Optik auf dem iPhone, Balancing, Kampf gegen Nachtgegner in Tag-Arena (Arena bleibt unverändert), Ausblenden bei Nachtende mitten im Kampf.

- Fix 0.7.3: Karte – Zwei-Finger-Geste verschiebt jetzt auch (Mittelpunkt wandert) und zoomt gleichzeitig. `js/ui.js`. Geprüft per simulierten Pointer-Events (Chromium); echtes Touch auf iPhone nicht geprüft.

## Neu in 7d
- 3 Gefangene (`n_pris1-3`, Rolle `prisoner`) im Banditenlager, als Quest-NPCs (vorhandenes Quest-System, kein neuer Code für Dialog/Speichern). Quest `pris1-3`: Wache (`e_camp1/2/3`) besiegen, dann Entscheidung: Freilassen (XP 40, Karma +6) oder gegen Lösegeld ausliefern (XP 20, 80 Münzen, Karma -10). Gefangener verschwindet nach der Entscheidung (`gone`-Feld in `shops.js`, aus Quest-Status abgeleitet).
- Kopfgeldjäger: 2 Gegnerpunkte `h_1` (Samurai), `h_2` (Gepanzert) bei Dorf, nur aktiv bei Karma <= -30 (Feld `kv`, `Combat.on`). Einmalig besiegbar, gespeichert über `defeated`. Karma -30 ist erreichbar über Ausliefern (3x -10) oder Fischer-Quest (-8).
- Texte EN + DE. Geändert: `js/combat.js`, `combat-data.js`, `shops.js`, `quests-data.js`, `lang-de.js`, `config.js`, `index.html` (v35).
- Geprüft (headless Chromium 852x393): 3 Gefangene auf freien Kacheln, Jäger aus bei Karma -29, an bei -30, Quest annehmen/Wache töten/bereit, Ausliefern (Karma -10, +80 Münzen, NPC weg), Freilassen (+6), Dialog öffnet, DE-Texte vorhanden, Jäger-Kampf startet, Speichern/Neuladen (Jäger bleibt tot, Karma bleibt), Screenshot Lager mit Gefangenem + Questmarker, keine JS-Fehler.
- NICHT geprüft: Touch/Optik auf dem iPhone, Schwierigkeit der Jäger, ob Jäger bemerkt werden (keine Ankündigung), Gefangene sind keine eigene Figur (gleiche NPC-Grafik, nur andere Farben), Balancing.

## Phase 8 – Fortschrittssysteme (erste Umsetzung)
- Bestehende Trennung beibehalten: Essence nur Skilltree; Yin/Yang = Spielstil; Karma = Auswirkungen auf die Welt. Münzen, Ressourcen und XP bleiben getrennt.
- Geheime Techniken erweitert: Banditenanführer → Heavenly Cross; Bergwächter → Iron Will; Tempelmönch → Stillwater; Oni → Oni Wrath.
- Jede Technik wird nach dem Boss-Sieg zunächst nur als „erhalten/gesperrt“ gespeichert. Freischaltung verlangt zusätzliche Bedingungen aus Level, positivem Karma und Yin/Yang; Stillwater verlangt ein ausgeglichenes Verhältnis.
- Keine Essence-Kosten für geheime Techniken. Essence-Belohnungen aus Bosskämpfen bleiben Skilltree-Ressourcen.
- Yin/Yang-Zuwachs und Essence-Zugänge gegen ungültige Werte abgesichert; Karma-Wiederholungszähler beim Laden begrenzt und bereinigt.
- Geändert: `js/skills-data.js`, `js/skills.js`, `js/combat-data.js`, `js/progress.js`, `js/lang-de.js`, `js/config.js`, `index.html` (Cache v36).
- Prüfung: JavaScript-Syntaxprüfung für alle JS-Dateien bestanden. Isolierter Logiktest bestanden: alle vier Bossbelohnungen verweisen auf vorhandene Geheimtechniken, alle vier können erhalten werden, alle vier werden bei erfüllten Bedingungen freischaltbar, alle vier Kampfaktionen sind vorhanden und Essence bleibt unverändert. Vorherige Phase-7-Tests aus v35 bleiben dokumentiert; ein vollständiger Browser-/Gerätetest der neuen Phase-8-Funktionen steht noch aus.

## Stabilitätstest 7a–7d + Phase 8 (headless Chromium 852x393, ohne Codeänderung)
- Start ohne JS-Fehler. Nachtgegner/Nacht-NPC: Nacht an, Tag aus. Jäger: Karma -29 aus, -30 an. Nachtende mitten im Kampf: Kampf läuft sauber weiter.
- Schreine: Beten erweckt, zweites Beten betritt Prüfung; 7 Räume starten, Höhlenschrein = Duell. Speichern/Neuladen: Karma, Schrein, Prüfungen, Quests bleiben.
- Phase 8: alle 4 Bosse (Banditenchef, Wächter, Mönch, Oni) per Kampf besiegt: je genau 1 Geheimtechnik (cross, ironwill, stillwater, oniwrath), Essence nur Skilltree, Boss bleibt tot. Bei Level 30/Karma 100/Yin+Yang 70 alle 4 freischaltbar und ausrüstbar.
- Karma 70 (cross, oniwrath) rechnerisch erreichbar (~90 durch alle guten Quests, Bosse, Gegner), aber nur auf dem "guten" Weg.
- DE-Texte: keine fehlenden Schlüssel. Keine JS-Fehler in allen Läufen.
- Datei im ZIP hieß `js/config .js` (Leerzeichen); index.html lädt `js/config.js`. Auf GitHub Dateinamen prüfen.
- NICHT geprüft: iPhone-Touch (Prüfungsräume, Karte), Schwierigkeit, Balancing, Aussehen der Techniken im Kampf, Block-Raum-Verklemmung.

## Neu in 0.8.1 – Region 9 "Moonlit Grove"
- Kreis r=80 bei (800,800) zwischen Dorf, Westwald und See (`regionAt` -> 9). Waldboden, Steinplatz, Bäume dichter ausgespart um die Mitte. Name, Karte, Banner, Erkundungs-XP laufen über das bestehende Regionssystem.
- Inhalt: Schrein `grove` (ohne Prüfungsraum, öffnet Karma-Seite), 3 Gegner (`e_grove1-3`: Ronin, Speer, Schnell), 2 Truhen (1 Refined Essence, 120 Münzen), POI `grove`. Arena = Bambus. Texte EN + DE.
- Geändert: `world.js`, `ui.js`, `config.js`, `lang-de.js`, `shrines-data.js`, `combat-data.js`, `items-data.js`, `index.html` (v37).
- Geprüft (Chromium): Region 9 am Kreis, Schrein/Gegner/Truhen auf freien Kacheln, Banner/seen, Screenshot, Smoke-Test und alle 4 Bosskämpfe weiter ok, keine JS-Fehler.
- NICHT geprüft: iPhone, Weg zum Hain per Touch, Optik/Größe (kein eigener Boden, nur Wald+Platz), Balancing.

## Neu in 0.8.2 – Truhen an Hütten und Torii
- Je Hütte (`hut`) und Torii (`lintel`) eine Truhe daneben (9 neue), automatisch aus `world.js`-Strukturen in `inventory.js`; Inhalt aus Position abgeleitet (Münzen/Kräuter/Holz/Stein/Eisen), stabile IDs `c_hut_x_y`. Keine zusätzliche Truhe, wo schon eine <8 Kacheln steht. Gerätetest Hain + Hütten-Truhen: Hain bestätigt, Truhen noch offen.
- Geändert: `inventory.js`, `config.js`, `index.html` (v38). Geprüft (Chromium): 9 Truhen, keine Dubletten, alle auf freien Kacheln, Screenshot, Smoke-Test ok.

## Neu in 0.9.0 – Phase 6: Speichern + Startbildschirm
- Startbildschirm (`js/title.js`, SW.Title): Fortsetzen, Spielstand laden, Neues Spiel, Sprache. Solange er offen ist, wird nichts gespeichert (`Save.hold`).
- Speichern (`progress.js`): Umschlag {ts, pt (Spielzeit), sum (Prüfsumme), d}; Hauptstand + 4 Wiederherstellungspunkte (alle 10 min Echtzeit rückt der alte Hauptstand nach) + letzte Kopie (BAK). Defekter Hauptstand (Prüfsumme falsch) -> Sicherung, sonst Meldung + Auswahl. Alte Stände ohne Umschlag werden übernommen (Migration).
- Laden eines Punktes = Tausch mit Hauptstand (nichts geht verloren), vorher Bestätigung mit Datum und Spielzeit. Neues Spiel: Warnung, alter Hauptstand wird Punkt 1, ältester Punkt entfällt. Einstellungen > Spielstand löschen entfernt weiterhin alles.
- Anzeige je Stand: Stufe, Spielzeit, Datum/Uhrzeit, Region, Schreine, besiegte Gegner. Texte EN + DE.
- Geändert: `progress.js`, `title.js` (neu), `main.js`, `config.js`, `lang-de.js`, `css/main.css`, `index.html` (v39; title.js vor main.js).
- Geprüft (Chromium): Umschlag/Prüfsumme, Rotation, verfälschter Stand, Müll-Stand, alter Stand ohne Umschlag, Laden-Tausch, Neues Spiel mit Warnung, Speicher gesperrt ohne Absturz, Smoke, 4 Bosskämpfe, keine JS-Fehler.
- NICHT geprüft: iPhone-Touch/Optik Startbildschirm, Safari-Speicherverhalten (Privatmodus), Performance-Messung, Loading-Screens (nur Platzhalter-Spec), Autosave bei Gebietswechsel (bisher nur Ereignisse + Position alle 5 s).

## Neu in 0.9.1 – Balancing + Autosave + Regionen
- **Spec-Konflikt behoben:** Essence hatte noch 5 Arten (Spec 32.5/33.2: nur eine, keine Seltenheit). Jetzt eine Zahl (`SW.Essence.n`, add(k)/has(k)/spend(k)). Speicherformat v3; Altstände (Arten-Objekt) werden 1:1 summiert (Test: 3+2+1 -> 6). Ausgabe nur Skilltree. Chip im Menü: "Essence n". Texte `ess` statt `ess_*`.
- **Anti-Farm-Fix:** wiederkehrende Nachtgegner (`respawn:true`) geben keine Essence mehr (vorher 1/Nacht beim gepanzerten).
- **Bugfix Speichern:** `V.save` blockierte nach Titel-`hold` alle späteren `touch()` (Timer-ID blieb gesetzt). Timer wird jetzt vor der hold-Prüfung gelöscht.
- **Autosave:** jetzt bei jedem Gebietswechsel (`ui.js`), zusätzlich zu Ereignissen und Position alle 5 s.
- **Essence-Bilanz (Platzhalter):** Skilltree gesamt 47 (Stufe 1/2/3/4 = 1/2/3/4, Reset 2). Festes Angebot 35 (Start 2, Bosse 2/3/3/4, Elite 2, Truhen 7, Quests 5, Prüfungen 7). Ca. 74 % des Baums erreichbar: Spieler muss wählen.
- **Karma:** Quellen summiert ca. +93 gut / Schwellen 30/70. Heavenly Cross Karma 70 -> 60 (Platzhalter). Rest unverändert (Wiederholung halbiert).
- **Yin/Yang:** Simulation (Formeln aus `progress.js`): Yang/Yin 60 in 8 Kämpfen, 70 in 9, Balance 60 in 16-21 (je 3-4/4 pro Kampf). Keine Änderung nötig.
- **Neue Regionen (Kreis r 80, `World.MINI`):** 10 Steingarten (1600,800), 11 Schilfmarsch (800,1600). Je Schrein (ohne Prüfung), 3 Gegner, 2 Truhen, POI, Arena, Texte EN+DE. Garten: 1 Essence-Truhe. Terrain nur mit vorhandenen Kacheln (kein Kirschblütenwald, keine Küste: bräuchten neue Kacheln).
- Geändert: `progress.js`, `skills-data.js`, `skills.js`, `menus.js`, `combat.js`, `combat-data.js`, `inventory.js`, `items-data.js`, `quests.js`, `quests-data.js`, `trials.js`, `lang-de.js`, `ui.js`, `world.js`, `shrines-data.js`, `config.js`, `css/main.css`, `index.html` (v40).
- Geprüft (headless Chromium 852x393, Playwright): Start ohne JS-Fehler; Altstand-Migration; ungültige add/spend abgelehnt; Skill-Kosten 1/2; Regionen 10/11 (Gegner, Truhen, Schrein auf freien Kacheln in richtiger Region); BFS vom Start erreicht Schreine Garten/Marsch/Hain; Autosave bei Gebietswechsel (Position gespeichert, Format v3); Neuladen behält Essence/Position; Truhen-Essence einmalig; Skilltree-Menü zeigt nur "Essence"; DE-Texte.
- Regression (Chromium, Kampfzustand per Skript auf Sieg gesetzt, echter reward()-Pfad): 4 Bosse (+2/3/3/4 Essence, je 1 Geheimtechnik), Elite (+2), Samurai/Gepanzerter/Nachtgegner (0, Respawn 0), Quest hermit1 (+1 einmalig), Prüfungs-Duell (+2). Alle bestanden. Hinweis: `Trials.duelWon` selbst ist nicht gegen Doppelaufruf gesichert, Einmaligkeit kommt aus `Trials.can`/`enter` (unverändert).
- NICHT geprüft: iPhone-Touch/Optik, echter Kampf von Hand (nur Skript-Sieg), Prüfungsräume 7a/7b spielen, Performance, Spielgefühl/Schwierigkeit der neuen Regionen, Tümpel im Schilfmarsch (nur Erreichbarkeit der Schreine geprüft), Gebietswechsel-Autosave per echtem Laufen.

## Neu in 0.9.2 – Map: 5 neue Regionen, 4 neue Kacheln, kleinere Minimap
- Neue Kreisregionen (`World.MINI`, jetzt mit Radius `r`): 12 Frostpeaks (100,100 Schnee), 13 Ember Crater (2300,100 Vulkan, Lava), 14 Dust Dunes (100,2300 Wüste + Oase), 15 Sun Coast (2300,2300 Meer + Strand), 16 Karst Spires (1600,1600 hohe Felstürme). Je Schrein (Plattform in Mitte), POI, Arena, Texte EN+DE.
- Neue Kacheln: SNOW, ASH, LAVA (blockiert), DUNE. Neues Objekt SPIRE (hoher Felsturm, solid). Schneebäume heller. Nichts entfernt (alles Bestehende passt).
- Minimap zeigt kleineren Ausschnitt (60 statt 90 Übersichtspixel = 480 Kacheln). Weltkarte/Minimap übernehmen neue Farben automatisch (PAL).
- Geändert: `world.js`, `render.js`, `ui.js`, `config.js`, `lang-de.js`, `shrines-data.js`, `combat-data.js`, `index.html` (v41).
- Geprüft: Syntax aller JS; Node: alle 5 Schreine frei + vom Start erreichbar, >99 % Landfläche erreichbar; Chromium 852x393: Start, Neues Spiel, Screenshots Karst/Vulkan, keine JS-Fehler.
- NICHT geprüft: iPhone, Küste/Frost/Dünen per Screenshot angesehen, Performance mit Spires, Balancing.
- OFFEN: neue Regionen haben noch KEINE Gegner und KEINE Truhen (nur Schrein + POI). Kein Weg/Straße dorthin.

## Neu in 0.9.3 – Große Mauer, Bergdorf, Himmelstempel
- Große Mauer: Kachel WALL (solid), 5 Kacheln breit rund um die Welt, 12 Wachtürme (`build()`). Ersetzt den alten Fels-Rand.
- Karst Spires umgebaut: Spires entfernt. Zwei schmale Berge (`MT` in `world.js`, `World.mtn`): Berg 1 (1560,1600) mit Bergdorf (4 Häuser), Berg 2 (1650,1600) mit Himmelstempel + Gipfelschrein `peak`. Neue Kachel STAIR (Treppe, Südseite, 49 Stufen bei Berg 2). Brücke y 1598-1599 verbindet beide Plateaus (74 Kacheln).
- Geändert: `world.js`, `render.js`, `config.js`, `lang-de.js`, `shrines-data.js`, `index.html` (v42).
- Geprüft: Syntax; Node-BFS: Mauer solid, Treppe/Plateaus/Brücke/Tempel/Gipfelschrein vom Start erreichbar; Chromium 852x393: Mauer+Turm, Treppe sichtbar, keine JS-Fehler.
- NICHT geprüft: iPhone, Brücke/Dorf/Tempel im Screenshot angesehen, Performance.
- OFFEN: Bergdorf hat keine NPCs/Händler, Tempel keine Gegner/Truhen. Berge sind flach dargestellt (graue Felsfläche, keine Höhe/Schatten).

## 0.9.13 – Weltkarte als Vollbild-Rechteck
**Status: Dateien gesendet – Prüfung ausstehend (Gerätetest). Browser-Test bestanden.**
- Anlass: Karte war ein kleines Quadrat im Menü (iPhone-Screenshot, v0.9.12).
- Jetzt: Karte füllt das ganze Menü-Panel (Querformat-Rechteck), Tab-Spalte ausgeblendet (`#menu.maponly`). Knopf "Menü" unten links zeigt die Tabs wieder. Zoom 1 = Weltbreite = Kartenbreite, Start zentriert auf Spieler. Ein Finger verschiebt jetzt immer (auch bei Zoom 1), Zwei-Finger/Mausrad zoomt; Rauszoomen bis ganze Welthöhe sichtbar (Ränder dunkel).
- Geändert: `js/ui.js` (clampView, zoomAt, mapTap, Pan, sizeMap, drawMap auf Breite x Höhe), `css/main.css`, `js/config.js`, `index.html` (v52), `PROJECT_STATUS.md`.
- Geprüft (Chromium 852x393 und 852x300): Canvas = Panelgröße, Tab-Spalte weg, Menü-Knopf blendet Tabs ein, Zoom min/max, Screenshot ok, keine JS-Fehler.
- NICHT geprüft: echtes iPhone (Safari-Leiste, Safe-Area, Touch-Pan/Pinch), Antippen von Schreinen auf der Rechteck-Karte (Formel angepasst, nur per Code geprüft), Schriftgröße der Ortsnamen.

## 0.9.12 – Meister + Schriftrollen (kleine, ausbaubare Version)
**Status: Dateien gesendet – Prüfung ausstehend. Browser-Test bestanden.**
- Meister `n_master` im Startdorf (Rolle `master`, Shop-Fenster mit eigener Liste). Gefundene Schriftrollen sind zunächst "nicht lesbar"; Entziffern kostet Mindestlevel + Yin/Yang (verbraucht, `SW.YinYang.spend`) und lehrt eine aktive Technik (auto in freien Slot).
- Daten: `SW.Data.scrolls` in `skills-data.js` ({id, move, lvl, yin, yang}). 2 Rollen (Platzhalterwerte): `sc_wind` Windschnitt (Lv 6, Yang 25), `sc_mount` Berghut (Lv 8, Yin 25). Neue Moves `windcut`, `mountain` (nur vorhandene Move-Felder).
- Fund: Truhen `c_scroll1` (Ruinen 334/1964), `c_scroll2` (Höhlen 1964/1994), `give: { scroll: id }`. Je Truhe genau ein Eintrag, einmalig, gespeichert (Truhenliste). Rollenstatus im Spielstand: `skills.scr` {id: 1 gefunden / 2 gelernt}; alte Stände laden ohne Feld.
- Ausbau: neue Rolle = 1 Eintrag `scrolls` + 1 Move + Texte `sk_`/`skd_` + 1 Truhe. Neuer Skilltree-Knoten = 1 Eintrag `skills` (Kosten sp/ess, Felder yin/yang/balance/karma).
- Geändert/neu: `js/skills.js`, `js/skills-data.js`, `js/shops.js`, `js/shops-data.js`, `js/inventory.js`, `js/items-data.js`, `js/menus.js`, `js/lang-de.js`, `js/config.js`, `index.html` (v51), `PROJECT_STATUS.md`.
- Geprüft (Chromium 852x393): Meister, Truhen auf freien Kacheln; BFS vom Start erreicht Meister und beide Truhen; Truhe einmalig; zu wenig Yang/Level sperrt; Entziffern verbraucht Yang (40 -> 15), Technik im Slot; Doppelentziffern und nicht gefundene Rolle abgelehnt; Speichern/Laden; Meister-Fenster und Skills-Menü zeigen Technik; keine JS-Fehler; Syntax ok.
- NICHT geprüft: iPhone, Technik im echten Kampf (Moves nur per Datenprüfung), Optik des Meister-Fensters, Balancing. Kein Trainingsbereich/Puppen (Spec 27.8) gebaut. Schriftrollen geben noch keine Hinweise/Aufgaben, nur Techniken.
- Skillpunkte begrenzen den Baum (Level 30 = 30 SP, aktuell 28 im Baum). Schriftrollen kosten keine SP.
- Nächster Schritt: Gerätetest 0.9.11 + 0.9.12 (Technik im Kampf), dann Training.

## 0.9.11 – Yin/Yang werden im Skilltree verbraucht + ganzer Baum bezahlbar
**Status: Dateien gesendet – Prüfung ausstehend. Browser-Test bestanden.**
- **SPEZIFIKATIONSÄNDERUNG (ausdrücklich vom Nutzer, überschreibt 33.2/33.3 für den Skilltree):** Yin/Yang sind beim Lernen eines Skilltree-Knotens Kosten und werden abgezogen (`SW.YinYang.spend`, nur ungültige/zu hohe Beträge abgelehnt). Gleichgewichtsknoten: Voraussetzung ausgeglichen + beide >= Wert, verbraucht wird der halbe Wert je Seite. Karma wird NICHT verbraucht (nur Mindestwert). Geheime Boss-Techniken: unverändert (nur Voraussetzungen, nichts verbraucht). Reset gibt Yin/Yang nicht zurück (wie Essence).
- Essence-Kosten gesenkt (Platzhalter): Baum gesamt 31 Essence (vorher 47) bei Angebot 35, 28 Skillpunkte (Level 30 = 30) -> ganzer Baum erlernbar, 4 Essence Reserve für 2 Resets.
- Anzeige: Knoten zeigen "Yin 30 (wird verbraucht)" usw. EN + DE.
- Geändert: `js/progress.js`, `js/skills.js`, `js/skills-data.js`, `js/lang-de.js`, `js/menus.js`, `js/config.js`, `index.html` (v50), `PROJECT_STATUS.md`.
- Geprüft (Chromium 852x393): alle 20 Knoten erlernbar (Essence 31 -> 0, SP 28 -> 0), sm4 verbraucht 30 Yang, km4 je 15 Yin/Yang, zu wenig Yin/Yang sperrt, Menü rendert, keine JS-Fehler, Syntax ok.
- RISIKO: Yin/Yang-Zuwachs senkt die Gegenseite um 35 % des Zuwachses (alte Regel). Zusammen mit Verbrauch bremst das. Gesamtbedarf Baum: Yang 130, Yin 190. Erreichbarkeit/Balancing nicht gemessen.
- NICHT geprüft: iPhone, Anzeige der längeren Knotenliste, Balancing.
- OFFEN (Vorschlag, noch nicht gebaut, Spec 26.6 verlangt Vorschlag zuerst): Meister-NPC + Schriftrollen entschlüsseln + Fähigkeit lernen gegen Yin/Yang. Im Code gibt es weder Meister noch Schriftrollen.
- Nächster Schritt: Gerätetest 0.9.11, Entscheidung zum Meister-Vorschlag.

## 0.9.10 – Yin/Yang nur noch Skilltree-Voraussetzung (+ Schmuggler verworfen)
**Status: Dateien gesendet – Prüfung ausstehend. Gerätetest 0.9.4–0.9.8 vom Nutzer bestätigt (Aussage Nutzer). Browser-Test bestanden.**
- Entfernt: Yin/Yang-Überschuss-Boni (Angriff/Verteidigung/Gleichgewicht) und `SW.YinYang.bonus`. Menü Karma & Yin-Yang zeigt keine Boni mehr.
- Skilltree: Knoten verlangen jetzt zusätzlich Yin/Yang/Gleichgewicht/Karma (neues Feld `karma` an Knoten, `S.reqs`). Yin/Yang/Karma werden NICHT ausgegeben (Spec 33.2/33.3), nur Mindestwerte; Kosten bleiben Skillpunkte + Essence.
- Neue Platzhalter-Werte: sm3 Yang 25; sm4 Yang 30; sm5 Yang 40 + Karma 10; sw3 Yin 30; sw5 Yin 40; df3 Yin 25; df4 Yin 30; df5 Yin 30 + Karma 10; km4 Gleichgewicht 30; km5 Gleichgewicht 40 + Karma 20. Bereits gelernte Knoten bleiben gelernt.
- Schmuggler (0.9.8) komplett entfernt.
- Geändert: `js/progress.js`, `js/menus.js`, `js/skills.js`, `js/skills-data.js`, `js/lang-de.js`, `js/shops.js`, `js/quests.js`, `js/quests-data.js`, `js/config.js`, `index.html` (v49), `PROJECT_STATUS.md`.
- Geprüft (Chromium 852x393): Start ohne JS-Fehler, `Y.bonus` weg, Angriffswert ohne Yin/Yang-Einfluss, sm5 gesperrt ohne Karma 10 und frei mit Karma 10/Yang 40, Karma-Seite und Skilltree-Menü rendern, Syntax aller JS ok.
- NICHT geprüft: iPhone, Balancing (Yang 40 / Gleichgewicht 40 erreichbar?), Optik der längeren Voraussetzungsliste, DE-Anzeige im Skilltree.
- OFFEN Phase 8: Training.
- Nächster Schritt: Gerätetest 0.9.10, dann Training.

## Neu in 0.9.7 – Ladebildschirm + Rotate-Hinweis
**Status: Dateien gesendet – Prüfung ausstehend (Gerätetest). Browser-Test bestanden.**
- Ladebildschirm: Tuschemalerei-Bild (`assets/images/ui/loading.jpg`, 103 KB) als Vollbild, Ladeknopf (drehender Ring) unten rechts, Safe-Area beachtet. Mindestens 1,5 s sichtbar, blendet nach Start (Titelbildschirm bereit) aus; Notfall-Ausblendung nach 10 s per Inline-Skript. Vorgriff auf Phase 29 (Loading-Screen-Artwork), vom Nutzer ausdrücklich gewünscht; Bild ist Platzhalter.
- Fix "Rotate device to landscape": Hinweis lag unter dem Titelbildschirm (z-index 10 < 30) und schien durch die Knöpfe. Jetzt z-index 100, deckt im Hochformat alles ab.
- Geändert/neu: `index.html` (v46), `css/main.css`, `js/main.js`, `js/config.js`, `assets/images/ui/loading.jpg` (neu), `PROJECT_STATUS.md`.
- Geprüft (Chromium 852x393 und 393x852): Ladebild + Ring sichtbar bei 0,6 s; nach 3 s ausgeblendet, Titelbildschirm offen; Hochformat zeigt nur den Rotate-Hinweis; keine JS-Fehler.
- NICHT geprüft: iPhone (Safe-Area, echte Ladezeit, Drehverhalten), ob Bild bei GitHub Pages-Pfad `assets/images/ui/` korrekt lädt (relativer Pfad aus css/ -> ../assets/...).
- Lieferstand: `assets/images/ui/loading.jpg` vom Nutzer auf GitHub hochgeladen (Commit offen/bestätigen). Übrige 0.9.7-Dateien (`index.html`, `css/main.css`, `js/main.js`, `js/config.js`) vom Nutzer noch zu ersetzen.
- Nächster Schritt (bei "Fahre fort"): zuerst Gerätetest 0.9.4-0.9.7 auswerten (Ladebild, Rotate-Hinweis, Karst-Brücken, Schattenclan). Danach Phase 8 offen: Quests mit Karma-Änderung, Schmuggler-NPC, Training, Yin/Yang-Boni.

## Neu in 0.9.6 – Phase 8: Schattenclan-Hinterhalt (Teilaufgabe, BOTW-Yiga-Prinzip)
**Status: Dateien gesendet – Prüfung ausstehend (Gerätetest). Browser-Tests bestanden.**
- Bei Karma <= -30 spawnt nach ca. 110-200 gelaufenen Kacheln (bei <= -70: 70-130) ein Schattenclan-Assassine 8 Kacheln neben dem Spieler (Banner "Shadow Clan ambush!") und läuft auf ihn zu (3,2 Kacheln/s, Spieler 5: Flucht möglich). Kampf startet bei Kontakt wie bei jedem Gegner.
- Max. 1 Angreifer gleichzeitig. Bleibt, bis einer stirbt (Sieg oder Niederlage des Spielers), auch wenn Karma wieder steigt (neue Hinterhalte nur bei Karma <= -30). Schnellreise/Teleport (Sprung > 5 Kacheln pro Bild) lässt ihn verschwinden. Ist der Spieler > 12 Kacheln entfernt ohne Sprung (Flucht, Hängenbleiben), teleportiert er sich 4-12 Kacheln neben den Spieler. Nicht gespeichert. Sieg: 30 XP + 15-28 Münzen, KEIN Karma, keine Essence (kein Farmen). 10 % Chance auf die Waffe `katana_shadow` (Shadow Clan Blade, rare, Hauptwaffe, atk +16 %, crit +3, Hinterhalt +12 %; Platzhalterwerte). Schnellreise zählt max. 1 Kachel Wegstrecke.
- Neuer Gegnertyp `shadow` (70 HP, schnell, schwarz/rot maskiert). Texte EN+DE.
- Weitere negative Karma-Folgen (bereits vorhanden): höhere Preise, Kräuter-/Allgemein-/Rüstungshändler verweigern bei <= -70, Ältester gibt keine Quests, Kopfgeldjäger bei <= -30. Positiv: Preisrabatt, Karma-Ware, Weiser, Skill-Freischaltungen.
- Geändert: `js/combat.js`, `js/combat-data.js`, `js/items-data.js`, `js/config.js`, `js/lang-de.js`, `index.html` (v45), `PROJECT_STATUS.md`.
- Geprüft (Chromium, Skript, nach letzter Änderung): Verschwinden bei Teleport, Bleiben nach Karma-Anstieg, Teleport zum Spieler bei > 12 Kacheln ohne Sprung, Entfernung bei Tod, kein neuer Spawn bei Karma 50, Item + EN/DE-Texte vorhanden, keine JS-Fehler, Syntax ok. Davor: Spawn bei -30/-80, Abstand 4-12, Kampfstart bei Kontakt, Münzen, nicht im Spielstand.
- NICHT geprüft: 10-%-Drop im echten Kampf (Würfelwurf/Anzeige nur per Code-Review), iPhone, echter Kampf von Hand, Niederlage-Pfad (nur Code-Review), Häufigkeit/Schwierigkeit, Optik im Gelände, Verhalten an Wänden (läuft nur achsenweise).
- OFFEN Phase 8: Quests, die sich bei schlechtem Karma ändern; Schmuggler-NPC; Trainingsmöglichkeiten; Yin/Yang-Boni.
- Nächster Schritt: Gerätetest 0.9.4-0.9.6.

## Neu in 0.9.5 – Phase 8: Karma-Weltreaktionen (Teilaufgabe)
**Status: Dateien gesendet – Prüfung ausstehend (Gerätetest). Browser-Test bestanden.**
- Karma-Ware: Händler verkaufen ab Karma 30 zusätzlich (`D.stockK` in `shops-data.js`): Waffenhändler Tempered Katana; Rüstungshändler Iron Kote, Iron Greaves; ab Karma 70 Kabuto. Kauf unter der Schwelle wird abgelehnt.
- Verweigerung: bei Karma <= -70 (despised) bedient auch der Rüstungshändler nicht mehr (zuvor nur Kräuter/Allgemein).
- Karma-NPC: `n_sage` (Tempelweiser, Himmelstempel) nur sichtbar bei Karma >= 30 (neues NPC-Feld `kmin`, `Shop.on`). Quest `sage1`: am Windschrein beten, Belohnung 90 XP, 1 Essence, Karma +3. Texte EN+DE.
- Geändert: `js/shops-data.js`, `js/shops.js`, `js/quests-data.js`, `js/lang-de.js`, `js/config.js`, `index.html` (v44), `PROJECT_STATUS.md`. Davor (0.9.4, bereits gesendet): `world.js`, `render.js`, `shrines-data.js`, `combat-data.js`, `items-data.js`.
- Geprüft (Chromium, Skript): Weiser aus bei Karma 0, an bei 30; Warenlisten 0/30/70; Kauf gesperrt/erlaubt; Rüstung verweigert bei -70, nicht bei -30; Quest annehmen/Schrein/abgeben (+1 Essence); Dump enthält Quest; DE-Schlüssel; keine JS-Fehler. Syntax aller JS ok.
- NICHT geprüft: iPhone, Optik Händlerliste mit Zusatzware, Balancing der Preise/Ware, Karma-Sturz mit aktiver Quest (Weiser verschwindet, bis Karma wieder >= 30), echtes Laufen zum Tempel.
- OFFEN Phase 8: Negativ-Gegenstück zum Weisen (Schmuggler/Quest bei Karma <= -30), Trainingsmöglichkeiten, Yin/Yang-Boni balancieren.
- Nächster Schritt: zuerst Gerätetest der gesendeten Dateien (0.9.4 + 0.9.5), dann Negativ-Quests/Training.

## Neu in 0.9.4 – Karst Spires erweitert
- Region 16 Radius 150 -> 215. Zwei neue Berge: Windturm (Berg 3, West, 1450/1600) und Wolkenturm (Berg 4, Nord, 1560/1490). Brücken vom Bergdorf nach Ost, West, Nord (`BR` in `world.js`). Plateau Berg 2-4 = Stein.
- Neu: 2 Schreine (`windspire`, `cloudspire`), 2 POIs, 5 Händler-NPCs (Bergdorf: general/herb/smith, Tempel: weapon, Windturm: armor), 6 Gegner (Tempel 2, Wind 2, Wolke 2), 4 Truhen. Texte EN+DE.
- Felsen: Kantenlicht/-schatten + Risse in `render.js` (gilt für alle ROCK-Kacheln).
- Geändert: `world.js`, `render.js`, `config.js`, `lang-de.js`, `shrines-data.js`, `shops-data.js`, `combat-data.js`, `items-data.js`, `index.html` (v43).
- Geprüft: Syntax; Node-BFS: Schreine, NPCs, Gegner, Truhen auf freien, erreichbaren Kacheln; Brückenmitten Ost/West/Nord; Chromium 852x393: Start, Teleport, Screenshots, keine JS-Fehler.
- NICHT geprüft: iPhone, Brücken per Screenshot, Balancing der neuen Gegner/Truhen, Performance.
- OFFEN: keine Quest-NPCs in Karst; Händler nutzen Standardrollen.

## BALANCE-PLATZHALTER (alle vorläufig, nicht final)
Essence-Kosten `skills-data.js`; Belohnungen `combat-data.js` (rewards), `items-data.js` (Truhen), `quests-data.js`, `trials.js`; Startwert `progress.js` (Essence); Karma-Schwelle Cross `skills-data.js`.

## Offen
- Weitere Regionen (Kirschblütenwald, große Stadt, Festung usw.): brauchen Konzept/Freigabe. Regionen 12–15 haben seit 0.9.26 Gegner/Truhen, aber noch keine NPCs/Quests.
- Phase 8 weiter ausbauen: Weltreaktionen auf Karma systematisch für NPCs, Händler, Quests und besondere Zugänge prüfen; Yin/Yang-Boni und Belohnungsraten balancieren.
- Phase 8: prüfen, ob alle Bossarten erreichbar sind und jede Technik genau einmal vergeben wird.
- Weitere Aufgabentypen (Wasser, Spiegel): bewusst nicht in 7b, nur Block- und Laternenräume wiederverwendet.
- Negatives Karma hat nur wenige Quellen (Ausliefern, Fischer-Quest); weitere (z. B. Unschuldige angreifen) nur nach Vorschlag.
- Block-Raum: automatisches Zurücksetzen verklemmter Blöcke (bisher Reset-Knopf oder Raum verlassen).
- Phase 6 Gerätetests: Deutsch durchspielen, Performance.

## Technische Entscheidungen
- Canvas 2D, keine Abhängigkeiten; Ladereihenfolge in `index.html` (trials.js vor main.js).
- Systeme getrennt: XP/Level, Skillpunkte, Essence (nur Skilltree), Karma, Yin/Yang, Münzen (Handel), Ressourcen (Handwerk/Dorf).

## Nächster Schritt
Schwarzbild-Thema abgeschlossen (0.9.25). Gerätetest iPhone (7a–7d, Phase 6, Phase 8, 0.9.1: Regionen Garten/Marsch, Autosave) steht weiter offen; Freigabe für nächste Teilaufgabe durch Nutzer abwarten. Danach Konzept für neue Regionen abstimmen und Karma-Weltreaktionen/Yin-Yang-Balancing ergänzen.
