// RIG TALK — srs.js: wrapper na ts-fsrs (FSRS-6, ładowany globalnie z vendor/ts-fsrs.umd.js jako window.FSRS)
// Priorytet w kolejce powtórek: ⭐ (starred) zawsze przed pozostałymi.

const FSRS = typeof window !== 'undefined' ? window.FSRS : null;

if (!FSRS){
  console.error('[srs] window.FSRS nie jest załadowany — sprawdź <script src="vendor/ts-fsrs.umd.js"> w index.html');
}

const params = FSRS ? FSRS.generatorParameters({ enable_fuzz: true, enable_short_term: true }) : null;
const scheduler = FSRS ? FSRS.fsrs(params) : null;

export const Rating = FSRS ? FSRS.Rating : { Again: 1, Hard: 2, Good: 3, Easy: 4 };
export const State = FSRS ? FSRS.State : { New: 0, Learning: 1, Review: 2, Relearning: 3 };

/** Nowa, pusta karta ts-fsrs dla danego zwrotu (chunkId). */
export function newCard(now = new Date()){
  return FSRS.createEmptyCard(now);
}

/**
 * Oceń kartę oceną Again/Hard/Good/Easy.
 * @returns { card, log } — nowa karta po ocenie + log recenzji (do ewentualnej historii)
 */
export function reviewCard(card, rating, now = new Date()){
  const schedulingCards = scheduler.repeat(card, now);
  const result = schedulingCards[rating];
  return { card: result.card, log: result.log };
}

export function isDue(card, now = new Date()){
  return new Date(card.due).getTime() <= now.getTime();
}

/**
 * Zbuduj kolejkę powtórek z priorytetem ⭐.
 * @param cardsMap {Object} state.cards — { [chunkId]: FsrsCard }
 * @param starredSet {Set<string>} zbiór ID zwrotów oznaczonych ⭐
 * @param now {Date}
 * @param limit {number} maksymalna liczba kart w sesji
 * @param trackFilter {(chunkId:string)=>boolean} opcjonalny filtr (np. tylko tor D)
 */
export function buildDueQueue(cardsMap, starredSet, now = new Date(), limit = 10, trackFilter = null){
  const due = Object.entries(cardsMap)
    .filter(([id]) => !trackFilter || trackFilter(id))
    .filter(([, card]) => isDue(card, now))
    .map(([id, card]) => ({ id, card, starred: starredSet.has(id) }));

  due.sort((a, b) => {
    if (a.starred !== b.starred) return a.starred ? -1 : 1; // ⭐ najpierw
    return new Date(a.card.due) - new Date(b.card.due);      // potem najbardziej zaległe
  });

  return due.slice(0, limit).map(x => x.id);
}

/** Liczba zaległych (due <= now) — do reguły „zaległości > 30 blokują nowe”. */
export function countOverdue(cardsMap, now = new Date()){
  return Object.values(cardsMap).filter(card => isDue(card, now)).length;
}

/**
 * Liczba zwrotów wprowadzonych JAKO NOWE dzisiaj — do dziennego limitu (§5.9, 3/5/8).
 * Karta "nowa dzisiaj" to taka, która miała swoją pierwszą recenzję (reps===1) dziś.
 */
export function countNewIntroducedToday(cardsMap, now = new Date()){
  const todayKey = now.toISOString().slice(0, 10);
  return Object.values(cardsMap).filter(card => {
    if (card.reps !== 1 || !card.last_review) return false;
    return new Date(card.last_review).toISOString().slice(0, 10) === todayKey;
  }).length;
}
