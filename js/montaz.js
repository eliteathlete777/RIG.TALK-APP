// RIG TALK — montaz.js: tryb MONTAŻ — szybki wybór rozdziału, rozdziały z dokumentów SQM,
// ściąga RJ45 (T568B), kalkulator pikseli/linii/zasilania, lista "co może zaskoczyć".
// Treść: content/montaz.json. Rozdział MX30 i etapy stoiska żyją w mx30-guide.js i stoisko.js.

import { store } from './state.js';
import * as speech from './speech.js';
import { planLinks, renderPlany } from './plany.js';
import { renderAz, renderWordsChapter, wordList, loadAz } from './az.js';
import { renderUklad } from './uklad.js';
import { acc, expandBar, bulletsToText, outline } from './acc.js';

let cache = null;

async function loadMontaz(){
  if (cache) return cache;
  const response = await fetch('content/montaz.json', { cache: 'no-store' });
  if (!response.ok) throw new Error(`montaz.json: HTTP ${response.status}`);
  cache = await response.json();
  return cache;
}

const trunc = (t, n = 90) => (String(t).length > n ? String(t).slice(0, n - 1).trimEnd() + '…' : String(t));
const stepText = st => (typeof st === 'string' ? st : st.pl);

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

function getChecks(){ return store.get().montaz?.checks || {}; }

function chapterProgress(data, chapter){
  if (chapter.id !== 'komplet') return null;
  const checks = getChecks();
  const items = data.komplet.items;
  const done = items.filter(item => checks['komplet-' + item.id]).length;
  return `${done}/${items.length}`;
}

function phraseBlock(phrases){
  if (!phrases?.length) return null;
  const card = el('div', 'card');
  card.appendChild(el('h3', 'mz-h', 'ZWROTY · ENGLISH'));
  phrases.forEach(phrase => {
    const row = el('div', 'mx-phrase');
    const copy = el('div');
    copy.appendChild(el('span', 'mz-en', phrase.en));
    if (phrase.ph) copy.appendChild(el('small', 'mz-ph', '[' + phrase.ph + ']'));
    copy.appendChild(el('small', '', phrase.pl));
    const play = el('button', 'icon-box sm', '🔊');
    play.setAttribute('aria-label', 'Odsłuchaj: ' + phrase.en);
    play.addEventListener('click', () => {
      speech.speak(phrase.en, { lang: store.get().settings.variant === 'us' ? 'en-US' : 'en-GB' }).catch(() => {});
    });
    row.append(copy, play);
    card.appendChild(row);
  });
  return card;
}

function warning(text){ return el('div', 'mx-warning', text); }

function stepList(steps){
  const list = el('ol', 'mz-steps');
  steps.forEach(step => {
    const li = el('li');
    if (typeof step === 'string'){ li.textContent = step; }
    else { li.appendChild(el('span', 'mz-pl-main', step.pl)); }
    list.appendChild(li);
  });
  return list;
}

// ---------- rozdziały ----------


const BLOCK_STATUS = {
  manual: '🟢 Z OFICJALNEJ INSTRUKCJI',
  calc: '🟡 WYLICZONE, POTWIERDŹ NA MIEJSCU',
  verify: '🟡 PROCEDURA OGÓLNA, POTWIERDŹ',
};

function renderBlocks(root, section){
  if (section.warning) root.appendChild(warning(section.warning));
  root.appendChild(expandBar(root));
  section.blocks.forEach((block, index) => {
    const title = block.h.includes(' · ') ? block.h.split(' · ').pop() : block.h;
    const { wrap, body } = acc(title, { open: index === 0, sub: trunc(stepText(block.steps[0])), badge: (BLOCK_STATUS[block.status] || '').replace(/^\S+\s/, '').toLowerCase(), color: block.status === 'manual' ? 'var(--ok)' : block.status === 'stop' ? 'var(--red)' : '#f2b705' });
    body.appendChild(stepList(block.steps));
    if (block.src) body.appendChild(el('small', 'mz-srcline', 'Źródło: ' + block.src));
    root.appendChild(wrap);
  });
  if (section.missing?.length){
    const { wrap, body } = acc('Czego nie mam potwierdzonego', { tone: 'bad', sub: trunc(section.missing[0]), badge: String(section.missing.length) });
    section.missing.forEach(m => body.appendChild(el('div', 'mz-miss', '• ' + m)));
    root.appendChild(wrap);
  }
  if (section.sources?.length){
    const { wrap, body } = acc('Źródła (otwórz i porównaj)', { sub: trunc(section.sources.map(x => x.t).join(' · ')), badge: String(section.sources.length) });
    section.sources.forEach(src => {
      const a = el('a', 'mz-src', src.t);
      a.href = src.url; a.target = '_blank'; a.rel = 'noopener noreferrer';
      body.appendChild(a);
    });
    root.appendChild(wrap);
  }
}

