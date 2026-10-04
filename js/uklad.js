// RIG TALK — uklad.js: generator układu ekranu 8×8 (wężyk góra–dół), grafiki SYGNAŁ i ZASILANIE,
// tabela portów (główne / zapasowe), pobór mocy i wytyczne wynikające z układu.
// Dane wejściowe w content/montaz.json → "uklad". Źródła mocy: strona producenta INFiLED (HL3978).

import { store } from './state.js';
import { acc, expandBar } from './acc.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const COLORS = ['#d3362b', '#e09a14', '#2f9e55', '#2b7fc1', '#9b4fb8', '#17a58a', '#b5601c', '#6c7a89'];

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};
const svg = (tag, attrs = {}, text) => {
  const node = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, String(v)));
  if (text !== undefined) node.textContent = text;
  return node;
};

/** Dzieli kolumny na linie po k kolumn. Wężyk: pierwsza kolumna w dół, druga w górę itd. */
export function buildLines(cols, rows, k){
  const lines = [];
  for (let c0 = 0, id = 1; c0 < cols; c0 += k, id++){
    const lineCols = [];
    for (let c = c0; c < Math.min(cols, c0 + k); c++) lineCols.push(c);
    const cabs = [];
    lineCols.forEach((col, j) => {
      const order = j % 2 === 0 ? [...Array(rows).keys()] : [...Array(rows).keys()].reverse();
      order.forEach(row => cabs.push({ col, row, seq: cabs.length + 1 }));
    });
    const last = cabs[cabs.length - 1];
    lines.push({
      id, cols: lineCols, cabs,
      startTop: cabs[0].row === 0,
      endTop: last.row === 0,
    });
  }
  return lines;
}

/** Cały plan: linie DATA i ZASILANIA, porty, piksele, moc. */
export function layoutPlan(pIn){
  // Założenie: pobór rośnie liniowo z jasnością (szacunek, nie dane producenta).
  const k = (pIn.bri ?? 100) / 100;
  const p = { ...pIn, wMax: pIn.wMax * k, wAvg: pIn.wAvg * k };
  const cols = p.cols, rows = p.rows;
  const data = buildLines(cols, rows, p.dataK);
  const power = buildLines(cols, rows, p.powerK);
  const cabPx = p.cabPx;
  const portLimit = p.portLimit;
  data.forEach((line, i) => {
    line.main = 2 * i + 1;           // porty główne: 1, 3, 5, 7, 9
    line.backup = 2 * i + 2;         // zapasowe: 2, 4, 6, 8, 10 (Sequential Backup 1⇌2, 3⇌4)
    line.px = line.cabs.length * cabPx;
    line.pct = portLimit ? Math.round(line.px / portLimit * 100) : null;
  });
  power.forEach(line => {
    const n = line.cabs.length;
    line.n = n;
    line.wMax = n * p.wMax; line.wAvg = n * p.wAvg;
    line.aMax = line.wMax / 230; line.aAvg = line.wAvg / 230;
    line.kg = n * p.kg;
  });
  const portsNeeded = data.length * 2;
  const total = {
    cabs: cols * rows,
    wMax: cols * rows * p.wMax, wAvg: cols * rows * p.wAvg, kg: cols * rows * p.kg,
  };
  total.aMax = total.wMax / 230; total.aAvg = total.wAvg / 230;
  return { data, power, portsNeeded, total, cols, rows, cabPx, portLimit, bri: pIn.bri ?? 100, wMaxB: p.wMax, wAvgB: p.wAvg };
}

