#!/usr/bin/env node
// RIG TALK — tools/validate.js: walidator treści (chunks) wg PLAN.md §1.1 i §8.3
// Uruchomienie: node tools/validate.js

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'content');

const errors = [];
const warnings = [];
let checkedFiles = 0;
let checkedChunks = 0;

// ---------- moduły (dla sprawdzenia zgodności track/module) ----------
const modulesJson = JSON.parse(readFileSync(path.join(CONTENT_DIR, 'modules.json'), 'utf8'));
const knownModules = modulesJson.modules;

// Moduły z ograniczeniem czasów wg 1.1 pkt 2: brak Past Simple, brak Perfectów
const RESTRICTED_TENSE_MODULES = new Set(['T0', 'T1', 'T2', 'D1', 'D2', 'D3', 'D4', 'D5']);

// Tagi/moduły, w których krótkie 1–2 słowowe reakcje są dopuszczalne (wyjątek od reguły 3–9 słów)
const SHORT_OK_TAGS = new Set(['reaction', 'filler', 'agreement', 'uncertainty', 'polite', 'short']);

// Formułki dopuszczone mimo Past Simple/Perfect (jawne wyjątki z 1.1 pkt 2)
const TENSE_EXCEPTIONS = [
  /have you tried/i,
  /i have a booking/i,
  /i've been here/i,
];

const PAST_SIMPLE_RE = /\b\w+ed\b|\b(was|were|went|got|had|did|said|came|saw|took|made|left|felt|knew|thought|told|found|gave|wrote|lost|changed)\b/i;
const PERFECT_RE = /\b(have|has|had|'ve|'d)\s+\w*(ed|en|been|done|gone|seen|taken|written|made)\b/i;

const seenIds = new Map(); // id -> file

function wordCount(en){
  return en.trim().split(/\s+/).filter(Boolean).length;
}

function checkChunk(chunk, file){
  checkedChunks++;
  const ctx = `${file} :: ${chunk.id || '(brak id)'}`;

  const required = ['id', 'track', 'module', 'unit', 'type', 'en', 'pl'];
  for (const field of required){
    if (chunk[field] === undefined || chunk[field] === null || chunk[field] === ''){
      errors.push(`${ctx} — brakuje wymaganego pola "${field}"`);
    }
  }
  if (!chunk.id) return; // dalsze sprawdzenia bez sensu bez id

  // unikalność ID
  if (seenIds.has(chunk.id)){
    errors.push(`${ctx} — zduplikowane ID (już w ${seenIds.get(chunk.id)})`);
  } else {
    seenIds.set(chunk.id, file);
  }

  // format ID: {track}{moduł}u{jednostka}-{nr}
  const idMatch = /^([dt])(\d+)u(\d+)-(\d+)$/i.exec(chunk.id);
  if (!idMatch){
    errors.push(`${ctx} — ID nie pasuje do wzorca {tor}{moduł}u{jednostka}-{nr} (np. d7u2-05)`);
  } else {
    const idTrack = idMatch[1].toUpperCase();
    if (chunk.track && chunk.track.toUpperCase() !== idTrack){
      errors.push(`${ctx} — pole track="${chunk.track}" nie zgadza się z prefiksem ID ("${idTrack}")`);
    }
    const idModule = idTrack + idMatch[2];
    if (chunk.module && chunk.module.toUpperCase() !== idModule){
      errors.push(`${ctx} — pole module="${chunk.module}" nie zgadza się z ID (oczekiwano "${idModule}")`);
    }
  }

  // moduł musi istnieć i należeć do właściwego toru
  if (chunk.module){
    const modDef = knownModules[chunk.module.toUpperCase()];
    if (!modDef){
      errors.push(`${ctx} — nieznany moduł "${chunk.module}" (brak w content/modules.json)`);
    } else if (chunk.track && modDef.track !== chunk.track.toUpperCase()){
      errors.push(`${ctx} — moduł "${chunk.module}" należy do toru ${modDef.track}, a chunk deklaruje track="${chunk.track}"`);
    }
  }

  // typ karty
  if (chunk.type && !['SAY', 'HEAR'].includes(chunk.type)){
    errors.push(`${ctx} — nieprawidłowy type="${chunk.type}" (oczekiwano SAY lub HEAR)`);
  }
  if (chunk.type === 'HEAR' && (!chunk.reply || !chunk.reply.trim())){
    errors.push(`${ctx} — karta HEAR musi mieć pole "reply" (typowa odpowiedź)`);
  }

  // register
  if (chunk.register && !['neutral', 'casual', 'polite'].includes(chunk.register)){
    warnings.push(`${ctx} — nietypowy register="${chunk.register}" (oczekiwano neutral/casual/polite)`);
  }

  // red — powinno być boolean
  if (typeof chunk.red !== 'boolean'){
    warnings.push(`${ctx} — pole "red" powinno być boolean (true/false)`);
  }

  // liczba słów w en: 3–9, wyjątek dla krótkich reakcji (tagi) i szablonów slot
  if (chunk.en){
    const wc = wordCount(chunk.en);
    const tags = chunk.tags || [];
    const shortOk = tags.some(t => SHORT_OK_TAGS.has(t));
    const minWords = shortOk ? 1 : 3;
    if (wc < minWords || wc > 9){
      errors.push(`${ctx} — "en" ma ${wc} słów, poza dozwolonym zakresem ${minWords}-9: "${chunk.en}"`);
    }
  }

  // zakazane czasy w modułach z ograniczeniem (T0-T2, D1-D5)
  if (chunk.module && RESTRICTED_TENSE_MODULES.has(chunk.module.toUpperCase()) && chunk.en){
    const isException = TENSE_EXCEPTIONS.some(re => re.test(chunk.en));
    if (!isException){
      if (PERFECT_RE.test(chunk.en)){
        errors.push(`${ctx} — moduł ${chunk.module} nie może zawierać czasu Perfect: "${chunk.en}"`);
      } else if (PAST_SIMPLE_RE.test(chunk.en) && !/^(is|are|was|were)$/i.test('')) {
        // dodatkowa, luźniejsza kontrola: tylko ostrzeżenie (heurystyka słownikowa bywa zbyt czuła)
        warnings.push(`${ctx} — moduł ${chunk.module}: „en” może zawierać Past Simple, sprawdź ręcznie: "${chunk.en}"`);
      }
    }
  }

  // warianty: obiekt, nie tablica (schemat 8.3)
  if (chunk.variants !== undefined && (Array.isArray(chunk.variants) === false && typeof chunk.variants !== 'object')){
    errors.push(`${ctx} — "variants" powinno być obiektem {uk, us, alt[]}`);
  }
}