function renderFakty(root, data){
  root.appendChild(el('p', 'muted-sm', data.source_note));
  root.appendChild(expandBar(root));
  const cats = [...new Set(data.fakty.facts.map(f => f.cat))];
  cats.forEach((cat, index) => {
    const facts = data.fakty.facts.filter(f => f.cat === cat);
    const { wrap, body } = acc(cat, { open: index === 0, sub: trunc(facts.map(f => f.label).join(' · ')), badge: String(facts.length), tone: cat.startsWith('Brakuje') ? 'bad' : '' });
    const list = el('div', 'mz-facts');
    facts.forEach(fact => {
      const row = el('div', 'mz-fact ' + fact.status);
      row.appendChild(el('span', 'mz-fact-label', fact.label));
      row.appendChild(el('b', '', fact.value));
      row.appendChild(el('small', '', 'Źródło: ' + fact.src));
      list.appendChild(row);
    });
    body.appendChild(list);
    root.appendChild(wrap);
  });
}

function renderKomplet(root, data){
  const section = data.komplet;
  root.appendChild(el('p', 'muted-sm', section.intro));
  root.appendChild(expandBar(root));
  const checks = getChecks();
  const cats = [...new Set(section.items.map(i => i.cat))];
  cats.forEach((cat, index) => {
    const items = section.items.filter(i => i.cat === cat);
    const count = () => items.filter(i => getChecks()['komplet-' + i.id]).length;
    const { wrap, body } = acc(cat, { open: index === 0, sub: trunc(items.map(i => i.id.toUpperCase()).join(' · ')), badge: `${count()}/${items.length}` });
    items.forEach(item => {
      const key = 'komplet-' + item.id;
      const row = el('label', 'check-row' + (checks[key] ? ' on' : ''));
      const input = el('input');
      input.type = 'checkbox';
      input.checked = !!checks[key];
      const text = el('span', 'mz-item');
      text.appendChild(el('b', 'mz-qty', item.qty + ' ×'));
      text.appendChild(document.createTextNode(' ' + item.label));
      if (item.note) text.appendChild(el('small', '', item.note));
      input.addEventListener('change', () => {
        store.set({ montaz: { checks: { [key]: input.checked } } });
        row.classList.toggle('on', input.checked);
        wrap.querySelector('.mz-acc-b').textContent = `${count()}/${items.length}`;
      });
      row.append(input, text);
      body.appendChild(row);
    });
    root.appendChild(wrap);
  });
}

function renderSteps(root, section){
  if (section.warning) root.appendChild(warning(section.warning));
  root.appendChild(expandBar(root));
  if (section.facts){
    const { wrap, body } = acc('Co wiemy z dokumentów', { open: true, sub: trunc(section.facts[0]), badge: String(section.facts.length) });
    const ul = el('ul', 'mz-list');
    section.facts.forEach(f => ul.appendChild(el('li', '', f)));
    body.appendChild(ul);
    root.appendChild(wrap);
  }
  const steps = acc('Kroki', { open: true, sub: trunc(stepText(section.steps[0])), badge: String(section.steps.length) });
  steps.body.appendChild(stepList(section.steps));
  root.appendChild(steps.wrap);
  if (section.dont){
    const { wrap, body } = acc('Nie robisz', { tone: 'bad', sub: trunc(section.dont[0]), badge: String(section.dont.length) });
    section.dont.forEach(d => body.appendChild(el('div', 'mz-miss', '✕ ' + d)));
    root.appendChild(wrap);
  }
}

function renderRj45(root, data){
  const section = data.rj45;
  root.appendChild(warning(section.hold));
  root.appendChild(expandBar(root));
  const colors = acc('Kolory żył (T568B)', { open: true, sub: 'biało-pomarańczowy, pomarańczowy, biało-zielony, niebieski…', badge: '8 pinów' });
  const plug = el('div', 'rj-plug');
  plug.setAttribute('role', 'img');
  plug.setAttribute('aria-label', 'Kolejność żył T568B od pinu 1 do 8');
  section.pins.forEach(pin => {
    const slot = el('div', 'rj-pin');
    const wire = el('i', 'rj-wire');
    wire.style.background = pin.stripe
      ? `repeating-linear-gradient(135deg, ${pin.css} 0 5px, ${pin.stripe} 5px 9px)`
      : pin.css;
    slot.append(wire, el('b', '', String(pin.pin)));
    plug.appendChild(slot);
  });
  colors.body.appendChild(plug);
  const table = el('ol', 'rj-order');
  section.pins.forEach(pin => table.appendChild(el('li', '', pin.color)));
  colors.body.appendChild(table);
  root.appendChild(colors.wrap);
  const steps = acc('Zaciskanie krok po kroku', { sub: trunc(stepText(section.steps[0])), badge: String(section.steps.length) });
  steps.body.appendChild(stepList(section.steps));
  root.appendChild(steps.wrap);
  const notes = acc('Uwagi', { sub: trunc(section.notes[0]), badge: String(section.notes.length) });
  section.notes.forEach(note => notes.body.appendChild(el('div', 'mz-miss', note)));
  root.appendChild(notes.wrap);
}

// ---------- kalkulator ----------

