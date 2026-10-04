# RIG TALK by BYQ: plan i metodyka

> Mobilna aplikacja (PWA) do nauki angielskiego branżowego i codziennego dla kierownika stoiska i realizacji: multimedia, LED, rigging.
> Autor planu: Opus 5.5 (24.09.2026). Kodowanie: Sonnet 5, etapami E0–E13 (sekcja 9).
> **Cel twardy:** 01.01.2027 gotowość, 10.01.2027 samodzielna obsługa stoiska od A do Z.

---

## 0. Profil ucznia (z wywiadu, obowiązuje przy każdej decyzji)

| Parametr | Wartość | Konsekwencja projektowa |
|---|---|---|
| Poziom startowy | **A1** | Nauka całymi zwrotami, zero wykładów z gramatyki; każdy zwrot z audio i tłumaczeniem PL |
| Czas | sesja do wyboru **5 MIN albo 10 MIN** (przerwa na obiekcie / wieczór) | Dwa warianty sesji (§2.1); druga sesja dnia ×2 XP |
| Gdzie | przerwy na obiekcie, wieczór w domu | Duże przyciski (rękawice), jedna ręka, praca bez sieci, krótkie ekrany |
| Jak się uczy | słuchanie, mówienie na głos, scenki | Rdzeń: słuchaj, powtarzaj (shadowing), odpowiedz w scence |
| Język interfejsu | PL, który stopniowo przechodzi w EN | „L1 fade”: im wyższy level, tym mniej polskiego (§5.10) |
| AI | **tylko korekta** | Przycisk „Sprawdź mnie”: Claude Haiku przez webhook n8n, bez rozmowy na żywo |
| Technologia | **Android: PWA na Hostingerze + plik APK** (Trusted Web Activity) | Czysty HTML/JS/CSS bez bundlera, tak jak Studio Scenariuszy i Baza Wiedzy; APK w etapie E13 |
| Wariant angielskiego | **międzynarodowy + UK/US** | Baza to zwroty zrozumiałe wszędzie; przy różnicach pokazujemy obie wersje (`variants.uk/us`) |
| Struktura | **dwa osobne tory**: CODZIENNY (D) i TECH (T), każdy z własną biblioteką + 🟥 CZERWONE (ratunkowe, z ⭐) | §4, §5 |
| Motywacja | XP i levele, rangi riggerskie, misje dnia i tygodnia, boss fight | Sekcja 6 |
| Sytuacje TECH | stoisko/targi, oferta i negocjacje, realizacja on-site, promocja i networking | Tor T: moduły T0–T6 (§4) |
| Sytuacje CODZIENNE | small talk, sklep, kawiarnia i bar, ulica i transport, hotel i lotnisko, telefon, problemy, **komplementy i flirt z klasą** | Tor D: moduły D1–D10 (§4) |
| Specjalizacja tech | TV, ekrany dotykowe, ekrany LED (podwieszane i zabudowane), taśmy LED, kable, zasilanie, sygnał, co się da, a czego się nie da | Moduł T2 |
| Szczególny nacisk | klient zmieniający wszystko w ostatniej chwili; sztuka wpływu, żeby wszyscy byli zadowoleni, a klient jeszcze podziękował | Moduł T5 + boss fighty |

### Szczera kalkulacja (ważne)
5 min × ok. 98 dni to ok. **8 godzin nauki**, a 10 min ok. **16 godzin**. Z poziomu A1 to **nie da** swobodnych negocjacji. To **da**:
- ok. **250–350 opanowanych zwrotów** przy 5 min i ok. **350–450** przy 10 min, które pokrywają rdzeń sytuacji na stoisku i w codziennym życiu,
- **gotowe skrypty** każdej rozmowy (powitanie, pytania, demo, kontakt, zamknięcie),
- **tryb „Ściąga Stoiska”**: offline, duża czcionka, z audio, plus **karty „pokaż klientowi”** (zakładka 🟥 CZERWONE, §5.8), czyli koło ratunkowe, kiedy słowa nie przyjdą.

**Rekomendacja:** 5 MIN na przerwie jako obowiązek, a 10 MIN wieczorem, kiedy się da. Aplikacja nagradza drugą sesję podwójnym XP, ale nigdy za nią nie karze.

---

## 1. Metodyka: 10 filarów (wszystkie oparte na badaniach, każdy przełożony na funkcję)

| # | Filar | Źródło / nurt | Jak to działa w aplikacji |
|---|---|---|---|
| 1 | **Lexical chunks**: uczysz się całych zwrotów, nie słówek | Lewis, *Lexical Approach*; Nattinger & DeCarrico | Jednostką nauki jest zwrot (*"Let me show you how it works."*), nie słowo „show” |
| 2 | **Spaced retrieval** (powtórki w optymalnym momencie) | Ebbinghaus; Karpicke & Roediger; algorytm **FSRS v6** | Biblioteka `ts-fsrs` (MIT, UMD) planuje, kiedy zwrot wraca |
| 3 | **Retrieval > re-reading**: najpierw próbujesz sam, potem widzisz odpowiedź | Testing effect | Karta pokazuje PL albo audio sytuacji, Ty mówisz EN, dopiero potem odsłona |
| 4 | **Shadowing**: powtarzanie za lektorem z opóźnieniem ok. 0,5 s | Kadota; Hamada | Każdy nowy zwrot: odsłuch → 2 razy shadowing → nagranie i ocena rozpoznawania mowy |
| 5 | **Comprehensible input i+1** | Krashen | Dialogi w scenach są o jeden stopień trudniejsze niż opanowane zwroty; kluczowe słowa zawsze klikalne (PL) |
| 6 | **Pushed output i korekta** | Swain (Output Hypothesis); Lyster (recasts) | Misja: sam mówisz lub piszesz, AI pokazuje wersję poprawną i naturalną (recast) oraz 1 wskazówkę po PL |
| 7 | **Task-Based Learning** | Ellis; Willis | Każda jednostka kończy się zadaniem z realnego życia („Zatrzymaj przechodzącego i zapytaj o jego event”) |
| 8 | **Interleaving i desirable difficulties** | Bjork | Powtórki mieszają moduły (tech + small talk + negocjacje), jak w realnej rozmowie |
| 9 | **L1 fade**: polski stopniowo znika | Scaffolding (Wood, Bruner, Ross) | Levele 1–5: pełne PL; 6–12: PL tylko na żądanie; 13+: interfejs EN |
| 10 | **Intelligibility over accent**: ma być zrozumiałe, nie brytyjskie | Jenkins (Lingua Franca Core); Levis | Ocena wymowy sprawdza rozpoznawalność i akcent wyrazowy, nie „ładność”. Klienci na targach to też nie native speakerzy |

