# PROJECT_STATUS

**Cache-Version aktuell:** v30 (Spielversion 0.6.1)

**Aktueller Stand:** Phase 5c (Grobgerüst) – Dorf-Wiederaufbau Hinode umgesetzt. 5a/5b vom Nutzer als funktionierend bestätigt. 5c noch nicht auf dem Gerät getestet.

**Repository-Struktur:** `index.html` im Root, Stylesheet unter `css/main.css`, JavaScript-Module unter `js/`. Diese Struktur ist korrekt; die vorherige Annahme einer flachen Ablage war falsch.

**Vorhandene Phasen:** Phase 0–3, 4a, 4b und 5a laut bisheriger Projekt-Dokumentation abgeschlossen. 5a wurde laut Statusdatei noch nicht auf dem iPhone vollständig getestet.

**Phase 5b – vorhanden:**
- Quest-NPCs: Dorfältester, Einsiedler und Fischer.
- Quests: Bandit am Dorftor, Zaun reparieren (6 Holz abgeben), Banditenboss, Bergschrein erwecken, Medizin für den Sohn des Fischers.
- Queststatus, Voraussetzungen, Belohnungen, XP, Münzen, Essence und Karma.
- Essence wird nur im Skilltree ausgegeben.

**Änderungen im Patch von Phase 5b (historisch, damals v18):**
- Nach Rückkehr aus einem anderen Tab bzw. nach `pageshow`/`visibilitychange` werden Canvas-Größe, Eingabezustand und Zeitbasis neu synchronisiert. Zusätzliche verzögerte Größenmessungen berücksichtigen iOS-Viewport-Änderungen.
- Die Hauptschleife wird bei einem Frame-Fehler nicht dauerhaft beendet; der Fehler wird in der vorhandenen Fehleranzeige ausgegeben.
- Nach Abschluss von „Rebuild the Fence“ wird ein sichtbarer, kollidierender Zaun südlich des Dorfes gebaut. Bei geladenem Spielstand wird der Zaun aus dem abgeschlossenen Queststatus rekonstruiert.
- Die rechte Kartenseitenleiste einschließlich Zoomknöpfen und Erklärungstext wurde entfernt. Die Karte nutzt die größere verfügbare Fläche. Erweckte Schreine können direkt durch Antippen zur Schnellreise verwendet werden; nicht erweckte Schreine lassen sich weiterhin auswählen.
- Cache-Version damals auf v18 erhöht (aktuell v19, siehe oben).

**Noch zu testen:**
- iPhone: App/Tab wechseln und zurückkehren; prüfen, ob die Welt wieder sichtbar und steuerbar ist.
- iPhone: Karte öffnen, Größe/Pinch-Zoom/Verschieben und Schnellreise prüfen.
- Quest „Rebuild the Fence“ abschließen; Zaun muss sichtbar sein und Kollision haben.
- Spiel nach Zaunbau neu laden; Zaun muss erhalten bleiben.
- Alte Spielstände laden und sicherstellen, dass kein Zaun erscheint, solange `elder2` nicht abgeschlossen ist.

**Noch nicht behauptet/abgenommen:** Keine vollständige iPhone-Prüfung; keine umfassende Regression aller bestehenden Systeme. Phase 5c Dorfbefreiung und weitere Questtypen sind weiterhin offen.


**Phase 5c – Dorf-Wiederaufbau (neu, v19):**
- `js/village.js`: Stufe wird nur aus Quest-Status abgeleitet (kein neuer Spielstand-Eintrag, alte Spielstände bleiben gültig).
- Stufen: 0 besetzt, 1 befreit (elder1), 2 Erste Hilfe (elder4), 3 Häuser repariert (elder5), 4 Schmiede (elder6), 5 vollständig (+ Zaun elder2).
- Neue Quests beim Dorfältesten: elder4 (3 Kräuter), elder5 (10 Holz), elder6 (5 Eisen). Belohnungen: Münzen, XP, Karma, 1 Common Essence bei elder6.
- Sichtbar: 8 Dorfhäuser beschädigt (Loch im Dach, Trümmer); Stufe 3: 4 repariert; Stufe 5: alle. Bis zu 3 Dorfbewohner kehren zurück (Stufe 2, 3, 5, nur Optik, nicht ansprechbar). Schmiede glüht ab Stufe 4.
- Quest-Menü zeigt Dorfstatus und nächstes Ziel. Banner bei Stufenaufstieg.
- Geändert: village.js (neu), quests-data.js, quests.js, shops.js, render.js, index.html (v19).
- Logik der Stufen per Skript getestet (Stufen, Schäden, Bewohner, Idempotenz). Gerät/Browser: UNGETESTET.

