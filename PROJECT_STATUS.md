# PROJECT_STATUS (gekürzt, Stand 0.20.2, Cache v87)

**Repo:** `index.html` im Root, `css/main.css`, `js/*.js`, `assets/`, `docs/` (Spec). Ladereihenfolge in `index.html` (arena3d.js nach worldcombat.js, vor main.js). Spiel: Canvas 2D, keine Abhängigkeiten, GitHub Pages, iPhone Querformat.
**Aktuell:** 0.15.0 (Fixes nach Gerätetest 0.14.0; Gerätetest laut Nutzer komplett bestanden, ohne Protokoll; Regression Speichern/Quests/Inventar dabei laut Nutzer ok). 0.14.0 = Phase 12. 0.13.0 (Phase 11+13) vom Nutzer auf Gerät getestet: alles OK. Zuvor 0.12.4 (Breathe-Button entfernt). Zuvor 0.12.3 (Fix nach Gerätetest) = Phase 8 + 9A + 9B + 10. Dateien gesendet (2 Lieferungen), Browser-Tests bestanden (Details 0.12.0), **Gerätetest offen**. Gerätetests 0.10.x/0.11.0: laut Nutzer durchgeführt (ohne Protokoll).
**Arbeitsregeln:** nur freigegebene Phase; Dateien einzeln mit Repo-Pfad liefern; nichts als getestet melden, was nicht lief; Status nach jeder Lieferung aktualisieren.

## 0.20.2 – Nutzerentscheidungen nach 0.20.1
- **Banditenlager nach Western Woods:** `world.js` neue Konstante `CAMP` (600,1500) statt `CEN[7]` (Struktur, POI `camp`, Baumfreie Zone, Dirt-Boden in Region 3). Inhalt um (-1052,-688) verschoben (`data/world.json`): `e_boss`, `e_camp1-4`, `e_x106/107`, `c_camp1/2`, `n_pris1-3`, Schrein `way9`; `tier` 1 (Regelwert Region 3). `data/combat.json`: `boss.arena = camp` (Arena bleibt Lager). Texte `elder3` EN/DE: "Western Woods". Weg Start -> Lager ~390 Kacheln (vorher ~1000). Alter Lagerplatz (Region 7) bleibt leere Dirt-Fläche.
- **3 Mini-Quests (nur Daten, tier 1):** `elder7` (Ronin `e_x83` nördlich), `elder8` (Schrein `grove`), `elder9` (Späher `e_x65`); Kette `elder2` -> 7 -> 8 -> 9; `elder3` verlangt jetzt `done: elder9` (+ Level 3, Karma 10). Texte EN (`quests-data.js`) + DE (`lang-de.js`).
- **Quest-Punkt Karte:** unverändert. Nutzer: nur bei fernen Zielen, nicht bei "Bring"-Quests (so ist es schon).
- **Getestet (headless Chromium 852x393):** Validator 0 Fehler; BFS vom Start: Boss, Lagergegner, Truhen, Gefangene, Schrein `way9`, `e_x65` erreichbar; Questkette 2->7->8->9->3 schaltet korrekt frei; Karten-Ziel `e_boss` bei (600.5,1508.5); Screenshot Lager (Palisade, Dirt-Boden); Regression 24/24 (2 Läufe; 1 Lauf mit einem Offline/XHR-Fehler, bekanntes Flackern des Zwischenspeicher-Tests).
- **Nicht geprüft:** iPhone; Bosskampf von Hand im Lager; Schnellreise `way9`; BFS zu `e_x83` und `grove` (außerhalb Suchbereich); Gefangenen-Quests von Hand; Regionsname beim Lager zeigt jetzt "Western Woods".
- **Phase 26 (vorgemerkt auf Nutzerwunsch):** Tutorial-Insel / gesteuerter Einstieg (neue Region + Skript) zusammen mit der Hauptquest.

