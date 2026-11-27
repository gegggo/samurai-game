## Version 0.37.0 – Mehrstufige Kombinationsschreine (27.11.2026)
- Zusammengesetzter Pruefungsablauf aus zwei vorhandenen Mechaniken: erst drei Bodenschalter im Vorraum aktivieren, danach einen zeitgesteuerten Parcours mit drei Sperren und zwei Checkpoints absolvieren.
- Der Parcours bleibt bis zur Aktivierung aller Schalter physisch gesperrt. Danach gelten die vorhandenen Tier-1-bis-Tier-3-Zeitprofile; Treffer setzen den Spieler auf den letzten Checkpoint zurueck.
- Der Ablauf nutzt denselben 25×17-Raum und die vorhandene Bewegungs-/Schalterlogik. Deutsche und englische Hinweise sowie Fortschrittsanzeige ergaenzt.
- Nur ein Teil der generierten Schreine nutzt diese Kombination; die acht Grundmechaniken bleiben erhalten.
- Regression erweitert: Schalter-Sperre, Freischaltung, Checkpoints, drei Zeitbarrieren und Altarabschluss.
- Spielversion 0.37.0; Cache fuer `js/trials.js` auf v129 und `js/config.js` auf v116. Vollstaendige CI-Pruefung und iPhone-Sichttest stehen noch aus.

## Version 0.36.0 – Schwierigkeitsstaffelung fuer Schreine (27.11.2026)
- Die acht vorhandenen Schrein-Grundtypen bleiben vorerst die Basis: Steinplatten, Laternenfolge, Bodenschalter, Spiegel, Zeit-/Spiegel-Kombination, Labyrinth, Mini-Boss und Bewegung. Ein weiterer Typ wird erst ergaenzt, wenn er eine klar neue Spielmechanik bietet.
- Schrein-Regeln sind jetzt ueber ein darstellungsunabhaengiges Schwierigkeitsprofil definiert. Dieses Profil kann spaeter auch von einer echten 3D-Schrein-Szene verwendet werden.
- Kombinationsschreine erhalten je nach Regionstier 12 / 9 / 7 Sekunden.
- Bewegungsschreine erhalten je nach Tier kuerzere und engere Zeitfenster (2,75 / 2,40 / 2,10 Sekunden offene Passage). Die drei Sperren sind zeitlich auf einen durchgehenden Lauf abgestimmt.
- Textmeldung beim Start des Zeitraetsels ist nicht mehr auf eine feste Sekundenzahl beschraenkt; die sichtbare Zeitanzeige ist massgeblich.
- Neue Regressionen pruefen die drei Schwierigkeitsprofile und einen echten Durchlauf des schwierigsten Bewegungsschreins.
- Spielversion 0.36.0; Cache fuer `js/trials.js` auf v128. Vollstaendige CI-Pruefung laeuft; iPhone-Sichttest steht noch aus.

## Version 0.34.0 – Schreine und groessere Schrein-Pruefungen (27.11.2026)
- Zielverteilung: fuenf Schreine je Region (Regionen 0–25); vorhandene Schreine bleiben erhalten. Neue Positionen werden auf begehbarem Terrain gesucht und mit mindestens 220 Weltkacheln Abstand zu bestehenden Schreinen ausgewaehlt.
- Die zusaetzlichen Schreine werden zur Laufzeit aus den Regionszentren ermittelt; IDs, Namen (DE/EN), Stufe und Speicherbarkeit werden automatisch ergaenzt.
- Alle Schrein-Pruefungen verwenden nun eine groessere 25×17-Kachel-Miniwelt mit drei verschiebbaren Steinen und Druckplatten oder fuenf Laternen in einer Reihenfolge. Die fruehere Duell-Ausnahme am Hoehlenschrein ist in eine Raetselpruefung umgewandelt.
- Der Start-Ladebildschirm bleibt mindestens 4 Sekunden sichtbar (zuvor 1,5 Sekunden).
- Asset-Cache auf v115 und Spielversion auf 0.34.0 angehoben. Vollstaendige CI- und iPhone-Pruefung ausstehend.

## Version 0.33.0 – abgerundete, oval ausgerichtete Aussenkueste (27.11.2026)
- Die Kuestenkontur wird mit einem kreisfoermigen Morphological Closing geglaettet (Radius 16 Rasterzellen = 128 Weltkacheln). Flache Einbuchtungen und eckige Uebergaenge werden aufgefuellt; tiefe Buchten und Seen bleiben erhalten.
- 967 leere Kuestenzellen werden ergaenzt. Jede neue Zelle uebernimmt die naechstgelegene bestehende Region; vorhandenes Land und Seen werden nicht ueberschrieben.
- Der Uebergang bei X987/Y2847 wird geschlossen. X3162/Y2643 und X3183/Y3339 bleiben als Landstellen erhalten.
- Ein gedrehter ovaler Sicherheitsrahmen prueft, dass keine Land-Auslaeufer ausserhalb der ungefaehren NW-SO-Ovalform liegen.
- Neue Dateien: `js/layout-coastline.js` und `tools/make_layout_coastline.py`.
- Regression erweitert: statische Rasterpruefung plus echte Canvas-Pixelpruefung an allen drei Koordinaten. CI und iPhone-Sichttest stehen noch aus.

## Version 0.32.0 – kleine Kartenluecken geschlossen, Gezeitentempel ergaenzt (27.11.2026)
- Drei eingeschlossene Wasserluecken zwischen den bestehenden Regionen geschlossen: 4, 41 und 1.077 Rasterzellen (insgesamt 1.122).
- Die groessere Bucht zwischen Sun Coast, Abandoned Fortress und Verdant Basin wurde als zusammenhaengendes Kuestentempel-Areal in Region 25 integriert; offene Aussenkuesten und Seen bleiben unberuehrt.
- Neuer begehbarer **Gezeitentempel / Tide Temple** mit eigenem Schrein, Karten-POI und Schnellreise-Aktivierung.
- Neue Dateien: `js/layout-gap-temples.js` und `tools/make_layout_gap_temple.py`; der Generator liest alle bestehenden Layouts, erkennt eingeschlossene Wasserkomponenten und fuellt nur diese Nullzellen.
- Regression prueft eine zusammenhaengende Landmasse, keine eingeschlossenen Wasserluecken, Tempelstruktur, POI, Schrein und deutsche/englische Namen.
- Asset-Cache auf v113 und Projektversion auf 0.32.0 angehoben. Vollstaendige CI- und iPhone-Sichtpruefung stehen noch aus.

