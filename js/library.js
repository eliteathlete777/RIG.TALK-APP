// RIG TALK — library.js: BIBLIOTEKA (wszystkie zwroty), filtry, ⭐, własne zwroty

import { store } from './state.js';
import { loadAllChunks, allChunksArray, chunkTrack } from './content.js';
import * as speech from './speech.js';
import * as i18n from './i18n.js';
import * as srs from './srs.js';

let ctxCache = null;

function playAudio(chunk){
  const lang = store.get().settings.variant === 'us' ? 'en-US' : 'en-GB';
  speech.speak(chunk.en, { lang, rate: 1.0 }).catch(() => {});
}

function isStarred(id){
  return (store.get().starred || []).includes(id);
}

export function toggleStar(id){
  const s = store.get();
  const starred = new Set(s.starred || []);
  const redOrder = [...(s.redOrder || [])];
  if (starred.has(id)){
    starred.delete(id);
    const idx = redOrder.indexOf(id);
    if (idx !== -1) redOrder.splice(idx, 1);
  } else {
    starred.add(id);
    redOrder.push(id);
  }
  store.set({ starred: [...starred], redOrder });
}

export function addCustomChunk({ en, pl, track = 'T' }){
  const s = store.get();
  const custom = [...(s.custom || [])];
  const id = `custom-${Date.now()}`;
  custom.push({
    id, track, type: 'SAY', module: null, unit: null,
    en, pl, hint_pl: 'Własny zwrot dodany ręcznie.',
    variants: { alt: [] }, register: 'neutral', red: false, tags: ['custom'],
  });
  store.set({ custom });
  return id;
}

export function deleteChunkForever(id){
  const s = store.get();
  const deleted = new Set(s.deleted || []);
  deleted.add(id);
  store.set({
    custom: (s.custom || []).filter(c => c.id !== id),
    deleted: [...deleted],
    starred: (s.starred || []).filter(x => x !== id),
    redOrder: (s.redOrder || []).filter(x => x !== id),
  });
}

/** Zwraca wszystkie zwroty (curriculum + własne) jako jedną tablicę do przeszukiwania. */
export function allSearchableChunks(ctx){
  const deleted = new Set(store.get().deleted || []);
  return [...allChunksArray(ctx), ...(store.get().custom || [])].filter(c => !deleted.has(c.id));
}

function matchesFilters(chunk, filters){
  if (filters.track !== 'ALL' && chunkTrack(chunk.id) !== filters.track) return false;
  if (filters.type !== 'ALL' && chunk.type !== filters.type) return false;
  if (filters.starredOnly && !isStarred(chunk.id)) return false;
  if (filters.redOnly && !chunk.red) return false;
  if (filters.query){
    const q = filters.query.toLowerCase();
    if (!chunk.en.toLowerCase().includes(q) && !chunk.pl.toLowerCase().includes(q)) return false;
  }
  return true;
}

/** Filtrowanie użyte też przez testy/walidację liczności (bez DOM). */
export function filterChunks(allChunks, filters){
  return allChunks.filter(c => matchesFilters(c, filters));
}

const state = { track: 'ALL', type: 'ALL', starredOnly: false, redOnly: false, query: '' };

