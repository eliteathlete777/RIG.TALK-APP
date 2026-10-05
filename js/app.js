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
import { loadPlan, activeBlockIndex, countdown } from './bootcamp.js';
import { readinessStats, weakestFirst } from './readiness.js';
import { restoreHiddenItems } from './visibility.js';

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

let installPrompt = null;
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  installPrompt = event;
  document.getElementById('installBtn')?.removeAttribute('disabled');
});

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

let activeMode = null;

function showModeGate(){
  activeMode = null;
  document.body.removeAttribute('data-app-mode');
  document.querySelectorAll('[data-screen]').forEach(sec => sec.classList.toggle('active', sec.dataset.screen === 'wybor'));
  document.getElementById('bottomNav').style.display = 'none';
  document.getElementById('quickAddPhrase').hidden = true;
  document.getElementById('settingsBtn').hidden = true;
  document.getElementById('modeChange').hidden = true;
  window.scrollTo(0, 0);
}

function enterMode(mode){
  activeMode = mode;
  document.body.dataset.appMode = mode;
  document.getElementById('modeChange').hidden = false;
  if (mode === 'assembly'){
    document.getElementById('bottomNav').style.display = 'none';
    document.getElementById('quickAddPhrase').hidden = true;
    document.getElementById('settingsBtn').hidden = true;
    store.set({ ui: { stoiskoMode: 'hub', montazChapter: null } });
    showScreen('stoisko', false);
  } else {
    document.getElementById('bottomNav').style.display = '';
    document.getElementById('quickAddPhrase').hidden = false;
    document.getElementById('settingsBtn').hidden = false;
    const remembered = store.get().ui?.lastScreen;
    showScreen(['baza', 'kurs', 'czerwone', 'biblioteka', 'ustawienia'].includes(remembered) ? remembered : 'baza', false);
  }
}

function initModeGate(){
  document.querySelectorAll('[data-mode-select]').forEach(button => {
    button.addEventListener('click', () => enterMode(button.dataset.modeSelect));
  });
  document.getElementById('modeHome')?.addEventListener('click', showModeGate);
  document.getElementById('modeChange')?.addEventListener('click', showModeGate);
}

function showScreen(name, persist = true){
  name = SCREEN_ALIASES[name] || name;
  if (!document.querySelector(`[data-screen="${name}"]`)) name = 'baza';
  document.querySelectorAll('[data-screen]').forEach(sec => {
    sec.classList.toggle('active', sec.dataset.screen === name);
  });
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.nav === name);
  });
  if (persist && activeMode === 'english') store.set({ ui: { lastScreen: name } });
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