export function computeCalc(v){
  const num = x => (x === '' || x === null || x === undefined ? NaN : Number(x));
  const w = num(v.w), h = num(v.h), pH = num(v.pitchH), pV = num(v.pitchV);
  const cols = Math.round(num(v.cols)), rows = Math.round(num(v.rows));
  const fps = num(v.fps), bits = num(v.bits), watt = num(v.watt), amp = num(v.amp);
  // Wzór z manuala MX30 (sekcja 11): px × 24 × fps < 0,95 × 10^9 (8 bit); 10 bit: × 48 (karty Armor)
  const portPx = Number.isFinite(fps) && fps > 0 ? Math.floor(0.95e9 / ((bits === 10 ? 48 : 24) * fps)) : num(v.portPx);
  const ok = [w, h, pH, pV, cols, rows].every(n => Number.isFinite(n) && n > 0);
  if (!ok) return { valid: false };
  const cabW = Math.round(w / pH), cabH = Math.round(h / pV);
  const cabPx = cabW * cabH;
  const cabs = cols * rows;
  const total = cabs * cabPx;
  const out = {
    valid: true, cabW, cabH, cabPx, cabs,
    wallW: cabW * cols, wallH: cabH * rows,
    wallMW: (w * cols) / 1000, wallMH: (h * rows) / 1000,
    total,
  };
  if (Number.isFinite(portPx) && portPx > 0){
    out.cabsPerPort = Math.floor(portPx / cabPx);
    out.minPorts = Math.ceil(total / portPx);
    out.portPx = portPx;
    out.colsPerPort = Math.max(0, Math.floor(out.cabsPerPort / rows));
    out.portsByColumns = out.colsPerPort > 0 ? Math.ceil(cols / out.colsPerPort) : null;
    // Swift Layout: równy podział na n portów, wielokrotność rzędów
    out.swift = null;
    for (let n = 1; n <= 10; n++){
      const per = Math.ceil(cols / n) * rows;
      if (per <= out.cabsPerPort && per % rows === 0){ out.swift = { ports: n, perPort: per, load: per * cabPx }; break; }
    }
  }
  if (Number.isFinite(watt) && watt > 0){
    out.totalKw = cabs * watt / 1000;
    out.totalA = cabs * watt / 230;
    if (Number.isFinite(amp) && amp > 0) out.circuits = Math.ceil(out.totalA / amp);
  }
  return out;
}

function renderKalkulator(root, data){
  const section = data.kalkulator;
  root.appendChild(el('p', 'muted-sm', section.intro));
  const saved = store.get().montaz?.calc || {};
  const values = { ...section.defaults, ...saved };
  const fields = [
    ['w', 'Szerokość cabinetu (mm)'], ['h', 'Wysokość cabinetu (mm)'],
    ['pitchH', 'Pitch poziomo (mm)'], ['pitchV', 'Pitch pionowo (mm)'],
    ['cols', 'Cabinety w poziomie'], ['rows', 'Cabinety w pionie'],
    ['fps', 'Odświeżanie (Hz)'], ['bits', 'Głębia (8 albo 10 bit)'], ['watt', 'Moc cabinetu (W) z karty'],
    ['amp', 'Linia zasilania (A)'],
  ];
  const grid = el('div', 'mz-calc-grid');
  const inputs = {};
  fields.forEach(([key, label]) => {
    const wrap = el('label', 'mz-field');
    wrap.appendChild(el('span', '', label));
    const input = el('input');
    input.type = 'number'; input.inputMode = 'decimal'; input.step = 'any'; input.min = '0';
    input.id = 'calc-' + key;
    input.value = values[key] === undefined ? '' : values[key];
    if (key === 'watt') input.placeholder = 'BRAK DANYCH';
    inputs[key] = input;
    wrap.appendChild(input);
    grid.appendChild(wrap);
  });
  root.appendChild(grid);
  const result = el('div', 'mz-result frame');
  root.appendChild(result);

  const paint = () => {
    const current = {};
    Object.entries(inputs).forEach(([k, i]) => { current[k] = i.value; });
    store.set({ montaz: { calc: current } });
    const r = computeCalc(current);
    result.innerHTML = '';
    if (!r.valid){ result.appendChild(el('div', 'mz-line', 'Uzupełnij wymiary, pitch i liczbę cabinetów.')); return; }
    const line = (label, value, cls) => {
      const row = el('div', 'mz-line' + (cls ? ' ' + cls : ''));
      row.append(el('span', '', label), el('b', '', value));
      result.appendChild(row);
    };
    line('Ekran', `${r.wallMW} × ${r.wallMH} m · ${r.cabs} cabinetów`);
    line('Jeden cabinet', `${r.cabW} × ${r.cabH} px (${r.cabPx.toLocaleString('pl-PL')} px)`);
    line('Cały ekran', `${r.wallW} × ${r.wallH} px`, 'big');
    line('Razem pikseli', r.total.toLocaleString('pl-PL'));
    if (r.cabsPerPort !== undefined){
      line('Limit portu', r.portPx.toLocaleString('pl-PL') + ' px');
      line('Cabinetów na port (max)', String(r.cabsPerPort));
      line('Minimum portów', String(r.minPorts));
      if (r.swift) line('Swift Layout', `${r.swift.ports} × ${r.swift.perPort} cab. (${r.swift.load.toLocaleString('pl-PL')} px na port)`);
      if (r.portsByColumns) line('Całe kolumny na port', `${r.colsPerPort} kol. → ${r.portsByColumns} portów`);
    }
    if (r.totalKw !== undefined){
      line('Moc ekranu', `${r.totalKw.toFixed(2)} kW · ${r.totalA.toFixed(1)} A przy 230 V`);
      if (r.circuits) line('Linie zasilania', `${r.circuits} × ${inputs.amp.value} A`);
    } else {
      line('Moc ekranu', 'BRAK DANYCH — wpisz moc cabinetu', 'missing');
    }
  };
  Object.values(inputs).forEach(i => i.addEventListener('input', paint));
  paint();

  const notes = el('div', 'tip');
  section.notes.forEach(n => notes.appendChild(el('div', '', n)));
  root.appendChild(notes);
}

