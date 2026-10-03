# RIG TALK by BYQ — pakiet przekazania (handoff)

Ten plik streszcza WSZYSTKO, co trzeba wiedzieć, żeby kontynuować ten projekt w nowym czacie (np. ChatGPT) bez dostępu do historii tej rozmowy. Wklej go na start nowej sesji razem z zawartością folderu projektu (ZIP).

## Co to jest
PWA (Progressive Web App) do nauki angielskiego dla Damiana — kierownika stoiska i realizacji AV/eventowej (LED, rigging). Cel twardy: **10.01.2027 samodzielna obsługa stoiska od A do Z**. Branding BYQ: czerń #0a0a0b + czerwień #e01e1e, fonty Anton (display) + Oswald (body), wyłącznie tryb ciemny.

## Stos technologiczny
- Czysty HTML/CSS/JS (ES modules), **zero frameworków, zero bundlera**.
- FSRS v6 (spaced repetition) przez `vendor/ts-fsrs.umd.js` (zvendorowany UMD build).
- Web Speech API (TTS + STT) z degradacją, gdy niedostępne.
- Service Worker (`sw.js`) — cache-first, pełne działanie offline, z mechanizmem wymuszonej aktualizacji (auto-reload po wykryciu nowej wersji SW, patrz `js/app.js`).
- Stan w `localStorage` przez klasę `Store` (`js/state.js`) z deep-merge i migracjami schematu.
- Źródła prawdy dla dalszej pracy: **`PLAN.md`** (specyfikacja aplikacji, etapy E0–E13), **`RESEARCH-ZWROTY.md`** (inwentarz zwrotów/research lingwistyczny), **`PROGRESS.md`** (dziennik co zrobione i jak zweryfikowane), **`CLAUDE.md`** (zasady pracy nad projektem — styl, reguły treści, wymóg walidacji).

## v2 (2026-10-03, później): PIERWSZE STOISKO — PRIORYTET
- Priorytet Damiana: **stoisko/TECH**. CODZIENNY jest dodatkiem (dostępny w KURS → „Codzienny (dodatek)”).
- Nowy moduł **T7 PIERWSZE STOISKO** (`content/tech/t7.json`, 166 zwrotów) + `content/stoisko.json` (10 etapów: cel, checklista, wskazówka, słowa) + `content/glossary.json` (słownik, 121 terminów z wymową po polsku).
- Zakres Damiana na wyjeździe (Paryż, solo + anglojęzyczny stagehand): przyjazd, rozeznanie, przywitanie klienta, ustalenie miejsca zawieszenia, pytanie o rusztowanie, budowa transparentnego LED na belkach, opinanie, programowanie i przygotowanie procesorów, test na własnym PC, przekazanie — klient sam puszcza materiały ze swojego laptopa.
- Nawigacja: BAZA · STOISKO · KURS · CZERWONE · BIBLIOTEKA (Zwroty / Słownik). Nowe moduły JS: `stoisko.js`, `kurs.js`, `glossary.js`; `session.startFocusedSession(ids)`.
- Stan `schemaVersion: 2` (domyślny tor TECH). `sw.js` = `rigtalk-v13`.
- Łącznie 536 zwrotów.

## Stan sprzed v2 (2026-10-03)
- **Treść w 100% kompletna**: 370 zwrotów SAY/HEAR w dwóch torach:
  - CODZIENNY: D1–D10 (229 zwrotów) — powitania, small talk, sklep, kawiarnia/restauracja/bar, ulica/transport, hotel/lotnisko, komplementy, telefon/plany, problemy.
  - TECH: T0–T6 + T9 (145 zwrotów) — survival kit, stoisko, LED/rigging/zasilanie, negocjacje/umowa, dzień eventu, trudny klient, networking, CZERWONE-extra.
  - Każdy zwrot waliduje się przez `node tools/validate.js` (0 błędów wymagane przed commitem).
- **Wdrożone na żywo**: https://elite-athlete.shop/nauka-angielskiego/ (PWA instalowalna z Chrome, nazwa po instalacji: "Nauka Angielskiego").
- Zrobione etapy: E0–E11 + C-T0..C-T6 + C-D1..C-D10 (pełne, patrz PROGRESS.md po szczegóły i dowody weryfikacji każdego kroku).
- **NIE zrobione / zostało**: E12 (ikony PWA — obecnie `"icons": []` w manifest.webmanifest, trzeba wygenerować realne ikony), E13 (Android APK przez PWABuilder/Bubblewrap — TWA, wymaga `.well-known/assetlinks.json` na Hostingerze).

