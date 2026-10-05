# RIG TALK — logika aplikacji

> Ten dokument wyjaśnia sens produktu, zależności między elementami i powody decyzji. Nie jest listą plików ani changelogiem. Po każdej zmianie wpływającej na zachowanie aplikacji, dane, naukę lub nawigację należy zaktualizować odpowiednią sekcję oraz rejestr decyzji na końcu.

## 1. Po co istnieje aplikacja

RIG TALK nie jest ogólnym kursem angielskiego. To narzędzie operacyjne dla Damiana, który technicznie potrafi samodzielnie zbudować stoisko i ekran LED, ale musi przeprowadzić realizację po angielsku: wejść na halę, ustalić warunki z klientem, kierować anglojęzycznym stagehandem, rozwiązać problemy i przekazać instalację.

Najważniejszy rezultat brzmi: **realizacja ma zostać bezpiecznie i poprawnie wykonana mimo ograniczonego angielskiego**. Poprawność gramatyczna jest podporządkowana zrozumiałości, kontroli sytuacji i bezpieczeństwu.

Z tego wynikają cztery zasady nadrzędne:

1. Uczymy gotowych zwrotów, które można powiedzieć bez konstruowania zdania.
2. Najpierw TECH i konkretna misja, dopiero później angielski codzienny.
3. Użytkownik ma mówić na głos i podejmować decyzje, nie tylko czytać.
4. Aplikacja ma pozostać użyteczna offline jako trening i ściąga na obiekcie.

## 2. Aktualny kontekst operacyjny

- Wylot: 6 października 2026, godz. 06:00.
- Misja: pierwsze samodzielne stoisko, transparentny LED zawieszany na belkach.
- Zakres: przyjazd, rozpoznanie, ustalenia z klientem, koordynacja stagehanda, montaż, zasilanie i sygnał, opinanie, procesory, test na własnym komputerze oraz przekazanie klientowi.
- Ograniczenie: bardzo mało czasu na naukę, dlatego domyślnym widokiem kursu jest obecnie `PLAN 55H`, a nie pełny program.

Termin w planie 55H jest jedynym źródłem prawdy dla odliczania na Bazie i w planie (`content/bootcamp.json`). Nie utrzymujemy drugiej daty w JavaScript, ponieważ wcześniej powodowało to sprzeczne komunikaty „98 dni” i „42 godziny”.

## 3. Model produktu: dwie warstwy

### 3.1 Warstwa operacyjna

Ekran **STOISKO** odwzorowuje faktyczny przebieg pracy w dziesięciu etapach. To źródło odpowiedzi na pytanie: „Co robię teraz na miejscu?”. Każdy etap łączy:

- cel operacyjny;
- osobne zwroty do klienta, stagehanda i obsługi hali;
- rzeczy, które użytkownik może usłyszeć;
- checklistę wykonania;
- słownictwo techniczne;
- trening tylko tego etapu.

Checklista nie mierzy znajomości angielskiego. Mierzy wykonanie pracy. Pozwala używać aplikacji podczas realizacji, a nie tylko przed nią.

### 3.2 Warstwa treningowa

Ekran **55H / KURS** odpowiada na pytanie: „Czego mam się nauczyć teraz?”. Obecnie ma dwa tryby:

- `PLAN 55H` — krótka, liniowa ścieżka przed najbliższym wylotem;
- `PEŁNY KURS` — cały materiał TECH i CODZIENNY, przeznaczony do długofalowej nauki.

Rozdzielenie tych warstw jest celowe. Przebieg pracy na stoisku jest stały, ale plan nauki zmienia się zależnie od czasu i najbliższej misji.

### 3.3 Zwroty sytuacyjne w trybie Montaż

W trybie Montaż pierwszeństwo mają pełne zwroty i krótkie komendy, a dopiero później pojedyncze słowa. Osobny rozdział **Zwroty i komendy** grupuje materiał według siedmiu etapów dnia: przygotowanie, rigging i cabinety, kable i zasilanie, MX30/VMP/Resolume, test i multimedia, komendy całego dnia oraz demontaż. Te same adekwatne zwroty są wpięte w linię czasu i odpowiednie rozdziały techniczne, aby użytkownik nie musiał odrywać się od aktualnego zadania.

