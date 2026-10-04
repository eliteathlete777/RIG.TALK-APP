// RIG TALK — glossary.js: SŁOWNIK kluczowych słów (hala, rigging, LED, kable, programowanie…) z wymową po polsku

import { store } from './state.js';
import * as speech from './speech.js';

let dataCache = null;

export async function loadGlossary(){
  if (dataCache) return dataCache;
  const res = await fetch('content/glossary.json', { cache: 'no-store' });
  dataCache = await res.json();
  return dataCache;
}

export function speakEn(text){
  const lang = store.get().settings.variant === 'us' ? 'en-US' : 'en-GB';
  speech.speak(text, { lang, rate: 0.9 }).catch(() => {});
}

/** Jeden wiersz terminu: EN + [wymowa] + PL (+ notka) + 🔊. */
export function termRow(term){
  const row = document.createElement('div');
  row.className = 'term-row';
  const txt = document.createElement('div');
  txt.className = 'term-txt';
  const top = document.createElement('div');
  const en = document.createElement('span');
  en.className = 'term-en';
  en.textContent = term.en;
  const ph = document.createElement('span');
  ph.className = 'term-ph';
  ph.textContent = `[${term.ph}]`;
  top.append(en, ' ', ph);
  const pl = document.createElement('div');
  pl.className = 'term-pl';
  pl.textContent = term.pl;
  txt.append(top, pl);
  if (term.note){
    const note = document.createElement('div');
    note.className = 'term-note';
    note.textContent = term.note;
    txt.appendChild(note);
  }
  const btn = document.createElement('button');
  btn.className = 'icon-box sm';
  btn.setAttribute('aria-label', 'Posłuchaj');
  btn.textContent = '🔊';
  btn.addEventListener('click', () => speakEn(term.en.replace(/!$/, '')));
  row.append(txt, btn);
  return row;
}

const ui = { cat: 'ALL', query: '' };

export async function renderGlossaryScreen(container){
  const data = await loadGlossary();
  container.innerHTML = '';

  const search = document.createElement('input');
  search.type = 'search';
  search.className = 'field';
  search.placeholder = 'Szukaj słowa PL / EN…';
  search.value = ui.query;
  container.appendChild(search);

  const chips = document.createElement('div');
  chips.className = 'chips';
  const cats = [['ALL', 'Wszystkie'], ...Object.entries(data.categories)];
  cats.forEach(([key, label]) => {
    const b = document.createElement('button');
    b.className = 'chip' + (ui.cat === key ? ' active' : '');
    b.textContent = label;
    b.addEventListener('click', () => { ui.cat = key; chips.querySelectorAll('.chip').forEach(c => c.classList.toggle('active', c === b)); paint(); });
    chips.appendChild(b);
  });
  container.appendChild(chips);

  const count = document.createElement('div');
  count.className = 'muted-sm';
  container.appendChild(count);
  const list = document.createElement('div');
  container.appendChild(list);

  function paint(){
    const q = ui.query.trim().toLowerCase();
    const items = data.terms.filter(t =>
      (ui.cat === 'ALL' || t.cat === ui.cat) &&
      (!q || t.en.toLowerCase().includes(q) || t.pl.toLowerCase().includes(q)));
    count.textContent = `${items.length} / ${data.terms.length} słów`;
    list.innerHTML = '';
    let lastCat = null;
    items.forEach(t => {
      if (ui.cat === 'ALL' && !q && t.cat !== lastCat){
        const h = document.createElement('h3');
        h.className = 'list-head';
        h.textContent = data.categories[t.cat];
        list.appendChild(h);
        lastCat = t.cat;
      }
      list.appendChild(termRow(t));
    });
  }
  search.addEventListener('input', () => { ui.query = search.value; paint(); });
  paint();
}
