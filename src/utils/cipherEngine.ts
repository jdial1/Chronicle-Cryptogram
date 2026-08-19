import { CipherSymbol, CryptogramWord } from '../types';

export const ZODIAC_SYMBOLS_PALETTE: CipherSymbol[] = [
  // --- Row 1 (9 symbols) ---
  { id: 'zod_A', glyph: 'A', name: 'Letter A', category: 'zodiac' },
  { id: 'zod_B', glyph: 'B', name: 'Letter B', category: 'zodiac' },
  { id: 'zod_rev_C', glyph: 'Ↄ', name: 'Reversed C', category: 'inverted' },
  { id: 'zod_D', glyph: 'D', name: 'Letter D', category: 'zodiac' },
  { id: 'zod_rev_D', glyph: 'ᗡ', name: 'Reversed D', category: 'inverted' },
  { id: 'zod_E', glyph: 'E', name: 'Letter E', category: 'zodiac' },
  { id: 'zod_rev_E', glyph: 'Ǝ', name: 'Reversed E', category: 'inverted' },
  { id: 'zod_F', glyph: 'F', name: 'Letter F', category: 'zodiac' },
  { id: 'zod_inv_F', glyph: 'Ⅎ', name: 'Turned F', category: 'inverted' },

  // --- Row 2 (9 symbols) ---
  { id: 'zod_6', glyph: '6', name: 'Numeral 6', category: 'zodiac' },
  { id: 'zod_H', glyph: 'H', name: 'Letter H', category: 'zodiac' },
  { id: 'zod_I', glyph: 'I', name: 'Serif I', category: 'zodiac' },
  { id: 'zod_anchor_I', glyph: 'Ɪ', name: 'Curved Serif I', category: 'zodiac' },
  { id: 'zod_J', glyph: 'J', name: 'Letter J', category: 'zodiac' },
  { id: 'zod_turn_J', glyph: 'Ꞁ', name: 'Turned J', category: 'inverted' },
  { id: 'zod_K', glyph: 'K', name: 'Letter K', category: 'zodiac' },
  { id: 'zod_rev_K', glyph: 'ꓘ', name: 'Reversed K', category: 'inverted' },
  { id: 'zod_tilt_K', glyph: 'ㅈ', name: 'Tilted K', category: 'inverted' },

  // --- Row 3 (9 symbols) ---
  { id: 'zod_L', glyph: 'L', name: 'Letter L', category: 'zodiac' },
  { id: 'zod_rev_L', glyph: 'ᒧ', name: 'Reversed L', category: 'inverted' },
  { id: 'zod_M', glyph: 'M', name: 'Letter M', category: 'zodiac' },
  { id: 'zod_N', glyph: 'N', name: 'Letter N', category: 'zodiac' },
  { id: 'zod_O', glyph: 'O', name: 'Letter O', category: 'zodiac' },
  { id: 'zod_P', glyph: 'P', name: 'Letter P', category: 'zodiac' },
  { id: 'zod_turn_b', glyph: 'q', name: 'Turned b / q', category: 'inverted' },
  { id: 'zod_Q', glyph: 'Q', name: 'Letter Q', category: 'zodiac' },
  { id: 'zod_slash_Q', glyph: '⍉', name: 'Slashed Q', category: 'zodiac' },

  // --- Row 4 (9 symbols) ---
  { id: 'zod_R', glyph: 'R', name: 'Letter R', category: 'zodiac' },
  { id: 'zod_rev_R', glyph: 'Я', name: 'Reversed R', category: 'inverted' },
  { id: 'zod_S', glyph: 'S', name: 'Letter S', category: 'zodiac' },
  { id: 'zod_T', glyph: 'T', name: 'Letter T', category: 'zodiac' },
  { id: 'zod_inv_T', glyph: '⊥', name: 'Inverted T', category: 'inverted' },
  { id: 'zod_U', glyph: 'U', name: 'Letter U', category: 'zodiac' },
  { id: 'zod_V', glyph: 'V', name: 'Letter V', category: 'zodiac' },
  { id: 'zod_inv_V', glyph: '∧', name: 'Inverted V', category: 'inverted' },
  { id: 'zod_W', glyph: 'W', name: 'Letter W', category: 'zodiac' },

  // --- Row 5 (9 symbols) ---
  { id: 'zod_X', glyph: 'X', name: 'Letter X', category: 'zodiac' },
  { id: 'zod_Y', glyph: 'Y', name: 'Letter Y', category: 'zodiac' },
  { id: 'zod_Z', glyph: 'Z', name: 'Letter Z', category: 'zodiac' },
  { id: 'zod_hollow_tri', glyph: '△', name: 'Hollow Triangle', category: 'geometric' },
  { id: 'zod_dot_tri', glyph: '◬', name: 'Triangle with Dot', category: 'geometric' },
  { id: 'zod_solid_tri', glyph: '▲', name: 'Solid Triangle', category: 'geometric' },
  { id: 'zod_hollow_sq', glyph: '□', name: 'Hollow Square', category: 'geometric' },
  { id: 'zod_dot_sq', glyph: '⊡', name: 'Square with Dot', category: 'geometric' },
  { id: 'zod_half_sq', glyph: '◪', name: 'Diagonal Half Square', category: 'geometric' },

  // --- Row 6 (9 symbols) ---
  { id: 'zod_solid_sq', glyph: '■', name: 'Solid Square', category: 'geometric' },
  { id: 'zod_bullseye', glyph: '⦿', name: 'Bullseye Circle', category: 'geometric' },
  { id: 'zod_solid_circle', glyph: '●', name: 'Solid Circle', category: 'geometric' },
  { id: 'zod_horiz_circle', glyph: '⦵', name: 'Circle with Horizontal Bar', category: 'geometric' },
  { id: 'zod_vert_circle', glyph: 'ϕ', name: 'Circle with Vertical Bar', category: 'geometric' },
  { id: 'zod_crosshair', glyph: '⊕', name: 'Zodiac Crosshair', category: 'zodiac' },
  { id: 'zod_plus', glyph: '+', name: 'Cross / Plus', category: 'geometric' },
  { id: 'zod_fwd_slash', glyph: '/', name: 'Forward Slash', category: 'geometric' },
  { id: 'zod_back_slash', glyph: '\\', name: 'Backslash', category: 'geometric' },
];

