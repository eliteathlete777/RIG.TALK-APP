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
await page.waitForSelector('.mz-tile');
ok(await page.locator('.mz-tile').count() === 16, '16 kafli rozdziałów');
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
await page.locator('[data-chapter="kalkulator"]').click();
await page.waitForSelector('.mz-result');
let text = await page.locator('.mz-result').innerText();
ok(text.includes('2048 × 512'), 'kalkulator: 2048 × 512 px');
ok(text.includes('256 × 64'), 'kalkulator: cabinet 256 × 64 px');
ok(text.includes('64 cabinetów'), 'kalkulator: 64 cabinety');
ok(text.includes('BRAK DANYCH'), 'kalkulator: brak mocy oznaczony');
ok(text.replace(/\u00a0|\u202f/g, ' ').includes('659 722'), 'kalkulator: limit portu 659 722 px (wzór z manuala MX30)');
ok(text.includes('Swift Layout') && text.includes('2 × 32'), 'kalkulator: Swift Layout 2 × 32');
await page.fill('#calc-watt', '150');
text = await page.locator('.mz-result').innerText();
ok(text.includes('9,60 kW') || text.includes('9.60 kW'), 'kalkulator: 64 × 150 W = 9,6 kW');
ok(text.includes('3 × 16 A'), 'kalkulator: linie 16 A');

// niespodzianki + zwroty
await page.locator('.mz-back').click();
await page.locator('[data-chapter="niespodzianki"]').click();
ok(await page.locator('.mz-risk').count() === 10, '10 ryzyk');
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
ok(await page.locator('.plan-card').count() === 29, 'Plany: 29 rysunków');
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
await page.waitForSelector('.mx-step');
ok((await page.locator('#stoiskoRoot').innerText()).includes('Enter Offline Mode'), 'VMP: Offline Mode');
await page.locator('.mz-back').click();
// MX30 panel i Resolume
await page.locator('[data-chapter="mx30panel"]').click();
await page.waitForSelector('.mx-step');
ok((await page.locator('#stoiskoRoot').innerText()).includes('Swift Layout'), 'MX30 panel: Swift Layout');
ok(await page.locator('.mz-src').count() === 3, 'MX30 panel: 3 źródła');
await page.locator('.mz-back').click();
await page.locator('[data-chapter="resolume"]').click();
await page.waitForSelector('.mx-step');
ok((await page.locator('#stoiskoRoot').innerText()).includes('Output Transformation'), 'Resolume: Output Transformation');
await page.locator('.mz-back').click();

// MX30 i etapy
await page.locator('[data-chapter="mx30"]').click();
await page.waitForSelector('.mx-step');
ok(await page.locator('.mx-step').count() === 10, 'MX30: 10 sekcji');
await page.locator('.mz-back').click();
await page.locator('[data-chapter="etapy"]').click();
await page.waitForSelector('.stage-card');
ok(await page.locator('.stage-card').count() === 10, 'Etapy: 10 kart');
await page.locator('.mz-back').click();
ok(await page.locator('.mz-tile').count() === 16, 'powrót do wyboru rozdziału');

ok(await page.evaluate(() => document.documentElement.scrollWidth === document.documentElement.clientWidth), 'brak poziomego scrolla (375 px)');
await page.screenshot({ path: 'montaz-v24-preview.png', fullPage: true });
ok(errors.length === 0, 'brak błędów w konsoli: ' + JSON.stringify(errors));
await browser.close();
