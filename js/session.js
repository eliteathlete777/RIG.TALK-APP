// RIG TALK — session.js: RIG CHECK 5/10 MIN, wybór toru, karty SAY/HEAR (PLAN.md §2.1)

import { store } from './state.js';
import * as srs from './srs.js';
import * as speech from './speech.js';
import { loadAllChunks, chunkTrack, matchesTrackMix, sortByCurriculumOrder, allChunksArray } from './content.js';
import * as game from './game.js';
import * as ai from './ai.js';
import * as i18n from './i18n.js';

const MISSIONS = {
  T: [
    { pl: 'Właśnie wszedłeś na stoisko. Przywitaj klienta i zapytaj, gdzie dokładnie ma wisieć ekran.', hint_pl: '„Hi, I’m Damian, the LED technician.” + „Where exactly do you want the screen?”' },
    { pl: 'Zapytaj klienta, kiedy będzie rusztowanie i kiedy włączą prąd.', hint_pl: '„When will the scaffold be here?” / „When is the power on?”' },
    { pl: 'Stagehand pyta „Where do you want this?”. Odpowiedz i daj mu następne zadanie.', hint_pl: '„Over there, next to the wall.” + „Open the next case, please.”' },
    { pl: 'Wytłumacz klientowi, jak ma podłączyć swój laptop do ekranu.', hint_pl: '„Plug your laptop in here.” „Set your output to 1920 by 1080.” „Choose extend.”' },
    { pl: 'Klient pyta, czy ekran może wisieć nad wejściem. Odpowiedz.', hint_pl: 'Użyj zwrotu typu „Yes, that is possible. We need…”' },
    { pl: 'Przechodzień pyta, czym się zajmujecie. Zagadaj go.', hint_pl: 'Krótkie przedstawienie firmy + pytanie o event.' },
  ],
  D: [
    { pl: 'Ktoś pyta Cię „Where are you from?”. Odpowiedz i zadaj pytanie zwrotne.', hint_pl: 'Odpowiedź + dopytanie, tak jak w D7.' },
    { pl: 'Kasjerka pyta „Do you need a bag?”. Odpowiedz.', hint_pl: 'Krótka, naturalna odpowiedź.' },
  ],
};

function pickMission(trackMix){
  const pool = trackMix === 'D' ? MISSIONS.D : trackMix === 'T' ? MISSIONS.T : [...MISSIONS.D, ...MISSIONS.T];
  return pool[Math.floor(Math.random() * pool.length)];
}

function pickDistractors(ctx, chunk, n = 2){
  const pool = allChunksArray(ctx).filter(c => c.id !== chunk.id && chunkTrack(c.id) === chunkTrack(chunk.id) && c.pl !== chunk.pl);
  const shuffled = pool.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n).map(c => c.pl);
}

function shuffle(arr){ return [...arr].sort(() => Math.random() - 0.5); }

/** Zbuduj plan sesji: kolejka powtórek + nowe zwroty + 1 misja. */
export async function buildSessionPlan(minutes){
  const ctx = await loadAllChunks();
  const s = store.get();
  const trackMix = s.settings.trackMix || 'T';
  const trackFilter = (id) => matchesTrackMix(id, trackMix);
  const now = new Date();
  const starredSet = new Set(s.starred || []);

  const reviewLimit = minutes === 10 ? 20 : 10;
  const newIntroducedToday = srs.countNewIntroducedToday(s.cards, now);
  const dailyCap = s.settings.newPerDay || 3;
  const remainingDailyCap = Math.max(0, dailyCap - newIntroducedToday);
  const newCount = Math.min(minutes === 10 ? 5 : 3, remainingDailyCap);
  const overdue = srs.countOverdue(s.cards, now);
  const newBlocked = overdue > 30 || newCount === 0;

  const reviewIds = srs.buildDueQueue(s.cards, starredSet, now, reviewLimit, trackFilter);

  let newIds = [];
  if (!newBlocked){
    const candidates = allChunksArray(ctx)
      .filter(c => !(c.id in s.cards) && trackFilter(c.id))
      .filter(c => !ctx.modulesDef[c.module]?.excludeFromSession)
      .map(c => c.id);
    const sorted = sortByCurriculumOrder(candidates, ctx);

    if (minutes === 10){
      const hear = sorted.filter(id => ctx.chunks.get(id).type === 'HEAR').slice(0, 2);
      const rest = sorted.filter(id => !hear.includes(id)).slice(0, Math.max(0, newCount - hear.length));
      newIds = sortByCurriculumOrder([...hear, ...rest], ctx).slice(0, newCount);
    } else {
      newIds = sorted.slice(0, newCount);
    }
  }

  const mission = pickMission(trackMix);

  const queue = [
    ...reviewIds.map(id => ({ kind: 'review', id })),
    ...newIds.map(id => ({ kind: 'new', id })),
    { kind: 'mission', mission },
    { kind: 'summary' },
  ];

  return { ctx, queue, minutes, trackMix, overdue, newBlocked, reviewCount: reviewIds.length, newCount: newIds.length };
}