// Standard English Letter Frequencies (%) for cryptanalysis comparison
export const ENGLISH_LETTER_FREQUENCIES: Record<string, number> = {
  E: 12.7,
  T: 9.1,
  A: 8.2,
  O: 7.5,
  I: 7.0,
  N: 6.7,
  S: 6.3,
  H: 6.1,
  R: 6.0,
  D: 4.3,
  L: 4.0,
  C: 2.8,
  U: 2.8,
  M: 2.4,
  W: 2.4,
  F: 2.2,
  G: 2.0,
  Y: 2.0,
  P: 1.9,
  B: 1.5,
  V: 1.0,
  K: 0.8,
  J: 0.15,
  X: 0.15,
  Q: 0.1,
  Z: 0.07,
};

/**
 * Number of homophone cipher symbols allocated to each letter to suppress frequencies.
 * High-frequency letters (E, T, A, O, I, N, etc.) receive multiple distinct symbols
 * so their individual appearances are flattened to ~2-3%, neutralizing single-letter frequency attacks.
 */
export const HOMOPHONE_ALLOCATIONS: Record<string, number> = {
  E: 5,
  T: 4,
  A: 4,
  O: 4,
  I: 3,
  N: 3,
  S: 3,
  R: 3,
  H: 3,
  D: 2,
  L: 2,
  C: 2,
  U: 2,
  M: 2,
  W: 1,
  F: 1,
  G: 1,
  Y: 1,
  P: 1,
  B: 1,
  V: 1,
  K: 1,
  J: 1,
  X: 1,
  Q: 1,
  Z: 1,
};

export interface HomophonicCipherMap {
  letterToSymbols: Record<string, CipherSymbol[]>;
  symbolIdToInfo: Record<string, { glyph: string; targetLetter: string; name: string }>;
}

