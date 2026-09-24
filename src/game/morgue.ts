import type { PuzzleData } from '../types';

/**
 * The paper's morgue: its own clippings, searched by a word (docs/SOUL-FEATURES.md,
 * idea 27, after *Her Story*). Only pages the agent has decoded answer, so the
 * search can never reveal a line, or even confirm a guess, from a page still open.
 * Android's `Morgue` answers the same way.
 */
export const MORGUE_MIN_QUERY = 3;

export function searchMorgue(puzzles: PuzzleData[], solvedPuzzleIds: string[], query: string): PuzzleData[] {
  const needle = query.trim().toUpperCase();
  if (needle.length < MORGUE_MIN_QUERY) return [];
  const solved = new Set(solvedPuzzleIds);
  return puzzles.filter(
    (puzzle) =>
      solved.has(puzzle.id) &&
      `${puzzle.originalText} ${puzzle.headline} ${puzzle.subheadline}`.toUpperCase().includes(needle)
  );
}