## 0.20.1 – Fix nach Gerätetest 0.20.0
- **Startgegner weiter weg:** `e_train` (Quest `elder1`) von y 1180 auf 1190 (`data/world.json`); Startpunkt (884.5, 1175.5) -> Abstand 5 -> 15 Kacheln. Schrein-Wächter `g_village_1/2` stehen 10 Kacheln entfernt (Aggro 5,5). Geprüft: Spawn-Abstände per Browser, Terrain (885,1190) begehbar.
- **Gerätetest 0.20.0:** Start, Karte (Screenshot), Version v0.20.0 sichtbar -> Spiel lädt am iPhone mit JSON-Daten.
- **Offen (Nutzerwünsche, nicht umgesetzt):** (2) Tutorial-Insel/BOTW-Einstieg = neue Region + Skript, Vorschlag nach Generator-Gerüst; (3) Schwarz/blau-Bild nach Screenshot: Websites können iOS nicht an eine Ausrichtung binden (kein Orientation-Lock in Safari/Brave) -> echte Lösung erst mit Capacitor-App; (4) Quest-Markierung auf Karte **existiert bereits** (grüner Punkt, nur bei angenommener Quest), einfachere/nähere Quests = Inhalt, Entscheidung offen.

## Phase 20 – Daten-Fundament (0.20.0, Cache v85) – Dateien gesendet, Gerätetest offen
- **Freigabe:** Nutzer 22.11.2026. Phase-19-Ordner `Phase 19 Test` ins Repo gemerged (Ladebild `assets/loading.jpg` -> `assets/images/ui/loading.jpg`; `text.txt`, Export-JSON nicht übernommen).
- **JSON-Daten:** `data/{combat,world,items,shops,quests,skills}.json` + `data/index.json` (Dateiliste). **Quelle der Wahrheit** für alle Spieldaten (spots, shrines, chests, npcs, quests, items, skills, enemies, moves …). Items tragen EN-Name/Beschreibung in `en`. `js/combat-data.js` **entfernt**; `items/shops/quests/shrines/skills-data.js`, `regions-content.js` enthalten nur noch Logik (price/upCost, itemMap) und EN-Texte.
- **Lader:** `js/dataload.js` (synchrones XHR vor den Datenskripten, Fehlermeldung im Ladebild). `sw.js` sichert `data/*.json` vorab. Texte (EN/DE) bleiben JS (`SW.TEXT`), JSON-Texte später.
- **Tags:** `ed: lite` (alle 733 Einträge: spots, shrines, chests, npcs, quests, items, skills) und `tier` 1-3 (spots, shrines, chests, npcs, quests; Region-Regel aus `combat.js` übernommen: Regionen 0,1,3 = 1 | 12+,5,8,16 = 3 | Rest = 2). Nur Tags, **ohne Spielwirkung**; `tierMul` = Phase 22. Verteilung spots 24/70/102, shrines 4/12/19, chests 8/14/26, npcs 8/5/18.
- **Stabile IDs:** Strukturen `grp` (`hinode`, `peak`, `sakura`, `sakuratown`), `village.js` ohne Index.
- **Werkzeuge:** `tools py/validate_data.py` (IDs, Verweise, EN/DE, Gruppen, `ed`/`tier`, Daten geladen), `tools py/tag_data.py` (ergänzt fehlende Tags). **Generator-Gerüst für neue Regionen: noch offen** (Teil 2). `tools py/make_layout*.py` und `move_content.py` schreiben noch die **alten JS-Daten** -> Koordinaten-Änderungen jetzt in `data/world.json`.
- **Getestet (tatsächlich, headless Chromium 852x393):** Vergleich Daten vor/nach Umbau: alle 31 Datenschlüssel identisch, EN- und DE-Texte identisch (`items` nur +`en`); Validator 0 Fehler; `node --check` alle JS; Regression 24/24 (3 Läufe nach Testfix). **Ein Lauf schlug einmal fehl:** Offline-Test, Zwischenspeicher war noch nicht fertig (Test wartet jetzt darauf). Echter Gerätefall: offline erster Start ohne vollständigen Cache -> Fehlermeldung im Ladebild.
- **Nicht geprüft:** iPhone/Safari (synchrones XHR im Home-Bildschirm-App-Modus), GitHub-Pages-Unterpfad, Spiel von Hand (Händler, Quests, Dorf), Ladezeit auf Gerät.
- **Bekannt:** `tools py`-Skripte (Layout) nicht an JSON angepasst; sync-XHR ist veraltet, aber in allen Browsern nutzbar (Alternative: asynchroner Start, größerer Umbau).
- **Nächster Schritt:** Gerätetest 0.20.0, dann Phase 20 Teil 2 (Generator-Gerüst Regionen) oder Freigabe Phase 21.