function hashSeed(seedString: string): number {
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = (hash << 5) - hash + seedString.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function nextSeed(currentSeed: number): number {
  return (currentSeed * 9301 + 49297) % 233280;
}

export function buildCipherAlphabet(seedString: string, isHomophonic: boolean = true): HomophonicCipherMap {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  const symbols = [...ZODIAC_SYMBOLS_PALETTE];
  let currentSeed = Math.abs(hashSeed(seedString));
  for (let i = symbols.length - 1; i > 0; i--) {
    currentSeed = nextSeed(currentSeed);
    const j = Math.floor((currentSeed / 233280) * (i + 1));
    const temp = symbols[i];
    symbols[i] = symbols[j];
    symbols[j] = temp;
  }

  const letterToSymbols: Record<string, CipherSymbol[]> = {};
  const symbolIdToInfo: Record<string, { glyph: string; targetLetter: string; name: string }> = {};

  let symbolCursor = 0;

  // Allocate symbols per letter (1:1 in mono/easy mode, homophones in hard mode)
  alphabet.forEach((letter) => {
    const count = isHomophonic ? (HOMOPHONE_ALLOCATIONS[letter] || 1) : 1;
    const allocated: CipherSymbol[] = [];

    for (let c = 0; c < count; c++) {
      const baseSymbol = symbols[symbolCursor % symbols.length];
      const uniqueId = isHomophonic ? `homo_${letter}_${c}_${baseSymbol.id}` : `mono_${letter}_${baseSymbol.id}`;
      
      const homophoneSymbol: CipherSymbol = {
        id: uniqueId,
        glyph: baseSymbol.glyph,
        name: isHomophonic ? `${baseSymbol.name} (Variant ${c + 1})` : baseSymbol.name,
        category: baseSymbol.category,
      };

      allocated.push(homophoneSymbol);
      symbolIdToInfo[uniqueId] = {
        glyph: baseSymbol.glyph,
        targetLetter: letter,
        name: homophoneSymbol.name,
      };

      symbolCursor++;
    }

    letterToSymbols[letter] = allocated;
  });

  return {
    letterToSymbols,
    symbolIdToInfo,
  };
}

/**
 * Parses raw text into structured cryptogram words and symbol representations
 * using Homophonic Substitution with Frequency Suppression (cycling homophones evenly)
 */
export function parseCryptogramText(text: string, cipherMap: HomophonicCipherMap): CryptogramWord[] {
  const rawWords = text.trim().split(/\s+/);
  
  // Track homophone occurrence count per letter across the message for even round-robin frequency suppression
  const letterOccurrences: Record<string, number> = {};

  return rawWords.map((rawWord, wordIdx) => {
    const symbols = [];
    for (let charIdx = 0; charIdx < rawWord.length; charIdx++) {
      const char = rawWord[charIdx];
      const upperChar = char.toUpperCase();
      const isLetter = /^[A-Z]$/.test(upperChar);

      if (isLetter && cipherMap.letterToSymbols[upperChar]) {
        const homophones = cipherMap.letterToSymbols[upperChar];
        const occurrence = letterOccurrences[upperChar] || 0;
        const selectedHomophone = homophones[occurrence % homophones.length];
        letterOccurrences[upperChar] = occurrence + 1;

        symbols.push({
          symbolId: selectedHomophone.id,
          targetLetter: upperChar,
          isPunctuation: false,
          char: selectedHomophone.glyph,
        });
      } else {
        // Punctuation, numbers, apostrophes, hyphens, quotes
        symbols.push({
          symbolId: `punct_${char}`,
          targetLetter: char,
          isPunctuation: true,
          char: char,
        });
      }
    }

    return {
      id: `word_${wordIdx}`,
      symbols,
    };
  });
}

/**
 * Calculates current symbol frequency distribution in the cryptogram
 */
export function calculateSymbolFrequencies(
  words: CryptogramWord[],
  cipherMap: HomophonicCipherMap
): {
  symbolId: string;
  glyph: string;
  count: number;
  percentage: number;
  mappedLetter: string;
  targetLetter: string;
}[] {
  const counts: Record<string, number> = {};
  const symbolToTargetLetter: Record<string, string> = {};
  let totalLetters = 0;

  words.forEach((w) => {
    w.symbols.forEach((s) => {
      if (!s.isPunctuation) {
        counts[s.symbolId] = (counts[s.symbolId] || 0) + 1;
        symbolToTargetLetter[s.symbolId] = s.targetLetter;
        totalLetters++;
      }
    });
  });

  return Object.entries(counts)
    .map(([symbolId, count]) => {
      const percentage = totalLetters > 0 ? (count / totalLetters) * 100 : 0;
      const info = cipherMap.symbolIdToInfo[symbolId];
      return {
        symbolId,
        glyph: info ? info.glyph : '?',
        count,
        percentage,
        mappedLetter: '',
        targetLetter: symbolToTargetLetter[symbolId] || '',
      };
    })
    .sort((a, b) => b.count - a.count);
}

export function formatSolvedQuote(text: string, insert = '', swap = false) {
  if (!insert) return text;
  const trimmed = text.trim();
  const body = trimmed.endsWith('.') ? trimmed.slice(0, -1) : trimmed;
  const idx = body.lastIndexOf('. ');
  if (idx === -1) return text;
  const head = body.slice(0, idx).trim();
  const tail = body.slice(idx + 2).trim();
  const first = swap ? tail : head;
  const second = swap ? head : tail;
  return `${first} ${insert} ${second}.`;
}

/**
 * Formats seconds into "01:42.5" or "02:15"
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const tenths = Math.floor((seconds * 10) % 10);
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${pad(mins)}:${pad(secs)}.${tenths}`;
}

