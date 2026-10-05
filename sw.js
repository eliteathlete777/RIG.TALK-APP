// RIG TALK — service worker: cache-first dla aplikacji, treści i fontów (pełna wersja: etap E12)
// E9 wymaga, żeby 🟥 CZERWONE działało offline — precache obejmuje więc już teraz cały shell + treść.

const CACHE_NAME = 'rigtalk-v35';
const PRECACHE_BATCH_SIZE = 8;

const PRECACHE_URLS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'assets/rigtalk-icon-192.png',
  'assets/rigtalk-icon-512.png',
  'assets/rigtalk-icon-180.png',
  'css/tokens.css',
  'css/app.css',
  'js/ai.js',
  'js/app.js',
  'js/boss.js',
  'js/bootcamp.js',
  'js/brush.js',
  'js/content.js',
  'js/game.js',
  'js/i18n.js',
  'js/icons.js',
  'js/library.js',
  'js/red.js',
  'js/readiness.js',
  'js/scenes.js',
  'js/simulation.js',
  'js/session.js',
  'js/speech.js',
  'js/srs.js',
  'js/stoisko.js',
  'js/mx30-guide.js',
  'js/montaz.js',
  'js/plany.js',
  'js/az.js',
  'js/uklad.js',
  'js/acc.js',
  'content/plany.json',
  'content/az.json',
  'js/kurs.js',
  'js/glossary.js',
  'js/state.js',
  'js/visibility.js',
  'vendor/ts-fsrs.umd.js',
  'content/index.json',
  'content/modules.json',
  'content/red.json',
  'content/stoisko.json',
  'content/mx30-guide.json',
  'content/montaz.json',
  'content/phrases.json',
  'content/glossary.json',
  'content/tech/t7.json',
  'content/tech/t0.json',
  'content/tech/t1.json',
  'content/tech/t2.json',
  'content/tech/t3.json',
  'content/tech/t4.json',
  'content/tech/t5.json',
  'content/tech/t6.json',
  'content/tech/t9.json',
  'content/daily/d1.json',
  'content/daily/d2.json',
  'content/daily/d3.json',
  'content/daily/d4.json',
  'content/daily/d5.json',
  'content/daily/d6.json',
  'content/daily/d7.json',
  'content/daily/d8.json',
  'content/daily/d9.json',
  'content/daily/d10.json',
  'content/scenes/index.json',
  'content/scenes/t1-scene-1.json',
  'content/scenes/t1-scene-2.json',
  'content/scenes/d3-scene-1.json',
  'content/scenes/d4-scene-1.json',
  'content/bosses/index.json',
  'content/bosses/boss-t0.json',
  'content/bosses/boss-t1.json',
  'content/bosses/boss-d1.json',
  'content/bootcamp.json',
  'content/mission-simulation.json',
  'assets/test/test-siatka-2048x512.png',
  'assets/test/test-siatka-2048x1024-proporcje-2do1.png',
  'assets/test/test-kolo-2048x1024-proporcje-2do1.png',
  'assets/plany/uklad-sygnal-2.png',
  'assets/plany/th-uklad-sygnal-2.jpg',
  'assets/plany/uklad-sygnal-3.png',
  'assets/plany/th-uklad-sygnal-3.jpg',
  'assets/plany/uklad-sygnal-4.png',
  'assets/plany/th-uklad-sygnal-4.jpg',
  'assets/plany/uklad-zasilanie-2.png',
  'assets/plany/th-uklad-zasilanie-2.jpg',
  'assets/plany/uklad-zasilanie-3.png',
  'assets/plany/th-uklad-zasilanie-3.jpg',
  'assets/plany/uklad-zasilanie-4.png',
  'assets/plany/th-uklad-zasilanie-4.jpg',
  'assets/plany/tw-01.jpg',
  'assets/plany/th-tw-01.jpg',
  'assets/plany/tw-02.jpg',
  'assets/plany/th-tw-02.jpg',
  'assets/plany/tw-03.jpg',
  'assets/plany/th-tw-03.jpg',
  'assets/plany/tw-04.jpg',
  'assets/plany/th-tw-04.jpg',
  'assets/plany/tw-05.jpg',
  'assets/plany/th-tw-05.jpg',
  'assets/plany/tw-06.jpg',
  'assets/plany/th-tw-06.jpg',
  'assets/plany/tw-07.jpg',
  'assets/plany/th-tw-07.jpg',
  'assets/plany/tw-08.jpg',
  'assets/plany/th-tw-08.jpg',
  'assets/plany/tw-09.jpg',
  'assets/plany/th-tw-09.jpg',
  'assets/plany/tw-10.jpg',
  'assets/plany/th-tw-10.jpg',
  'assets/plany/tw-11.jpg',
  'assets/plany/th-tw-11.jpg',
  'assets/plany/tw-12.jpg',
  'assets/plany/th-tw-12.jpg',
  'assets/plany/tw-13.jpg',
  'assets/plany/th-tw-13.jpg',
  'assets/plany/tw-14.jpg',
  'assets/plany/th-tw-14.jpg',
  'assets/plany/tw-15.jpg',
  'assets/plany/th-tw-15.jpg',
  'assets/plany/tw-16.jpg',
  'assets/plany/th-tw-16.jpg',
  'assets/plany/tw-17.jpg',
  'assets/plany/th-tw-17.jpg',
  'assets/plany/tw-18.jpg',
  'assets/plany/th-tw-18.jpg',
  'assets/plany/tw-19.jpg',
  'assets/plany/th-tw-19.jpg',
  'assets/plany/tw-20.jpg',
  'assets/plany/th-tw-20.jpg',
  'assets/plany/tw-21.jpg',
  'assets/plany/th-tw-21.jpg',
  'assets/plany/tw-22.jpg',
  'assets/plany/th-tw-22.jpg',
  'assets/plany/tw-23.jpg',
  'assets/plany/th-tw-23.jpg',
  'assets/plany/tw-24.jpg',
  'assets/plany/th-tw-24.jpg',
  'assets/plany/tw-25.jpg',
  'assets/plany/th-tw-25.jpg',
  'assets/plany/tw-26.jpg',
  'assets/plany/th-tw-26.jpg',
  'assets/plany/kable.jpg',
  'assets/plany/th-kable.jpg',
  'assets/plany/wizka.jpg',
  'assets/plany/th-wizka.jpg',
  'assets/plany/power.jpg',
  'assets/plany/th-power.jpg',
];

