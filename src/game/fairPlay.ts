import type { CryptogramWord, PuzzleData } from '../types';
import { HOMOPHONE_ALLOCATIONS } from '../utils/cipherEngine';
import { isHardPuzzle } from '../utils/edition';
import { cipherForPuzzle } from './puzzleState';

/**
 * Where a page could honestly be read two ways (docs/SOUL.md: "Fair Play Is
 * Provable").
 *
 * Full uniqueness is not testable with a word list: a 30-letter substitution admits
 * dozens of dictionary-valid word salads ("THE FATAL SURE BAR IN THE CHAMPAGNE"),
 * and an agent rules those out by sense, not by pattern. The ambiguity an agent
 * can actually fall into is the last word: every other word decoded, and one slot
 * that still fits two English words under the glyphs already fixed (STILL
 * BREATHING / STILL WREATHING). That set is small, exact, and reviewable, so that
 * is what this finds.
 *
 * The rules are the ones the Handbook states. Morning: one glyph per letter.
 * Night Extra: E, T and A may each have two glyphs; every other letter keeps one.
 * It reads glyph patterns only, the way an agent does; the answer key is used only
 * to fix the *other* words, which is the situation being tested.
 */

function toShape(word: CryptogramWord): (string | null)[] | null {
  const symbols = word.symbols.filter((s) => !s.isPunctuation || s.targetLetter === "'");
  // Leading and trailing punctuation (full stops, commas) carries no letters.
  while (symbols.length && symbols[0].isPunctuation) symbols.shift();
  while (symbols.length && symbols[symbols.length - 1].isPunctuation) symbols.pop();
  if (!symbols.some((s) => !s.isPunctuation)) return null;
  return symbols.map((s) => (s.isPunctuation ? null : s.symbolId));
}

export interface WordAlternate {
  /** The decoded word on the page. */
  word: string;
  /** English words that fit the same slot once every other word is decoded. */
  alternates: string[];
}

/** One entry per word on the page that could be read another way. */
export function lastWordAlternates(puzzle: PuzzleData, dictionary: Iterable<string>): WordAlternate[] {
  const allowance = (letter: string) => (isHardPuzzle(puzzle) ? (HOMOPHONE_ALLOCATIONS[letter] ?? 1) : 1);
  const { words, decoded } = cipherForPuzzle(puzzle);
  const shapes = words.map(toShape).filter((shape): shape is (string | null)[] => shape !== null);
  const vocabulary = [...new Set(dictionary)];

  return shapes.flatMap((shape, index) => {
    const own = new Set(shape.filter((glyph): glyph is string => glyph !== null));
    // Everything the rest of the page has already fixed.
    const glyphToLetter = new Map<string, string>();
    const letterToGlyphs = new Map<string, Set<string>>();
    shapes.forEach((other, j) => {
      if (j === index) return;
      for (const glyph of other) {
        if (glyph === null || own.has(glyph)) continue;
        glyphToLetter.set(glyph, decoded[glyph]);
        const glyphs = letterToGlyphs.get(decoded[glyph]) ?? new Set<string>();
        glyphs.add(glyph);
        letterToGlyphs.set(decoded[glyph], glyphs);
      }
    });
    // A glyph this word shares with another word is fixed too.
    for (const glyph of own) {
      if (shapes.some((other, j) => j !== index && other.includes(glyph))) glyphToLetter.set(glyph, decoded[glyph]);
    }

    const fits = (word: string) => {
      if (word.length !== shape.length) return false;
      const local = new Map<string, string>();
      const added = new Map<string, Set<string>>();
      for (let i = 0; i < word.length; i += 1) {
        const glyph = shape[i];
        const letter = word[i];
        if (glyph === null || letter === "'") {
          if (glyph !== null || letter !== "'") return false;
          continue;
        }
        const fixed = glyphToLetter.get(glyph) ?? local.get(glyph);
        if (fixed) {
          if (fixed !== letter) return false;
          continue;
        }
        local.set(glyph, letter);
        const glyphs = added.get(letter) ?? new Set<string>();
        glyphs.add(glyph);
        added.set(letter, glyphs);
        if ((letterToGlyphs.get(letter)?.size ?? 0) + glyphs.size > allowance(letter)) return false;
      }
      return true;
    };

    const word = shape.map((glyph) => (glyph === null ? "'" : decoded[glyph])).join('');
    const alternates = vocabulary.filter((candidate) => candidate !== word && fits(candidate)).sort();
    return alternates.length ? [{ word, alternates }] : [];
  });
}