## Version 0.31.0 – Region 25 schliesst die zentrale Kartenluecke (27.11.2026)
- Neue Region 25 **Verdant Basin / Grünes Becken** zwischen Sun Coast (15), Abandoned Fortress (18), Cloudsteppe (23) und Jade Highlands (24).
- Die neue, organische Landflaeche ist ueber direkte Rasterkontakte an alle vier Zielregionen angeschlossen. Keine Bruecken oder kuenstlichen Verbindungswege.
- Bestehende Landzellen, Regionskerne, Seen und die Mittelpunkte der bisherigen Regionen werden vom additiven Overlay nicht ueberschrieben.
- Neue Dateien: `js/layout-interstice.js` und `tools/make_layout_interstice.py`; der Generator prueft Flaechengroesse, Zusammenhaengigkeit und die vier direkten Regionskontakte.
- Regionsname, deutsches Label, Terrain-Biom und Dichte fuer Region 25 ergaenzt; Regressionstest prueft eine zusammenhaengende Landmasse und die vier Zielkontakte.
- Die Rasterberechnung ergab 7.737 neue Landzellen und direkten Kontakt zu allen vier Gebieten. Vollstaendiger Playwright-Regressionslauf und iPhone-Sichtpruefung stehen noch aus.

## Version 0.30.0 – neue Kartenpositionierung (27.11.2026)
- Fuenf neue Regionen 20–24 gemeinsam suedlich unterhalb der bestehenden Hauptkarte angeordnet; Positionen nach der Nutzerskizze weiter nach Westen verschoben und mittig unter der Suedkueste platziert.
- Weltgrenze auf 8000 × 5200 erweitert. Alte Regionsmittelpunkte bleiben laut Generator erhalten; die beiden bestehenden Erweiterungsregionen 20/21 wurden in die neue suedliche Landmasse integriert.
- Neue Landflaechen sind organisch und direkt angebaut; keine Bruecken oder kuenstlichen Wege.
- Upload-Dateien integriert: js/layout-frontier.js, js/config.js (Version 0.30.0), tools/make_layout_frontier.py und tests/regression.py.
- Lokale Syntaxpruefung bestanden: node --check fuer config.js/layout-frontier.js; py_compile fuer Generator und Regressionstests. Vollstaendiger Playwright-Lauf und iPhone-Test noch offen.

## 0.29.0 – Korrektur der Kartenpositionen
- Nutzerkorrektur nach iPhone-Screenshot: Alle fuenf neuen Regionen (20–24) liegen gemeinsam unterhalb der bisherigen Hauptkarte, nicht mehr rechts/oben.
- Alte Hauptkarte, bestehende Regionspositionen und Kernflaechen bleiben unveraendert.
- Weltkarte nach unten auf 8000 × 5200 erweitert; neue Gebiete liegen im Bereich Y 3.2k–4.6k und sind als breite, organische Landmasse direkt an die suedliche Kuestenlinie angeschlossen.
- Keine Bruecken oder kuenstlichen Verbindungswege. Regionszentren, Layout-Metadaten und Generator synchronisiert.
- iPhone-Test von 0.29.0 noch offen.

## Zwischenstand 0.27.0 – erste Erweiterung um Drachenwall und Tal der Geister
- Die Weltkarte wurde nach Osten und Süden erweitert (8000 × 4000 Tiles).
- Region 20 **Drachenwall / Dragonwall** liegt nordöstlich, Region 21 **Tal der Geister / Spirit Valley** südöstlich.
- Beide Regionen sind als breite, organische Landflächen direkt an die bestehende Landmasse angebaut. Es wurden keine Brücken oder Verbindungswege zwischen den Regionen ergänzt.
- Bestehendes Terrain wird vom neuen Layout nicht überschrieben; die vorhandene 60/40-Übergangsmischung greift an den Regionsgrenzen.
- Neue POI-Kartenbeschriftungen, deutsche/englische Namen, Regionsfarben und regionale Terrain-Generierung ergänzt. Noch keine Dörfer, Tempel, Dungeons oder Quests platziert – dafür bleibt die Fläche frei.
- Statische Landverbindungsprüfung: PASS (eine zusammenhängende Landmasse; beide neuen Regionen mit Landkontakt). JavaScript-Syntax, JSON-Dateien und isolierter Weltmodul-Laufzeittest: PASS. Der vollständige Playwright-Lauf wurde versucht, aber der Browser blockiert in dieser Umgebung lokale Testserver (`ERR_BLOCKED_BY_ADMINISTRATOR`). iPhone-/Touch-Test dieser Kartenerweiterung steht noch aus.

## Map-Überarbeitung 0.28.0 – Regionen 20–24 und Größenanpassung (27.11.2026)

