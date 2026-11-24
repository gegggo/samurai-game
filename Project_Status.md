# Samurai Wanderer – Project Status

Stand: 24.11.2026  
Projektversion laut zuletzt gezeigten Screenshots: **v0.24.8**  
Verbindliche Projektspezifikation: **Samurai Wanderer – Complete Project Specification v2.1**

## 1. Aktueller Entwicklungsstand

Das Projekt wird als HTML-/CSS-/JavaScript-Webspiel entwickelt. GitHub ist die Projektverwaltung; GitHub Pages ist zunächst als Hosting vorgesehen. Mobile Geräte im Querformat haben Priorität.

Die Entwicklung erfolgt phasenweise. Bestehende, funktionierende Systeme sollen erhalten und erweitert werden. Größere Grafik- und Polish-Arbeiten bleiben grundsätzlich für die dafür vorgesehene spätere Polish-Phase vorgesehen.

## 2. Zuletzt bearbeitete Bereiche

### Phase 23 – Wirtschaft und Ausrüstung
Laut bisherigem Projektverlauf abgeschlossen:
- Ryō-Wirtschaft und entsprechende Kostenlogik.
- Verbesserungs-/Upgrade-Stufen und Eisen-Drops.
- Regressionstests wurden ergänzt (zuletzt gemeldeter Stand: 39 Tests).
- Browser- und iPhone-Regressionstest waren noch offen.

### Phase 24 – Skilltree
Laut bisherigem Projektverlauf umgesetzt:
- Lite-Skilltree mit insgesamt 90 Knoten:
  - 60 passive Fähigkeiten
  - 20 aktive Techniken
  - 10 Spezialfähigkeiten
- Passive Fähigkeiten besitzen jeweils drei Stufen (I–III).
- Verzweigter Skilltree mit Suche und Filter.
- Bedienung mit Ein-Finger-Verschieben und Zwei-Finger-Zoom.
- Zwei Slots für aktive Techniken.
- Neue Fähigkeiten sollen vor der Implementierung zuerst vollständig vorgeschlagen und vom Nutzer freigegeben werden.
- Bekannte Einschränkung aus dem bisherigen Stand: Nicht alle Skill-Effekte waren bereits vollständig mit allen drei Kampfsystemen verbunden.
- Alte Skill-IDs wurden nicht automatisch migriert. Save-Kompatibilität daher gezielt prüfen.

## 3. Zuletzt gewünschte UI-Änderungen (Version 0.24.8)

Die folgenden Änderungen wurden für die Menüs angefordert. Ein erfolgreicher Einbau in den aktuellen GitHub-Stand und ein vollständiger Gerätetest sind nicht unabhängig bestätigt; vor dem nächsten Release prüfen.

### Skilltree-UI
- Fähigkeiten übersichtlicher und besser erkennbar darstellen.
- Skill-Icons ergänzen.
- Passive, aktive und spezielle Fähigkeiten visuell unterscheidbar machen.
- Rang und Freischaltungsstatus gut sichtbar darstellen.
- Bestehende Lernlogik, Voraussetzungen und Skilltree-Funktion nicht unbeabsichtigt verändern.

### Questmenü
- Offene bzw. noch nicht abgeschlossene Quests oberhalb anzeigen.
- Abgeschlossene Quests darunter einsortieren.
- Sortier-/Filtermöglichkeiten oben im Menü vorsehen:
  - Alle
  - Hauptquests
  - Nebenquests
  - Offen
  - Abgeschlossen
- Questtypen müssen in den Questdaten eindeutig markiert sein. Die Zuordnung vorhandener Quests prüfen, statt unbekannte Questtypen zu erraten.

### Inventar-Icons
- Im Inventar wurden Item-Icons nicht angezeigt.
- Vorgesehene Ordnerstruktur:
  - `assets/images/icons/` für allgemeine UI-/Spiel-Icons
  - `assets/images/items/icons/` für Waffen-, Rüstungs- und sonstige Item-Icons
- Die Item-Bilder müssen anhand stabiler Item-IDs bzw. korrekter Dateipfade geladen werden.
- Die Pfade im Code müssen exakt mit der GitHub-Ordnerstruktur übereinstimmen.
- Icon-Dateien und Manifest gemeinsam prüfen; keine Bilddateien oder Item-Zuordnungen voraussetzen, die tatsächlich nicht im Repository liegen.

## 4. Technische Prüfungen und offene Punkte

