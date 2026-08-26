import { describe, expect, it } from 'vitest';
import { advanceDeskClock } from './useDeskTimer';

describe('advanceDeskClock', () => {
  it('stays on one decimal without float drift', () => {
    let seconds = 0;
    for (let i = 0; i < 10; i += 1) seconds = advanceDeskClock(seconds);
    expect(seconds).toBe(1);
    expect(advanceDeskClock(12.9)).toBe(13);
  });
});
