// RIG TALK — wspólna, uczciwa miara gotowości zwrotu.
// Samo utworzenie karty nie oznacza opanowania. Zielony wymaga co najmniej
// dwóch udanych kontaktów i wejścia karty w stan Review.

export function phraseLevel(card){
  if (!card) return 'unseen';
  const reps = Number(card.reps || 0);
  const lapses = Number(card.lapses || 0);
  const state = Number(card.state ?? 0);
  if (reps >= 2 && state === 2 && lapses < reps) return 'mastered';
  return 'learning';
}

export function readinessStats(ids, cards = {}){
  const unique = [...new Set(ids)];
  const out = { total: unique.length, unseen: 0, learning: 0, mastered: 0, pct: 0 };
  unique.forEach(id => { out[phraseLevel(cards[id])]++; });
  out.pct = out.total ? Math.round(out.mastered / out.total * 100) : 0;
  return out;
}

export function weakestFirst(ids, cards = {}){
  const weight = { unseen: 0, learning: 1, mastered: 2 };
  return [...ids].sort((a, b) => weight[phraseLevel(cards[a])] - weight[phraseLevel(cards[b])]);
}