// ---------- silnik sesji ----------

let el = null; // referencje DOM
let plan = null;
let cursor = 0;
let results = { reviewsDone: 0, newDone: 0, missionDone: false, xp: 0, goodOrEasyCount: 0, hearCorrect: 0 };
let sessionTimerHandle = null;

function qs(sel){ return document.querySelector(sel); }

export function initSessionDom(){
  el = {
    root: qs('[data-screen="session"]'),
    body: qs('#sessionBody'),
    progress: qs('#sessionProgress'),
    timer: qs('#sessionTimer'),
    exit: qs('#sessionExit'),
  };
  el.exit.addEventListener('click', () => {
    if (confirm('Przerwać sesję? Postęp w tej karcie zostanie utracony.')) endSession(true);
  });
}

function showSessionScreen(){
  document.querySelectorAll('[data-screen]').forEach(sec => sec.classList.remove('active'));
  el.root.classList.add('active');
  document.getElementById('bottomNav').style.display = 'none';
}

function hideSessionScreen(){
  el.root.classList.remove('active');
  document.getElementById('bottomNav').style.display = '';
}

function startTimer(minutes){
  let secondsLeft = minutes * 60;
  const render = () => {
    const m = Math.floor(secondsLeft / 60);
    const s = String(secondsLeft % 60).padStart(2, '0');
    el.timer.textContent = `${m}:${s}`;
  };
  render();
  sessionTimerHandle = setInterval(() => {
    secondsLeft = Math.max(0, secondsLeft - 1);
    render();
  }, 1000);
}

function stopTimer(){
  if (sessionTimerHandle) clearInterval(sessionTimerHandle);
  sessionTimerHandle = null;
}

/**
 * Sesja skupiona na wybranych zwrotach (etap PIERWSZEGO STOISKA, moduł z KURSU).
 * Bez dziennego limitu nowych i bez misji: najpierw zaległe/nieznane, maks. `limit` kart.
 */
export async function startFocusedSession(ids, { limit = 12 } = {}){
  const ctx = await loadAllChunks();
  const s = store.get();
  const now = new Date();
  const valid = ids.filter(id => ctx.chunks.has(id));
  const unseen = valid.filter(id => !(id in s.cards));
  const due = valid.filter(id => (id in s.cards) && srs.isDue(s.cards[id], now));
  const rest = shuffle(valid.filter(id => (id in s.cards) && !srs.isDue(s.cards[id], now)));
  const picked = [...due, ...unseen, ...rest].slice(0, limit);
  if (!picked.length) return;
  plan = {
    ctx, minutes: 5, trackMix: 'T', focused: true,
    queue: [
      ...picked.map(id => ({ kind: id in s.cards ? 'review' : 'new', id })),
      { kind: 'summary' },
    ],
  };
  cursor = 0;
  results = { reviewsDone: 0, newDone: 0, missionDone: false, xp: 0, goodOrEasyCount: 0, hearCorrect: 0 };
  showSessionScreen();
  startTimer(Math.max(3, Math.ceil(picked.length / 2)));
  renderStep();
}

