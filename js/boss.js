// RIG TALK — boss.js: Boss Fight (PLAN.md §5.5)

import { store } from './state.js';
import * as speech from './speech.js';
import * as game from './game.js';

let bossesCache = null;

async function fetchJson(path){
  const res = await fetch(path, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Nie udało się wczytać ${path}: HTTP ${res.status}`);
  return res.json();
}

export async function loadBosses(){
  if (bossesCache) return bossesCache;
  const index = await fetchJson('content/bosses/index.json');
  bossesCache = await Promise.all(index.bosses.map(f => fetchJson(`content/bosses/${f}`)));
  return bossesCache;
}

function lang(){ return store.get().settings.variant === 'us' ? 'en-US' : 'en-GB'; }
function playLine(en){ return speech.speak(en, { lang: lang(), rate: 1.0 }).catch(() => {}); }

export async function renderBossList(container, trackFilter = null){
  const bosses = await loadBosses();
  container.innerHTML = '';
  const filtered = trackFilter ? bosses.filter(b => b.track === trackFilter) : bosses;
  filtered.forEach(boss => {
    const tile = document.createElement('button');
    tile.className = 'card';
    tile.style.cssText = 'width:100%; text-align:left; display:flex; justify-content:space-between; align-items:center; border-color:var(--red);';
    const label = document.createElement('span');
    label.style.cssText = 'font-family:var(--font-display); font-size:16px; color:var(--red);';
    label.textContent = '⚔ ' + boss.name;
    const won = (store.get().bossesWon || []).includes(boss.id);
    const meta = document.createElement('span');
    meta.style.cssText = 'color:var(--dim); font-size:12px;';
    meta.textContent = won ? 'Pokonany ✔' : boss.module;
    tile.appendChild(label);
    tile.appendChild(meta);
    tile.addEventListener('click', () => openBossFight(boss, container));
    container.appendChild(tile);
  });
}

export function openBossFight(boss, container){
  let patience = boss.patience;
  let roundIndex = 0;
  let finished = false;

  container.innerHTML = '';

  const backBtn = document.createElement('button');
  backBtn.className = 'btn';
  backBtn.textContent = '← Wszyscy bossowie';
  backBtn.addEventListener('click', () => renderBossList(container, null));
  container.appendChild(backBtn);

  const title = document.createElement('h3');
  title.style.margin = '14px 0 4px 0';
  title.style.color = 'var(--red)';
  title.textContent = '⚔ ' + boss.name;
  container.appendChild(title);

  const intro = document.createElement('div');
  intro.style.cssText = 'color:var(--dim); font-size:13px; margin-bottom:12px;';
  intro.textContent = boss.intro_pl || '';
  container.appendChild(intro);

  const patienceWrap = document.createElement('div');
  patienceWrap.className = 'xp-row';
  const patienceBar = document.createElement('div');
  patienceBar.className = 'xp-bar';
  patienceBar.setAttribute('data-testid', 'patience-bar');
  const patienceFill = document.createElement('div');
  patienceFill.className = 'xp-bar-fill';
  patienceFill.setAttribute('data-testid', 'patience-fill');
  patienceBar.appendChild(patienceFill);
  const patienceLabel = document.createElement('span');
  patienceLabel.style.cssText = 'font-size:12px; color:var(--dim);';
  patienceWrap.appendChild(patienceBar);
  patienceWrap.appendChild(patienceLabel);
  container.appendChild(patienceWrap);

  const body = document.createElement('div');
  container.appendChild(body);

  function updatePatienceBar(){
    const pct = Math.max(0, Math.min(100, patience));
    patienceFill.style.width = pct + '%';
    patienceFill.style.background = pct >= 70 ? 'var(--red)' : (pct <= 20 ? 'var(--ok)' : 'var(--red)');
    patienceLabel.textContent = `Cierpliwość: ${pct}/100`;
  }

  function render(){
    updatePatienceBar();
    body.innerHTML = '';

    if (finished) return;

    if (patience <= 0){ finished = true; return renderResult(true); }
    if (patience >= 100){ finished = true; return renderResult(false); }
    if (roundIndex >= boss.rounds.length){ finished = true; return renderResult(patience < 50); }

    const round = boss.rounds[roundIndex];
    const card = document.createElement('div');
    card.className = 'card';
    const other = document.createElement('div');
    other.style.cssText = 'font-family:var(--font-display); font-size:18px; margin-bottom:4px;';
    other.textContent = round.other_en;
    const otherPl = document.createElement('div');
    otherPl.style.cssText = 'color:var(--dim); font-size:13px; margin-bottom:14px;';
    otherPl.textContent = round.other_pl;
    card.appendChild(other);
    card.appendChild(otherPl);
    playLine(round.other_en);

    round.answers.forEach(answer => {
      const b = document.createElement('button');
      b.className = 'btn';
      b.style.cssText = 'width:100%; margin-bottom:8px; text-align:left; justify-content:flex-start;';
      b.textContent = answer.en;
      b.addEventListener('click', () => pickAnswer(answer, card));
      card.appendChild(b);
    });

    body.appendChild(card);
  }

  function pickAnswer(answer, card){
    patience = Math.max(0, Math.min(100, patience + answer.effect));
    card.querySelectorAll('button').forEach(b => b.disabled = true);
    if (answer.why_pl){
      const why = document.createElement('div');
      why.style.cssText = 'color:var(--dim); font-size:13px; margin:8px 0;';
      why.textContent = (answer.effect < 0 ? '✔ ' : '✖ ') + answer.why_pl;
      card.appendChild(why);
    }
    updatePatienceBar();
    const nextBtn = document.createElement('button');
    nextBtn.className = 'btn btn-primary btn-lg';
    nextBtn.textContent = 'Dalej';
    nextBtn.addEventListener('click', () => { roundIndex++; render(); });
    card.appendChild(nextBtn);
  }

  function renderResult(won){
    body.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'card';
    const title2 = document.createElement('h2');
    title2.style.color = won ? 'var(--ok)' : 'var(--red)';
    title2.textContent = won ? 'WYGRANA.' : 'PRZEGRANA.';
    card.appendChild(title2);

    if (won){
      const outcome = game.applyBossWin(boss.id);
      const info = document.createElement('div');
      info.style.cssText = 'color:var(--dim); font-size:14px; line-height:1.8; margin:8px 0 14px 0;';
      info.textContent = outcome.alreadyWon
        ? 'Boss już wcześniej pokonany (bez dodatkowego XP).'
        : `+${outcome.xpGained} XP · LVL ${outcome.level}`;
      card.appendChild(info);
      if (outcome.rankChanged) game.showPromotionOverlay(outcome.rank);
    } else {
      const info = document.createElement('div');
      info.style.cssText = 'color:var(--dim); font-size:14px; margin:8px 0 14px 0;';
      info.textContent = 'Klient stracił cierpliwość. Spróbuj jeszcze raz.';
      card.appendChild(info);
    }

    const retryBtn = document.createElement('button');
    retryBtn.className = 'btn btn-primary btn-lg';
    retryBtn.textContent = won ? 'Wróć do listy' : 'Spróbuj ponownie';
    retryBtn.addEventListener('click', () => {
      if (won) renderBossList(container, null);
      else openBossFight(boss, container);
    });
    card.appendChild(retryBtn);
    body.appendChild(card);
  }

  render();
}
