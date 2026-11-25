# Prompt: Weltumbau nach World Draft (Samurai Wanderer)

Arbeite im Ponytail-Modus (kleinste vollständige Änderung, nur geänderte Dateien liefern, knappe Antworten). Antworte auf Deutsch.

## Anhänge, die ich mitschicke
- `Samurai_game.zip` (aktueller Repo-Stand, Version 0.9.15, cache v54)
- `IMG_5792.jpeg` = World Draft (1179x933), Quelle der Weltform
- `Ponytail.zip` (Skill)

## Ziel
Die Spielwelt soll wie das World Draft aussehen: Insel mit Meer, Regionen wie im Bild, Straßen zwischen Schreinen, Flüsse, See. Alles außerhalb der Insel ist Meer: schwarz, nicht betretbar. Karte, Minimap und Schnellreise zeigen die echte Welt.

## Entscheidungen (von mir freigegeben)
1. **Weltgröße:** Rechteck 5000 x 3000 Kacheln als Grundmaß. Breite und Höhe als getrennte Konstanten (`CFG.W`, `CFG.H`), leicht vergrößerbar, weil ich später weitere Regionen anhänge. Die Insel wird aus dem Draft gleichmäßig skaliert (Seitenverhältnis erhalten, etwa an der Höhe ausgerichtet). Der Rest bleibt Meer und ist für spätere Regionen reserviert.
2. **Karst Spires** fehlt im Draft: Südosten, zwischen Iron Peaks und Hollow Caves. Das Bergdorf liegt auf den Spires. Es sollen **5–6 Spires** sein (jetzt 4: Bergdorf, Himmelstempel, Windturm, Wolkenturm; 1–2 neue ergänzen). Brücken zwischen den Spires, Schreine, NPCs, Gegner, Truhen bleiben und werden angepasst.
3. **Alte Spielstände** müssen nicht kompatibel sein. Die Spielerposition darf auf den Start zurückgesetzt werden. Truhen-, Quest- und andere Fortschritts-IDs nach Möglichkeit behalten.
4. **Ablauf:** erst bauen (Teile A, B, C), dann teste ich auf dem iPhone.

## Technischer Plan
**Teil A – Layout und Weltform**
- Werkzeug `tools/make_layout.py`: liest das Draft-Bild, ordnet Pixel den Regionen zu, entfernt die Beschriftungstexte (Mehrheitsfilter), erzeugt `js/layout.js` mit Regionsgitter (z. B. Zelle 16 Kacheln, RLE-komprimiert), Meer, See sowie Straßen und Flüssen als Linienzüge.
- Regionsfarben im Bild (grob): Frostpeaks weißgrau, Bamboo Forest grün, Mountain Shrine graubraun, Ember Crater rotbraun, Hinode olivhell, Moonlit Grove dunkelgrün, Mirror Lake blaugrün (See blau), Stone Garden grau, Iron Peaks grau, Western Woods dunkelgrün, Reed Marsh moosgrün, Forgotten Ruins graubraun, Bandit Camp braun, Hollow Caves dunkelviolett, Dust Dunes sandgelb, Sun Coast hellsand, Meer dunkelblau. Karst Spires zeichnet das Skript als eigenes Polygon im Südosten dazu.
- Regions-IDs und Textschlüssel bleiben unverändert (`reg_0` … `reg_16`, EN und DE).
- `world.js`: `regionAt` und `terrain` lesen das Layout statt Raster und Kreise. Neue solide Kachel SEA (Meer, schwarz). Küste mit Sandsaum. Biome (Gelände je Region) bleiben procedural wie jetzt. See und Flüsse kommen aus dem Layout, Wege aus den Straßenlinien, Brücken dort, wo Wege Wasser kreuzen.
- Breite und Höhe getrennt in `config.js`, `world.js`, `ui.js` (Kartenbild, Minimap, Zoom, Antippen von Schreinen, Positionsanzeige) und `progress.js`. Kartenbild: Meer schwarz, helle Küstenlinie.
- Start (`spawn`) und Hinode-Dorf-Mittelpunkt aus dem Layout (Hinode-Region).