### 1.1 Zasady pisania treści (Sonnet: stosuj bez wyjątku)
1. **Zwrot = 3–9 słów**, gotowy do powiedzenia bez zmian. Zdania dłuższe dzielimy.
2. **Tylko proste czasy**: Present Simple, Present Continuous, `will`, `can`, `going to`, imperatyw. Past Simple dopiero od T4 i D6. Żadnych Perfectów w T0–T2 i D1–D5 (wyjątek: gotowe formułki typu *Have you tried…?*, *I have a booking*).
3. **Każdy zwrot ma**: `en`, `pl` (naturalne, nie dosłowne), `hint_pl` (kiedy użyć, 1 zdanie), `variants` (obiekt: `uk` / `us` / `alt[]`, 1–2 alternatywy), `tags`, `track`, `type`, `register`, `red`.
4. **Szablony z lukami** (`slot`): *"The screen is [3] by [2] meters."*: jeden szablon, wiele użyć.
5. **Zawsze wersja „ratunkowa”**: przy trudnych tematach dodaj prostszy zwrot, który mówi to samo (*"It's not possible."* ↔ *"We can't do that, but we can do this."*).
6. **Język międzynarodowy targowy**: zwroty zrozumiałe dla Niemca, Włocha i Araba, bez idiomów typu *"piece of cake"*.
7. **Ton kierownika**: pewny, uprzejmy, konkretny. Zero przepraszania bez powodu (tor T).
8. **Dwa typy kart**: `SAY` (mówisz) i `HEAR` (słyszysz od kasjera, kelnera, recepcji: rozumienie, a `reply` to typowa Twoja odpowiedź). Tego, co słyszysz, jest inaczej i więcej niż tego, co mówisz.
9. **Żywa forma, nie podręcznikowa**: *No worries / No problem* zamiast *You're welcome*; *Can I get…*; *Good, thanks. You?* zamiast *I'm fine, thank you, and you?*. Spoken grammar (Carter & McCarthy): elipsa (*Sounds good.*) i krótkie reakcje są pożądane.
10. **Warianty UK/US** tylko tam, gdzie się różnią (`variants.uk`, `variants.us`), np. *the bill / the check*, *take away / to go*, *till / checkout*.
11. **Rejestr** (`register`): `neutral` domyślnie, `casual` (znajomi, bar), `polite` (klient, recepcja).
12. **Źródło treści:** `RESEARCH-ZWROTY.md`: inwentarz ok. 420 zwrotów + wnioski z researchu. Nie wymyślaj zwrotów spoza niego bez potrzeby; jeśli dodajesz, trzymaj ten sam styl.

---

## 2. Anatomia sesji

### 2.1 „RIG CHECK”: sesja do wyboru 5 MIN albo 10 MIN
Start: dwa duże przyciski **5 MIN** / **10 MIN** + wybór toru **CODZIENNY / TECH / MIX**. Domyślnie MIX 50/50; od 15.12 automatycznie 30/70 na korzyść TECH (zbliża się stoisko).

| Blok | 5 MIN | 10 MIN | Co się dzieje |
|---|---|---|---|
| **Powtórki (Load Check)** | 2:00, max 10 | 4:00, max 20 | Zwroty z FSRS, przy czym ⭐ z CZERWONYCH mają priorytet. SAY: sytuacja PL + 🔊, mówisz EN, odsłona, ocena (auto z rozpoznawania mowy + korekta ręczna: *Again / Hard / Good / Easy*). HEAR: samo audio → wybierz znaczenie z 3 → powiedz `reply` |
| **Nowe zwroty (New Gear)** | 2:00, 3 szt. | 3:30, 5 szt. (w tym 1–2 HEAR) | 🔊 odsłuch → 2× shadowing → powiedz sam → mini-dialog 2 linijek, w którym zwrot pada |
| **Misja (Job)** | 1:00 | 2:30 | 5 MIN: 1 sytuacja („Klient pyta, czy ekran może wisieć nad wejściem. Odpowiedz.”). 10 MIN: mini-scena 4–6 linii albo łańcuch small talku (starter → reakcja → dopytanie → własna wstawka). Opcjonalnie „Sprawdź mnie” (AI) |
| **Podsumowanie** | | | +XP (50 / 110), pasek levelu, 1 zdanie motywacji w stylu BYQ („Lina napięta. Jutro kolejny punkt.”) |

**Zasada:** jeśli powtórek jest za dużo (po przerwie), sesja bierze tylko limit, a reszta czeka. Nowe zwroty są blokowane, gdy zaległości > 30 (priorytet: nie zapomnieć). Druga sesja tego samego dnia daje ×2 XP.

### 2.2 Tryby dodatkowe (poza RIG CHECK)
Z zakładek toru: **Scena** (dialog 8–12 linijek z odgrywaniem roli), **Boss Fight** (gdy odblokowany), **Szybka powtórka** (tylko FSRS, dowolny czas), **Trening CZERWONYCH** (tylko ⭐).

### 2.3 „DRESS REHEARSAL”: próba generalna (od 15.12.2026)
Pełna symulacja dnia na stoisku: 5 klientów pod rząd, losowe typy, w tym jeden boss. Ocena końcowa i lista zwrotów do dociśnięcia.

---

## 3. Mowa, audio, AI: technologia nauki

### 3.1 Synteza mowy (TTS)
- MVP: `window.speechSynthesis`, preferowany głos `en-GB` lub `en-US` (wybór w ustawieniach), tempo 0.85 dla nowych, 1.0 dla powtórek, przycisk 🐢 (0.7).
- Upgrade (etap po MVP): wygenerowane pliki MP3 dla wszystkich zwrotów (lepsza jakość, offline). Struktura `audio/{id}.mp3`, aplikacja najpierw szuka MP3, potem korzysta z TTS.

### 3.2 Rozpoznawanie mowy (ocena wymowy)
- `window.SpeechRecognition || window.webkitSpeechRecognition`, `lang='en-US'`, `interimResults=false`, `maxAlternatives=3`.
- **Ocena**: normalizacja (małe litery, bez interpunkcji, `it's` → `it is`), dopasowanie na poziomie słów (Levenshtein na tokenach) z najlepszą z 3 alternatyw. Wynik ≥85% to *Good*, 60–84% to *Hard*, <60% to *Again*. Użytkownik zawsze może zmienić ocenę.
- ⚠️ **Znane ograniczenie (zweryfikowane):** rozpoznawanie działa w Chrome na Androidzie (wymaga sieci). Na **iPhonie w zainstalowanej PWA nie działa** (działa tylko w samym Safari). **Fallback:** gdy API brak, przycisk „Powiedziałem, oceniam sam” + nagranie przez `MediaRecorder` do odsłuchu własnego głosu obok lektora.
- Wymaga HTTPS (Hostinger ma SSL).

### 3.3 AI: tylko korekta („Sprawdź mnie”)
- Frontend **nigdy** nie trzyma klucza API. Przepływ: aplikacja → `POST` webhook n8n (`https://n8n.srv1055997.hstgr.cloud/webhook/rig-talk-check`) → Claude **Haiku 4.5** (`claude-haiku-4-5-20251001`) → JSON wraca do aplikacji.
- Wejście: `{ task_pl, context, expected_intent, user_text, level }`
- Wyjście (wymuszony JSON, `score` w skali 0–100):
```json
{ "ok": true, "score": 85, "corrected": "...", "natural": "...", "tip_pl": "1 krótkie zdanie", "new_chunk": "opcjonalny zwrot do talii" }
```
- Prompt systemowy (w n8n): *„You are a friendly English coach for a Polish A1–A2 event-tech project manager. Judge whether the message would work with a real client at a trade fair. Be strict on meaning, lenient on grammar. Return ONLY JSON…”*
- Limity: max 30 zapytań dziennie (licznik lokalny); przy braku sieci przycisk jest wyszarzony, a misja zalicza się bez AI.
- `new_chunk` → przycisk „+ Do talii”, dzięki czemu zwrot z korekty wchodzi do FSRS.

---

## 4. Program: dwa tory, moduły, jednostki, liczby

Struktura: **Tor → Moduł → Jednostki (po ok. 8 zwrotów + 1 dialog + 1 misja) → Boss na końcu modułu.**
Dwa **osobne tory**, każdy z własną zakładką, biblioteką i paskiem postępu; XP, level i ranga są wspólne:
- **TOR D: CODZIENNY**: small talk, sklep, kawiarnia, ulica, hotel, telefon, problemy, komplementy.
- **TOR T: TECH**: stoisko, technika, oferta, realizacja, klient, promocja.
- **🟥 CZERWONE**: przekrojowa biblioteka ratunkowa (ok. 80 zwrotów z obu torów, pole `red:true`), z ⭐ do własnej ściągi.

