// RIG TALK — app.js: router ekranów i zakładek, start
import { icons } from './icons.js';
import { mountBrush } from './brush.js';
import { store, exportState, importState, resetState } from './state.js';
import * as srs from './srs.js';
import * as speech from './speech.js';
import * as session from './session.js';
import { loadAllChunks } from './content.js';
import * as library from './library.js';
import * as red from './red.js';
import * as game from './game.js';
import { allChunksArray, chunkTrack } from './content.js';
import * as scenes from './scenes.js';
import * as boss from './boss.js';
import * as ai from './ai.js';
import * as i18n from './i18n.js';
import * as stoisko from './stoisko.js';
import * as kurs from './kurs.js';
import * as glossary from './glossary.js';

console.log('[RIG TALK] app.js loaded — v2 (PIERWSZE STOISKO)');

// udostępnij moduły w konsoli do weryfikacji ręcznej (debug)
window.RigState = { store, exportState, importState, resetState };
window.RigSrs = srs;
window.RigSpeech = speech;
window.RigSession = session;
window.RigContent = { loadAllChunks };
window.RigLibrary = library;
window.RigRed = red;
window.RigGame = game;
window.RigScenes = scenes;
window.RigBoss = boss;
window.RigAi = ai;
window.RigI18n = i18n;

game.primeRedIds().catch(() => {});

// Wymuszona aktualizacja: gdy nowa wersja sw.js przejmie kontrolę, przeładuj stronę raz automatycznie.
// (bez tego użytkownik utknąłby na starym, cache'owanym JS/treści do ręcznego czyszczenia).
if ('serviceWorker' in navigator){
  let reloadedForUpdate = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloadedForUpdate) return;
    reloadedForUpdate = true;
    window.location.reload();
  });
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').then((reg) => {
      reg.update().catch(() => {});
      setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
    }).catch((e) => console.warn('[SW] rejestracja nieudana', e));
  });
}

const STOISKO_DATE = new Date('2027-01-10T00:00:00');
function daysUntilStoisko(){
  return Math.max(0, Math.ceil((STOISKO_DATE - new Date()) / 86400000));
}

const NAV_ICONS = {
  baza: 'home',
  stoisko: 'screen',
  kurs: 'layers',
  czerwone: 'alert',
  biblioteka: 'book',
};

function paintNavIcons(){
  for (const [key, name] of Object.entries(NAV_ICONS)){
    const el = document.getElementById('navIcon-' + key);
    if (el) el.innerHTML = icons[name] || '';
  }
  const settingsBtn = document.getElementById('settingsBtn');
  if (settingsBtn) settingsBtn.innerHTML = icons.settings;
}

// stare nazwy ekranów (sprzed v2) → nowe
const SCREEN_ALIASES = { codzienny: 'kurs', tech: 'kurs' };

function showScreen(name, persist = true){
  name = SCREEN_ALIASES[name] || name;
  if (!document.querySelector(`[data-screen="${name}"]`)) name = 'baza';
  document.querySelectorAll('[data-screen]').forEach(sec => {
    sec.classList.toggle('active', sec.dataset.screen === name);
  });
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.nav === name);
  });
  if (persist) store.set({ ui: { lastScreen: name } });
  if (name === 'baza'){
    renderBaza();
    const wrap = document.getElementById('trackSwitch');
    if (wrap){
      const current = store.get().settings.trackMix || 'T';
      wrap.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.track === current));
    }
  }
  if (name === 'biblioteka') renderBiblioteka();
  if (name === 'czerwone') red.renderRedScreen(document.getElementById('czerwoneRoot'));
  if (name === 'stoisko') stoisko.renderStoiskoScreen(document.getElementById('stoiskoRoot'));
  if (name === 'kurs') kurs.renderKursScreen(document.getElementById('kursRoot'));
  window.scrollTo(0, 0);
}