Każdy zwrot i każde słowo w listach operacyjnych ma przycisk `×`. Ukrycie jest globalne i trwałe na danym urządzeniu: pozycja znika ze wszystkich miejsc korzystających z tego samego identyfikatora. Ustawienia zawierają przycisk **Przywróć ukryte zwroty i słowa**, który cofa zarówno nowe ukrycia, jak i wcześniejsze trwałe usunięcia zwrotów. Stan jest zapisany w `hiddenItems` (schema v5), a źródłem zwrotów montażowych jest `content/phrases.json`.

## 4. Logika planu 55H

Plan 55H redukuje bazę 536 zwrotów do 59 unikalnych zwrotów o największej wartości operacyjnej. Materiał jest podzielony na dziewięć bloków:

1. Koło ratunkowe — odzyskanie kontroli, gdy użytkownik nie rozumie.
2. Pierwsze 10 minut z klientem — kontakt, osoba decyzyjna, plan i zmiany.
3. Ekran, belki i liczby — pozycja, wysokość, obciążenie i odpowiedzialność.
4. Stagehand — krótkie komendy montażowe i bezpieczeństwo.
5. Prąd i sygnał — elektryk, połączenia, kierunek danych i zakaz włączania.
6. Wykończenie i test — wygląd instalacji, usterka, korekta i zapis konfiguracji.
7. Przekazanie klientowi — laptop, HDMI, Extend, pełny ekran i zakaz zmian procesora.
8. Próba całej realizacji — rozumienie problemów oraz symulacja od początku do końca.
9. Ostatnie 15 minut — powtórka bez nowego materiału przed wyjazdem.

Kolejność wynika z ryzyka, nie z gramatyki. Najpierw użytkownik uczy się zatrzymać i uprościć rozmowę. Następnie zabezpiecza ustalenia, bezpieczeństwo oraz komendy. Dopiero później dochodzi programowanie i przekazanie.

### Status bloku i gotowość

Samo istnienie karty SRS oznacza wyłącznie rozpoczęcie nauki. Zwrot jest opanowany dopiero po co najmniej dwóch kontaktach i wejściu karty w stan `Review`. Wspólna funkcja w `js/readiness.js` dzieli zwroty na `unseen`, `learning` oraz `mastered`; z tej samej miary korzystają Baza i plan 55H.

Pierwszy nieopanowany blok, którego termin już nadszedł, jest oznaczony jako „ZALEGŁE · ZRÓB TERAZ”. Jeśli nie ma zaległości, aplikacja wskazuje najbliższy przyszły blok. Baza pokazuje ten blok jako jedną główną akcję wraz z gotowością całej misji.

### Trening bloku

Przycisk „Ćwicz teraz” wywołuje `startFocusedSession(ids)`. Sesja skupiona:

- korzysta wyłącznie z identyfikatorów wskazanego bloku;
- najpierw pokazuje zaległe karty, potem nowe, a na końcu pozostałe;
- nie stosuje dziennego limitu nowych zwrotów;
- nie dodaje ogólnej misji niezwiązanej z blokiem;
- po zakończeniu wraca do ekranu źródłowego.

To odstępstwo od zwykłego SRS jest świadome: krótki termin wymaga uczenia sytuacyjnego, a nie idealnego rozłożenia materiału w czasie.

## 5. Logika językowa

### 5.1 Jednostką jest zwrot

Każdy zwrot ma reprezentować jedną intencję: zapytać, potwierdzić, wydać komendę, nazwać problem albo zakończyć etap. Użytkownik A1 nie powinien budować wypowiedzi z reguł gramatycznych podczas pracy.

### 5.2 Naturalność

„Naturalnie” nie oznacza używania idiomów native speakera. Na międzynarodowych targach naturalne jest mówienie krótko i jasno. Dlatego preferujemy:

