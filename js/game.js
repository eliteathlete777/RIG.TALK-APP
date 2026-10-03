// RIG TALK — game.js: XP, levele, rangi, misje, seria z Safety Pinami, odznaki (PLAN.md §6)

import { store } from './state.js';
import { mountBrush } from './brush.js';
import { loadAllChunks, allChunksArray } from './content.js';

// Zbiór ID zwrotów oznaczonych red:true — potrzebny do odznaki "Red Ready" (6.5).
// Ładowany raz asynchronicznie (primeRedIds), bo checkBadges() jest funkcją synchroniczną.
let redIdsCache = new Set();
export async function primeRedIds(){
  const ctx = await loadAllChunks();
  redIdsCache = new Set(allChunksArray(ctx).filter(c => c.red).map(c => c.id));
  return redIdsCache;
}

// ---------- 6.2 Levele ----------
export function xpForNextLevel(level){
  return 100 + 40 * (level - 1);
}

/** Zwraca szczegóły poziomu dla danego całkowitego XP. */
export function levelFromXpDetailed(totalXp){
  let level = 1;
  let remaining = Math.max(0, totalXp);
  while (remaining >= xpForNextLevel(level)){
    remaining -= xpForNextLevel(level);
    level++;
  }
  return { level, xpIntoLevel: remaining, xpForLevel: xpForNextLevel(level) };
}

export function levelFromXp(totalXp){
  return levelFromXpDetailed(totalXp).level;
}

// ---------- 6.3 Rangi riggerskie ----------
export const RANKS = [
  { minLevel: 1, name: 'Ground Hand' },
  { minLevel: 4, name: 'Ground Rigger' },
  { minLevel: 7, name: 'Up Rigger' },
  { minLevel: 10, name: 'Lead Rigger' },
  { minLevel: 13, name: 'Head Rigger' },
  { minLevel: 16, name: 'Production Rigger' },
  { minLevel: 19, name: 'Rigging Master' },
  { minLevel: 22, name: 'BYQ LEGEND' },
];

export function rankForLevel(level){
  let current = RANKS[0];
  for (const r of RANKS){
    if (level >= r.minLevel) current = r;
  }
  return current;
}

// ---------- 6.5 Odznaki ----------
export const BADGES = [
  { key: 'first_lift', label: 'First Lift', desc: 'Pierwsza sesja', check: (st) => st.stats.sessionsTotal >= 1 },
  { key: 'double_shift', label: 'Double Shift', desc: 'Dwie sesje jednego dnia', check: (st) => (st.log || []).some(l => l.sessions >= 2) },
  { key: 'full_shift', label: 'Full Shift', desc: '10 sesji 10 MIN', check: (st) => st.stats.tenMinSessionsTotal >= 10 },
  { key: 'good_ears', label: 'Good Ears', desc: '100 kart HEAR poprawnie', check: (st) => st.stats.hearCorrectTotal >= 100 },
  { key: 'red_ready', label: 'Red Ready', desc: '80 zwrotów CZERWONYCH opanowanych', check: (st) => {
      const masteredRed = Object.keys(st.cards || {}).filter(id => redIdsCache.has(id));
      return masteredRed.length >= 80;
    } },
  { key: 'hundred_chunks', label: '100 Chunks', desc: '100 opanowanych zwrotów', check: (st) => Object.keys(st.cards || {}).length >= 100 },
];

/** Sprawdza wszystkie odznaki i zwraca listę KLUCZY, które są aktualnie spełnione (niezależnie czy już zdobyte). */
export function checkBadges(state){
  return BADGES.filter(b => { try { return b.check(state); } catch (e) { return false; } }).map(b => b.key);
}

// ---------- 6.4 Misje ----------
const DAILY_MISSIONS = [
  { key: 'do_session', label: 'Zrób RIG CHECK', xp: 30, target: 1, progressKey: 'sessionsToday' },
  { key: 'good3', label: 'Powiedz 3 zwroty z oceną Good/Easy', xp: 30, target: 3, progressKey: 'goodOrEasyToday' },
  { key: 'hear5', label: 'Zrób 5 kart HEAR bez błędu', xp: 30, target: 5, progressKey: 'hearCorrectToday' },
];

const WEEKLY_MISSIONS = [
  { key: 'sessions5', label: '5 sesji w tygodniu', xp: 150, target: 5, progressKey: 'sessionsThisWeek' },
  { key: 'ten_min_x2', label: '2 sesje 10 MIN', xp: 150, target: 2, progressKey: 'tenMinSessionsThisWeek' },
];

