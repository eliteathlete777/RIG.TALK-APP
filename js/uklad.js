// RIG TALK — uklad.js: generator układu ekranu 8×8 (wężyk góra–dół), schematy SYGNAŁ i ZASILANIE (po kliknięciu),
// linie D1… i Z1… rozwijane osobno, fazy 1 albo 3, limity, szczegółowe wytyczne i ściąga opięcia.
// Dane wejściowe: content/montaz.json → "uklad". Moc cabinetu: dane producenta INFiLED (do potwierdzenia na etykiecie).

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
const fmt = (n, d = 0) => Number(n).toLocaleString('pl-PL', { maximumFractionDigits: d, minimumFractionDigits: d });

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
    lines.push({ id, cols: lineCols, cabs, startTop: cabs[0].row === 0, endTop: last.row === 0 });
  }
  return lines;
}

/** Cały plan: linie DATA i zasilania, porty, piksele, moc, fazy. */
export function layoutPlan(pIn){
  // Założenie: pobór rośnie liniowo z jasnością (szacunek, nie dane producenta).
  const k = (pIn.bri ?? 100) / 100;
  const p = { ...pIn, wMax: pIn.wMax * k, wAvg: pIn.wAvg * k };
  const { cols, rows } = p;
  const data = buildLines(cols, rows, p.dataK);
  const power = buildLines(cols, rows, p.powerK);
  const cabPx = p.cabPx;
  data.forEach((line, i) => {
    line.main = 2 * i + 1;
    line.backup = 2 * i + 2;
    line.px = line.cabs.length * cabPx;
    line.pct = p.portLimit ? Math.round(line.px / p.portLimit * 100) : null;
  });
  power.forEach(line => {
    const n = line.cabs.length;
    line.n = n;
    line.wMax = n * p.wMax; line.wAvg = n * p.wAvg;
    line.aMax = line.wMax / 230; line.aAvg = line.wAvg / 230;
    line.kg = n * p.kg;
    line.phase = 1;
  });
  const phases = (p.supply === 3 ? [1, 2, 3] : [1]).map(id => ({ id, cabs: 0, lines: [], wAvg: 0, wMax: 0 }));
  [...power].sort((a, b) => b.n - a.n).forEach(line => {
    const target = phases.reduce((m, ph) => (ph.cabs < m.cabs ? ph : m), phases[0]);
    target.cabs += line.n; target.lines.push(line.id);
    target.wAvg += line.wAvg; target.wMax += line.wMax;
    line.phase = target.id;
  });
  phases.forEach(ph => { ph.aAvg = ph.wAvg / 230; ph.aMax = ph.wMax / 230; });
  const total = { cabs: cols * rows, wMax: cols * rows * p.wMax, wAvg: cols * rows * p.wAvg, kg: cols * rows * p.kg };
  total.aMax = total.wMax / 230; total.aAvg = total.wAvg / 230;
  return { data, power, phases, portsNeeded: data.length * 2, total, cols, rows, cabPx, portLimit: p.portLimit, bri: pIn.bri ?? 100, wMaxB: p.wMax, wAvgB: p.wAvg, supply: p.supply === 3 ? 3 : 1, feed: p.feed };
}