export async function startSession(minutes){
  plan = await buildSessionPlan(minutes);
  cursor = 0;
  results = { reviewsDone: 0, newDone: 0, missionDone: false, xp: 0, goodOrEasyCount: 0, hearCorrect: 0 };
  showSessionScreen();
  startTimer(minutes);
  renderStep();
}

function updateProgress(){
  el.progress.textContent = `${cursor + 1}/${plan.queue.length}`;
}

function saveCard(id, card){
  const cards = { ...store.get().cards, [id]: card };
  store.set({ cards });
}

function nextStep(){
  cursor++;
  if (cursor >= plan.queue.length){ endSession(false); return; }
  renderStep();
}

let lastOutcome = null;

/** Przerwanie sesji w trakcie (przycisk ✕) — bez naliczania nagród. */
function endSession(aborted){
  stopTimer();
  hideSessionScreen();
  if (aborted) lastOutcome = null;
  window.dispatchEvent(new CustomEvent('rigtalk:session-ended', { detail: { aborted, results, outcome: lastOutcome } }));
}

/** Naliczenie nagród — wywoływane raz, w momencie wejścia na ekran podsumowania. */
function finalizeRewards(){
  lastOutcome = game.applySessionEnd({
    minutes: plan.minutes,
    reviewsDone: results.reviewsDone,
    newDone: results.newDone,
    missionDone: results.missionDone,
    goodOrEasyCount: results.goodOrEasyCount,
    hearCorrect: results.hearCorrect,
  });
  results.xp = lastOutcome.xpGained;
  return lastOutcome;
}

function renderStep(){
  updateProgress();
  const step = plan.queue[cursor];
  el.body.innerHTML = '';
  if (step.kind === 'review') renderReviewCard(step.id);
  else if (step.kind === 'new') renderNewCard(step.id);
  else if (step.kind === 'mission') renderMission(step.mission);
  else if (step.kind === 'summary') renderSummary();
}

function makeButton(label, cls, onClick){
  const btn = document.createElement('button');
  btn.className = cls;
  btn.textContent = label;
  btn.addEventListener('click', onClick);
  return btn;
}

function playAudio(chunk, rate = 1.0){
  const lang = store.get().settings.variant === 'us' ? 'en-US' : 'en-GB';
  speech.speak(chunk.en, { lang, rate }).catch(() => {});
}

function appendRatingRow(container, onRate, suggested){
  const row = document.createElement('div');
  row.style.cssText = 'display:flex; gap:8px; margin-top:14px; flex-wrap:wrap;';
  const ratings = [
    ['Nie wiem', srs.Rating.Again, 'var(--dim)'],
    ['Trudne', srs.Rating.Hard, '#c98a2b'],
    ['Umiem', srs.Rating.Good, 'var(--ok)'],
    ['Łatwe', srs.Rating.Easy, 'var(--red)'],
  ];
  ratings.forEach(([label, rating]) => {
    const btn = makeButton(label, 'btn', () => onRate(rating));
    btn.style.flex = '1';
    btn.style.padding = '10px 4px';
    btn.style.fontSize = '14px';
    if (suggested === rating) btn.style.outline = '2px solid var(--red)';
    row.appendChild(btn);
  });
  container.appendChild(row);
}

async function trySpeakAndScore(expectedEn, onScored){
  try {
    const alts = await speech.recognizeOnce({ lang: 'en-US' });
    const score = speech.scoreTranscript(expectedEn, alts);
    onScored(score, alts[0]);
  } catch (e){
    onScored(null, null); // fallback: brak wyniku, użytkownik ocenia sam
  }
}