- Die Mittelpunkte aller bestehenden Regionen bleiben unverändert.
- Die Küstenfläche der ursprünglichen Kernregionen 0–16 wurde dort moderat erweitert, wo freies Land direkt angrenzt. Bestehende Kernformen und Seen bleiben erhalten; enge Nachbarregionen werden nicht pauschal in gleich große geometrische Flächen umgeschnitten.
- Drachenwall (20) und Tal der Geister (21) behalten ihre bisherigen Mittelpunkte; ihre Flächen wurden in den gleichen Größenkorridor wie die neuen Regionen gebracht.
- Drei nördliche Regionen ergänzt: Frostwall (22), Wolkensteppe (23) und Jadehochland (24).
- Alle fünf neuen Regionen sind ohne Brücken oder künstliche Wege direkt in dieselbe Landmasse integriert.
- Neue POI-Zentren, EN/DE-Kartennamen und passende Biome ergänzt.
- Kartenübersicht bereinigt: POI-Textbeschriftungen erscheinen erst beim Hineinzoomen; Regionsnamen bleiben in der Übersicht sichtbar.
- Regressionstest prüft, dass alle Landregionen eine einzige zusammenhängende Landmasse bilden und die Erweiterungsregionen direkten Landkontakt haben.
- Statische Kartenprüfung und isolierter Weltmodul-Laufzeittest bestanden. Vollständiger Playwright-Lauf wurde versucht, aber der Browser blockiert in dieser Umgebung lokale Testserver (`ERR_BLOCKED_BY_ADMINISTRATOR`). iPhone-/Touch-Test steht noch aus.

## Phase 26.1 – Sprint-Sperre + zusammenhängende Regionsübergänge (implementiert; vom Nutzer am Gerät getestet)
- Sprint: Bei 0 Ausdauer wird Sprint sofort beendet und gesperrt. Die Sperre bleibt auch bestehen, wenn die Taste weiter gehalten wird. Sie löst sich erst nach Loslassen und mindestens 20% wiederhergestellter Ausdauer. Der Sprintknopf zeigt den Erschöpfungszustand sichtbar an.
- Karte: Die vorhandenen Landflächen sind im Layout bereits zu einer zusammenhängenden Landmasse verbunden; die Übergänge der späteren Regionen waren aber zu abrupt und ließen sie wie einzelne Inseln wirken.
- Übergang: An Grenzen zwischen Erweiterungsregionen (ab Region 17) entsteht nun ein insgesamt 20 Tiles breiter, beidseitiger Übergangsstreifen. Er mischt deterministisch etwa 60% der neueren und 40% der angrenzenden älteren Region in größeren natürlichen Flecken. Küsten und Seen bleiben unverändert.
- Die Terrain-Objekte und die Kartenfarben verwenden dieselbe gemischte Region; Quest-/Gebietserkennung bleibt auf den ursprünglichen Regionsgrenzen.
- Technische Prüfung: Sprint-Erschöpfung und -Wiederfreigabe im isolierten Laufzeittest geprüft; Weltmodul mit den vorhandenen Layout-Segmenten geladen. Der Nutzer hat die Version 0.26.2 inklusive dieser Korrektur am iPhone vollständig getestet.

## Phase 26 – Zelda-Kampf + Welt-Fixes (vom Nutzer am Gerät getestet)
- Boss-Arena: Boss-Leben und Boss-Schaden für Phasenbosse um 50 % erhöht; schwere Unterbrechungen durch Special-Attacken mit 2,2-Sekunden-Sperre gegen Spam abgesichert.
- Zelda-Kampf: freie Kamera per Wischbewegung auf der rechten Bildschirmhälfte; Zielsperre standardmäßig aktiv und per Lock-Taste/Q umschaltbar; Sprint-Lunge bei Vorwärtsbewegung; aufladbarer schwerer Schlag (Heavy halten); Boss-Stürmer-Angriffe mit eigener Reichweite und sichtbarem Ausholen; Spielerbewegung/Ausweichrolle beschleunigt.
- Bambuswald: Bambusobjekte sind durchquerbar; Dichte reduziert; Spawnzone am Bambus-Schrein und Straßenkorridor Richtung Dorf werden freigehalten.
- Lager: Zelte prüfen jede Kachel ihrer gesamten Grundfläche, suchen bei Fels/Überlappung einen freien Platz und werden übersprungen, wenn kein sicherer Standort existiert.
- Welt-Sprint: Shift (PC) oder Touch-Taste, 1,65× Laufgeschwindigkeit, Ausdauerverbrauch und Regeneration; Ausdauerleiste sichtbar.
- Begriffe: sichtbare englische Ki-Bezeichnungen auf Stamina, deutsche auf Ausdauer umgestellt; interne Daten-/Variablennamen bleiben aus Kompatibilitätsgründen `ki`. Das zuvor versehentlich veränderte Item-Label „Travel Staminamono“ wurde auf „Travel Kimono“ korrigiert.
- Technische Prüfung: JavaScript-Syntax und JSON-Dateien geprüft; der Nutzer hat die Phase-26-Version am Gerät vollständig getestet. Die Playwright-Regressionstests (`tests/regression.py`) wurden in dieser Umgebung nicht ausgeführt.

# Samurai Wanderer – Aktueller Projektstatus

Stand: 27.11.2026 · Version **0.36.0** · Cache **v128** (Schrein-Schwierigkeitsstaffelung implementiert; CI-Pruefung ausstehend)

## 0.26.2 (vom Nutzer am iPhone vollständig getestet)
- Menü (z-index 25) verdeckt Sprint/Stamina-HUD.
- Wege (`PATH`) enden vor soliden Gebäuden (`nearSolid`, 1 Tile Rand; Zäune ausgenommen).
- Schreinplattformen verkleinert (Radius 9/8/12/14 → 5/5/7/8).
- Flüsterklamm war durch Felswand (ROCK) von Hauptland getrennt: ROCK an Regionsgrenzen ab Region 17 (40 Tiles) entfernt. Flood-Fill im Node-Test: Hauptland + Flüsterklamm = 1 Komponente.
- Getestet: vom Nutzer auf dem iPhone vollständig abgeschlossen. Der Weg vor Haustüren kann weiterhin an einzelnen Stellen 1 Tile kürzer enden; im Gerätetest ist kein blockierender Fehler aufgefallen.


Stand: 26.11.2026
Aktuelle Codeversion: **0.26.1**
Cache-Version in `index.html`: **v108**
Verbindliche Spezifikation: **Samurai Wanderer – Complete Project Specification v2.1**

