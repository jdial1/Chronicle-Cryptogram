import { describe, expect, it } from 'vitest';
import { clipDailyWallet, DAILY_CHECKS, DAILY_HINTS, mergeDailyHints, mergeProgress, progressFields } from './localStore';
import { isHardPuzzle, isNightEdition } from './edition';
import type { PuzzleData, PuzzleProgress } from '../types';

function blankProgress(overrides: Partial<PuzzleProgress> = {}): PuzzleProgress {
  return {
    mappings: {},
    timerSeconds: 0,
    hintsUsed: 0,
    hintsRemaining: DAILY_HINTS,
    hintedSymbolIds: [],
    checksUsed: 0,
    checksRemaining: DAILY_CHECKS,
    verifiedSymbolIds: [],
    flaggedSymbolIds: [],
    selectedSymbolId: null,
    isSolved: false,
    ...overrides,
  };
}

describe('clipDailyWallet', () => {
  it('caps checks independently of the hint default', () => {
    const wallet = clipDailyWallet(4, 9, DAILY_CHECKS);
    expect(wallet.used).toBe(DAILY_CHECKS);
    expect(wallet.remaining).toBe(0);
  });
});

describe('mergeDailyHints', () => {
  it('clips checks to an explicit cap instead of the hint default', () => {
    const merged = mergeDailyHints(
      { edition: 4, used: 1, remaining: 1 },
      { edition: 4, used: 9, remaining: 0 },
      4,
      2
    );
    expect(merged.used).toBe(2);
    expect(merged.remaining).toBe(0);
  });
});

describe('mergeProgress', () => {
  it('keeps the faster solved board', () => {
    const local = blankProgress({ isSolved: true, timerSeconds: 40 });
    const cloud = blankProgress({ isSolved: true, timerSeconds: 12 });
    const merged = mergeProgress(local, cloud);
    expect(merged?.timerSeconds).toBe(12);
    expect(merged?.isSolved).toBe(true);
  });

  it('uses updatedAt last-write-wins for unsolved boards', () => {
    const local = blankProgress({ mappings: { a: 'T' }, updatedAt: 20, timerSeconds: 3 });
    const cloud = blankProgress({ mappings: { a: 'S' }, updatedAt: 50, timerSeconds: 9 });
    const merged = mergeProgress(local, cloud);
    expect(merged?.mappings).toEqual({ a: 'S' });
    expect(merged?.timerSeconds).toBe(9);
  });
});

describe('edition', () => {
  const hard = { difficulty: 'Hard', difficultyMode: 'Hard' } as PuzzleData;
  const evening = { editionSlot: 'Evening', difficulty: 'Easy' } as PuzzleData;
  it('treats hard plates as night extras', () => {
    expect(isHardPuzzle(hard)).toBe(true);
    expect(isNightEdition(hard)).toBe(true);
    expect(isNightEdition(evening)).toBe(true);
  });
});

describe('progressFields', () => {
  it('keeps a board snapshot shape', () => {
    const fields = progressFields(blankProgress({ mappings: { mark: 'A' }, selectedSymbolId: 'mark' }));
    expect(fields.mappings).toEqual({ mark: 'A' });
    expect(fields.selectedSymbolId).toBe('mark');
    expect(fields.isSolved).toBe(false);
    expect(Object.keys(fields).sort()).toEqual([
      'checksRemaining',
      'checksUsed',
      'flaggedSymbolIds',
      'hintedSymbolIds',
      'hintsRemaining',
      'hintsUsed',
      'isSolved',
      'mappings',
      'selectedSymbolId',
      'timerSeconds',
      'verifiedSymbolIds',
    ]);
  });
});