// ---------- REVIEW: SAY ----------
function renderReviewCard(id){
  const chunk = plan.ctx.chunks.get(id);
  if (chunk.type === 'HEAR') return renderReviewHear(chunk);

  const card = document.createElement('div');
  card.className = 'card';
  const pl = document.createElement('div');
  pl.style.cssText = 'font-size:18px; margin-bottom:6px;';
  pl.textContent = chunk.pl;
  const hint = document.createElement('div');
  hint.style.cssText = 'color:var(--dim); font-size:13px; margin-bottom:16px;';
  hint.textContent = chunk.hint_pl || '';
  card.appendChild(pl);
  card.appendChild(hint);

  const reveal = makeButton('POKAŻ', 'btn btn-primary btn-lg', () => {
    reveal.remove();
    const en = document.createElement('div');
    en.style.cssText = 'font-family:var(--font-display); font-size:20px; margin-bottom:10px; display:flex; align-items:center; gap:10px;';
    en.textContent = chunk.en;
    const speakBtn = makeButton('🔊', 'icon-box', () => playAudio(chunk));
    en.appendChild(speakBtn);
    card.appendChild(en);

    const micBtn = makeButton('🎤 Powiedz i sprawdź', 'btn btn-outline', () => {
      micBtn.disabled = true;
      micBtn.textContent = 'Słucham…';
      trySpeakAndScore(chunk.en, (score, heard) => {
        micBtn.remove();
        let suggested = srs.Rating.Good;
        if (score !== null){
          const grade = speech.gradeFromScore(score);
          suggested = grade === 'Good' ? srs.Rating.Good : grade === 'Hard' ? srs.Rating.Hard : srs.Rating.Again;
          const scoreLabel = document.createElement('div');
          scoreLabel.style.cssText = 'color:var(--dim); font-size:13px; margin-bottom:6px;';
          scoreLabel.textContent = `Rozpoznano: "${heard || '?'}" — dopasowanie ${score}%`;
          card.appendChild(scoreLabel);
        } else {
          const fallbackLabel = document.createElement('div');
          fallbackLabel.style.cssText = 'color:var(--dim); font-size:13px; margin-bottom:6px;';
          fallbackLabel.textContent = 'Rozpoznawanie niedostępne — oceń się sam.';
          card.appendChild(fallbackLabel);
        }
        appendRatingRow(card, (rating) => rate(rating), suggested);
      });
    });
    card.appendChild(micBtn);
    appendRatingRow(card, (rating) => rate(rating), null);
  });
  card.appendChild(reveal);
  el.body.appendChild(card);

  function rate(rating){
    const { card: newCardState } = srs.reviewCard(getCardFor(id), rating, new Date());
    saveCard(id, newCardState);
    results.reviewsDone++;
    if (rating === srs.Rating.Good || rating === srs.Rating.Easy) results.goodOrEasyCount++;
    nextStep();
  }
}

function getCardFor(id){
  return store.get().cards[id];
}

/** Karta HEAR: tekst EN do przeczytania + lektor na żądanie (głos systemowy bywa słaby, więc bez autoodtwarzania). */
function appendHearPrompt(card, chunk){
  const en = document.createElement('div');
  en.style.cssText = 'font-family:var(--font-display); font-size:22px; margin-bottom:10px;';
  en.textContent = '„' + chunk.en + '”';
  card.appendChild(en);
  card.appendChild(makeButton('🔊 Posłuchaj', 'btn', () => playAudio(chunk)));
}

// ---------- REVIEW: HEAR ----------
function renderReviewHear(chunk){
  const card = document.createElement('div');
  card.className = 'card';
  const label = document.createElement('div');
  label.style.cssText = 'color:var(--dim); font-size:12px; text-transform:uppercase; margin-bottom:10px;';
  label.textContent = 'Co to znaczy? Wybierz.';
  card.appendChild(label);
  appendHearPrompt(card, chunk);

  const options = shuffle([chunk.pl, ...pickDistractors(plan.ctx, chunk, 2)]);
  const optsWrap = document.createElement('div');
  optsWrap.style.cssText = 'display:flex; flex-direction:column; gap:8px; margin-top:14px;';
  options.forEach(opt => {
    const b = makeButton(opt, 'btn', () => choose(opt, b));
    optsWrap.appendChild(b);
  });
  card.appendChild(optsWrap);
  el.body.appendChild(card);

  function choose(opt, btnEl){
    const correct = opt === chunk.pl;
    optsWrap.querySelectorAll('button').forEach(b => b.disabled = true);
    btnEl.style.borderColor = correct ? 'var(--ok)' : 'var(--red)';
    if (correct) results.hearCorrect++;

    const reveal = document.createElement('div');
    reveal.style.cssText = 'margin-top:14px;';
    reveal.innerHTML = '';
    const en = document.createElement('div');
    en.style.cssText = 'font-family:var(--font-display); font-size:18px; margin-bottom:6px;';
    en.textContent = chunk.en;
    const reply = document.createElement('div');
    reply.style.cssText = 'color:var(--dim); font-size:14px; margin-bottom:12px;';
    reply.textContent = 'Twoja odpowiedź: ' + chunk.reply;
    reveal.appendChild(en);
    reveal.appendChild(reply);
    card.appendChild(reveal);

    appendRatingRow(card, (rating) => rate(rating), correct ? srs.Rating.Good : srs.Rating.Hard);
  }

  function rate(rating){
    const newState = srs.reviewCard(getCardFor(chunk.id), rating, new Date()).card;
    saveCard(chunk.id, newState);
    results.reviewsDone++;
    nextStep();
  }
}

