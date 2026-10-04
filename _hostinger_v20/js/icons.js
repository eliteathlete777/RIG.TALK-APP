// RIG TALK — icons.js: minimalne ikony SVG (outline), bez zewnętrznych fontów (działa offline)
// Każda funkcja zwraca gotowy <svg> jako string, kolor dziedziczy z `currentColor`.

const stroke = 'stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"';

export const icons = {
  home: `<svg viewBox="0 0 24 24" ${stroke}><path d="M4 11.5 12 4l8 7.5"/><path d="M6 10v9h12v-9"/><path d="M10 19v-5h4v5"/></svg>`,
  chat: `<svg viewBox="0 0 24 24" ${stroke}><path d="M4 5h16v11H8l-4 4V5Z"/></svg>`,
  tool: `<svg viewBox="0 0 24 24" ${stroke}><path d="M14.5 3.5 20.5 9.5 9.5 20.5 3.5 14.5Z"/><path d="M8 8l8 8"/></svg>`,
  alert: `<svg viewBox="0 0 24 24" ${stroke}><path d="M12 3 22 20H2Z"/><path d="M12 9v5"/><path d="M12 17h.01"/></svg>`,
  book: `<svg viewBox="0 0 24 24" ${stroke}><path d="M4 4h9a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3Z"/><path d="M16 4h4v16h-4"/></svg>`,
  speaker: `<svg viewBox="0 0 24 24" ${stroke}><path d="M4 9v6h4l6 4V5L8 9Z"/><path d="M17 9a4 4 0 0 1 0 6"/></svg>`,
  mic: `<svg viewBox="0 0 24 24" ${stroke}><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/></svg>`,
  star: `<svg viewBox="0 0 24 24" ${stroke}><path d="M12 3.5 14.6 9l6 .9-4.3 4.2 1 6-5.3-2.8-5.3 2.8 1-6-4.3-4.2 6-.9Z"/></svg>`,
  starFilled: `<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" fill="currentColor"><path d="M12 3.5 14.6 9l6 .9-4.3 4.2 1 6-5.3-2.8-5.3 2.8 1-6-4.3-4.2 6-.9Z"/></svg>`,
  settings: `<svg viewBox="0 0 24 24" ${stroke}><circle cx="12" cy="12" r="3"/><path d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/></svg>`,
  bolt: `<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" fill="currentColor"><path d="M13 2 4 14h6l-1 8 9-12h-6Z"/></svg>`,
  check: `<svg viewBox="0 0 24 24" ${stroke}><path d="M4 12l5 5L20 6"/></svg>`,
  screen: `<svg viewBox="0 0 24 24" ${stroke}><path d="M3 3h18"/><path d="M8 3v3M16 3v3"/><rect x="4" y="6" width="16" height="11" rx="1"/><path d="M8 9.5h.01M12 9.5h.01M16 9.5h.01M8 13.5h.01M12 13.5h.01M16 13.5h.01"/></svg>`,
  layers: `<svg viewBox="0 0 24 24" ${stroke}><path d="M12 3 21 8l-9 5-9-5Z"/><path d="M3 13l9 5 9-5"/></svg>`,
  lock: `<svg viewBox="0 0 24 24" ${stroke}><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>`,
};

export function iconEl(name, size = 20){
  const span = document.createElement('span');
  span.className = 'icon';
  span.style.width = size + 'px';
  span.style.height = size + 'px';
  span.innerHTML = icons[name] || '';
  return span;
}
