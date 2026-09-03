/**
 * The season contract.
 *
 * Every assertion here is derived from the shipped data rather than hard-coded to
 * thirty editions, so authoring Season 2 means adding puzzles and running `npm test`
 * -- not editing this file. A failure names the offending edition.
 *
 * This exists because content is the long pole for Season 2 and nothing else checks
 * it: cipherEngine has no tests of its own, and a quote that produces an unsolvable
 * board would ship silently.
 */
import { describe, expect, it } from 'vitest';
import { INITIAL_PUZZLES } from './puzzles';
import { CASE_FRAGMENTS } from './caseFiles';
import { cipherForPuzzle } from '../game/puzzleState';
import { HOMOPHONE_ALLOCATIONS } from '../utils/cipherEngine';
import {
  ISSUE_CHAPTERS,
  isHardPuzzle,
  isMorningEdition,
  isNightEdition,
  maxEdition,
} from '../utils/edition';

const LAST = maxEdition(INITIAL_PUZZLES);
const STORY_EDITIONS = Array.from({ length: LAST }, (_, i) => i + 1);

describe('season shape', () => {
  it('ships at least one edition', () => {
    expect(LAST).toBeGreaterThan(0);
  });

  it('has no gaps: every edition from 1 to the last is present', () => {
    const present = new Set(INITIAL_PUZZLES.map((p) => p.editionNumber));
    expect(STORY_EDITIONS.filter((n) => !present.has(n))).toEqual([]);
  });

  it('gives every edition exactly one Morning and one Night', () => {
    const wrong = STORY_EDITIONS.map((edition) => {
      const inEdition = INITIAL_PUZZLES.filter((p) => p.editionNumber === edition);
      const mornings = inEdition.filter(isMorningEdition).length;
      const nights = inEdition.filter(isNightEdition).length;
      return mornings === 1 && nights === 1 ? null : { edition, mornings, nights };
    }).filter(Boolean);
    expect(wrong).toEqual([]);
  });

  it('uses a unique id for every puzzle', () => {
    const seen = new Map<string, number>();
    for (const puzzle of INITIAL_PUZZLES) {
      seen.set(puzzle.id, (seen.get(puzzle.id) ?? 0) + 1);
    }
    expect([...seen.entries()].filter(([, n]) => n > 1)).toEqual([]);
  });
});

describe('chapters cover the season', () => {
  /**
   * chapterForEdition falls back to the last chapter for anything outside the
   * declared spans, so a Season 2 added without extending ISSUE_CHAPTERS would
   * silently label all of it "New Dawn" rather than fail. Assert coverage directly.
   */
  it('declares a chapter span for every edition, including the Primer', () => {
    const uncovered = [0, ...STORY_EDITIONS].filter(
      (edition) => !ISSUE_CHAPTERS.some((c) => edition >= c.from && edition <= c.to)
    );
    expect(uncovered).toEqual([]);
  });

  it('declares no overlapping spans', () => {
    const overlaps: string[] = [];
    for (let i = 0; i < ISSUE_CHAPTERS.length; i += 1) {
      for (let j = i + 1; j < ISSUE_CHAPTERS.length; j += 1) {
        const a = ISSUE_CHAPTERS[i];
        const b = ISSUE_CHAPTERS[j];
        if (a.from <= b.to && b.from <= a.to) overlaps.push(`${a.title} / ${b.title}`);
      }
    }
    expect(overlaps).toEqual([]);
  });
});

describe('case fragments', () => {
  it('only reference editions that ship', () => {
    const present = new Set(INITIAL_PUZZLES.map((p) => p.editionNumber));
    const dangling = CASE_FRAGMENTS.filter((f) => !present.has(f.editionNumber)).map(
      (f) => `${f.title} -> edition ${f.editionNumber}`
    );
    expect(dangling).toEqual([]);
  });
});

