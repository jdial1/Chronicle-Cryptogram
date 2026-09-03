import { PuzzleData } from '../types';

/** Night extra: evening slot, or a hard/master plate (legacy records without a slot). */
export function isHardPuzzle(puzzle: PuzzleData) {
  return puzzleMode(puzzle) === 'Hard';
}

export type PuzzleMode = 'Easy' | 'Hard';

export function puzzleMode(puzzle: PuzzleData): PuzzleMode {
  if (puzzle.difficultyMode === 'Hard' || puzzle.difficultyMode === 'Easy') return puzzle.difficultyMode;
  return puzzle.difficulty === 'Hard' || puzzle.difficulty === 'Master' ? 'Hard' : 'Easy';
}

export function matchesMode(puzzle: PuzzleData, mode: PuzzleMode) {
  return puzzleMode(puzzle) === mode;
}

export function isNightEdition(puzzle: PuzzleData) {
  return puzzle.editionSlot === 'Evening' || isHardPuzzle(puzzle);
}

export function isMorningEdition(puzzle: PuzzleData) {
  return !isNightEdition(puzzle);
}

export function isPracticePuzzle(puzzle: Pick<PuzzleData, 'id' | 'category'>) {
  return puzzle.category === 'Primer Practice' || puzzle.id.startsWith('practice_');
}

export function isPrimerPuzzle(puzzle: PuzzleData) {
  return puzzle.editionNumber === 0 && !isPracticePuzzle(puzzle);
}

export function morningPuzzleForEdition(puzzles: PuzzleData[], edition: number) {
  return puzzles.find(
    (puzzle) =>
      puzzle.editionNumber === edition &&
      isMorningEdition(puzzle) &&
      !isPrimerPuzzle(puzzle)
  );
}

export function nightPuzzleForEdition(puzzles: PuzzleData[], edition: number) {
  return puzzles.find((puzzle) => puzzle.editionNumber === edition && isNightEdition(puzzle));
}

/** Highest edition in the season. Edition 0 is the Primer, so a season of 30 returns 30. */
export function maxEdition(puzzles: PuzzleData[]) {
  return puzzles.reduce((max, puzzle) => Math.max(max, puzzle.editionNumber), 0);
}

export function editionLabel(edition: number) {
  return edition === 0 ? 'The Primer' : `Edition No. ${edition}`;
}

export function articleDek(puzzle: PuzzleData) {
  return puzzle.subheadline.replace(/^(?:LATE CITY FINAL|NIGHT EXTRA)\s+[—–-]\s+/u, '');
}

export function articleByline(puzzle: PuzzleData) {
  return puzzle.authorOrSource
    .replace(/^The Chronicle Night Post(?:\s+[—–-]|,)\s*/u, '')
    .replace(/^Journal Entry\s*[-—–]\s*/u, '');
}

export function isNightUnlocked(
  puzzles: PuzzleData[],
  solvedPuzzleIds: string[],
  edition: number
) {
  return puzzles.some(
    (puzzle) =>
      puzzle.editionNumber === edition &&
      isMorningEdition(puzzle) &&
      solvedPuzzleIds.includes(puzzle.id)
  );
}

/**
 * Highest edition the player may open: 1, or one past the last contiguously-solved
 * morning, clamped to the end of the season. Contiguous rather than max, so a hole
 * in the run cannot be skipped and a hand-edited save cannot jump the season.
 * Edition 0 (the Primer) sits outside the walk -- it is optional and always open.
 */
export function frontPageEdition(puzzles: PuzzleData[], solvedPuzzleIds: string[]) {
  const last = maxEdition(puzzles);
  let edition = 1;
  while (edition < last) {
    const morning = morningPuzzleForEdition(puzzles, edition);
    if (!morning || !solvedPuzzleIds.includes(morning.id)) break;
    edition += 1;
  }
  return edition;
}

export function currentMorningPuzzle(puzzles: PuzzleData[], solvedPuzzleIds: string[]) {
  return morningPuzzleForEdition(puzzles, frontPageEdition(puzzles, solvedPuzzleIds));
}

/** The last edition is reached and its Night Extra broken -- the season is over. */
export function isSeasonComplete(puzzles: PuzzleData[], solvedPuzzleIds: string[]) {
  const last = maxEdition(puzzles);
  if (frontPageEdition(puzzles, solvedPuzzleIds) !== last) return false;
  const finale = nightPuzzleForEdition(puzzles, last);
  return Boolean(finale && solvedPuzzleIds.includes(finale.id));
}

export type Issue = {
  editionNumber: number;
  morning?: PuzzleData;
  night?: PuzzleData;
};

/** Player-facing archive chapters. Spans match WEEKLY_TENTPOLES; titles are two words. */
export const ISSUE_CHAPTERS = [
  { week: 0, kicker: 'Training', title: 'The Primer', from: 0, to: 0 },
  { week: 1, kicker: 'Chapter I', title: 'The Panic', from: 1, to: 6 },
  { week: 2, kicker: 'Chapter II', title: 'Sins Exposed', from: 7, to: 13 },
  { week: 3, kicker: 'Chapter III', title: 'Systemic Rot', from: 14, to: 20 },
  { week: 4, kicker: 'Chapter IV', title: 'Rat Trap', from: 21, to: 27 },
  { week: 5, kicker: 'Chapter V', title: 'New Dawn', from: 28, to: 30 },
] as const;

export type IssueChapter = (typeof ISSUE_CHAPTERS)[number];

export function chapterForEdition(editionNumber: number): IssueChapter {
  return (
    ISSUE_CHAPTERS.find((chapter) => editionNumber >= chapter.from && editionNumber <= chapter.to) ??
    ISSUE_CHAPTERS[ISSUE_CHAPTERS.length - 1]
  );
}

export function groupIssuesByChapter(issues: Issue[]) {
  const chapters: { week: number; kicker: string; title: string; issues: Issue[] }[] = [];
  for (const issue of issues) {
    const meta = chapterForEdition(issue.editionNumber);
    const last = chapters[chapters.length - 1];
    if (!last || last.week !== meta.week) {
      chapters.push({ week: meta.week, kicker: meta.kicker, title: meta.title, issues: [issue] });
    } else {
      last.issues.push(issue);
    }
  }
  return chapters;
}

/** Every issue in the season, locked or not. Callers render lock state from frontPageEdition. */
export function groupIssues(puzzles: PuzzleData[]) {
  const grouped = new Map<number, Issue>();

  for (const puzzle of puzzles) {
    if (!puzzle.id.startsWith('day_') || puzzle.category !== 'Daily Featured') continue;
    let issue = grouped.get(puzzle.editionNumber);
    if (!issue) {
      issue = { editionNumber: puzzle.editionNumber };
      grouped.set(puzzle.editionNumber, issue);
    }
    if (isNightEdition(puzzle)) issue.night = puzzle;
    else issue.morning = puzzle;
  }

  return Array.from(grouped.values())
    .filter((issue) => issue.morning || issue.night)
    .sort((a, b) => a.editionNumber - b.editionNumber);
}
