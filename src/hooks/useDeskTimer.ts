import { useCallback, useEffect, useRef, useState } from 'react';

const TICK_MS = 100;

/** Keep tenths precision without binary float drift (`0.1 + 0.1`). */
export function advanceDeskClock(seconds: number, step = 0.1): number {
  return +(seconds + step).toFixed(1);
}

/**
 * Tick the solve clock off the React render path.
 *
 * A 100ms `setTimerSeconds` in App used to:
 * - Re-render CryptogramGrid (~100+ cells) 10×/s even though the board did not change
 * - Rewrite localStorage 10×/s (persist effect listed `timerSeconds`)
 * - Reset the 1.5s cloud-save debounce every tick, so progress never flushed while the clock ran
 *
 * Expected: ~10× fewer App commits while decoding; persist 10/s → 1/s; cloud save can complete.
 */
export function useDeskTimer(bootSeconds: number, ticking: boolean) {
  const secondsRef = useRef(bootSeconds);
  const [timerSeconds, setTimerSeconds] = useState(bootSeconds);

  const getTimerSeconds = useCallback(() => secondsRef.current, []);

  const commitTimer = useCallback((value: number) => {
    secondsRef.current = value;
    setTimerSeconds(value);
  }, []);

  useEffect(() => {
    if (!ticking) return;
    const id = window.setInterval(() => {
      secondsRef.current = advanceDeskClock(secondsRef.current);
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [ticking]);

  return { timerSeconds, getTimerSeconds, commitTimer };
}
