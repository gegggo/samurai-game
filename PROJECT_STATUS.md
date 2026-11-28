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


## Phase 0.48 – Anspruchsvollere Kampf-KI und Boss-Kombinationen (28.11.2026)
- Elitegegner nutzen eine feste, lesbare Angriffskette statt einer vollständig zufälligen Auswahl einzelner Angriffe.
- Boss-, Miniboss- und Schreinwächterphasen verwenden ihre definierten Angriffsmuster als Abfolgen. Dadurch entstehen erkennbare Kombinationen, die Spieler lernen und kontern können.
- Spätere Bossphasen erhalten eine längere Guard-Break-Sperre. Wiederholtes Erzwingen von Betäubungen funktioniert dadurch weniger zuverlässig; Parieren und Ausweichen bleiben wichtige Gegenmittel.
- Angriffs-Vorzeichen, Wind-up-Zeiten und bestehende Ausweich-/Parierfenster bleiben erhalten.
- Heilung, Ausdauer und Belohnungsformeln werden in dieser Phase nicht verändert, um keine ungetesteten Nebenwirkungen in Progression und Kampfökonomie einzuführen.
- Regression prüft die Angriffsketten und die steigende Guard-Break-Sperre.


## Phase 0.49 – Boss-Balancing und Arena-Schadensprüfung (28.11.2026)
- Der Oni besitzt auf Tier 3 effektiv 15.300 HP (9.000 Basis × 1,7 Tier). Die vorherige Annahme eines zusätzlichen Arena-Faktors von 1,5 war falsch und wurde in der Regression korrigiert.
- Die Regression prüft die tatsächliche Arena-HP, den Schaden und die Vorwarnzeit der Oni-Endphasen-Angriffe sowie die Gültigkeit aller Boss-Kombos.
- Guard-Breaks und schwere Treffer verwenden jetzt dieselbe phasenabhängige Guard-Lock-Dauer. Damit können schwere Treffer die längere Sperre späterer Bossphasen nicht versehentlich auf 2,2 Sekunden zurücksetzen.
- Keine Abschwächung des Endbosses: Rage bleibt ein angekündigter, unblockbarer Hochrisikoangriff; Storm bleibt eine Mehrfachtreffer-Kombo. Ausweichen und gutes Timing sind entscheidend.
- GitHub-Regression und iPhone-Gerätetest stehen nach dem Commit noch aus.
