# RIG TALK by BYQ: zasady projektu

- Źródła prawdy: `PLAN.md` (aplikacja) i `RESEARCH-ZWROTY.md` (treści). Przed każdą pracą przeczytaj oba + PROGRESS.md.
- Realizuj tylko etap wskazany przez użytkownika (tabela w PLAN.md, sekcja 9: E0–E13, E5b, C-T*, C-D*).
- Stos: czysty HTML/CSS/JS (ES modules), bez frameworków i bundlera. Wdrożenie: pliki 1:1 na Hostinger; Android: PWA + APK (TWA, etap E13).
- Styl: wyłącznie tokeny i zasady z PLAN.md, sekcja 7 (czerń #0a0a0b, czerwień #e01e1e, Anton + Oswald, tylko tryb ciemny).
- Dwa osobne tory: CODZIENNY (D1–D10) i TECH (T0–T6) + 🟥 CZERWONE (ratunkowe, ⭐). Sesja 5 albo 10 MIN.
- Treści: zasady PLAN.md 1.1, schemat 8.3, wzorzec 4.4. Karty `SAY` i `HEAR` (HEAR zawsze z `reply`); warianty `uk`/`us` tylko gdy się różnią; forma żywa, nie podręcznikowa. Uczeń jest na poziomie A1.
- Każda paczka treści przechodzi `node tools/validate.js` z 0 błędów.
- Klucz API nigdy nie trafia do frontendu; AI idzie tylko przez webhook n8n (PLAN.md 3.3).
- Po każdym etapie: uruchom podgląd, sprawdź konsolę, spełnij kryterium odbioru, zrób zrzut ekranu, dopisz wpis w PROGRESS.md. Nie pisz „działa” bez dowodu.
- `LOGIKA-APLIKACJI.md` jest stałym źródłem wiedzy o sensie produktu i zależnościach. Aktualizuj go przy każdej zmianie wpływającej na zachowanie, dane, przepływy, algorytmy lub powód decyzji — nie tylko przy zmianach kodu.
- Komunikacja z użytkownikiem po polsku, krótko: wynik, nie proces.
