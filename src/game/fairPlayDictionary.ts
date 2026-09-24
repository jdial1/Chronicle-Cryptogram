import { createRequire } from 'node:module';
import { INITIAL_PUZZLES } from '../data/puzzles';

/**
 * The words an agent would reach for: the most common English words (SCOWL sizes
 * 10 and 20, via the `wordlist-english` dev dependency) plus the season's own
 * vocabulary, so names like VANCE and STERLING count as words. Test-only; it pulls
 * a Node module and must never be imported by the app.
 */
const require = createRequire(import.meta.url);
const lists = require('wordlist-english') as Record<string, string[]>;

const season = INITIAL_PUZZLES.flatMap((puzzle) => puzzle.originalText.toUpperCase().match(/[A-Z']+/g) ?? []);

export const FAIR_PLAY_DICTIONARY: ReadonlySet<string> = new Set(
  [...lists['english/10'], ...lists['english/20'], ...season]
    .map((word) => word.toUpperCase())
    // Single letters in the list are mostly initials; only A, I and O are words.
    .filter((word) => /^[A-Z']+$/.test(word) && (word.length > 1 || word === 'A' || word === 'I' || word === 'O'))
);