## Krytyczna wiedza operacyjna — WAŻNE, nie pomiń
1. **Hostinger ma CDN (`hcdn`) przed stroną z cache 7 dni** (`Cache-Control: public, max-age=604800`). Samo wgranie nowego pliku NIE wystarcza — trzeba ręcznie kliknąć **"Opróżnij pamięć podręczną"** w hPanel → Strony www → elite-athlete.shop → Wydajność → CDN. Bez tego zmiany bywają niewidoczne do 7 dni.
2. **File Manager Hostingera czasem po cichu nie wykonuje "Replace"** mimo pokazania dialogu zgody. Zawsze weryfikuj znacznik czasu/rozmiar pliku w File Managerze PO uploadzie, PRZED czyszczeniem cache CDN.
3. **ZIP tworzony przez Windows PowerShell (`Compress-Archive`) psuje strukturę folderów** przy rozpakowywaniu na serwerze Linux (literalne `\` w nazwach plików zamiast prawdziwych katalogów). Bezpieczna metoda wdrożenia: wgrywać pliki pojedynczo/w grupach bezpośrednio przez File Manager (z zachowaniem struktury folderów), NIE przez ZIP+rozpakuj.
4. Domena produkcyjna to `elite-athlete.shop` (NIE "elite-atlete.shop" — łatwo się pomylić), a aplikacja mieszka w podfolderze `/nauka-angielskiego/`, bo główna domena hostuje inny, wcześniej istniejący sklep (e-booki). Nie nadpisywać `public_html` root.
5. Po każdej zmianie w `sw.js` trzeba podbić `CACHE_NAME` (np. `rigtalk-v11` → `v12`) i dopisać nowe pliki do `PRECACHE_URLS`, inaczej offline-cache nie złapie nowej treści.
6. Deployment wymaga ręcznej pracy w przeglądarce (File Manager Hostingera) — nie ma automatycznego CI/CD. Jeśli nowy asystent ma dostęp do przeglądarki (np. Claude in Chrome), może to zrobić sam, logując się na już-zalogowaną sesję użytkownika (NIGDY nie wpisuj hasła Damiana za niego).

## Struktura repozytorium
```
index.html, manifest.webmanifest, sw.js   — shell aplikacji
css/                                       — tokens.css (kolory/fonty), app.css (style)
js/                                        — wszystkie moduły ES (app.js = router/bootstrap, state.js, srs.js, session.js, content.js, library.js, red.js, game.js, scenes.js, boss.js, ai.js, i18n.js, speech.js, icons.js, brush.js)
vendor/ts-fsrs.umd.js                      — silnik FSRS (zvendorowany)
content/
  index.json, modules.json, red.json       — manifesty treści
  daily/d1.json..d10.json                  — tor CODZIENNY
  tech/t0.json..t6.json, t9.json           — tor TECH
  scenes/, bosses/                         — sceny dialogowe i boss fighty (dodatek, nie główny tryb)
n8n/                                       — workflow + README do podpięcia AI-checkera (webhook, nie ma jeszcze realnego klucza Anthropic podpiętego przez Damiana)
tools/validate.js                          — walidator treści (uruchamiać przed KAŻDYM commitem)
PLAN.md, RESEARCH-ZWROTY.md, PROGRESS.md, CLAUDE.md — dokumentacja/źródła prawdy
```

## Zasady pisania treści (obowiązują bez wyjątku — z CLAUDE.md i PLAN.md §1.1)
1. Zwrot = 3–9 słów (wyjątek: tag `"short"` dla krótszych, np. "Cheers!").
2. Tylko proste czasy: Present Simple/Continuous, will, can, going to, imperatyw. Past Simple dopiero od modułów T4/D6.
3. Każdy zwrot ma pola: `id, track, module, unit, type (SAY|HEAR), en, pl, hint_pl, variants{uk/us/alt[]}, register(neutral|casual|polite), red(bool), tags[]`. HEAR dodatkowo ma `reply`.
4. Forma żywa, nie podręcznikowa (np. "No worries" zamiast "You're welcome").
5. Warianty UK/US tylko tam, gdzie realnie się różnią.
6. Schemat ID: `{track}{module}u{unit}-{nr}` np. `d3u2-07`, `t2u1-01`.

## Jak kontynuować w nowym czacie
1. Wgraj ten plik (HANDOFF.md) + cały ZIP projektu.
2. Przeczytaj PROGRESS.md od końca — tam jest pełna historia co zrobione i jak zweryfikowane.
3. Następne logiczne kroki (do wyboru z Damianem): E12 (ikony PWA), E13 (APK na Androida), albo dalsza rozbudowa treści (np. więcej jednostek w istniejących modułach).
4. Zawsze: zmiana treści → `node tools/validate.js` musi dać 0 błędów → dopiero wtedy wdrożenie.
5. Komunikacja z Damianem: po polsku, krótko, wynik a nie proces (patrz CLAUDE.md).