// ---------- NOWY ZWROT: SAY ----------
function renderNewCard(id){
  const chunk = plan.ctx.chunks.get(id);
  if (chunk.type === 'HEAR') return renderNewHear(chunk);

  const card = document.createElement('div');
  card.className = 'card';
  const badge = document.createElement('div');
  badge.style.cssText = 'color:var(--red); font-size:12px; text-transform:uppercase; margin-bottom:8px;';
  badge.textContent = 'Nowy zwrot';
  const en = document.createElement('div');
  en.style.cssText = 'font-family:var(--font-display); font-size:22px; margin-bottom:4px;';
  en.textContent = chunk.en;

  card.appendChild(badge);
  card.appendChild(en);
  // PL zawsze widoczny przy nowym zwrocie (uczeń A1); lektor tylko na żądanie — bez autoodtwarzania.
  const plLine = document.createElement('div');
  plLine.style.cssText = 'color:var(--dim); margin-bottom:8px;';
  plLine.textContent = chunk.pl;
  card.appendChild(plLine);
  if (chunk.hint_pl){
    const hintLine = document.createElement('div');
    hintLine.style.cssText = 'color:var(--dim); font-size:13px; margin-bottom:14px; border-left:3px solid var(--red); padding-left:8px;';
    hintLine.textContent = chunk.hint_pl;
    card.appendChild(hintLine);
  }

  const toolRow = document.createElement('div');
  toolRow.style.cssText = 'display:flex; gap:8px; flex-wrap:wrap;';
  toolRow.appendChild(makeButton('🔊 Posłuchaj', 'btn', () => playAudio(chunk, 0.85)));
  card.appendChild(toolRow);
  el.body.appendChild(card);
  proceedToSay();

  function proceedToSay(){
    let ratingRow = null;
    const paintRating = (suggested) => {
      if (ratingRow) ratingRow.remove();
      appendRatingRow(card, rate, suggested);
      ratingRow = card.lastElementChild;
    };
    const sayBtn = makeButton('🎤 Powiedz na głos', 'btn btn-outline', () => {
      sayBtn.disabled = true;
      sayBtn.textContent = 'Słucham…';
      trySpeakAndScore(chunk.en, (score, heard) => {
        sayBtn.remove();
        let suggested = srs.Rating.Good;
        if (score !== null){
          const grade = speech.gradeFromScore(score);
          suggested = grade === 'Good' ? srs.Rating.Good : grade === 'Hard' ? srs.Rating.Hard : srs.Rating.Again;
          const scoreLabel = document.createElement('div');
          scoreLabel.style.cssText = 'color:var(--dim); font-size:13px; margin-top:10px;';
          scoreLabel.textContent = `Rozpoznano: "${heard || '?'}" — dopasowanie ${score}%`;
          card.insertBefore(scoreLabel, ratingRow);
        }
        paintRating(suggested);
      });
    });
    if (speech.isRecognitionSupported()) toolRow.appendChild(sayBtn);
    paintRating(null);
  }

  function rate(rating){
    const now = new Date();
    const fresh = srs.newCard(now);
    const { card: reviewed } = srs.reviewCard(fresh, rating, now);
    saveCard(id, reviewed);
    results.newDone++;
    if (rating === srs.Rating.Good || rating === srs.Rating.Easy) results.goodOrEasyCount++;
    nextStep();
  }
}