/** Rysunek SVG ekranu. mode: 'data' albo 'power'. */
export function drawWall(plan, mode){
  const lines = mode === 'data' ? plan.data : plan.power;
  const cw = 44, ch = 22, gap = 2, mx = 12, top = 40, bottom = 40;
  const W = mx * 2 + plan.cols * (cw + gap);
  const H = top + plan.rows * (ch + gap) + bottom;
  const root = svg('svg', { viewBox: `0 0 ${W} ${H}`, width: '100%', role: 'img', 'font-family': 'Arial, sans-serif' });
  root.setAttribute('aria-label', mode === 'data' ? 'Schemat sygnału DATA ekranu' : 'Schemat zasilania ekranu');
  root.appendChild(svg('rect', { x: 0, y: 0, width: W, height: H, fill: '#0f0f11' }));
  const cx = col => mx + col * (cw + gap) + cw / 2;
  const cy = row => top + row * (ch + gap) + ch / 2;
  lines.forEach((line, i) => {
    const color = COLORS[i % COLORS.length];
    line.cabs.forEach(cab => {
      root.appendChild(svg('rect', { x: cx(cab.col) - cw / 2, y: cy(cab.row) - ch / 2, width: cw, height: ch, rx: 2, fill: color, 'fill-opacity': 0.9, stroke: '#0f0f11', 'stroke-width': 1 }));
    });
    if (mode === 'data'){
      const pts = line.cabs.map(c => `${cx(c.col)},${cy(c.row)}`).join(' ');
      root.appendChild(svg('polyline', { points: pts, fill: 'none', stroke: '#ffffff', 'stroke-width': 1.4, 'stroke-opacity': 0.75, 'stroke-linejoin': 'round' }));
      line.cabs.forEach(c => {
        root.appendChild(svg('text', { x: cx(c.col), y: cy(c.row) + 3.5, 'text-anchor': 'middle', 'font-size': 10, 'font-weight': 700, fill: '#ffffff', stroke: '#00000088', 'stroke-width': 0.4 }, String(c.seq)));
      });
      const first = line.cabs[0], last = line.cabs[line.cabs.length - 1];
      const yIn = first.row === 0 ? top - 14 : H - bottom + 14;
      root.appendChild(svg('text', { x: cx(first.col), y: yIn, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 700, fill: '#f2b705' }, `P${line.main}`));
      root.appendChild(svg('text', { x: cx(first.col), y: yIn + (first.row === 0 ? 10 : -10) + (first.row === 0 ? 0 : 0), 'text-anchor': 'middle', 'font-size': 9, fill: '#8fd19e' }, first.row === 0 ? '▼ główny' : '▲ główny'));
      const yEnd = last.row === 0 ? top - 14 : H - bottom + 14;
      const sameSpot = last.col === first.col && last.row === first.row;
      if (!sameSpot){
        root.appendChild(svg('text', { x: cx(last.col), y: yEnd, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 700, fill: '#7fc4ff' }, `B${line.backup}`));
        root.appendChild(svg('text', { x: cx(last.col), y: yEnd + (last.row === 0 ? 10 : -10), 'text-anchor': 'middle', 'font-size': 9, fill: '#7fc4ff' }, last.row === 0 ? '▼ zapas' : '▲ zapas'));
      }
    } else {
      const mid = line.cabs[Math.floor(line.cabs.length / 2)];
      line.cabs.forEach(c => {
        root.appendChild(svg('text', { x: cx(c.col), y: cy(c.row) + 3.5, 'text-anchor': 'middle', 'font-size': 9, fill: '#ffffff', 'fill-opacity': 0.85 }, `Z${line.id}`));
      });
      const first = line.cabs[0];
      root.appendChild(svg('text', { x: cx(first.col), y: top - 14, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 700, fill: '#f2b705' }, `Z${line.id}`));
    }
  });
  root.appendChild(svg('text', { x: W / 2, y: 13, 'text-anchor': 'middle', 'font-size': 11, fill: '#bbbbbb' }, mode === 'data' ? 'SYGNAŁ DATA · widok od przodu · góra ekranu u góry' : 'ZASILANIE · widok od przodu · góra ekranu u góry'));
  root.appendChild(svg('text', { x: W / 2, y: H - 6, 'text-anchor': 'middle', 'font-size': 9, fill: '#888888' }, `${plan.cols} kolumn × ${plan.rows} rzędów · 8 m × 4 m`));
  return root;
}

function toPng(svgEl, name){
  try {
    const xml = new XMLSerializer().serializeToString(svgEl);
    const vb = svgEl.viewBox.baseVal;
    const scale = 3;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = vb.width * scale; canvas.height = vb.height * scale;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = name;
        document.body.appendChild(a); a.click(); a.remove();
      }, 'image/png');
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" '));
  } catch (e) { /* brak zapisu w tym widoku */ }
}