- „One moment.” zamiast rozbudowanych przeprosin;
- „Can we go through the plan?” zamiast formalnego języka biznesowego;
- „Hold it there. Don't move.” zamiast długiego opisu czynności;
- status + działanie: „One panel is dark. I'll check it.”;
- potwierdzanie liczb: „So, three metres?”.

Tekst ma brzmieć jak realna mowa na hali, ale pozostać zrozumiały dla osób, dla których angielski także nie jest językiem ojczystym.

### 5.3 SAY i HEAR

- `SAY` — użytkownik musi umieć samodzielnie wypowiedzieć zwrot.
- `HEAR` — użytkownik ma rozpoznać znaczenie wypowiedzi drugiej osoby i znać krótką odpowiedź `reply`.

Rozróżnienie jest konieczne, ponieważ repertuar rozumiany jest szerszy od repertuaru aktywnie używanego. Nie każemy użytkownikowi produkować wszystkich zdań, które może usłyszeć.

### 5.4 Ocena wymowy

Rozpoznawanie mowy porównuje transkrypcję z oczekiwanym zwrotem po normalizacji kontrakcji, wielkości liter i interpunkcji. Wynik mapuje się na:

- co najmniej 85% — Umiem;
- 60–84% — Trudne;
- poniżej 60% — Nie wiem.

To ocena zrozumiałości, nie akcentu. Użytkownik zawsze może ocenić się ręcznie, ponieważ Web Speech API nie jest niezawodne i może być niedostępne offline.

## 6. Nawigacja i sens ekranów

### BAZA

Centrum postępu: poziom, XP, misje, wybór długości codziennej sesji oraz wejście do misji stoiskowej. To ekran powrotu po zwykłym treningu.

### STOISKO

Instrukcja operacyjna i ściąga podczas montażu. Układ etapów jest ważniejszy niż kolejność nauki. Zwrot można odsłuchać, pokazać rozmówcy w dużym rozmiarze albo dodać do ulubionych.

### 55H

Domyślny plan szkolenia przed obecnym wylotem. Nazwa w dolnej nawigacji ma świadomie przypominać o ograniczonym czasie. Wewnątrz można przełączyć się na pełny kurs.

### CZERWONE

Tryb ratunkowy. Zawiera krótkie komunikaty potrzebne wtedy, gdy rozmowa lub realizacja zaczyna się sypać. To nie jest „kolejny moduł”, tylko szybki dostęp bez szukania.

### BIBLIOTEKA

Pełny katalog zwrotów, ulubione i słownik. Biblioteka służy do wyszukiwania oraz organizowania materiału, a nie do prowadzenia użytkownika przez kurs.

## 7. Ulubione i fiszki

Ulubione korzystają z istniejącej tablicy `state.starred`. Nie ma osobnego pola `favorites`, ponieważ dwa systemy zaznaczeń szybko przestałyby się zgadzać.

Dodanie ★ w Bibliotece, Stoisku lub Czerwonych natychmiast wpływa na:

- talię „Ulubione”;
- „Moją ściągę” w Czerwonych;
- priorytet kart w zwykłych powtórkach.

Ulubione mają dwa zapamiętywane tryby:

- **Lista** — szybki przegląd EN/PL, odsłuch oraz usuwanie pojedynczych zwrotów;
- **Fiszki** — jedna duża karta do aktywnego przypominania i obsługi gestami.

Tryb fiszek jest liniowy i zaczyna od polskiego znaczenia lub sytuacji, ponieważ celem jest samodzielne wyprodukowanie angielskiej odpowiedzi:

- dotknięcie karty odsłania model po angielsku;
- przesunięcie w lewo oznacza „jeszcze nie umiem” (`Again`);
- przesunięcie w prawo oznacza „umiem” (`Good`);
- te same oceny mają widoczne przyciski ze strzałkami;
- osobne strzałki nad kartą służą do przeglądania poprzedniego i następnego zwrotu bez oceny;
- każda ocena natychmiast aktualizuje kartę SRS i gotowość misji;
- koniec talii pokazuje wynik rundy i możliwość powrotu lub rozpoczęcia nowej rundy.

Usunięcie zwrotu w którymkolwiek trybie usuwa jego identyfikator z `state.starred`. Nie usuwa samego zwrotu z kursu ani historii SRS — znika tylko z ulubionych, ściągi i priorytetu gwiazdki.

