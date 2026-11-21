# Samurai Wanderer

Open-World Action-RPG im Browser (HTML, CSS, JavaScript). Ziel: Mobile, Querformat.
Hosting: GitHub Pages. Status: siehe PROJECT_STATUS.md.

## Struktur
Repo-Root: index.html, README.md, PROJECT_STATUS.md, .gitignore. Ordner `js/` (alle Skripte), `css/` (main.css), `docs/` (Projektspezifikation PDF).
- index.html – Einstieg, Skriptreihenfolge
- css/main.css – Styles
- config.js – Namespace, Konstanten, Texte
- world.js, player.js, input.js, render.js, ui.js, main.js – Welt, Figur, Steuerung, Zeichnen, Minimap/Menü, Start
- combat-data.js, combat.js – Kampf
- progress.js, skills-data.js, skills.js, menus.js – Level, Skilltree, Karma, Speichern
- items-data.js, inventory.js, shops-data.js, shops.js – Gegenstände, Händler, Schmied
- shrines-data.js, shrines.js, daynight.js – Schreine, Schnellreise, Tag/Nacht
- village.js – Dorf-Wiederaufbau (Stufen aus Quest-Status)

Relative Pfade nutzen, kein führendes /. Bei Änderungen `?v=` in index.html erhöhen (Cache).
Steuerung: Joystick links (Touch), Menü rechts oben. Am Rechner: WASD/Pfeiltasten.

## Hinweis für Entwicklung / KI-Assistenten
- Repo-Struktur ist final und liegt auf GitHub: `index.html` im Root, `css/main.css`, `js/` (alle Skripte flach).
- Keine Umstrukturierung, keine Ordner-Nachfragen nötig. Ordnernamen im Upload-Zip (`js-files`, `Root`) sind nur Zip-Artefakte.
- `docs/` existiert (Spezifikation). `assets/` (images/characters, environments, items, ui; audio) und `data/` erst anlegen, wenn erster Inhalt existiert (Git kennt keine leeren Ordner).
- Design/UI-Arbeit bewusst später; zuerst Grundgerüst und Spielfunktionen.
- `*-data.js` bleiben JS (kein JSON, kein fetch) bis eigene Freigabe.
- Skriptreihenfolge in `index.html` nicht ändern. Bei Dateiänderung `?v=` erhöhen.
- Nächste Schritte nur laut PROJECT_STATUS.md. Neue Features erst vorschlagen.
