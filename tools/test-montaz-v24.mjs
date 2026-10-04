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
ok(await page.locator('.mz-tile').count() === 10, '10 kafli rozdziałów');
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
await page.fill('#calc-watt', '150');
text = await page.locator('.mz-result').innerText();
ok(text.includes('9,60 kW') || text.includes('9.60 kW'), 'kalkulator: 64 × 150 W = 9,6 kW');
ok(text.includes('3 × 16 A'), 'kalkulator: linie 16 A');

// niespodzianki + zwroty
await page.locator('.mz-back').click();
await page.locator('[data-chapter="niespodzianki"]').click();
ok(await page.locator('.mz-risk').count() === 9, '9 ryzyk');
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
ok(await page.locator('.mz-tile').count() === 10, 'powrót do wyboru rozdziału');

ok(await page.evaluate(() => document.documentElement.scrollWidth === document.documentElement.clientWidth), 'brak poziomego scrolla (375 px)');
await page.screenshot({ path: 'montaz-v24-preview.png', fullPage: true });
ok(errors.length === 0, 'brak błędów w konsoli: ' + JSON.stringify(errors));
await browser.close();
