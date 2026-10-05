// RIG TALK — content.js: ładowanie torów D/T, indeks zwrotów, filtry biblioteki

let cache = null; // { chunks: Map<id,chunk>, modulesDef, order: [module...] }

async function fetchJson(path){
  const res = await fetch(path, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Nie udało się wczytać ${path}: HTTP ${res.status}`);
  return res.json();
}

/** Wczytuje modules.json + content/index.json (manifest plików z zwrotami) i wszystkie zwroty. */
export async function loadAllChunks(){
  if (cache) return cache;

  const [moduleData, index, phraseData] = await Promise.all([
    fetchJson('content/modules.json'),
    fetchJson('content/index.json'),
    fetchJson('content/phrases.json'),
  ]);
  const modulesDef = JSON.parse(JSON.stringify(moduleData));
  modulesDef.modules.T8 = { track: 'T', name: 'ZWROTY SYTUACYJNE', order: -2, unlockAfter: null, boss: null };
  modulesDef.tracks.T.modules.unshift('T8');

  const chunks = new Map();
  const fileEntries = Object.entries(index.files || {});
  const arrays = await Promise.all(fileEntries.map(([, path]) => fetchJson(`content/${path}`)));

  arrays.forEach((arr) => {
    arr.forEach((chunk) => {
      if (chunks.has(chunk.id)){
        console.warn('[content] zduplikowane ID zwrotu, pomijam:', chunk.id);
        return;
      }
      chunks.set(chunk.id, chunk);
    });
  });
  phraseData.stages.forEach((stage, unit) => stage.items.forEach((phrase, index) => {
    const id = `t8-${phrase.id}`;
    chunks.set(id, {
      id, track: 'T', type: 'SAY', module: 'T8', unit,
      order: index, en: phrase.en, pl: phrase.pl, role: phrase.role,
      phraseId: phrase.id, stageId: stage.id,
      audio: `assets/audio/phrases/${phrase.id}.wav`,
      tags: phrase.role === 'codzienne' ? ['daily']
        : (phrase.role === 'klient' || phrase.role === 'organizator' || phrase.role === 'multimedia' || phrase.role === 'test'
          ? ['client', 'mission'] : ['crew', 'mission']),
    });
  }));

  const order = Object.entries(modulesDef.modules)
    .sort((a, b) => (a[1].track === b[1].track ? a[1].order - b[1].order : a[1].track.localeCompare(b[1].track)))
    .map(([key]) => key);

  cache = { chunks, modulesDef: modulesDef.modules, tracks: modulesDef.tracks, order };
  return cache;
}

export function chunkTrack(id){
  return id[0].toUpperCase(); // 'd7u2-05' -> 'D'
}

/** true jeśli chunk pasuje do wybranego trybu toru: 'D' | 'T' | 'MIX'. */
export function matchesTrackMix(id, trackMix){
  if (!trackMix || trackMix === 'MIX') return true;
  return chunkTrack(id) === trackMix;
}

/** Sortuje ID chunków wg kolejności modułu (z modules.json) i jednostki. */
export function sortByCurriculumOrder(ids, ctx){
  const orderIndex = new Map(ctx.order.map((m, i) => [m, i]));
  return [...ids].sort((a, b) => {
    const ca = ctx.chunks.get(a), cb = ctx.chunks.get(b);
    const oa = orderIndex.get(ca.module) ?? 999;
    const ob = orderIndex.get(cb.module) ?? 999;
    if (oa !== ob) return oa - ob;
    if (ca.unit !== cb.unit) return (ca.unit || 0) - (cb.unit || 0);
    return a.localeCompare(b);
  });
}

/** Lista wszystkich zwrotów jako tablica (do BIBLIOTEKI, E5b). */
export function allChunksArray(ctx){
  return [...ctx.chunks.values()];
}
