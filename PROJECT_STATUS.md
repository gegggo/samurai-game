## Version 0.39.1 – Hauptquest: Vergessene Schriftzeichen und verborgenes Tor (28.11.2026)
- Die Hauptquest startet nach dem Sieg über den Banditenanführer. Der Meister im Steingarten gibt die Spur zu einer alten Schrift frei.
- Zwölf erfundene Zeichen aus Stein liegen in zwölf Regionen. Sie sind eigens gezeichnet und keine echten chinesischen oder japanischen Schriftzeichen. Jedes Zeichen wird beim Lesen einem lateinischen Buchstaben zugeordnet und im Wörterbuch gespeichert.
- Das Wörterbuch ist über das Quest-Menü erreichbar. Die geordnete Zeichenfolge ergibt den Hinweis „THE GATE OPENS“ bzw. „Das Tor öffnet sich“.
- Erst nach allen zwölf Funden und der Rückkehr zum Meister erscheint ein zuvor verborgenes Tor in den Vergessenen Ruinen auf der Weltkarte. Die nächste Hauptquest verlangt, das Tor vor Ort zu öffnen.
- Keine Sammelbelohnungen. Die Zeichen dienen ausschließlich als Fortschritts- und Zugangsschlüssel der Hauptgeschichte.
- Das Tor blockiert den Weg bis zur Interaktion und wird danach passierbar. Der dahinterliegende Endbereich und Endboss sind der nächste Hauptquest-Ausbauschritt.
- Der Meister-Dialog bietet zusätzlich einen eigenen Einstieg in die Schriftrollen-Lehre. Die Hauptquest sperrt seine bisherige Meister-Funktion nicht mehr.
- Regression erweitert: prüft jetzt auch die 12 Zeichen, ihre Regionen, das Tor mit Kollision und Öffnung, Speicherdaten sowie den Zugang zu den Schriftrollen beim Meister.
- Speicherstand enthält gefundene Zeichen und Torstatus. Regression prüft Zeichenpositionen, Regionszuordnung, Quest-Voraussetzungen, Freischaltung, Tor-Sperre und Speichern/Laden. Gerätetest steht noch aus.


## Phase 0.46 – Fünf Siegel und Endboss-Freischaltung (28.11.2026)
- Nach dem Öffnen des vergessenen Tores erhält der Spieler beim Meister die Hauptquest „Die fünf Siegel“.
- Fünf einzigartige Minibosse erscheinen an festen Orten in fünf verschiedenen Regionen der Weltkarte: Rubin-Bergwächter, Smaragd-Schlangendämon, Onyx-Schattenkrieger, Saphir-Eisbestie und Amethyst-Drachenwächter.
- Jeder Miniboss nutzt eine eigene Boss-Arena-Konfiguration, drei Kampfphasen, eigene Angriffskombinationen und ein eigenes Erscheinungsbild. Die vorhandene Arena- und Kampftechnik wird wiederverwendet.
- Jeder Miniboss hinterlässt genau einen nicht verkaufbaren Quest-Edelstein. Die Edelsteine werden separat vom normalen Inventar gespeichert.
- Nach Rückkehr zum Meister wird die Altar-Quest freigeschaltet. Am Altar hinter dem vergessenen Tor werden alle fünf Edelsteine eingesetzt; dadurch öffnet sich das letzte Tor.
- Dahinter wartet der uralte Oni als Endboss. Der finale Kampf nutzt die vorhandene Boss-Arena; nach dem Sieg wird die Hauptquest beim Meister abgeschlossen.
- Miniboss-Standorte werden während der aktiven Sammelquest als Karten-/Questziele markiert. Vor Annahme der Quest sind sie nicht aktiv und können nicht versehentlich ausgelöst werden.
- Speicherstand enthält gefundene Edelsteine und den Status des letzten Tores. Regression und CI stehen noch aus; iPhone-Gerätetest bleibt offen.
