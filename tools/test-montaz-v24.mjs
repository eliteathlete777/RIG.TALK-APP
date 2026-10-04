// Test v24: wybór rozdziału montażu, ściąga RJ45, kalkulator, komplet — Playwright (Node).
// Uruchomienie: node tools/test-montaz-v24.mjs  (serwer: npx http-server -p 5179)
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');

const ROOT = process.env.ROOT || 'http://127.0.0.1:5179';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }).catch(() => chromium.launch());
const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
const ok = (cond, msg) => { if (!cond) { console.error('FAIL:', msg); process.exitCode = 1; } else console.log('ok  -', msg); };

await page.goto(ROOT, { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.locator('[data-mode-select="assembly"]').click();
await page.waitForSelector('.mm-chip');
ok(await page.locator('.mm-chip').count() === 19, 'Mapa: 19 rozdziałów w 6 grupach');
ok(await page.locator('.mm-branch').count() === 6, 'Mapa: 6 grup');
ok(await page.locator('.mz-dock-btn').count() === 4, 'Dolny pasek: 4 przyciski');
await page.locator('[data-view="tematy"]').click();
await page.waitForSelector('.mz-tile');
ok(await page.locator('.mz-tile').count() === 19, 'Tematy: 19 kafli');
await page.locator('[data-view="kolejnosc"]').click();
await page.waitForSelector('.mz-step-row');
ok(await page.locator('.mz-step-row').count() === 19 && await page.locator('.mz-stage').count() === 7, 'Kolejność: 7 etapów, 19 rozdziałów');
ok((await page.locator('.mz-stage-h b').last().innerText()).toLowerCase().includes('rozładunek'), 'Kompletacja na końcu kolejności');
await page.locator('[data-view="tematy"]').click();
ok(!(await page.locator('#bottomNav').isVisible()), 'montaż bez nawigacji angielskiego');

// komplet
await page.locator('[data-chapter="komplet"]').click();
ok(await page.locator('.check-row').count() === 17, '17 pozycji kompletacji');
await page.locator('.check-row input').first().check();
await page.reload({ waitUntil: 'networkidle' });
await page.locator('[data-mode-select="assembly"]').click();
await page.locator('[data-chapter="komplet"]').waitFor();
ok((await page.locator('[data-chapter="komplet"] .mz-en-t').innerText()).includes('1/17'), 'postęp kompletacji 1/17 po reloadzie');

// RJ45
await page.locator('[data-chapter="rj45"]').click();
ok(await page.locator('.rj-pin').count() === 8, 'RJ45: 8 pinów');
const order = await page.locator('.rj-order li').allInnerTexts();
ok(order[0] === 'biało-pomarańczowy' && order[3] === 'niebieski' && order[7] === 'brązowy', 'RJ45: kolejność T568B');

// kalkulator
await page.locator('.mz-back').click();
await page.locator('[data-chapter="uklad"]').click();
await page.waitForSelector('.mz-result');
let text = await page.locator('.mz-result').last().innerText();
ok(text.includes('2048 × 512'), 'kalkulator: 2048 × 512 px');
ok(text.includes('256 × 64'), 'kalkulator: cabinet 256 × 64 px');
ok(text.includes('64 cabinetów'), 'kalkulator: 64 cabinety');
ok(text.includes('BRAK DANYCH'), 'kalkulator: brak mocy oznaczony');
ok(text.replace(/\u00a0|\u202f/g, ' ').includes('659 722'), 'kalkulator: limit portu 659 722 px (wzór z manuala MX30)');
ok(text.includes('Swift Layout') && text.includes('2 × 32'), 'kalkulator: Swift Layout 2 × 32');
await page.fill('#calc-watt', '150');
text = await page.locator('.mz-result').last().innerText();
ok(text.includes('9,60 kW') || text.includes('9.60 kW'), 'kalkulator: 64 × 150 W = 9,6 kW');
ok(text.includes('3 × 16 A'), 'kalkulator: linie 16 A');

// przygotuj wcześniej + wideo
await page.locator('.mz-back').click();
await page.locator('[data-chapter="przed"]').click();
await page.waitForSelector('.mz-acc');
ok(await page.locator('.mz-acc').count() >= 5, 'Przygotuj: rozwijane grupy');
ok((await page.locator('#przed-text').inputValue()).includes('.rcfgx'), 'Przygotuj: lista do skopiowania zawiera .rcfgx');
await page.locator('.mz-back').click();
await page.locator('[data-chapter="wideo"]').click();
await page.waitForSelector('.mz-acc');
ok((await page.locator('#stoiskoRoot').textContent()).includes('2048 × 1024'), 'Wideo: wariant 2048 × 1024');
ok(await page.locator('.mz-file').count() === 3, 'Wideo: 3 pliki testowe');
await page.locator('.mz-back').click();

// parametry gotowce
await page.locator('[data-chapter="param"]').click();
await page.waitForSelector('.pr-item');
ok((await page.locator('#param-text').inputValue()).includes('2048 × 1080'), 'Parametry: wariant A 2048 × 1080');
await page.locator('[data-variant="b"]').click();
await page.waitForSelector('.pr-item');
ok((await page.locator('#param-text').inputValue()).includes('3840 × 2160'), 'Parametry: wariant B 3840 × 2160');
ok((await page.locator('#param-text').inputValue()).includes('Sequential Backup'), 'Parametry: Sequential Backup w VMP');
// v32: drill-down ścieżek kliknięć
const txt = await page.locator('#param-text').inputValue();
ok(txt.includes('Wybierz częstotliwość odświeżania') && txt.includes('Skala i układ'), 'Parametry: ścieżki Windows (odświeżanie, skala) w tekście');
ok(await page.locator('.pr-item').count() >= 40, 'Parametry: >= 40 rozwijanych pozycji');
ok(await page.locator('.pr-sub').count() === 5, 'Parametry: zasilanie rozwinięte na 5 podopcji');
const rozdz = page.locator('.pr-item', { hasText: 'Rozdzielczość' }).first();
await rozdz.locator('summary').first().click();
ok((await rozdz.innerText()).includes('Zachowaj zmiany'), 'Rozdzielczość: otwiera się do kroków (Zachowaj zmiany)');
ok(await page.locator('.pr-multi .mz-acc').count() >= 5, 'Sekcja: gdzie ustawiasz to samo w kilku miejscach');
ok((await page.locator('.pr-multi').textContent()).includes('Skala → 100%'), 'Skalowanie: jedno miejsce (Windows)');
await page.locator('.mz-back').click();
// v32: szukajka
await page.waitForSelector('#mzSearch');
await page.fill('#mzSearch', 'usypianie');
ok(await page.locator('.mz-search-hit').count() === 0, 'Szukajka: brak wyniku dla bzdury');
await page.fill('#mzSearch', 'uspienie');
await page.waitForSelector('.mz-search-hit');
ok(await page.locator('.mz-search-hit').count() >= 1, 'Szukajka: uspienie (bez polskich znaków) znajduje wynik');
await page.locator('.mz-search-hit').first().click();
await page.waitForSelector('.pr-item');
ok(await page.locator('.pr-item[open]').count() >= 1, 'Szukajka: otwiera parametr w rozdziale Parametry');
await page.locator('.mz-back').click();

// generator układu
await page.locator('[data-chapter="uklad"]').click();
await page.waitForSelector('.uk-out details', { state: 'attached' });
ok(await page.locator('.uk-svg').count() === 10, 'Układ: 10 schematów (2 całe + 8 linii) w rozwijanych sekcjach');
ok(await page.locator('.uk-out > details.mz-acc').count() === 6, 'Układ: 6 podrozdziałów');
ok(await page.locator('.mz-summary').count() === 1 && await page.locator('.mz-outline-btn').count() >= 6, 'Układ: streszczenie i plan rozdziału');
let uk = (await page.locator('.uk-out').textContent()).replace(/\u00a0|\u202f/g, ' ');
ok(uk.includes('P7') && uk.includes('B8'), 'Układ: porty główne 1,3,5,7 i zapasowe 2,4,6,8');
ok(uk.includes('262 144'), 'Układ: 16 cabinetów = 262 144 px na linię');
ok(uk.includes('986 W'), 'Układ: 16 × 88 W × 70% = 986 W na linię zasilania');
await page.selectOption('#uk-dataK', '4');
uk = (await page.locator('.uk-out').textContent()).replace(/\u00a0|\u202f/g, ' ');
ok(uk.includes('P3') && !uk.includes('P7'), 'Układ: po 4 kolumny to 2 linie, porty 1 i 3');
await page.selectOption('#uk-dataK', '2');
const lim = (await page.locator('.uk-out').textContent()).replace(/\u00a0|\u202f/g, ' ');
ok(lim.includes('659 722') && lim.includes('40'), 'Limity: port 60 Hz 8 bit = 659 722 px = 40 cabinetów');
ok((await page.locator('#uk-wiring').inputValue()).includes('P7'), 'Ściąga opięcia zawiera porty');

// niespodzianki + zwroty
await page.locator('.mz-back').click();
await page.locator('[data-chapter="niespodzianki"]').click();
ok(await page.locator('.mz-risk').count() === 19, '19 ryzyk w kategoriach');
await page.locator('.mz-back').click();

// Od A do Z + słówka
await page.locator('[data-chapter="az"]').click();
await page.waitForSelector('.az-phase');
ok(await page.locator('.az-phase').count() === 9, 'A do Z: 9 faz');
ok((await page.locator('#az-msg').inputValue()).includes('login i hasło'), 'A do Z: wiadomość do SQM z prośbą o hasło');
await page.locator('[data-phase="p4"] .stage-head').click();
ok((await page.locator('[data-phase="p4"]').innerText()).includes('Enter Offline Mode') === false && (await page.locator('[data-phase="p4"]').innerText()).includes('Default Project'), 'A do Z: faza VMP otwarta');
ok(await page.locator('.mz-word').count() >= 30, 'A do Z: lista słówek');
await page.locator('.mz-hide').first().click();
ok(await page.locator('.mz-words.hide-en').count() === 1, 'słówka: ukryj angielski');
await page.locator('.mz-back').click();
await page.locator('[data-chapter="slowka"]').click();
await page.waitForSelector('.mz-words');
ok(await page.locator('.mz-words').count() >= 8, 'Słówka: grupy list');
await page.locator('.mz-back').click();

// Plany
await page.locator('[data-chapter="plany"]').click();
await page.waitForSelector('.plan-card');
ok(await page.locator('.plan-card').count() === 35, 'Plany: 35 rysunków (29 z SQM + 6 naszych schematów)');
await page.locator('.mz-expand .btn').first().click();
await page.locator('[data-plan="tw-12"]').click();
await page.waitForSelector('.plan-img');
ok((await page.locator('.plan-title').innerText()).includes('Elewacja A'), 'Plany: podgląd Elewacja A');
await page.locator('.plan-tools button', { hasText: '+' }).click();
ok((await page.locator('.plan-zoom').innerText()) === '150%', 'Plany: zoom 150%');
await page.locator('.plan-bar .plan-btn').click();
await page.locator('.mz-back').click();
await page.locator('[data-chapter="mechanika"]').click();
await page.waitForSelector('.plan-link');
ok(await page.locator('.plan-link').count() === 5, 'Mechanika: 5 linków do planów');
await page.locator('.mz-back').click();

// VMP
await page.locator('[data-chapter="vmp"]').click();
await page.waitForSelector('.mz-acc');
ok((await page.locator('#stoiskoRoot').textContent()).includes('Enter Offline Mode'), 'VMP: Offline Mode');
await page.locator('.mz-back').click();
// MX30 panel i Resolume
await page.locator('[data-chapter="mx30panel"]').click();
await page.waitForSelector('.mz-acc');
ok((await page.locator('#stoiskoRoot').textContent()).includes('Swift Layout'), 'MX30 panel: Swift Layout');
ok(await page.locator('.mz-src').count() === 3, 'MX30 panel: 3 źródła');
await page.locator('.mz-back').click();
await page.locator('[data-chapter="resolume"]').click();
await page.waitForSelector('.mz-acc');
ok((await page.locator('#stoiskoRoot').textContent()).includes('Output Transformation'), 'Resolume: Output Transformation');
await page.locator('.mz-back').click();

// MX30 i etapy
await page.locator('[data-chapter="mx30"]').click();
await page.waitForSelector('.mz-acc');
ok(await page.locator('.mz-acc').count() >= 10, 'MX30: 10 sekcji rozwijanych');
await page.locator('.mz-back').click();
await page.locator('[data-chapter="etapy"]').click();
await page.waitForSelector('.stage-card');
ok(await page.locator('.stage-card').count() === 10, 'Etapy: 10 kart');
await page.locator('.mz-back').click();
ok(await page.locator('.mz-tile').count() === 19, 'powrót do menu');

ok(await page.evaluate(() => document.documentElement.scrollWidth === document.documentElement.clientWidth), 'brak poziomego scrolla (375 px)');
await page.screenshot({ path: 'montaz-v24-preview.png', fullPage: true });
ok(errors.length === 0, 'brak błędów w konsoli: ' + JSON.stringify(errors));
await browser.close();