## Phase 19 – Spielstand sichern (0.18.0, Cache v83) – Dateien gesendet, Gerätetest offen
- **Freigabe:** Nutzer 22.11.2026 (Entscheidungen siehe `docs/Langzeit.md` Kap. 11). Branch-Vorschlag: `phase-19-save`.
- **Neu:** `js/store.js` (`SW.Store`: austauschbare Speicher-Schnittstelle, Spec 32.1; `persist()`-Abfrage; Service-Worker-Registrierung), `sw.js` (Netz zuerst, Zwischenspeicher nur offline; Dateiliste automatisch aus `index.html`), `manifest.webmanifest`, `assets/images/icons/*.png` (**Platzhalter-Icons** aus Ladebild). `index.html`: Manifest, apple-touch-icon, Meta-Tags, `store.js`, alle `?v=83`.
- **Geändert:** `js/progress.js` (`SW.Save` nutzt nur noch `SW.Store`; **neu:** Stand mit zu neuer Formatversion wird nie überschrieben/gelöscht, liegt in `sw_progress_v1_future`; `V.future()`), `js/menus.js` + `js/lang-de.js` (Speicherschutz-Hinweis im Backup-Feld EN+DE), `js/config.js` (0.18.0), `tests/regression.py` (+9 Tests).
- **Getestet (tatsächlich, headless Chromium 852x393):** Regression **24/24 bestanden** (15 alte + 9 neu: Store austauschbar, Altstand v1/v2 lädt, zu neuer Stand bleibt erhalten, Manifest/Icons/sw.js erreichbar, Service Worker registriert, **Offline-Start aus Zwischenspeicher**, persist-Abfrage + UI-Hinweis). `node --check` aller geänderten JS ok. Screenshot Einstellungen Querformat ok. Keine JS-Fehler.
- **Nicht geprüft:** iPhone/Safari (Home-Bildschirm-App, `persist()`-Ergebnis in Safari, Vollbild/Schwarzer-Balken-Verhalten im Standalone-Modus), GitHub-Pages-Unterpfad, Android, Capacitor (nur Entscheidung offen), Icon-Optik.
- **Wichtig (iOS):** Home-Bildschirm-App hat **eigenen Speicher** (nicht der aus Safari). Vor dem ersten Start der App: in Safari **exportieren**, in der App **importieren** (Hinweis steht in Einstellungen).
- **Bekannt:** Headless-Chromium meldet `persist()` = no (kein Nutzerprofil); echter Wert nur am Gerät. Die ältere Version würde einen zu neuen Stand nicht laden (Neues Spiel/Speichern nur mit Sicherung).
- **Nächster Schritt:** Gerätetest 0.18.0, dann Freigabe Phase 20 (Daten-Fundament: JSON-Lader, stabile IDs, `tier`/`ed`, Validator).

## Langzeit-Plan (Nutzerfrage 100–200 h, Lite/PC/3D) – nur Dokument, kein Code
- **Aktualisiert 22.11.2026:** `docs/Langzeit.md` v3 (ersetzt LANGZEIT_PLAN.md): Lite Cap 50 / PC Cap 100+, Ryō, PC-Welt 40–50 km², Phasenplan 19–33, Nutzerentscheidungen Kap. 11.
- **Alt:** `docs/LANGZEIT_PLAN.md` (Spielzeit-Modell, Balance-Vorschlag Cap 60 / XP `4*l^1.6`, Essence ~180 Angebot / ~260 Kosten, Sammelfunde + Wiederholbares als **Vorschlag neuer Systeme**, Safari-Speicherrisiko, Lite = Build-Schalter, PC-Wrapper, 3D = three.js-Prototyp erst nach 2D, Phasen 19–24+).
- **Offen:** Nutzerentscheidungen (Kapitel 8 des Plans). Zeiten/Aufwand sind Schätzungen.

