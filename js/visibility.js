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

export function unhideItem(kind, id){
  const key = visibilityKey(kind, id);
  store.set({ hiddenItems: (store.get().hiddenItems || []).filter(item => item !== key) });
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
    const old = document.querySelector('.undo-toast');
    old?.remove();
    const toast = document.createElement('div');
    toast.className = 'undo-toast';
    const copy = document.createElement('span');
    copy.textContent = `Ukryto: ${label}`;
    const undo = document.createElement('button');
    undo.type = 'button'; undo.textContent = 'Cofnij';
    toast.append(copy, undo);
    undo.addEventListener('click', () => {
      unhideItem(kind, id);
      toast.remove();
      window.dispatchEvent(new CustomEvent('rigtalk:visibility-restored'));
    });
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
  });
  return button;
}

export function restoreHiddenItems(){
  store.set({ hiddenItems: [], deleted: [] });
}