**Bewusst nicht enthalten (Vorschlag später):** Händler geschlossen/wiedereröffnet (Quests brauchen Händlerwaren), weitere Dörfer, Händlerangebote als Belohnung, mehrere Gegner bei Befreiung.


**Projektstruktur (Strukturierung, v19 unverändert):** `docs/` mit Spezifikation und `.gitignore` ergänzt. Code, Spielmechanik und `?v=19` unverändert. `assets/` und `data/` folgen bei erstem Inhalt. Design/UI später. Vor dem Commit Git-Tag `backup-v19` auf den bisherigen Stand setzen.


**Phase 6 – Aufteilung (um Aufwand klein zu halten):**
- 6a Sprache (Deutsch): 6a-1 Grundlage + Chunk 1 (v20, fertig), 6a-2 Gegenstände/Skills/Händler, 6a-3 Quests/Dialoge/Schreine.
- 6b Speichersystem erweitern (Spielerposition, Versionsnummer/Migration, Prüfung auf Verlust).
- 6c Performance, Fehlerbehebung, Mobile-Tests.
- Hinweis: 5c ist weiterhin nicht auf dem Gerät getestet.

**Phase 6a-1 (v20):** Einstellungen-Tab aktiv mit Sprachwahl EN/DE (Wechsel sofort, gespeichert unter `sw_lang`, getrennt vom Spielstand). Neu `js/lang-de.js` (Menü, Regionen, Orte, Kampf, Gegner, Stats, Zeit, Karma-Rang, Yin-Yang). Fehlende Schlüssel fallen auf Englisch zurück. ~110 von 390 Schlüsseln übersetzt. Geändert: config.js, ui.js, menus.js, main.css (`.btn.on`), index.html, lang-de.js (neu). Getestet (Headless): Wechsel, Tab-Labels, Persistenz nach Reload, keine Konsolenfehler. Gerät: UNGETESTET.

**Phase 6a-2 (v21):** Deutsch für Gegenstände (Namen, Beschreibungen, Seltenheit, Effekte, Slots), Händler/Schmied/NPC-Namen, Skills (Namen, Beschreibungen, Voraussetzungen), Essence-Arten, Geheimtechniken. Nur `js/lang-de.js` (Chunk 2) und Cache-Version geändert. Offen: 6a-3 (Quests, Dialoge, Schreine, Dorf).

**Phase 6a-3 (v22):** Deutsch für Dialoge, Quests (Namen, Texte, Ziele), Dorf Hinode, Schreine, Status. Alle 390 Texte haben nun eine deutsche Version (Skript-Abgleich). Nur `js/lang-de.js` und Cache-Version geändert. Fest im Code verbleibende Texte (z. B. „MAX“, „P4“-Marker) sind nicht übersetzt. Phase 6a damit abgeschlossen. Gerät: UNGETESTET. Nächste: 6b Speichersystem.

**Phase 6b – Speichersystem (v23):** Spielstand-Format v2 (gleicher Speicherschlüssel `sw_progress_v1`). Neu: Spielerposition (alle 5 s Spielzeit nach Bewegung, außerdem beim Schließen/Tabwechsel), Spielversion im Stand, Migration v1→v2 (alte Stände bleiben gültig, Position fehlt = Startpunkt), Sicherheitskopie des letzten gültigen Standes (`sw_progress_v1_bak`) mit Rückfall bei defektem Stand, Ladeschutz je Teilsystem (ein defekter Teil blockiert den Rest nicht), Positionsprüfung (ungültig oder in Wand = Startpunkt), Stände mit neuerer Version werden ignoriert, nicht überschrieben. Bereits gespeichert: Level/XP, Münzen, Ressourcen, Essence, Yin/Yang, Karma, Inventar, Ausrüstung, Fähigkeiten, Skilltree, Quests, entdeckte Orte, Schreine, Truhen, Boss-/Gegnerfortschritt, Tageszeit; Dorffortschritt und Zaun werden aus dem Queststatus abgeleitet. Sprache getrennt (`sw_lang`).
- Geändert: progress.js (SW.Save), main.js (Save.tick), index.html (v23).
- Headless getestet: Position, Reload, v1-Migration, defekter Stand → Kopie, ungültige Position, Zukunftsversion, defektes Teilsystem. Gerät/iPhone (Schließen der App, Tabwechsel): UNGETESTET.
- Bekannt: Lebenspunkte/Ki mitten im Kampf werden nicht gespeichert (Kampf startet beim Laden neu). Kein „Spielstand löschen“-Knopf (wäre neue Funktion, erst Vorschlag).

