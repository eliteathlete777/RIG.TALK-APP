// RIG TALK — stoisko.js: PIERWSZE STOISKO — przebieg montażu etapami, zwroty A (klient) / B (rigger),
// co usłyszysz, checklista i słowa kluczowe. Zwroty żyją w content/tech/t7.json (moduł T7), więc wchodzą też do SRS.

import { store } from './state.js';
import { loadAllChunks, allChunksArray } from './content.js';
import { toggleStar, deleteChunkForever } from './library.js';
import { loadGlossary, termRow, speakEn } from './glossary.js';
import * as session from './session.js';
import { renderMx30Guide } from './mx30-guide.js';
import { renderMontazHub, registerHub } from './montaz.js';

let metaCache = null;

async function loadMeta(){
  if (metaCache) return metaCache;
  const res = await fetch('content/stoisko.json', { cache: 'no-store' });
  metaCache = await res.json();
  return metaCache;
}

const SIDE_LABEL = { client: 'A · KLIENT', crew: 'B · RIGGER', hall: 'HALA', solo: 'TY PRZY PROCESORZE' };
const SIDE_ORDER = ['client', 'crew', 'hall', 'solo'];

function sideOf(chunk){
  return SIDE_ORDER.find(s => chunk.tags?.includes(s)) || 'solo';
}

function getChecks(){ return store.get().stoisko?.checks || {}; }

function stageProgress(stage){
  const checks = getChecks();
  const done = stage.checklist.filter((_, i) => checks[`${stage.unit}-${i}`]).length;
  return { done, total: stage.checklist.length };
}

function isStarred(id){ return (store.get().starred || []).includes(id); }

/** Pełny ekran z dużym tekstem — do pokazania riggerowi/klientowi. */
export function showBig(en, pl){
  const ov = document.createElement('div');
  ov.className = 'show-overlay';
  const big = document.createElement('div');
  big.className = 'show-en';
  big.textContent = en;
  const small = document.createElement('div');
  small.className = 'show-pl';
  small.textContent = pl || '';
  const hint = document.createElement('div');
  hint.className = 'show-hint';
  hint.textContent = 'Dotknij, aby zamknąć';
  ov.append(big, small, hint);
  ov.addEventListener('click', () => ov.remove());
  document.body.appendChild(ov);
}

function phraseRow(chunk, rerender){
  const row = document.createElement('div');
  row.className = 'phrase-row' + (chunk.type === 'HEAR' ? ' hear' : '');

  const txt = document.createElement('div');
  txt.className = 'phrase-txt';
  const en = document.createElement('div');
  en.className = 'phrase-en';
  en.textContent = chunk.type === 'HEAR' ? `„${chunk.en}”` : chunk.en;
  const pl = document.createElement('div');
  pl.className = 'phrase-pl';
  pl.textContent = chunk.pl;
  txt.append(en, pl);
  if (chunk.type === 'HEAR' && chunk.reply){
    const reply = document.createElement('div');
    reply.className = 'phrase-reply';
    reply.textContent = '↳ Ty: ' + chunk.reply;
    txt.appendChild(reply);
  }
  if (chunk.variants?.us && chunk.variants.us !== chunk.en){
    const v = document.createElement('div');
    v.className = 'phrase-hint';
    v.textContent = 'US: ' + chunk.variants.us;
    txt.appendChild(v);
  }
  if (chunk.hint_pl){
    const hint = document.createElement('div');
    hint.className = 'phrase-hint';
    hint.textContent = chunk.hint_pl;
    hint.hidden = true;
    txt.appendChild(hint);
    txt.addEventListener('click', () => { hint.hidden = !hint.hidden; });
  }

  const actions = document.createElement('div');
  actions.className = 'phrase-actions';
  const speakBtn = document.createElement('button');
  speakBtn.className = 'icon-box sm';
  speakBtn.textContent = '🔊';
  speakBtn.setAttribute('aria-label', 'Posłuchaj');
  speakBtn.addEventListener('click', () => speakEn(chunk.en));
  const bigBtn = document.createElement('button');
  bigBtn.className = 'icon-box sm';
  bigBtn.textContent = '⤢';
  bigBtn.setAttribute('aria-label', 'Pokaż duży tekst');
  bigBtn.addEventListener('click', () => showBig(chunk.type === 'HEAR' ? chunk.reply : chunk.en, chunk.type === 'HEAR' ? '' : chunk.pl));
  const starBtn = document.createElement('button');
  starBtn.className = 'icon-box sm' + (isStarred(chunk.id) ? ' on' : '');
  starBtn.textContent = isStarred(chunk.id) ? '★' : '☆';
  starBtn.setAttribute('aria-label', 'Do ściągi');
  starBtn.addEventListener('click', () => { toggleStar(chunk.id); rerender(); });
  const hideBtn = document.createElement('button');
  hideBtn.className = 'icon-box sm item-hide';
  hideBtn.textContent = '×';
  hideBtn.setAttribute('aria-label', 'Ukryj globalnie: ' + chunk.en);
  hideBtn.addEventListener('click', () => { deleteChunkForever(chunk.id); row.remove(); });
  actions.append(speakBtn, bigBtn, starBtn, hideBtn);

  row.append(txt, actions);
  return row;
}