/** Dokładne limity: cabinetów na linię zasilania i na port MX30 (wzór z manuala MX30, sekcja 11). */
export function limits(cfg, cur){
  const volt = 230, amp = cur.amp;
  const cap = amp * volt;
  const rows = [
    ['Średnia moc przy ' + cur.bri + '% jasności', cur.wAvg * cur.bri / 100],
    ['Maksimum (pełna biel) przy ' + cur.bri + '% jasności', cur.wMax * cur.bri / 100],
    ['Maksimum (pełna biel) przy 100% jasności', cur.wMax],
  ].map(([label, w]) => ({ label, w, full: Math.floor(cap / w), safe: Math.floor(cap * 0.8 / w) }));
  const ports = [];
  [[24, 8], [25, 8], [30, 8], [50, 8], [60, 8], [60, 10], [120, 8]].forEach(([fps, bits]) => {
    const px = Math.floor(0.95e9 / ((bits === 10 ? 48 : 24) * fps));
    ports.push({ fps, bits, px, cabs: Math.floor(px / cfg.cabPx) });
  });
  const a10 = Math.floor(0.95e9 / (32 * 60));
  ports.push({ fps: 60, bits: '10 bit (karta A10s Pro)', px: a10, cabs: Math.floor(a10 / cfg.cabPx) });
  return { cap, rows, ports };
}

/** Ściąga opięcia jako zwykły tekst do notatek. */
export function wiringText(plan, cur, cfg){
  const L = [];
  L.push('ŚCIĄGA OPIĘCIA · EKRAN LED 8 × 4 m · 64 cabinety · jasność ' + cur.bri + '%');
  L.push('');
  L.push('SYGNAŁ (wężyk góra–dół, widok od przodu)');
  plan.data.forEach(l => L.push(`D${l.id}: kolumny ${l.cols[0] + 1}–${l.cols[l.cols.length - 1] + 1}, ${l.cabs.length} cab., port główny P${l.main}, zapasowy B${l.backup}, ${l.px} px (${l.pct}% portu)`));
  L.push('VMP: Backup → Ethernet Backup → Sequential Backup (1⇌2, 3⇌4, 5⇌6, 7⇌8), potem Verify Primary i Verify Backup.');
  L.push('');
  L.push('ZASILANIE');
  plan.power.forEach(l => L.push(`Z${l.id}: kolumny ${l.cols[0] + 1}–${l.cols[l.cols.length - 1] + 1}, ${l.n} cab., średnio ${l.wAvg.toFixed(0)} W (${l.aAvg.toFixed(1)} A), max ${l.wMax.toFixed(0)} W (${l.aMax.toFixed(1)} A)`));
  L.push(`Razem: średnio ${(plan.total.wAvg / 1000).toFixed(1)} kW, max ${(plan.total.wMax / 1000).toFixed(1)} kW przy ${cur.bri}% jasności.`);
  return L.join('\n');
}

const fmt = (n, d = 0) => Number(n).toLocaleString('pl-PL', { maximumFractionDigits: d, minimumFractionDigits: d });

