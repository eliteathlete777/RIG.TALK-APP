// RIG TALK — plany.js: zakładka PLANY (rysunki z PDF-ów SQM) i podgląd pełnoekranowy z powiększaniem.
// Dane: content/plany.json. Link do planu z dowolnego rozdziału: planLinks(ids).

let cache = null;

async function loadPlany(){
  if (cache) return cache;
  const response = await fetch('content/plany.json', { cache: 'no-store' });
  if (!response.ok) throw new Error(`plany.json: HTTP ${response.status}`);
  cache = await response.json();
  return cache;
}

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

/** Pełnoekranowy podgląd. `list` to kolejność do przewijania ← →. */
export function openPlan(list, startId){
  let index = Math.max(0, list.findIndex(p => p.id === startId));
  let zoom = 1;
  const overlay = el('div', 'plan-view');
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-label', 'Podgląd planu');
  const bar = el('div', 'plan-bar');
  const title = el('div', 'plan-title');
  const close = el('button', 'btn plan-btn', '✕ Zamknij');
  const stage = el('div', 'plan-stage');
  const img = el('img', 'plan-img');
  img.alt = '';
  stage.appendChild(img);
  const tools = el('div', 'plan-tools');
  const mk = (label, fn, aria) => { const b = el('button', 'btn plan-btn', label); b.setAttribute('aria-label', aria || label); b.addEventListener('click', fn); tools.appendChild(b); return b; };
  const setZoom = (z) => { zoom = Math.min(5, Math.max(1, z)); img.style.width = (zoom * 100) + '%'; zoomLabel.textContent = Math.round(zoom * 100) + '%'; };
  mk('◀', () => show(index - 1), 'Poprzedni plan');
  mk('−', () => setZoom(zoom - 0.5), 'Pomniejsz');
  const zoomLabel = el('span', 'plan-zoom', '100%');
  tools.appendChild(zoomLabel);
  mk('+', () => setZoom(zoom + 0.5), 'Powiększ');
  mk('▶', () => show(index + 1), 'Następny plan');
  const desc = el('div', 'plan-desc');
  bar.append(title, close);
  overlay.append(bar, stage, desc, tools);
  function show(i){
    index = (i + list.length) % list.length;
    const p = list[index];
    img.src = p.full;
    img.alt = p.title;
    title.textContent = `${p.title} (${index + 1}/${list.length})`;
    desc.textContent = `${p.desc} · ${p.src}`;
    setZoom(1);
    stage.scrollTo(0, 0);
  }
  const onKey = (e) => { if (e.key === 'Escape') done(); if (e.key === 'ArrowRight') show(index + 1); if (e.key === 'ArrowLeft') show(index - 1); };
  function done(){ overlay.remove(); document.removeEventListener('keydown', onKey); document.body.classList.remove('plan-open'); }
  close.addEventListener('click', done);
  stage.addEventListener('dblclick', () => setZoom(zoom === 1 ? 2.5 : 1));
  document.addEventListener('keydown', onKey);
  document.body.classList.add('plan-open');
  document.body.appendChild(overlay);
  show(index);
}

/** Przyciski „Zobacz plan” dla listy identyfikatorów. */
export async function planLinks(ids){
  if (!ids?.length) return null;
  const data = await loadPlany();
  const byId = new Map(data.items.map(p => [p.id, p]));
  const list = ids.map(id => byId.get(id)).filter(Boolean);
  if (!list.length) return null;
  const box = el('div', 'card plan-links');
  box.appendChild(el('h3', 'mz-h', 'PLANY DO TEGO ROZDZIAŁU'));
  const row = el('div', 'plan-link-row');
  list.forEach(plan => {
    const b = el('button', 'plan-link');
    b.dataset.plan = plan.id;
    const t = el('img'); t.src = plan.thumb; t.alt = ''; t.loading = 'lazy';
    b.append(t, el('span', '', plan.title));
    b.addEventListener('click', () => openPlan(list, plan.id));
    row.appendChild(b);
  });
  box.appendChild(row);
  return box;
}

export async function renderPlany(container, intro){
  const data = await loadPlany();
  container.appendChild(el('p', 'muted-sm', intro || ''));
  data.groups.forEach(([key, label]) => {
    const items = data.items.filter(p => p.tag === key);
    if (!items.length) return;
    container.appendChild(el('h3', 'mz-h', label.toUpperCase()));
    const grid = el('div', 'plan-grid');
    items.forEach(plan => {
      const card = el('button', 'plan-card');
      card.dataset.plan = plan.id;
      const t = el('img'); t.src = plan.thumb; t.alt = ''; t.loading = 'lazy';
      card.append(t, el('b', '', plan.title), el('small', '', plan.desc));
      card.addEventListener('click', () => openPlan(data.items, plan.id));
      grid.appendChild(card);
    });
    container.appendChild(grid);
  });
}
