import { PuzzleData } from '../types';
import { INITIAL_PUZZLES } from './puzzles';
import { isPrimerPuzzle } from '../utils/edition';
import data from './primerPractice.json';

export const PRACTICE_PUZZLES: string[] = data.practicePuzzles;

function primerTemplate(): PuzzleData {
  return (
    INITIAL_PUZZLES.find((puzzle) => isPrimerPuzzle(puzzle)) || INITIAL_PUZZLES[0]
  );
}

function pickPracticeText(excludeText?: string) {
  const pool = excludeText
    ? PRACTICE_PUZZLES.filter((text) => text !== excludeText)
    : PRACTICE_PUZZLES;
  const source = pool.length ? pool : PRACTICE_PUZZLES;
  return source[Math.floor(Math.random() * source.length)];
}

export function createPracticePuzzle(excludeText?: string): PuzzleData {
  const primer = primerTemplate();
  const stamp = Date.now().toString(36);
  const salt = Math.floor(Math.random() * 46656).toString(36);
  return {
    ...primer,
    id: `practice_${stamp}${salt}`,
    title: 'Day 0 - Practice',
    headline: "CODEBREAKER'S DRILL",
    subheadline:
      'A second training cipher from the desk. The five tells still hold: single-letter words, frequent letters, short words, apostrophes, then double letters.',
    originalText: pickPracticeText(excludeText),
    category: 'Primer Practice',
    hints: [],
  };
}

export const PRACTICE_ARCHIVE_CARD: PuzzleData = {
  ...primerTemplate(),
  id: 'practice_slot',
  title: 'Day 0 - Practice',
  headline: "CODEBREAKER'S DRILL",
  category: 'Primer Practice',
  hints: [],
};