Pełny inwentarz zwrotów do obu torów: **`RESEARCH-ZWROTY.md`** (ok. 420 pozycji, SAY/HEAR, UK/US, 🟥).

### 4.1 TOR T: TECH
Kolejność odblokowania: T0 → T1 → T2 → T3 → T4 → T5 → T6.

| Moduł | Nazwa (w aplikacji) | Jednostki | Zwroty + terminy | Termin opanowania |
|---|---|---|---|---|
| **T0** | SURVIVAL KIT (praca) | 3 | 24 | do 05.10 |
| **T1** | THE STAND (stoisko) | 6 | 48 | do 26.10 |
| **T2** | TECH TALK (LED, TV, dotyk, kable, rigging): poszerzony słownik | 10 | 80 + ok. 60 terminów | do 23.11 |
| **T3** | THE DEAL (oferta, negocjacje) | 5 | 40 | do 07.12 |
| **T4** | SHOW DAY (realizacja on-site, ekipa, BHP) | 5 | 40 | do 14.12 |
| **T5** | CLIENT CONTROL (zmiany last minute, sztuka wpływu) | 5 | 40 | do 21.12 |
| **T6** | GET KNOWN (promocja, networking, referencje) | 3 | 24 | do 28.12 |
| | **Razem T** | **37** | **ok. 300 + terminy** | |

**Mapa jednostek T:**
**T0 SURVIVAL KIT**: U1 Hello & names · U2 „Sorry, again please / slowly / one moment” · U3 Numbers, sizes, time, prices
**T1 THE STAND**: U1 Opener (zatrzymanie przechodzącego) · U2 Qualifying (pytania o event, termin, miejsce) · U3 Demo (pokaz na ekranie) · U4 Contact (wizytówka, email, WhatsApp) · U5 Closing & next step · U6 Stand logistics (kiedy otwarte, kto decyduje)
**T2 TECH TALK**: U1 LED walls (pixel pitch, cabinet, module, brightness/nits, viewing distance) · U2 LED control (processor, sending/receiving card, calibration, dead pixel, content format) · U3 Hung LED & rigging (chain hoist, bridle, spanset, shackle, truss, WLL, trim height) · U4 Ground support, ballast, floor LED · U5 Built-in LED & LED strips · U6 TVs & displays (portrait/landscape, wall mount, floor stand) · U7 Touch screens (touch overlay, media player, Windows/Android, content) · U8 Cables & signal (HDMI length, extender, fibre, SDI, Cat6) · U9 Power (socket, 16A/32A, power distribution, cable ramp, gaffer tape) · U10 **Can / Can't / Needs** (co się da, a co nie, warunki)
**T3 THE DEAL**: U1 Scope · U2 Price & options (pakiety A/B/C) · U3 Timeline & deadlines · U4 Objections (za drogo, pomyślę, konkurencja) · U5 Confirming in writing
**T4 SHOW DAY**: U1 Load-in & schedule · U2 Safety & commands (*"Stand clear!"*, *"Load coming in!"*, *"Stop!"*) · U3 Instructions to crew · U4 Problem solving (nie działa, zamiennik) · U5 Handover & sign-off
**T5 CLIENT CONTROL**: U1 Last-minute change (proces zmiany) · U2 Choice framing (A lub B, nigdy tak lub nie) · U3 Saying no without saying no · U4 Calming & empathy · U5 Asking for thanks, review, referral
**T6 GET KNOWN**: U1 30-second pitch · U2 Networking na targach · U3 Social media & follow-up email

### 4.2 TOR D: CODZIENNY
Kolejność odblokowania: D1 → D2 → (D3, D4, D5, D6 dowolnie) → D7 → D8 → D9 → D10. D10 (prośby o powtórzenie, „nie rozumiem”) jest w całości w CZERWONYCH, więc dostępny od pierwszego dnia.

| Moduł | Nazwa (w aplikacji) | Jednostki | Zwroty SAY + HEAR | Termin opanowania |
|---|---|---|---|---|
| **D1** | FIRST SECONDS (pierwsze sekundy) | 2 | ok. 20 | do 05.10 |
| **D2** | CONVERSATION GLUE (reakcje, wypełniacze, kolokacje) | 5 | ok. 65 | do 26.10 |
| **D3** | SHOP (sklep i kasa) | 4 | ok. 40 | do 09.11 |
| **D4** | FOOD & DRINKS (kawiarnia, restauracja, bar) | 4 | ok. 35 | do 16.11 |
| **D5** | STREET (ulica, kierunki, transport) | 3 | ok. 30 | do 23.11 |
| **D6** | HOTEL & AIRPORT | 3 | ok. 26 | do 30.11 |
| **D7** | SMALL TALK (łańcuchy rozmowy) | 4 | ok. 37 | do 07.12 |
| **D8** | CHARM (komplementy i flirt z klasą) | 3 | ok. 28 | do 14.12 |
| **D9** | PHONE & PLANS (telefon, WhatsApp, umawianie) | 3 | ok. 24 | do 21.12 |
| **D10** | TROUBLE (problemy, zdrowie, przeprosiny) | 3 | ok. 27 | od razu w CZERWONYCH; pełny do 28.12 |
| | **Razem D** | **34** | **ok. 330** | |