export async function renderLibraryScreen(container){
  ctxCache = ctxCache || await loadAllChunks();
  const ctx = ctxCache;
  container.innerHTML = '';

  // ---------- pasek filtrów ----------
  const filterBar = document.createElement('div');
  filterBar.className = 'card';

  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = 'Szukaj PL / EN…';
  searchInput.value = state.query;
  searchInput.style.cssText = 'width:100%; background:var(--bg); color:var(--white); border:1px solid var(--line); border-radius:8px; padding:8px; margin-bottom:10px;';
  searchInput.addEventListener('input', () => { state.query = searchInput.value; renderList(); });
  filterBar.appendChild(searchInput);

  function pillRow(label, options, currentKey, onPick){
    const row = document.createElement('div');
    row.style.cssText = 'display:flex; gap:6px; flex-wrap:wrap; margin-bottom:8px; align-items:center;';
    const lab = document.createElement('span');
    lab.textContent = label + ':';
    lab.style.cssText = 'color:var(--dim); font-size:12px; margin-right:4px;';
    row.appendChild(lab);
    options.forEach(([key, text]) => {
      const b = document.createElement('button');
      b.textContent = text;
      b.className = 'btn';
      b.style.cssText = 'padding:6px 10px; min-height:32px; font-size:12px;' + (state[currentKey] === key || (currentKey === 'starredOnly' && state.starredOnly === key) ? ' border-color:var(--red); color:var(--red);' : '');
      b.addEventListener('click', () => { onPick(key); renderList(); paintPills(); });
      row.appendChild(b);
    });
    return row;
  }

  const trackRow = pillRow('Tor', [['ALL', 'Wszystkie'], ['D', 'Codzienny'], ['T', 'Tech']], 'track', (k) => { state.track = k; });
  const typeRow = pillRow('Typ', [['ALL', 'Wszystkie'], ['SAY', 'SAY'], ['HEAR', 'HEAR']], 'type', (k) => { state.type = k; });
  const flagRow = document.createElement('div');
  flagRow.style.cssText = 'display:flex; gap:8px; margin-bottom:4px;';
  const starBtn = document.createElement('button');
  starBtn.className = 'btn';
  starBtn.textContent = '⭐ Tylko zaznaczone';
  starBtn.addEventListener('click', () => { state.starredOnly = !state.starredOnly; renderList(); paintPills(); });
  const redBtn = document.createElement('button');
  redBtn.className = 'btn';
  redBtn.textContent = '🟥 Tylko czerwone';
  redBtn.addEventListener('click', () => { state.redOnly = !state.redOnly; renderList(); paintPills(); });
  flagRow.appendChild(starBtn);
  flagRow.appendChild(redBtn);

  filterBar.appendChild(trackRow);
  filterBar.appendChild(typeRow);
  filterBar.appendChild(flagRow);

  const countLabel = document.createElement('div');
  countLabel.style.cssText = 'color:var(--dim); font-size:12px; margin-top:4px;';
  filterBar.appendChild(countLabel);

  container.appendChild(filterBar);

  // ---------- dodawanie własnego zwrotu ----------
  const addCard = document.createElement('div');
  addCard.className = 'card';
  addCard.innerHTML = `<h3>Dodaj własny zwrot</h3>`;
  const enInput = document.createElement('input');
  enInput.placeholder = 'po angielsku';
  enInput.style.cssText = 'width:100%; background:var(--bg); color:var(--white); border:1px solid var(--line); border-radius:8px; padding:8px; margin-bottom:6px;';
  const plInput = document.createElement('input');
  plInput.placeholder = 'po polsku';
  plInput.style.cssText = enInput.style.cssText;
  const trackSelect = document.createElement('select');
  trackSelect.style.cssText = 'width:100%; background:var(--bg); color:var(--white); border:1px solid var(--line); border-radius:8px; padding:8px; margin-bottom:8px;';
  trackSelect.innerHTML = '<option value="D">Codzienny</option><option value="T">Tech</option>';
  const addBtn = document.createElement('button');
  addBtn.className = 'btn btn-primary';
  addBtn.textContent = '+ Dodaj';
  addBtn.addEventListener('click', () => {
    if (!enInput.value.trim() || !plInput.value.trim()) return;
    addCustomChunk({ en: enInput.value.trim(), pl: plInput.value.trim(), track: trackSelect.value });
    enInput.value = ''; plInput.value = '';
    renderList();
  });
  addCard.appendChild(enInput);
  addCard.appendChild(plInput);
  addCard.appendChild(trackSelect);
  addCard.appendChild(addBtn);
  container.appendChild(addCard);

  // ---------- lista wyników ----------
  const listWrap = document.createElement('div');
  container.appendChild(listWrap);

  function paintPills(){
    // przemaluj cały pasek filtrów (prosta reimplementacja stanu wizualnego)
    [...trackRow.children].slice(1).forEach((b, i) => {
      const key = ['ALL', 'D', 'T'][i];
      b.style.borderColor = state.track === key ? 'var(--red)' : 'var(--line)';
      b.style.color = state.track === key ? 'var(--red)' : 'var(--white)';
    });
    [...typeRow.children].slice(1).forEach((b, i) => {
      const key = ['ALL', 'SAY', 'HEAR'][i];
      b.style.borderColor = state.type === key ? 'var(--red)' : 'var(--line)';
      b.style.color = state.type === key ? 'var(--red)' : 'var(--white)';
    });
    starBtn.style.borderColor = state.starredOnly ? 'var(--red)' : 'var(--line)';
    starBtn.style.color = state.starredOnly ? 'var(--red)' : 'var(--white)';
    redBtn.style.borderColor = state.redOnly ? 'var(--red)' : 'var(--line)';
    redBtn.style.color = state.redOnly ? 'var(--red)' : 'var(--white)';
  }

  function renderList(){
    const all = allSearchableChunks(ctx);
    const filtered = filterChunks(all, state);
    countLabel.textContent = `${filtered.length} / ${all.length} zwrotów`;
    listWrap.innerHTML = '';
    filtered.slice(0, 200).forEach(chunk => {
      const row = document.createElement('div');
      row.className = 'card';
      row.style.cssText = 'display:flex; align-items:center; gap:10px; padding:10px 12px;';

      const txt = document.createElement('div');
      txt.style.flex = '1';
      const enLine = document.createElement('div');
      enLine.style.fontWeight = '500';
      enLine.textContent = chunk.en + (chunk.red ? ' 🟥' : '');
      txt.appendChild(enLine);
      i18n.appendTranslatable(txt, chunk.pl, { style: 'color:var(--dim); font-size:13px;' });
      row.appendChild(txt);

      const speakBtn = document.createElement('button');
      speakBtn.className = 'icon-box';
      speakBtn.textContent = '🔊';
      speakBtn.addEventListener('click', () => playAudio(chunk));
      row.appendChild(speakBtn);

      const starToggle = document.createElement('button');
      starToggle.className = 'icon-box';
      starToggle.textContent = isStarred(chunk.id) ? '★' : '☆';
      starToggle.style.color = isStarred(chunk.id) ? 'var(--red)' : 'var(--dim)';
      starToggle.style.borderColor = isStarred(chunk.id) ? 'var(--red)' : 'var(--line)';
      starToggle.addEventListener('click', () => { toggleStar(chunk.id); renderList(); });
      row.appendChild(starToggle);

      const delBtn = document.createElement('button');
      delBtn.className = 'icon-box';
      delBtn.textContent = '✕';
      delBtn.setAttribute('aria-label', 'Usuń na zawsze');
      delBtn.addEventListener('click', () => {
        if (!confirm(`Usunąć ten zwrot na zawsze z aplikacji?\n\n${chunk.en}`)) return;
        deleteChunkForever(chunk.id);
        renderList();
      });
      row.appendChild(delBtn);

      listWrap.appendChild(row);
    });
  }

  paintPills();
  renderList();
}