Vor einer Freigabe der nächsten Version:
1. Aktuellen GitHub-Stand mit den zuletzt angeforderten UI-Änderungen vergleichen.
2. Prüfen, ob alle Item-Icons im Repository vorhanden sind und korrekt geladen werden.
3. Prüfen, ob fehlende Icons einen sauberen Fallback anzeigen.
4. Quest-Sortierung und Filter mit offenen, abgeschlossenen, Haupt- und Nebenquests testen.
5. Skilltree auf korrekte Darstellung, Suche, Filter, Zoom, Verschieben und Slot-Zuweisung testen.
6. Prüfen, ob Skill-Effekte tatsächlich im Kampf wirken und korrekt gespeichert werden.
7. Save-Kompatibilität prüfen; insbesondere Änderungen an Skill-IDs und Questdaten.
8. JavaScript-Konsole und Regressionstests prüfen.
9. Browser-Regressionstest durchführen.
10. Auf dem iPhone im Querformat testen.

**Teststatus:** Aus dem bisherigen Verlauf sind Syntax-/Datentests gemeldet. Ein vollständiger Browser- und iPhone-Regressionstest ist nicht bestätigt.

## 5. Verbindliche Design- und Entwicklungsregeln

- Die Spezifikation v2.1 ist die maßgebliche Grundlage.
- Vorhandene funktionierende Funktionen erhalten; neue Systeme in die bestehende Architektur integrieren.
- Keine isolierten Code-Fragmente liefern, die manuell zusammengeführt werden müssen.
- Jede Phase einzeln umsetzen und auf Fehler sowie Seiteneffekte testen.
- Keine zukünftigen Phasen vorzeitig implementieren.
- Neue Fähigkeiten und größere Designänderungen zuerst vollständig vorschlagen und Freigabe abwarten.
- Essence wird ausschließlich für den Skilltree verwendet.
- Geheime Kampftechniken werden durch Bosskämpfe freigeschaltet; ihre Nutzung setzt die vorgesehenen Karma- und Yin/Yang-Voraussetzungen voraus.
- Mobile Bedienbarkeit und Performance haben Priorität.
- Keine funktionslosen Buttons oder nur vorgetäuschten Systeme.

## 6. Nächster sinnvoller Arbeitsschritt

Zuerst den aktuellen GitHub-Projektstand und die tatsächlichen Dateien prüfen. Danach die Skilltree-, Quest- und Inventar-UI auf dem iPhone testen und offene Fehler korrigieren. Erst anschließend den nächsten Entwicklungsabschnitt beginnen.

---

**Wichtig:** Dieser Status fasst den zuletzt bekannten Projektverlauf zusammen. Er ersetzt keinen Abgleich mit dem aktuellen GitHub-Repository. Nicht bestätigte Änderungen und Tests sind ausdrücklich als offen markiert.

## v0.24.9 – Skills-UI + Waffen-Haltbarkeit
Status: **implementiert, Dateien gesendet – Prüfung auf Gerät ausstehend.**
- Skills-Seite: Abschnitte (Skills/Character/Karma) standen nebeneinander; jetzt untereinander (`sk-wrap`), fehlendes CSS für Slots/Kacheln ergänzt. Inventar-Detailkopf zeigte `[object HTMLImageElement]` – behoben.
- Waffen-Haltbarkeit: je Exemplar eigene Haltbarkeit (`Inv.dur`, `Inv.edur`), Abnutzung 1 je Treffer (Haupt+Nebenwaffe bei Nahkampf, Fernwaffe bei Schuss) in Duell, Open World, Boss-Arena. Bei 0 zerbricht die Waffe. Legendär = unzerbrechlich. Alte Saves: voll.
- Inventar: Sortierung (Art / Seltenheit / Haltbarkeit / Name), Waffen je Exemplar mit Balken.
- Platzhalter (Balancing offen): `Inv.DUR` = 30/45/60/80 (common–epic).
- Getestet (headless Chromium, kein Gerät): Logik equip/break/save/load, Screenshots Skills+Inventar, Regression 38/39 bestanden; 1 Fehlschlag = Validator-Pfad in Testumgebung (tools/ fehlte).
- Offen: Reparatur (Schmied) nicht gebaut; Fernwaffe bricht im laufenden Kampf erst danach (Kampf-Cache); Gerätetest iPhone.
Geänderte Dateien: js/inventory.js, js/menus.js, js/combat.js, js/worldcombat.js, js/arena3d.js, js/items-data.js, js/lang-de.js, js/config.js, css/main.css, index.html (?v=103).