## 8. Dane i źródła prawdy

### Treść

- `content/tech/*.json` — materiał techniczny.
- `content/daily/*.json` — materiał codzienny.
- `content/tech/t7.json` — zwroty konkretnej misji stoiskowej.
- `content/stoisko.json` — etapy, cele, checklisty i terminy.
- `content/bootcamp.json` — harmonogram oraz dobór zwrotów planu 55H.
- `content/glossary.json` — słownik techniczny z uproszczoną wymową.

Identyfikator zwrotu jest kluczem łączącym treść, SRS, ulubione, plan 55H i widoki. Zmiana ID istniejącego zwrotu może utracić powiązanie z zapisanym postępem użytkownika.

### Stan użytkownika

Stan jest przechowywany w `localStorage` pod kluczem `rigtalk.v1`. Obejmuje karty SRS, XP, sesje, ustawienia, ulubione, checklisty stoiska, bossów i stan interfejsu.

Od wersji v21 stan obejmuje też `deleted` (ID zwrotów usuniętych przez użytkownika na stałe) oraz `mx30.checks` (checklista identyfikacji i konfiguracji procesora). Usunięty zwrot znika z biblioteki, trybu hali, ulubionych i kolejek SRS; aktualizacja aplikacji nie przywraca go automatycznie. Własny zwrot można dodać globalnym przyciskiem `+ ZWROT` z każdego ekranu.

Zakładka STOISKO ma dwa tryby: `MONTAŻ` i `MX30 + LED`. Drugi jest terenowym manualem PL/EN opartym na rozmowach o MX30/COEX/VMP i dokumentach SQM39462. Fakty są oznaczone jako potwierdzone, warunkowe lub wymagające zatrzymania i backupu. Manual nie pozwala wysłać NCP/firmware bez identyfikacji modelu cabinetu, receiving card i rewizji.

Wynik ostatniej próby generalnej zapisuje się w `simulation`. Zwroty z sytuacji oznaczonych „Stanąłem” automatycznie trafiają do Ulubionych, dzięki czemu powstaje osobista talia braków bez tworzenia osobnego systemu kolejek.

`deepMerge` scala wyłącznie zwykłe obiekty. Tablice, daty i obiekty klas są zastępowane w całości. Ta zasada chroni daty kart FSRS przed zamianą na puste obiekty.

### Migracje

`schemaVersion` pozwala dodawać pola i zmieniać domyślne zachowanie bez kasowania postępu. Każda zmiana struktury trwałego stanu wymaga migracji oraz opisania jej w tym dokumencie.

## 9. Sesje i SRS

Zwykła sesja 5 lub 10 minut łączy:

1. zaległe powtórki;
2. ograniczoną liczbę nowych zwrotów;
3. zadanie praktyczne;
4. podsumowanie i nagrody.

FSRS planuje kolejne powtórki, a ulubione mają pierwszeństwo w kolejce. Gdy zaległości przekroczą limit, nowe zwroty są blokowane. Logika chroni przed dokładaniem materiału, którego użytkownik nie utrzyma.

Sesje planu 55H i etapów Stoiska są skupione. Mogą ominąć dzienny limit, ponieważ użytkownik świadomie wybiera konkretny materiał potrzebny do najbliższego zadania.

Sesja skupiona dostaje jawny limit równy liczbie zwrotów wybranego bloku lub modułu. Przycisk nie może deklarować treningu całego modułu, jeśli kolejka miałaby zostać ucięta do domyślnych 12 kart.

Tryb HEAR najpierw odtwarza wypowiedź bez transkrypcji. Użytkownik wybiera znaczenie, a angielski zapis pojawia się dopiero po odpowiedzi. Dostępne są prędkości „wolniej” i „realnie”.

Próba generalna jest osobnym trybem w ekranie 55H. Prowadzi przez osiem kolejnych sytuacji od wejścia na stoisko do przekazania ekranu. Użytkownik najpierw odpowiada na głos, potem odsłania model i zaznacza „Poszło” albo „Stanąłem”.