function renderNiespodzianki(root, data){
  root.appendChild(expandBar(root));
  const items = data.niespodzianki.items;
  const cats = [...new Set(items.map(i => i.cat))];
  cats.forEach((cat, index) => {
    const list = items.filter(i => i.cat === cat);
    const { wrap, body } = acc(cat, { open: index === 0, sub: trunc(list.map(x => x.t).join(' · ')), badge: String(list.length), tone: cat === 'Laptop klienta' ? 'warn' : '' });
    list.forEach(item => {
      const card = el('div', 'mz-risk');
      card.appendChild(el('b', '', item.t));
      card.appendChild(el('p', '', item.d));
      body.appendChild(card);
    });
    root.appendChild(wrap);
  });
}

function renderParam(root, data){
  const section = data.param;
  root.appendChild(el('p', 'mz-intro', section.intro));
  const current = store.get().ui?.paramVariant === 'b' ? 'b' : 'a';
  const bar = el('div', 'mz-views');
  bar.style.gridTemplateColumns = '1fr 1fr';
  section.variants.forEach(v => {
    const b = el('button', current === v.id ? 'on' : '', v.name);
    b.dataset.variant = v.id;
    b.addEventListener('click', () => { store.set({ ui: { paramVariant: v.id } }); hubCtx.rerender(); });
    bar.appendChild(b);
  });
  root.appendChild(bar);
  const val = r => (current === 'b' && r.b && r.b !== '—') ? r.b : r.a;
  const lines = [`PARAMETRY · wariant ${current.toUpperCase()}`, ''];
  section.sections.forEach(sec => { lines.push(sec.title.toUpperCase()); sec.rows.forEach(r => { lines.push(`- ${r.w}: ${r.p} = ${val(r)}`); detailLines(r.d).forEach(l => lines.push('    ' + l)); }); lines.push(''); });
  const text = lines.join('\n').trim();
  const copy = el('button', 'btn btn-primary btn-lg', 'Kopiuj wszystkie parametry');
  const area = el('textarea', 'mz-msg'); area.readOnly = true; area.rows = 10; area.value = text; area.id = 'param-text';
  copy.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(text); copy.textContent = 'Skopiowano'; } catch (e) { area.focus(); area.select(); copy.textContent = 'Zaznaczone: Ctrl+C'; }
    setTimeout(() => { copy.textContent = 'Kopiuj wszystkie parametry'; }, 2200);
  });
  root.appendChild(copy);
  root.appendChild(expandBar(root));
  section.sections.forEach((sec, index) => {
    const { wrap, body } = acc(sec.title, { open: index < 2, sub: trunc(sec.rows.slice(0, 3).map(r => r.p).join(' · ')), badge: String(sec.rows.length) });
    sec.rows.forEach(r => {
      if (!r.d){
        const row = el('div', 'pr-row');
        row.appendChild(el('small', 'pr-w', r.w));
        row.appendChild(el('span', 'pr-p', r.p));
        row.appendChild(el('b', 'pr-v', val(r)));
        if (r.n) row.appendChild(el('small', 'pr-n', r.n));
        body.appendChild(row);
        return;
      }
      const focus = store.get().ui?.paramFocus === r.p;
      const item = acc(r.p, { open: focus, sub: trunc(val(r)), badge: r.d.sub ? String(r.d.sub.length) : 'GDZIE' });
      item.wrap.classList.add('pr-item');
      item.wrap.dataset.row = r.p;
      item.body.appendChild(el('small', 'pr-w', r.w));
      item.body.appendChild(el('b', 'pr-v', val(r)));
      if (r.n) item.body.appendChild(el('small', 'pr-n', r.n));
      renderDetail(item.body, r.d);
      body.appendChild(item.wrap);
      if (focus) setTimeout(() => item.wrap.scrollIntoView({ block: 'center' }), 60);
    });
    root.appendChild(wrap);
  });
  if (store.get().ui?.paramFocus) store.set({ ui: { paramFocus: null } });
  if (section.multi) renderMulti(root, section.multi, current);
  const raw = acc('Tekst do skopiowania ręcznie', {});
  raw.body.appendChild(area);
  root.appendChild(raw.wrap);
}