function isoWeekKey(d){
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((date - firstThursday) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

function pickIndex(seedStr, poolLength){
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) hash = (hash * 31 + seedStr.charCodeAt(i)) >>> 0;
  return hash % poolLength;
}

/** Zwraca AKTUALNY (nie zmutowany) obiekt misji — jeśli dzień/tydzień się zmienił, przypisuje nowe. */
export function getMissionsSnapshot(state, now = new Date()){
  const today = now.toISOString().slice(0, 10);
  const week = isoWeekKey(now);
  const prev = state.missions || {};
  const dailyKey = prev.dayKey === today ? prev.dailyKey : DAILY_MISSIONS[pickIndex(today, DAILY_MISSIONS.length)].key;
  const weeklyKey = prev.weekKey === week ? prev.weeklyKey : WEEKLY_MISSIONS[pickIndex(week, WEEKLY_MISSIONS.length)].key;
  const dayProgress = prev.dayKey === today ? { ...prev.dayProgress } : { sessionsToday: 0, goodOrEasyToday: 0, hearCorrectToday: 0 };
  const weekProgress = prev.weekKey === week ? { ...prev.weekProgress } : { sessionsThisWeek: 0, tenMinSessionsThisWeek: 0 };
  return {
    dayKey: today, weekKey: week,
    dailyKey, weeklyKey,
    dailyDoneToday: prev.dayKey === today ? !!prev.dailyDoneToday : false,
    weeklyDoneThisWeek: prev.weekKey === week ? !!prev.weeklyDoneThisWeek : false,
    dayProgress, weekProgress,
  };
}

function missionQualifies(def, progress){
  return (progress[def.progressKey] || 0) >= def.target;
}

export function dailyMissionByKey(key){ return DAILY_MISSIONS.find(m => m.key === key); }
export function weeklyMissionByKey(key){ return WEEKLY_MISSIONS.find(m => m.key === key); }

// ---------- 6.4 Seria (streak) + Safety Pins ----------
function advanceStreak(streak, today){
  const s = { ...streak };
  if (s.lastDay === today) return s; // druga sesja tego samego dnia — bez zmian
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (s.lastDay === null || s.lastDay === yesterday){
    s.n = (s.n || 0) + 1;
  } else {
    const gapDays = Math.round((new Date(today) - new Date(s.lastDay)) / 86400000);
    const missedDays = Math.max(0, gapDays - 1);
    if (missedDays > 0 && (s.pins || 0) >= missedDays){
      s.pins -= missedDays;
      s.n = (s.n || 0) + 1;
    } else {
      s.n = 1;
    }
  }
  s.lastDay = today;
  return s;
}

// ---------- Centralny punkt: koniec sesji RIG CHECK ----------
export function applySessionEnd({ minutes, reviewsDone, newDone, missionDone, goodOrEasyCount, hearCorrect }){
  const s = store.get();
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  const prevLevel = levelFromXp(s.xp);
  const prevRank = rankForLevel(prevLevel);

  const log = [...(s.log || [])];
  const todayEntry = log.find(l => l.d === today);
  const isSecondSessionToday = !!todayEntry;

  let xpGained = (minutes === 10 ? 110 : 50) + goodOrEasyCount * 5;
  if (isSecondSessionToday) xpGained *= 2;

  if (todayEntry){ todayEntry.xp += xpGained; todayEntry.sessions += 1; todayEntry.minutes += minutes; }
  else log.push({ d: today, xp: xpGained, sessions: 1, minutes });

  const streak = advanceStreak(s.streak || { n: 0, pins: 2, lastDay: null }, today);

  const stats = { ...s.stats };
  stats.sessionsTotal = (stats.sessionsTotal || 0) + 1;
  if (minutes === 10) stats.tenMinSessionsTotal = (stats.tenMinSessionsTotal || 0) + 1;
  stats.hearCorrectTotal = (stats.hearCorrectTotal || 0) + hearCorrect;

  const missions = getMissionsSnapshot(s, now);
  missions.dayProgress.sessionsToday += 1;
  missions.dayProgress.goodOrEasyToday += goodOrEasyCount;
  missions.dayProgress.hearCorrectToday += hearCorrect;
  missions.weekProgress.sessionsThisWeek += 1;
  if (minutes === 10) missions.weekProgress.tenMinSessionsThisWeek += 1;

  const completedMissions = [];
  const dailyDef = dailyMissionByKey(missions.dailyKey);
  if (!missions.dailyDoneToday && missionQualifies(dailyDef, missions.dayProgress)){
    xpGained += dailyDef.xp;
    missions.dailyDoneToday = true;
    completedMissions.push(dailyDef);
  }
  const weeklyDef = weeklyMissionByKey(missions.weeklyKey);
  if (!missions.weeklyDoneThisWeek && missionQualifies(weeklyDef, missions.weekProgress)){
    xpGained += weeklyDef.xp;
    missions.weeklyDoneThisWeek = true;
    completedMissions.push(weeklyDef);
  }

  const newXpTotal = s.xp + xpGained;
  const levelInfo = levelFromXpDetailed(newXpTotal);
  const newRank = rankForLevel(levelInfo.level);
  const rankChanged = newRank.name !== prevRank.name;

  const draftState = { ...s, xp: newXpTotal, log, streak, stats };
  const qualifiedKeys = checkBadges(draftState);
  const newlyEarnedKeys = qualifiedKeys.filter(k => !(s.badges || []).includes(k));
  const badges = [...new Set([...(s.badges || []), ...newlyEarnedKeys])];
  const newlyEarnedBadges = newlyEarnedKeys.map(k => BADGES.find(b => b.key === k));

  store.set({ xp: newXpTotal, log, streak, stats, missions, badges });

  return {
    xpGained,
    level: levelInfo.level,
    xpIntoLevel: levelInfo.xpIntoLevel,
    xpForLevel: levelInfo.xpForLevel,
    rank: newRank,
    rankChanged,
    newlyEarnedBadges,
    completedMissions,
  };
}

// ---------- Boss fight: nagroda za zwycięstwo (6.1: 200, finałowy 500) ----------
export function applyBossWin(bossId, { isFinal = false } = {}){
  const s = store.get();
  const prevLevel = levelFromXp(s.xp);
  const prevRank = rankForLevel(prevLevel);
  const alreadyWon = (s.bossesWon || []).includes(bossId);
  const xpGained = alreadyWon ? 0 : (isFinal ? 500 : 200);
  const bossesWon = alreadyWon ? s.bossesWon : [...(s.bossesWon || []), bossId];
  const newXpTotal = s.xp + xpGained;
  const levelInfo = levelFromXpDetailed(newXpTotal);
  const newRank = rankForLevel(levelInfo.level);
  const rankChanged = newRank.name !== prevRank.name;

  const draftState = { ...s, xp: newXpTotal, bossesWon };
  const qualifiedKeys = checkBadges(draftState);
  const newlyEarnedKeys = qualifiedKeys.filter(k => !(s.badges || []).includes(k));
  const badges = [...new Set([...(s.badges || []), ...newlyEarnedKeys])];
  const newlyEarnedBadges = newlyEarnedKeys.map(k => BADGES.find(b => b.key === k));

  store.set({ xp: newXpTotal, bossesWon, badges });

  return { xpGained, alreadyWon, level: levelInfo.level, xpIntoLevel: levelInfo.xpIntoLevel, xpForLevel: levelInfo.xpForLevel, rank: newRank, rankChanged, newlyEarnedBadges };
}

// ---------- Ekran awansu (pełnoekranowa animacja) ----------
export function showPromotionOverlay(rank){
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed; inset:0; z-index:50; background:var(--bg); display:flex; flex-direction:column; align-items:center; justify-content:center; padding:24px; text-align:center;';
  const label = document.createElement('div');
  label.style.cssText = 'color:var(--dim); font-size:13px; text-transform:uppercase; letter-spacing:2px; margin-bottom:10px;';
  label.textContent = 'Awans';
  const name = document.createElement('div');
  name.style.cssText = 'font-family:var(--font-display); font-size:36px; color:var(--white); text-transform:uppercase;';
  name.textContent = rank.name;
  const swashWrap = document.createElement('div');
  swashWrap.style.cssText = 'width:220px; margin:10px 0 24px 0;';
  mountBrush(swashWrap);
  const closeBtn = makeCloseButton(() => overlay.remove());
  overlay.appendChild(label);
  overlay.appendChild(name);
  overlay.appendChild(swashWrap);
  overlay.appendChild(closeBtn);
  document.body.appendChild(overlay);
}

function makeCloseButton(onClick){
  const btn = document.createElement('button');
  btn.className = 'btn btn-primary btn-lg';
  btn.textContent = 'Dalej';
  btn.addEventListener('click', onClick);
  return btn;
}
