// RIG TALK — service worker: cache-first dla aplikacji, treści i fontów (pełna wersja: etap E12)
// E9 wymaga, żeby 🟥 CZERWONE działało offline — precache obejmuje więc już teraz cały shell + treść.

const CACHE_NAME = 'rigtalk-v24';

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
  'js/kurs.js',
  'js/glossary.js',
  'js/state.js',
  'vendor/ts-fsrs.umd.js',
  'content/index.json',
  'content/modules.json',
  'content/red.json',
  'content/stoisko.json',
  'content/mx30-guide.json',
  'content/montaz.json',
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
];

self.addEventListener('install', (event) => {
  // cache:'reload' pomija dyskowy cache HTTP przeglądarki — inaczej precache mógłby
  // złapać starą, zbuforowaną odpowiedź (np. content/index.json) i zamrozić ją na stałe.
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => Promise.all(
        PRECACHE_URLS.map((url) => fetch(url, { cache: 'reload' }).then((res) => cache.put(url, res)))
      ))
      .then(() => self.skipWaiting())
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
