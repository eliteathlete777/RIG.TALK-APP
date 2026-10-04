import { normalizeText, scoreTranscript, gradeFromScore } from '../js/speech.js';

const cases = [
  { name: '1. exact match', expected: 'Can I get a coffee, please?', alt: 'can I get a coffee please', wantGrade: 'Good' },
  { name: "2. contraction it's = it is", expected: "It's too bright.", alt: 'it is too bright', wantGrade: 'Good' },
  { name: '3. punctuation only differs', expected: 'Stand clear! Load coming in!', alt: 'stand clear load coming in', wantGrade: 'Good' },
  { name: '4. one word wrong of 5', expected: 'We need a rigging point', alt: 'we need a rigging chain', wantGrade: 'Hard' },
  { name: '5. completely different', expected: 'Can I have your email?', alt: 'the weather is nice today', wantGrade: 'Again' },
  { name: '6. case difference only', expected: 'Good, thanks. You?', alt: 'GOOD THANKS YOU', wantGrade: 'Good' },
  { name: "7. contraction don't = do not", expected: "I don't understand.", alt: 'i do not understand', wantGrade: 'Good' },
  { name: '8. missing one word (short phrase)', expected: 'No problem at all', alt: 'no problem all', wantGrade: 'Hard' },
  { name: '9. one extra filler word (still understandable)', expected: 'Can I get the bill please', alt: 'can I please get the bill please', wantGrade: 'Good' },
  { name: '10. best of 3 alternatives picks exact', expected: 'Excuse me', alts: ['exports me', 'exercise me', 'excuse me'], wantGrade: 'Good' },
];

let pass = 0;
for (const c of cases){
  const alts = c.alts || [c.alt];
  const score = scoreTranscript(c.expected, alts);
  const grade = gradeFromScore(score);
  const ok = grade === c.wantGrade;
  pass += ok ? 1 : 0;
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${c.name}: score=${score} grade=${grade} (oczekiwano ${c.wantGrade})`);
}
console.log(`\n${pass}/${cases.length} przypadków przeszło.`);
console.log('normalizeText sanity:', normalizeText("It's a test, right?"));
process.exit(pass === cases.length ? 0 : 1);