**Phase 6c + Spielstand löschen (v24):**
- Einstellungen: „Spielstand löschen“ mit Rückfrage (Löschen/Abbrechen). Löscht Hauptstand und Kopie, schreibt danach nicht mehr, lädt neu. Sprache bleibt. Danach beginnt ein neues Spiel. (progress.js, menus.js, config.js, lang-de.js)
- Fehler behoben: deutscher Knopftext „Ausweichen“ lief über den runden Kampfknopf (main.css).
- Prüfungen (Headless-Chromium, simulierte Touch-Viewports 667×375 bis 1280×720, EN und DE): keine Überlappung oder Abschneiden bei Feldanzeige (Minimap, Kompass, Menüknopf) und 6 Kampfknöpfen; kein horizontaler Überlauf in allen 9 Menüseiten; Frametakt stabil (359 Bilder, Ø 16,7 ms, max 16,8 ms, kein Heap-Wachstum messbar); Truhe öffnet genau einmal, bleibt nach Reload offen; Speichern→Laden→Speichern ist identisch (außer Uhrzeit).
- NICHT geprüft: echtes iPhone/Android (Touch-Gefühl, Safari-Viewport, Akku, Performance auf schwacher Hardware), Kampfablauf per Hand, Dialoge der Händler im Spiel.

**Abschluss Phase 6 (Übersicht):**
- Umgesetzt: 6a Sprache EN/DE komplett (390 Texte, Wahl in Einstellungen, gespeichert); 6b Speichersystem v2 (Position, Migration, Sicherheitskopie, Ladeschutz); 6c Spielstand löschen, Layout-/Überlauf-/Performance-Prüfung.
- Getestet (Headless): siehe oben. Gerät: ungetestet, auch Phase 5c weiterhin.
- Unvollständig/bekannt: Lebenspunkte/Ki im Kampf nicht gespeichert; wenige feste Texte nicht übersetzt („MAX“, „P4“-Marker, englische Fehlermeldungen im Code); Phase 5c Dorfbefreiung/Händler-Wiedereröffnung/weitere Questtypen offen.
- Geänderte Dateien in 6b/6c: progress.js, main.js, menus.js, config.js, lang-de.js, main.css, index.html, PROJECT_STATUS.md.
- Nächste Phase: laut Spezifikation keine weitere; Vorschlag: zuerst Gerätetest aller Phasen (5c, 6a–6c), danach Fehlerbehebung.

**Phase 7a – Menü-Geschwindigkeit (v25):** Hinter offenem Menü wird die Welt nicht mehr jedes Bild neu gezeichnet (einmal je Fenstergröße, danach Standbild). Messung Headless mit 4× CPU-Drosselung und 3× Pixeldichte: 0 Weltzeichnungen in 1,5 s bei offenem Menü (vorher ~60 pro Sekunde), Tabwechsel ~24–29 ms, Welt zeichnet nach Schließen sofort wieder. Geändert: main.js, ui.js (`SW.UI.isOpen`), index.html. Gerät: bitte prüfen, ob die Verzögerung weg ist.

**Phase 2b – Bosse und mehr Gegner (v26):**
- 3 neue Bosse mit eigener Arena, eigenem Aussehen, eigenen Phasen und eigener Belohnung: Wächter der Ruinen (SW, 3 Phasen, Arena „warden“), Mönch der Eisgipfel (O, Speer, 3 Phasen, Arena „summit“), Höhlen-Oni (SO, 4 Phasen, neue Kulisse Höhle mit Kristallen). Bossangriffe neu: sweep, storm, crush. Bossgröße/Arena jetzt datengesteuert (`arena`, `phases`).
- Belohnungen: XP, Münzen, Essence (Ancient/Legendary), Karma und je 1 neue legendäre Beute: Klinge des Wächters (Nebenwaffe), Gipfel-Naginata (Hauptwaffe), Oni-Rüstung (Rüstung). Text „Legendärer Gegenstand“ statt „Waffe“.
- Gegnerpunkte von 9 auf 30 (18 normale, verteilt auf alle 8 Regionen außer Startdorf, 3 Bosse). Höhlenregion nutzt Höhlenkulisse.
- Geändert: combat-data.js, combat.js, items-data.js, config.js, lang-de.js, shops-data.js, index.html, PROJECT_STATUS.md.
- Geprüft (Headless): jeder der 4 Bosse durchgespielt per Skript: Arena, alle Phasen, Sieg, Belohnung, Drop; Screenshot Oni-Arena; Gegnerpunkte nicht in Wänden, nicht nahe Schreinen, Truhen, NPCs, Start oder untereinander (2 Punkte korrigiert). Keine Konsolenfehler.
- NICHT geprüft: Balance (Schwierigkeit der Bosse, Gegnerdichte), Gerät, Touch im Kampf, Höhlen-Kulisse auf Gerät. Karma-/Quest-Bezug der neuen Bosse: keine Quests dafür (nicht Teil des Auftrags).

