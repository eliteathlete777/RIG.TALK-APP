// RIG TALK — red.js: 🟥 CZERWONE — grupy, Moja ściąga, karty „pokaż klientowi”

import { store } from './state.js';
import { loadAllChunks } from './content.js';
import * as speech from './speech.js';
import { toggleStar } from './library.js';
import * as i18n from './i18n.js';

let ctxCache = null;
let redDataCache = null;
let viewMode = 'stoisko'; // tryb hali jest domyślny podczas realizacji
let openGroupKey = null;
let openStandKey = null;
let searchQuery = '';
let wakeLock = null;

async function loadRedJson(){
  const res = await fetch('content/red.json', { cache: 'no-store' });
  return res.json();
}

function playAudio(en){
  const lang = store.get().settings.variant === 'us' ? 'en-US' : 'en-GB';
  speech.speak(en, { lang, rate: 1.0 }).catch(() => {});
}

function isStarred(id){
  return (store.get().starred || []).includes(id);
}

export async function renderRedScreen(container){
  ctxCache = ctxCache || await loadAllChunks();
  redDataCache = redDataCache || await loadRedJson();
  const ctx = ctxCache;
  const redData = redDataCache;
  container.innerHTML = '';

  const onSiteStatus = document.createElement('div');
  onSiteStatus.className = 'on-site-status';
  const statusCopy = document.createElement('p');
  statusCopy.textContent = 'TRYB HALI · duży tekst, odsłuch i szybkie wyszukiwanie';
  const wakeBtn = document.createElement('button');
  wakeBtn.className = 'btn btn-sm';
  wakeBtn.textContent = wakeLock ? 'EKRAN: WŁ.' : 'NIE WYGASZAJ';
  wakeBtn.addEventListener('click', async () => {
    try {
      if (wakeLock){ await wakeLock.release(); wakeLock = null; }
      else if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen');
      else alert('Ta przeglądarka nie obsługuje blokady wygaszania.');
    } catch (e){ alert('Telefon nie pozwolił zablokować wygaszania ekranu.'); }
    renderRedScreen(container);
  });
  onSiteStatus.append(statusCopy, wakeBtn);
  container.appendChild(onSiteStatus);

  const search = document.createElement('input');
  search.className = 'field on-site-search';
  search.placeholder = 'Co chcesz powiedzieć? Szukaj PL / EN…';
  search.value = searchQuery;
  container.appendChild(search);

  const tabs = document.createElement('div');
  tabs.className = 'track-switch';
  tabs.style.marginBottom = '14px';
  [['groups', 'Grupy'], ['stoisko', 'Tryb stoiska'], ['sciaga', 'Moja ściąga'], ['karty', 'Pokaż klientowi']].forEach(([key, label]) => {
    const b = document.createElement('button');
    b.textContent = label;
    b.classList.toggle('active', viewMode === key);
    b.addEventListener('click', () => { viewMode = key; openGroupKey = null; openStandKey = null; render(); });
    tabs.appendChild(b);
  });
  container.appendChild(tabs);

  const body = document.createElement('div');
  container.appendChild(body);
  search.addEventListener('input', () => { searchQuery = search.value; render(); });

  function chunkRow(chunk){
    const row = document.createElement('div');
    row.className = 'card';
    row.style.cssText = 'display:flex; align-items:center; gap:10px; padding:10px 12px;';
    const txt = document.createElement('div');
    txt.style.flex = '1';
    const enLine = document.createElement('div');
    enLine.style.fontWeight = '500';
    enLine.textContent = chunk.en;
    txt.appendChild(enLine);
    i18n.appendTranslatable(txt, chunk.pl, { style: 'color:var(--dim); font-size:13px;' });
    row.appendChild(txt);

    const speakBtn = document.createElement('button');
    speakBtn.className = 'icon-box';
    speakBtn.textContent = '🔊';
    speakBtn.addEventListener('click', () => playAudio(chunk.en));
    row.appendChild(speakBtn);

    const starBtn = document.createElement('button');
    starBtn.className = 'icon-box';
    starBtn.textContent = isStarred(chunk.id) ? '★' : '☆';
    starBtn.style.color = isStarred(chunk.id) ? 'var(--red)' : 'var(--dim)';
    starBtn.style.borderColor = isStarred(chunk.id) ? 'var(--red)' : 'var(--line)';
    starBtn.addEventListener('click', () => { toggleStar(chunk.id); render(); });
    row.appendChild(starBtn);

    return row;
  }

  function renderGroups(){
    if (openGroupKey){
      const group = redData.groups.find(g => g.key === openGroupKey);
      const backBtn = document.createElement('button');
      backBtn.className = 'btn';
      backBtn.textContent = '← Wszystkie grupy';
      backBtn.addEventListener('click', () => { openGroupKey = null; render(); });
      body.appendChild(backBtn);

      const title = document.createElement('h3');
      title.style.margin = '14px 0 8px 0';
      title.textContent = group.title;
      body.appendChild(title);

      const chunks = group.ids.map(id => ctx.chunks.get(id)).filter(Boolean);
      if (!chunks.length){
        const empty = document.createElement('div');
        empty.style.cssText = 'color:var(--dim); padding:10px 0;';
        empty.textContent = 'Ta grupa wkrótce się zapełni (kolejne moduły w budowie).';
        body.appendChild(empty);
      }
      chunks.forEach(c => body.appendChild(chunkRow(c)));
      return;
    }

    redData.groups.forEach(group => {
      const chunks = group.ids.map(id => ctx.chunks.get(id)).filter(Boolean);
      const tile = document.createElement('button');
      tile.className = 'card';
      tile.style.cssText = 'width:100%; text-align:left; display:flex; justify-content:space-between; align-items:center; border-color:var(--red);';
      const label = document.createElement('span');
      label.style.cssText = 'font-family:var(--font-display); font-size:16px;';
      label.textContent = group.title;
      const count = document.createElement('span');
      count.style.cssText = 'color:var(--dim); font-size:13px;';
      count.textContent = chunks.length + ' zwrotów';
      tile.appendChild(label);
      tile.appendChild(count);
      tile.addEventListener('click', () => { openGroupKey = group.key; render(); });
      body.appendChild(tile);
    });
  }

  function renderStoisko(){
    if (openStandKey){
      const situation = redData.standMode.find(s => s.key === openStandKey);
      const backBtn = document.createElement('button');
      backBtn.className = 'btn';
      backBtn.textContent = '← Wszystkie sytuacje';
      backBtn.addEventListener('click', () => { openStandKey = null; render(); });
      body.appendChild(backBtn);

      const title = document.createElement('h3');
      title.style.margin = '14px 0 8px 0';
      title.textContent = situation.title;
      body.appendChild(title);

      const chunks = situation.ids.map(id => ctx.chunks.get(id)).filter(Boolean);
      if (!chunks.length){
        const empty = document.createElement('div');
        empty.style.cssText = 'color:var(--dim); padding:10px 0;';
        empty.textContent = 'Ta sytuacja wkrótce się zapełni (kolejne moduły w budowie).';
        body.appendChild(empty);
      }
      chunks.forEach(c => body.appendChild(chunkRow(c)));
      return;
    }
    (redData.standMode || []).forEach(situation => {
      const chunks = situation.ids.map(id => ctx.chunks.get(id)).filter(Boolean);
      const tile = document.createElement('button');
      tile.className = 'card';
      tile.style.cssText = 'width:100%; text-align:left; display:flex; justify-content:space-between; align-items:center; border-color:var(--red);';
      const label = document.createElement('span');
      label.style.cssText = 'font-family:var(--font-display); font-size:16px;';
      label.textContent = situation.title;
      const count = document.createElement('span');
      count.style.cssText = 'color:var(--dim); font-size:13px;';
      count.textContent = chunks.length + ' zwrotów';
      tile.appendChild(label);
      tile.appendChild(count);
      tile.addEventListener('click', () => { openStandKey = situation.key; render(); });
      body.appendChild(tile);
    });
  }

  function renderSciaga(){
    const s = store.get();
    const order = s.redOrder && s.redOrder.length ? s.redOrder : (s.starred || []);
    const chunks = order.map(id => ctx.chunks.get(id) || (s.custom || []).find(c => c.id === id)).filter(Boolean);
    if (!chunks.length){
      const empty = document.createElement('div');
      empty.className = 'card';
      empty.textContent = 'Pusto. Zaznacz gwiazdką dowolny zwrot w BIBLIOTECE albo w grupach CZERWONYCH.';
      body.appendChild(empty);
      return;
    }
    chunks.forEach(c => body.appendChild(chunkRow(c)));
  }

  function renderKarty(){
    (redData.showClientCards || []).forEach(card => {
      const tile = document.createElement('button');
      tile.className = 'card';
      tile.style.cssText = 'width:100%; text-align:center; background:var(--red); border-color:var(--red); padding:20px;';
      const en = document.createElement('div');
      en.style.cssText = 'font-family:var(--font-display); font-size:18px; color:var(--white);';
      en.textContent = card.en;
      tile.appendChild(en);
      tile.addEventListener('click', () => openFullscreenCard(card));
      body.appendChild(tile);
    });
  }

  function render(){
    body.innerHTML = '';
    const query = searchQuery.trim().toLowerCase();
    if (query){
      const custom = store.get().custom || [];
      const results = [...ctx.chunks.values(), ...custom]
        .filter(chunk => chunk.en.toLowerCase().includes(query) || chunk.pl.toLowerCase().includes(query));
      if (!results.length){
        const empty = document.createElement('div');
        empty.className = 'card';
        empty.textContent = 'Brak wyniku. Spróbuj krótszego słowa, np. „prąd”, „panel” albo „czekaj”.';
        body.appendChild(empty);
      } else results.slice(0, 30).forEach(chunk => body.appendChild(chunkRow(chunk)));
      return;
    }
    [...tabs.children].forEach(b => b.classList.toggle('active',
      (b.textContent === 'Grupy' && viewMode === 'groups') ||
      (b.textContent === 'Tryb stoiska' && viewMode === 'stoisko') ||
      (b.textContent === 'Moja ściąga' && viewMode === 'sciaga') ||
      (b.textContent === 'Pokaż klientowi' && viewMode === 'karty')));
    if (viewMode === 'groups') renderGroups();
    else if (viewMode === 'stoisko') renderStoisko();
    else if (viewMode === 'sciaga') renderSciaga();
    else renderKarty();
  }

  render();
}

function openFullscreenCard(card){
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed; inset:0; z-index:40; background:var(--red); display:flex; flex-direction:column; align-items:center; justify-content:center; padding:24px; text-align:center;';
  const txt = document.createElement('div');
  txt.style.cssText = 'font-family:var(--font-display); font-size:28px; color:var(--white); margin-bottom:20px;';
  txt.textContent = card.en;
  const closeBtn = document.createElement('button');
  closeBtn.className = 'btn';
  closeBtn.style.cssText = 'background:var(--white); color:var(--red); border-color:var(--white);';
  closeBtn.textContent = 'Zamknij';
  closeBtn.addEventListener('click', () => overlay.remove());
  overlay.appendChild(txt);
  overlay.appendChild(closeBtn);
  document.body.appendChild(overlay);
}