function walk(dir){
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })){
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith('.json') && entry.name !== 'modules.json') out.push(full);
  }
  return out;
}

const files = walk(CONTENT_DIR).filter(f => f.includes(`${path.sep}daily${path.sep}`) || f.includes(`${path.sep}tech${path.sep}`));

for (const file of files){
  checkedFiles++;
  const rel = path.relative(ROOT, file);
  let data;
  try {
    data = JSON.parse(readFileSync(file, 'utf8'));
  } catch (e){
    errors.push(`${rel} — niepoprawny JSON: ${e.message}`);
    continue;
  }
  if (!Array.isArray(data)){
    errors.push(`${rel} — plik powinien zawierać tablicę zwrotów`);
    continue;
  }
  for (const chunk of data) checkChunk(chunk, rel);
}

// ---------- red.json: grupy CZERWONYCH muszą wskazywać na istniejące, oznaczone red:true zwroty ----------
try {
  const redJson = JSON.parse(readFileSync(path.join(CONTENT_DIR, 'red.json'), 'utf8'));
  const allChunksById = new Map();
  for (const file of files){
    const rel = path.relative(ROOT, file);
    try {
      const data = JSON.parse(readFileSync(file, 'utf8'));
      if (Array.isArray(data)) data.forEach(c => c.id && allChunksById.set(c.id, { ...c, file: rel }));
    } catch (e) { /* już zaraportowane wyżej */ }
  }
  for (const group of redJson.groups || []){
    for (const id of group.ids || []){
      const chunk = allChunksById.get(id);
      if (!chunk){
        errors.push(`content/red.json — grupa "${group.key}" wskazuje na nieistniejące ID "${id}"`);
      } else if (chunk.red !== true){
        warnings.push(`content/red.json — grupa "${group.key}" zawiera "${id}", ale ten zwrot nie ma red:true (${chunk.file})`);
      }
    }
  }
  for (const situation of redJson.standMode || []){
    for (const id of situation.ids || []){
      if (!allChunksById.get(id)){
        errors.push(`content/red.json — tryb stoiska "${situation.key}" wskazuje na nieistniejące ID "${id}"`);
      }
    }
  }
} catch (e){
  warnings.push(`Nie udało się sprawdzić content/red.json: ${e.message}`);
}

console.log(`Sprawdzono plików: ${checkedFiles}, zwrotów: ${checkedChunks}`);
if (warnings.length){
  console.log(`\nOstrzeżenia (${warnings.length}):`);
  warnings.forEach(w => console.log('  ⚠ ' + w));
}
if (errors.length){
  console.log(`\nBłędy (${errors.length}):`);
  errors.forEach(e => console.log('  ✗ ' + e));
  console.log('\nWALIDACJA NIEUDANA.');
  process.exit(1);
} else {
  console.log('\nWALIDACJA OK — 0 błędów.');
  process.exit(0);
}