function detailLines(d){
  if (!d) return [];
  const out = [];
  const add = (x, prefix = '') => {
    (x.k || []).forEach((t, i) => out.push(`${prefix}${i + 1}. ${t}`));
    if (x.v) out.push(`${prefix}Sprawdź: ${x.v}`);
    if (x.x) out.push(`${prefix}Uwaga: ${x.x}`);
  };
  if (d.sub) d.sub.forEach(sub => { out.push(`${sub.t} = ${sub.val}`); add(sub, '  '); });
  else add(d);
  return out;
}

function renderDetail(body, d){
  const block = (box, x) => {
    if (x.k?.length){
      const ol = el('ol', 'mz-steps pr-steps');
      x.k.forEach(t => ol.appendChild(el('li', '', t)));
      box.appendChild(ol);
    }
    if (x.v){ const v = el('p', 'pr-check'); v.append(el('b', '', 'Sprawdź: '), document.createTextNode(x.v)); box.appendChild(v); }
    if (x.x){ const w = el('p', 'pr-warn'); w.append(el('b', '', 'Uwaga: '), document.createTextNode(x.x)); box.appendChild(w); }
  };
  if (d.sub){
    d.sub.forEach(sub => {
      const item = acc(sub.t, { sub: trunc(sub.val), badge: 'GDZIE' });
      item.wrap.classList.add('pr-sub');
      block(item.body, sub);
      body.appendChild(item.wrap);
    });
  } else block(body, d);
}

function renderMulti(root, multi, current){
  const group = acc(multi.title, { open: true, color: '#e01e1e', sub: multi.items.map(i => i.t).join(' · '), badge: String(multi.items.length) });
  group.wrap.classList.add('pr-multi');
  group.body.appendChild(el('p', 'mz-intro', multi.intro));
  multi.items.forEach(it => {
    const value = (current === 'b' && it.b && it.b !== '—') ? it.b : it.a;
    const item = acc(it.t, { sub: value, badge: String(it.rows.length) });
    it.rows.forEach(([w, p]) => {
      const row = el('div', 'pr-row');
      row.appendChild(el('span', 'pr-p', w));
      row.appendChild(el('small', 'pr-n', p));
      item.body.appendChild(row);
    });
    group.body.appendChild(item.wrap);
  });
  const order = acc('Kolejność ustawiania (dokładnie tak)', { sub: 'od MX30 do presetu', badge: String(multi.order.length) });
  const ol = el('ol', 'mz-steps');
  multi.order.forEach(t => ol.appendChild(el('li', '', t)));
  order.body.appendChild(ol);
  group.body.appendChild(order.wrap);
  root.appendChild(group.wrap);
}

function renderPrzed(root, data){
  const section = data.przed;
  root.appendChild(el('p', 'mz-intro', section.intro));
  const text = bulletsToText('RIG TALK: o co poprosić i co przygotować', section.groups);
  const copy = el('button', 'btn btn-primary btn-lg', 'Kopiuj całą listę do notatek');
  copy.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(text); copy.textContent = 'Skopiowano'; }
    catch (e) { area.focus(); area.select(); copy.textContent = 'Zaznaczone: Ctrl+C'; }
    setTimeout(() => { copy.textContent = 'Kopiuj całą listę do notatek'; }, 2200);
  });
  root.appendChild(copy);
  root.appendChild(expandBar(root));
  section.groups.forEach((group, index) => {
    const { wrap, body } = acc(group.title, { open: index === 0, sub: trunc(group.items[0]), badge: String(group.items.length) });
    const ul = el('ul', 'mz-list');
    group.items.forEach(item => ul.appendChild(el('li', '', item)));
    body.appendChild(ul);
    root.appendChild(wrap);
  });
  const area = el('textarea', 'mz-msg');
  area.id = 'przed-text'; area.readOnly = true; area.rows = 10; area.value = text;
  const raw = acc('Tekst do skopiowania ręcznie', {});
  raw.body.appendChild(area);
  root.appendChild(raw.wrap);
}