function renderBiblioteka(){
  const requestedTab = store.get().ui?.libTab;
  const tab = ['zwroty', 'ulubione', 'slownik'].includes(requestedTab) ? requestedTab : 'zwroty';
  document.querySelectorAll('#libTabs button').forEach(b => b.classList.toggle('active', b.dataset.value === tab));
  const root = document.getElementById('bibliotekaRoot');
  if (tab === 'slownik') glossary.renderGlossaryScreen(root);
  else if (tab === 'ulubione') library.renderFavoritesScreen(root);
  else library.renderLibraryScreen(root);
}

function initLibTabs(){
  document.getElementById('libTabs')?.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    store.set({ ui: { libTab: btn.dataset.value } });
    renderBiblioteka();
  });
}

function initNav(){
  document.getElementById('bottomNav').addEventListener('click', (e) => {
    const btn = e.target.closest('.nav-item');
    if (!btn) return;
    showScreen(btn.dataset.nav);
  });
  document.querySelectorAll('[data-nav-to]').forEach(btn => {
    btn.addEventListener('click', () => showScreen(btn.dataset.navTo));
  });
}

function initTrackSwitch(){
  const wrap = document.getElementById('trackSwitch');
  if (!wrap) return;
  const current = store.get().settings.trackMix || 'T';
  wrap.querySelectorAll('button').forEach(b => {
    b.classList.toggle('active', b.dataset.track === current);
  });
  wrap.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    wrap.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    store.set({ settings: { trackMix: btn.dataset.track } });
  });
}

function initBrush(){
  const rankNameWrap = document.querySelector('.brush-under');
  mountBrush(rankNameWrap);
}

function initSessionButtons(){
  document.getElementById('btn5min')?.addEventListener('click', () => {
    store.set({ settings: { sessionLength: 5 } });
    session.startSession(5);
  });
  document.getElementById('btn10min')?.addEventListener('click', () => {
    store.set({ settings: { sessionLength: 10 } });
    session.startSession(10);
  });
  window.addEventListener('rigtalk:session-ended', () => {
    // po sesji skupionej wróć tam, skąd przyszedłeś (STOISKO / KURS), inaczej do BAZY
    showScreen(store.get().ui?.lastScreen || 'baza', false);
    renderBaza();
  });
}

function initSettingsSwitch(elId, settingKey, valueType = 'string'){
  const wrap = document.getElementById(elId);
  if (!wrap) return;
  function paint(){
    const current = store.get().settings[settingKey];
    wrap.querySelectorAll('button').forEach(b => {
      const v = valueType === 'number' ? Number(b.dataset.value) : b.dataset.value;
      b.classList.toggle('active', v === current);
    });
  }
  wrap.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const v = valueType === 'number' ? Number(btn.dataset.value) : btn.dataset.value;
    store.set({ settings: { [settingKey]: v } });
    paint();
  });
  paint();
}

function initSettingsScreen(){
  initSettingsSwitch('settingVariant', 'variant');
  initSettingsSwitch('settingSessionLength', 'sessionLength', 'number');
  initSettingsSwitch('settingTrackMix', 'trackMix');
  initSettingsSwitch('settingL1', 'l1');
  initSettingsSwitch('settingNewPerDay', 'newPerDay', 'number');
}

function initBackupUI(){
  const area = document.getElementById('stateArea');
  document.getElementById('exportBtn')?.addEventListener('click', () => {
    area.value = exportState(store.get());
  });
  document.getElementById('importBtn')?.addEventListener('click', () => {
    try {
      const restored = importState(area.value);
      store.state = restored; // odśwież lokalną referencję store
      renderFromState();
      alert('Import OK.');
    } catch (e){
      alert('Błąd importu: ' + e.message);
    }
  });
  document.getElementById('resetBtn')?.addEventListener('click', () => {
    if (!confirm('Na pewno zresetować cały postęp?')) return;
    store.state = resetState();
    renderFromState();
  });
}

let ctxForProgress = null;

