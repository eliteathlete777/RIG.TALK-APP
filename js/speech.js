// RIG TALK — speech.js: TTS, rozpoznawanie mowy, scoring wymowy, fallback bez API
// Funkcje normalizeText/levenshteinWords/scoreTranscript są czyste (testowalne w Node bez DOM).

// ---------- normalizacja ----------
const CONTRACTIONS = {
  "it's": "it is", "that's": "that is", "what's": "what is", "there's": "there is",
  "here's": "here is", "he's": "he is", "she's": "she is", "who's": "who is",
  "i'm": "i am", "you're": "you are", "we're": "we are", "they're": "they are",
  "i've": "i have", "you've": "you have", "we've": "we have", "they've": "they have",
  "i'll": "i will", "you'll": "you will", "we'll": "we will", "they'll": "they will", "he'll": "he will", "she'll": "she will",
  "i'd": "i would", "you'd": "you would", "we'd": "we would", "they'd": "they would",
  "don't": "do not", "doesn't": "does not", "didn't": "did not",
  "can't": "cannot", "couldn't": "could not", "won't": "will not", "wouldn't": "would not",
  "isn't": "is not", "aren't": "are not", "wasn't": "was not", "weren't": "were not",
  "haven't": "have not", "hasn't": "has not", "hadn't": "had not",
  "let's": "let us", "shouldn't": "should not", "mustn't": "must not",
};

