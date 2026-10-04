// RIG TALK — montaz.js: tryb MONTAŻ — szybki wybór rozdziału, rozdziały z dokumentów SQM,
// ściąga RJ45 (T568B), kalkulator pikseli/linii/zasilania, lista "co może zaskoczyć".
// Treść: content/montaz.json. Rozdział MX30 i etapy stoiska żyją w mx30-guide.js i stoisko.js.

import { store } from './state.js';
import * as speech from './speech.js';
import { planLinks, renderPlany } from './plany.js';
import { renderAz, renderWordsChapter, wordList, loadAz } from './az.js';

let cache = null;

async function loadMontaz(){
  if (cache) return cache;
  const response = await fetch('content/montaz.json', { cache: 'no-store' });
  if (!response.ok) throw new Error(`montaz.json: HTTP ${response.status}`);
  cache = await response.json();
  return cache;
}

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
  section.blocks.forEach(block => {
    const wrap = el('section', 'mx-step ' + (block.status === 'manual' ? 'safe' : ''));
    wrap.appendChild(el('div', 'mx-status', BLOCK_STATUS[block.status] || ''));
    wrap.appendChild(el('h3', 'mz-block-h', block.h.includes(' · ') ? block.h.split(' · ').pop() : block.h));
    wrap.appendChild(stepList(block.steps));
    if (block.src) wrap.appendChild(el('small', 'mz-srcline', 'Źródło: ' + block.src));
    root.appendChild(wrap);
  });
  if (section.missing?.length){
    const box = el('div', 'mz-dont');
    box.appendChild(el('b', '', 'CZEGO NIE MAM POTWIERDZONEGO'));
    section.missing.forEach(m => box.appendChild(el('div', '', '• ' + m)));
    root.appendChild(box);
  }
  if (section.sources?.length){
    const box = el('div', 'card');
    box.appendChild(el('h3', 'mz-h', 'ŹRÓDŁA (OTWÓRZ I PORÓWNAJ)'));
    section.sources.forEach(src => {
      const a = el('a', 'mz-src', src.t);
      a.href = src.url; a.target = '_blank'; a.rel = 'noopener noreferrer';
      box.appendChild(a);
    });
    root.appendChild(box);
  }
}

function renderFakty(root, data){
  root.appendChild(el('p', 'muted-sm', data.source_note));
  const list = el('div', 'mz-facts');
  data.fakty.facts.forEach(fact => {
    const row = el('div', 'mz-fact ' + fact.status);
    row.appendChild(el('span', 'mz-fact-label', fact.label));
    row.appendChild(el('b', '', fact.value));
    row.appendChild(el('small', '', 'Źródło: ' + fact.src));
    list.appendChild(row);
  });
  root.appendChild(list);
}

function renderKomplet(root, data, rerender){
  const section = data.komplet;
  root.appendChild(el('p', 'muted-sm', section.intro));
  const checks = getChecks();
  section.items.forEach(item => {
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
    });
    row.append(input, text);
    root.appendChild(row);
  });
}

function renderSteps(root, section){
  if (section.warning) root.appendChild(warning(section.warning));
  if (section.facts){
    const box = el('div', 'card');
    box.appendChild(el('h3', 'mz-h', 'CO WIEMY Z DOKUMENTÓW'));
    const ul = el('ul', 'mz-list');
    section.facts.forEach(f => ul.appendChild(el('li', '', f)));
    box.appendChild(ul);
    root.appendChild(box);
  }
  root.appendChild(el('h3', 'mz-h', 'KROKI'));
  root.appendChild(stepList(section.steps));
  if (section.dont){
    const box = el('div', 'mz-dont');
    box.appendChild(el('b', '', 'NIE ROBISZ'));
    section.dont.forEach(d => box.appendChild(el('div', '', '✕ ' + d)));
    root.appendChild(box);
  }
}

function renderRj45(root, data){
  const section = data.rj45;
  root.appendChild(warning(section.hold));
  // wizualna wtyczka: osiem żył w kolejności B
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
  root.appendChild(plug);
  const table = el('ol', 'rj-order');
  section.pins.forEach(pin => table.appendChild(el('li', '', pin.color)));
  root.appendChild(table);
  root.appendChild(el('h3', 'mz-h', 'ZACISKANIE'));
  root.appendChild(stepList(section.steps));
  const notes = el('div', 'tip');
  section.notes.forEach(note => notes.appendChild(el('div', '', note)));
  root.appendChild(notes);
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
  data.niespodzianki.items.forEach(item => {
    const card = el('div', 'mz-risk');
    card.appendChild(el('b', '', item.t));
    card.appendChild(el('p', '', item.d));
    root.appendChild(card);
  });
}

