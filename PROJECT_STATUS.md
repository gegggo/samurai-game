# PROJECT_STATUS

**Cache-Version:** v32 (Spielversion 0.7.1)
**Aktuelle Phase:** Phase 7b – Prüfungen für alle 8 Schreine (umgesetzt, Gerätetest offen). Phase 6 (Deutsch, Speichern) im Code vorhanden.

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

## Offen
- Weitere Aufgabentypen (Wasser, Spiegel): bewusst nicht in 7b, nur Block- und Laternenräume wiederverwendet.
- 7c: Nachtgegner, zeitabhängige NPCs/Quests.
- 7d: Gefangene im Banditenlager, Kopfgeldjäger bei negativem Karma.
- Block-Raum: automatisches Zurücksetzen verklemmter Blöcke (bisher Reset-Knopf oder Raum verlassen).
- Phase 6 Gerätetests: Deutsch durchspielen, Performance.

## Technische Entscheidungen
- Canvas 2D, keine Abhängigkeiten; Ladereihenfolge in `index.html` (trials.js vor main.js).
- Systeme getrennt: XP/Level, Skillpunkte, Essence (nur Skilltree), Karma, Yin/Yang, Münzen (Handel), Ressourcen (Handwerk/Dorf).

## Nächster Schritt
Gerätetest 7a/7b, dann Freigabe 7c.