**Mapa jednostek D:**
**D1 FIRST SECONDS**: U1 Hello & how are you (realne odpowiedzi: *Good, thanks. You?*) · U2 Goodbyes & UK/US powitania (*Are you alright?*, *What's up?*)
**D2 CONVERSATION GLUE**: U1 Reakcje pozytywne (*No way! Nice! Fair enough.*) · U2 Reakcje negatywne i empatia (*Oh no. That's too bad.*) · U3 Zgoda, niezgoda, niepewność (*I think so. It depends.*) · U4 Wypełniacze i łączniki (*Well… I mean… Actually… Anyway…*) · U5 HEAR: PHRASE List (*as well, at all, hang on, make sure, to be honest*)
**D3 SHOP**: U1 Szukam i pytam · U2 Rozmiar, kolor, przymierzalnia · U3 Kasa (HEAR: *Anything else? Card or cash? Do you need a bag?*) · U4 Zwrot i reklamacja
**D4 FOOD & DRINKS**: U1 Kawa na wynos · U2 Restauracja: zamówienie · U3 Rachunek i napiwek · U4 Bar i toast
**D5 STREET**: U1 Pytanie o drogę + HEAR wskazówek · U2 Bilety i komunikacja · U3 Taxi/Uber i parking
**D6 HOTEL & AIRPORT**: U1 Check-in, Wi-Fi, śniadanie · U2 Problem w pokoju, check-out · U3 Lotnisko i kontrola
**D7 SMALL TALK**: U1 Skąd, co robisz, co Cię tu sprowadza · U2 Dopytania i własne wstawki · U3 Pogoda, sport, jedzenie · U4 Weekend i plany
**D8 CHARM**: U1 Zasady + komplementy za styl, gust, energię · U2 Zagadanie, kawa, numer, Instagram · U3 Przyjęcie komplementu i odmowy z klasą
**D9 PHONE & PLANS**: U1 Rozmowa telefoniczna (zasięg, oddzwonię) · U2 Umawianie się · U3 Spóźnienie, „jestem w drodze”
**D10 TROUBLE**: U1 Nie rozumiem / powtórz / wolniej · U2 Zdrowie i apteka · U3 Przeprosiny i pomyłki

### 4.3 🟥 CZERWONE: biblioteka ratunkowa
- Ok. 80 zwrotów oznaczonych 🟥 w `RESEARCH-ZWROTY.md` (z obu torów) + blok „CZERWONE: dodatkowe z pracy”.
- Dostępna od dnia 1, niezależnie od odblokowań. Każdy zwrot ma ⭐; zaznaczone trafiają do **Mojej ściągi** i do powtórek z priorytetem.
- Grupy: *Nie rozumiem* · *Chwileczkę* · *Kontakt* · *Zakupy i jedzenie* · *Droga i transport* · *Telefon* · *Awaria i BHP* · *Zdrowie*.

### 4.4 Próbka jakości (wzorzec dla Sonnet, taki poziom w każdym module)

```json
[
  {"track":"T","type":"SAY","id":"t1u1-01","en":"Hi! Are you planning an event?","pl":"Cześć! Planuje Pan jakiś event?","hint_pl":"Otwieracz do przechodzącego, pytanie zamiast reklamy.","variants":{"alt":["Hello! What brings you here today?"]},"tags":["stand","opener"]},
  {"track":"T","type":"SAY","id":"t1u2-03","en":"When and where is your event?","pl":"Kiedy i gdzie jest Wasz event?","hint_pl":"Kwalifikacja: od tego zależy, czy to realny klient.","variants":{"alt":["What's the date of your event?"]},"tags":["stand","qualify"]},
  {"track":"T","type":"SAY","id":"t1u4-02","en":"Can I have your email? I'll send you an offer.","pl":"Mogę prosić o maila? Wyślę ofertę.","hint_pl":"Zawsze podaj powód, wtedy łatwiej o kontakt.","variants":{"alt":["Let's scan your badge, okay?"]},"tags":["stand","contact"]},
  {"track":"T","type":"SAY","id":"t2u1-04","en":"From this distance, you need [2.9] millimetre pixel pitch.","pl":"Z tej odległości potrzebuje Pan rozstawu pikseli [2,9] mm.","hint_pl":"Szablon z luką, wstaw liczbę.","variants":{"alt":["For close viewing, we use a smaller pitch."]},"tags":["tech","led"],"slot":true},
  {"track":"T","type":"SAY","id":"t2u2-05","en":"We need a rigging point that holds [500] kilos.","pl":"Potrzebujemy punktu podwieszenia na [500] kg.","hint_pl":"Kluczowe przy ekranach podwieszanych.","variants":{"alt":["What is the load limit of this ceiling?"]},"tags":["tech","rigging"],"slot":true},
  {"track":"T","type":"SAY","id":"t2u6-02","en":"HDMI works up to 15 metres. Longer, we use fibre.","pl":"HDMI działa do 15 metrów. Dłużej: światłowód.","hint_pl":"Typowa zagwozdka: klient chce ekran daleko od źródła.","variants":{"alt":["For long distances, we convert the signal."]},"tags":["tech","cables"]},
  {"track":"T","type":"SAY","id":"t2u8-01","en":"Yes, that's possible. We need one more day.","pl":"Tak, to możliwe. Potrzebujemy jednego dnia więcej.","hint_pl":"Tak, ale z warunkiem. Najlepsza forma odpowiedzi.","variants":{"alt":["Yes, if we get power here."]},"tags":["tech","feasibility"]},
  {"track":"T","type":"SAY","id":"t3u2-02","en":"We have two options: standard or premium.","pl":"Mamy dwie opcje: standard albo premium.","hint_pl":"Choice framing: klient wybiera między Twoimi opcjami.","variants":{"alt":["Option A is faster. Option B is cheaper."]},"tags":["deal","options"]},
  {"track":"T","type":"SAY","id":"t4u2-01","en":"Stand clear! Load coming in!","pl":"Odsunąć się! Ładunek idzie!","hint_pl":"Komenda BHP: głośno, krótko, bez grzeczności.","variants":{"alt":["Heads up! Load moving!"]},"tags":["site","safety"]},
  {"track":"T","type":"SAY","id":"t5u1-01","en":"No problem. Let me check what this changes.","pl":"Nie ma problemu. Sprawdzę, co to zmienia.","hint_pl":"Zmiana last minute: nie mówisz nie, przejmujesz kontrolę.","variants":{"alt":["Good idea. Let's look at time and cost."]},"tags":["client","change"]},
  {"track":"T","type":"SAY","id":"t5u1-03","en":"We can do it tomorrow, or today with extra cost.","pl":"Możemy zrobić to jutro albo dziś za dopłatą.","hint_pl":"Dwie opcje zamiast odmowy; klient sam wybiera rozsądną.","variants":{"alt":[]},"tags":["client","change","framing"]},
  {"track":"T","type":"SAY","id":"t5u3-02","en":"I understand. Here is what I can do for you.","pl":"Rozumiem. Oto co mogę dla Pana zrobić.","hint_pl":"Odmowa bez słowa „nie”, od razu alternatywa.","variants":{"alt":[]},"tags":["client","no"]},
  {"track":"T","type":"SAY","id":"t5u5-01","en":"Are you happy with the result?","pl":"Jest Pan zadowolony z efektu?","hint_pl":"Najpierw „tak” klienta, potem prośba o opinię.","variants":{"alt":[]},"tags":["client","thanks"]},
  {"track":"T","type":"SAY","id":"t5u5-02","en":"Great! Can you write two words about us?","pl":"Super! Napisze Pan o nas dwa słowa?","hint_pl":"Opinia lub referencja: prośba w momencie zadowolenia.","variants":{"alt":["Do you know someone who needs this too?"]},"tags":["client","review"]},
  {"track":"D","type":"SAY","id":"d1u1-04","en":"Good, thanks. You?","pl":"Dobrze, dzięki. A Ty?","hint_pl":"Tak naprawdę odpowiada się na How are you, nie „I'm fine, thank you”.","variants":{"alt":["Not bad, thanks. And you?"]},"register":"casual","red":true,"tags":["greeting"]},
  {"track":"D","type":"HEAR","id":"d1u2-01","en":"Are you alright?","pl":"Cześć, co tam? (UK, nie pytanie o zdrowie)","reply":"Yeah, good, you?","hint_pl":"W UK to zwykłe powitanie, np. w sklepie.","variants":{"uk":"Are you alright?","us":"How's it going?"},"register":"casual","red":false,"tags":["greeting","uk"]},
  {"track":"D","type":"HEAR","id":"d3u3-04","en":"Do you need a bag?","pl":"Potrzebuje Pan reklamówki?","reply":"No, I'm good, thanks.","hint_pl":"Kasa: pytanie o torbę pada prawie zawsze.","variants":{"uk":"Do you want a bag?"},"register":"neutral","red":false,"tags":["shop","checkout"]},
  {"track":"D","type":"SAY","id":"d4u3-01","en":"Can I get the bill, please?","pl":"Poproszę rachunek.","hint_pl":"Na koniec w restauracji.","variants":{"uk":"The bill, please.","us":"Can I get the check?"},"register":"polite","red":true,"tags":["restaurant","pay"]},
  {"track":"D","type":"SAY","id":"d8u1-02","en":"I like your style.","pl":"Podoba mi się Twój styl.","hint_pl":"Komplement za wybór, nie za ciało. Jeden i luz.","variants":{"alt":["That colour really suits you."]},"register":"casual","red":false,"tags":["compliment"]},
  {"track":"D","type":"SAY","id":"d8u3-02","en":"No problem at all. Have a great night!","pl":"Żaden problem. Miłego wieczoru!","hint_pl":"Odmowa? Uśmiech i klasa: tak zostajesz zapamiętany dobrze.","variants":{},"register":"casual","red":true,"tags":["compliment","rejection"]}
]
```

### 4.5 CLIENT CONTROL (T5): sztuka wpływu (etycznie, win-win)
Techniki, które aplikacja uczy **razem ze zwrotami** (każda jako jednostka lub karta):
1. **„Tak, i…” zamiast „nie”**: zgoda na cel klienta, a Ty kontrolujesz sposób i koszt.
2. **Choice framing**: zawsze 2 opcje, obie dla Ciebie OK.
3. **Kotwica planu**: *"As we agreed in the plan…"*, powrót do ustaleń na piśmie.
4. **Procedura zmiany**: każda zmiana = czas + koszt + ryzyko, powiedziane spokojnie; zmiana staje się „projektem”, a nie awanturą.
5. **Etykietowanie emocji**: *"I see this is important for you."* uspokaja (Voss).
6. **Wzajemność**: drobny gest ekstra (*"I'll add this for free."*) w zamian za akceptację reszty.
7. **Potwierdzenie na piśmie**: *"I'll send you a short email to confirm."*
8. **Future pacing**: *"Imagine your guests seeing this tomorrow."*, sprzedaż efektu.
9. **Zamknięcie z podziękowaniem**: pytanie o zadowolenie → opinia → polecenie.
> Zasada nadrzędna: wpływ, a nie oszustwo. Klient ma wyjść z poczuciem, że wygrał, bo naprawdę wygrał.

---

## 5. Ekrany i funkcje

### 5.0 Nawigacja: dolny pasek, 5 zakładek
**BAZA** · **CODZIENNY** · **TECH** · **🟥 CZERWONE** · **BIBLIOTEKA**
Ikony Tabler w czerwonym obrysie (§7.2), aktywna zakładka = czerwone tło ikony. Wysokość paska 64 px (rękawice).

### 5.1 BAZA (Home)
Ranga i odznaka rangi, pasek XP, level, **dwa wielkie czerwone przyciski: 5 MIN / 10 MIN** + przełącznik toru (CODZIENNY / TECH / MIX), misja dnia, misja tygodnia, licznik dni do 10.01.2027 („DNI DO STOISKA: 108”), dwa mini-paski postępu: tor D i tor T.

### 5.2 Sesja RIG CHECK
Pełny ekran, jeden element na raz, przyciski min. 56 px wysokości, 🔊 i 🎤 w zasięgu kciuka. Pasek czasu 5:00 lub 10:00 u góry (informacyjny, nie przerywa). Karta HEAR: najpierw samo audio i 3 odpowiedzi PL, potem odsłona i `reply` do powiedzenia.

### 5.3 Zakładki CODZIENNY i TECH (każdy tor osobno)
Ten sam układ dla obu torów:
- **Mapa modułów** toru (kafle z postępem, kłódka dla nieodblokowanych, boss na końcu modułu),
- **Biblioteka toru**: tylko zwroty tego toru, z wyszukiwarką i filtrami (moduł, SAY/HEAR, ⭐),
- **Sceny toru** i **Boss toru**,
- **Szybka powtórka toru** (FSRS tylko z tego toru).

### 5.4 SCENY (dialogi)
Odtwarzacz dialogu: linie rozmówcy (audio + tekst), Twoje linie ukryte. Tryby: **Słuchaj** → **Czytaj z lektorem** → **Graj rolę** (mówisz swoje linie, rozpoznawanie mowy ocenia). Tor D: sceny sklep, kawiarnia, taxi, hotel, small talk na afterparty, rozmowa w barze (D8).

### 5.5 BOSS FIGHT
- Odblokowanie: ukończenie wszystkich jednostek modułu.
- Rozmówca-boss ma **pasek „cierpliwości”** (HP odwrotnie): Twoje dobre odpowiedzi go uspokajają, a złe lub brak odpowiedzi go podnoszą.
- 5–7 rund. Boss mówi (audio), Ty wybierasz lub mówisz odpowiedź. Tryb A (A1–A2): wybór z 3 odpowiedzi, potem **powiedz ją na głos**. Tryb B (od lvl 10): mówisz sam, a ocenia dopasowanie do `expected_intents` (słowa kluczowe) albo AI.
- Nagroda: duży XP, odznaka, nowa ranga, jeśli próg.
- **Bossowie toru T:**
  | Moduł | Boss | Charakter |
  |---|---|---|
  | T0 | **The Fast Talker** | mówi szybko, musisz prosić o powtórzenie |
  | T1 | **The Passer-By** | chce przejść obok, zatrzymaj go i zdobądź kontakt |
  | T2 | **The Engineer** | techniczne pytania: pitch, waga, sygnał, zasilanie |
  | T3 | **The Haggler** | „za drogo”, grozi konkurencją |
  | T4 | **The Blame Game** | „ekran nie działa, to Wasza wina!” |
  | T5 | **Mr. Last Minute** | zmienia wszystko 2 h przed otwarciem |
  | T6 | **The VIP** | dyrektor, 30 sekund na pitch |
  | FINAŁ T | **SHOW DAY CHAOS** | miks wszystkich, odblokowany po T5, próba generalna |
- **Bossowie toru D:**
  | Moduł | Boss | Charakter |
  |---|---|---|
  | D1–D2 | **The Chatty Neighbour** | zagaduje i czeka na reakcje: *No way! Really? Fair enough.* |
  | D3 | **The Busy Cashier** | szybkie pytania przy kasie: torba, karta, paragon, karta lojalnościowa |
  | D4 | **The Waiter Rush** | zamówienie w zatłoczonej knajpie, pomyłka w zamówieniu |
  | D5–D6 | **Lost in the City** | spóźniony pociąg, zła brama, zgubiony bagaż |
  | D7 | **The Afterparty** | 3 minuty small talku z nieznajomym, łańcuch dopytań |
  | D8 | **Coffee Challenge** | zagadać z klasą, skomplementować, zaproponować kawę; odmowę przyjąć z uśmiechem |
  | FINAŁ D | **A DAY ABROAD** | lotnisko → taxi → hotel → kolacja → bar, miks D1–D10 |

### 5.6 POSTĘP
Ranga, oś rang, odznaki, statystyki osobno dla toru D i T (zwroty opanowane / w nauce / nowe, SAY vs HEAR), wykres dni nauki (kalendarz jak siłownia), mapa modułów obu torów.

### 5.7 BIBLIOTEKA (wszystkie zwroty)
Wyszukiwarka PL/EN, filtry: **tor (D/T), moduł, SAY/HEAR, UK/US, ⭐, 🟥**, 🔊 przy każdym zwrocie, przy wariantach przełącznik UK/US. Ręczne dodanie własnego zwrotu (np. nazwa konkretnego sprzętu) z wyborem toru. Każdy zwrot ma ⭐: zaznaczony trafia do **Mojej ściągi** (w CZERWONYCH) i do powtórek z priorytetem.

### 5.8 🟥 CZERWONE: ratunkowe + Moja ściąga + karty „pokaż klientowi” (najważniejsze na 10.01)
- **Offline**, duża czcionka, 🔊 (odtwarzasz rozmówcy w razie potrzeby).
- **Grupy** (kafle): *Nie rozumiem* · *Chwileczkę* · *Kontakt* · *Zakupy i jedzenie* · *Droga i transport* · *Telefon* · *Awaria i BHP* · *Zdrowie*, a w każdej 5–12 zwrotów `red:true`.
- **Moja ściąga**: tylko Twoje ⭐, w kolejności, jaką sam ustawisz (przeciąganie).
- **Tryb stoiska** (przełącznik): kafle sytuacji stoiska (*Powitanie · Pytania · Demo · Kontakt · Cena · Problem · Zmiana · Pożegnanie*) z najlepszymi zwrotami toru T.
- **Karty „POKAŻ KLIENTOWI”**: pełny ekran, biały tekst na czerwieni, obracasz telefon do rozmówcy:
  - *"Please write your email here."* + pole do wpisania
  - *"One moment please, I will call my colleague."*
  - *"Can you speak slowly, please? My English is simple, my work is not."* 😉
  - *"Please scan this QR code for our portfolio."* (QR do BYQ)
  - *"Can you take me to this address?"* + adres (taxi)

### 5.9 USTAWIENIA
Głos TTS (en-GB / en-US), tempo, **wariant domyślny UK/US** (który pokazywać pierwszy), domyślna długość sesji (5/10), domyślny tor (D/T/MIX), suwak **L1 fade** (auto/ręczny), dzienny limit nowych (3/5/8), eksport i import postępu (JSON), reset.

### 5.10 L1 fade: stopniowe znikanie polskiego
| Level | Interfejs | Tłumaczenia zwrotów | Instrukcje misji |
|---|---|---|---|
| 1–5 | PL | zawsze widoczne | PL |
| 6–12 | PL/EN mix (przyciski EN) | po dotknięciu | PL + EN |
| 13+ | EN | po długim przytrzymaniu | EN |
Implementacja: słownik `i18n` z kluczami i trzema wariantami (`pl`, `mix`, `en`).

---

## 6. System motywacji

### 6.1 XP
| Akcja | XP |
|---|---|
| Ukończony RIG CHECK 5 MIN | 50 |
| Ukończony RIG CHECK 10 MIN | 110 |
| Zwrot SAY oceniony *Good/Easy* | 5 |
| Karta HEAR: poprawne znaczenie za 1. razem | 5 |
| Nowy zwrot przerobiony | 10 |
| Misja z AI (score ≥70) | 20 |
| Scena ukończona | 40 |
| Boss pokonany | 200 (finałowy D lub T: 500) |
| Druga sesja tego samego dnia | ×2 za całą sesję |
| Misja dnia | 30 · Misja tygodnia 150 |

### 6.2 Levele
XP do następnego levelu: `100 + 40 × (L − 1)`. Level 10 to ok. 2 300 XP łącznie, czyli ok. 5 tygodni regularnej nauki. Cel na 01.01: **level 15–18**.

### 6.3 Rangi riggerskie (co 3 levele)
| Level | Ranga EN | Znaczenie |
|---|---|---|
| 1 | **Ground Hand** | pomocnik na dole |
| 4 | **Ground Rigger** | rigger naziemny |
| 7 | **Up Rigger** | wchodzi na górę |
| 10 | **Lead Rigger** | prowadzi punkt |
| 13 | **Head Rigger** | szef riggingu (tu interfejs przechodzi na EN) |
| 16 | **Production Rigger** | ogarnia całą produkcję |
| 19 | **Rigging Master** | mistrz |
| 22+ | **BYQ LEGEND** | ranga honorowa |
Awans na rangę: pełnoekranowa animacja (czerwony „brush swash”, nazwa rangi w stylu okładki, dźwięk łańcuchówki lub karabinka).

### 6.4 Misje
- **Dzienne** (1 losowa): „Zrób RIG CHECK”, „Powiedz 3 zwroty z ≥85%”, „Użyj AI korekty 1×”, „Zrób 5 kart HEAR bez błędu”, „Dodaj 2 zwroty do ⭐”.
- **Tygodniowe** (1): „5 sesji w tygodniu”, „2 sesje 10 MIN”, „Pokonaj bossa”, „Przejdź 2 sceny”, „Użyj w realu 1 zwrot z D7 i odhacz”.
- **Seria**: licznik dni w serii jest widoczny, ale z **2 „Safety Pinami” na tydzień** (zamrożenie serii). Brak kary, bo praca na obiektach jest nieregularna.

### 6.5 Odznaki (przykłady)
*First Lift* (pierwsza sesja) · *Double Shift* (dwie sesje jednego dnia) · *Full Shift* (10 sesji 10 MIN) · *Tech Head* (T2 ukończony) · *Deal Maker* (Haggler pokonany) · *Calm Under Load* (Mr. Last Minute pokonany) · *Smooth Talker* (D7 ukończony) · *Gentleman* (D8 + Coffee Challenge) · *Good Ears* (100 kart HEAR poprawnie) · *Red Ready* (80 CZERWONYCH ⭐ opanowanych) · *100 Chunks* · *Show Ready* (finał T) · *Abroad Ready* (finał D).

---

## 7. Styl wizualny: BYQ „grunge sport” (z okładki „Zbuduj formę”)

### 7.1 Tokeny
```css
:root{
  --bg:#0a0a0b; --bg-2:#141416; --line:#242426;
  --red:#e01e1e; --red-dark:#9e1111;
  --white:#f3f2ef; --dim:#9a9a9d; --ok:#3fb950;
  --font-display:'Anton',Impact,sans-serif;       /* nagłówki, WERSALIKI */
  --font-body:'Oswald',Arial,sans-serif;          /* treść, przyciski */
}
```
Google Fonts: `Anton` + `Oswald:wght@400;500;700` (oba mają polskie znaki). Aplikacja jest **tylko w trybie ciemnym**, tak jak marka.

### 7.2 Elementy z okładki: przełożenie na UI
| Z okładki | W aplikacji |
|---|---|
| Pędzlowa, „brudna” typografia biała i czerwona | Nagłówki w Anton WERSALIKAMI, lekko pochylone `transform: skew(-6deg)`, kluczowe słowo na czerwono |
| Czerwony pociąg pędzla pod „BEZ WYMÓWEK.” | Inline SVG `brush-swash` (nieregularna ścieżka) pod głównym CTA, pod nazwą rangi i pod wynikiem bossa |
| Czerwone narożniki kadru | Klasa `.frame`: 4 narożniki (pseudo-elementy lub SVG) wokół kart, sesji i ekranu awansu |
| Ikony w czerwonym zaokrąglonym obrysie | Ikony Tabler (outline) w kwadracie 44 px, `border:2px solid var(--red); border-radius:10px` |
| Czarne tło z fakturą | SVG `feTurbulence` jako tło `body` o opacity 0.06, bez obrazków |
| Pasek z hasłem na czerwonym tle („+ ATLAS ĆWICZEŃ”) | Pasek misji dnia i znaczniki „+XP” z czerwonym `+` |
| Logo byka na grzbiecie | Ikona PWA i splash: byk BYQ (z istniejących zasobów marki) |
| Hasła mocne i krótkie | Mikroteksty: „BEZ WYMÓWEK. 5 MINUT.”, „LINA NAPIĘTA.”, „PUNKT ZALICZONY.”, „KLIENT OGARNIĘTY.” |

### 7.3 Zasady
- Maks. 3 kolory na ekranie: czerń, biel i czerwień (zieleń tylko dla „poprawnie”).
- Kontrast tekstu co najmniej AA; tekst `--dim` tylko dla informacji drugorzędnych.
- Animacje krótkie (150–250 ms), ruch „szarpnięcia liny”; `prefers-reduced-motion` je wyłącza.
- Dotyk: cele min. 48 px, główne 56–64 px (rękawice).
- Szerokość bazowa 375 px, bez poziomego scrolla.

---

## 8. Architektura techniczna

### 8.1 Stos
- **Czysty HTML + CSS + JavaScript (ES modules)**, zero bundlera i zero frameworka. Pliki wgrywane 1:1 na Hostinger (tak jak Studio Scenariuszy).
- `ts-fsrs` z CDN (jsDelivr, UMD) **skopiowany lokalnie** do `vendor/`, żeby działał offline.
- Stan: `localStorage` (klucz `rigtalk.v1`, obiekt z polem `schemaVersion` + migracje). Rozmiar mały, więc wystarczy; eksport i import JSON jako backup.
- Service Worker: cache-first dla aplikacji, treści i fontów; network-only dla webhooka AI.

### 8.2 Struktura plików
```
rig-talk/
├─ index.html              # shell + ekrany (sekcje <section data-screen>) + dolny pasek 5 zakładek
├─ manifest.webmanifest
├─ sw.js
├─ .well-known/assetlinks.json   # E13: weryfikacja APK (TWA)
├─ css/
│  ├─ tokens.css           # sekcja 7.1
│  └─ app.css
├─ js/
│  ├─ app.js               # router ekranów i zakładek, start
│  ├─ state.js             # load/save/migrate/export/import
│  ├─ content.js           # ładowanie torów D/T, indeks zwrotów, filtry biblioteki
│  ├─ srs.js               # wrapper na ts-fsrs (priorytet ⭐)
│  ├─ speech.js            # TTS + rozpoznawanie + scoring + fallback
│  ├─ session.js           # RIG CHECK 5/10 MIN, wybór toru, karty SAY/HEAR
│  ├─ scenes.js
│  ├─ boss.js
│  ├─ game.js              # XP, levele, rangi, misje, odznaki
│  ├─ ai.js                # webhook n8n „Sprawdź mnie”
│  ├─ library.js           # BIBLIOTEKA + biblioteki torów + ⭐ + własne zwroty
│  ├─ red.js               # 🟥 CZERWONE: grupy, Moja ściąga, tryb stoiska, karty „pokaż klientowi”
│  └─ i18n.js              # L1 fade
├─ content/
│  ├─ modules.json         # tory, moduły, jednostki, kolejność, odblokowania
│  ├─ daily/d1.json … d10.json
│  ├─ tech/t0.json … t6.json
│  ├─ red.json             # grupy CZERWONYCH (listy ID) + zwroty tylko-czerwone
│  ├─ scenes/*.json
│  └─ bosses/*.json
├─ tools/validate.js       # walidator treści (node)
├─ vendor/ts-fsrs.umd.js
├─ assets/icons/, assets/brush/*.svg
└─ audio/                  # (upgrade) {id}.mp3
```

### 8.3 Schematy danych
```jsonc
// chunk (każdy zwrot w daily/*.json i tech/*.json)
{"id":"d3u3-04","track":"D","module":"D3","unit":3,
 "type":"HEAR",                                   // HEAR | SAY
 "en":"Do you need a bag?","pl":"Potrzebuje Pan reklamówki?",
 "reply":"No, I'm good, thanks.",                 // tylko HEAR: typowa Twoja odpowiedź
 "variants":{"uk":"Do you want a bag?"},          // opcjonalnie: uk / us / alt[]
 "register":"neutral",                            // neutral | casual | polite
 "red":false,"slot":false,
 "tags":["shop","checkout"],"hint_pl":"Kasa: pytanie o torbę pada prawie zawsze."}
// scene
{"id":"t1-scene-1","track":"T","title":"Pierwszy klient","module":"T1","lines":[
  {"who":"other","en":"Hi, what do you do?","pl":"Cześć, czym się zajmujecie?"},
  {"who":"me","en":"We make LED screens and rigging for events.","pl":"...","chunk":"t1u3-01"}
]}
// boss
{"id":"boss-t5","track":"T","name":"Mr. Last Minute","module":"T5","patience":100,"rounds":[
  {"other_en":"I want the screen on the other wall. Now!","other_pl":"...",
   "answers":[
     {"en":"No problem. Let me check what this changes.","effect":-25,"best":true},
     {"en":"Okay, we move it.","effect":10,"why_pl":"Zgoda bez warunków = chaos i darmowa praca."},
     {"en":"No. Impossible.","effect":30,"why_pl":"Twarde „nie” eskaluje konflikt."}
   ],
   "expected_intents":["check","time","cost","option"]}
]}
// state (localStorage)
{"schemaVersion":1,"xp":0,"level":1,"cards":{"t1u1-01":{/* ts-fsrs Card */}},
 "log":[{"d":"2026-09-25","xp":60,"sessions":1,"minutes":5}],"streak":{"n":0,"pins":2},
 "badges":[],"missions":{},
 "settings":{"voice":"en-GB","rate":0.85,"newPerDay":3,"l1":"auto",
             "sessionLength":5,"trackMix":"MIX","variant":"uk"},
 "starred":["d10u1-01","t1u4-02"],"redOrder":["d10u1-01"],"custom":[],"aiUsedToday":0}
```
Zasady ID: `{tor}{moduł}u{jednostka}-{nr}`, np. `d7u2-05`, `t2u3-11`. Pole `track` musi zgadzać się z prefiksem.

### 8.4 Wdrożenie
- Hostinger, np. `rigtalk.<twoja-domena>` lub podkatalog (HTTPS wymagany: mowa i TWA).
- Instalacja na Androidzie: Chrome → „Zainstaluj aplikację” (skill `pwa-ikonka-na-telefon`).
- **APK (E13):** PWABuilder (pwabuilder.com → Android → pakiet na silniku Bubblewrap) albo `bubblewrap init --manifest=https://…/manifest.webmanifest` + `bubblewrap build`. Z pakietu bierzesz odcisk SHA-256 klucza i wstawiasz do `/.well-known/assetlinks.json` na Hostingerze; bez tego aplikacja pokaże pasek adresu. APK instalujesz sam (zgoda na „nieznane źródła” w Androidzie). Google Play opcjonalnie później (jednorazowa opłata za konto dewelopera).
- Webhook AI: nowy workflow n8n „Rig Talk: AI Check” (Webhook → Claude Haiku 4.5 → Respond JSON, CORS dla domeny aplikacji).

---

## 9. Plan budowy dla Sonnet 5: etapy z kryteriami „działa”

**Zasada:** jeden etap na raz. Po każdym etapie Sonnet **uruchamia podgląd** (`.claude/launch.json` + prosty serwer statyczny, np. `npx serve`), sprawdza konsolę i pokazuje zrzut ekranu. Dopiero potem kolejny etap.

| Etap | Zakres | Kryterium odbioru (sprawdzone narzędziem) |
|---|---|---|
| **E0** | Szkielet plików (8.2), `launch.json`, tokens.css, fonty, tło z fakturą | Strona ładuje się bez błędów w konsoli; zrzut ekranu czarny z czerwonym nagłówkiem |
| **E1** | Komponenty stylu: `.frame`, brush-swash SVG, przyciski, ikony w obrysie, pasek XP, **dolny pasek 5 zakładek**; ekran BAZA na danych testowych (przyciski 5 MIN / 10 MIN) | Zrzut na 375 px: brak poziomego scrolla, styl zgodny z 7.2 |
| **E2** | `state.js` (load/save/migracje/eksport/import) + router ekranów i zakładek | Po przeładowaniu stan zostaje; eksport daje poprawny JSON, import go odtwarza |
| **E3** | `srs.js` (ts-fsrs lokalnie, priorytet ⭐) + ekran powtórek | Test w konsoli: karta *Good* dostaje `due` w przyszłości, *Again* wraca w tej samej sesji, ⭐ idzie przed nie-⭐ |
| **E4** | `speech.js`: TTS (en-GB/en-US), rozpoznawanie, scoring, fallback | TTS czyta zwrot; funkcja scoringu przechodzi 10 przypadków testowych (`it's` = `it is`, interpunkcja itd.); bez API widać fallback |
| **E5** | `content.js` + `tools/validate.js` + treść **T0, T1, D1, D2, D10** (z RESEARCH-ZWROTY.md) + sesja RIG CHECK **5/10 MIN** z wyborem toru i kartami SAY/HEAR (§2.1) | Walidator: 0 błędów. Sesja 5 i 10 MIN przechodzi od startu do podsumowania; liczba nowych 3/5; karta HEAR pokazuje najpierw samo audio; zaległości > 30 blokują nowe |
| **E5b** | `library.js` + `red.js`: BIBLIOTEKA z filtrami, biblioteki torów, ⭐, własne zwroty, 🟥 CZERWONE z grupami i Moją ściągą | Filtr D/T/SAY/HEAR/⭐ daje poprawne liczby (porównanie z walidatorem); ⭐ trafia do Mojej ściągi i przed inne powtórki |
| **E6** | `game.js`: XP (6.1, w tym 5/10 MIN i HEAR), levele (6.2), rangi (6.3), misje, seria z Safety Pinami, odznaki | Symulacja 20 sesji w konsoli daje poprawny level i rangę; ekran awansu się wyświetla |
| **E7** | Sceny (5.4) + 2 sceny T1 + 2 sceny D (sklep, kawiarnia) | 3 tryby działają; w trybie „graj rolę” linie „me” są ukryte |
| **E8** | Boss fight (5.5) + bossowie T0, T1, D1–D2 | Pasek cierpliwości reaguje na odpowiedzi; wygrana i przegrana obsłużone; XP naliczone |
| **E9** | 🟥 CZERWONE: tryb stoiska + karty „pokaż klientowi” (5.8) | Działa w trybie offline (DevTools: offline); karta pełnoekranowa czytelna z 1 m |
| **E10** | Workflow n8n + `ai.js` („Sprawdź mnie”) | Realne zapytanie zwraca JSON wg 3.3; brak sieci wyszarza przycisk; limit 30/dzień |
| **E11** | L1 fade (5.10) + ustawienia (5.9: UK/US, 5/10, tor) | Zmiana levelu na 6 i 13 przełącza interfejs zgodnie z tabelą; przełącznik UK/US zmienia wyświetlany wariant |
| **E12** | PWA: manifest, ikony, `sw.js`, wdrożenie na Hostinger | Instalacja na telefonie z Chrome, start offline, aktualizacja SW po zmianie wersji |
| **E13** | **APK Android** (PWABuilder/Bubblewrap, TWA) + `assetlinks.json` | APK instaluje się na Twoim telefonie, startuje pełnoekranowo (bez paska adresu), mikrofon i rozpoznawanie mowy działają |
| **C-T2…C-T6** | Treści tor T: T2 (poszerzony), T3, T4, T5, T6 + sceny + bossowie (po 1 module na sesję) | Walidator: unikalne ID, wymagane pola, `track` zgodny z prefiksem, 3–9 słów EN (terminy wyłączone), brak zakazanych czasów wg 1.1 |
| **C-D3…C-D9** | Treści tor D: D3, D4, D5, D6, D7, D8, D9 + sceny + bossowie (po 1–2 moduły na sesję) | Jak wyżej + każdy HEAR ma `reply`; warianty UK/US tylko gdy różne |

### 9.1 Harmonogram
| Okres | Budowa | Nauka (Ty) |
|---|---|---|
| 25.09–05.10 | E0–E6 + E5b (MVP) | start: T0 + D1 + CZERWONE (D10) |
| 06.10–19.10 | E7–E10, C-T2, C-D3 | T1 + D2 |
| 20.10–09.11 | E11–E13 (APK), C-T3, C-D4, C-D5 | T2 + D3 |
| 10.11–30.11 | C-T4, C-T5, C-D6, C-D7 + MP3 audio | T2 → T3, D4 → D6 |
| 01.12–14.12 | C-T6, C-D8, C-D9, finałowi bossowie D i T, poprawki z użytkowania | T4 → T5, D7 → D8 |
| 15.12–31.12 | tylko poprawki | **DRESS REHEARSAL** (MIX 30/70 dla TECH), T6, D9; CZERWONE dopracowane pod Twój sprzęt |
| 01.01–09.01 | zamrożenie kodu | tylko powtórki + CZERWONE |
| **10.01.2027** | | **STOISKO** 🟥 |

---

## 10. Ryzyka i jak je gasimy
| Ryzyko | Odpowiedź |
|---|---|
| 5 min to za mało | Opcja 10 MIN, CZERWONE i karty „pokaż klientowi” jako koło ratunkowe, ×2 XP za drugą sesję |
| Dwa tory rozmywają cel „stoisko 10.01” | MIX domyślnie 50/50, od 15.12 automatycznie 30/70 dla TECH; CZERWONE łączą oba tory |
| Rozpoznawanie mowy (Android: potrzebny internet; iPhone PWA: brak) | Fallback: samoocena + nagranie własnego głosu; test w E4 (Chrome) i E13 (APK) na Twoim telefonie |
| Słaby głos TTS | Etap MP3 w listopadzie |
| Treść generowana przez AI z błędami | Walidator + zasady 1.1 + RESEARCH-ZWROTY.md + próbka 4.4; nie ma zwrotów spoza wzorca |
| APK bez `assetlinks.json` pokazuje pasek adresu | Krok w E13, weryfikacja na telefonie |
| Porzucenie nauki po przerwie | Safety Pins, limit zaległości, brak kar, sesja zawsze 5 lub 10 min |
| Utrata postępu (czyszczenie przeglądarki) | Przypomnienie o eksporcie co tydzień; opcjonalnie sync do n8n w przyszłości |

---

## 11. PROMPT STARTOWY DLA SONNET 5 (wklej po przełączeniu modelu)

```
Jesteś głównym developerem aplikacji RIG TALK by BYQ. Folder projektu: C:\Users\DELL\Downloads\rig-talk
Przeczytaj w całości PLAN.md, RESEARCH-ZWROTY.md i CLAUDE.md w tym folderze.
PLAN.md to jedyne źródło prawdy o aplikacji: metodyka (sekcja 1), sesje 5/10 MIN (2), mowa i AI (3),
dwa tory CODZIENNY i TECH + CZERWONE (4), ekrany (5), gamifikacja (6), styl BYQ (7),
architektura i schematy (8), etapy (9). RESEARCH-ZWROTY.md to źródło treści (zwroty SAY/HEAR, UK/US, 🟥).

Realizuj TYLKO etap, który podam. Zasady:
1. Czysty HTML/CSS/JS (ES modules), bez frameworków i bundlera; struktura plików dokładnie jak w 8.2.
2. Styl dokładnie wg sekcji 7 (tokeny, Anton + Oswald, czerń i czerwień, brush-swash, narożniki kadru).
3. Treści wyłącznie wg zasad 1.1, schematu 8.3 i inwentarza z RESEARCH-ZWROTY.md.
4. Po etapie: uruchom podgląd, sprawdź konsolę, wykonaj kryterium odbioru z tabeli w sekcji 9,
   pokaż zrzut ekranu. Nie pisz „działa” bez dowodu z narzędzia.
5. Na koniec etapu dopisz do PROGRESS.md: co zrobione, jak sprawdzone, co zostało.
6. Jeśli coś w planie jest sprzeczne lub niemożliwe, zatrzymaj się i zapytaj, nie zgaduj.

Zaczynamy: ETAP E0.
```

Kolejne sesje: `Kontynuuj RIG TALK. Przeczytaj PLAN.md, RESEARCH-ZWROTY.md i PROGRESS.md. Realizuj ETAP <kod>.` (np. `E5b`, `C-D7`).

---

## Źródła techniczne (zweryfikowane 24.09.2026)
- ts-fsrs (FSRS v6, MIT, UMD): https://github.com/open-spaced-repetition/ts-fsrs
- Web Speech API, wsparcie przeglądarek: https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition · https://caniuse.com/speech-recognition
- Ograniczenie iOS PWA (rozpoznawanie mowy): https://whatpwacando.today/speech-recognition/
- Android TWA (PWA → APK): https://github.com/googlechromelabs/bubblewrap · https://developer.android.com/develop/ui/views/layout/webapps/guide-trusted-web-activities-version2
- Research językowy (PHRASE List, Shin & Nation, EVP, small talk, komplementy, słowniki LED/rigging): pełna lista w `RESEARCH-ZWROTY.md`
