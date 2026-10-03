import { store } from './state.js';
import { loadAllChunks } from './content.js';
import * as session from './session.js';

let planCache = null;

async function loadPlan(){
  if (planCache) return planCache;
  const res = await fetch('content/bootcamp.json', { cache: 'no-store' });
  if (!res.ok) throw new Error('Nie udało się wczytać planu 55H.');
  planCache = await res.json();
  return planCache;
}

function countdown(deadline){
  const ms = Math.max(0, new Date(deadline) - new Date());
  const totalHours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return `${totalHours}H ${String(minutes).padStart(2, '0')}M`;
}

function blockStatus(block, cards){
  const learned = block.ids.filter(id => id in cards).length;
  return { learned, total: block.ids.length, done: learned === block.ids.length };
}

export async function renderBootcampScreen(container){
  const [plan, ctx] = await Promise.all([loadPlan(), loadAllChunks()]);
  const chunks = ctx.chunks;
  const cards = store.get().cards || {};
  const uniqueIds = [...new Set(plan.blocks.flatMap(b => b.ids))].filter(id => chunks.has(id));
  const learnedTotal = uniqueIds.filter(id => id in cards).length;
  const firstPending = plan.blocks.findIndex(b => !blockStatus(b, cards).done);
  const activeIndex = firstPending === -1 ? plan.blocks.length - 1 : firstPending;
  container.innerHTML = '';

  const hero = document.createElement('div');
  hero.className = 'bootcamp-hero frame';
  const clock = document.createElement('div');
  clock.className = 'bootcamp-clock';
  clock.textContent = countdown(plan.deadline);
  const title = document.createElement('h2');
  title.textContent = plan.title;
  const sub = document.createElement('p');
  sub.textContent = plan.subtitle;
  const rule = document.createElement('div');
  rule.className = 'bootcamp-rule';
  rule.textContent = plan.rule;
  const progress = document.createElement('div');
  progress.className = 'bootcamp-progress';
  progress.innerHTML = `<span><b>${learnedTotal}</b> / ${uniqueIds.length} zwrotów uruchomionych</span><span>${Math.round(learnedTotal / uniqueIds.length * 100)}%</span>`;
  const bar = document.createElement('div');
  bar.className = 'mini-bar';
  const fill = document.createElement('div');
  fill.style.width = `${Math.round(learnedTotal / uniqueIds.length * 100)}%`;
  bar.appendChild(fill);
  hero.append(clock, title, sub, rule, progress, bar);
  container.appendChild(hero);

  plan.blocks.forEach((block, i) => {
    const status = blockStatus(block, cards);
    const card = document.createElement('article');
    card.className = 'bootcamp-block' + (i === activeIndex ? ' active' : '') + (status.done ? ' done' : '');

    const rail = document.createElement('div');
    rail.className = 'bootcamp-rail';
    const marker = document.createElement('span');
    marker.className = 'bootcamp-marker';
    marker.textContent = status.done ? '✓' : String(i + 1);
    rail.appendChild(marker);

    const body = document.createElement('div');
    body.className = 'bootcamp-body';
    const meta = document.createElement('div');
    meta.className = 'bootcamp-meta';
    meta.textContent = `${block.slot}  ·  ${block.duration}`;
    const heading = document.createElement('h3');
    heading.textContent = block.title;
    const goal = document.createElement('p');
    goal.className = 'bootcamp-goal';
    goal.textContent = block.goal;
    const native = document.createElement('div');
    native.className = 'bootcamp-native';
    native.textContent = block.native_note;
    const mission = document.createElement('div');
    mission.className = 'bootcamp-mission';
    mission.textContent = block.mission;
    const stat = document.createElement('div');
    stat.className = 'bootcamp-block-stat';
    stat.textContent = `${status.learned}/${status.total} zwrotów`;
    const btn = document.createElement('button');
    btn.className = i === activeIndex ? 'btn btn-primary btn-lg' : 'btn btn-outline';
    btn.textContent = status.done ? 'POWTÓRZ BLOK' : (i === activeIndex ? 'ĆWICZ TERAZ' : 'ĆWICZ BLOK');
    btn.addEventListener('click', () => {
      const valid = block.ids.filter(id => chunks.has(id));
      session.startFocusedSession(valid, { limit: valid.length });
    });
    body.append(meta, heading, goal, native, mission, stat, btn);
    card.append(rail, body);
    container.appendChild(card);
  });
}
