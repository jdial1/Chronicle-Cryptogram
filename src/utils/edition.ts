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

export function morningPuzzleOnDate(puzzles: PuzzleData[], editionDate: string) {
  return puzzles.find(
    (puzzle) =>
      puzzle.editionDate === editionDate &&
      isMorningEdition(puzzle) &&
      !isPrimerPuzzle(puzzle)
  );
}

export function firstCasePuzzle(puzzles: PuzzleData[]) {
  return puzzles.find((puzzle) => puzzle.editionNumber === 1 && isMorningEdition(puzzle));
}

export function articleDek(puzzle: PuzzleData) {
  return puzzle.subheadline.replace(/^(?:LATE CITY FINAL|NIGHT EXTRA)\s+[—–-]\s+/u, '');
}

export function articleByline(puzzle: PuzzleData) {
  return puzzle.authorOrSource
    .replace(/^The Chronicle Night Post(?:\s+[—–-]|,)\s*/u, '')
    .replace(/^Journal Entry\s*[-—–]\s*/u, '');
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

export function formatEditionDateShort(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
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

export function currentMorningPuzzle(puzzles: PuzzleData[]) {
  return morningPuzzleOnDate(puzzles, publishedThroughDate(puzzles));
}

export function storyHasBegun(puzzles: PuzzleData[]) {
  const first = firstCasePuzzle(puzzles);
  const current = currentMorningPuzzle(puzzles);
  return Boolean(first && current && first.id !== current.id);
}

export function hasSolvedStoryPuzzle(puzzles: PuzzleData[], solvedPuzzleIds: string[]) {
  return puzzles.some((puzzle) => !isPrimerPuzzle(puzzle) && solvedPuzzleIds.includes(puzzle.id));
}

export function nextIssueDate(puzzles: PuzzleData[]) {
  const cutoff = publishedThroughDate(puzzles);
  const future = puzzles
    .filter(
      (puzzle) =>
        puzzle.id.startsWith('day_') &&
        puzzle.category === 'Daily Featured' &&
        puzzle.editionNumber > 0 &&
        puzzle.editionDate > cutoff
    )
    .map((puzzle) => puzzle.editionDate)
    .sort();
  return future[0] || null;
}

export function formatIssueCountdown(ms: number) {
  const totalMins = Math.floor(Math.max(0, ms) / 60000);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return `${hours}hrs ${mins}mins`;
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
