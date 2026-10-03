// RIG TALK — i18n.js: L1 fade — stopniowe znikanie polskiego (PLAN.md §5.10)

import { store } from './state.js';
import * as game from './game.js';

/**
 * Tryb L1 dla danego poziomu:
 *  - 'full' (1–5): tłumaczenia zawsze widoczne
 *  - 'mix'  (6–12): tłumaczenia po dotknięciu
 *  - 'en'   (13+): tłumaczenia po długim przytrzymaniu
 * `settings.l1` pozwala wymusić tryb ręcznie ('auto' | 'full' | 'mix' | 'en').
 */
export function getL1Mode(level, override = 'auto'){
  if (override && override !== 'auto') return override;
  if (level <= 5) return 'full';
  if (level <= 12) return 'mix';
  return 'en';
}

export function currentL1Mode(){
  const s = store.get();
  const level = game.levelFromXp(s.xp);
  return getL1Mode(level, s.settings.l1);
}

/**
 * Buduje węzeł z tłumaczeniem PL zgodny z bieżącym trybem L1 i dodaje go do `container`.
 * 'full' → zwykły tekst. 'mix' → mała plakietka "PL", klik odsłania. 'en' → ukryte, długie przytrzymanie odsłania.
 */
export function appendTranslatable(container, plText, opts = {}){
  const mode = opts.mode || currentL1Mode();
  const className = opts.className || '';
  const style = opts.style || 'color:var(--dim); font-size:13px;';

  if (mode === 'full'){
    const el = document.createElement('div');
    el.className = className;
    el.dataset.l1Mode = 'full';
    el.style.cssText = style;
    el.textContent = plText;
    container.appendChild(el);
    return el;
  }

  if (mode === 'mix'){
    const wrap = document.createElement('div');
    wrap.dataset.l1Mode = 'mix';
    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'l1-reveal-pill';
    pill.textContent = 'PL';
    pill.style.cssText = 'font-size:11px; padding:2px 8px; border:1px solid var(--line); border-radius:10px; background:transparent; color:var(--dim); cursor:pointer;';
    const textEl = document.createElement('div');
    textEl.className = className;
    textEl.style.cssText = style;
    textEl.style.display = 'none';
    textEl.textContent = plText;
    pill.addEventListener('click', () => {
      const showing = textEl.style.display !== 'none';
      textEl.style.display = showing ? 'none' : 'block';
      pill.style.display = showing ? 'inline-block' : 'none';
    });
    wrap.appendChild(pill);
    wrap.appendChild(textEl);
    container.appendChild(wrap);
    return wrap;
  }

  // mode === 'en': ukryte, długie przytrzymanie (touch/mouse ~500ms) odsłania na chwilę
  const wrap = document.createElement('div');
  wrap.dataset.l1Mode = 'en';
  const hint = document.createElement('div');
  hint.className = 'l1-hold-hint';
  hint.textContent = '🇵🇱 przytrzymaj';
  hint.style.cssText = 'font-size:11px; color:var(--dim); opacity:0.6; cursor:pointer; user-select:none;';
  const textEl = document.createElement('div');
  textEl.className = className;
  textEl.style.cssText = style;
  textEl.style.display = 'none';
  textEl.textContent = plText;

  let pressTimer = null;
  const start = () => { pressTimer = setTimeout(() => { textEl.style.display = 'block'; hint.style.display = 'none'; }, 500); };
  const cancel = () => { clearTimeout(pressTimer); };
  const hide = () => { textEl.style.display = 'none'; hint.style.display = 'block'; };
  hint.addEventListener('mousedown', start);
  hint.addEventListener('touchstart', start, { passive: true });
  hint.addEventListener('mouseup', () => { cancel(); setTimeout(hide, 1200); });
  hint.addEventListener('touchend', () => { cancel(); setTimeout(hide, 1200); });
  hint.addEventListener('mouseleave', cancel);

  wrap.appendChild(hint);
  wrap.appendChild(textEl);
  container.appendChild(wrap);
  return wrap;
}