// ---------- ekran główny montażu ----------

/** Zwraca true, gdy obsłużono (hub albo rozdział własny); false → stoisko.js renderuje etapy/MX30. */
export async function renderMontazHub(container, { openStages, openMx30 }){
  const data = await loadMontaz();
  const current = store.get().ui?.montazChapter || null;
  container.innerHTML = '';

  if (!current){
    const hero = el('div', 'frame hero');
    hero.appendChild(el('div', 'eyebrow', 'MONTAŻ KROK PO KROKU'));
    hero.appendChild(el('h2', 'hero-title', 'Który etap robisz teraz?'));
    hero.appendChild(el('div', 'hero-sub', data.subtitle));
    container.appendChild(hero);
    const grid = el('div', 'mz-grid');
    data.chapters.forEach(chapter => {
      const tile = el('button', 'mz-tile' + (chapter.id === 'niespodzianki' ? ' alert' : '') + (chapter.id === 'az' ? ' az' : ''));
      tile.dataset.chapter = chapter.id;
      tile.appendChild(el('span', 'mz-n', chapter.n));
      tile.appendChild(el('span', 'mz-icon', chapter.icon));
      tile.appendChild(el('span', 'mz-title', chapter.title));
      const meta = chapterProgress(data, chapter);
      tile.appendChild(el('span', 'mz-en-t', chapter.en + (meta ? ' · ' + meta : '')));
      tile.appendChild(el('span', 'mz-when', chapter.when));
      tile.addEventListener('click', () => {
        if (chapter.id === 'etapy'){ openStages(); return; }
        if (chapter.id === 'mx30'){ openMx30(); return; }
        store.set({ ui: { montazChapter: chapter.id } });
        renderMontazHub(container, { openStages, openMx30 });
        window.scrollTo(0, 0);
      });
      grid.appendChild(tile);
    });
    container.appendChild(grid);
    container.appendChild(el('p', 'muted-sm', data.source_note));
    return;
  }

  const chapter = data.chapters.find(c => c.id === current);
  const back = el('button', 'btn mz-back', '← Wybór rozdziału');
  back.addEventListener('click', () => {
    store.set({ ui: { montazChapter: null } });
    renderMontazHub(container, { openStages, openMx30 });
    window.scrollTo(0, 0);
  });
  container.appendChild(back);
  const head = el('div', 'mz-head');
  head.appendChild(el('span', 'mz-n', chapter.n));
  const titles = el('div');
  titles.appendChild(el('h2', 'mz-title-h', chapter.title));
  titles.appendChild(el('div', 'mz-en-t', chapter.en));
  head.appendChild(titles);
  container.appendChild(head);

  const body = el('div', 'mz-body');
  container.appendChild(body);
  switch (chapter.id){
    case 'fakty': renderFakty(body, data); break;
    case 'komplet': renderKomplet(body, data); break;
    case 'mechanika': renderSteps(body, data.mechanika); break;
    case 'cabinety': renderSteps(body, data.cabinety); break;
    case 'rj45': renderRj45(body, data); break;
    case 'zasilanie': renderSteps(body, data.zasilanie); break;
    case 'kalkulator': renderKalkulator(body, data); break;
    case 'niespodzianki': renderNiespodzianki(body, data); break;
    case 'plany': await renderPlany(body, data.plany?.intro); break;
    case 'az': await renderAz(body); break;
    case 'slowka': await renderWordsChapter(body); break;
    case 'mx30panel': renderBlocks(body, data.mx30panel); break;
    case 'vmp': renderBlocks(body, data.vmp); break;
    case 'resolume': renderBlocks(body, data.resolume); break;
    default: break;
  }
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

  const idx = data.chapters.findIndex(c => c.id === current);
  const next = data.chapters[idx + 1];
  if (next && next.id !== 'etapy' && next.id !== 'mx30'){
    const nextBtn = el('button', 'btn btn-primary btn-lg', `Dalej: ${next.title} →`);
    nextBtn.addEventListener('click', () => {
      store.set({ ui: { montazChapter: next.id } });
      renderMontazHub(container, { openStages, openMx30 });
      window.scrollTo(0, 0);
    });
    container.appendChild(nextBtn);
  }
}
