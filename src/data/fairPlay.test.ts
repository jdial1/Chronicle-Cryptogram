import { describe, expect, it } from 'vitest';
import { INITIAL_PUZZLES } from './puzzles';
import { lastWordAlternates } from '../game/fairPlay';
import { FAIR_PLAY_DICTIONARY } from '../game/fairPlayDictionary';

/**
 * Fair play is a test, not a promise (docs/SOUL.md, "The Solver").
 *
 * A board solves only when every mark is right, and it says nothing until then. So
 * a page where the last word could honestly be read two ways strands the agent: the
 * board is full, reads as English, and will not stamp. For every page, the solver
 * lists the words that still fit another common English word once the rest of the
 * page is decoded (src/game/fairPlay.ts).
 *
 * Most of those die on grammar ("THE WIDOW IF HER TRUE BIOLOGICAL MOTHER"). The
 * ones that still make sense are listed below with what settles them: a phrase
 * the frame carries (the crib), or plain grammar. New content that adds a sensible
 * second reading changes the report and fails here until someone decides it.
 */
const REVIEWED: {
  id: string;
  word: string;
  rival: string;
  /** A phrase in the headline or article that settles it, or null when grammar does. */
  crib: string | null;
}[] = [
  { id: 'day_1_easy', word: 'DOSE', rival: 'ROSE', crib: 'how much of it he swallowed' },
  { id: 'day_3_hard', word: 'WAY', rival: 'DAY', crib: 'no return half' },
  { id: 'day_5_hard', word: 'WALKS', rival: 'TALKS', crib: 'turn her loose' },
  { id: 'day_7_easy', word: 'GIVES', rival: 'FILES', crib: 'now commands the entire smuggling fleet' },
  { id: 'day_14_easy', word: 'SANK', rival: 'SUNK', crib: null },
  { id: 'day_15_hard', word: 'TAKES', rival: 'TAXES', crib: null },
  { id: 'day_20_hard', word: 'BOAT', rival: 'COAT', crib: 'never boarded' },
  { id: 'day_21_easy', word: 'GOLD', rival: 'BOND', crib: 'I did not invent the gold' },
  { id: 'day_21_hard', word: 'FOG', rival: 'BOG', crib: 'the weather rolling off the harbor' },
  { id: 'day_24_easy', word: 'BODIES', rival: 'BADGES', crib: 'gruesome aftermath' },
  { id: 'day_25_hard', word: 'PINS', rival: 'WINS', crib: 'corner her' },
];

const report = INITIAL_PUZZLES.flatMap((puzzle) => {
  const found = lastWordAlternates(puzzle, FAIR_PLAY_DICTIONARY);
  return found.length
    ? [`${puzzle.id}: ${puzzle.originalText}`, ...found.map(({ word, alternates }) => `  ${word} -> ${alternates.join(', ')}`)]
    : [];
}).join('\n');

describe('fair play', () => {
  it('matches the reviewed report of last-word ambiguity', async () => {
    await expect(report + '\n').toMatchFileSnapshot('./__fairplay__/last-word-alternates.txt');
  });

  it.each(REVIEWED)('$id: $word, not $rival, is settled on the page', ({ id, word, rival, crib }) => {
    const puzzle = INITIAL_PUZZLES.find((p) => p.id === id)!;
    const rivals = lastWordAlternates(puzzle, FAIR_PLAY_DICTIONARY).find((entry) => entry.word === word);
    // Still a live rival: otherwise the entry is stale and should go.
    expect(rivals?.alternates).toContain(rival);
    if (crib) expect(`${puzzle.headline} ${puzzle.subheadline}`).toContain(crib);
  });
});