## Phase 18 – Balancing-Auswertung (kein Spielcode geändert, Version 0.17.0)
- **Neu:** `docs/BALANCING.md` (Angebot/Bedarf XP, Essence, Münzen; Vorschläge; zentrale Platzhalter-Liste). Datenauswertung tatsächlich ausgeführt (Chromium).
- **Befunde:** Welt gibt ~10 900 XP, Level 30 braucht 48 857 -> max. Level ~16; geheime Techniken (Lvl 18-25) unerreichbar; Essence ~43 gegen 31 Kosten (zu reichlich); Baum 28 SP, bei Lvl 16 nur 16 SP.
- **Offen (Nutzerentscheidung):** XP-Kurve, Essence-Menge/Kosten, Skillpunkte. Nichts wird ohne Freigabe geändert (keine erfundenen Zahlen).
- **Nicht geprüft:** Kampfschwierigkeit, Schmiedekosten, Ki-Regen, Boss-HP.
- **Geändert:** NEU docs/BALANCING.md, PROJECT_STATUS.md.

## Phase 17 – Regressionstests (Spec 33.5), kein Spielcode geändert (Version bleibt 0.17.0)
- **Annahme:** Nutzer: „Mach das was du für wichtig hältst“ -> Empfehlung E (vor Balancing und Phase 29). 0.17.0 (Phase 16) vom Nutzer auf Gerät getestet: OK.
- **Neu:** `tests/regression.py` (Aufruf im Repo-Root: `python3 tests/regression.py`; startet eigenen Server, headless Chromium 852x393, Playwright). 15 Prüfungen, Exitcode 1 bei Fehlern.
- **Ergebnis (tatsächlich ausgeführt, 15/15 bestanden):** Speichern/Laden (Münzen, Level, XP, Essence, Karma, Yin); Kopie vor Überschreiben; beschädigter Hauptstand -> Kopie, kein Absturz; Neues Spiel -> Wiederherstellungspunkt, Hauptstand leer; Wiederherstellen; Export/Import (gültig ok, manipuliert/ungültig abgewiesen, Stand unverändert); Inventar (add/remove/ausrüsten/ablegen, ungültige Mengen, Überzahlung); Quest (annehmen, bereit, abschließen, Belohnung einmalig, Gegenstand abgegeben, Status nach Neuladen); Fortschritt (XP/Level/Skill-/Attributpunkte, Essence nicht überbuchbar, Karma-Wiederholung halbiert, Yin/Yang 0-100); Skilltree (bucht Skillpunkt+Essence einmal, nicht doppelt lernbar, Karma unangetastet); Weltkampf (Lock AN/AUS, Ausweichen 25 Ki, bei zu wenig Ki gesperrt); Joystick (links dynamisch, Loslassen, Deadzone, rechts kein Joystick); POI/Schreine vorhanden; keine JS-Fehler.
- **Testfehler beim Bau (nicht Spielfehler):** Item-Liste ist Array; 2 Wiederherstellungspunkte nach Neues Spiel sind korrekt. Kein Spielfehler gefunden.
- **NICHT abgedeckt (offen):** Truhen einmalig öffnen, Händler kaufen/verkaufen, Schmied, Schnellreise, Boss-Arena/Bossphasen, Niederlage + Rückkehr, Kampfbuttons erscheinen/verschwinden, Touch-Multitouch (Joystick + Aktion gleichzeitig), Safe Areas, Dorf-Wiederaufbau, Tag/Nacht, Karte. Alles auf iPhone: weiterhin nur manuell. Simulation per Maus/Pointer ist **kein** Gerätetest.
- **Geändert:** NEU tests/regression.py, PROJECT_STATUS.md.