function renderWideo(root, data){
  const section = data.wideo;
  root.appendChild(el('p', 'mz-intro', section.intro));
  root.appendChild(expandBar(root));
  const rules = acc('Zasady dla przezroczystego ekranu', { open: true, sub: trunc(section.rules[0]), badge: String(section.rules.length) });
  const ul = el('ul', 'mz-list');
  section.rules.forEach(r => ul.appendChild(el('li', '', r)));
  rules.body.appendChild(ul);
  root.appendChild(rules.wrap);

  const variants = acc('Warianty plików: rozmiary i kodeki', { open: true, sub: 'W1 2048 × 1024 zalecane, W2 2048 × 512, W3 4K…', badge: String(section.variants.length) });
  section.variants.forEach(v => {
    const card = el('div', 'mz-risk');
    card.appendChild(el('b', '', v.name));
    card.appendChild(el('p', 'mz-spec', v.spec));
    card.appendChild(el('p', '', 'Użycie: ' + v.use));
    variants.body.appendChild(card);
  });
  root.appendChild(variants.wrap);

  const prompts = acc('Prompty do generatora (kopiuj)', { sub: 'animacja byka, grafika, gdy brak 2:1', badge: String(section.prompts.length) });
  section.prompts.forEach(pr => {
    prompts.body.appendChild(el('b', 'mz-block-h', pr.title));
    const area = el('textarea', 'mz-msg');
    area.readOnly = true; area.rows = 6; area.value = pr.text;
    prompts.body.appendChild(area);
    const btn = el('button', 'btn', 'Kopiuj prompt');
    btn.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(pr.text); btn.textContent = 'Skopiowano'; }
      catch (e) { area.focus(); area.select(); btn.textContent = 'Zaznaczone: Ctrl+C'; }
      setTimeout(() => { btn.textContent = 'Kopiuj prompt'; }, 2200);
    });
    prompts.body.appendChild(btn);
  });
  root.appendChild(prompts.wrap);

  const files = acc('Gotowe pliki testowe', { sub: 'siatka 2048 × 512, siatka 2:1, test koła', badge: String(section.files.length) });
  section.files.forEach(f => {
    const a = el('a', 'mz-file');
    a.href = f.file; a.target = '_blank'; a.rel = 'noopener'; a.download = f.file.split('/').pop();
    const img = el('img'); img.src = f.file; img.alt = ''; img.loading = 'lazy';
    a.append(img, el('span', '', f.name));
    files.body.appendChild(a);
  });
  files.body.appendChild(el('small', 'mz-srcline', 'Dotknij, aby otworzyć. Zapis: przytrzymaj obraz albo użyj menu przeglądarki. Pliki są też w repozytorium GitHub w folderze assets/test/.'));
  root.appendChild(files.wrap);

  const steps = acc('Jak przetestować krok po kroku', { sub: trunc(section.steps[0]), badge: String(section.steps.length) });
  steps.body.appendChild(stepList(section.steps));
  root.appendChild(steps.wrap);
}

// ---------- menu montażu: grupy, widoki, pasek na dole ----------

let hubCtx = null;

/** stoisko.js rejestruje tu funkcje przełączania widoków, żeby dolny pasek działał z każdego ekranu. */
export function registerHub(ctx){
  hubCtx = ctx;
  ensureDock();
}

function openChapter(id){
  if (!hubCtx) return;
  const mode = id === 'etapy' ? 'stages' : id === 'mx30' ? 'mx30' : 'hub';
  const chapter = mode === 'hub' ? id : null;
  store.set({ ui: { stoiskoMode: mode, montazChapter: chapter } });
  hubCtx.rerender();
  window.scrollTo(0, 0);
}

function ensureDock(){
  if (document.getElementById('mzDock')) return;
  const dock = el('nav', 'mz-dock');
  dock.id = 'mzDock';
  dock.setAttribute('aria-label', 'Szybki dostęp do montażu');
  [['☰', 'Menu', null], ['🎬', 'Resolume', 'resolume'], ['🗣', 'Etapy', 'etapy'], ['🗺', 'Plany', 'plany']].forEach(([icon, label, id]) => {
    const b = el('button', 'mz-dock-btn');
    b.dataset.dock = id || 'menu';
    b.append(el('span', 'mz-dock-i', icon), el('span', '', label));
    b.addEventListener('click', () => openChapter(id));
    dock.appendChild(b);
  });
  document.body.appendChild(dock);
}


// ---------- szukajka: jedno pole przeszukuje rozdziały, parametry i kroki programów ----------

const fold = t => String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ł/g, 'l');

function buildIndex(data){
  if (data._index) return data._index;
  const idx = [];
  const add = (chapter, title, where, text, focus) => idx.push({ chapter, title, where, hay: fold(title + ' ' + where + ' ' + text), focus });
  data.chapters.forEach(c => add(c.id, c.title, 'Rozdział', `${c.en} ${c.when} ${data.summary?.[c.id] || ''}`));
  (data.param?.sections || []).forEach(sec => sec.rows.forEach(r => {
    const d = r.d ? [...(r.d.k || []), r.d.v || '', r.d.x || '', ...(r.d.sub || []).flatMap(x => [x.t, x.val, ...(x.k || []), x.v || '', x.x || ''])].join(' ') : '';
    add('param', r.p, 'Parametry · ' + sec.title, `${r.w} ${r.a} ${r.b} ${r.n || ''} ${d}`, r.p);
  }));
  ['mx30panel', 'vmp', 'resolume'].forEach(id => (data[id]?.blocks || []).forEach(b => {
    const chapter = data.chapters.find(c => c.id === id);
    add(id, b.h.split(' · ')[1] || b.h, chapter?.title || id, b.steps.map(st => `${st.pl} ${st.en}`).join(' '));
  }));
  (data.przed?.groups || []).forEach(g => add('przed', g.title, 'Przygotuj wcześniej', g.items.join(' ')));
  data._index = idx;
  return idx;
}