export function normalizeText(text){
  if (!text) return '';
  let t = text.toLowerCase().trim();
  t = t.replace(/[.,!?;:"“”()]/g, '');
  t = t.replace(/\s+/g, ' ').trim();
  const words = t.split(' ').map(w => CONTRACTIONS[w] || w);
  return words.join(' ').replace(/\s+/g, ' ').trim();
}

// ---------- Levenshtein na tokenach (słowach) ----------
export function levenshteinWords(a, b){
  const wa = a.split(' ').filter(Boolean);
  const wb = b.split(' ').filter(Boolean);
  const n = wa.length, m = wb.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 0; i <= n; i++) dp[i][0] = i;
  for (let j = 0; j <= m; j++) dp[0][j] = j;
  for (let i = 1; i <= n; i++){
    for (let j = 1; j <= m; j++){
      if (wa[i - 1] === wb[j - 1]) dp[i][j] = dp[i - 1][j - 1];
      else dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[n][m];
}

/**
 * Wynik dopasowania 0–100 między oczekiwanym zwrotem a transkryptem (po normalizacji).
 * Bierze najlepszy wynik z listy alternatyw (maxAlternatives z rozpoznawania mowy).
 */
export function scoreTranscript(expected, alternatives){
  const alts = Array.isArray(alternatives) ? alternatives : [alternatives];
  const normExpected = normalizeText(expected);
  const expectedWordCount = Math.max(1, normExpected.split(' ').filter(Boolean).length);

  let best = 0;
  for (const alt of alts){
    const normAlt = normalizeText(alt);
    const dist = levenshteinWords(normExpected, normAlt);
    const maxLen = Math.max(expectedWordCount, normAlt.split(' ').filter(Boolean).length, 1);
    const score = Math.round(Math.max(0, 1 - dist / maxLen) * 100);
    if (score > best) best = score;
  }
  return best;
}

export function gradeFromScore(score){
  if (score >= 85) return 'Good';
  if (score >= 60) return 'Hard';
  return 'Again';
}

// ---------- TTS ----------
let cachedVoices = [];
function loadVoices(){
  if (typeof window === 'undefined' || !window.speechSynthesis) return [];
  cachedVoices = window.speechSynthesis.getVoices();
  return cachedVoices;
}
if (typeof window !== 'undefined' && window.speechSynthesis){
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

function pickVoice(langPref){
  const voices = cachedVoices.length ? cachedVoices : loadVoices();
  return voices.find(v => v.localService && v.lang?.toLowerCase() === langPref.toLowerCase())
      || voices.find(v => v.localService && v.lang?.toLowerCase().startsWith(langPref.slice(0, 2)))
      || voices.find(v => v.lang?.toLowerCase() === langPref.toLowerCase())
      || voices.find(v => v.lang?.toLowerCase().startsWith(langPref.slice(0, 2)))
      || null;
}

/** Uproszczony zapis wymowy dla Polaka. Działa offline i obejmuje każdy zwrot. */
export function toPolishPhonetic(text){
  if (!text) return '';
  const special = new Map([
    ['the','de'],['this','dys'],['that','dat'],['these','diiz'],['those','dołz'],
    ['i','aj'],['my','maj'],['you','ju'],['your','jor'],['we','łi'],['our','ałer'],
    ['is','yz'],['are','ar'],['was','łoz'],['were','łer'],['have','hew'],['has','hez'],
    ['can','ken'],["can't",'kaant'],['do','du'],['does','daz'],['please','pliiz'],
    ['where','łer'],['what','łot'],['when','łen'],['why','łaj'],['how','hał'],
    ['one','łan'],['two','tu'],['three','fri'],['four','for'],['eight','ejt'],
    ['screen','skriin'],['power','pałer'],['cable','kejbel'],['processor','prołseser'],
    ['check','czek'],['need','niid'],['here','hir'],['there','der'],['now','nał'],
  ]);
  return text.toLowerCase().replace(/[“”„”.,!?;:()]/g, '').split(/\s+/).filter(Boolean).map(word => {
    if (special.has(word)) return special.get(word);
    return word
      .replace(/^th/g, 'f').replace(/th/g, 'd').replace(/sh/g, 'sz').replace(/ch/g, 'cz')
      .replace(/ph/g, 'f').replace(/tion/g, 'szyn').replace(/sion/g, 'żyn')
      .replace(/ee/g, 'ii').replace(/ea/g, 'ii').replace(/oo/g, 'u')
      .replace(/ou/g, 'ał').replace(/ow/g, 'ał').replace(/ai|ay/g, 'ej')
      .replace(/igh/g, 'aj').replace(/qu/g, 'kł').replace(/w/g, 'ł')
      .replace(/v/g, 'w').replace(/j/g, 'dż').replace(/c(?=[eiy])/g, 's')
      .replace(/c/g, 'k').replace(/x/g, 'ks').replace(/y/g, 'i')
      .replace(/e$/g, '').replace(/r$/g, 'r');
  }).join(' · ');
}

export function localVoiceStatus(lang = 'en-GB'){
  const voices = cachedVoices.length ? cachedVoices : loadVoices();
  const local = voices.find(v => v.localService && v.lang?.toLowerCase().startsWith(lang.slice(0, 2).toLowerCase()));
  return local ? { ready: true, name: local.name } : { ready: false, name: null };
}

export function isTtsSupported(){
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/** Przeczytaj zwrot. lang: 'en-GB' | 'en-US'. rate: 0.7 (żółw) / 0.85 (nowe) / 1.0 (powtórki). */
export function speak(text, { lang = 'en-GB', rate = 0.85 } = {}){
  return new Promise((resolve, reject) => {
    if (!isTtsSupported()){ reject(new Error('speechSynthesis niedostępny')); return; }
    window.speechSynthesis.cancel(); // przerwij ewentualną poprzednią wypowiedź
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.rate = rate;
    const voice = pickVoice(lang);
    if (voice) utter.voice = voice;
    utter.onend = () => resolve();
    utter.onerror = (e) => reject(e.error || e);
    window.speechSynthesis.speak(utter);
  });
}

// ---------- Rozpoznawanie mowy ----------
export function isRecognitionSupported(){
  return typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

/**
 * Nasłuchuje wypowiedzi i zwraca listę alternatyw tekstowych (maxAlternatives).
 * Rzuca błąd 'unsupported' gdy API niedostępne — wywołujący ma pokazać fallback (3.2).
 */
export function recognizeOnce({ lang = 'en-US', maxAlternatives = 3, timeoutMs = 8000 } = {}){
  return new Promise((resolve, reject) => {
    const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SR){ reject(Object.assign(new Error('Rozpoznawanie mowy niedostępne'), { code: 'unsupported' })); return; }

    const rec = new SR();
    rec.lang = lang;
    rec.interimResults = false;
    rec.maxAlternatives = maxAlternatives;

    const timer = setTimeout(() => { try { rec.stop(); } catch (e) {} }, timeoutMs);

    rec.onresult = (event) => {
      clearTimeout(timer);
      const result = event.results[0];
      const alts = [];
      for (let i = 0; i < result.length; i++) alts.push(result[i].transcript);
      resolve(alts);
    };
    rec.onerror = (event) => {
      clearTimeout(timer);
      reject(Object.assign(new Error('Błąd rozpoznawania: ' + event.error), { code: event.error }));
    };
    rec.onend = () => clearTimeout(timer);

    try { rec.start(); } catch (e){ clearTimeout(timer); reject(e); }
  });
}

// ---------- Fallback: nagranie własnego głosu (MediaRecorder), gdy brak rozpoznawania ----------
export function isRecordingSupported(){
  return typeof navigator !== 'undefined' && !!navigator.mediaDevices && typeof MediaRecorder !== 'undefined';
}

/** Nagrywa `durationMs` audio z mikrofonu i zwraca obiekt URL do odsłuchu (self-assessment). */
export async function recordSelf(durationMs = 4000){
  if (!isRecordingSupported()) throw Object.assign(new Error('Nagrywanie niedostępne'), { code: 'unsupported' });
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const recorder = new MediaRecorder(stream);
  const chunks = [];
  recorder.ondataavailable = (e) => chunks.push(e.data);
  const done = new Promise((resolve) => {
    recorder.onstop = () => {
      stream.getTracks().forEach(t => t.stop());
      const blob = new Blob(chunks, { type: 'audio/webm' });
      resolve(URL.createObjectURL(blob));
    };
  });
  recorder.start();
  setTimeout(() => recorder.stop(), durationMs);
  return done;
}

/** Ustala, którą ścieżkę oceny pokazać: 'recognition' | 'fallback'. */
export function pickAssessmentMode(){
  return isRecognitionSupported() ? 'recognition' : 'fallback';
}