self.addEventListener('install', (event) => {
  // cache:'reload' pomija dyskowy cache HTTP przeglądarki — inaczej precache mógłby
  // złapać starą, zbuforowaną odpowiedź (np. content/index.json) i zamrozić ją na stałe.
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        // Telefon nie dostaje już 148 równoległych żądań. Małe partie ograniczają
        // zużycie pamięci i ryzyko przerwania instalacji na słabszym połączeniu.
        for (let i = 0; i < PRECACHE_URLS.length; i += PRECACHE_BATCH_SIZE){
          const batch = PRECACHE_URLS.slice(i, i + PRECACHE_BATCH_SIZE);
          await Promise.all(batch.map(async (url) => {
            const response = await fetch(url, { cache: 'reload' });
            if (!response.ok) throw new Error(`Precache ${url}: HTTP ${response.status}`);
            await cache.put(url, response);
          }));
        }
        await self.skipWaiting();
      } catch (error){
        // Nie zostawiaj częściowej wersji, którą interfejs mógłby uznać za gotową offline.
        await caches.delete(CACHE_NAME);
        throw error;
      }
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Tylko własne żądania GET; webhook AI (n8n, inne originy) zawsze idzie do sieci (network-only, PLAN.md §8.1).
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  // Wszystkie zasoby interfejsu są lokalne; po pierwszym uruchomieniu aplikacja działa bez sieci.
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res && res.status === 200){
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
