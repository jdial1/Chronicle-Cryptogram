import { PuzzleData } from '../types';
import { decryptOriginalText } from '../utils/cipherEngine';
import puzzlesData from './puzzles.json';

export const INITIAL_PUZZLES: PuzzleData[] = (puzzlesData as PuzzleData[]).map((puzzle) => ({
  ...puzzle,
  originalText: decryptOriginalText(puzzle.originalText, puzzle.id),
}));
