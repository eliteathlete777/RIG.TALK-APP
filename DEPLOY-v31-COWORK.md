# RIG TALK v31 — wdrożenie na Hostinger (instrukcja dla Cowork)

Wklej Coworkowi w całości. Mów po polsku, krótko. **Nigdy nie wpisuj za Damiana haseł** — pracuj na już zalogowanej sesji hPanel. Jeśli wymaga logowania: zatrzymaj się i poproś Damiana.

## 0. Cel i adresy
- Aktualizacja istniejącej aplikacji: **https://elite-athlete.shop/rig-talk/** (pisownia: `elite-athlete`, NIE „atlete").
- Folder na serwerze: `public_html/rig-talk/`. **Nie ruszaj** `public_html` (root), sklepu ani `/nauka-angielskiego/`.
- Wersja: **rigtalk-v31** (`CACHE_NAME` w `sw.js`). 151 plików, ~7,5 MB.

## 1. Skąd wziąć pliki
Źródło prawdy: repo GitHub `eliteathlete777/RIG.TALK-APP`, branch **`claude/dreamy-shannon-vzsoj4`** (commit „v31 …" i nowszy).
- Pobierz: https://github.com/eliteathlete777/RIG.TALK-APP/archive/refs/heads/claude/dreamy-shannon-vzsoj4.zip i rozpakuj lokalnie (Windows: prawy klik → Wyodrębnij wszystko), albo `git pull origin claude/dreamy-shannon-vzsoj4` w `C:\Users\DELL\Documents\ChatGPT\RIG.TALK APP`.
- Do wgrania TYLKO te elementy (z korzenia projektu): `index.html`, `manifest.webmanifest`, `sw.js`, foldery `assets/`, `css/`, `js/`, `content/`, `vendor/`.
- NIE wgrywaj: `.git`, `docs/`, `tools/`, `n8n/`, `source-material/`, `*.md`, `*.zip`, `_hostinger_v20`, `*.png` z korzenia (podglądy), `node_modules`.
- Lista kontrolna: `docs/DEPLOY-v31-SHA256.txt` (151 plików, sha256).

## 2. Przed uploadem (kopia zapasowa)
W File Managerze: `public_html/rig-talk/` → zaznacz wszystko → Kompresuj/Archiwizuj do `rig-talk-backup-przed-v31.zip` w `public_html/` (poza folderem rig-talk). Dzięki temu jest powrót.

## 3. Upload — kolejność ma znaczenie
Zachowaj strukturę folderów (File Manager → wejdź w `rig-talk/` → Upload → wybierz foldery/pliki; nadpisuj przy pytaniu).
1. `assets/` (w tym `assets/plany/` ~6 MB, `assets/test/`) — nowe obrazy.
2. `vendor/`, `css/`, `content/`, `js/`.
3. `index.html`, `manifest.webmanifest`.
4. **`sw.js` NA KOŃCU** — nowy service worker ma zastać na serwerze wszystkie pliki z precache, inaczej instalacja v31 się wywali.

Zasady (znane pułapki Hostingera):
- **Nie używaj ZIP z Windows PowerShell** (`Compress-Archive`) — psuje foldery (`\` w nazwach). Wgrywaj foldery/pliki bezpośrednio.
- File Manager potrafi **po cichu nie wykonać „Replace"**. Po uploadzie sprawdź w File Managerze rozmiar i datę kluczowych plików: `sw.js`, `js/montaz.js`, `js/uklad.js`, `js/acc.js`, `content/montaz.json`, `content/az.json`, `content/plany.json`. Muszą mieć dzisiejszą datę i rozmiar jak lokalnie.
- Ewentualnie wgraj ZIP zrobiony na Linuxie/macOS i użyj „Wyodrębnij" — tylko jeśli drzewo folderów po rozpakowaniu jest poprawne.

## 4. Weryfikacja na serwerze (PRZED czyszczeniem CDN)
Otwórz w przeglądarce (z `?x=1`, żeby ominąć cache):
- `https://elite-athlete.shop/rig-talk/sw.js?x=1` → w 4. linii ma być `const CACHE_NAME = 'rigtalk-v31';`
- `https://elite-athlete.shop/rig-talk/content/montaz.json?x=1` → ma się wczytać (JSON, nie 404).
- `https://elite-athlete.shop/rig-talk/js/uklad.js?x=1`, `.../js/acc.js?x=1` → muszą istnieć (to nowe pliki).
- `https://elite-athlete.shop/rig-talk/assets/plany/th-tw-01.jpg?x=1` → obraz.
- `https://elite-athlete.shop/rig-talk/manifest.webmanifest?x=1` → ikony `assets/rigtalk-icon-192.png`/`512.png`.
Jeśli któryś zwraca 404 lub starą wersję — popraw upload, nie idź dalej.

## 5. Wyczyść cache CDN (obowiązkowo)
hPanel → Strony www → **elite-athlete.shop** → Wydajność → CDN → **„Opróżnij pamięć podręczną"**. Bez tego CDN trzyma stare pliki do 7 dni. Odczekaj ~1 min, powtórz test z pkt 4 BEZ `?x=1`.

## 6. Test na komputerze
Chrome → `https://elite-athlete.shop/rig-talk/` → Ctrl+Shift+R. Sprawdź: ekran „Co robisz teraz?", Montaż → rozdziały (Plan/Streszczenie, Układ opięcia, Parametry, Plany, Lista pytań), brak błędów w konsoli (F12). Po chwili znacznik u góry ma pokazać **„OFFLINE GOTOWE"**.

## 7. Aktualizacja telefonu Damiana (podaj mu dosłownie)
Aplikacja sama pobiera nową wersję i cały pakiet offline (147 plików z precache, ~7 MB). Wymagane jest Wi-Fi.
1. Telefon na **Wi-Fi**. Otwórz RIG TALK (ikona z ekranu głównego lub w Chrome `elite-athlete.shop/rig-talk/`).
2. Zostaw otwartą aplikację **~60 sekund** (service worker ściąga v31 w tle i przełącza się sam).
3. **Zamknij aplikację całkowicie** (przesuń z listy ostatnich) i otwórz ponownie. Powtórz raz.
4. U góry ma być zielone **„OFFLINE GOTOWE"**. Jeśli „OFFLINE ŁADUJE" — poczekaj na Wi-Fi i otwórz jeszcze raz.
5. Sprawdź, że to nowa wersja: Montaż → są kafle rozdziałów, w „Układ opięcia" generator, w „Plany" miniatury z PDF.
6. **Test samolotowy:** włącz tryb samolotowy → otwórz aplikację → Montaż, Plany (obrazy), Lista pytań, Parametry — wszystko ma działać. Dopiero potem wyłącz samolot.
7. Jeśli wciąż stara wersja: Chrome → ⋮ → Ustawienia → Ustawienia witryn → Wszystkie witryny → `elite-athlete.shop` → **Wyczyść dane** (UWAGA: kasuje postęp/ulubione — najpierw w aplikacji Ustawienia → **Pobierz kopię**, potem **Wczytaj kopię**). Otwórz ponownie na Wi-Fi.
8. Ikona: jeśli brak na ekranie głównym — Chrome ⋮ → „Zainstaluj aplikację". iPhone/Safari: Udostępnij → „Dodaj do ekranu początkowego" (może wylądować na dalszym ekranie).

Dane (postęp, ulubione, ustawienia) są w localStorage w telefonie — aktualizacja ich **nie kasuje**.

## 8. Raport końcowy do Damiana (krótko)
- co wgrano (liczba plików), data/rozmiar `sw.js`,
- wynik testów z pkt 4 i 6,
- czy CDN wyczyszczony,
- wszystko, co nie zadziałało (bez ukrywania).

## 9. Rollback
Gdy coś pęka: usuń zawartość `rig-talk/`, rozpakuj `rig-talk-backup-przed-v31.zip`, wyczyść CDN.