## 0.17.0 – Phase 16 (Sakura-Anbindung, Sakura-Stadt, Ziel-Lock) – Dateien gesendet, Gerätetest offen
- **Annahme:** Phase 16 = die 3 Nutzerwünsche (Phase 15 nie definiert). Stadt nach Sakura statt Hermit Hut (Hermit = Einsiedler/Wald, Sakura hat Platz + ist jetzt angebunden).
- **Sakura-Anbindung:** `py/make_layout_sakura.py`: Landbrücke 80-96 statt 30 Kacheln breit (Meerenge x 3730-3790 ebenso breit, Brücke unverändert 3 breit) -> `js/layout-sakura.js` neu erzeugt. Karte zeigt jetzt Land statt dünner Linie.
- **Sakura-Stadt (Edo-Stil, ohne Moderne):** `world.js`: 12 `house` (2 Reihen an der Hauptstraße, x 4100-4176) + `hall` (4192,1476), Zone ohne Bäume, POI `sakuratown` (4170,1491). Nur `house`/`hall`, keine `hut` (village.js zählt per Index). `regions-content.js`: 5 Händler `n_st_*` (Waffen, Rüstung, Allgemein, Kräuter, Schmied; Rollen/Texte wie Startdorf), Text `poi_sakuratown` EN+DE. `ui.js`: Kartensymbol Dorf. Kein Dorf-Wiederaufbau, keine Quests in der Stadt.
- **Ziel-Lock (Weltkampf):** neuer Knopf `cb-lock` (nur Weltkampf, über Heavy), Schalter AN/AUS, gespeichert in localStorage `sw_lock`, Standard AN. AN: Angriff und Schild zielen auf nächsten Gegner bis 8 Kacheln (vorher fest 3). AUS: Angriff in Blickrichtung. Arena unberührt (hat eigenes Lock-on). Dateien: `worldcombat.js`, `combat.js`, `css/main.css`, `config.js`/`lang-de.js` (Texte).
- **Getestet (headless Chromium 852x393, tatsächlich):** `node --check` aller JS ok; Start/Neues Spiel ohne JS-Fehler; BFS vom Startpunkt (6,7 Mio. begehbare Kacheln): Brücke, Sakura-Schrein, Gärtnerin, alle 5 Stadt-Händler, Festungsschrein und Veteran erreichbar; keine Stadt-Gebäude auf Wasser/Fels/Weg (13 Strukturen); Händler im Screenshot sichtbar; Lock-Knopf sichtbar, Tipp schaltet AN/AUS, Zustand gespeichert; Zielwinkel: Lock AN = zum Gegner (0,00), AUS = Blickrichtung (-1,57); Knöpfe überlappen nicht.
- **Nicht geprüft:** Gerät/Touch, Kartenbild der neuen Landbrücke (kein Screenshot), Stadt-Optik von Hausreihen (nur Daten), Händler-Dialog/Kauf in der Stadt, Nacht, Regression Speichern/Quests/Inventar diesmal nicht erneut, Gegnerverhalten mit Lock am Gerät.
- **Geändert:** index.html (v82), css/main.css, js/config.js, js/lang-de.js, js/combat.js, js/worldcombat.js, js/world.js, js/ui.js, js/regions-content.js, js/layout-sakura.js, py/make_layout_sakura.py, PROJECT_STATUS.md.