## Kurzüberblick
- HTML-/CSS-/JavaScript-Browser-RPG; GitHub Pages als Hosting.
- Zielgerät: iPhone im Querformat; Desktop-Steuerung per WASD/Pfeiltasten.
- Phasenweise Entwicklung; bestehende Funktionen und Spielstände erhalten.
- Phase 25 ergänzt die Pilot-Region Flüsterklamm als Vorlage für spätere Erweiterungen.
- Quest-Fix: Choice-Quests besitzen absichtlich kein Quest-weites `rew`; fehlende Belohnungsobjekte führen nicht mehr zu einem TypeError.

## Aktueller Stand – Version 0.25.0
### Phase 25 – Pilot-Region (Umsetzung; Gerätetest ausstehend)
- Region 19 **Flüsterklamm / Whispering Vale**, nahtlos östlich angebaut; 60/40-Übergang aus neuem und angrenzendem Altterrain, keine künstliche Brücke.
- Räuberlager mit Palisaden, Wachtürmen, Zelten und Käfig.
- Dungeonbereich mit Steinring, Eingang und Pfeilern; Boss nutzt die bestehende Warden-Arena.
- Questkette: Räuberhauptmann besiegen → 3 Heilkräuter bringen → Nebel-Schrein erwecken → Dungeon-Wächter besiegen.
- Vier versteckte Sammeltruhen mit Ressourcen, Ryō und einer Waffe.
- Quest-Anzeige gegen fehlende Belohnungsobjekte abgesichert.
- Gate offen: iPhone-Spielzeit/Spielfluss, Zeit pro Inhalt, XP/Stunde sowie Dichte und Verteilung messen; Ergebnisse für Balance und Phase 26 verwenden.

## Verbindliche Entwicklungsregeln
- Projektspezifikation v2.1 ist maßgeblich.
- Bestehende Funktionen nicht unbeabsichtigt verändern; keine Spielstände löschen.
- Neue Systeme integrieren, keine losen Fragmente liefern.
- Nur die freigegebene Phase umsetzen; spätere Phasen nicht vorziehen.
- Tests und nicht ausgeführte Browser-/Gerätetests klar kennzeichnen.
- Geänderte Dateien einzeln mit Repository-Pfad bereitstellen; ZIP nur zusätzlich auf Wunsch.
- Mobile Bedienbarkeit und Performance haben Priorität.
- Essence ist ausschließlich für den Skilltree bestimmt.


---

## Detaillierte Versionshistorie

## 0.25.0 – Phase 25 Pilot-Region + Quest-Reward-Fix
- Neue Region 19, Räuberlager, Dungeon, Boss, vier Quests und vier Sammeltruhen.
- Choice-Quest-Belohnungen gegen fehlendes q.rew abgesichert.

## 0.24.8 – Item-Icons eingebunden (Cache v102) – Dateien gesendet, ungetestet
- **Icons:** 39 PNG (256×256, eine je Item-ID) nach `assets/images/items/icons/<id>.png`; `js/inventory.js` lädt sie im Inventar-Gitter (Name als Rückfall). Rahmen/Seltenheit bleibt in der UI. Erste Fassung, Zuschnitt prüfen.
- **Geändert:** `js/inventory.js` (Pfad), `js/config.js` 0.24.8, `index.html` v102, 39 neue PNG.
- **Offen:** Icons für Kategorie-Tabs, Ausgerüstet-Leiste; 256 px ggf. auf ~96 px verkleinern (Ladegröße 1,9 MB gesamt).
- **Getestet:** nichts (nur Pfad geändert).

## 0.24.7 – Inventar sortiert + Icon-Slots, NPC-Questmenü (Cache v101) – Dateien gesendet, ungetestet
- **Inventar:** Gitter nach Slot gruppiert (Überschriften Hauptwaffe/Nebenwaffe/Fernkampf bzw. Helm/Rüstung/…/Ressource), innerhalb Seltenheit absteigend, dann Name. Icons: `assets/images/items/<item-id>.png` (ca. 96×96); fehlt die Datei, steht der Name. Icons selbst noch nicht vorhanden (folgen vom Nutzer).
- **NPC-Questmenü (`js/quests.js`):** Fehler behoben: erledigte Quests standen als "– Needs:" ohne Text da (`needText` las `q.req` als Array). Jetzt Gruppen mit Überschrift: Bereit zur Abgabe, neue Quests, In Arbeit, Gesperrt (nur nächste Stufe mit Level/Karma), Erledigt nur als Anzahl.
- **Geändert:** `js/inventory.js`, `css/main.css`, `js/quests.js`, `js/config.js` 0.24.7, `index.html` v101.
- **Getestet:** nur `node --check`. Offen: Gerätetest; `lastExport`-Abbruch der Regression (alt).
- **Nächster Schritt:** Gerätetest 0.24.7; Icons einbinden, sobald geliefert; Kategorie-Tab-Icons.

## 0.24.6 – Inventar+Ausrüstung zusammengelegt, Spezial-Fix (Cache v100) – Dateien gesendet, ungetestet
- **Fix:** Spezialfähigkeiten (Skilltree) warfen `undefined is not an object (n.lvl)`: `data/skills.json` Specials haben kein `type`, Popup/Doppeltipp nahmen den Passiv-Pfad. `js/skills.js` setzt `type:'special'` beim Laden (Daten unverändert). Doppeltipp-Freischalten ging dadurch auch nie.
- **Geändert:** `js/inventory.js` (Tab Ausrüstung entfernt; Inventar mit Kategorie-Tabs Waffe/Rüstung/Ressource, Leiste "Ausgerüstet" je Kategorie, Tippen = ablegen), `js/ui.js` (`equipment` aus `TABS`), `js/config.js` 0.24.6, `index.html` v100.
- **Entfällt vorerst:** Anzeige "Gesamter Ausrüstungsbonus" (früher im Ausrüstungs-Tab).
- **Geplant (später):** Icons für Kategorien-Tabs und Items (besserer Überblick, Zelda-Stil).
- **Getestet:** nur `node --check`; keine Browser-/Gerätetests (auf Wunsch).
- **Nächster Schritt:** Gerätetest 0.24.6 (Specials freischalten, Inventar-Tabs, Ablegen).

