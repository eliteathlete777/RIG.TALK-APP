// RIG TALK — acc.js: rozwijane podkategorie (details/summary) i pasek „Rozwiń wszystko / Zwiń wszystko".

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

/** Zwraca { wrap, body }. Wypełniasz body. badge: krótki napis po prawej (np. 3/5). */
export function acc(title, { open = false, badge = '', color = '', tone = '' } = {}){
  const wrap = el('details', 'mz-acc' + (tone ? ' ' + tone : ''));
  if (open) wrap.open = true;
  if (color) wrap.style.setProperty('--ac', color);
  const sum = el('summary');
  sum.appendChild(el('span', 'mz-acc-t', title));
  if (badge) sum.appendChild(el('small', 'mz-acc-b', badge));
  wrap.appendChild(sum);
  const body = el('div', 'mz-acc-body');
  wrap.appendChild(body);
  return { wrap, body };
}

/** Pasek z przyciskami do otwierania i zamykania wszystkich podkategorii w kontenerze. */
export function expandBar(scope){
  const bar = el('div', 'mz-expand');
  const open = el('button', 'btn', 'Rozwiń wszystko');
  const close = el('button', 'btn', 'Zwiń wszystko');
  open.addEventListener('click', () => scope.querySelectorAll('details.mz-acc').forEach(d => { d.open = true; }));
  close.addEventListener('click', () => scope.querySelectorAll('details.mz-acc').forEach(d => { d.open = false; }));
  bar.append(open, close);
  return bar;
}

/** Zamienia tekst z wypunktowaniem na tekst do skopiowania. */
export function bulletsToText(title, groups){
  const lines = [title.toUpperCase(), ''];
  groups.forEach(g => {
    lines.push(g.title.toUpperCase());
    g.items.forEach(i => lines.push('- ' + i));
    lines.push('');
  });
  return lines.join('\n').trim();
}