function initQuickAdd(){
  document.getElementById('quickAddPhrase')?.addEventListener('click', () => {
    const overlay = document.createElement('div');
    overlay.className = 'quick-add-overlay';
    overlay.innerHTML = `<div class="quick-add-card frame">
      <button class="quick-add-close" aria-label="Zamknij">✕</button>
      <div class="eyebrow">WŁASNY ZWROT</div><h2>DODAJ DO TRENINGU</h2>
      <label>Polski<input class="field" data-field="pl" placeholder="Co chcesz powiedzieć?"></label>
      <label>English<input class="field" data-field="en" placeholder="Wpisz lub wklej tłumaczenie"></label>
      <div class="track-switch"><button data-track="T" class="active">TECH</button><button data-track="D">CODZIENNY</button></div>
      <p class="muted-sm">Zwrot zapisuje się na tym urządzeniu. Oznacz go ★, aby trafiał na początek powtórek.</p>
      <button class="btn btn-primary btn-lg" data-save>ZAPISZ ZWROT</button>
    </div>`;
    let track = 'T';
    overlay.querySelector('.quick-add-close').addEventListener('click', () => overlay.remove());
    overlay.querySelectorAll('[data-track]').forEach(button => button.addEventListener('click', () => {
      track = button.dataset.track;
      overlay.querySelectorAll('[data-track]').forEach(b => b.classList.toggle('active', b === button));
    }));
    overlay.querySelector('[data-save]').addEventListener('click', () => {
      const pl = overlay.querySelector('[data-field="pl"]').value.trim();
      const en = overlay.querySelector('[data-field="en"]').value.trim();
      if (!pl || !en){ alert('Wpisz polską i angielską wersję zwrotu.'); return; }
      library.addCustomChunk({ pl, en, track });
      overlay.remove();
      if (document.querySelector('[data-screen="biblioteka"]')?.classList.contains('active')) renderBiblioteka();
    });
    document.body.appendChild(overlay);
    overlay.querySelector('[data-field="pl"]').focus();
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
    // montaż wraca do instrukcji; angielski wraca do ostatniego ekranu nauki
    showScreen(activeMode === 'assembly' ? 'stoisko' : (store.get().ui?.lastScreen || 'baza'), false);
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
  const file = document.getElementById('stateFile');
  document.getElementById('exportBtn')?.addEventListener('click', () => {
    const blob = new Blob([exportState(store.get())], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rig-talk-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });
  document.getElementById('importBtn')?.addEventListener('click', () => {
    if (!area.value.trim()) { file?.click(); return; }
    try {
      const restored = importState(area.value);
      store.state = restored; // odśwież lokalną referencję store
      renderFromState();
      alert('Import OK.');
    } catch (e){
      alert('Błąd importu: ' + e.message);
    }
  });
  file?.addEventListener('change', async () => {
    const selected = file.files?.[0];
    if (!selected) return;
    try {
      const restored = importState(await selected.text());
      store.state = restored;
      renderFromState();
      alert('Kopia postępu została wczytana.');
    } catch (e){ alert('Nieprawidłowy plik kopii: ' + e.message); }
    file.value = '';
  });
  document.getElementById('installBtn')?.addEventListener('click', async () => {
    if (installPrompt){
      installPrompt.prompt();
      await installPrompt.userChoice;
      installPrompt = null;
      return;
    }
    alert('iPhone: Safari → Udostępnij → Dodaj do ekranu początkowego. Android: Chrome → menu ⋮ → Zainstaluj aplikację.');
  });
  document.getElementById('updateBtn')?.addEventListener('click', async (event) => {
    const button = event.currentTarget;
    const status = document.getElementById('updateStatus');
    if (!navigator.onLine){
      if (status) status.textContent = 'Brak internetu. Połącz telefon z Wi-Fi i spróbuj ponownie.';
      return;
    }
    if (!confirm('Pobrać najnowszą wersję? Postęp, ulubione i ustawienia zostaną zachowane.')) return;

    button.disabled = true;
    button.textContent = 'AKTUALIZUJĘ…';
    if (status) status.textContent = 'Usuwam stare pliki aplikacji. Dane użytkownika pozostają bez zmian…';

    try {
      if ('serviceWorker' in navigator){
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations
          .filter((registration) => registration.scope.includes('/rig-talk/'))
          .map((registration) => registration.unregister()));
      }
      if ('caches' in window){
        const names = await caches.keys();
        await Promise.all(names
          .filter((name) => name.startsWith('rigtalk-'))
          .map((name) => caches.delete(name)));
      }
      if (status) status.textContent = 'Pobieram świeżą wersję…';
      const freshUrl = new URL('./', window.location.href);
      freshUrl.searchParams.set('update', Date.now().toString());
      window.location.replace(freshUrl.href);
    } catch (error){
      console.error('[UPDATE] nieudana aktualizacja', error);
      button.disabled = false;
      button.textContent = 'AKTUALIZUJ BEZ UTRATY DANYCH';
      if (status) status.textContent = 'Aktualizacja nie powiodła się. Dane nie zostały usunięte. Sprawdź internet i spróbuj ponownie.';
    }
  });
  document.getElementById('resetBtn')?.addEventListener('click', () => {
    if (!confirm('Na pewno zresetować cały postęp?')) return;
    store.state = resetState();
    renderFromState();
  });
  document.getElementById('restoreHiddenBtn')?.addEventListener('click', () => {
    const state = store.get();
    const hiddenCount = (state.hiddenItems || []).length + (state.deleted || []).length;
    if (!hiddenCount){
      alert('Nie ma ukrytych zwrotów ani słów.');
      return;
    }
    restoreHiddenItems();
    alert(`Przywrócono ukryte elementy: ${hiddenCount}.`);
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
  try {
    const plan = await loadPlan();
    document.getElementById('daysLeft').textContent = countdown(plan.deadline);
    const ids = [...new Set(plan.blocks.flatMap(block => block.ids))];
    const stats = readinessStats(ids, s.cards || {});
    const blockIndex = activeBlockIndex(plan, s.cards || {});
    const block = plan.blocks[blockIndex];
    const root = document.getElementById('nextActionRoot');
    root.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'next-action frame';
    const copy = document.createElement('div');
    copy.innerHTML = `<div class="eyebrow">TERAZ · GOTOWOŚĆ ${stats.pct}%</div><h2>${block.title}</h2><p>${block.goal}</p><div class="readiness-legend"><span class="ready-green">${stats.mastered} umiem</span><span class="ready-amber">${stats.learning} uczę się</span><span>${stats.unseen} nowych</span></div>`;
    const go = document.createElement('button');
    go.className = 'btn btn-primary btn-lg';
    go.textContent = `ĆWICZ TERAZ · ${block.duration}`;
    go.addEventListener('click', async () => {
      const ctx = ctxForProgress || await loadAllChunks();
      const valid = weakestFirst(block.ids.filter(id => ctx.chunks.has(id)), store.get().cards || {});
      session.startFocusedSession(valid, { limit: valid.length });
    });
    card.append(copy, go);
    root.appendChild(card);
  } catch (e){
    document.getElementById('daysLeft').textContent = '06.10 · 06:00';
  }
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
  initModeGate();
  initNav();
  initQuickAdd();
  initTrackSwitch();
  initBrush();
  session.initSessionDom();
  initSessionButtons();
  initSettingsScreen();
  initBackupUI();
  initLibTabs();
  renderBaza();
  showModeGate();
  if ('serviceWorker' in navigator && 'caches' in window){
    navigator.serviceWorker.ready.then(async () => {
      const names = await caches.keys();
      const ready = names.some(name => name.startsWith('rigtalk-'));
      const badge = document.getElementById('offlineState');
      if (badge){ badge.textContent = ready ? 'OFFLINE GOTOWE' : 'OFFLINE ŁADUJE'; badge.classList.toggle('ready', ready); }
    }).catch(() => {});
  }
}

document.addEventListener('DOMContentLoaded', init);