## 0.24.5 – Phase 24b: Passive wirken wirklich (Cache v99) – Dateien gesendet, Prüfung ausstehend
- **Problem:** 8 Passiv-Effekte (`range`, `move`, `healWin`, `kiDodge`, `dodgeWindow`, `knockback`, `damageReduction`, `kiDamage`) standen im Baum, wirkten aber nirgends. Stufe I/II/III skaliert schon über `fx`-Werte.
- **Geändert:** `js/progress.js` (`Char.combat()` gibt die 8 Werte aus; `dmgRed` max 60 %), `js/worldcombat.js` (alle 8 aktiv), `js/combat.js` + `js/arena3d.js` (Boss-Arenen: `kiDmg`, `dmgRed`, `dodgeWin`, `kiDodge`, `healWin`), `js/config.js` 0.24.5, `index.html` v99.
- **Wirkung:** Reichweite = Nahkampf-Radius x(1+range); Bewegung = Lauftempo; Heilung = % Max-Leben bei Sieg; Ki-Ausweichen = % Max-Ki bei erfolgreichem Ausweichen; Ausweichfenster = längere Rolle; Rückstoß = stärker bei schweren Treffern (x(1+3·knock)); Schadensminderung = auf jeden Treffer; Ki-Schaden = auf Techniken mit Ki-Kosten.
- **Getestet (tatsächlich):** `node --check` 4 Dateien; Phase-24-Tests; Regression 39/39 headless Chromium (Testkopie mit `index.html` im Root); alle Passive gelernt: 8 neue Werte 0 -> 0,12–0,6, kein NaN, keine pageerror.
- **Nicht geprüft:** Kampfgefühl, iPhone, Arena ohne `range`/`move`/`knock` (nur Welt), Zahlen sind Platzhalter.
- **Offen:** Aktive Techniken weiter generische Moves; Spezialeffekte (`sm_s*` etc.) nicht angebunden.
- **Nächster Schritt:** Gerätetest 0.24.5.

## 0.24.4 – Skilltree-Popup + Tabs zusammengelegt (Cache v98) – Dateien gesendet, Prüfung ausstehend
- **Geändert:** `js/menus.js` (Skilltree: Suchfeld, Filter und "Verbindungen zu anderen Ästen" entfernt; 1x Tippen = Popup mit Name/Text/Voraussetzungen/Kosten, 2x Tippen < 350 ms = lernen bzw. Spezial freischalten (`tapNode`); Skills-Seite hängt `M.character` und `M.karma` an), `css/main.css` (`.skill-pop`, `.skill-pop-x`), `js/ui.js` (Tabs `character`/`karma` aus `TABS`), `js/shrines.js` (öffnet nach Schrein `skills` statt `karma`), `js/config.js` 0.24.4, `index.html` v98.
- **Getestet (tatsächlich):** `node --check`; Playwright 852×393: Popup erscheint, Doppeltipp kauft (SP 6 -> 5), ✕ schließt, Skills-Seite zeigt 4 Abschnitte, 6 Attribut-Buttons, keine pageerror; Screenshot Popup geprüft.
- **Nicht geprüft:** iPhone/Touch (Doppeltipp-Timing), `tests/regression.py`, Scroll der längeren Skills-Seite.
- **Offen:** Popup-Hinweis "Doppelklick: Learn" bei EN/DE gemischt (`T('learn')`); `lastExport`-Abbruch der Regression (aus 0.24.3) weiter ungeprüft.
- **Nächster Schritt:** Gerätetest 0.24.4, dann Phase 24b.

## 0.24.3 – Quest-Tab im Zelda-Stil (Cache v97) – Dateien gesendet, Prüfung ausstehend
- **Geändert:** `js/quests.js` (`SW.Menus.quests`: Liste links mit Status + Geber, Details rechts; Reihenfolge bereit > aktiv > erledigt; Auswahl bleibt in `qsel`, nicht gespeichert), `css/main.css` (`.qlay/.qlist/.qrow/.qdet`), `js/config.js` 0.24.3, `index.html` v97. Keine Textänderung, Dorfkarte unter dem Layout.
- **Getestet (tatsächlich):** `node --check`; Screenshot 852×393 mit 1 aktiver Quest (Layout ok, keine pageerror); Regression bis Offline-Start bestanden.
- **Fehlgeschlagen/unklar:** `tests/regression.py` bricht danach ab: `lastD` in `menus.js` Z.200, `undefined.lastExport` (Test Storage-Box). Nicht von dieser Änderung (menus.js unberührt), Ursache nicht geprüft.
- **Nicht geprüft:** iPhone, Touch, Liste mit vielen Quests (Scroll), Auswahlwechsel per Klick im Browser nur mit 1 Quest.
- **Nicht umgesetzt:** Zelda-"Set destination" (Marker/Ziele zeigt Minimap schon), Quest-Kategorien-Tabs.
- **Nächster Schritt:** Gerätetest 0.24.3; Regression-Abbruch `lastExport` prüfen.

