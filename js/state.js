// RIG TALK — state.js: load/save/migracje/eksport/import (localStorage, klucz rigtalk.v1)

const STORAGE_KEY = 'rigtalk.v1';
const SCHEMA_VERSION = 4;

function defaultState(){
  return {
    schemaVersion: SCHEMA_VERSION,
    xp: 0,
    level: 1,
    cards: {},              // { [chunkId]: ts-fsrs Card }
    log: [],                // [{ d:'YYYY-MM-DD', xp, sessions, minutes }]
    streak: { n: 0, pins: 2, lastDay: null },
    badges: [],
    missions: {},
    settings: {
      newPerDay: 3,
      l1: 'auto',
      sessionLength: 5,
      trackMix: 'T',
      variant: 'uk',
    },
    starred: [],
    redOrder: [],
    custom: [],
    deleted: [],
    aiUsedToday: 0,
    aiUsedDate: null,
    stats: {
      sessionsTotal: 0,
      tenMinSessionsTotal: 0,
      hearCorrectTotal: 0,
    },
    bossesWon: [],
    simulation: { lastScore: null, total: 8, at: null },
    mx30: { checks: {} },
    stoisko: { checks: {}, open: 1, tab: {} },
    ui: {
      lastScreen: 'baza',
    },
  };
}

// Migracje: klucz = wersja, z której migrujemy -> funkcja zwracająca nowy obiekt
const MIGRATIONS = {
  // 0 -> 1: przykład na przyszłość, nieużywany na starcie projektu
  0: (s) => ({ ...defaultState(), ...s, schemaVersion: 1 }),
  // 1 -> 2: v2 — priorytet TECH/stoisko: domyślny tor MIX przechodzi na TECH, stare ekrany → KURS
  1: (s) => ({
    ...s,
    schemaVersion: 2,
    settings: { ...(s.settings || {}), trackMix: (s.settings?.trackMix === 'MIX' || !s.settings?.trackMix) ? 'T' : s.settings.trackMix },
    ui: { ...(s.ui || {}), lastScreen: 'stoisko' },
  }),
  2: (s) => ({
    ...s,
    schemaVersion: 3,
    simulation: s.simulation || { lastScore: null, total: 8, at: null },
  }),
  3: (s) => ({ ...s, schemaVersion: 4, deleted: s.deleted || [] }),
};

function migrate(state){
  let s = state;
  let guard = 0;
  while (s.schemaVersion < SCHEMA_VERSION && guard < 20){
    const fn = MIGRATIONS[s.schemaVersion];
    if (!fn) break;
    s = fn(s);
    guard++;
  }
  return s;
}

// Tylko "zwykłe" obiekty ({} / Object.create(null)) są scalane rekurencyjnie.
// Wszystko inne (Date, Array, klasy typu FSRS Card, null, prymitywy) jest podmieniane w całości —
// inaczej np. pole `due` (Date) zostałoby rozjechane na {} przy scalaniu (Date nie ma własnych kluczy).
function isPlainObject(x){
  if (x === null || typeof x !== 'object' || Array.isArray(x)) return false;
  const proto = Object.getPrototypeOf(x);
  return proto === Object.prototype || proto === null;
}

function deepMerge(base, patch){
  if (patch === undefined) return base;
  if (!isPlainObject(base) || !isPlainObject(patch)) return patch;
  const out = { ...base };
  for (const k of Object.keys(patch)){
    out[k] = deepMerge(base[k], patch[k]);
  }
  return out;
}

export function loadState(){
  let raw;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch (e){
    console.warn('[state] localStorage niedostępny, używam stanu tymczasowego', e);
    return defaultState();
  }
  if (!raw) return defaultState();
  try {
    const parsed = JSON.parse(raw);
    const migrated = migrate(parsed);
    // deepMerge z default, żeby nowe pola (np. po aktualizacji aplikacji) miały wartości domyślne
    return deepMerge(defaultState(), migrated);
  } catch (e){
    console.warn('[state] uszkodzony zapis, resetuję do stanu domyślnego', e);
    return defaultState();
  }
}

export function saveState(state){
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (e){
    console.warn('[state] nie udało się zapisać stanu', e);
    return false;
  }
}

export function exportState(state){
  return JSON.stringify(state, null, 2);
}

export function importState(jsonText){
  const parsed = JSON.parse(jsonText); // rzuca wyjątek przy złym JSON — obsługa po stronie wywołującej
  const migrated = migrate(parsed);
  const merged = deepMerge(defaultState(), migrated);
  saveState(merged);
  return merged;
}

export function resetState(){
  const fresh = defaultState();
  saveState(fresh);
  return fresh;
}

// Prosty store w pamięci procesu (jedno źródło prawdy dla całej sesji karty)
class Store {
  constructor(){
    this.state = loadState();
    this.listeners = new Set();
  }
  get(){ return this.state; }
  set(patch){
    this.state = deepMerge(this.state, patch);
    saveState(this.state);
    this.listeners.forEach(fn => fn(this.state));
    return this.state;
  }
  subscribe(fn){
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
}

export const store = new Store();