**Phase 4c – Fernkampf und Masken (v27):**
- Neue Ausrüstungsslots: Fernkampfwaffe und Maske (jetzt 8 Slots). Speicherstände bleiben gültig (fehlende Slots = leer).
- Fernkampf: Shuriken (gewöhnlich), Stahl-Shuriken (ungewöhnlich), Hankyu-Kurzbogen (selten, Schmied), Yumi-Langbogen (episch, Truhe im Osten). Neuer Kampfknopf „Ranged/Fern“ (nur sichtbar mit ausgerüsteter Fernkampfwaffe; Taste H). Schaden aus `rdmg` der Waffe mal Angriffswert, eigener Vorlauf/Abklingzeit je Waffe, kein Ki-Gewinn, Treffer in die Deckung nur halber Schaden, kein Munitionssystem. Wurfstern bzw. Pfeil fliegt sichtbar zum Gegner.
- Masken: Stoffmaske (Händler), Halbe Oni-Maske (Truhe bei den Hütten), Kitsune-Maske (Schmied). Wirken als Rüstungswerte.
- Händler verkauft Shuriken, Stahl-Shuriken, Stoffmaske. Schmied stellt Kurzbogen und Kitsune-Maske her. Schmied-Verbesserung bei Fernkampfwaffen erhöht Fernkampfschaden (+1/Stufe), nicht den Nahkampf.
- 2 neue Truhen (c_peak1, c_hut1). Deutsch komplett.
- Geändert: items-data.js, inventory.js, shops-data.js, progress.js, combat.js, main.css, config.js, lang-de.js, index.html.
- Geprüft (Headless): Knopf nur mit Fernkampfwaffe, Schaden Shuriken 5 / geblockt 3, Bogen 20 / geblockt 10, kein Ki-Bonus, Speichern/Laden der Slots, Preise, Rezepte, Truhe öffnet einmal, keine Überlappung bei 9 Kampfknöpfen (667×375 bis 932×430, EN+DE). Dabei auch behoben: langer Skillname „Schattenschritt“ lief über den Knopf.
- NICHT geprüft: Gerät, Balance (Fernkampf vs. Nahkampf), Schmied-Verbesserung per Hand, Aussehen der Maske auf der Spielfigur (Maske wirkt nur als Wert, keine Grafik), Skilltree-Eintrag „Shuriken-Schaden“ (Schattenkrieger) existiert noch nicht.

**Karte: Ortsnamen (v28):** Alle 9 Regionsnamen und alle Orte stehen auf der Weltkarte; noch nicht besuchte gedämpft (Raute als Umriss), besuchte hell. Gleichnamige Region/Ort wird nur einmal beschriftet. Schrein-Namen rücken tiefer, damit sie den Ortsnamen nicht überdecken. Schreine bleiben an Entdeckung gebunden (Schnellreise-Regel). Geändert: ui.js, index.html. Headless-Screenshot geprüft; Gerät ungetestet. Bosse sind absichtlich nicht auf der Karte markiert.

**Koordinaten + Schwarzbild-Schutz (v29):**
- Eigene Position als „X … · Y …“ (Kacheln, Karte 0–2400) unter der Minikarte (im Spiel) und oben links im Karten-Menü. Dient zum Finden der Bosse (Koordinaten siehe oben). Im Kampf und bei offenem Menü ist die Anzeige unter der Minikarte ausgeblendet.
- Schwarzbild nach Screenshot/Tabwechsel: Das Standbild hinter dem Menü (7a) wird bei Fokus-, Sichtbarkeits-, Größen- und Seitenwechsel neu gezeichnet und zusätzlich höchstens 1× pro Sekunde, falls iOS die Zeichenfläche leert. Headless getestet: Fläche gelöscht → nach 1,3 s wieder gefüllt. Auf dem iPhone ungetestet; wenn weiter schwarz, bitte melden, ob nur die Welt hinter dem Menü oder die ganze Seite betroffen ist.
- Geändert: ui.js, main.js, main.css, index.html.


**Patch v30:**
- Siegbildschirm: Belohnungsliste passt sich an (Titel höher, Schrift kleiner, bei vielen Zeilen 2 Spalten), Anzeigedauer 5,5 s. Headless geprüft (852x393), Gerät offen.
- Schwarzer Bildschirm nach Screenshot: Ursache laut Screenshot vermutlich iOS-Fehler, Seitenbreite bleibt auf Hochformat (393) hängen. main.js erkennt das (quer, aber innerWidth zu klein), setzt Viewport-Meta neu, sonst Neuladen (max. alle 15 s, Spielstand wird vorher gespeichert). NICHT auf iPhone getestet.
