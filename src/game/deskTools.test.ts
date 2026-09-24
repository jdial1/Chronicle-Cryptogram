import { describe, expect, it } from 'vitest';
import { INITIAL_PUZZLES } from '../data/puzzles';
import { CIPHER_TACTICS } from '../data/cipherTactics';
import { cipherForPuzzle, decodedMappingsFromPuzzle } from './puzzleState';
import { searchMorgue } from './morgue';
import { lettersSolved, worksheetCounts } from './worksheet';

const primer = INITIAL_PUZZLES.find((p) => p.id === 'day_0_primer')!;

describe('the morgue', () => {
  it('answers only from pages the agent has decoded', () => {
    const everyPage = INITIAL_PUZZLES.map((p) => p.id);
    const all = searchMorgue(INITIAL_PUZZLES, everyPage, 'champagne');
    expect(all.length).toBeGreaterThan(0);
    // Nothing solved, nothing found: an open page can never confirm a guess.
    expect(searchMorgue(INITIAL_PUZZLES, [], 'champagne')).toEqual([]);
    expect(searchMorgue(INITIAL_PUZZLES, [all[0].id], 'champagne')).toEqual([all[0]]);
  });

  it('ignores searches too short to mean anything', () => {
    expect(searchMorgue(INITIAL_PUZZLES, INITIAL_PUZZLES.map((p) => p.id), 'th')).toEqual([]);
  });
});

describe('the worksheet', () => {
  it('counts word starts and doubles by glyph, on the Primer', () => {
    const { words, decoded } = cipherForPuzzle(primer);
    const counts = worksheetCounts(words);
    const byLetter = (letter: string) => {
      const id = Object.keys(decoded).find((symbolId) => decoded[symbolId] === letter)!;
      return counts[id] ?? { starts: 0, doubled: 0 };
    };
    // I CAN'T SEE THE WORD THE AND LOOK AT A DOUBLE LETTER TOO.
    expect(byLetter('T')).toEqual({ starts: 3, doubled: 1 });
    expect(byLetter('A')).toEqual({ starts: 3, doubled: 0 });
    expect(byLetter('O')).toEqual({ starts: 0, doubled: 2 });
    expect(byLetter('E')).toEqual({ starts: 0, doubled: 1 });
  });
});

describe('the Primer confirms in sets', () => {
  const { words } = cipherForPuzzle(primer);
  const decoded = decodedMappingsFromPuzzle(primer);
  const only = (letters: string[]) =>
    Object.fromEntries(Object.entries(decoded).filter(([, letter]) => letters.includes(letter)));

  it('says nothing about one letter of a set on its own', () => {
    expect(lettersSolved(words, only(['I']), ['I', 'A'])).toBe(false);
    expect(lettersSolved(words, only(['I', 'A']), ['I', 'A'])).toBe(true);
  });

  it('gives every tell a set of more than one letter', () => {
    for (const tactic of CIPHER_TACTICS) expect(tactic.primerConfirms.length).toBeGreaterThan(1);
  });
});