/** Dokładne limity: cabinetów na linię zasilania i na port MX30 (wzór z manuala MX30, sekcja 11). */
export function limits(cfg, cur){
  const cap = cur.amp * 230;
  const rowsL = [
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
  return { cap, rows: rowsL, ports };
}

/** Rysunek SVG. mode: 'data' | 'power'. focus: numer linii do podświetlenia (reszta przygaszona). */
export function drawWall(plan, mode, focus = null){
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
    const dim = focus !== null && line.id !== focus;
    const color = COLORS[i % COLORS.length];
    const g = svg('g', { opacity: dim ? 0.18 : 1 });
    line.cabs.forEach(cab => {
      g.appendChild(svg('rect', { x: cx(cab.col) - cw / 2, y: cy(cab.row) - ch / 2, width: cw, height: ch, rx: 2, fill: color, 'fill-opacity': 0.9, stroke: '#0f0f11', 'stroke-width': 1 }));
    });
    if (mode === 'data'){
      g.appendChild(svg('polyline', { points: line.cabs.map(c => `${cx(c.col)},${cy(c.row)}`).join(' '), fill: 'none', stroke: '#ffffff', 'stroke-width': 1.4, 'stroke-opacity': 0.75, 'stroke-linejoin': 'round' }));
      line.cabs.forEach(c => g.appendChild(svg('text', { x: cx(c.col), y: cy(c.row) + 3.5, 'text-anchor': 'middle', 'font-size': 10, 'font-weight': 700, fill: '#ffffff', stroke: '#00000088', 'stroke-width': 0.4 }, String(c.seq))));
      const first = line.cabs[0], last = line.cabs[line.cabs.length - 1];
      const yIn = first.row === 0 ? top - 14 : H - bottom + 14;
      g.appendChild(svg('text', { x: cx(first.col), y: yIn, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 700, fill: '#f2b705' }, `P${line.main}`));
      g.appendChild(svg('text', { x: cx(first.col), y: yIn + (first.row === 0 ? 10 : -10), 'text-anchor': 'middle', 'font-size': 9, fill: '#8fd19e' }, first.row === 0 ? '▼ główny' : '▲ główny'));
      const yEnd = last.row === 0 ? top - 14 : H - bottom + 14;
      if (!(last.col === first.col && last.row === first.row)){
        g.appendChild(svg('text', { x: cx(last.col), y: yEnd, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 700, fill: '#7fc4ff' }, `B${line.backup}`));
        g.appendChild(svg('text', { x: cx(last.col), y: yEnd + (last.row === 0 ? 10 : -10), 'text-anchor': 'middle', 'font-size': 9, fill: '#7fc4ff' }, last.row === 0 ? '▼ zapas' : '▲ zapas'));
      }
    } else {
      line.cabs.forEach(c => g.appendChild(svg('text', { x: cx(c.col), y: cy(c.row) + 3.5, 'text-anchor': 'middle', 'font-size': 9, fill: '#ffffff', 'fill-opacity': 0.9 }, `Z${line.id}·L${line.phase}`)));
      g.appendChild(svg('text', { x: cx(line.cabs[0].col), y: top - 14, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 700, fill: '#f2b705' }, `Z${line.id}`));
    }
    root.appendChild(g);
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

const cabName = c => `kol. ${c.col + 1}, rząd ${c.row + 1}`;

/** Szczegółowe wytyczne w podrozdziałach: { title, sub, items[] }. */
export function guidelines(plan, p, cfg){
  const d = plan.data, pw = plan.power;
  const secs = [];
  const maxPct = Math.max(...d.map(l => l.pct ?? 0));
  const spare = 10 - plan.portsNeeded;

  secs.push({ title: '1. Sygnał i porty', sub: `${d.length} linie, porty główne ${d.map(l => l.main).join(', ')}`, items: [
    `${d.length} linie DATA po ${d[0].cabs.length} cabinetów (${fmt(d[0].px)} px na linię).`,
    `Porty główne: ${d.map(l => 'P' + l.main).join(', ')}. Porty zapasowe: ${d.map(l => 'B' + l.backup).join(', ')}. Razem ${plan.portsNeeded} z 10 portów MX30${spare >= 0 ? `, wolne ${spare}` : ', ZA MAŁO PORTÓW'}.`,
    `Obciążenie portu: ${maxPct}% limitu ${fmt(plan.portLimit)} px (8 bit, 60 Hz). Rezerwa ${100 - maxPct}%.`,
    'Porty zapasowe działają przez Sequential Backup: port 2 zapasowy dla portu 1, port 4 dla portu 3 itd. Dlatego linie główne siedzą na portach nieparzystych.',
    'Swift Layout z panelu MX30 zakłada kolejne porty (1, 2, 3…), więc przy portach zapasowych ekran buduj w VMP: Layout → port na dole → klikaj cabinety w kolejności kabla.',
    'W VMP V1.5.0 nowy projekt offline dopuszcza 512 cabinetów na port. Starsze projekty mają limit 32 (16 mieści się w obu).',
    'Szerokość ładunku portu: 256 px na kolumnę, więc linia ma co najmniej 256 px. Pełny limit portu działa od 192 px szerokości.'] });

  secs.push({ title: '2. Kable i trasa', sub: d.every(l => l.startTop && l.endTop) ? 'początek i koniec linii u góry' : 'koniec linii na dole', items: [
    d.every(l => l.startTop && l.endTop)
      ? 'Każda linia startuje i kończy się u góry ekranu. Kabel główny i zapasowy wchodzą w tym samym miejscu, więc trasa jest krótka i jedna.'
      : 'Przy nieparzystej liczbie kolumn na linię koniec linii wypada na dole. Kabel zapasowy musi dojść od dołu. Rozważ 2 albo 4 kolumny na linię.',
    `Potrzebujesz ${plan.portsNeeded} przebiegów Ethernet od MX30 do ekranu (${d.length} główne + ${d.length} zapasowe).`,
    'Lista SQM ma tylko 1 patchcord RJ45, po 2 krótkie Ethercon (0,8 m F–F i 1,4 m M–M) i po 2 PowerCon (0,8 m F–F i 1,2 m M–M). To za mało na 8 przebiegów. Zapytaj SQM, skąd wziąć dodatkowe kable i jak cabinety łączą się między sobą (złącza w belkach czy kable).',
    'Prowadź DATA i zasilanie osobno. Oznacz oba końce każdego kabla (P1, B2…) taśmą papierową.',
    'Trasa kabli na wizualizacji SQM biegnie po lewej stronie bryły stoiska (żółta linia). Zmierz długość od procesora do pierwszych cabinetów na miejscu.'] });

  secs.push({ title: '3. Ustawienia w VMP i MX30', sub: 'canvas, topologia, backup, jasność', items: [
    'Canvas 2048 × 512, X 0, Y 0. Cabinet 256 × 64 (custom). Tryb All-In-One.',
    ...d.map(l => `D${l.id}: port ${l.main}, kolumny ${l.cols[0] + 1}–${l.cols[l.cols.length - 1] + 1}, start u góry kolumny ${l.cols[0] + 1}, ${l.cabs.length} cabinetów.`),
    'Backup → Ethernet Backup → Sequential Backup. Potem Verify Primary i Verify Backup dla każdej pary.',
    `Jasność startowa ${p.bri}% (Screen Settings → Image Quality albo panel MX30, potem Save to RV Card).`,
    'Light up slowly włączone, Indicator włączony, No data signal: Blackout.'] });

  secs.push({ title: '4. Test krok po kroku', sub: 'linia po linii', items: [
    'Najpierw wszystko wyłączone: zasilanie cabinetów OFF, MX30 włączony, VMP połączony.',
    ...d.map(l => `Krok ${l.id}: włącz zasilanie ${l.cols.map(c => 'kol. ' + (c + 1)).join(' i ')}. Test Pattern na linii D${l.id}, Mapping włączony: pierwszy cabinet pokazuje port ${l.main}.`),
    'Po każdej linii sprawdź Indicator (zielony). Gdy któryś cabinet jest szary, szukaj w kablu DATA przed nim.',
    'Verify Primary: odłącz zapasowy i sprawdź, czy główny działa. Verify Backup: odłącz główny i sprawdź zapasowy. Zrób to po jednej linii.',
    'Na końcu wszystkie linie razem: test siatki 2048 × 512, potem koło i kolory. Mapping wyłącz.'] });

  const phaseTxt = plan.supply === 3
    ? plan.phases.map(ph => `L${ph.id}: ${ph.cabs} cab. (linie ${ph.lines.map(i => 'Z' + i).join(', ') || 'brak'}), ${fmt(ph.aAvg, 1)} A średnio, ${fmt(ph.aMax, 1)} A max`)
    : [`Jedna faza: ${plan.total.cabs} cab., ${fmt(plan.total.aAvg, 1)} A średnio, ${fmt(plan.total.aMax, 1)} A max`];
  const over = pw.filter(l => l.aMax > p.amp);
  secs.push({ title: '5. Zasilanie i fazy', sub: plan.supply === 3 ? 'trzy fazy 230/400 V' : 'jedna faza 230 V', items: [
    `${pw.length} linie zasilania po ${pw[0].n} cabinetów, obwód ${p.amp} A na linię.`,
    `Przy jasności ${p.bri}%: średnio ${fmt(plan.wAvgB)} W na cabinet, max ${fmt(plan.wMaxB)} W. Linia ${pw[0].n} cab.: ${fmt(pw[0].aAvg, 1)} A średnio, ${fmt(pw[0].aMax, 1)} A max.`,
    ...phaseTxt,
    ...(plan.supply === 3 && Math.max(...plan.phases.map(f => f.cabs)) - Math.min(...plan.phases.map(f => f.cabs)) > 8
      ? [`Nierównowaga faz: najcięższa faza ma ${Math.max(...plan.phases.map(f => f.cabs))} cab., najlżejsza ${Math.min(...plan.phases.map(f => f.cabs))}. Równiej wychodzi przy 1 kolumnie na linię zasilania (8 linii po 8 cab. daje fazy 24, 24 i 16 cab.), ale to 8 wyłączników i 8 przebiegów zasilania.`]
      : []),
    plan.supply === 3
      ? `Zasada: rozłóż linie równo na L1, L2, L3. Nierównowaga fazowa zostaje w przewodzie neutralnym. Dopuszczalna na fazę: ${plan.feed} A (wejście racka 32 A, potwierdź).`
      : 'Wszystko na jednej fazie. Jeśli hala daje trzy fazy, rozłóż linie na L1, L2, L3, aby obciążyć fazy równo.',
    over.length
      ? `UWAGA: przy pełnej bieli ${over.length} z ${pw.length} linii przekracza ${p.amp} A (do ${fmt(Math.max(...pw.map(l => l.aMax)), 1)} A). Ogranicz jasność i nie wyświetlaj pełnej bieli na całym ekranie.`
      : `Przy pełnej bieli i jasności ${p.bri}% każda linia mieści się w ${p.amp} A.`,
    'Lista SQM ma 2 kable zasilające 230 V → PowerCon TRUE1 16 A 10 m. Plan SQM zakłada więc prawdopodobnie 2 linie. Na 4 linie potrzebujesz 4 takich kabli (zapytaj SQM).',
    'Rack z listy SQM: wejście 32 A, wyjścia 2 × 16 A i 6 × 230 V. Rodzaj wejścia (jedna czy trzy fazy) sprawdź na urządzeniu.'] });

  secs.push({ title: '6. Zabezpieczenia i ryzyka prądowe', sub: 'zasady ogólne, potwierdź z elektrykiem', items: [
    'Uprawniony elektryk podłącza rack do skrzyni hali. Wyłączniki zasilania cabinetów w pozycji OFF przy podpinaniu.',
    'Obwód obciążaj ciągle do około 80% jego prądu (zasada ogólna). Dla 16 A to około 12,8 A.',
    'Włączaj zasilanie linia po linii, aby ograniczyć prąd rozruchowy. Funkcja Light up slowly zapala ekran powoli.',
    'Każda linia ma osobny wyłącznik 16 A. Nie łącz dwóch linii do jednego gniazda.',
    'Zmierz prąd miernikiem cęgowym na każdej linii przy teście (średnio i przy jasnym materiale). Wpisz wynik do notatek.',
    'Dane mocy cabinetu są od producenta (INFiLED), a przy 70% jasności to szacunek liniowy.'] });

  secs.push({ title: '7. Przekazanie klientowi', sub: 'co pokazać i zapisać', items: [
    `Pokaż tabelę portów: ${d.map(l => `P${l.main}/B${l.backup}`).join(', ')}.`,
    'Zapisz zdjęcia: tabela portów, ekran główny MX30, topologia w VMP, oznaczone kable.',
    'Zapisz preset w VMP i projekt .nprj (Project → Export). Dwie kopie: laptop i pendrive.',
    'Zablokuj przyciski MX30 (pokrętło + BACK przez 5 s). Powiedz: Please don’t change the processor settings.',
    'Podaj klientowi kolejność włączania: zasilanie cabinetów, MX30, laptop, Resolume. Wyłączanie odwrotnie.'] });
  return secs;
}

/** Ściąga opięcia jako zwykły tekst do notatek. */
export function wiringText(plan, cur){
  const L = [];
  L.push('ŚCIĄGA OPIĘCIA · EKRAN LED 8 × 4 m · 64 cabinety · jasność ' + cur.bri + '%');
  L.push('');
  L.push('SYGNAŁ (wężyk góra–dół, widok od przodu)');
  plan.data.forEach(l => L.push(`D${l.id}: kolumny ${l.cols[0] + 1}–${l.cols[l.cols.length - 1] + 1}, ${l.cabs.length} cab., port główny P${l.main}, zapasowy B${l.backup}, ${l.px} px (${l.pct}% portu)`));
  L.push('VMP: Backup → Ethernet Backup → Sequential Backup (1⇌2, 3⇌4, 5⇌6, 7⇌8), potem Verify Primary i Verify Backup.');
  L.push('');
  L.push('ZASILANIE (' + (plan.supply === 3 ? 'trzy fazy' : 'jedna faza') + ')');
  plan.power.forEach(l => L.push(`Z${l.id}: kolumny ${l.cols[0] + 1}–${l.cols[l.cols.length - 1] + 1}, ${l.n} cab., faza L${l.phase}, średnio ${l.wAvg.toFixed(0)} W (${l.aAvg.toFixed(1)} A), max ${l.wMax.toFixed(0)} W (${l.aMax.toFixed(1)} A)`));
  plan.phases.forEach(ph => L.push(`Faza L${ph.id}: ${ph.cabs} cab., średnio ${ph.aAvg.toFixed(1)} A, max ${ph.aMax.toFixed(1)} A`));
  L.push(`Razem: średnio ${(plan.total.wAvg / 1000).toFixed(1)} kW, max ${(plan.total.wMax / 1000).toFixed(1)} kW przy ${cur.bri}% jasności.`);
  return L.join('\n');
}

function table(headers, rows, cls = 'uk-l'){
  const t = el('div', 'uk-table');
  const h = el('div', `uk-row uk-head ${cls}`);
  headers.forEach(x => h.appendChild(el('span', '', x)));
  t.appendChild(h);
  rows.forEach(r => {
    const row = el('div', `uk-row ${cls}`);
    r.forEach(x => row.appendChild(el('span', '', String(x))));
    t.appendChild(row);
  });
  return t;
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
    ['supply', 'Zasilanie: fazy', [['1', '1 faza (230 V)'], ['3', '3 fazy (230/400 V)']]],
    ['feed', 'Prąd na fazę z racka (A)', null],
    ['bri', 'Jasność (%)', null],
    ['wMax', 'Moc max cabinetu (W)', null],
    ['wAvg', 'Moc średnia cabinetu (W)', null],
    ['kg', 'Waga cabinetu (kg)', null],
    ['amp', 'Obwód linii (A)', null],
  ];
  const inputs = {};
  fields.forEach(([key, label, options]) => {
    const wrap = el('label', 'mz-field');
    wrap.appendChild(el('span', '', label));
    let input;
    if (options){
      input = el('select');
      options.forEach(o => { const [val, text] = Array.isArray(o) ? o : [o, o]; const opt = el('option', '', String(text)); opt.value = String(val); input.appendChild(opt); });
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
    const wasOpen = [...out.querySelectorAll(':scope > details.mz-acc')].map(d => d.open);
    out.innerHTML = '';
    const top = (title, index, opts) => acc(title, { ...opts, open: wasOpen.length ? !!wasOpen[index] : (opts.open ?? false) });

    // streszczenie
    const sum = el('div', 'mz-result frame uk-sum');
    const sline = (label, value) => { const r = el('div', 'mz-line'); r.append(el('span', '', label), el('b', '', value)); sum.appendChild(r); };
    sline('Sygnał', `${plan.data.length} linie × ${plan.data[0].cabs.length} cab. · P${plan.data.map(l => l.main).join(',')} + B${plan.data.map(l => l.backup).join(',')}`);
    sline(`Pobór przy ${cur.bri}%`, `${fmt(plan.total.wAvg / 1000, 1)} kW śr. · ${fmt(plan.total.wMax / 1000, 1)} kW max`);
    sline('Zasilanie', `${plan.power.length} linie × ${plan.power[0].n} cab. · ${plan.supply === 3 ? '3 fazy' : '1 faza'}`);
    sline('Prąd na linię', `${fmt(plan.power[0].aAvg, 1)} A śr. · ${fmt(plan.power[0].aMax, 1)} A max (obwód ${cur.amp} A)`);
    out.appendChild(sum);
    out.appendChild(expandBar(out));

    // 1. SYGNAŁ
    const s1 = top('Sygnał: porty główne i zapasowe', 0, { badge: `${plan.data.length} linie`, sub: 'tabela portów, schemat i każda linia osobno', open: true });
    s1.body.appendChild(table(['Linia', 'Kolumny', 'Cabinety', 'Port', 'Zapas', 'Piksele', '% portu'],
      plan.data.map(l => [`D${l.id}`, `${l.cols[0] + 1}–${l.cols[l.cols.length - 1] + 1}`, l.cabs.length, `P${l.main}`, `B${l.backup}`, fmt(l.px), `${l.pct}%`]), 'uk-s'));
    const sg = acc('Schemat sygnału (rozwiń)', { badge: 'grafika', sub: 'wężyk góra–dół, porty u góry ekranu' });
    const dataSvg = drawWall(plan, 'data');
    const dBox = el('div', 'uk-svg'); dBox.appendChild(dataSvg); sg.body.appendChild(dBox);
    const dBtn = el('button', 'btn', 'Zapisz grafikę sygnału (PNG)');
    dBtn.addEventListener('click', () => toPng(dataSvg, `uklad-sygnal-${cur.dataK}kol.png`));
    sg.body.appendChild(dBtn);
    s1.body.appendChild(sg.wrap);
    plan.data.forEach((l, i) => {
      const la = acc(`Linia D${l.id}: port ${l.main} / zapas ${l.backup}`, { badge: `${l.cabs.length} cab.`, color: COLORS[i % COLORS.length], sub: `kolumny ${l.cols[0] + 1}–${l.cols[l.cols.length - 1] + 1}, ${fmt(l.px)} px, ${l.pct}% portu` });
      const box = el('div', 'uk-svg'); box.appendChild(drawWall(plan, 'data', l.id)); la.body.appendChild(box);
      const ul = el('ul', 'mz-list');
      ul.appendChild(el('li', '', `Start: ${l.startTop ? 'góra' : 'dół'} kolumny ${l.cols[0] + 1}. Koniec: ${l.endTop ? 'góra' : 'dół'} kolumny ${l.cols[l.cols.length - 1] + 1}.`));
      ul.appendChild(el('li', '', `Port główny P${l.main} → pierwszy cabinet. Zapasowy B${l.backup} → ostatni cabinet (pętla, potwierdź z SQM).`));
      ul.appendChild(el('li', '', `Kolejność: ${l.cabs.filter((c, idx) => idx === 0 || idx === l.cabs.length - 1 || idx % 8 === 7 || idx % 8 === 0).map(c => `${c.seq} (${cabName(c)})`).join(' → ')}.`));
      ul.appendChild(el('li', '', `Obciążenie: ${l.cabs.length} × ${fmt(cfg.cabPx)} px = ${fmt(l.px)} px, ${l.pct}% limitu portu.`));
      la.body.appendChild(ul);
      s1.body.appendChild(la.wrap);
    });
    out.appendChild(s1.wrap);

    // 2. ZASILANIE
    const s2 = top('Zasilanie: linie, fazy i pobór mocy', 1, { badge: `${plan.power.length} linie`, sub: `${plan.supply === 3 ? 'trzy fazy' : 'jedna faza'}, ${cur.bri}% jasności`, open: true });
    s2.body.appendChild(table(['Linia', 'Faza', 'Cab.', 'Moc śr.', 'Moc max', 'A śr.', 'A max'],
      plan.power.map(l => [`Z${l.id}`, `L${l.phase}`, l.n, `${fmt(l.wAvg)} W`, `${fmt(l.wMax)} W`, `${fmt(l.aAvg, 1)}`, `${fmt(l.aMax, 1)}`]), 'uk-p'));
    const sp = acc('Schemat zasilania (rozwiń)', { badge: 'grafika', sub: 'kolory = linie, L1–L3 = fazy' });
    const pSvg = drawWall(plan, 'power');
    const pBox = el('div', 'uk-svg'); pBox.appendChild(pSvg); sp.body.appendChild(pBox);
    const pBtn = el('button', 'btn', 'Zapisz grafikę zasilania (PNG)');
    pBtn.addEventListener('click', () => toPng(pSvg, `uklad-zasilanie-${cur.powerK}kol.png`));
    sp.body.appendChild(pBtn);
    s2.body.appendChild(sp.wrap);
    plan.power.forEach((l, i) => {
      const bad = l.aMax > cur.amp;
      const la = acc(`Linia zasilania Z${l.id} · faza L${l.phase}`, { badge: `${l.n} cab.`, color: COLORS[i % COLORS.length], tone: bad ? 'bad' : '', sub: `${fmt(l.aAvg, 1)} A śr. · ${fmt(l.aMax, 1)} A max z ${cur.amp} A` });
      const box = el('div', 'uk-svg'); box.appendChild(drawWall(plan, 'power', l.id)); la.body.appendChild(box);
      const ul = el('ul', 'mz-list');
      ul.appendChild(el('li', '', `Kolumny ${l.cols[0] + 1}–${l.cols[l.cols.length - 1] + 1}, ${l.n} cabinetów, waga ${fmt(l.kg, 0)} kg.`));
      ul.appendChild(el('li', '', `Moc: ${fmt(l.wAvg)} W średnio, ${fmt(l.wMax)} W max (pełna biel) przy ${cur.bri}% jasności.`));
      ul.appendChild(el('li', '', `Prąd: ${fmt(l.aAvg, 1)} A średnio, ${fmt(l.aMax, 1)} A max. Obwód ${cur.amp} A: ${bad ? 'PRZEKROCZONY przy pełnej bieli' : 'wystarcza także przy pełnej bieli'}.`));
      ul.appendChild(el('li', '', `Wyłącznik: ${cur.amp} A, osobny dla tej linii. Faza L${l.phase}${plan.supply === 3 ? '' : ' (jedna faza)'}.`));
      la.body.appendChild(ul);
      s2.body.appendChild(la.wrap);
    });
    s2.body.appendChild(table(['Faza', 'Linie', 'Cab.', 'A średnio', 'A max', 'Limit'],
      plan.phases.map(ph => [`L${ph.id}`, ph.lines.map(i => 'Z' + i).join('+') || '—', ph.cabs, fmt(ph.aAvg, 1), fmt(ph.aMax, 1), `${plan.feed} A`]), 'uk-f'));
    const tot = el('div', 'mz-result frame');
    const tline = (label, value) => { const r = el('div', 'mz-line'); r.append(el('span', '', label), el('b', '', value)); tot.appendChild(r); };
    tline(`Cały ekran, średnio (${cur.bri}%)`, `${fmt(plan.total.wAvg / 1000, 1)} kW · ${fmt(plan.total.aAvg, 1)} A przy 230 V`);
    tline(`Cały ekran, maksimum (${cur.bri}%)`, `${fmt(plan.total.wMax / 1000, 1)} kW · ${fmt(plan.total.aMax, 1)} A przy 230 V`);
    tline('Waga cabinetów', `${fmt(plan.total.kg)} kg (bez belek i kabli)`);
    tline('Rack SQM', '32 A we, 2 × 16 A + 6 × 230 V wy');
    s2.body.appendChild(tot);
    out.appendChild(s2.wrap);

    // 3. WYTYCZNE (szczegółowe)
    const s3 = top('Wytyczne wynikające z tego układu', 2, { badge: '7 podrozdziałów', sub: 'sygnał, kable, VMP, test, zasilanie, zabezpieczenia, przekazanie' });
    guidelines(plan, cur, cfg).forEach(sec => {
      const g = acc(sec.title, { badge: String(sec.items.length), sub: sec.sub });
      const ol = el('ol', 'mz-steps');
      sec.items.forEach(t => ol.appendChild(el('li', '', t)));
      g.body.appendChild(ol);
      s3.body.appendChild(g.wrap);
    });
    out.appendChild(s3.wrap);

    // 4. LIMITY
    const lim = limits(cfg, cur);
    const s4 = top('Limity: ile cabinetów na linię i na port', 3, { badge: 'dokładnie', sub: `linia ${cur.amp} A i port MX30` });
    const l1 = acc(`Linia zasilania ${cur.amp} A (${fmt(lim.cap)} W przy 230 V)`, { open: true, badge: '3 przypadki' });
    l1.body.appendChild(table(['Obciążenie', 'W / cab.', 'Do 100% obw.', 'Do 80% obw.'], lim.rows.map(r => [r.label, fmt(r.w, 0) + ' W', r.full + ' cab.', r.safe + ' cab.'])));
    l1.body.appendChild(el('small', 'mz-srcline', 'Reguła 80%: obwód obciążaj ciągle do 80% jego mocy. To zasada ogólna, nie dane SQM. Moc przy mniejszej jasności to szacunek liniowy.'));
    s4.body.appendChild(l1.wrap);
    const l2 = acc('Port Ethernet MX30 (cabinet 256 × 64 px = 16 384 px)', { open: true, badge: `${lim.ports.length} wariantów` });
    l2.body.appendChild(table(['Odświeżanie', 'Głębia', 'Pikseli na port', 'Cabinetów'], lim.ports.map(r => [r.fps + ' Hz', typeof r.bits === 'number' ? r.bits + ' bit' : r.bits, fmt(r.px), r.cabs])));
    l2.body.appendChild(el('small', 'mz-srcline', 'Wzór z manuala MX30 V1.4.2, sekcja 11: 8 bit: piksele × 24 × fps < 0,95 × 10⁹. Pełny limit przy szerokości ładunku portu co najmniej 192 px. Zalecane: 16 cabinetów na port.'));
    s4.body.appendChild(l2.wrap);
    out.appendChild(s4.wrap);

    // 5. STANDARD ZASILANIA
    const s5 = top('Standard zasilania: co wynika z dokumentów', 4, { badge: String(cfg.standard.length), sub: 'skrzynia 60 kW, rack 32 A, kable 230 V' });
    cfg.standard.forEach(row => {
      const r = el('div', 'mz-fact ' + (row.status || 'ok'));
      r.append(el('span', 'mz-fact-label', row.label), el('b', '', row.value), el('small', '', 'Źródło: ' + row.src));
      s5.body.appendChild(r);
    });
    out.appendChild(s5.wrap);

    // 6. ŚCIĄGA
    const s6 = top('Ściąga opięcia (do skopiowania)', 5, { badge: 'tekst', sub: 'sygnał, zasilanie, fazy w notatkach' });
    const text = wiringText(plan, cur);
    const ta = el('textarea', 'mz-msg'); ta.readOnly = true; ta.rows = 12; ta.value = text; ta.id = 'uk-wiring';
    s6.body.appendChild(ta);
    const cb = el('button', 'btn btn-primary', 'Kopiuj ściągę opięcia');
    cb.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(text); cb.textContent = 'Skopiowano'; } catch (e) { ta.focus(); ta.select(); cb.textContent = 'Zaznaczone: Ctrl+C'; }
      setTimeout(() => { cb.textContent = 'Kopiuj ściągę opięcia'; }, 2200);
    });
    s6.body.appendChild(cb);
    out.appendChild(s6.wrap);
  };
  Object.values(inputs).forEach(i => i.addEventListener('input', paint));
  paint();

  const notes = acc('Uwagi i źródła mocy cabinetu', { badge: String(cfg.notes.length + cfg.sources.length), sub: 'skąd są liczby' });
  cfg.notes.forEach(n => notes.body.appendChild(el('div', 'mz-miss', n)));
  cfg.sources.forEach(s => { const a = el('a', 'mz-src', s.t); a.href = s.url; a.target = '_blank'; a.rel = 'noopener noreferrer'; notes.body.appendChild(a); });
  root.appendChild(notes.wrap);
}
