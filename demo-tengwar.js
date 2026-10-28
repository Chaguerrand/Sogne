'use strict';
// Transcription simplifiée du latin vers le Tengwar (points de code ConScript E000+, police Alcarin Tengwar).
// Ce n'est pas une transcription savante : c'est du Tengwar d'apparence correcte pour les cartes de test.
const L = { t: 0xE000, p: 0xE001, k: 0xE002, qu: 0xE003, d: 0xE004, b: 0xE005, g: 0xE007, th: 0xE008, f: 0xE009, kh: 0xE00A, hw: 0xE00B, dh: 0xE00C,
  v: 0xE00D, j: 0xE00E, n: 0xE010, m: 0xE011, ng: 0xE012, w: 0xE015, ch: 0xE018, sh: 0xE01A, gh: 0xE01F, r: 0xE020, l: 0xE022, s: 0xE024, z: 0xE026,
  h: 0xE028, y: 0xE02A };
const SHORT = 0xE02E, LONG = 0xE02C;
const PUNCT = { '.': 0xE060, ',': 0xE060, ':': 0xE062, ';': 0xE061, '!': 0xE065, '?': 0xE066, '(': 0xE067, ')': 0xE067 };
const DIGITS = 0xE070;
const S = (c) => String.fromCodePoint(c);

function transcribe(text, opts) {
  const quenya = opts && opts.mode === 'quenya', black = !!(opts && opts.black);
  const TEHTA = { a: 0xE040, e: 0xE046, i: 0xE044, o: black ? 0xE04C : 0xE04A, u: black ? 0xE04A : 0xE04C };
  const src = text.toLowerCase().normalize('NFD');
  const out = [];
  let i = 0;
  let pending = null;   // voyelle en attente (mode général : elle se pose sur la consonne suivante)
  let lastC = false;    // la dernière lettre écrite est une consonne sans voyelle (mode quenya)
  const flush = () => { if (pending) { out.push(S(SHORT) + S(TEHTA[pending])); pending = null; } };
  while (i < src.length) {
    const ch = src[i];
    if (/[a-z]/.test(ch)) {
      // voyelle ?
      if ('aeiou'.includes(ch)) {
        let long = false, j = i + 1;
        while (j < src.length && /[̀-ͯ]/.test(src[j])) { if (src[j] === '́' || src[j] === '̂') long = true; j++; }
        i = j;
        if (long) { flush(); out.push(S(LONG) + S(TEHTA[ch])); lastC = false; continue; }
        if (quenya) {
          if (lastC) { out[out.length - 1] += S(TEHTA[ch]); lastC = false; } else out.push(S(SHORT) + S(TEHTA[ch]));
        } else { flush(); pending = ch; }
        continue;
      }
      // consonne : digrammes d'abord
      const two = src.slice(i, i + 2);
      let g, len = 1;
      if (L[two] !== undefined && two.length === 2) { g = L[two]; len = 2; }
      else if (ch === 'c') g = L.k; else if (ch === 'q') g = L.qu; else if (ch === 'x') g = L.k;
      else if (L[ch] !== undefined) g = L[ch]; else g = L.s;
      i += len; while (i < src.length && /[̀-ͯ]/.test(src[i])) i++;
      let s = S(g);
      if (!quenya && pending) { s += S(TEHTA[pending]); pending = null; }
      out.push(s); lastC = quenya;
      if (ch === 'x') { out.push(S(L.s)); lastC = false; }
      continue;
    }
    // hors lettres : fin de mot
    flush(); lastC = false;
    if (/[0-9]/.test(ch)) out.push(S(DIGITS + +ch));
    else if (PUNCT[ch] !== undefined) out.push(S(PUNCT[ch]));
    else if (ch === ' ' || ch === '\n') out.push(' ');
    i++;
  }
  flush();
  return out.join('');
}
module.exports = { transcribe };
