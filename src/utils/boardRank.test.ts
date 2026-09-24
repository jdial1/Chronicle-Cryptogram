import { describe, expect, it } from 'vitest';
import { compareFilings, isBetterFiling } from './boardRank';

describe('board order', () => {
  const clean = { hintsUsed: 0, checksUsed: 0, timeSeconds: 600 };
  const quickWithCheck = { hintsUsed: 0, checksUsed: 1, timeSeconds: 40 };
  const quickWithHint = { hintsUsed: 1, checksUsed: 0, timeSeconds: 30 };

  it('puts a clean solve above a quicker one that took help', () => {
    const board = [quickWithHint, quickWithCheck, clean].sort(compareFilings);
    expect(board[0]).toBe(clean);
  });

  it('counts a check the same as a hint, and breaks ties on time', () => {
    const board = [quickWithCheck, quickWithHint].sort(compareFilings);
    expect(board).toEqual([quickWithHint, quickWithCheck]);
  });

  it('keeps a slower clean filing over a faster one that took help', () => {
    expect(isBetterFiling(quickWithHint, clean)).toBe(false);
    expect(isBetterFiling({ ...clean, timeSeconds: 500 }, clean)).toBe(true);
    expect(isBetterFiling(clean, clean)).toBe(false);
  });
});
