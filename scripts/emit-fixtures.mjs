/**
 * Emits golden fixtures from the TypeScript game logic so the Kotlin port in
 * android/core/cipher can assert byte-for-byte parity against it.
 *
 * The TS side stays the source of truth. Run after any change to cipherEngine,
 * edition, puzzleState, cipherCursor or the localStore merge/normalize helpers:
 *
 *   npm run emit:fixtures            regenerate
 *   npm run emit:fixtures -- --check fail if the checked-in fixtures are stale (CI)
 *
 * Why this exists: glyph assignment is recomputed on every device and never
 * stored, so a Kotlin implementation that diverges by one integer silently hands
 * Android players a different cipher for the same puzzle and the same save.
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  hashSeed,
  nextSeed,
  buildCipherAlphabet,
  parseCryptogramText,
  calculateSymbolFrequencies,
  ZODIAC_SYMBOLS_PALETTE,
} from '../src/utils/cipherEngine.ts';
import { INITIAL_PUZZLES } from '../src/data/puzzles.ts';
import { isHardPuzzle } from '../src/utils/edition.ts';
import {
  emitProgression,
  emitMergeProgress,
  emitNormalizeProgress,
  emitWallets,
  emitCursor,
  emitPuzzleState,
} from './emit-fixtures-progression.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, '..', 'android', 'core', 'cipher', 'src', 'test', 'resources', 'fixtures');
const CHECK = process.argv.includes('--check');

const stale = [];

/**
 * Compare on content, not bytes. The repo stores these LF but core.autocrlf is on
 * for Windows clones, so a fresh checkout hands us CRLF and a raw byte compare
 * would call every fixture stale -- which trains people to ignore the check.
 */
const sameContent = (a, b) => a.replace(/\r\n/g, '\n') === b.replace(/\r\n/g, '\n');

function emit(name, value) {
  const path = join(OUT, `${name}.json`);
  const body = JSON.stringify(value, null, 2) + '\n';
  if (CHECK) {
    const current = existsSync(path) ? readFileSync(path, 'utf8') : '';
    if (!sameContent(current, body)) stale.push(name);
    return;
  }
  mkdirSync(OUT, { recursive: true });
  writeFileSync(path, body);
  console.log(`  ${name}.json`);
}

/** The seed each puzzle actually uses, per puzzleState.ts:59. */
const puzzleSeed = (puzzle) => puzzle.id + puzzle.originalText;

/**
 * A string whose hash is exactly -2147483648. JS `Math.abs` widens that to the
 * double 2147483648; Kotlin's `abs(Int.MIN_VALUE)` returns Int.MIN_VALUE, still
 * negative. Without this case the divergence is invisible.
 *
 * hash(prefix + c) = hash(prefix) * 31 + c (mod 2^32), and 31 is invertible mod
 * 2^32, so solve for the final char rather than brute-forcing the whole string.
 */
function findIntMinSeed() {
  const TARGET = -2147483648 >>> 0;
  for (let i = 0; i < 5_000_000; i++) {
    const prefix = `chronicle-${i}`;
    const h = hashSeed(prefix) >>> 0;
    const c = (TARGET - Math.imul(h, 31)) >>> 0;
    // Valid, non-surrogate BMP code point.
    if (c > 0 && c <= 0xffff && (c < 0xd800 || c > 0xdfff)) {
      const seed = prefix + String.fromCharCode(c);
      if (hashSeed(seed) === -2147483648) return seed;
    }
  }
  throw new Error('emit-fixtures: no preimage found for Int.MIN_VALUE');
}

function emitLcg() {
  const intMinSeed = findIntMinSeed();
  const hashInputs = [
    '',
    'A',
    'a',
    '0',
    ' ',
    intMinSeed,
    'day_1_easy',
    'the quick brown fox',
    'ßé中文',
    ...INITIAL_PUZZLES.map(puzzleSeed),
  ];

  // Raw LCG starts. 233279 is the largest value the modulus can produce, and
  // 233279 * 9301 overflows Int32 -- the first case a Kotlin `Int` port fails.
  // The large starts are what abs(hashSeed(...)) actually feeds in on step one.
  const nextStarts = [
    0, 1, 2, 9301, 49297, 230800, 233278, 233279,
    1234567890, 2147483646, 2147483647, 2147483648,
  ];

  emit('lcg', {
    note:
      'hashSeed truncates to int32 (`hash |= 0`); Math.abs of -2147483648 widens ' +
      'to the double 2147483648. nextSeed runs on JS doubles, so 233279 * 9301 ' +
      'never overflows -- in Kotlin the whole LCG must be Long.',
    intMinPreimage: intMinSeed,
    hashSeed: hashInputs.map((input) => ({ input, output: hashSeed(input) })),
    nextSeed: nextStarts.map((start) => {
      const iterates = [];
      let seed = start;
      for (let i = 0; i < 64; i++) {
        seed = nextSeed(seed);
        iterates.push(seed);
      }
      return { start, iterates };
    }),
  });
}

function emitPalette() {
  emit('palette', {
    note: 'Order is load-bearing: the Fisher-Yates shuffle indexes into this array.',
    symbols: ZODIAC_SYMBOLS_PALETTE,
  });
}

function emitCipherAlphabet() {
  emit(
    'cipher-alphabet',
    INITIAL_PUZZLES.map((puzzle) => {
      const homophonic = isHardPuzzle(puzzle);
      const map = buildCipherAlphabet(puzzleSeed(puzzle), homophonic);
      return {
        puzzleId: puzzle.id,
        seed: puzzleSeed(puzzle),
        homophonic,
        letterToSymbols: map.letterToSymbols,
        symbolIdToInfo: map.symbolIdToInfo,
      };
    })
  );
}

function emitCipherWords() {
  emit(
    'cipher-words',
    INITIAL_PUZZLES.map((puzzle) => {
      const homophonic = isHardPuzzle(puzzle);
      const map = buildCipherAlphabet(puzzleSeed(puzzle), homophonic);
      return {
        puzzleId: puzzle.id,
        homophonic,
        text: puzzle.originalText,
        words: parseCryptogramText(puzzle.originalText, map),
      };
    })
  );
}

function emitFrequencies() {
  emit(
    'frequencies',
    INITIAL_PUZZLES.map((puzzle) => {
      const homophonic = isHardPuzzle(puzzle);
      const map = buildCipherAlphabet(puzzleSeed(puzzle), homophonic);
      const words = parseCryptogramText(puzzle.originalText, map);
      return {
        puzzleId: puzzle.id,
        // Order matters: ties are implementation-defined in both languages.
        frequencies: calculateSymbolFrequencies(words, map),
      };
    })
  );
}

console.log(CHECK ? 'Checking fixtures...' : `Emitting fixtures to ${OUT}`);
emitLcg();
emitPalette();
emitCipherAlphabet();
emitCipherWords();
emitFrequencies();
emitProgression(emit);
emitMergeProgress(emit);
emitNormalizeProgress(emit);
emitWallets(emit);
emitPuzzleState(emit);
emitCursor(emit);

if (CHECK) {
  if (stale.length) {
    console.error(
      `\nStale fixtures: ${stale.join(', ')}\n` +
        'The TypeScript logic changed. Run `npm run emit:fixtures` and commit the\n' +
        'result, then update the Kotlin port until :core:cipher:test passes again.'
    );
    process.exit(1);
  }
  console.log('Fixtures are up to date.');
}