## 10. Gamifikacja

XP, poziomy, rangi riggerskie, misje i bossowie mają zwiększać regularność, ale nie mogą zasłaniać pracy. Nagrody są naliczane centralnie po zakończeniu sesji. Przerwanie sesji nie daje nagrody.

W trybie 55H najważniejszy jest postęp zwrotów i kolejne bloki. Gamifikacja pozostaje w tle, ponieważ krótkoterminowy cel jest wystarczająco konkretny.

## 11. Offline i service worker

Aplikacja jest PWA i używa strategii cache-first dla własnych zasobów. Nie korzysta z zewnętrznych fontów: Impact/Arial Narrow/Segoe UI pochodzą z systemu, dzięki czemu pierwszy start bez internetu nie zależy od Google Fonts. Baza pokazuje status gotowości cache offline. Każda zmiana plików aplikacji lub treści wymaga:

1. dodania nowego pliku do `PRECACHE_URLS`, jeśli jeszcze go tam nie ma;
2. podbicia `CACHE_NAME` w `sw.js`;
3. sprawdzenia, że service worker przejął nową wersję;
4. przy wdrożeniu na Hostingerze — wyczyszczenia cache CDN.

Instalacja offline pobiera pliki małymi partiami, a nowy cache staje się aktywny dopiero po zapisaniu całego pakietu. Jeśli pobranie któregokolwiek pliku zawiedzie, częściowy cache jest usuwany i użytkownik pozostaje na poprzedniej kompletnej wersji.

Przycisk „Aktualizuj bez utraty danych” w Ustawieniach wyrejestrowuje wyłącznie service workery zakresu `/rig-talk/`, usuwa wyłącznie cache o nazwie `rigtalk-*` i otwiera świeży adres sieciowy. Nie czyści `localStorage`, dlatego postęp, ulubione, własne zwroty i ustawienia pozostają zachowane.

Webhook AI jest na obcym originie i zawsze korzysta z sieci. Klucz API nigdy nie trafia do frontendu.

### Instalacja na telefonie

PWA korzysta z `manifest.webmanifest`, trybu `standalone` oraz ikon 192 i 512 px. Ikona ma czarne tło i dwie masywne linie tekstu: białe `RIG` oraz czerwone `TALK`. Celowo nie zawiera dodatkowego symbolu — nazwa ma pozostać jednoznaczna i czytelna w małym rozmiarze na ekranie telefonu. Wersja 180 px jest używana przez `apple-touch-icon` na iOS.

Publiczny `start_url` i `scope` wskazują potwierdzony w Menedżerze plików adres produkcyjny `https://elite-athlete.shop/rig-talk/`. Dzięki temu zainstalowana ikona zawsze otwiera właściwą wersję produkcyjną, także jeśli instalacja została rozpoczęta z linku przekazanego e-mailem. Stary folder `/nauka-angielskiego/` pozostaje poza zakresem wdrożenia.

### Tryb hali

Ekran Czerwone domyślnie otwiera „Tryb stoiska”. Globalne wyszukiwanie przeszukuje czerwone zwroty, sytuacje stoiska i Ulubione po polsku oraz angielsku. Opcjonalna blokada wygaszania korzysta z Screen Wake Lock API i jest uruchamiana wyłącznie gestem użytkownika.

## 12. Zasady interfejsu

- Obsługa jedną ręką i minimalny cel dotykowy 48 px.
- Najważniejsza czynność na ekranie ma jeden czerwony przycisk.
- Czerwień oznacza działanie lub element krytyczny, nie dekorację.
- Tryb ciemny jest jedynym trybem, zgodnym z marką i warunkami pracy.
- Tekst użytkownika jest wstawiany przez `textContent`, nie przez `innerHTML`.
- Ruch służy pokazaniu reakcji na gest lub zmianę stanu; nie jest ozdobą.
- Widok mobilny 375 px jest minimalnym punktem odbioru.

## 13. Kryteria każdej przyszłej zmiany

Zmiana jest zakończona dopiero wtedy, gdy:

