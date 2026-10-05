import { store } from './state.js';
import * as speech from './speech.js';
import { acc, expandBar } from './acc.js';
import { hideButton, visibleItems } from './visibility.js';

let cache = null;

async function loadGuide(){
  if (cache) return cache;
  const response = await fetch('content/mx30-guide.json', { cache: 'no-store' });
  if (!response.ok) throw new Error(`MX30 guide: HTTP ${response.status}`);
  cache = await response.json();
  return cache;
}

function statusLabel(status){
  return status === 'confirmed' ? '🟢 POTWIERDZONE' : status === 'stop' ? '🔴 STOP / BACKUP' : status === 'safe' ? '🟢 PROCEDURA' : '🟡 POTWIERDŹ NA SPRZĘCIE';
}

export async function renderMx30Guide(container){
  const guide = await loadGuide();
  const checks = store.get().mx30?.checks || {};
  const hero = document.createElement('div');
  hero.className = 'frame mx-hero';
  hero.innerHTML = `<div class="eyebrow">FIELD MANUAL · PL / EN</div><h2>${guide.title}</h2><p>${guide.subtitle}</p><div class="mx-fact-grid">${guide.facts.map(f => `<div class="mx-fact"><b>${f.value}</b><span>${f.label}</span><em class="mx-status">${statusLabel(f.status)}</em></div>`).join('')}</div><div class="mx-warning">${guide.identity_warning}</div><p class="muted-sm">${guide.source_note}</p>`;
  container.appendChild(hero);

  container.appendChild(expandBar(container));
  guide.sections.forEach((section, index) => {
    const done = () => (section.checks || []).filter((_, k) => (store.get().mx30?.checks || {})[`${section.id}-${k}`]).length;
    const first = section.steps_pl[0] || '';
    const { wrap, body } = acc(`${section.id}. ${section.title_pl}`, {
      open: index === 0,
      sub: first.length > 90 ? first.slice(0, 89).trimEnd() + '…' : first,
      badge: (section.checks || []).length ? `${done()}/${section.checks.length}` : statusLabel(section.status).replace(/^\S+\s/, '').toLowerCase(),
      color: section.status === 'safe' ? 'var(--ok)' : section.status === 'stop' ? 'var(--red)' : '#f2b705',
    });
    const status = document.createElement('div');
    status.className = 'mx-status';
    status.textContent = statusLabel(section.status);
    const list = document.createElement('ol');
    section.steps_pl.forEach(step => { const li = document.createElement('li'); li.textContent = step; list.appendChild(li); });
    body.append(status, list);
    if (section.note_pl){ const note = document.createElement('div'); note.className = 'tip'; note.textContent = section.note_pl; body.appendChild(note); }
    (section.checks || []).forEach((label, k) => {
      const key = `${section.id}-${k}`;
      const row = document.createElement('label');
      row.className = 'check-row' + (checks[key] ? ' on' : '');
      const input = document.createElement('input'); input.type = 'checkbox'; input.checked = !!checks[key];
      const text = document.createElement('span'); text.textContent = label;
      input.addEventListener('change', () => {
        store.set({ mx30: { checks: { [key]: input.checked } } });
        row.classList.toggle('on', input.checked);
        wrap.querySelector('.mz-acc-b').textContent = `${done()}/${section.checks.length}`;
      });
      row.append(input, text); body.appendChild(row);
    });
    container.appendChild(wrap);
  });

  const phrases = document.createElement('div');
  phrases.className = 'card';
  const heading = document.createElement('h2'); heading.textContent = 'ZWROTY PRZY PROCESORZE'; phrases.appendChild(heading);
  visibleItems(guide.phrases, 'phrase', phrase => phrase.id || phrase.en).forEach(phrase => {
    const row = document.createElement('div'); row.className = 'mx-phrase';
    const copy = document.createElement('div'); copy.textContent = phrase.en;
    const pl = document.createElement('small'); pl.textContent = phrase.pl; copy.appendChild(pl);
    const play = document.createElement('button'); play.className = 'icon-box sm'; play.textContent = '🔊';
    play.addEventListener('click', () => speech.speak(phrase.en, { lang: store.get().settings.variant === 'us' ? 'en-US' : 'en-GB' }).catch(() => {}));
    row.append(copy, play, hideButton('phrase', phrase.id || phrase.en, phrase.en, () => row.remove())); phrases.appendChild(row);
  });
  container.appendChild(phrases);
}
