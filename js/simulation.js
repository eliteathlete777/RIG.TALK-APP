import { store } from './state.js';
import { loadAllChunks } from './content.js';
import { speakEn } from './glossary.js';

let simulationCache = null;

async function loadSimulation(){
  if (simulationCache) return simulationCache;
  const res = await fetch('content/mission-simulation.json', { cache: 'no-store' });
  if (!res.ok) throw new Error('Nie udało się wczytać próby generalnej.');
  simulationCache = await res.json();
  return simulationCache;
}

export async function renderSimulation(container){
  const [data, ctx] = await Promise.all([loadSimulation(), loadAllChunks()]);
  let index = 0;
  let revealed = false;
  const results = [];

  function paint(){
    container.innerHTML = '';
    const intro = document.createElement('div');
    intro.className = 'simulation-intro';
    intro.innerHTML = `<h2>${data.title}</h2><p>${data.subtitle}</p>`;
    container.appendChild(intro);
    if (index >= data.steps.length){
      const good = results.filter(Boolean).length;
      const weakIds = data.steps.filter((_, i) => !results[i]).flatMap(step => step.ids);
      if (weakIds.length){
        const starred = new Set(store.get().starred || []);
        weakIds.forEach(id => starred.add(id));
        store.set({ starred: [...starred], simulation: { lastScore: good, total: data.steps.length, at: new Date().toISOString() } });
      } else {
        store.set({ simulation: { lastScore: good, total: data.steps.length, at: new Date().toISOString() } });
      }
      const done = document.createElement('div');
      done.className = 'simulation-card frame';
      done.innerHTML = `<div class="eyebrow">WYNIK PRÓBY</div><h2>${good}/${data.steps.length}</h2><p>${weakIds.length ? 'Zwroty z miejsc, w których stanąłeś, trafiły do Ulubionych.' : 'Przeszedłeś całą realizację bez zatrzymania.'}</p>`;
      const again = document.createElement('button');
      again.className = 'btn btn-primary btn-lg';
      again.textContent = 'POWTÓRZ PRÓBĘ';
      again.addEventListener('click', () => { index = 0; results.length = 0; revealed = false; paint(); });
      done.appendChild(again);
      container.appendChild(done);
      return;
    }

    const step = data.steps[index];
    const chunks = step.ids.map(id => ctx.chunks.get(id)).filter(Boolean);
    const card = document.createElement('div');
    card.className = 'simulation-card frame';
    const meta = document.createElement('div');
    meta.className = 'simulation-meta';
    meta.textContent = `SYTUACJA ${index + 1} / ${data.steps.length}`;
    const prompt = document.createElement('h3');
    prompt.textContent = step.prompt;
    const instruction = document.createElement('p');
    instruction.className = 'muted-sm';
    instruction.textContent = 'Powiedz odpowiedź na głos. Nie czytaj jej w głowie.';
    card.append(meta, prompt, instruction);

    if (!revealed){
      const reveal = document.createElement('button');
      reveal.className = 'btn btn-primary btn-lg';
      reveal.textContent = 'POKAŻ MODEL';
      reveal.addEventListener('click', () => { revealed = true; paint(); });
      card.appendChild(reveal);
    } else {
      const answers = document.createElement('div');
      answers.className = 'simulation-answers';
      chunks.forEach(chunk => {
        const row = document.createElement('button');
        row.className = 'simulation-answer';
        row.innerHTML = `<span>${chunk.en}</span><small>${chunk.pl}</small>`;
        row.addEventListener('click', () => speakEn(chunk.en));
        answers.appendChild(row);
      });
      const grade = document.createElement('div');
      grade.className = 'simulation-grade';
      [['STANĄŁEM', false], ['POSZŁO', true]].forEach(([label, ok]) => {
        const btn = document.createElement('button');
        btn.className = ok ? 'btn btn-primary' : 'btn btn-ghost';
        btn.textContent = label;
        btn.addEventListener('click', () => { results[index] = ok; index++; revealed = false; paint(); });
        grade.appendChild(btn);
      });
      card.append(answers, grade);
    }
    container.appendChild(card);
  }

  paint();
}
