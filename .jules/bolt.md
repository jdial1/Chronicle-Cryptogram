# Bolt journal

## 2026-08-26 - Desk clock in App state
**Learning:** `setTimerSeconds` every 100ms re-renders the cipher grid and puts `timerSeconds` in the persist effect deps, so localStorage writes 10×/s while decoding.
**Action:** Keep high-frequency clocks in refs. Persist elapsed time on a 1s interval. Never put tick values in persist/debounce dependency arrays.
