import { describe, expect, it } from 'vitest';
import { INITIAL_PUZZLES } from './puzzles';
import { frameLeak as leak } from '../game/deskCheck';

/**
 * The frame is the crib; the revelation is behind the lock (docs/SOUL.md).
 *
 * The headline and article should hand the agent names, places and motive, never
 * the line itself. This measures how much of the answer's vocabulary (whole words
 * of five letters or more) the frame already prints. Above half is a warning worth
 * a writer's look; a frame that prints every long word of the answer has given the
 * page away, and fails.
 */

describe('frames', () => {
  it('flags frames that print more than half of the answer', () => {
    const heavy = INITIAL_PUZZLES.map((p) => ({ id: p.id, ...leak(p) })).filter((l) => l.share > 0.5);
    for (const l of heavy) console.warn(`frame leak ${l.id}: ${l.printed.join(', ')} of ${l.answer.join(', ')}`);
    expect(heavy.length).toBeLessThan(INITIAL_PUZZLES.length);
  });

  it.each(INITIAL_PUZZLES.filter((p) => leak(p).answer.length >= 2))(
    '$id does not print its own answer in the frame',
    (puzzle) => {
      expect(leak(puzzle).share).toBeLessThan(1);
    }
  );
});
