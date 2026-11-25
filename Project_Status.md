# Samurai Wanderer – Project Status

Stand: 25.11.2026  
Projektversion: **v0.24.10**  
Cache-Version: **v104**  
Aktueller Arbeitsbranch: [stabilization-phase-1](https://github.com/gegggo/samurai-game/tree/stabilization-phase-1)  
Verbindliche Projektspezifikation: **Samurai Wanderer – Complete Project Specification v2.1**

## Aktueller Stand

Das Spiel ist ein HTML-/CSS-/JavaScript-Webspiel mit Priorität auf iPhone im Querformat. Die Entwicklung erfolgt phasenweise. Dieser Branch enthält die erste Stabilisierung vor den nächsten Inhaltsphasen und ist noch nicht in `main` gemergt.

### Phase 24 – Skilltree
- 90 Knoten: 60 passive, 20 aktive und 10 Spezialfähigkeiten.
- Acht zuvor nicht angebundene passive Effekte wurden in den drei Kampfsystemen ergänzt.
- Aktive Techniken verwenden teilweise noch generische Moves; Spezialeffekte sind noch nicht vollständig angebunden.
- Zwei aktive Skillplätze bleiben bestehen.
- Neue Fähigkeiten und größere Änderungen am Skilltree erst nach Vorschlag und Freigabe.

### Inventar und Waffenhaltbarkeit
- Waffenhaltbarkeit wird je Exemplar gespeichert: common 30, uncommon 45, rare 60, epic 80 Treffer; legendäre Waffen sind unzerbrechlich.
- Haltbarkeit wird in Weltkampf, Duell und Boss-Arena abgezogen und im Spielstand gespeichert.
- **Neu in diesem Branch:** Nach einem Waffenbruch werden Kampfwerte aktualisiert. Eine zerbrochene Fernkampfwaffe kann nicht weiter benutzt werden; der Fernkampf-Button wird ausgeblendet.
- Die Haltbarkeitswerte sind weiterhin Balancing-Platzhalter.
- **Noch offen:** Reparaturfunktion beim Schmied. Kosten und Reparaturumfang sind noch nicht festgelegt.

### Weltkarte und Regionengenerator
- Region 17 (Kirschblütenwald) und Region 18 (Verlassene Festung) sind als zusätzliche Layout-Segmente eingebunden.
- Später geladene Layout-Segmente haben Vorrang; leere Zellen fallen auf ältere Segmente zurück.
- Die Generatoren für Sakura und Festung verwenden jetzt einen 60/40-Biome-Übergang. Die Aufrufpfade und generierten Dateikommentare verweisen auf `tools/`.
- Neuer Test: `python3 tests/layout_connectivity.py` prüft Landverbindung und Übergangsanteil für beide Regionen.

## Testergebnisse dieses Stabilisierung-Branches

- **Bestanden:** `node --check` für alle JavaScript-Dateien (lokale Prüfkopie mit den Branch-Änderungen).
- **Bestanden:** `python3 tests/skilltree_phase24.py`.
- **Bestanden:** `python3 tests/layout_connectivity.py` – Sakura 54,9 % neuer Biome-Anteil, Festung 51,7 %; beide Landanschlüsse gefunden.
- **Nicht ausführbar:** Browser-Regression und Datenvalidator. Chromium konnte in der Testumgebung keine lokale HTTP-Adresse öffnen (`ERR_BLOCKED_BY_ADMINISTRATOR`).
- **Noch offen:** echter iPhone-Test im Querformat. Browser- und Gerätetests sind nicht durch die Syntax- oder Datentests ersetzt.

## Vor den nächsten Entwicklungsphasen

1. Reparaturfunktion beim Schmied festlegen und implementieren.
2. Waffenhaltbarkeit und Reparaturkosten balancieren.
3. Browser-Regression erneut in einer Umgebung ausführen, in der lokaler HTTP-Zugriff erlaubt ist.
4. Auf dem iPhone testen: Joystick/Multitouch, Kampfbuttons, Inventar, Skilltree, Karte, Speichern/Laden und Leistung.
5. Noch offene aktive und spezielle Skill-Effekte prüfen.
6. Erst danach die nächste Inhaltsphase beginnen.

## Verbindliche Entwicklungsregeln

- Bestehende funktionierende Funktionen erhalten und neue Systeme in die bestehende Architektur integrieren.
- Jede Phase einzeln umsetzen und auf Fehler sowie Seiteneffekte testen.
- Keine zukünftigen Phasen vorzeitig implementieren.
- Essence ausschließlich für den Skilltree verwenden.
- Texte EN und DE pflegen.
- Mobile Bedienbarkeit und Performance haben Priorität.
- Nicht getestete Funktionen ausdrücklich als ungetestet markieren.

## Dokumentation

`Project_Status.md` ist die aktuelle Statusübersicht. `PROJECT_STATUS.md` bleibt als historische Versionschronik erhalten.