1. zachowanie jest zgodne z misją produktu;
2. nowe dane przechodzą `node tools/validate.js`;
3. JavaScript przechodzi kontrolę składni;
4. najważniejszy przepływ został wykonany w przeglądarce;
5. konsola nie zawiera błędów aplikacji;
6. widok 375×812 nie ma poziomego scrolla;
7. w razie zmiany zasobów podbito cache service workera;
8. zaktualizowano `PROGRESS.md`;
9. zaktualizowano ten plik, jeśli zmienił się sens, dane albo zależności.

## 14. Jak aktualizować ten dokument

Nie dopisujemy tu opisu każdej kosmetycznej poprawki. Aktualizacja jest obowiązkowa, gdy zmienia się:

- cel lub priorytet produktu;
- ekran, jego odpowiedzialność albo miejsce w nawigacji;
- przepływ użytkownika;
- schemat danych lub trwały stan;
- algorytm nauki, oceny, kolejki lub nagród;
- znaczenie ulubionych, checklist, trybów albo postępu;
- logika offline, wdrożenia lub bezpieczeństwa;
- powód istotnej decyzji projektowej.

## 15. Rejestr decyzji

### 2026-10-03 — jedna lista dla gwiazdek i ulubionych

Wykorzystano `state.starred` zamiast tworzyć nowe `favorites`. Jedna decyzja użytkownika zasila talię ulubionych, ściągę i priorytet SRS.

### 2026-10-03 — talia ulubionych jest liniowa

Usunięto zapętlanie. Na pierwszej i ostatniej karcie odpowiedni przycisk jest nieaktywny. Powód: użytkownik musi rozumieć kierunek i widzieć zakończenie talii.

### 2026-10-03 — ulubione mają listę i fiszki

Lista służy do zarządzania zbiorem oraz szybkiego odsłuchu, a fiszki do aktywnego utrwalania pojedynczych zwrotów. Wybrany tryb jest zapisany w `ui.favoritesMode`, żeby aplikacja wracała do sposobu pracy wybranego przez użytkownika.

### 2026-10-03 — plan 55H przed pełnym kursem

Ze względu na wylot 06.10 o 06:00 pełny kurs został ukryty za drugim trybem. Domyślny plan obejmuje 59 zwrotów o największej wartości operacyjnej i dziewięć bloków zakończonych próbą całej realizacji.

### 2026-10-03 — własna ikona instalacyjna PWA

Dodano komplet ikon 180/192/512/1024 px. Ostateczny znak to `RIG` nad `TALK` na czarnym tle: prosty, jednoznaczny i czytelny w małym rozmiarze. Manifest używa ikon 192 i 512 jako `any maskable`, a iOS osobnej ikony 180 px.

### 2026-10-04 — gotowość zamiast „uruchomienia”

Postęp misji nie jest już liczony przez samo istnienie karty. Opanowanie wymaga powtórzeń i stanu Review. Powód: użytkownik potrzebuje uczciwej odpowiedzi „czy potrafię to powiedzieć”, a nie statystyki oglądania materiału.

### 2026-10-04 — gest fiszki jest oceną

Swipe w Ulubionych zapisuje `Again` lub `Good` bezpośrednio w FSRS. Strzałki do przeglądania pozostają osobnym sterowaniem, żeby nawigacja nie fałszowała wyniku nauki.

### 2026-10-04 — jedna następna czynność

Baza pokazuje jeden aktualny blok zamiast zmuszać użytkownika do ręcznego porównywania harmonogramu, zaległości i gotowości. Plan zachowuje pełną mapę, ale główny ekran odpowiada wyłącznie na pytanie „co robię teraz?”.

### 2026-10-04 — próba generalna buduje Ulubione

Sytuacje, w których użytkownik zaznaczył „Stanąłem”, dodają powiązane zwroty do Ulubionych. Dzięki temu symulacja automatycznie tworzy osobistą talię braków.

