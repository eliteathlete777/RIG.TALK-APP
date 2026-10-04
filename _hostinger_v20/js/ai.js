// RIG TALK — ai.js: AI tylko korekta („Sprawdź mnie”), PLAN.md §3.3
// Frontend NIGDY nie trzyma klucza API — wszystko idzie przez webhook n8n → Claude Haiku 4.5.

import { store } from './state.js';

const WEBHOOK_URL = 'https://n8n.srv1055997.hstgr.cloud/webhook/rig-talk-check';
const DAILY_LIMIT = 30;
const TIMEOUT_MS = 12000;

// Pozwala testom/dev wskazać inny endpoint (np. lokalny mock) bez zmiany kodu produkcyjnego.
let webhookOverride = null;
export function _setWebhookUrlForTesting(url){ webhookOverride = url; }

function todayKey(){ return new Date().toISOString().slice(0, 10); }

/** Ile zapytań AI zostało dzisiaj wykorzystanych (licznik resetuje się automatycznie o północy). */
export function usedToday(){
  const s = store.get();
  return s.aiUsedDate === todayKey() ? (s.aiUsedToday || 0) : 0;
}

export function remainingToday(){
  return Math.max(0, DAILY_LIMIT - usedToday());
}

function bumpUsage(){
  const today = todayKey();
  const used = usedToday();
  store.set({ aiUsedDate: today, aiUsedToday: used + 1 });
}

/**
 * Stan przycisku „Sprawdź mnie” — do wyszarzenia w UI.
 * @returns {{disabled:boolean, reason:null|'offline'|'limit'}}
 */
export function getButtonState(){
  if (typeof navigator !== 'undefined' && navigator.onLine === false){
    return { disabled: true, reason: 'offline' };
  }
  if (remainingToday() <= 0){
    return { disabled: true, reason: 'limit' };
  }
  return { disabled: false, reason: null };
}

/**
 * Wysyła próbę użytkownika do sprawdzenia przez AI.
 * @param {{task_pl:string, context?:string, expected_intent?:string, user_text:string, level?:number}} payload
 * @returns {Promise<{ok:boolean, score:number, corrected:string, natural:string, tip_pl:string, new_chunk?:string}>}
 */
export async function checkWithAI(payload){
  const btnState = getButtonState();
  if (btnState.disabled){
    throw Object.assign(new Error('Sprawdzanie AI niedostępne: ' + btnState.reason), { code: btnState.reason });
  }

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), TIMEOUT_MS) : null;

  try {
    const res = await fetch(webhookOverride || WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller?.signal,
    });
    if (!res.ok) throw new Error('Webhook zwrócił błąd HTTP ' + res.status);
    const data = await res.json();
    if (typeof data.ok !== 'boolean' || typeof data.score !== 'number'){
      throw new Error('Nieprawidłowa odpowiedź AI (brak wymaganych pól ok/score)');
    }
    bumpUsage();
    return data;
  } finally {
    if (timer) clearTimeout(timer);
  }
}
