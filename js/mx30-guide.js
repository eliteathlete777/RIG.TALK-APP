import { store } from './state.js';
import * as speech from './speech.js';

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

  guide.sections.forEach(section => {
    const wrap = document.createElement('section');
    wrap.className = `mx-step ${section.status}`;
    const title = document.createElement('h3');
    title.textContent = `${section.id}. ${section.title_pl}`;
    const en = document.createElement('div');
    en.className = 'mx-step-en';
    en.textContent = section.title_en;
    const status = document.createElement('div');
    status.className = 'mx-status';
    status.textContent = statusLabel(section.status);
    const list = document.createElement('ol');
    section.steps_pl.forEach(step => { const li = document.createElement('li'); li.textContent = step; list.appendChild(li); });
    wrap.append(status, title, en, list);
    if (section.note_pl){ const note = document.createElement('div'); note.className = 'tip'; note.textContent = section.note_pl; wrap.appendChild(note); }
    (section.checks || []).forEach((label, index) => {
      const key = `${section.id}-${index}`;
      const row = document.createElement('label');
      row.className = 'check-row' + (checks[key] ? ' on' : '');
      const input = document.createElement('input'); input.type = 'checkbox'; input.checked = !!checks[key];
      const text = document.createElement('span'); text.textContent = label;
      input.addEventListener('change', () => { store.set({ mx30: { checks: { [key]: input.checked } } }); row.classList.toggle('on', input.checked); });
      row.append(input, text); wrap.appendChild(row);
    });
    container.appendChild(wrap);
  });

  const phrases = document.createElement('div');
  phrases.className = 'card';
  const heading = document.createElement('h2'); heading.textContent = 'ZWROTY PRZY PROCESORZE'; phrases.appendChild(heading);
  guide.phrases.forEach(phrase => {
    const row = document.createElement('div'); row.className = 'mx-phrase';
    const copy = document.createElement('div'); copy.textContent = phrase.en;
    const pl = document.createElement('small'); pl.textContent = phrase.pl; copy.appendChild(pl);
    const play = document.createElement('button'); play.className = 'icon-box sm'; play.textContent = '🔊';
    play.addEventListener('click', () => speech.speak(phrase.en, { lang: store.get().settings.variant === 'us' ? 'en-US' : 'en-GB' }).catch(() => {}));
    row.append(copy, play); phrases.appendChild(row);
  });
  container.appendChild(phrases);
}