describe('every shipped puzzle builds a playable cipher', () => {
  /** Rebuild the plaintext from the parsed board; it must match what was authored. */
  function reconstruct(words: ReturnType<typeof cipherForPuzzle>['words']) {
    return words
      .map((word) => word.symbols.map((s) => s.targetLetter).join(''))
      .join(' ');
  }

  it('round-trips the authored text', () => {
    const broken = INITIAL_PUZZLES.map((puzzle) => {
      const expected = puzzle.originalText.trim().split(/\s+/).join(' ').toUpperCase();
      const actual = reconstruct(cipherForPuzzle(puzzle).words).toUpperCase();
      return actual === expected ? null : puzzle.id;
    }).filter(Boolean);
    expect(broken).toEqual([]);
  });

  it('never maps one symbol to two different letters, which would be unsolvable', () => {
    const collisions: string[] = [];
    for (const puzzle of INITIAL_PUZZLES) {
      const assigned = new Map<string, string>();
      for (const word of cipherForPuzzle(puzzle).words) {
        for (const symbol of word.symbols) {
          if (symbol.isPunctuation) continue;
          const previous = assigned.get(symbol.symbolId);
          if (previous && previous !== symbol.targetLetter) {
            collisions.push(`${puzzle.id}: ${symbol.symbolId} -> ${previous} and ${symbol.targetLetter}`);
          }
          assigned.set(symbol.symbolId, symbol.targetLetter);
        }
      }
    }
    expect(collisions).toEqual([]);
  });

  it('contains at least one solvable letter', () => {
    const empty = INITIAL_PUZZLES.filter(
      (puzzle) =>
        !cipherForPuzzle(puzzle).words.some((w) => w.symbols.some((s) => !s.isPunctuation))
    ).map((p) => p.id);
    expect(empty).toEqual([]);
  });

  /** Which letters a board actually spreads across more than one glyph. */
  function splitLetters(puzzle: (typeof INITIAL_PUZZLES)[number]) {
    const perLetter = new Map<string, Set<string>>();
    for (const word of cipherForPuzzle(puzzle).words) {
      for (const symbol of word.symbols) {
        if (symbol.isPunctuation) continue;
        const set = perLetter.get(symbol.targetLetter) ?? new Set<string>();
        set.add(symbol.symbolId);
        perLetter.set(symbol.targetLetter, set);
      }
    }
    return [...perLetter.entries()].filter(([, ids]) => ids.size > 1).map(([letter]) => letter);
  }

  it('splits every repeated homophone letter in a Night Extra', () => {
    // Engine invariant: homophones cycle per occurrence, so a letter allocated two
    // glyphs must use both once it appears twice. Independent of how the quote reads.
    const allocated = Object.entries(HOMOPHONE_ALLOCATIONS)
      .filter(([, count]) => count > 1)
      .map(([letter]) => letter);

    const missed: string[] = [];
    for (const puzzle of INITIAL_PUZZLES.filter(isHardPuzzle)) {
      const counts = new Map<string, number>();
      for (const char of puzzle.originalText.toUpperCase().replace(/[^A-Z]/g, '')) {
        counts.set(char, (counts.get(char) ?? 0) + 1);
      }
      const split = new Set(splitLetters(puzzle));
      for (const letter of allocated) {
        if ((counts.get(letter) ?? 0) >= 2 && !split.has(letter)) {
          missed.push(`${puzzle.id}: ${letter} repeats but never splits`);
        }
      }
    }
    expect(missed).toEqual([]);
  });

  /**
   * Content invariant. A Night Extra whose quote never repeats E, T or A renders as a
   * plain 1:1 substitution -- frequency counting works cleanly and the mode's whole
   * promise ("E, T and A each get two glyphs", per the store listing) does not land.
   *
   * day_4_hard is a known miss: 24 letters, with E, T and A appearing exactly once
   * each. Fixing it means rewriting the quote, which is authoring work. The list is
   * here so the defect is visible and so new content cannot quietly join it.
   */
  const KNOWN_FLAT_NIGHT_EXTRAS = ['day_4_hard'];

  it('gives Night Extras real homophones, which is the whole promise of the mode', () => {
    const nights = INITIAL_PUZZLES.filter(isHardPuzzle);
    expect(nights.length).toBeGreaterThan(0);

    const flat = nights.filter((p) => splitLetters(p).length === 0).map((p) => p.id);
    expect(flat).toEqual(KNOWN_FLAT_NIGHT_EXTRAS);
  });
});
