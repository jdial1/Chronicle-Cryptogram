import { useMemo } from 'react';
import { PuzzleData } from '../types';
import { frontPageEdition, isSeasonComplete, maxEdition } from '../utils/edition';

/**
 * Demo builds ship a truncated season (see demoContentPlugin in vite.config.ts).
 * The gate needs no ceiling check -- maxEdition() over the shipped puzzles already
 * clamps it -- so this flag exists purely to tell "the demo ends here" apart from
 * "the story ends here" in copy.
 */
export const IS_DEMO = Boolean(import.meta.env.VITE_MAX_EDITION);

/** Where the player stands in the season. One owner for every ceiling question. */
export function useCampaignProgress(puzzles: PuzzleData[], solvedPuzzleIds: string[]) {
  return useMemo(
    () => ({
      frontPage: frontPageEdition(puzzles, solvedPuzzleIds),
      seasonLength: maxEdition(puzzles),
      isSeasonComplete: isSeasonComplete(puzzles, solvedPuzzleIds),
      isDemo: IS_DEMO,
    }),
    [puzzles, solvedPuzzleIds]
  );
}