function guidelines(plan, p){
  const out = [];
  const d = plan.data, pw = plan.power;
  const mainPorts = d.map(l => l.main).join(', ');
  const backupPorts = d.map(l => l.backup).join(', ');
  out.push(`SYGNAŁ: ${d.length} linie DATA po ${d[0].cabs.length} cabinetów. Porty główne: ${mainPorts}. Porty zapasowe: ${backupPorts}. Razem ${plan.portsNeeded} z 10 portów MX30.`);
  if (plan.portsNeeded > 10) out.push('UWAGA: potrzebujesz więcej niż 10 portów. Zwiększ liczbę kolumn na linię albo zrezygnuj z backupu na części linii.');
  const evenEnds = d.every(l => l.startTop && l.endTop);
  out.push(evenEnds
    ? 'KABLE: każda linia zaczyna się i kończy u góry ekranu. Kabel główny i zapasowy wchodzą w jednym miejscu, więc trasa jest krótka i jedna.'
    : 'KABLE: przy nieparzystej liczbie kolumn na linię koniec linii wypada na dole ekranu. Kabel zapasowy musi dojść od dołu. Rozważ 2 albo 4 kolumny na linię.');
  const maxPct = Math.max(...d.map(l => l.pct ?? 0));
  out.push(`OBCIĄŻENIE PORTU: najbardziej obciążona linia ma ${fmt(d[0].px)} px, czyli ${maxPct}% limitu portu (${fmt(plan.portLimit)} px przy 8 bit i 60 Hz).`);
  out.push('VMP: ekran ustaw w VMP (nie Swift Layout z panelu, bo porty zapasowe zabierają kolejne numery). Ekran → Backup → Ethernet Backup → Sequential Backup (1⇌2, 3⇌4). Potem Verify Primary i Verify Backup dla każdej pary.');
  out.push('TEST: włączaj zasilanie linia po linii (Z1, Z2…). Po każdej włącz Test Pattern i Mapping, sprawdź numer portu na cabinetach pierwszej kolumny linii.');
  if (pw.length > 2) out.push(`ZASILANIE: ${pw.length} linie zasilania. Rack z listy SQM daje 2 × 16 A, więc potrzebujesz dodatkowych obwodów albo więcej kolumn na linię (np. 4).`);
  const over = pw.filter(l => l.aMax > p.amp);
  const typOk = pw.every(l => l.aAvg <= p.amp);
  out.push(`PRĄD: przy jasności ${p.bri}% i średniej mocy ${fmt(plan.wAvgB)} W na cabinet linia zasilania ciągnie ${fmt(Math.min(...pw.map(l => l.aAvg)), 1)}${Math.min(...pw.map(l => l.aAvg)) === Math.max(...pw.map(l => l.aAvg)) ? '' : ' do ' + fmt(Math.max(...pw.map(l => l.aAvg)), 1)} A. ${typOk ? 'Mieści się w ' + p.amp + ' A.' : 'To przekracza ' + p.amp + ' A.'}`);
  if (over.length) out.push(`UWAGA: przy mocy maksymalnej (${fmt(plan.wMaxB)} W na cabinet, pełna biel, jasność ${p.bri}%) ${over.length} z ${pw.length} linii przekracza ${p.amp} A (do ${fmt(Math.max(...pw.map(l => l.aMax)), 1)} A). Ogranicz jasność w VMP (Brightness Limit) i nie wyświetlaj pełnej bieli na całym ekranie.`);
  out.push(`PRZEKAZANIE: pokaż klientowi, że każda para portów (${d.map(l => `P${l.main}/B${l.backup}`).join(', ')}) jest sprawdzona, i zapisz zdjęcie tabeli portów.`);
  return out;
}