function renderSearch(container, data){
  const box = el('div', 'mz-search');
  const input = el('input', 'mz-search-in');
  input.type = 'search'; input.id = 'mzSearch'; input.placeholder = 'Szukaj: EDID, skala 100%, uśpienie, backup, jasność…';
  input.setAttribute('aria-label', 'Szukaj w montażu');
  input.autocomplete = 'off';
  const out = el('div', 'mz-search-out');
  const run = () => {
    out.innerHTML = '';
    const words = fold(input.value).split(/\s+/).filter(Boolean).map(w => (w.length >= 5 ? w.slice(0, -1) : w));
    if (!words.length) return;
    const hits = buildIndex(data).filter(e => words.every(w => e.hay.includes(w)))
      .sort((a, b) => (fold(b.title).includes(words[0]) ? 1 : 0) - (fold(a.title).includes(words[0]) ? 1 : 0)).slice(0, 12);
    if (!hits.length){ out.appendChild(el('p', 'muted-sm', 'Brak wyników. Spróbuj krótszego słowa.')); return; }
    hits.forEach(h => {
      const b = el('button', 'mz-search-hit');
      b.append(el('b', '', h.title), el('small', '', h.where));
      b.addEventListener('click', () => { if (h.focus) store.set({ ui: { paramFocus: h.focus } }); openChapter(h.chapter); });
      out.appendChild(b);
    });
  };
  input.addEventListener('input', run);
  box.append(input, out);
  container.appendChild(box);
}

const groupMap = (data) => new Map(data.groups.map(g => [g.id, g]));

function chapterTile(data, chapter, groups){
  const group = groups.get(chapter.group);
  const tile = el('button', 'mz-tile' + (chapter.id === 'az' ? ' az' : ''));
  tile.dataset.chapter = chapter.id;
  tile.style.setProperty('--gc', group?.color || '#f2b705');
  tile.appendChild(el('span', 'mz-icon', chapter.icon));
  tile.appendChild(el('span', 'mz-title', chapter.title));
  const meta = chapterProgress(data, chapter);
  tile.appendChild(el('span', 'mz-en-t', chapter.en + (meta ? ' · ' + meta : '')));
  tile.appendChild(el('span', 'mz-when', chapter.when));
  tile.addEventListener('click', () => openChapter(chapter.id));
  return tile;
}

function viewTematy(data, groups){
  const wrap = el('div', 'mz-view');
  data.groups.forEach(group => {
    const items = data.chapters.filter(c => c.group === group.id);
    if (!items.length) return;
    const { wrap: section, body } = acc(group.title, { open: true, badge: group.sub, color: group.color });
    section.classList.add('mz-group');
    section.style.setProperty('--gc', group.color);
    const grid = el('div', 'mz-grid');
    items.forEach(c => grid.appendChild(chapterTile(data, c, groups)));
    body.appendChild(grid);
    wrap.appendChild(section);
  });
  return wrap;
}

function viewKolejnosc(data, groups){
  const wrap = el('div', 'mz-view mz-timeline');
  data.stages.forEach((title, stage) => {
    const items = data.chapters.filter(c => c.stage === stage);
    if (!items.length) return;
    const block = el('section', 'mz-stage');
    const h = el('div', 'mz-stage-h');
    h.append(el('i', 'mz-stage-n', String(stage + 1)), el('b', '', title));
    block.appendChild(h);
    items.forEach(c => {
      const row = el('button', 'mz-step-row');
      row.dataset.chapter = c.id;
      row.style.setProperty('--gc', groups.get(c.group)?.color || '#f2b705');
      row.append(el('span', 'mz-icon', c.icon), el('span', 'mz-step-t', c.title), el('small', '', c.when));
      row.addEventListener('click', () => openChapter(c.id));
      block.appendChild(row);
    });
    wrap.appendChild(block);
  });
  return wrap;
}

function viewMapa(data, groups){
  const wrap = el('div', 'mz-view mz-map');
  const center = el('div', 'mm-center');
  center.append(el('b', '', 'EKRAN LED 8 × 4 m'), el('small', '', '64 cabinety · MX30 · Lynk & Co Paris'));
  wrap.appendChild(center);
  const rail = el('div', 'mm-rail');
  data.groups.forEach(group => {
    const items = data.chapters.filter(c => c.group === group.id);
    if (!items.length) return;
    const branch = el('section', 'mm-branch');
    branch.style.setProperty('--gc', group.color);
    const title = el('div', 'mm-title');
    title.append(el('b', '', group.title), el('small', '', group.sub));
    branch.appendChild(title);
    const chips = el('div', 'mm-chips');
    items.forEach(c => {
      const chip = el('button', 'mm-chip');
      chip.dataset.chapter = c.id;
      chip.append(el('span', 'mz-icon', c.icon), el('span', '', c.title));
      chip.addEventListener('click', () => openChapter(c.id));
      chips.appendChild(chip);
    });
    branch.appendChild(chips);
    rail.appendChild(branch);
  });
  wrap.appendChild(rail);
  return wrap;
}

function orderedChapters(data){
  return data.chapters.map((c, i) => ({ c, i })).sort((a, b) => (a.c.stage - b.c.stage) || (a.i - b.i)).map(x => x.c);
}

