import { useEffect, useState } from 'react';
import { PuzzleLiveStats } from '../types';
import { emptyPuzzleStats, subscribePuzzleStats } from '../utils/firebaseStore';

export function usePuzzleStats(puzzleId: string) {
  const [stats, setStats] = useState<PuzzleLiveStats>(() => emptyPuzzleStats(puzzleId));

  useEffect(() => {
    setStats(emptyPuzzleStats(puzzleId));
    const unsub = subscribePuzzleStats(puzzleId, setStats);
    return () => {
      unsub?.();
    };
  }, [puzzleId]);

  return stats;
}
