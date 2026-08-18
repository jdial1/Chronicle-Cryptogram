import { PuzzleData } from '../types';

export function isNightEdition(puzzle: PuzzleData) {
  return (
    puzzle.editionSlot === 'Evening' ||
    puzzle.difficultyMode === 'Hard' ||
    puzzle.difficulty === 'Hard' ||
    puzzle.difficulty === 'Master'
  );
}

export function isMorningEdition(puzzle: PuzzleData) {
  return !isNightEdition(puzzle);
}

export function isPrimerPuzzle(puzzle: PuzzleData) {
  return puzzle.editionNumber === 0;
}

export function isNightUnlockedForDate(
  puzzles: PuzzleData[],
  solvedPuzzleIds: string[],
  editionDate: string
) {
  return puzzles.some(
    (puzzle) =>
      puzzle.editionDate === editionDate &&
      isMorningEdition(puzzle) &&
      solvedPuzzleIds.includes(puzzle.id)
  );
}

export function formatEditionDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function todayIsoDate() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export function publishedThroughDate(puzzles: PuzzleData[]) {
  const dates = puzzles
    .filter(
      (puzzle) =>
        puzzle.id.startsWith('day_') &&
        puzzle.category === 'Daily Featured' &&
        puzzle.editionNumber > 0
    )
    .map((puzzle) => puzzle.editionDate)
    .sort();
  if (dates.length === 0) return todayIsoDate();
  const first = dates[0];
  const today = todayIsoDate();
  return today < first ? first : today;
}

export function groupPuzzlesByDate(puzzles: PuzzleData[]) {
  const grouped = new Map<
    string,
    { date: string; editionNumber: number; morning?: PuzzleData; night?: PuzzleData }
  >();
  const cutoff = publishedThroughDate(puzzles);

  for (const puzzle of puzzles) {
    if (!puzzle.id.startsWith('day_') || puzzle.category !== 'Daily Featured') continue;
    if (puzzle.editionDate > cutoff) continue;
    let issue = grouped.get(puzzle.editionDate);
    if (!issue) {
      issue = { date: puzzle.editionDate, editionNumber: puzzle.editionNumber };
      grouped.set(puzzle.editionDate, issue);
    }
    if (isNightEdition(puzzle)) issue.night = puzzle;
    else issue.morning = puzzle;
  }

  return Array.from(grouped.values())
    .filter((issue) => issue.morning || issue.night)
    .sort((a, b) => a.editionNumber - b.editionNumber);
}
