// RIG TALK — az.js: szczegółowa instrukcja „Od A do Z" (content/az.json), listy słówek EN–PL i zapytanie o dostępy.
// Język główny: polski. Angielski tylko jako lista słówek z fonetyką i lektorem.

import { store } from './state.js';
import * as speech from './speech.js';
import { acc, expandBar } from './acc.js';

let cache = null;

export async function loadAz(){
  if (cache) return cache;
  const response = await fetch('content/az.json', { cache: 'no-store' });
  if (!response.ok) throw new Error(`az.json: HTTP ${response.status}`);
  cache = await response.json();
  return cache;
}

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

function copyButton(text, label){
  const button = el('button', 'btn btn-primary', label);
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(text);
      button.textContent = 'Skopiowano';
    } catch (e) {
      const area = document.getElementById('az-msg');
      if (area){ area.focus(); area.select(); }
      button.textContent = 'Zaznaczone: Ctrl+C';
    }
    setTimeout(() => { button.textContent = label; }, 2200);
  });
  return button;
}

/** Lista słówek: polski wyraz główny, angielski + fonetyka + lektor. */
export function wordList(words, { title = 'SŁÓWKA · POWTÓRKA', quiz = true } = {}){
  if (!words?.length) return null;
  const card = el('div', 'card mz-words');
  const head = el('div', 'mz-words-head');
  head.appendChild(el('h3', 'mz-h', title));
  if (quiz){
    const hide = el('button', 'btn mz-hide', 'Ukryj angielski');
    hide.addEventListener('click', () => {
      const on = card.classList.toggle('hide-en');
      hide.textContent = on ? 'Pokaż angielski' : 'Ukryj angielski';
    });
    head.appendChild(hide);
  }
  card.appendChild(head);
  words.forEach(([en, pl, ph]) => {
    const row = el('div', 'mz-word');
    row.appendChild(el('b', 'mz-word-pl', pl));
    const right = el('div', 'mz-word-en');
    right.appendChild(el('span', '', en));
    if (ph) right.appendChild(el('small', '', '[' + ph + ']'));
    row.appendChild(right);
    const play = el('button', 'icon-box sm', '🔊');
    play.setAttribute('aria-label', 'Odsłuchaj: ' + en);
    play.addEventListener('click', () => {
      speech.speak(en, { lang: store.get().settings.variant === 'us' ? 'en-US' : 'en-GB' }).catch(() => {});
    });
    row.appendChild(play);
    card.appendChild(row);
  });
  return card;
}

export async function renderWordsChapter(root){
  const az = await loadAz();
  const labels = { az: 'Uruchomienie ekranu', komplet: 'Sprzęt', mechanika: 'Mechanika', cabinety: 'Cabinety', rj45: 'RJ45', zasilanie: 'Zasilanie', mx30panel: 'MX30', vmp: 'VMP', resolume: 'Resolume', uklad: 'Układ ekranu', wideo: 'Wideo testowe', przed: 'Przygotowanie' };
  root.appendChild(el('p', 'muted-sm', 'Tylko kluczowe słowa: polski jest główny, angielski do szybkiej powtórki. Dotknij ukryj angielski, aby się sprawdzić.'));
  root.appendChild(expandBar(root));
  Object.entries(az.words).forEach(([key, list], index) => {
    const { wrap, body } = acc(labels[key] || key, { open: index === 0, badge: String(list.length) });
    const card = wordList(list, { title: 'LISTA', quiz: true });
    if (card){ card.classList.add('plain'); body.appendChild(card); }
    root.appendChild(wrap);
  });
}

export async function renderAz(root){
  const az = await loadAz();
  root.appendChild(el('p', 'mz-intro', az.intro));

  // zapytanie o dostępy i pliki
  const ask = el('div', 'mx-warning');
  ask.appendChild(el('b', '', az.ask.title.toUpperCase()));
  ask.appendChild(el('p', '', az.ask.why));
  const ul = el('ul', 'mz-list');
  az.ask.list.forEach(item => ul.appendChild(el('li', '', item)));
  ask.appendChild(ul);
  const area = el('textarea', 'mz-msg');
  area.id = 'az-msg'; area.readOnly = true; area.rows = 9; area.value = az.ask.message;
  ask.appendChild(area);
  ask.appendChild(copyButton(az.ask.message, 'Kopiuj wiadomość do SQM'));
  root.appendChild(ask);

  const openId = store.get().ui?.azOpen ?? 'p0';
  az.phases.forEach(phase => {
    const open = openId === phase.id;
    const card = el('section', 'stage-card az-phase' + (open ? ' open' : ''));
    card.dataset.phase = phase.id;
    const headBtn = el('button', 'stage-head');
    headBtn.innerHTML = `<span class="stage-num">${phase.n}</span><span class="stage-titles"><span class="stage-title"></span><span class="stage-en"></span></span><span class="stage-count"></span>`;
    headBtn.querySelector('.stage-title').textContent = phase.title;
    headBtn.querySelector('.stage-en').textContent = phase.time && phase.time !== '—' ? 'Czas: ' + phase.time : '';
    headBtn.querySelector('.stage-count').textContent = open ? '−' : '+';
    headBtn.addEventListener('click', () => {
      store.set({ ui: { azOpen: open ? null : phase.id } });
      root.innerHTML = '';
      renderAz(root);
    });
    card.appendChild(headBtn);
    if (open){
      const body = el('div', 'stage-body');
      if (phase.steps){
        const list = el('ol', 'az-steps');
        phase.steps.forEach(step => {
          const li = el('li');
          li.appendChild(el('b', 'az-do', step.do));
          if (step.where) li.appendChild(el('div', 'az-where', 'Gdzie i jak: ' + step.where));
          if (step.check && step.check !== '—') li.appendChild(el('div', 'az-check', '✔ Sprawdź: ' + step.check));
          list.appendChild(li);
        });
        body.appendChild(list);
      }
      if (phase.table){
        phase.table.forEach(([symptom, cause]) => {
          const row = el('div', 'az-fail');
          row.appendChild(el('b', '', symptom));
          row.appendChild(el('span', '', cause));
          body.appendChild(row);
        });
      }
      if (phase.trivia?.length){
        const box = el('div', 'az-trivia');
        box.appendChild(el('b', '', '💡 CIEKAWOSTKI'));
        phase.trivia.forEach(t => box.appendChild(el('p', '', t)));
        body.appendChild(box);
      }
      card.appendChild(body);
    }
    root.appendChild(card);
  });
  const words = wordList(az.words.az, { title: 'SŁÓWKA DO TEJ INSTRUKCJI' });
  if (words) root.appendChild(words);
}