## 0.24.2 – Menü-Layout + Minimap-Randmarker (Cache v96) – Dateien gesendet, Prüfung ausstehend
- **Geändert:** `js/inventory.js` (5 Spalten, min. 20 Felder, leere Felder), `js/menus.js` (Skills: 2 breite Slot-Leisten oben, Technik-/Passiv-Kacheln 3 Spalten; Namen/Texte aus Skilltree-Daten statt fehlender `sk_*`-Keys; Ki-Chip nur bei Kosten > 0), `js/ui.js` (Minimap: Quest-Ziele und eigene Markierungen außerhalb des Kreises als Randpfeil, Markierungen mit Nummer), `css/main.css`, `js/config.js` 0.24.2, `index.html` v96.
- **Fix nebenbei:** Skills-Seite zeigte Rohschlüssel (`sk_sm_a1`) und `Ki NaN` bei Techniken ohne Ki-Kosten (Fehler aus 0.24.0).
- **Getestet (tatsächlich):** `node --check`, Regression 39/39 headless Chromium, Phase-24-Runtime; Screenshots 852×393 von Inventar, Skills, Minimap (Pfeil mit Nummer) geprüft.
- **Nicht geprüft:** iPhone, Touch, kein neuer automatischer Test für Layout/Randpfeil. Randpfeile nur für Quest-Ziele und Markierungen (nicht Schreine/Orte).
- **Offen:** Skilltree-Namen sind deutsch auch bei EN (Daten ohne EN-Text). 0.24.1-Gerätetest weiter offen.
- **Nächster Schritt:** Gerätetest 0.24.2 (Inventar-Grid, Skills, Randpfeil), dann Phase 24b.

## 0.24.1 – Skilltree: Scroll-Limit + Meister-Sperre (Cache v95) – Dateien gesendet, Prüfung ausstehend
- **Geändert:** `js/menus.js` (Pan/Zoom auf Baumgröße begrenzt `clampMap`; Skilltree zeigt Sperrtext bis Meister besucht), `js/skills.js` (`taught`-Flag, `teach()`, `can`/`canSpecial` brauchen `taught`, Save/Load; Alt-Stände mit gelernten Skills gelten als freigeschaltet), `js/shops.js` (Meister erklärt Skilltree beim ersten Besuch, setzt Flag), `js/skills-data.js` + `js/lang-de.js` (Texte), `js/config.js` 0.24.1, `index.html` v95, `tests/regression.py` + `tests/skilltree_runtime_phase24.js` (`teach()` vorab).
- **Getestet (tatsächlich):** `node --check` 5 JS-Dateien, Phase-24-Tests, Regression 39/39 headless Chromium.
- **Nicht geprüft:** iPhone, Scroll-Limit per Touch, Meister-Dialog im Spiel (kein eigener Test für Sperre).
- **Nächster Schritt:** Gerätetest: Skilltree gesperrt, Meister (Steingarten) besuchen, Skilltree offen, Scroll-Grenzen.

## Phase 24 – Skilltree-Grundgerüst (0.24.0, Cache v94) – erste Umsetzung

- **Grundlage:** neue vom Nutzer hochgeladene Projektversion nach Phase 23. Nutzer hat Phase 23 bereits selbst aktualisiert und am Gerät getestet.
- **Umfang:** Lite-Skilltree auf 90 Knoten umgestellt: 60 passive (20 Linien × I/II/III), 20 aktive und 10 Spezialfähigkeiten. Verteilung: Schwertmeister 23, Schattenkrieger 22, Verteidiger 22, Ki-Meister 23.
- **Progression:** passive Levelanforderungen 1/10/20; aktive Level 5–30 nach Schwierigkeitsstufe; Spezialfähigkeiten Level 30–40. Spezial-Freischaltungen: 4 Skilltree, 3 Quest-Flags, 2 Karma, 1 Yin/Yang-Gleichgewicht.
- **Kosten korrekt berechnet:** passive Knoten 120 SP + 120 Essence; aktive Knoten 56 SP + 76 Essence; Gesamt **176 SP + 196 Essence**. Spezialfähigkeiten kosten keine Essence. Bei etwa 65 verfügbaren SP ist Spezialisierung zwingend. Der zuvor genannte Richtwert von ca. 180 Essence war rechnerisch zu niedrig.
- **UI-Grundgerüst:** vier Ast-Auswahlen, verzweigter Knotenaufbau, Suche/Filter, Ein-Finger-Verschieben, Zwei-Finger-Zoom und Detail-/Freischaltansicht. Zwei aktive Slots bleiben bestehen. Optionale Astverbindungen werden angezeigt.
- **Technik-Integration:** aktive Knoten verwenden vorläufig vorhandene Standard-Kampfaktionen. Scroll-Techniken (`windcut`, `mountain`) und Boss-Geheimtechniken werden nicht als Skilltree-Moves dupliziert. Individuelle Moves/Animationen und Spezialeffekte sind noch Platzhalter.
- **Speicher:** alte Skilltree-Knoten-IDs werden beim Laden nicht übernommen; `spent` wird aus den neuen erlernten Knoten berechnet. Das entspricht der Freigabe, alte Test-Spielstände zu ignorieren. Andere Spielstandssysteme und Ressourcen bleiben unangetastet.
- **Geändert:** `data/skills.json`, `js/skills.js`, `js/menus.js`, `js/skills-data.js`, `js/config.js`, `css/main.css`, `index.html`, `docs/Langzeit.md`, `tests/skilltree_phase24.py`, `tests/skilltree_runtime_phase24.js`, `PROJECT_STATUS.md`.
- **Getestet:** `node --check` für alle vier geänderten JS-Dateien; JSON-Prüfung; neuer statischer Phase-24-Test (90 Knoten, Astverteilung, Voraussetzungen, Move-Referenzen, Crosslinks und Kosten) sowie Node-Runtime-Smoke-Test (Lernen, Voraussetzungen, Spezialfreischaltung, Quest-Flag, Save/Load und 2 Slots) bestanden.
- **Nicht erfolgreich ausführbar:** Browser-Regression und Browser-Validator scheitern in dieser Laufumgebung beim Öffnen lokaler URLs mit `ERR_BLOCKED_BY_ADMINISTRATOR`. Daher kein echter Laufzeit- oder iPhone-Test.
- **Noch offen:** Spezialeffekte und mehrere passive Werte (z. B. Reichweite, Bewegung, Heilung nach Sieg, Ki nach Ausweichen, Rückstoß) müssen an die Kampf-/Weltlogik angebunden werden. Die aktiven Techniken nutzen aktuell teils generische vorhandene Aktionen; deren endgültiges Verhalten ist noch nicht umgesetzt.

# PROJECT_STATUS (Stand 0.24.0, Cache v94)