export async function renderStoiskoScreen(container){
  const stored = store.get().ui?.stoiskoMode;
  const mode = stored === 'mx30' ? 'mx30' : stored === 'stages' ? 'stages' : 'hub';
  container.innerHTML = '';
  registerHub({ rerender: () => renderStoiskoScreen(container) });
  const go = (next) => { store.set({ ui: { stoiskoMode: next, montazChapter: null } }); renderStoiskoScreen(container); window.scrollTo(0, 0); };
  if (mode === 'hub'){
    await renderMontazHub(container, { openStages: () => go('stages'), openMx30: () => go('mx30'), rerender: () => renderStoiskoScreen(container) });
    return;
  }
  const back = document.createElement('button');
  back.className = 'btn mz-back';
  back.textContent = '← Wybór rozdziału';
  back.addEventListener('click', () => go('hub'));
  container.appendChild(back);
  if (mode === 'mx30'){
    await renderMx30Guide(container);
    return;
  }
  const [meta, ctx, glossary] = await Promise.all([loadMeta(), loadAllChunks(), loadGlossary()]);
  const termsByEn = new Map(glossary.terms.map(t => [t.en, t]));
  const deleted = new Set(store.get().deleted || []);
  const t7 = allChunksArray(ctx).filter(c => c.module === 'T7' && !deleted.has(c.id));
  const ui = store.get().stoisko || {};
  const scrollY = window.scrollY;
  const rerender = () => renderStoiskoScreen(container);

  // ---------- nagłówek misji ----------
  const totals = meta.stages.reduce((acc, st) => {
    const p = stageProgress(st);
    acc.done += p.done; acc.total += p.total;
    if (p.done === p.total) acc.stagesDone++;
    return acc;
  }, { done: 0, total: 0, stagesDone: 0 });

  const hero = document.createElement('div');
  hero.className = 'frame hero';
  hero.innerHTML = `
    <div class="eyebrow">MISJA · PARYŻ</div>
    <h2 class="hero-title">${meta.title}</h2>
    <div class="hero-sub">${meta.subtitle}</div>
    <p class="hero-scope">${meta.scope_pl}</p>
    <div class="xp-row" style="margin:12px 0 4px 0;">
      <div class="xp-bar"><div class="xp-bar-fill" style="width:${Math.round(totals.done / totals.total * 100)}%"></div></div>
      <span class="muted-sm">${totals.stagesDone}/${meta.stages.length} etapów</span>
    </div>`;
  const drillAll = document.createElement('button');
  drillAll.className = 'btn btn-primary btn-lg';
  drillAll.style.marginTop = '10px';
  drillAll.textContent = `Ćwicz zwroty montażu (${t7.length})`;
  drillAll.addEventListener('click', () => session.startFocusedSession(t7.map(c => c.id)));
  hero.appendChild(drillAll);
  container.appendChild(hero);

  // ---------- etapy ----------
  meta.stages.forEach(stage => {
    const chunks = t7.filter(c => c.unit === stage.unit);
    const p = stageProgress(stage);
    const open = ui.open === stage.unit;

    const card = document.createElement('div');
    card.className = 'stage-card' + (open ? ' open' : '') + (p.done === p.total ? ' done' : '');

    const head = document.createElement('button');
    head.className = 'stage-head';
    head.innerHTML = `
      <span class="stage-num">${p.done === p.total ? '✓' : stage.unit}</span>
      <span class="stage-titles"><span class="stage-title">${stage.title}</span><span class="stage-en">${stage.en} · ${chunks.length} zwrotów</span></span>
      <span class="stage-count">${p.done}/${p.total}</span>`;
    head.addEventListener('click', () => {
      store.set({ stoisko: { open: open ? null : stage.unit } });
      rerender();
    });
    card.appendChild(head);

    if (open){
      const body = document.createElement('div');
      body.className = 'stage-body';

      const goal = document.createElement('p');
      goal.className = 'stage-goal';
      goal.textContent = stage.goal_pl;
      body.appendChild(goal);

      // zakładki: strony rozmowy + usłyszysz + lista + słowa
      const sides = SIDE_ORDER.filter(s => chunks.some(c => c.type === 'SAY' && sideOf(c) === s));
      const tabs = [
        ...sides.map(s => [s, SIDE_LABEL[s]]),
        ['hear', 'USŁYSZYSZ'],
        ['check', 'LISTA'],
        ['terms', 'SŁOWA'],
      ];
      const tabState = ui.tab?.[stage.unit];
      const active = tabs.some(([k]) => k === tabState) ? tabState : tabs[0][0];

      const tabBar = document.createElement('div');
      tabBar.className = 'chips';
      tabs.forEach(([key, label]) => {
        const b = document.createElement('button');
        b.className = 'chip' + (key === active ? ' active' : '');
        b.textContent = label;
        b.addEventListener('click', () => { store.set({ stoisko: { tab: { [stage.unit]: key } } }); rerender(); });
        tabBar.appendChild(b);
      });
      body.appendChild(tabBar);

      const panel = document.createElement('div');
      if (active === 'hear'){
        chunks.filter(c => c.type === 'HEAR').forEach(c => panel.appendChild(phraseRow(c, rerender)));
      } else if (active === 'check'){
        const checks = getChecks();
        stage.checklist.forEach((item, i) => {
          const key = `${stage.unit}-${i}`;
          const lab = document.createElement('label');
          lab.className = 'check-row' + (checks[key] ? ' on' : '');
          const cb = document.createElement('input');
          cb.type = 'checkbox';
          cb.checked = !!checks[key];
          cb.addEventListener('change', () => { store.set({ stoisko: { checks: { [key]: cb.checked } } }); rerender(); });
          const span = document.createElement('span');
          span.textContent = item;
          lab.append(cb, span);
          panel.appendChild(lab);
        });
      } else if (active === 'terms'){
        stage.terms.map(t => termsByEn.get(t)).filter(Boolean).forEach(t => panel.appendChild(termRow(t)));
      } else {
        chunks.filter(c => c.type === 'SAY' && sideOf(c) === active).forEach(c => panel.appendChild(phraseRow(c, rerender)));
      }
      body.appendChild(panel);

      if (stage.tip_pl){
        const tip = document.createElement('div');
        tip.className = 'tip';
        tip.innerHTML = '<b>WSKAZÓWKA</b>';
        const t = document.createElement('div');
        t.textContent = stage.tip_pl;
        tip.appendChild(t);
        body.appendChild(tip);
      }

      const drill = document.createElement('button');
      drill.className = 'btn btn-outline';
      drill.style.width = '100%';
      drill.textContent = `Ćwicz etap ${stage.unit} (${chunks.length} zwrotów)`;
      drill.addEventListener('click', () => session.startFocusedSession(chunks.map(c => c.id), { limit: chunks.length }));
      body.appendChild(drill);

      card.appendChild(body);
    }
    container.appendChild(card);
  });

  const reset = document.createElement('button');
  reset.className = 'btn btn-ghost';
  reset.style.cssText = 'width:100%; margin-top:6px;';
  reset.textContent = 'Wyczyść checklisty (nowe stoisko)';
  reset.addEventListener('click', () => {
    if (!confirm('Wyczyścić wszystkie odhaczone punkty?')) return;
    const s = store.get();
    store.state = { ...s, stoisko: { ...(s.stoisko || {}), checks: {} } };
    store.set({});
    rerender();
  });
  container.appendChild(reset);

  window.scrollTo(0, scrollY);
}
