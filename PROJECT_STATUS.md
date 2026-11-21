# PROJECT_STATUS

**Cache-Version:** v35 (Spielversion 0.7.4)
**Aktuelle Phase:** Phase 7d – Gefangene im Banditenlager, Kopfgeldjäger (umgesetzt, Gerätetest offen). 7a–7c umgesetzt. Phase 6 (Deutsch, Speichern) im Code vorhanden.

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

## Offen
- Weitere Aufgabentypen (Wasser, Spiegel): bewusst nicht in 7b, nur Block- und Laternenräume wiederverwendet.
- Negatives Karma hat nur wenige Quellen (Ausliefern, Fischer-Quest); weitere (z. B. Unschuldige angreifen) nur nach Vorschlag.
- Block-Raum: automatisches Zurücksetzen verklemmter Blöcke (bisher Reset-Knopf oder Raum verlassen).
- Phase 6 Gerätetests: Deutsch durchspielen, Performance.

## Technische Entscheidungen
- Canvas 2D, keine Abhängigkeiten; Ladereihenfolge in `index.html` (trials.js vor main.js).
- Systeme getrennt: XP/Level, Skillpunkte, Essence (nur Skilltree), Karma, Yin/Yang, Münzen (Handel), Ressourcen (Handwerk/Dorf).

## Nächster Schritt
Gerätetest 7a–7d, dann Abschluss Phase 7 / Freigabe nächster Schritt.