**Teil B – Inhalte umziehen** (ca. 120 Koordinaten in `combat-data.js`, `shops-data.js`, `items-data.js`, `quests-data.js`, `shrines-data.js`, `village.js`, `trials.js`, `world.js`)
- Skript verschiebt jeden Eintrag per Region: alte Region -> Mittelpunkt der neuen Region, relative Lage bleibt. Danach auf nächste freie Landkachel einrasten (kein Wasser, Fels, Mauer, Objekt).
- Dorf, Schrein-Plattformen, Prüfungs-Eingänge und Strukturen werden um die neuen Mittelpunkte gebaut. Nichts darf im Wasser oder Meer liegen.
- Erreichbarkeitstest (Node, Suche vom Start): alle Schreine, Orte, NPCs, Gegner, Truhen erreichbar; Landfläche zu über 95 % erreichbar.

**Teil C – Feinschliff**
- Straßen und Flüsse lesbar, Brücken passen, Karst-Spires mit Dorf und Brücken fertig, Beschriftungen auf der Karte überlappen nicht (Windspire / Sky Temple / Cloud Spire).

## Erweiterbarkeit (Pflicht beim Umbau)
- Ursprung (0,0) oben links. Alte Koordinaten bleiben für immer gültig. Die Welt wächst nur nach rechts und unten: `CFG.W` und `CFG.H` erhöhen, neue Regionen dort ergänzen. Wachstum nach links oder oben nur über eine feste Konstante `CFG.OX/OY` (Offset), niemals durch Verschieben der alten Orte.
- Layout additiv: Basis in `js/layout.js`, jede spätere Erweiterung als eigenes Segment (z. B. `js/layout-snow.js`) mit Rechteck, Regionsfeldern, Straßen und Flüssen. `regionAt` und `terrain` fragen alle Segmente ab. Außerhalb aller Segmente ist Meer.
- Neue Regionen werden als zusammenhängende Landmasse an die bestehende Karte angebaut, nicht über eine schmale Brücke oder eine künstliche Meerenge. Der Anschluss bekommt einen organischen Korridor von etwa 10–20 Layout-Kacheln Breite. In einer Übergangszone werden ungefähr 60 % der Kacheln der neuen Region und 40 % der angrenzenden alten Region zugeordnet. Neue Layout-Segmente dürfen dafür ältere Landzellen gezielt überlagern; spätere Segmente haben dort Vorrang, leere Overlay-Zellen fallen auf ältere Segmente zurück. Brücken bleiben für Flüsse, Schluchten und echte Hindernisse erlaubt.
- Gelände bleibt procedural und wird nicht als Kachelfeld gespeichert. Die Weltgröße kostet dadurch kaum Speicher.
- Kartenbild und Minimap skalieren mit `CFG.W/H`. Bei großer Welt Kartenauflösung (`OV`) automatisch erhöhen, damit das Kartenbild klein bleibt. Aufbau weiter schrittweise, ohne den Start zu blockieren.
- Alle Ortslisten (Schreine, NPCs, Gegner, Truhen) nutzen absolute Koordinaten. Neue Region heißt nur: neue Einträge anhängen.
- Spielstand speichert absolute Koordinaten. Alte Spielstände bleiben nach einer Erweiterung gültig.

## Regeln (aus der Spec, bleiben gültig)
- Bestehende Funktionen und Systeme nicht entfernen. Systeme getrennt halten (XP, Skillpunkte, Essence nur Skilltree, Karma, Yin/Yang, Münzen, Ressourcen).
- Keine neuen Systeme ohne vorherigen Vorschlag. Mobile Performance vor Optik. Texte EN und DE.
- Keine Spielmechanik ändern. Nur Welt, Karte, Koordinaten.
- Nach jedem Teil: Version erhöhen (`config.js`), Cache-Nummer in `index.html` erhöhen, `PROJECT_STATUS.md` aktualisieren.
- Nach jedem Teil Tests: `node --check` für alle JS, Erreichbarkeit, Chromium 852x393 (Start, Neues Spiel, Karte, Schnellreise, keine JS-Fehler). Nicht Geprüftes ausdrücklich als ungetestet nennen.
- Liefere nur geänderte Dateien plus Skript (`tools/make_layout.py`, `js/layout.js`) und sage kurz, welche ich in GitHub ersetze.

## Wenn Tokens knapp werden
Beende den laufenden Teil sauber, liefere die Dateien und schreibe in `PROJECT_STATUS.md` genau: erledigt, offen, nächster Schritt, bekannte Fehler. Der nächste Chat setzt dort nahtlos fort.
