import { store } from './state.js';

export const visibilityKey = (kind, id) => `${kind}:${String(id).trim().toLowerCase()}`;

export function isHiddenItem(kind, id){
  return new Set(store.get().hiddenItems || []).has(visibilityKey(kind, id));
}

export function hideItem(kind, id){
  const hidden = new Set(store.get().hiddenItems || []);
  hidden.add(visibilityKey(kind, id));
  store.set({ hiddenItems: [...hidden] });
}

export function visibleItems(items, kind, identity){
  return (items || []).filter(item => !isHiddenItem(kind, identity(item)));
}

export function hideButton(kind, id, label, onHide){
  const button = document.createElement('button');
  button.className = 'icon-box sm item-hide';
  button.type = 'button';
  button.textContent = '×';
  button.setAttribute('aria-label', `Ukryj globalnie: ${label}`);
  button.addEventListener('click', (event) => {
    event.stopPropagation();
    hideItem(kind, id);
    onHide?.();
  });
  return button;
}

export function restoreHiddenItems(){
  store.set({ hiddenItems: [], deleted: [] });
}
