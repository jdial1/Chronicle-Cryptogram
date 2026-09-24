import type { PuzzleData } from '../types';
import { cipherForPuzzle } from './puzzleState';

/**
 * The checks a page must pass before it goes to press, shared by the content tests
 * and the author's workbench (`npm run desk:check`), so a writer sees the same
 * verdict on a draft that the tests give on a committed line.
 */

const longWords = (text: string) => text.toUpperCase().match(/[A-Z']{5,}/g) ?? [];

/** How much of the answer's vocabulary (whole words of five letters or more) the frame prints. */
export function frameLeak(puzzle: Pick<PuzzleData, 'headline' | 'subheadline' | 'originalText'>) {
  const frame = new Set(`${puzzle.headline} ${puzzle.subheadline}`.toUpperCase().match(/[A-Z']+/g) ?? []);
  const answer = longWords(puzzle.originalText);
  const printed = answer.filter((word) => frame.has(word));
  return { answer, printed, share: answer.length ? printed.length / answer.length : 0 };
}

/** Letters that actually show two glyphs on this page. A Night Extra with none plays flat. */
export function splitLetters(puzzle: PuzzleData): string[] {
  const perLetter = new Map<string, Set<string>>();
  for (const word of cipherForPuzzle(puzzle).words) {
    for (const symbol of word.symbols) {
      if (symbol.isPunctuation) continue;
      const glyphs = perLetter.get(symbol.targetLetter) ?? new Set<string>();
      glyphs.add(symbol.symbolId);
      perLetter.set(symbol.targetLetter, glyphs);
    }
  }
  return [...perLetter.entries()].filter(([, glyphs]) => glyphs.size > 1).map(([letter]) => letter);
}

/** Letters in the quote, the measure the season's lengths are compared on. */
export const letterCount = (text: string) => (text.toUpperCase().match(/[A-Z]/g) ?? []).length;