## 0.16.0 – Phase 14 (neue Region 18: Verlassene Festung)
- **Annahme:** Nutzer wählte Region nicht; Festung gewählt (Spec 3, billigste der offenen: Stadt/Festung). 0.15.1: Ausweichen 25 Ki + Meister (altes `shops-data.js` auf GitHub war Ursache) vom Nutzer bestätigt.
- **Welt:** Segment `js/layout-fortress.js` (3400-5000 x 2000-3000, erzeugt von `py/make_layout_fortress.py`): Insel SO (Mitte 4180/2480), Landzunge ab Hauptinsel y~2300, Meerenge mit Brücke bei x 3600-3660. `world.js`: Biome (Steinhof, Fels, Gras), `DENS`, Zone, POI `fortress`; Bauten: Ruinenmauer 49x35 mit Südtor und Lücken, 4 Türme, Bergfried `hall` 14x8 (begehbar), 4 Säulen. **Keine `hut`/`house` ergänzt** (`village.js` zählt per Index).
- **Inhalt (`regions-content.js`, EN+DE):** Schrein `fortress`, 3 Truhen `c_fort1-3` (Essence / 220 Münzen / 3 Eisen), 5 Gegner `e_fort1-4`, `e_fortq` (+2 Wächter automatisch), NPC `n_veteran`, Quests `fort1` (Samurai besiegen) und `fort2` (6 Eisen). Karte: Farbe + Symbol (`ui.js`), Arena `ruins` (`combat-data.js`). Werte **Platzhalter**.
- **Getestet (headless Chromium 852x393, tatsächlich):** Start ohne JS-Fehler; BFS vom Startpunkt: Schrein, NPC, 3 Truhen, 7 Gegner erreichbar (eine Truhe lag zuerst unerreichbar, verschoben, erneut OK); Texte EN+DE vollständig; Screenshots Hof und Landzunge; Quest `fort1` annehmen/abschließen (190 Münzen einmalig, kein Doppelabschluss), `fort2` aktiv/bereit; Speichern + Fortsetzen behält Quest, Gegnerstatus, Münzen.
- **Nicht geprüft:** Gerät/Touch, Brückenoptik, Nacht, Kampf in Region 18 von Hand, Schnellreise zum Festungsschrein, Karte, Regression Inventar/Händler/Skills diesmal nicht erneut, Wegzeit zur Festung (Landzunge ~540 Kacheln).
- **Nicht umgesetzt:** Boss/Festungsherr (wäre neues Boss-Setup), Dorf-Wiederaufbau der Festung, Region Stadt.
- **Geändert:** index.html (v81), js/config.js, js/world.js, js/ui.js, js/combat-data.js, js/regions-content.js, NEU js/layout-fortress.js, NEU py/make_layout_fortress.py, PROJECT_STATUS.md.

## 0.15.1 – Fixes nach Gerätetest 0.15.0
- **Ausweichen kostet mehr Ki:** `D.dodgeKi` 10 -> 25 (**Platzhalter**, `combat-data.js`; Ki-Pool ~100, Spezial 40). Wirkt in Welt, Arena, Rückfall-Duell.
- **Meister fehlt im Tempel (Nutzermeldung, Nacht):** NICHT reproduziert. Headless Chromium, frisches Spiel, Spieler (2290,997): Meister bei (2289.5,996.5) sichtbar, Tag und Nacht (Screenshots), keine JS-Fehler. Vermutung (ungeprüft): altes `shops-data.js`/Cache auf Gerät oder GitHub. Prüfen: `js/shops-data.js` Zeile `n_master` x 2289.5, y 996.5.
- **Getestet:** `node`-Syntax nicht erneut nötig (nur Zahl/Version); Start ohne JS-Fehler. **Nicht geprüft:** Gerät, Ausweich-Gefühl mit 25 Ki.
- **Geändert:** js/combat-data.js, js/config.js, index.html (v80), PROJECT_STATUS.md.

