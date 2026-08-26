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

const RELEASE_TZ = 'America/Chicago';
const RELEASE_HOUR = 8;
const RELEASE_MINUTE = 30;

function pad2(value: number) {
  return String(value).padStart(2, '0');
}

function isoFromParts(year: number, month: number, day: number) {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function chicagoParts(at: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: RELEASE_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(at);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  const hour = read('hour');
  return {
    year: read('year'),
    month: read('month'),
    day: read('day'),
    hour: hour === 24 ? 0 : hour,
    minute: read('minute'),
  };
}

function shiftIsoDate(iso: string, days: number) {
  const [year, month, day] = iso.split('-').map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day));
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return isoFromParts(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1, shifted.getUTCDate());
}

export function issueReleaseAt(isoDate: string) {
  const [year, month, day] = isoDate.split('-').map(Number);
  let utc = Date.UTC(year, month - 1, day, 14, 30, 0);
  for (let i = 0; i < 3; i += 1) {
    const parts = chicagoParts(new Date(utc));
    const actual = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, 0);
    const wanted = Date.UTC(year, month - 1, day, RELEASE_HOUR, RELEASE_MINUTE, 0);
    utc += wanted - actual;
  }
  return utc;
}

export function todayIsoDate(now = new Date()) {
  const parts = chicagoParts(now);
  const iso = isoFromParts(parts.year, parts.month, parts.day);
  const released =
    parts.hour > RELEASE_HOUR || (parts.hour === RELEASE_HOUR && parts.minute >= RELEASE_MINUTE);
  return released ? iso : shiftIsoDate(iso, -1);
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
  return puzzles.some(
    (puzzle) =>
      !isPrimerPuzzle(puzzle) &&
      !isPracticePuzzle(puzzle) &&
      solvedPuzzleIds.includes(puzzle.id)
  );
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

export type DatedIssue = {
  date: string;
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

export function groupIssuesByChapter(issues: DatedIssue[]) {
  const chapters: { week: number; kicker: string; title: string; issues: DatedIssue[] }[] = [];
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

export function groupPuzzlesByDate(puzzles: PuzzleData[]) {
  const grouped = new Map<string, DatedIssue>();
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
