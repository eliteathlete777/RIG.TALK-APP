import { store } from './state.js';

let manifest;
let player;
let current = 0;
let lastSavedSecond = -1;

async function load(){
  if (!manifest){
    const [technical, phrases] = await Promise.all([
      fetch('content/tech-audio.json', { cache: 'no-store' }).then(r => r.json()),
      fetch('content/phrases.json', { cache: 'no-store' }).then(r => r.json()),
    ]);
    const phraseTracks = phrases.stages
      .filter(stage => stage.id !== 'daily-life')
      .flatMap(stage => stage.items.map(item => ({
        id: `phrase-${item.id}`,
        chapter: 'phrases',
        title: `${item.en} — ${item.pl}`,
        text: `Zwrot techniczny. ${item.en} — ${item.pl}`,
        audio: `assets/audio/phrases/${item.id}.wav`,
      })));
    manifest = { ...technical, tracks: [...technical.tracks, ...phraseTracks] };
  }
  return manifest;
}

function save(){
  store.set({ ui: { techAudio: { index: current, time: player?.currentTime || 0 } } });
}

function setMedia(track){
  if (!('mediaSession' in navigator)) return;
  navigator.mediaSession.metadata = new MediaMetadata({ title: track.title, artist: 'RIG TALK', album: 'Montaż krok po kroku' });
  navigator.mediaSession.setActionHandler('play', () => player.play());
  navigator.mediaSession.setActionHandler('pause', () => player.pause());
  navigator.mediaSession.setActionHandler('nexttrack', () => playAt(current + 1));
  navigator.mediaSession.setActionHandler('previoustrack', () => playAt(current - 1));
  navigator.mediaSession.setActionHandler('seekbackward', d => { player.currentTime = Math.max(0, player.currentTime - (d.seekOffset || 15)); });
  navigator.mediaSession.setActionHandler('seekforward', d => { player.currentTime = Math.min(player.duration || Infinity, player.currentTime + (d.seekOffset || 15)); });
}

async function playAt(index){
  const data = await load();
  current = (index + data.tracks.length) % data.tracks.length;
  const track = data.tracks[current];
  player.src = track.audio;
  player.dataset.track = track.id;
  lastSavedSecond = -1;
  setMedia(track);
  save();
  await player.play();
  player.dispatchEvent(new CustomEvent('rigtalk:tech-audio-change', { detail: { current, track } }));
}

export async function renderTechAudio(root){
  const data = await load();
  root.innerHTML = '';
  const saved = store.get().ui?.techAudio || {};
  current = Math.min(saved.index || 0, data.tracks.length - 1);
  const hero = document.createElement('div'); hero.className = 'frame hero';
  hero.innerHTML = `<div class="eyebrow">OFFLINE · DZIAŁA PRZY ZABLOKOWANYM EKRANIE</div><h2>AUDIO TECHNICZNE</h2><p>${data.tracks.length} nagrań: skróty rozdziałów i szczegółowe części. Postęp zapisuje się automatycznie.</p><div class="guided-controls"><button class="btn" data-audio="prev">← Poprzednie</button><button class="btn btn-primary" data-audio="play">▶ Odtwarzaj</button><button class="btn" data-audio="next">Następne →</button></div><p class="muted-sm" data-now></p>`;
  root.appendChild(hero);
  player = document.createElement('audio'); player.preload = 'metadata'; player.controls = true; player.style.width = '100%';
  root.appendChild(player);
  const list = document.createElement('div'); root.appendChild(list);
  const paint = () => {
    const track = data.tracks[current];
    hero.querySelector('[data-now]').textContent = `${current + 1}/${data.tracks.length} · ${track.title}`;
    [...list.children].forEach((b, i) => b.classList.toggle('active', i === current));
  };
  data.tracks.forEach((track, i) => { const b=document.createElement('button'); b.className='mz-search-hit'; b.innerHTML=`<b>${i+1}. ${track.title}</b><small>${track.text.slice(0,150)}…</small>`; b.addEventListener('click',()=>playAt(i)); list.appendChild(b); });
  hero.querySelector('[data-audio="prev"]').addEventListener('click',()=>playAt(current-1));
  hero.querySelector('[data-audio="play"]').addEventListener('click',()=> player.src ? (player.paused ? player.play() : player.pause()) : playAt(current));
  hero.querySelector('[data-audio="next"]').addEventListener('click',()=>playAt(current+1));
  player.addEventListener('ended',()=>playAt(current+1));
  player.addEventListener('timeupdate',()=>{
    const second = Math.floor(player.currentTime);
    if (second !== lastSavedSecond && second % 5 === 0){ lastSavedSecond = second; save(); }
  });
  player.addEventListener('rigtalk:tech-audio-change', paint);
  const initial=data.tracks[current];
  player.src=initial.audio;
  setMedia(initial);
  player.addEventListener('loadedmetadata', () => {
    if (saved.time > 0 && saved.time < player.duration) player.currentTime = saved.time;
  }, { once: true });
  paint();
}