## v24 — tryb Montaż: wybór rozdziału
- Wejście w Montaż zawsze pokazuje siatkę rozdziałów (`ui.stoiskoMode = 'hub'`). Rozdział „MX30" i „Etapy stoiska" otwierają istniejące widoki (`mx30`, `stages`), pozostałe są w `js/montaz.js` na danych z `content/montaz.json`.
- Zasada danych: każda liczba ma źródło (plik SQM + strona). Czego nie ma w dokumentach, jest oznaczone BRAK DANYCH, a nie zgadywane.
- Kalkulator: rozdzielczość cabinetu = round(rozmiar / pitch). Wynik jest warunkowy i ma być potwierdzony w VMP/NCP. Limit pikseli na port to wartość orientacyjna do weryfikacji w karcie MX30.
- Stan: `montaz.checks` (kompletacja), `montaz.calc` (ostatnie wartości kalkulatora), `ui.montazChapter` (otwarty rozdział).

## v26 — instrukcje procesora z oficjalnych manuali
- Rozdziały MX30, VMP i Resolume mają kroki po angielsku (jak w manualu) i tłumaczenie PL. Każdy blok podaje źródło (manual, sekcja, strona). Status bloku: z oficjalnej instrukcji / wyliczone / ogólne do potwierdzenia.
- Limit portu w kalkulatorze: wzór z MX30 Manual sekcja 11. Zmiana karty odbiorczej (A10s Pro: × 32 dla 10 bit) zmienia limit 10 bit.
- Swift Layout w MX30 działa tylko przy równym podziale cabinetów na porty będącym wielokrotnością liczby rzędów lub kolumn. Kalkulator szuka takiego podziału.

## v28 — menu montażu i układ ekranu
- Menu montażu: każdy rozdział ma `group` (kolor) i `stage` (etap pracy). Widoki Mapa, Kolejność i Tematy korzystają z tych samych danych (`content/montaz.json`). Dolny pasek i pasek szybkiej powtórki są dostępne w każdym rozdziale trybu Montaż.
- Układ ekranu: linie DATA i zasilania liczone osobno (wężyk góra–dół). Porty główne to nieparzyste, zapasowe parzyste (Sequential Backup). Przy 2 lub 4 kolumnach na linię początek i koniec linii są u góry; przy 3 koniec jest na dole.
- Moc cabinetu: max 263 W, średnio 88 W (producent INFiLED, do potwierdzenia). Moc max występuje tylko przy pełnej bieli.

## v31 — struktura rozdziałów i fazy
- Każdy rozdział: ramka „W skrócie” (`content/montaz.json → summary`), plan rozdziału (z `js/acc.js → outline`, odświeżany przy kliknięciu, bo generator przerysowuje sekcje), potem podrozdziały jako `details`. Podtytuł w stanie zwiniętym to pierwsze zdanie albo lista pozycji.
- Zasilanie: linie rozkładane zachłannie na fazy (najpierw najliczniejsze linie na najmniej obciążoną fazę). Przy 4 liniach po 16 cabinetów na 3 fazach wychodzi 32/16/16, więc aplikacja podpowiada podział 1 kolumna na linię (24/24/16).
- Standard faz hali nie jest w dokumentach SQM. 60 kW przy 400 V to około 87 A na fazę (wyliczenie), przy równym obciążeniu.

## v32: parametry z drill-downiem i szukajka
- `content/montaz.json` → `param.sections[].rows[].d` = `{k: kroki, v: jak sprawdzić, x: uwaga}` albo `{sub:[...]}` (zasilanie). Wiersz bez `d` renderuje się płasko. Powód: użytkownik nie może nic szukać w terenie; każda wartość ma dokładną ścieżkę kliknięć.
- `param.multi`: wartości występujące w wielu miejscach (rozdzielczość, odświeżanie, skala). Źródło prawdy to EDID w MX30, potem Windows, Resolume, VMP.
- Zasada: czego nie ma w manualach lub PDF-ach, oznaczamy „BRAK DANYCH / potwierdź”, nie zgadujemy. Ścieżki Windows: Win11 po polsku, wersje mogą się różnić nazwą.
- Szukajka (`buildIndex` w montaz.js) indeksuje rozdziały, parametry, kroki programów; wynik parametru ustawia `ui.paramFocus`, a rozdział otwiera i przewija do pozycji.