**Repo:** `index.html` im Root, `css/main.css`, `js/*.js`, `data/*.json`, `assets/`, `docs/`. Canvas-2D-Prototyp, GitHub Pages, iPhone Querformat, keine externen Abhängigkeiten.
**Aktuell:** Phase 24 begonnen; Skilltree-Grundgerüst implementiert. Phase 23 wurde laut Nutzer bereits aktualisiert und am Gerät getestet.
**Arbeitsregeln:** nur freigegebene Phase; geänderte Dateien einzeln mit Repository-Pfad liefern; bestehende Systeme erhalten; nichts als getestet melden, was nicht lief.

## 0.22.3 – Karte: Gelände-Detail beim Zoomen (Cache v92) – Dateien gesendet, Prüfung ausstehend
- **Gerätetest 0.22.2 (Nutzer):** Minimap-Marker funktionieren. Wunsch: große Karte mit Details wie Minimap, damit Marker genauer sitzt.
- **Geändert:** `js/ui.js` `drawMap`: ab Zoom > 2 wird das Geländebild der Minimap (`ov`) über das Regionsbild (`ov2`) eingeblendet (voll bei Zoom 3,5). `js/config.js` 0.22.3, `index.html` v92.
- **Getestet (tatsächlich, headless Chromium):** Regression 36/36 (1 Lauf), `node --check ui.js` ok.
- **Nicht geprüft:** Optik (kein Screenshot), iPhone, ob Schwellen 2 / 3,5 passen.
- **Nächster Schritt:** Gerätetest 0.22.3, dann Freigabe Phase 23 (Wirtschaft).

## 0.22.2 – Marker auf Minimap (Cache v91) – Dateien gesendet, Prüfung ausstehend
- **Gerätetest 0.22.1 (Nutzer):** Block rechts OK, Tier 3 passt erstmal. Wunsch: Marker auch auf Minimap.
- **Geändert:** `js/ui.js` `drawMini`: gelber Kreis mit Nummer je Marker (`U.pins`), wie auf der Karte. `js/config.js` 0.22.2, `index.html` v91.
- **Getestet (tatsächlich, headless Chromium):** Regression 36/36 (1 Lauf), `node --check ui.js` ok.
- **Nicht geprüft:** Marker-Zeichnung auf Minimap (kein eigener Test/Screenshot), iPhone.
- **Nächster Schritt:** Regression + Gerätetest 0.22.2, dann Freigabe Phase 23 (Wirtschaft).

## 0.22.1 – Nutzerwünsche nach Gerätetest (Cache v90) – Dateien gesendet
- **Nutzer-Rückmeldung:** Tier 2 (Moonlit Grove) und Tier 3 (Frostpeaks) besiegt, Tier 3 zu leicht. Block-Button beim Laufen unpraktisch. Karten-Markierungen gewünscht (Zelda-Stil).
- **Tier 3 stärker:** `data/balance.json` tierMul 3: Leben 1,5 -> 1,7, Schaden 1,3 -> 1,5 (~+15 %). Tier 1/2 unverändert. XP/Münzen Tier 3 bleiben 1,5.
- **Block rechts:** `css/main.css` `#cb-block` jetzt rechts über Special (76 px, Safe-Area), vorher links unter Dodge.
- **Karten-Markierungen:** `js/ui.js`: langes Drücken (0,55 s) auf der Karte setzt gelben nummerierten Marker (max. 10); Tipp darauf -> Leiste "Markierung entfernen / Abbrechen" (gleiche Leiste wie Schnellreise). Gespeichert als `pins` im Spielstand (`js/progress.js`, additiv, alte Stände = keine Marker, kein Schema-Wechsel). Texte EN/DE (`config.js`, `lang-de.js`). Keine Anzeige auf Minimap/Kompass (offen, falls gewünscht).
- **Getestet (tatsächlich, headless Chromium 852x393):** Regression 36/36 (1 Lauf, neuer Test: Pins laden/speichern/Limit, Block rechts); Mausklick-Test: Langdruck setzt Marker, Tipp zeigt Leiste, Entfernen leert; Screenshots Kampfansicht (Block rechts oben, überlappt nichts) und Karte (Marker sichtbar).
- **Nicht geprüft:** Langdruck mit Finger am iPhone (Scrollen/Zoomen-Konflikt), Tier-3-Gefühl nach Buff, Block-Position auf anderen iPhone-Größen/Hochformat.
- **Nächster Schritt:** Gerätetest 0.22.1, dann Freigabe Phase 23 (Wirtschaft).