// ---------- NOWY ZWROT: HEAR ----------
function renderNewHear(chunk){
  const card = document.createElement('div');
  card.className = 'card';
  const badge = document.createElement('div');
  badge.style.cssText = 'color:var(--red); font-size:12px; text-transform:uppercase; margin-bottom:8px;';
  badge.textContent = 'Nowy zwrot — to usłyszysz';
  card.appendChild(badge);
  appendHearPrompt(card, chunk);

  const options = shuffle([chunk.pl, ...pickDistractors(plan.ctx, chunk, 2)]);
  const optsWrap = document.createElement('div');
  optsWrap.style.cssText = 'display:flex; flex-direction:column; gap:8px; margin-top:14px;';
  options.forEach(opt => {
    const b = makeButton(opt, 'btn', () => choose(opt, b));
    optsWrap.appendChild(b);
  });
  card.appendChild(optsWrap);
  el.body.appendChild(card);

  function choose(opt, btnEl){
    const correct = opt === chunk.pl;
    optsWrap.querySelectorAll('button').forEach(b => b.disabled = true);
    btnEl.style.borderColor = correct ? 'var(--ok)' : 'var(--red)';
    if (correct) results.hearCorrect++;

    const en = document.createElement('div');
    en.style.cssText = 'font-family:var(--font-display); font-size:18px; margin-top:14px;';
    en.textContent = chunk.en;
    const reply = document.createElement('div');
    reply.style.cssText = 'color:var(--dim); font-size:14px; margin:6px 0 12px 0;';
    reply.textContent = 'Twoja odpowiedź: ' + chunk.reply;
    card.appendChild(en);
    card.appendChild(reply);

    appendRatingRow(card, rate, correct ? srs.Rating.Good : srs.Rating.Hard);
  }

  function rate(rating){
    const now = new Date();
    const fresh = srs.newCard(now);
    const { card: reviewed } = srs.reviewCard(fresh, rating, now);
    saveCard(chunk.id, reviewed);
    results.newDone++;
    nextStep();
  }
}

// ---------- MISJA ----------
function renderMission(mission){
  const card = document.createElement('div');
  card.className = 'card';
  const badge = document.createElement('div');
  badge.style.cssText = 'color:var(--red); font-size:12px; text-transform:uppercase; margin-bottom:8px;';
  badge.textContent = 'Misja';
  const task = document.createElement('div');
  task.style.cssText = 'font-size:16px; margin-bottom:8px;';
  task.textContent = mission.pl;
  const textarea = document.createElement('textarea');
  textarea.placeholder = 'Napisz albo powiedz na głos, a potem kliknij Gotowe.';
  textarea.style.cssText = 'width:100%; min-height:70px; background:var(--bg); color:var(--white); border:1px solid var(--line); border-radius:8px; padding:8px; margin-bottom:14px;';

  card.appendChild(badge);
  card.appendChild(task);
  if (mission.hint_pl) i18n.appendTranslatable(card, mission.hint_pl, { style: 'color:var(--dim); font-size:13px; margin-bottom:14px;' });
  card.appendChild(textarea);

  const aiState = ai.getButtonState();
  const aiBtn = makeButton('🤖 Sprawdź mnie', 'btn btn-outline', async () => {
    if (!textarea.value.trim()) return;
    aiBtn.disabled = true;
    aiBtn.textContent = 'Sprawdzam…';
    try {
      const data = await ai.checkWithAI({
        task_pl: mission.pl,
        context: 'RIG TALK — trening rozmowy z klientem na targach.',
        user_text: textarea.value.trim(),
        level: 1,
      });
      renderAiResult(data);
    } catch (e){
      const err = document.createElement('div');
      err.style.cssText = 'color:var(--dim); font-size:13px; margin-top:8px;';
      err.textContent = 'Sprawdzanie AI niedostępne. Misja i tak zostanie zaliczona.';
      card.appendChild(err);
    } finally {
      aiBtn.disabled = false;
      aiBtn.textContent = '🤖 Sprawdź mnie';
    }
  });
  if (aiState.disabled){
    aiBtn.disabled = true;
    aiBtn.style.opacity = '0.4';
    aiBtn.title = aiState.reason === 'offline' ? 'Brak internetu' : 'Dzienny limit AI wykorzystany';
  }
  card.appendChild(aiBtn);

  function renderAiResult(data){
    const box = document.createElement('div');
    box.style.cssText = 'margin-top:10px; padding:10px; border:1px solid var(--line); border-radius:8px;';
    const scoreLine = document.createElement('div');
    scoreLine.style.cssText = 'color:' + (data.score >= 70 ? 'var(--ok)' : 'var(--red)') + '; font-weight:500;';
    scoreLine.textContent = `Wynik: ${data.score}/100`;
    const naturalLine = document.createElement('div');
    naturalLine.style.cssText = 'margin-top:6px;';
    naturalLine.textContent = data.natural || data.corrected || '';
    const tipLine = document.createElement('div');
    tipLine.style.cssText = 'color:var(--dim); font-size:13px; margin-top:6px;';
    tipLine.textContent = data.tip_pl || '';
    box.appendChild(scoreLine);
    box.appendChild(naturalLine);
    box.appendChild(tipLine);
    card.insertBefore(box, doneBtn);
  }

  const doneBtn = makeButton('Gotowe', 'btn btn-primary btn-lg', () => {
    results.missionDone = true;
    nextStep();
  });
  card.appendChild(doneBtn);
  el.body.appendChild(card);
}