export async function renderMontazHub(container, ctx){
  registerHub({ rerender: ctx.rerender || (() => renderMontazHub(container, ctx)), ...ctx });
  const data = await loadMontaz();
  const groups = groupMap(data);
  const current = store.get().ui?.montazChapter || null;
  container.innerHTML = '';

  // pasek szybkiej powtórki u góry
  const quick = el('button', 'mz-quick');
  quick.dataset.quick = 'slowka';
  quick.append(el('span', 'mz-icon', '🔤'), el('b', '', 'SZYBKA POWTÓRKA'), el('small', '', 'słówka PL → EN'));
  quick.addEventListener('click', () => openChapter('slowka'));

  if (!current){
    const hero = el('div', 'mz-hero');
    hero.appendChild(el('div', 'eyebrow', 'MONTAŻ KROK PO KROKU'));
    hero.appendChild(el('h2', 'hero-title', 'Co robisz teraz?'));
    hero.appendChild(el('div', 'hero-sub', data.subtitle));
    container.appendChild(hero);
    container.appendChild(quick);
    renderSearch(container, data);

    const view = store.get().ui?.montazView || 'mapa';
    const bar = el('div', 'mz-views');
    [['mapa', 'Mapa'], ['kolejnosc', 'Kolejność'], ['tematy', 'Tematy']].forEach(([key, label]) => {
      const b = el('button', view === key ? 'on' : '', label);
      b.dataset.view = key;
      b.addEventListener('click', () => { store.set({ ui: { montazView: key } }); renderMontazHub(container, ctx); });
      bar.appendChild(b);
    });
    container.appendChild(bar);
    container.appendChild(view === 'kolejnosc' ? viewKolejnosc(data, groups) : view === 'tematy' ? viewTematy(data, groups) : viewMapa(data, groups));
    container.appendChild(el('p', 'muted-sm', data.source_note));
    return;
  }

  const chapter = data.chapters.find(c => c.id === current);
  const group = groups.get(chapter.group);
  const back = el('button', 'btn mz-back', '← Menu montażu');
  back.addEventListener('click', () => openChapter(null));
  const top = el('div', 'mz-topline');
  top.append(back, quick);
  container.appendChild(top);
  const head = el('div', 'mz-head');
  head.style.setProperty('--gc', group?.color || '#f2b705');
  head.appendChild(el('span', 'mz-icon big', chapter.icon));
  const titles = el('div');
  titles.appendChild(el('div', 'mz-tag', group?.title || ''));
  titles.appendChild(el('h2', 'mz-title-h', chapter.title));
  head.appendChild(titles);
  container.appendChild(head);

  const summary = data.summary?.[chapter.id];
  if (summary){
    const box = el('div', 'mz-summary');
    box.appendChild(el('b', '', 'W SKRÓCIE'));
    box.appendChild(el('p', '', summary));
    container.appendChild(box);
  }
  const body = el('div', 'mz-body');
  container.appendChild(body);
  switch (chapter.id){
    case 'fakty': renderFakty(body, data); break;
    case 'komplet': renderKomplet(body, data); break;
    case 'mechanika': renderSteps(body, data.mechanika); break;
    case 'cabinety': renderSteps(body, data.cabinety); break;
    case 'rj45': renderRj45(body, data); break;
    case 'zasilanie': renderSteps(body, data.zasilanie); break;
    case 'uklad':
      renderUklad(body, data);
      { const k = acc('Kalkulator pikseli i portów', { open: true, sub: 'rozdzielczość, limit portu, moc', badge: 'MX30' }); renderKalkulator(k.body, data); body.appendChild(k.wrap); }
      break;
    case 'niespodzianki': renderNiespodzianki(body, data); break;
    case 'przed': renderPrzed(body, data); break;
    case 'param': renderParam(body, data); break;
    case 'wideo': renderWideo(body, data); break;
    case 'plany': await renderPlany(body, data.plany?.intro); break;
    case 'az': await renderAz(body); break;
    case 'slowka': await renderWordsChapter(body); break;
    case 'mx30panel': renderBlocks(body, data.mx30panel); break;
    case 'vmp': renderBlocks(body, data.vmp); break;
    case 'resolume': renderBlocks(body, data.resolume); break;
    default: break;
  }
  const plan = outline(body);
  if (plan) container.insertBefore(plan, body);
  const plans = await planLinks(data[chapter.id]?.plans);
  if (plans) container.appendChild(plans);
  const azData = await loadAz();
  if (chapter.id !== 'az' && chapter.id !== 'slowka'){
    const words = wordList(azData.words[chapter.id]);
    if (words) container.appendChild(words);
  }
  const phrases = phraseBlock(data[chapter.id]?.phrases);
  if (phrases){
    const more = el('details', 'mz-more');
    more.appendChild(el('summary', '', 'Zwroty do rozmowy (po angielsku)'));
    more.appendChild(phrases);
    container.appendChild(more);
  }

  const seq = orderedChapters(data).filter(c => c.id !== 'slowka');
  const idx = seq.findIndex(c => c.id === current);
  const next = seq[idx + 1];
  if (next){
    const nextBtn = el('button', 'btn btn-primary btn-lg', `Dalej: ${next.title} →`);
    nextBtn.dataset.next = next.id;
    nextBtn.addEventListener('click', () => openChapter(next.id));
    container.appendChild(nextBtn);
  }
}