## 0.15.0 – Fixes nach Gerätetest 0.14.0
- **Block-Schild:** Bogen stand an veralteter Richtung (nur eine Seite, teils hinter dem Spieler). `worldcombat.js`: beim Blocken zeigt `P.fa` zum nächsten Gegner (8 Kacheln) sonst in Blickrichtung. Block-Logik selbst war richtungslos und blieb unverändert. Arena unberührt.
- **Häuser begehbar (alle `house`/`hall`/`hut`/`shrine`, w>=4, h>=3):** `world.js add()` setzt `door/d0/d1`; `structSolid`: nur Wandring solid, Tür unten Mitte (1 Kachel bei ungerader, 2 bei gerader Breite), Innenraum frei. `render.js`: Spieler im Haus -> Innenansicht (`interior()`, Boden + Wandring, Platzhalter) wird zuerst gezeichnet, Dach/Fassade verschwinden. Meister steht im Tempel (2289.5, 996.5). Türme (`tower`) und Quest-Zäune unverändert.
- **Ausweichen kostet Ki:** `D.dodgeKi = 10` (**Platzhalter**, `combat-data.js`) x Ki-Kostenfaktor; zu wenig Ki -> Meldung, kein Ausweichen. In `worldcombat.js`, `arena3d.js`, `combat.js` (Rückfall).
- **Getestet (headless Chromium):** Start ohne JS-Fehler (nur Favicon-404); Tür begehbar, Wand/Ring solid, Innenraum frei (Kollisionsabfrage); per Tastatur durch die Tür hinein bis zur Rückwand und seitlich bis zur Wand (Position gemessen); Innenansicht + Meister + Talk-Button (Screenshot). **Nicht geprüft:** Ki-Abzug beim Ausweichen (nur Code, `node`-Syntax), Block-Bogen-Richtung (nur Code), andere Häuser (Dörfer, Hütten, Schreine) einzeln, Kamera/Beleuchtung innen nachts, Gegner/NPCs in Gebäuden, Regression Speichern/Quests/Inventar, Gerät.
- **Bekannt:** Innenraum kleiner Hütten nur 2x1-2x2 Kacheln; Innenansicht springt beim Betreten (kein Übergang); Dorf-Wiederaufbau-Zustand `dmg` zeigt innen nichts.

## 0.14.0 – Phase 12 (Meistertempel + Trainingsplatz)
- **Meistertempel im Steingarten** (Region 10, Mitte-Nord, Zentrum X 2292 / Y 1012): `world.js` Halle `hall` (2283,993, 14x8) + 3 Trainingspuppen `dummy` (2286/2290/2298, 1011). Meister `n_master` von Startdorf nach (2290.5, 1002.5) (`shops-data.js`). Texte angepasst (Schriftrolle: "Meister im Tempel des Steingartens", EN+DE).
- **Trainingsplatz:** `worldcombat.js`: Nähe < 4 Kacheln zu einer Puppe schaltet Kampfmodus/Buttons ein, Hinweis `train_hint`. Treffer (Bogen wie bei Gegnern, inkl. Krit/Konter) zeigen Schaden, Puppe wackelt (`render.js dummy()`), kein Gegenschlag, keine XP/Karma/Belohnung. Puppen solid. Platzhaltergrafik (Phase 29).
- **Skill-Buttons** `cb-s0/1` werden ausgeblendet, solange der Slot leer ist (`worldcombat.js`, `arena3d.js`).
- **Nicht umgesetzt:** Duell-Symbole ▲■▼/Finten (Spec 33.6, vom Nutzer zurückgestellt); Scroll-Entziffern bleibt wie bisher.
- **Getestet (headless Chromium 852x393, tatsächlich):** Start ohne JS-Fehler (nur Favicon-404); 3 Puppen solid an Sollposition; Halle vorhanden; Meister an neuer Position sichtbar (Screenshot); Skill-Buttons `none` bei leeren Slots, `cb-breath` existiert nicht; Kampfmodus startet bei Puppe; Strike/Heavy treffen Puppe (Wackeln `fl` > 0). Nicht geprüft: Meister-Dialog/Entziffern am neuen Ort, Halle von nahem (Screenshot nur Südteil), Gerät/Touch, Karte/Schnellreise-Symbol Tempel, Regression Speichern/Quests/Inventar diesmal nicht erneut, Laufweg vom Startdorf zum Tempel nicht per BFS geprüft.
- **Bekannt:** alte Spielstände: Meister steht dort ohne Zutun neu (Position nicht gespeichert). Garten-Gegner `e_garden*` und Wächter stehen nah am Tempel.

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
Gerätetest 0.18.0 (Phase 19), dann Phase 20 laut `docs/Langzeit.md` Kap. 10. Davor gelisteter Stand: 0.17.0 auf Gerät bestätigt.
