# PROJECT_STATUS

**Cache-Version:** v43 (Spielversion 0.9.4)
**Aktuelle Phase:** 0.9.1 = Balancing-Runde (Essence vereinheitlicht, Karma/Yin-Yang geprüft, Autosave Gebietswechsel, 2 neue Regionen). Status: Dateien gesendet, Browser-Tests bestanden, Gerätetest offen. Davor Phase 6 (0.9.0, Gerätetest offen). Davor Phase 8 – Fortschrittssysteme (erste Erweiterung umgesetzt). Phase 7a–7d integriert und im Browser stabil geprüft (siehe unten), Gerätetest offen.

**Repository:** `index.html` im Root, `css/main.css`, JavaScript unter `js/`, Spezifikation unter `docs/`.

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
- Weitere Regionen: nur Hain (klein) vorhanden; größere Erweiterung braucht Konzept/Freigabe.
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
Gerätetest iPhone (7a–7d, Phase 6, Phase 8, 0.9.1: Regionen Garten/Marsch, Autosave). Danach Konzept für neue Regionen abstimmen und Karma-Weltreaktionen/Yin-Yang-Balancing ergänzen.
