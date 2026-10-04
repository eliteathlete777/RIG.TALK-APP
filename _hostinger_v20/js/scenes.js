// RIG TALK — scenes.js: SCENY (dialogi), tryby Słuchaj / Graj rolę (PLAN.md §5.4) — dodatek, nie główny tryb nauki

import { store } from './state.js';
import * as speech from './speech.js';

let scenesCache = null;

async function fetchJson(path){
  const res = await fetch(path, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Nie udało się wczytać ${path}: HTTP ${res.status}`);
  return res.json();
}

export async function loadScenes(){
  if (scenesCache) return scenesCache;
  const index = await fetchJson('content/scenes/index.json');
  const scenes = await Promise.all(index.scenes.map(f => fetchJson(`content/scenes/${f}`)));
  scenesCache = scenes;
  return scenes;
}

function lang(){
  return store.get().settings.variant === 'us' ? 'en-US' : 'en-GB';
}

function playLine(en){
  return speech.speak(en, { lang: lang(), rate: 1.0 }).catch(() => {});
}

/** Lista scen (kafle) w kontenerze; klik otwiera odtwarzacz. */
export async function renderScenesList(container, trackFilter = null){
  const scenes = await loadScenes();
  container.innerHTML = '';
  const filtered = trackFilter ? scenes.filter(s => s.track === trackFilter) : scenes;
  filtered.forEach(scene => {
    const tile = document.createElement('button');
    tile.className = 'card';
    tile.style.cssText = 'width:100%; text-align:left; display:flex; justify-content:space-between; align-items:center;';
    const label = document.createElement('span');
    label.style.cssText = 'font-family:var(--font-display); font-size:16px;';
    label.textContent = scene.title;
    const meta = document.createElement('span');
    meta.style.cssText = 'color:var(--dim); font-size:12px;';
    meta.textContent = `${scene.module} · ${scene.lines.length} linii`;
    tile.appendChild(label);
    tile.appendChild(meta);
    tile.addEventListener('click', () => openScenePlayer(scene, container));
    container.appendChild(tile);
  });
}

/**
 * Otwiera odtwarzacz sceny w danym kontenerze.
 * Tryby: 'listen' (Słuchaj), 'read' (Czytaj z lektorem), 'role' (Graj rolę — linie "me" ukryte do odsłony).
 */
export function openScenePlayer(scene, container){
  let mode = 'listen';
  let lineIndex = 0;
  const revealed = new Set(); // indeksy odsłoniętych linii "me" w trybie 'role'

  container.innerHTML = '';

  const backBtn = document.createElement('button');
  backBtn.className = 'btn';
  backBtn.textContent = '← Wszystkie sceny';
  backBtn.addEventListener('click', () => renderScenesList(container, null));
  container.appendChild(backBtn);

  const title = document.createElement('h3');
  title.style.margin = '14px 0 8px 0';
  title.textContent = scene.title;
  container.appendChild(title);

  const modeRow = document.createElement('div');
  modeRow.className = 'track-switch';
  modeRow.style.marginBottom = '14px';
  const modeButtons = {};
  [['listen', 'Słuchaj'], ['role', 'Graj rolę']].forEach(([key, label]) => {
    const b = document.createElement('button');
    b.textContent = label;
    b.classList.toggle('active', mode === key);
    b.addEventListener('click', () => { mode = key; lineIndex = 0; revealed.clear(); render(); });
    modeRow.appendChild(b);
    modeButtons[key] = b;
  });
  container.appendChild(modeRow);

  const transcript = document.createElement('div');
  container.appendChild(transcript);

  const controls = document.createElement('div');
  controls.style.marginTop = '14px';
  container.appendChild(controls);

  function lineRow(line, idx, opts = {}){
    const row = document.createElement('div');
    row.className = 'card';
    row.dataset.lineIndex = String(idx);
    row.dataset.who = line.who;
    row.style.cssText = 'display:flex; align-items:flex-start; gap:10px;' + (line.who === 'me' ? ' border-color:var(--red);' : '');

    const who = document.createElement('div');
    who.style.cssText = 'font-size:11px; color:var(--dim); text-transform:uppercase; min-width:44px;';
    who.textContent = line.who === 'me' ? 'Ty' : 'Rozmówca';
    row.appendChild(who);

    const body = document.createElement('div');
    body.style.flex = '1';

    if (opts.hidden){
      // Wymóg trybu "Graj rolę": treść "me" NIE trafia do DOM, dopóki nie zostanie odsłonięta.
      const lock = document.createElement('div');
      lock.className = 'scene-line-hidden';
      lock.style.cssText = 'color:var(--dim); font-style:italic;';
      lock.textContent = '🔒 Twoja kwestia — powiedz ją na głos';
      body.appendChild(lock);
    } else {
      const en = document.createElement('div');
      en.style.fontWeight = '500';
      en.textContent = line.en;
      const pl = document.createElement('div');
      pl.style.cssText = 'color:var(--dim); font-size:13px;';
      pl.textContent = line.pl;
      body.appendChild(en);
      body.appendChild(pl);
    }
    row.appendChild(body);

    if (!opts.hidden){
      const speakBtn = document.createElement('button');
      speakBtn.className = 'icon-box';
      speakBtn.textContent = '🔊';
      speakBtn.addEventListener('click', () => playLine(line.en));
      row.appendChild(speakBtn);
    }
    return row;
  }

  async function autoPlayThrough(withDelay){
    for (let i = 0; i < scene.lines.length; i++){
      lineIndex = i;
      render();
      await playLine(scene.lines[i].en);
      if (withDelay) await new Promise(r => setTimeout(r, 400));
    }
  }

  function render(){
    Object.entries(modeButtons).forEach(([key, b]) => b.classList.toggle('active', mode === key));
    transcript.innerHTML = '';
    controls.innerHTML = '';

    if (mode === 'listen'){
      scene.lines.forEach((line, idx) => {
        const row = lineRow(line, idx, { hidden: false });
        if (idx === lineIndex) row.style.outline = '2px solid var(--red)';
        transcript.appendChild(row);
      });
      const playBtn = document.createElement('button');
      playBtn.className = 'btn btn-primary btn-lg';
      playBtn.textContent = '▶ Odtwórz całość';
      playBtn.addEventListener('click', () => autoPlayThrough(false));
      controls.appendChild(playBtn);
      return;
    }

    // mode === 'role': linie "me" ukryte, dopóki nie zostaną odsłonięte
    scene.lines.slice(0, lineIndex + 1).forEach((line, idx) => {
      const isHiddenMe = line.who === 'me' && !revealed.has(idx);
      const row = lineRow(line, idx, { hidden: isHiddenMe });
      if (idx === lineIndex) row.style.outline = '2px solid var(--red)';
      transcript.appendChild(row);
    });

    const current = scene.lines[lineIndex];
    if (!current){
      const doneMsg = document.createElement('div');
      doneMsg.style.cssText = 'color:var(--ok); text-align:center; margin-top:10px;';
      doneMsg.textContent = 'Scena ukończona.';
      controls.appendChild(doneMsg);
      return;
    }

    if (current.who === 'other'){
      playLine(current.en);
      const nextBtn = document.createElement('button');
      nextBtn.className = 'btn btn-primary btn-lg';
      nextBtn.textContent = 'Dalej';
      nextBtn.addEventListener('click', () => { lineIndex++; render(); });
      controls.appendChild(nextBtn);
    } else if (!revealed.has(lineIndex)){
      const micBtn = document.createElement('button');
      micBtn.className = 'btn btn-outline';
      micBtn.textContent = '🎤 Powiedz swoją kwestię';
      micBtn.addEventListener('click', async () => {
        micBtn.disabled = true;
        micBtn.textContent = 'Słucham…';
        try {
          const alts = await speech.recognizeOnce({ lang: 'en-US' });
          const score = speech.scoreTranscript(current.en, alts);
          revealed.add(lineIndex);
          render();
          const info = document.createElement('div');
          info.style.cssText = 'color:var(--dim); font-size:13px; margin-top:8px;';
          info.textContent = `Dopasowanie: ${score}%`;
          controls.appendChild(info);
        } catch (e){
          revealed.add(lineIndex);
          render();
        }
      });
      controls.appendChild(micBtn);

      const revealBtn = document.createElement('button');
      revealBtn.className = 'btn';
      revealBtn.textContent = 'Pokaż';
      revealBtn.addEventListener('click', () => { revealed.add(lineIndex); render(); });
      controls.appendChild(revealBtn);
    } else {
      const nextBtn = document.createElement('button');
      nextBtn.className = 'btn btn-primary btn-lg';
      nextBtn.textContent = 'Dalej';
      nextBtn.addEventListener('click', () => { lineIndex++; render(); });
      controls.appendChild(nextBtn);
    }
  }

  render();
}
