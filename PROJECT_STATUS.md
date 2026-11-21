# PROJECT_STATUS

**Cache-Version:** v31 (Spielversion 0.7.0)
**Aktuelle Phase:** Phase 7a – Schrein-Prüfungen (umgesetzt, Gerätetest offen). Phase 6 (Deutsch, Speichern) im Code vorhanden.

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

## Offen
- 7b: Prüfungen für die 6 übrigen Schreine (Berg, Einsiedler, Aussicht, Fischer, Ruinen, Höhle), Duell-Prüfung (Yang), weitere Aufgabentypen (Wasser, Spiegel).
- 7c: Nachtgegner, zeitabhängige NPCs/Quests.
- 7d: Gefangene im Banditenlager, Kopfgeldjäger bei negativem Karma.
- Block-Raum: automatisches Zurücksetzen verklemmter Blöcke (bisher Reset-Knopf oder Raum verlassen).
- Phase 6 Gerätetests: Deutsch durchspielen, Performance.

## Technische Entscheidungen
- Canvas 2D, keine Abhängigkeiten; Ladereihenfolge in `index.html` (trials.js vor main.js).
- Systeme getrennt: XP/Level, Skillpunkte, Essence (nur Skilltree), Karma, Yin/Yang, Münzen (Handel), Ressourcen (Handwerk/Dorf).

## Nächster Schritt
Gerätetest 7a, dann Freigabe 7b.
