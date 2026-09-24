import { describe, expect, it } from 'vitest';
import { SHARE_URL, helpLine, solveShareText } from './shareText';

/**
 * The share card is quoted verbatim by players, so its exact shape -- emoji, line
 * order, the trailing URL with no newline -- is part of the contract. Android's
 * `SolveParityTest` pins the same two strings.
 */
describe('share card', () => {
  it('prints the help taken, not an accuracy that is always 100%', () => {
    expect(
      solveShareText({
        editionNumber: 7,
        headline: 'TRAGEDY AT THE VANCE ESTATE',
        timerSeconds: 125.3,
        hintsUsed: 1,
        checksUsed: 2,
      })
    ).toBe(
      [
        '📰 CHRONICLE CRYPTOGRAM — EDITION #7',
        '🔍 Solved: "TRAGEDY AT THE VANCE ESTATE"',
        '⏱️ Time: 02:05.3',
        '🔎 Hints 1 · Checks 2',
        `Play Chronicle Cryptogram: ${SHARE_URL}`,
      ].join('\n')
    );
  });

  it('calls a solve with no help clean', () => {
    expect(helpLine(0, 0)).toBe('Clean — no hints, no checks');
    expect(helpLine(0, 1)).toBe('Hints 0 · Checks 1');
  });
});
