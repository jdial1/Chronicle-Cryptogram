import { useMemo } from 'react';
import { PuzzleData } from '../types';
import { frontPageEdition, maxEdition, nightPuzzleForEdition } from '../utils/edition';

/**
 * Where the player stands in the season. One place so the ceiling has one owner:
 * the demo build clamps seasonLength here rather than at every call site.
 */
export function useCampaignProgress(puzzles: PuzzleData[], solvedPuzzleIds: string[]) {
  return useMemo(() => {
    const seasonLength = maxEdition(puzzles);
    const frontPage = frontPageEdition(puzzles, solvedPuzzleIds);
    const finale = nightPuzzleForEdition(puzzles, seasonLength);
    return {
      frontPage,
      seasonLength,
      /** Last edition reached and its Night Extra broken -- the season is over. */
      isSeasonComplete:
        frontPage === seasonLength && Boolean(finale && solvedPuzzleIds.includes(finale.id)),
    };
  }, [puzzles, solvedPuzzleIds]);
}
