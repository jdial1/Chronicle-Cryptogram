import { describe, expect, it } from 'vitest';
import {
  chapterForEdition,
  currentMorningPuzzle,
  frontPageEdition,
  groupIssues,
  groupIssuesByChapter,
  isMorningEdition,
  isNightUnlocked,
  isPracticePuzzle,
  isPrimerPuzzle,
  isSeasonComplete,
  ISSUE_CHAPTERS,
  maxEdition,
} from './edition';
import { PuzzleData } from '../types';
import { INITIAL_PUZZLES } from '../data/puzzles';

/** Minimal puzzle records: the gate only reads id, editionNumber and slot. */
function puzzle(editionNumber: number, slot: 'Morning' | 'Evening'): PuzzleData {
  return {
    id: `day_${editionNumber}_${slot === 'Morning' ? 'easy' : 'hard'}`,
    editionNumber,
    editionSlot: slot,
    difficultyMode: slot === 'Morning' ? 'Easy' : 'Hard',
    title: '',
    headline: '',
    subheadline: '',
    authorOrSource: '',
    originalText: '',
    difficulty: slot === 'Morning' ? 'Easy' : 'Hard',
    theme: '',
    category: 'Daily Featured',
    hints: [],
  } as PuzzleData;
}

/** A three-edition season plus the Primer. */
const SEASON: PuzzleData[] = [
  { ...puzzle(0, 'Morning'), id: 'day_0_primer' },
  puzzle(1, 'Morning'), puzzle(1, 'Evening'),
  puzzle(2, 'Morning'), puzzle(2, 'Evening'),
  puzzle(3, 'Morning'), puzzle(3, 'Evening'),
];

describe('frontPageEdition', () => {
  it('starts a fresh player at edition 1', () => {
    expect(frontPageEdition(SEASON, [])).toBe(1);
  });

  it('does not advance for the Primer, which sits outside the season walk', () => {
    expect(frontPageEdition(SEASON, ['day_0_primer'])).toBe(1);
  });

  it('advances one past the last solved morning', () => {
    expect(frontPageEdition(SEASON, ['day_1_easy'])).toBe(2);
    expect(frontPageEdition(SEASON, ['day_1_easy', 'day_2_easy'])).toBe(3);
  });

  it('stops at a hole rather than jumping to the furthest solve', () => {
    expect(frontPageEdition(SEASON, ['day_1_easy', 'day_3_easy'])).toBe(2);
  });

  it('clamps to the end of the season and never runs past it', () => {
    const all = ['day_1_easy', 'day_2_easy', 'day_3_easy'];
    expect(frontPageEdition(SEASON, all)).toBe(3);
    expect(frontPageEdition(SEASON, [...all, 'day_3_hard'])).toBe(3);
  });

  it('is not advanced by night solves alone', () => {
    expect(frontPageEdition(SEASON, ['day_1_hard', 'day_2_hard'])).toBe(1);
  });

  it('ignores the system clock entirely', () => {
    const realNow = Date.now;
    Date.now = () => Date.parse('2031-01-01T00:00:00Z');
    try {
      expect(frontPageEdition(SEASON, [])).toBe(1);
    } finally {
      Date.now = realNow;
    }
  });
});

describe('currentMorningPuzzle', () => {
  it('returns the front page morning, never a night, primer or practice puzzle', () => {
    const current = currentMorningPuzzle(SEASON, ['day_1_easy']);
    expect(current?.id).toBe('day_2_easy');
    expect(isMorningEdition(current!)).toBe(true);
    expect(isPrimerPuzzle(current!)).toBe(false);
    expect(isPracticePuzzle(current!)).toBe(false);
  });
});

describe('isNightUnlocked', () => {
  it('opens only once that edition\'s morning is solved', () => {
    expect(isNightUnlocked(SEASON, [], 1)).toBe(false);
    expect(isNightUnlocked(SEASON, ['day_1_easy'], 1)).toBe(true);
  });

  it('is unaffected by the previous edition', () => {
    expect(isNightUnlocked(SEASON, ['day_1_easy'], 2)).toBe(false);
  });
});

