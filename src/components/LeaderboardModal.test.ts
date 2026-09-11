import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * Times reach the board straight from the client. `submitLeaderboardEntry` writes
 * whatever `timeSeconds` it is handed, and the only defence is a range check in
 * firestore.rules -- so any anonymous player can post a five-second solve.
 *
 * The board is allowed to say it printed a time. It is not allowed to say it
 * checked one. This guard exists because the in-fiction voice ("Bureau of
 * Cryptanalysis") makes an integrity claim read as flavour, which is exactly how
 * "Verified!" and "Official Timings Certified by..." got shipped in the first
 * place. Wording that promises verification is the one place where the charm
 * works against the product.
 *
 * Android carries the same line; `LeaderboardScreenTest` pins it there.
 */
describe('leaderboard copy', () => {
  const source = readFileSync(new URL('./LeaderboardModal.tsx', import.meta.url), 'utf8');
  /** Comments discuss the banned words on purpose. Only shipped copy is judged. */
  const copy = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

  it('never claims a time was verified, certified or official', () => {
    const claims = copy.match(/verif|certif|official/gi) ?? [];
    expect(claims).toEqual([]);
  });

  it('says who the times came from', () => {
    expect(copy).toContain('Times as filed by solvers.');
  });
});