## Phase 22 – Balance-Kern (0.22.0, Cache v89) – Dateien gesendet, Gerätetest offen
- **Freigabe:** Nutzer 22.11.2026. Grundlage: `docs/Langzeit.md` Kap. 4/10/11 (Lite Cap 50, `need = 36*l`).
- **Neu:** `data/balance.json` (in `data/index.json`): `edition` (lite), `editions` (Cap lite 50 / pc 100), `xpMul` 36, `tierMul` je Tier 1-3 (`hp`, `dmg`, `xp`, `coins`). Quelle der Wahrheit für diese Zahlen.
- **Geändert:** `js/progress.js` (`C.MAX` aus Edition, `C.need = 36*l`); `js/combat.js` (`K.tm(spot)`; Gegner tragen `tier`; Wächter erben Schrein-Tier; Belohnung XP/Münzen x Tier; Arena-Leben/-Schaden); `js/arena3d.js`, `js/worldcombat.js` (Leben/Schaden x Tier); `data/skills.json` (Geheimtechnik-Level x 50/30: cross 33, ironwill 30, stillwater 37, oniwrath 42); `tools/validate_data.py` (+ balance-Prüfung); `tests/regression.py` (+2, jetzt 35); `js/config.js` 0.22.0; `index.html` v89.
- **tierMul-Werte (Platzhalter, ändern in `balance.json`):** Tier 1 = 1/1/1/1 (Startgebiet unverändert) | Tier 2 = Leben 1,2, Schaden 1,15, XP/Münzen 1,25 | Tier 3 = 1,5 / 1,3 / 1,5 / 1,5. Lager in Western Woods (Tier 1) damit leicht.
- **Folgen:** Level-Kurve flacher (L10 braucht 360 statt 847 XP): Weltinhalt (~11 000 XP) reicht jetzt bis ~Level 24 statt 16. Bestehende Spielstände bleiben gültig (Level <= 30, XP wird beim nächsten Gewinn neu verrechnet).
- **Bewusst nicht gemacht:** Essence-Kosten/-Angebot (heute 31 Kosten / 43 Angebot): Zielwerte (~120 / ~90-100) gelten für ~60 Knoten, die es erst in Phase 24 gibt; Umstellung dort. Skill-Punkte unverändert (1/Level).
- **Getestet (tatsächlich, headless Chromium 852x393):** Regression 35/35 (1 Lauf): Cap 50, Summe XP bis L50 = 44 100, tierMul, XP-Wirkung Tier 3 = 1,5 x; Validator 0 Fehler.
- **Nicht geprüft:** Kampfgefühl mit tierMul am Gerät (Tier-2/3-Gegner jetzt härter), Boss-Arena mit Multiplikator, Geheimtechnik-Erwerb bei Level 30-42, Preis/Dauer bis Level 50.
- **Nächster Schritt:** Gerätetest 0.22.0, dann Freigabe Phase 23 (Wirtschaft).

## Phase 21 – Performance + Tests (0.21.0, Cache v88) – Dateien gesendet, Gerätetest offen
- **Freigabe:** Nutzer 22.11.2026. Entscheidungen: Spawn-Gitter nur bei Bedarf (nicht gebaut); `docs/` bleibt aus dem Repo; Render-Trennung (Teil D) weggelassen (nur Doku, Nutzer: unnötig).
- **Geändert:** `js/combat.js` neu `K.spot(id)` (Index ID -> Gegnerpunkt, baut sich bei geänderter Anzahl neu auf); `js/quests.js` und `js/progress.js` nutzen ihn statt linearer Suche. `js/config.js` 0.21.0, `index.html` v88.
- **Tests (`tests/regression.py`, jetzt 33):** +9: Truhe einmalig, Händler kaufen/verkaufen, Schmied-Upgrade, Schnellreise, Multitouch (Joystick + 2. Finger), Questkette elder7-9->3, Banditenlager per BFS erreichbar, Gegner-Index, Daten-Validator. Offline-Test wartet jetzt auf alle Datendateien + Kernskripte im Zwischenspeicher (vorher Flackern).
- **Getestet (tatsächlich, headless Chromium 852x393):** Regression 33/33 (1 Lauf). Frame-Zeit: 232 vs. 1232 Gegner je 16,6 ms (60-fps-Grenze, kein Engpass; kein iPhone). `input.js` gelesen: keine Änderung nötig.
- **Nicht geprüft / weiter offen:** iPhone-Leistung; Boss-Arena/Niederlage + Rückkehr, Kampfbuttons, Safe Areas, Dorf-Wiederaufbau, Tag/Nacht, Karte (weiter nur manuell); Spawn-Gitter erst, wenn Gerät/Mehrinhalt es braucht.
- **Nächster Schritt:** Gerätetest 0.21.0, dann Freigabe Phase 22 (Balance-Kern).

## Phase 20 Teil 2 – Generator-Gerüst Regionen (Version bleibt 0.20.2, kein Spielcode geändert)
- **Freigabe:** Nutzer 22.11.2026 (0.20.2 laut Nutzer am Gerät geprüft, ohne Protokoll).
- **Neu:** `tools/new_region.py ID REG "Name EN" "Name DE" CX CY RX RY [--link X1,Y,X2] [--tier N]`. Erzeugt `js/layout-ID.js` (Insel-Segment, optional Landstreifen + Weg zu anderer Insel), `js/region-ID.js` (Texte `reg_/poi_/shr_` EN+DE), Schrein in `data/world.json` (`ed`/`tier`), Script-Tags in `index.html`. Bricht ab bei Überlappung mit bestehendem Land oder doppelter ID. `sw.js` liest die Tags selbst.
- **Danach manuell (je Region):** Inhalt (Gegner, Truhen, NPCs, Quests) in `data/*.json`, Bauten in `js/world.js` (Muster `if (CEN[18]) {...}`, keine `hut`/`house` wegen `village.js`), Texte ergänzen, `python3 tools/validate_data.py`, Cache-Version erhöhen. Biome/`DENS`/Kartenfarbe haben Standardwerte (Gras, 0.05, Farbe Region 0).
- **Getestet (tatsächlich, headless Chromium):** Dummy-Region 19 bei (300,2800): Region/Gelände/Meer korrekt, Texte EN+DE und Schrein geladen, Validator 0 Fehler, keine JS-Fehler, Überlappung wird abgelehnt (2 Fälle). Dummy danach entfernt, Repo sauber.
- **Nicht geprüft:** `--link` (Landstreifen) im Spiel, Kartenansicht der neuen Region, Gerät.
- **Bekannt:** `tools/make_layout*.py` und `move_content.py` schreiben alte JS-Daten (nicht mehr nutzen). `tools/new_region.py` setzt keine Biome-Sonderregeln.
- **Nächster Schritt:** Freigabe Phase 21.

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
## Kartenkorrektur – Regionen 20–24
- Kleine schwarze Wasserluecken direkt zwischen den fuenf suedlichen Regionen werden im Umkreis von 8 Rasterzellen mit dem jeweils naechsten Regionslabel geschlossen.
- `js/layout-frontier.js` und `tools/make_layout_frontier.py` enthalten die Anpassung.
- Das aeussere Meer bleibt erhalten; alte Regionen und Seen werden nicht aufgefuellt.
- Regressionstest und iPhone-Sichtpruefung fuer diese Aenderung stehen noch aus.