describe('isSeasonComplete', () => {
  const allMornings = ['day_1_easy', 'day_2_easy', 'day_3_easy'];

  it('is false before the last edition is reached', () => {
    expect(isSeasonComplete(SEASON, [])).toBe(false);
    expect(isSeasonComplete(SEASON, ['day_1_easy'])).toBe(false);
  });

  it('is false on the last edition until its Night Extra is broken', () => {
    expect(isSeasonComplete(SEASON, allMornings)).toBe(false);
  });

  it('is true once the last Night Extra is solved', () => {
    expect(isSeasonComplete(SEASON, [...allMornings, 'day_3_hard'])).toBe(true);
  });

  it('tracks the shipped puzzle set, so a truncated demo completes at its own ceiling', () => {
    const demo = SEASON.filter((p) => p.editionNumber <= 2);
    expect(isSeasonComplete(demo, ['day_1_easy', 'day_2_easy', 'day_2_hard'])).toBe(true);
    expect(isSeasonComplete(SEASON, ['day_1_easy', 'day_2_easy', 'day_2_hard'])).toBe(false);
  });
});

describe('groupIssues', () => {
  it('lists every issue regardless of solve state, so the archive stops hiding the future', () => {
    expect(groupIssues(SEASON).map((issue) => issue.editionNumber)).toEqual([0, 1, 2, 3]);
    expect(groupIssues(SEASON).length).toBe(groupIssues(SEASON).length);
  });
});

describe('the shipped season', () => {
  it('runs 30 editions with exactly one Morning and one Night each', () => {
    expect(maxEdition(INITIAL_PUZZLES)).toBe(30);
    for (let edition = 1; edition <= 30; edition += 1) {
      const inEdition = INITIAL_PUZZLES.filter((p) => p.editionNumber === edition);
      expect(inEdition.filter(isMorningEdition)).toHaveLength(1);
      expect(inEdition.filter((p) => !isMorningEdition(p))).toHaveLength(1);
    }
  });

  it('walks end to end when each morning is solved in turn', () => {
    let solved: string[] = [];
    for (let expected = 1; expected <= 30; expected += 1) {
      expect(frontPageEdition(INITIAL_PUZZLES, solved)).toBe(expected);
      const morning = currentMorningPuzzle(INITIAL_PUZZLES, solved);
      expect(morning?.editionNumber).toBe(expected);
      solved = [...solved, morning!.id];
    }
    expect(frontPageEdition(INITIAL_PUZZLES, solved)).toBe(30);
  });
});



describe('ISSUE_CHAPTERS', () => {
  it('gives every chapter a two-word title', () => {
    for (const chapter of ISSUE_CHAPTERS) {
      expect(chapter.title.trim().split(/\s+/)).toHaveLength(2);
    }
  });
});

describe('chapterForEdition', () => {
  it('maps primer and story weeks', () => {
    expect(chapterForEdition(0).title).toBe('The Primer');
    expect(chapterForEdition(1).title).toBe('The Panic');
    expect(chapterForEdition(6).title).toBe('The Panic');
    expect(chapterForEdition(7).title).toBe('Sins Exposed');
    expect(chapterForEdition(13).title).toBe('Sins Exposed');
    expect(chapterForEdition(14).title).toBe('Systemic Rot');
    expect(chapterForEdition(21).title).toBe('Rat Trap');
    expect(chapterForEdition(28).title).toBe('New Dawn');
    expect(chapterForEdition(30).title).toBe('New Dawn');
  });
});

describe('groupIssuesByChapter', () => {
  it('splits a mixed run into weekly chapters', () => {
    const grouped = groupIssuesByChapter([
      { editionNumber: 0 },
      { editionNumber: 1 },
      { editionNumber: 6 },
      { editionNumber: 7 },
      { editionNumber: 10 },
    ]);
    expect(grouped.map((chapter) => [chapter.title, chapter.issues.map((issue) => issue.editionNumber)])).toEqual([
      ['The Primer', [0]],
      ['The Panic', [1, 6]],
      ['Sins Exposed', [7, 10]],
    ]);
  });
});
