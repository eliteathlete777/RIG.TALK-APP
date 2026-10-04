// RIG TALK — kurs.js: KURS — mapa modułów. TECH na pierwszym planie, CODZIENNY jako dodatek.
// Każdy moduł: postęp (ile zwrotów już w powtórkach) + „Ćwicz moduł” (sesja skupiona). Pod spodem sceny i boss.

import { store } from './state.js';
import { loadAllChunks, allChunksArray } from './content.js';
import * as session from './session.js';
import * as scenes from './scenes.js';
import * as boss from './boss.js';
import { renderBootcampScreen } from './bootcamp.js';
import { renderSimulation } from './simulation.js';

export async function renderKursScreen(container){
  const requestedMode = store.get().ui?.kursMode;
  const mode = ['bootcamp', 'simulation', 'full'].includes(requestedMode) ? requestedMode : 'bootcamp';
  container.innerHTML = '';
  const modeSwitch = document.createElement('div');
  modeSwitch.className = 'track-switch course-mode-switch';
  [['bootcamp', 'PLAN 55H'], ['simulation', 'PRÓBA'], ['full', 'PEŁNY KURS']].forEach(([key, label]) => {
    const b = document.createElement('button');
    b.textContent = label;
    b.classList.toggle('active', key === mode);
    b.addEventListener('click', () => { store.set({ ui: { kursMode: key } }); renderKursScreen(container); });
    modeSwitch.appendChild(b);
  });
  container.appendChild(modeSwitch);
  if (mode === 'bootcamp'){
    const bootcampRoot = document.createElement('div');
    container.appendChild(bootcampRoot);
    await renderBootcampScreen(bootcampRoot);
    return;
  }
  if (mode === 'simulation'){
    const simulationRoot = document.createElement('div');
    container.appendChild(simulationRoot);
    await renderSimulation(simulationRoot);
    return;
  }

  const ctx = await loadAllChunks();
  const s = store.get();
  const track = s.ui?.kursTrack === 'D' ? 'D' : 'T';

  const sw = document.createElement('div');
  sw.className = 'track-switch';
  [['T', 'TECH · TARGI'], ['D', 'CODZIENNY (dodatek)']].forEach(([key, label]) => {
    const b = document.createElement('button');
    b.textContent = label;
    b.classList.toggle('active', key === track);
    b.addEventListener('click', () => { store.set({ ui: { kursTrack: key } }); renderKursScreen(container); });
    sw.appendChild(b);
  });
  container.appendChild(sw);

  const all = allChunksArray(ctx);
  const modules = ctx.tracks[track].modules;
  modules.forEach((key) => {
    const def = ctx.modulesDef[key];
    const items = all.filter(c => c.module === key);
    if (!items.length) return;
    const learned = items.filter(c => c.id in (s.cards || {})).length;
    const pct = Math.round(learned / items.length * 100);

    const card = document.createElement('div');
    card.className = 'module-card' + (key === 'T7' ? ' featured' : '');
    const head = document.createElement('div');
    head.className = 'module-head';
    const code = document.createElement('span');
    code.className = 'module-code';
    code.textContent = key;
    const name = document.createElement('span');
    name.className = 'module-name';
    name.textContent = def.name;
    const cnt = document.createElement('span');
    cnt.className = 'muted-sm';
    cnt.textContent = `${learned}/${items.length}`;
    head.append(code, name, cnt);

    const bar = document.createElement('div');
    bar.className = 'mini-bar';
    bar.innerHTML = `<div style="width:${pct}%"></div>`;

    const btn = document.createElement('button');
    btn.className = 'btn btn-sm';
    btn.textContent = learned < items.length ? 'Ćwicz moduł' : 'Powtórz moduł';
    btn.addEventListener('click', () => session.startFocusedSession(items.map(c => c.id), { limit: items.length }));

    card.append(head, bar, btn);
    container.appendChild(card);
  });

  const scenesHead = document.createElement('h3');
  scenesHead.className = 'list-head';
  scenesHead.textContent = 'Sceny (dodatek)';
  const scenesRoot = document.createElement('div');
  const bossHead = document.createElement('h3');
  bossHead.className = 'list-head';
  bossHead.textContent = 'Boss';
  const bossRoot = document.createElement('div');
  container.append(scenesHead, scenesRoot, bossHead, bossRoot);
  scenes.renderScenesList(scenesRoot, track);
  boss.renderBossList(bossRoot, track);
}
