import { store } from './state.js';
import { loadAllChunks } from './content.js';
import * as session from './session.js';
import { readinessStats, weakestFirst } from './readiness.js';

let planCache = null;
let countdownTimer = null;

export async function loadPlan(){
  if (planCache) return planCache;
  const res = await fetch('content/bootcamp.json', { cache: 'no-store' });
  if (!res.ok) throw new Error('Nie udało się wczytać planu 55H.');
  planCache = await res.json();
  return planCache;
}

export function countdown(deadline){
  const ms = Math.max(0, new Date(deadline) - new Date());
  const totalHours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return `${totalHours}H ${String(minutes).padStart(2, '0')}M`;
}

function blockStatus(block, cards){
  const stats = readinessStats(block.ids, cards);
  return { ...stats, learned: stats.learning + stats.mastered, done: stats.mastered === stats.total };
}

function slotDate(slot, deadline){
  const match = String(slot).match(/(\d{2})\.(\d{2})\s*·\s*(\d{2}):(\d{2})/);
  if (!match) return null;
  const year = new Date(deadline).getFullYear();
  return new Date(year, Number(match[2]) - 1, Number(match[1]), Number(match[3]), Number(match[4]));
}

export function activeBlockIndex(plan, cards, now = new Date()){
  const pending = plan.blocks.map((block, i) => ({ i, status: blockStatus(block, cards), at: slotDate(block.slot, plan.deadline) }))
    .filter(item => !item.status.done);
  if (!pending.length) return plan.blocks.length - 1;
  const overdue = pending.filter(item => !item.at || item.at <= now);
  return (overdue[0] || pending[0]).i;
}

export async function renderBootcampScreen(container){
  const [plan, ctx] = await Promise.all([loadPlan(), loadAllChunks()]);
  const chunks = ctx.chunks;
  const cards = store.get().cards || {};
  const uniqueIds = [...new Set(plan.blocks.flatMap(b => b.ids))].filter(id => chunks.has(id));
  const overall = readinessStats(uniqueIds, cards);
  const activeIndex = activeBlockIndex(plan, cards);
  container.innerHTML = '';

  const hero = document.createElement('div');
  hero.className = 'bootcamp-hero frame';
  const clock = document.createElement('div');
  clock.className = 'bootcamp-clock';
  const paintClock = () => { clock.textContent = countdown(plan.deadline); };
  paintClock();
  if (countdownTimer) clearInterval(countdownTimer);
  countdownTimer = setInterval(paintClock, 30000);
  const title = document.createElement('h2');
  title.textContent = plan.title;
  const sub = document.createElement('p');
  sub.textContent = plan.subtitle;
  const rule = document.createElement('div');
  rule.className = 'bootcamp-rule';
  rule.textContent = plan.rule;
  const progress = document.createElement('div');
  progress.className = 'bootcamp-progress';
  progress.innerHTML = `<span><b>${overall.mastered}</b> opanowanych · ${overall.learning} w nauce</span><span>${overall.pct}%</span>`;
  const bar = document.createElement('div');
  bar.className = 'mini-bar';
  const fill = document.createElement('div');
  fill.style.width = `${overall.pct}%`;
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
    const scheduled = slotDate(block.slot, plan.deadline);
    const timing = i === activeIndex && scheduled && scheduled < new Date() ? 'ZALEGŁE · ZRÓB TERAZ' : block.slot;
    meta.textContent = `${timing}  ·  ${block.duration}`;
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
    stat.textContent = `${status.mastered} umiem · ${status.learning} uczę się · ${status.unseen} nowych`;
    const btn = document.createElement('button');
    btn.className = i === activeIndex ? 'btn btn-primary btn-lg' : 'btn btn-outline';
    btn.textContent = status.done ? 'POWTÓRZ BLOK' : (i === activeIndex ? 'ĆWICZ TERAZ' : 'ĆWICZ BLOK');
    btn.addEventListener('click', () => {
      const valid = weakestFirst(block.ids.filter(id => chunks.has(id)), store.get().cards || {});
      session.startFocusedSession(valid, { limit: valid.length });
    });
    body.append(meta, heading, goal, native, mission, stat, btn);
    card.append(rail, body);
    container.appendChild(card);
  });
}