async function renderBaza(){
  const s = store.get();
  const info = game.levelFromXpDetailed(s.xp);
  const rank = game.rankForLevel(info.level);

  document.getElementById('levelBadge').textContent = `LEVEL ${info.level}`;
  document.getElementById('rankName').textContent = rank.name;
  document.getElementById('daysLeft').textContent = String(daysUntilStoisko());
  document.getElementById('xpFill').style.width = Math.round((info.xpIntoLevel / info.xpForLevel) * 100) + '%';
  document.getElementById('xpLabel').textContent = `${info.xpIntoLevel}/${info.xpForLevel} XP`;

  const missions = game.getMissionsSnapshot(s);
  const dailyDef = game.dailyMissionByKey(missions.dailyKey);
  const weeklyDef = game.weeklyMissionByKey(missions.weeklyKey);
  const dailyDone = missions.dailyDoneToday;
  const weeklyDone = missions.weeklyDoneThisWeek;
  document.getElementById('dailyMissionTxt').textContent = (dailyDone ? '✔ ' : '') + 'Misja dnia: ' + dailyDef.label;
  document.getElementById('dailyMissionXp').textContent = '+' + dailyDef.xp;
  document.getElementById('dailyMissionStrip').style.opacity = dailyDone ? '0.5' : '1';
  document.getElementById('weeklyMissionTxt').textContent = (weeklyDone ? '✔ ' : '') + 'Misja tygodnia: ' + weeklyDef.label;
  document.getElementById('weeklyMissionXp').textContent = '+' + weeklyDef.xp;
  document.getElementById('weeklyMissionStrip').style.opacity = weeklyDone ? '0.5' : '1';

  try {
    ctxForProgress = ctxForProgress || await loadAllChunks();
    const all = allChunksArray(ctxForProgress);
    const dTotal = all.filter(c => chunkTrack(c.id) === 'D').length || 1;
    const tTotal = all.filter(c => chunkTrack(c.id) === 'T').length || 1;
    const dDone = Object.keys(s.cards || {}).filter(id => chunkTrack(id) === 'D').length;
    const tDone = Object.keys(s.cards || {}).filter(id => chunkTrack(id) === 'T').length;
    document.getElementById('progressD').style.width = Math.min(100, Math.round((dDone / dTotal) * 100)) + '%';
    document.getElementById('progressT').style.width = Math.min(100, Math.round((tDone / tTotal) * 100)) + '%';
  } catch (e){ /* treść jeszcze się ładuje */ }

  try {
    const res = await fetch('content/stoisko.json');
    const meta = await res.json();
    const checks = s.stoisko?.checks || {};
    let done = 0, total = 0, stagesDone = 0;
    meta.stages.forEach(st => {
      const d = st.checklist.filter((_, i) => checks[`${st.unit}-${i}`]).length;
      done += d; total += st.checklist.length;
      if (d === st.checklist.length) stagesDone++;
    });
    document.getElementById('stoiskoHeroBar').style.width = Math.round(done / total * 100) + '%';
    document.getElementById('stoiskoHeroSub').textContent =
      `${stagesDone}/${meta.stages.length} etapów gotowych · zwroty do klienta i stagehanda`;
  } catch (e){ /* offline bez cache — zostaw domyślny opis */ }
}

function renderFromState(){
  const s = store.get();
  showScreen(s.ui?.lastScreen || 'baza', false);
  const wrap = document.getElementById('trackSwitch');
  if (wrap){
    wrap.querySelectorAll('button').forEach(b => {
      b.classList.toggle('active', b.dataset.track === (s.settings.trackMix || 'T'));
    });
  }
  renderBaza();
}

function init(){
  paintNavIcons();
  initNav();
  initTrackSwitch();
  initBrush();
  session.initSessionDom();
  initSessionButtons();
  initSettingsScreen();
  initBackupUI();
  initLibTabs();
  renderFromState();
}

document.addEventListener('DOMContentLoaded', init);
