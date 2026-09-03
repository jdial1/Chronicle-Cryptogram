import { PuzzleData } from '../types';
import puzzlesData from './puzzles.json';

/**
 * Demo ceiling. The full season stays in puzzles.json; builds that set
 * VITE_MAX_EDITION simply stop exposing editions above it.
 *
 * Filtering here rather than at each call site means everything downstream
 * inherits the ceiling for free: maxEdition() and frontPageEdition() derive from
 * this array, getInitialPuzzle() reads it at module scope, and case-file fragments
 * only assemble when their edition's puzzle exists, so the narrative follows too.
 *
 * Note this is a runtime gate, not a content strip -- the withheld editions are
 * present in the bundle and readable with devtools. See demoContentPlugin in git
 * history for the build-time strip if exclusivity matters later.
 */
const MAX_EDITION = Number(import.meta.env.VITE_MAX_EDITION) || Infinity;

/** JSON `difficulty` is display copy; play mode is `puzzleMode()` / `difficultyMode`. */
export const INITIAL_PUZZLES: PuzzleData[] = (puzzlesData as PuzzleData[]).filter(
  (puzzle) => puzzle.editionNumber <= MAX_EDITION
);