/** ULUBIONE: jedna duża fiszka, tap = obrót, swipe w lewo/prawo = nawigacja. */
export async function renderFavoritesScreen(container){
  ctxCache = ctxCache || await loadAllChunks();
  const all = allSearchableChunks(ctxCache);
  let favorites = (store.get().starred || []).map(id => all.find(c => c.id === id)).filter(Boolean);
  let index = 0;
  let revealed = false;
  let drillDone = false;
  let lastFeedback = '';
  let roundStats = { good: 0, again: 0 };

  container.innerHTML = '';
  const shell = document.createElement('div');
  shell.className = 'favorites-shell';
  container.appendChild(shell);

  function move(delta){
    const target = index + delta;
    if (target < 0 || target >= favorites.length) return;
    index = target;
    revealed = false;
    lastFeedback = '';
    render();
  }

  function rateFavorite(id, rating){
    const cards = { ...(store.get().cards || {}) };
    const current = cards[id] || srs.newCard(new Date());
    cards[id] = srs.reviewCard(current, rating, new Date()).card;
    store.set({ cards });
    if (rating === srs.Rating.Good || rating === srs.Rating.Easy){
      roundStats.good++;
      lastFeedback = 'ZAPISANO: UMIEM';
    } else {
      roundStats.again++;
      lastFeedback = 'ZAPISANO: WRÓCI SZYBCIEJ';
    }
    revealed = false;
    if (index < favorites.length - 1) index++;
    else drillDone = true;
    render();
  }

  function render(){
    shell.innerHTML = '';
    favorites = (store.get().starred || []).map(id => all.find(c => c.id === id)).filter(Boolean);
    if (!favorites.length){
      const empty = document.createElement('div');
      empty.className = 'favorites-empty frame';
      const title = document.createElement('h2');
      title.textContent = 'TU TRAFIĄ TWOJE PEWNIAKI';
      const copy = document.createElement('p');
      copy.textContent = 'Dodaj ★ przy zwrocie w zakładce Zwroty. Potem wróć tutaj i przewijaj fiszki palcem.';
      const go = document.createElement('button');
      go.className = 'btn btn-primary btn-lg';
      go.textContent = 'PRZEJDŹ DO ZWROTÓW';
      go.addEventListener('click', () => {
        store.set({ ui: { libTab: 'zwroty' } });
        document.querySelector('[data-screen="biblioteka"] #libTabs [data-value="zwroty"]')?.click();
      });
      empty.append(title, copy, go);
      shell.appendChild(empty);
      return;
    }

    const mode = store.get().ui?.favoritesMode === 'cards' ? 'cards' : 'list';
    const modeSwitch = document.createElement('div');
    modeSwitch.className = 'track-switch favorites-mode-switch';
    [['list', 'LISTA'], ['cards', 'FISZKI']].forEach(([key, label]) => {
      const button = document.createElement('button');
      button.textContent = label;
      button.classList.toggle('active', key === mode);
      button.addEventListener('click', () => {
        store.set({ ui: { favoritesMode: key } });
        revealed = false;
        drillDone = false;
        render();
      });
      modeSwitch.appendChild(button);
    });
    shell.appendChild(modeSwitch);

    if (mode === 'list'){
      const summary = document.createElement('div');
      summary.className = 'favorites-list-summary';
      summary.textContent = `${favorites.length} ${favorites.length === 1 ? 'ulubiony zwrot' : 'ulubionych zwrotów'}`;
      shell.appendChild(summary);
      favorites.forEach(chunk => {
        const row = document.createElement('div');
        row.className = 'favorite-list-row';
        const copy = document.createElement('div');
        copy.className = 'favorite-list-copy';
        const en = document.createElement('div');
        en.className = 'favorite-list-en';
        en.textContent = chunk.en;
        const pl = document.createElement('div');
        pl.className = 'favorite-list-pl';
        pl.textContent = chunk.pl;
        copy.append(en, pl);
        const audio = document.createElement('button');
        audio.className = 'icon-box sm';
        audio.textContent = '🔊';
        audio.setAttribute('aria-label', `Posłuchaj: ${chunk.en}`);
        audio.addEventListener('click', () => playAudio(chunk));
        const remove = document.createElement('button');
        remove.className = 'icon-box sm favorite-list-remove';
        remove.textContent = '✕';
        remove.setAttribute('aria-label', `Usuń z ulubionych: ${chunk.en}`);
        remove.addEventListener('click', () => {
          toggleStar(chunk.id);
          render();
        });
        row.append(copy, audio, remove);
        shell.appendChild(row);
      });
      return;
    }

    if (drillDone){
      const done = document.createElement('div');
      done.className = 'favorites-empty frame';
      done.innerHTML = `<h2>RUNDA ZROBIONA</h2><p>${roundStats.good} umiem · ${roundStats.again} wróci szybciej. Każda ocena została zapisana w planie powtórek.</p>`;
      const back = document.createElement('button');
      back.className = 'btn btn-ghost';
      back.textContent = '← WRÓĆ DO OSTATNIEJ';
      back.addEventListener('click', () => { drillDone = false; index = Math.max(0, favorites.length - 1); render(); });
      const again = document.createElement('button');
      again.className = 'btn btn-primary btn-lg';
      again.textContent = 'JESZCZE JEDNA RUNDA';
      again.addEventListener('click', () => { index = 0; drillDone = false; revealed = false; roundStats = { good: 0, again: 0 }; lastFeedback = ''; render(); });
      done.append(back, again);
      shell.appendChild(done);
      return;
    }

    index = Math.max(0, Math.min(index, favorites.length - 1));
    const chunk = favorites[index];
    const top = document.createElement('div');
    top.className = 'favorites-topline';
    const counter = document.createElement('span');
    counter.textContent = `${index + 1} / ${favorites.length}`;
    const remove = document.createElement('button');
    remove.className = 'favorite-remove';
    remove.textContent = '★ USUŃ Z ULUBIONYCH';
    remove.addEventListener('click', () => {
      toggleStar(chunk.id);
      if (index >= favorites.length - 1) index = Math.max(0, index - 1);
      revealed = false;
      render();
    });
    top.append(counter, remove);

    const browse = document.createElement('div');
    browse.className = 'favorite-arrow-nav';
    const browsePrev = document.createElement('button');
    browsePrev.className = 'icon-box';
    browsePrev.textContent = '←';
    browsePrev.setAttribute('aria-label', 'Poprzedni zwrot');
    browsePrev.disabled = index === 0;
    browsePrev.addEventListener('click', () => move(-1));
    const feedback = document.createElement('span');
    feedback.textContent = lastFeedback || 'PRZEWIJAJ LUB OCEŃ';
    const browseNext = document.createElement('button');
    browseNext.className = 'icon-box';
    browseNext.textContent = '→';
    browseNext.setAttribute('aria-label', 'Następny zwrot');
    browseNext.disabled = index === favorites.length - 1;
    browseNext.addEventListener('click', () => move(1));
    browse.append(browsePrev, feedback, browseNext);

    const stage = document.createElement('div');
    stage.className = 'flashcard-stage';
    const card = document.createElement('button');
    card.className = 'favorite-flashcard';
    card.setAttribute('aria-label', 'Odwróć fiszkę');
    const side = document.createElement('span');
    side.className = 'flashcard-side';
    side.textContent = revealed ? 'MODEL PO ANGIELSKU' : (chunk.type === 'HEAR' ? 'CO TO ZNACZY?' : 'POWIEDZ PO ANGIELSKU');
    const text = document.createElement('span');
    text.className = 'flashcard-text';
    text.textContent = revealed ? chunk.en : chunk.pl;
    const hint = document.createElement('span');
    hint.className = 'flashcard-hint';
    hint.textContent = revealed ? (chunk.hint_pl || 'Oceń odpowiedź gestem') : 'Najpierw odpowiedz na głos, potem dotknij';
    card.append(side, text, hint);
    card.addEventListener('click', () => { revealed = !revealed; render(); });
    stage.appendChild(card);

    let startX = null;
    let dragged = false;
    card.addEventListener('pointerdown', e => { startX = e.clientX; dragged = false; card.setPointerCapture(e.pointerId); });
    card.addEventListener('pointermove', e => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 8) dragged = true;
      card.style.transform = `translateX(${Math.max(-90, Math.min(90, dx))}px) rotate(${dx / 24}deg)`;
    });
    card.addEventListener('pointerup', e => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      startX = null;
      card.style.transform = '';
      if (Math.abs(dx) < 55) return;
      e.preventDefault();
      rateFavorite(chunk.id, dx < 0 ? srs.Rating.Again : srs.Rating.Good);
    });
    card.addEventListener('click', e => { if (dragged) e.preventDefault(); }, true);

    const audio = document.createElement('button');
    audio.className = 'btn btn-outline favorite-audio';
    audio.textContent = '🔊 POSŁUCHAJ';
    audio.addEventListener('click', () => playAudio(chunk));

    const nav = document.createElement('div');
    nav.className = 'favorites-nav';
    const again = document.createElement('button');
    again.className = 'btn'; again.textContent = '← JESZCZE NIE';
    const good = document.createElement('button');
    good.className = 'btn btn-primary'; good.textContent = 'UMIEM →';
    again.addEventListener('click', () => rateFavorite(chunk.id, srs.Rating.Again));
    good.addEventListener('click', () => rateFavorite(chunk.id, srs.Rating.Good));
    nav.append(again, good);

    const swipe = document.createElement('div');
    swipe.className = 'favorites-swipe-help';
    swipe.textContent = 'PRZESUŃ ← JESZCZE NIE  ·  UMIEM →';
    shell.append(top, browse, stage, audio, nav, swipe);
  }

  render();
}