// ---------- PODSUMOWANIE ----------
function renderSummary(){
  stopTimer();
  const outcome = finalizeRewards();

  const card = document.createElement('div');
  card.className = 'card';
  const title = document.createElement('h2');
  title.style.color = 'var(--red)';
  title.textContent = 'PUNKT ZALICZONY.';
  card.appendChild(title);

  const stats = document.createElement('div');
  stats.style.cssText = 'color:var(--dim); font-size:14px; line-height:1.8; margin:10px 0 14px 0;';
  const lines = [
    `Powtórki: ${results.reviewsDone}`,
    `Nowe zwroty: ${results.newDone}`,
    `Misja: ${results.missionDone ? 'zaliczona' : '—'}`,
    `+${outcome.xpGained} XP`,
  ];
  lines.forEach(t => { const d = document.createElement('div'); d.textContent = t; stats.appendChild(d); });
  card.appendChild(stats);

  const xpRow = document.createElement('div');
  xpRow.className = 'xp-row';
  const bar = document.createElement('div');
  bar.className = 'xp-bar';
  const fill = document.createElement('div');
  fill.className = 'xp-bar-fill';
  fill.style.width = Math.round((outcome.xpIntoLevel / outcome.xpForLevel) * 100) + '%';
  bar.appendChild(fill);
  const levelBadge = document.createElement('span');
  levelBadge.className = 'level-badge';
  levelBadge.textContent = `LVL ${outcome.level}`;
  xpRow.appendChild(bar);
  xpRow.appendChild(levelBadge);
  card.appendChild(xpRow);

  if (outcome.newlyEarnedBadges.length){
    const badgeLine = document.createElement('div');
    badgeLine.style.cssText = 'color:var(--red); font-size:13px; margin-bottom:10px;';
    badgeLine.textContent = '🏅 Nowa odznaka: ' + outcome.newlyEarnedBadges.map(b => b.label).join(', ');
    card.appendChild(badgeLine);
  }
  if (outcome.completedMissions.length){
    const missionLine = document.createElement('div');
    missionLine.style.cssText = 'color:var(--ok); font-size:13px; margin-bottom:10px;';
    missionLine.textContent = '✔ Misja ukończona: ' + outcome.completedMissions.map(m => m.label).join(', ');
    card.appendChild(missionLine);
  }

  const backBtn = makeButton(plan.focused ? 'Wróć' : 'Wróć do bazy', 'btn btn-primary btn-lg', () => endSession(false));
  card.appendChild(backBtn);
  el.body.appendChild(card);

  if (outcome.rankChanged) game.showPromotionOverlay(outcome.rank);
}
