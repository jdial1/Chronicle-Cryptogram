import { PuzzleData } from '../types';
import puzzlesData from './puzzles.json';

/** JSON `difficulty` is display copy; play mode is `puzzleMode()` / `difficultyMode`. */
export const INITIAL_PUZZLES: PuzzleData[] = puzzlesData as PuzzleData[];