export function renderUklad(root, data){
  const cfg = data.uklad;
  const saved = store.get().montaz?.uklad || {};
  const v = { ...cfg.defaults, ...saved };
  root.appendChild(el('p', 'muted-sm', cfg.intro));

  const controls = el('div', 'mz-calc-grid');
  const fields = [
    ['dataK', 'Kolumn na linię DATA', [1, 2, 3, 4]],
    ['powerK', 'Kolumn na linię zasilania', [1, 2, 3, 4, 8]],
    ['bri', 'Jasność (%)', null],
    ['wMax', 'Moc max cabinetu (W)', null],
    ['wAvg', 'Moc średnia cabinetu (W)', null],
    ['kg', 'Waga cabinetu (kg)', null],
    ['amp', 'Obwód (A)', null],
  ];
  const inputs = {};
  fields.forEach(([key, label, options]) => {
    const wrap = el('label', 'mz-field');
    wrap.appendChild(el('span', '', label));
    let input;
    if (options){
      input = el('select');
      options.forEach(o => { const opt = el('option', '', String(o)); opt.value = String(o); input.appendChild(opt); });
    } else {
      input = el('input'); input.type = 'number'; input.step = 'any'; input.min = '0'; input.inputMode = 'decimal';
    }
    input.id = 'uk-' + key;
    input.value = String(v[key]);
    inputs[key] = input;
    wrap.appendChild(input);
    controls.appendChild(wrap);
  });
  root.appendChild(controls);

  const out = el('div', 'uk-out');
  root.appendChild(out);

  const paint = () => {
    const cur = {};
    Object.entries(inputs).forEach(([k, i]) => { cur[k] = Number(i.value); });
    store.set({ montaz: { uklad: cur } });
    const plan = layoutPlan({ cols: 8, rows: 8, cabPx: cfg.cabPx, portLimit: cfg.portLimit, ...cur });
    const wasOpen = [...out.querySelectorAll('details.mz-acc')].map(d => d.open);
    out.innerHTML = '';
    const sec = (title, index, badge) => acc(title, { open: wasOpen.length ? !!wasOpen[index] : true, badge });
    const s1 = sec('Sygnał: linie DATA, porty główne i zapasowe', 0, `${plan.data.length} linie`);
    const s2 = sec('Zasilanie: linie i pobór mocy', 1, `${plan.power.length} linie`);
    const s3 = sec('Wytyczne wynikające z tego układu', 2, '');

    // sygnał
    const dataSvg = drawWall(plan, 'data');
    const dataBox = el('div', 'uk-svg'); dataBox.appendChild(dataSvg); s1.body.appendChild(dataBox);
    const dBtn = el('button', 'btn', 'Zapisz grafikę sygnału (PNG)');
    dBtn.addEventListener('click', () => toPng(dataSvg, `uklad-sygnal-${cur.dataK}kol.png`));
    s1.body.appendChild(dBtn);

    const tbl = el('div', 'uk-table');
    const head = el('div', 'uk-row uk-head');
    ['Linia', 'Kolumny', 'Cabinety', 'Port główny', 'Zapas', 'Piksele', '% portu'].forEach(h => head.appendChild(el('span', '', h)));
    tbl.appendChild(head);
    plan.data.forEach((l, i) => {
      const row = el('div', 'uk-row');
      row.style.borderLeftColor = COLORS[i % COLORS.length];
      [`D${l.id}`, `${l.cols[0] + 1}–${l.cols[l.cols.length - 1] + 1}`, l.cabs.length, `P${l.main}`, `B${l.backup}`, fmt(l.px), `${l.pct}%`].forEach(x => row.appendChild(el('span', '', String(x))));
      tbl.appendChild(row);
    });
    s1.body.appendChild(tbl);
    out.appendChild(s1.wrap);

    // zasilanie
    const pSvg = drawWall(plan, 'power');
    const pBox = el('div', 'uk-svg'); pBox.appendChild(pSvg); s2.body.appendChild(pBox);
    const pBtn = el('button', 'btn', 'Zapisz grafikę zasilania (PNG)');
    pBtn.addEventListener('click', () => toPng(pSvg, `uklad-zasilanie-${cur.powerK}kol.png`));
    s2.body.appendChild(pBtn);
    const ptbl = el('div', 'uk-table');
    const ph = el('div', 'uk-row uk-head uk-p');
    ['Linia', 'Cabinety', 'Moc śr.@' + cur.bri + '%', 'Moc max@' + cur.bri + '%', 'Prąd śr.', 'Prąd max'].forEach(h => ph.appendChild(el('span', '', h)));
    ptbl.appendChild(ph);
    plan.power.forEach((l, i) => {
      const row = el('div', 'uk-row uk-p');
      row.style.borderLeftColor = COLORS[i % COLORS.length];
      const bad = l.aMax > cur.amp;
      [`Z${l.id}`, l.n, `${fmt(l.wAvg)} W`, `${fmt(l.wMax)} W`, `${fmt(l.aAvg, 1)} A`, `${fmt(l.aMax, 1)} A`].forEach((x, idx) => {
        const s = el('span', idx === 5 && bad ? 'uk-bad' : '', String(x)); row.appendChild(s);
      });
      ptbl.appendChild(row);
    });
    s2.body.appendChild(ptbl);
    const sum = el('div', 'mz-result frame');
    const line = (label, value) => { const r = el('div', 'mz-line'); r.append(el('span', '', label), el('b', '', value)); sum.appendChild(r); };
    line(`Cały ekran, średnio (${cur.bri}%)`, `${fmt(plan.total.wAvg / 1000, 1)} kW · ${fmt(plan.total.aAvg, 1)} A przy 230 V`);
    line(`Cały ekran, maksimum (${cur.bri}%)`, `${fmt(plan.total.wMax / 1000, 1)} kW · ${fmt(plan.total.aMax, 1)} A przy 230 V`);
    line('Waga cabinetów', `${fmt(plan.total.kg)} kg (bez belek i kabli)`);
    line('Rack z listy SQM', '2 × 16 A = 32 A, czyli ok. 7,4 kW');
    s2.body.appendChild(sum);
    out.appendChild(s2.wrap);

    // wytyczne
    const list = el('ol', 'mz-steps');
    guidelines(plan, cur).forEach(t => list.appendChild(el('li', '', t)));
    s3.body.appendChild(list);
    out.appendChild(s3.wrap);

    // dokładne limity
    const lim = limits(cfg, cur);
    const s4 = acc('Limity: ile cabinetów na linię i na port', { open: wasOpen.length ? !!wasOpen[3] : true, badge: 'dokładnie' });
    s4.body.appendChild(el('h3', 'mz-h', `Linia zasilania ${cur.amp} A (${fmt(lim.cap)} W przy 230 V)`));
    const lt = el('div', 'uk-table');
    const lh = el('div', 'uk-row uk-head uk-l'); ['Obciążenie', 'W / cab.', 'Do 100% obw.', 'Do 80% obw.'].forEach(h => lh.appendChild(el('span', '', h))); lt.appendChild(lh);
    lim.rows.forEach(r => { const row = el('div', 'uk-row uk-l'); [r.label, fmt(r.w, 0) + ' W', r.full + ' cab.', r.safe + ' cab.'].forEach(x => row.appendChild(el('span', '', String(x)))); lt.appendChild(row); });
    s4.body.appendChild(lt);
    s4.body.appendChild(el('small', 'mz-srcline', 'Reguła 80%: obwód obciążaj ciągle do 80% jego mocy. To zasada ogólna, nie dane SQM. Moc przy mniejszej jasności to szacunek liniowy.'));
    s4.body.appendChild(el('h3', 'mz-h', 'Port Ethernet MX30 (cabinet 256 × 64 px = 16 384 px)'));
    const pt = el('div', 'uk-table');
    const ph2 = el('div', 'uk-row uk-head uk-l'); ['Odświeżanie', 'Głębia', 'Pikseli na port', 'Cabinetów'].forEach(h => ph2.appendChild(el('span', '', h))); pt.appendChild(ph2);
    lim.ports.forEach(r => { const row = el('div', 'uk-row uk-l'); [r.fps + ' Hz', typeof r.bits === 'number' ? r.bits + ' bit' : r.bits, fmt(r.px), r.cabs].forEach(x => row.appendChild(el('span', '', String(x)))); pt.appendChild(row); });
    s4.body.appendChild(pt);
    s4.body.appendChild(el('small', 'mz-srcline', 'Wzór z manuala MX30 V1.4.2, sekcja 11: 8 bit: piksele × 24 × fps < 0,95 × 10⁹. Pełny limit tylko przy szerokości ładunku portu co najmniej 192 px (nasze linie mają 256 lub 512 px). Zalecane: 16 cabinetów na port, rezerwa około 60%.'));
    out.appendChild(s4.wrap);

    // ściąga opięcia
    const s5 = acc('Ściąga opięcia (do skopiowania)', { open: wasOpen.length ? !!wasOpen[4] : false, badge: 'tekst' });
    const text = wiringText(plan, cur, cfg);
    const ta = el('textarea', 'mz-msg'); ta.readOnly = true; ta.rows = 12; ta.value = text; ta.id = 'uk-wiring';
    s5.body.appendChild(ta);
    const cb = el('button', 'btn btn-primary', 'Kopiuj ściągę opięcia');
    cb.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(text); cb.textContent = 'Skopiowano'; } catch (e) { ta.focus(); ta.select(); cb.textContent = 'Zaznaczone: Ctrl+C'; }
      setTimeout(() => { cb.textContent = 'Kopiuj ściągę opięcia'; }, 2200);
    });
    s5.body.appendChild(cb);
    out.appendChild(s5.wrap);
  };
  Object.values(inputs).forEach(i => i.addEventListener('input', paint));
  paint();

  const notes = acc('Uwagi i źródła mocy cabinetu', { badge: String(cfg.notes.length + cfg.sources.length) });
  cfg.notes.forEach(n => notes.body.appendChild(el('div', 'mz-miss', n)));
  cfg.sources.forEach(s => { const a = el('a', 'mz-src', s.t); a.href = s.url; a.target = '_blank'; a.rel = 'noopener noreferrer'; notes.body.appendChild(a); });
  root.appendChild(notes.wrap);
}
