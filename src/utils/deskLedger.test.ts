import { describe, expect, it } from 'vitest';
import type { PuzzleProgress } from '../types';
import { deskLedger, isCleanSolve } from './deskLedger';

const board = (over: Partial<PuzzleProgress>): PuzzleProgress => ({
  mappings: {},
  timerSeconds: 60,
  hintsUsed: 0,
  hintsRemaining: 3,
  hintedSymbolIds: [],
  checksUsed: 0,
  checksRemaining: 3,
  verifiedSymbolIds: [],
  flaggedSymbolIds: [],
  selectedSymbolId: null,
  isSolved: true,
  ...over,
});

describe('desk ledger', () => {
  it('calls a page clean only when it was solved with no hint and no check', () => {
    expect(isCleanSolve(board({}))).toBe(true);
    expect(isCleanSolve(board({ checksUsed: 1 }))).toBe(false);
    expect(isCleanSolve(board({ hintsUsed: 1 }))).toBe(false);
    expect(isCleanSolve(board({ isSolved: false }))).toBe(false);
    expect(isCleanSolve(null)).toBe(false);
  });

  it('keeps books on help taken across the solved pages', () => {
    const saved: Record<string, PuzzleProgress> = {
      a: board({}),
      b: board({ hintsUsed: 2 }),
      c: board({ checksUsed: 1 }),
    };
    expect(deskLedger(['a', 'b', 'c', 'a'], (id) => saved[id] ?? null)).toEqual({
      decoded: 3,
      clean: 1,
      hintsTaken: 2,
      checksTaken: 1,
    });
  });
});
