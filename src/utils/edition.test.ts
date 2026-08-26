import { describe, expect, it } from 'vitest';
import { chapterForEdition, groupIssuesByChapter, ISSUE_CHAPTERS } from './edition';

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
      { date: '2026-08-16', editionNumber: 0 },
      { date: '2026-08-17', editionNumber: 1 },
      { date: '2026-08-22', editionNumber: 6 },
      { date: '2026-08-23', editionNumber: 7 },
      { date: '2026-08-26', editionNumber: 10 },
    ]);
    expect(grouped.map((chapter) => [chapter.title, chapter.issues.map((issue) => issue.editionNumber)])).toEqual([
      ['The Primer', [0]],
      ['The Panic', [1, 6]],
      ['Sins Exposed', [7, 10]],
    ]);
  });
});
