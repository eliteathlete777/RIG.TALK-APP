// RIG TALK — brush.js: pociągnięcie pędzla (brush-swash), inline SVG, styl okładki BYQ
// Statyczna, ręcznie rysowana nieregularna ścieżka — bez zależności zewnętrznych.

export const brushSwashSVG = `
<svg class="brush-swash" viewBox="0 0 300 24" preserveAspectRatio="none" aria-hidden="true">
  <path d="M2 14 C 20 4, 40 20, 62 10 S 100 2, 130 14 S 175 22, 210 9 S 255 3, 298 13
           C 260 20, 220 16, 185 19 S 120 21, 80 17 S 30 21, 2 14 Z"
        fill="var(--red)"/>
</svg>`;

export function mountBrush(container){
  if (!container) return;
  container.insertAdjacentHTML('beforeend', brushSwashSVG);
}
