import { useEffect } from 'react';
import type { User } from 'firebase/auth';
import type { GameStats, PuzzleData, PuzzleProgress } from '../types';
import { isPracticePuzzle } from '../utils/edition';
import { forgetCloud } from '../utils/deskError';
import { solverDisplayName } from '../utils/solverDisplayName';
import { writeGameStats, writeSolvedPuzzleIds } from '../utils/localStore';

export function useSolveCelebration({
  boardReady,
  uniqueSymbols,
  mappings,
  isSolved,
  progressReadyId,
  currentPuzzle,
  getTimerSeconds,
  commitTimer,
  hintsUsed,
  accuracy,
  solvedPuzzleIds,
  gameStats,
  user,
  boardProgress,
  setIsSolved,
  setIsTimerRunning,
  setIsSolveBulletinOpen,
  setSelectedSymbolId,
  setSelectedCellId,
  setCaseFileToastPuzzle,
  setSolvedPuzzleIds,
  setGameStats,
  dismissKeyboard,
}: {
  boardReady: boolean;
  uniqueSymbols: { symbolId: string; targetLetter: string }[];
  mappings: Record<string, string>;
  isSolved: boolean;
  progressReadyId: string;
  currentPuzzle: PuzzleData;
  getTimerSeconds: () => number;
  commitTimer: (seconds: number) => void;
  hintsUsed: number;
  accuracy: number;
  solvedPuzzleIds: string[];
  gameStats: GameStats;
  user: User | null;
  boardProgress: (overrides?: Partial<PuzzleProgress>) => PuzzleProgress;
  setIsSolved: (v: boolean) => void;
  setIsTimerRunning: (v: boolean) => void;
  setIsSolveBulletinOpen: (v: boolean) => void;
  setSelectedSymbolId: (v: string | null) => void;
  setSelectedCellId: (v: string | null) => void;
  setCaseFileToastPuzzle: (v: PuzzleData | null) => void;
  setSolvedPuzzleIds: (ids: string[]) => void;
  setGameStats: (stats: GameStats) => void;
  dismissKeyboard: () => void;
}) {
  useEffect(() => {
    if (!boardReady || uniqueSymbols.length === 0 || isSolved || progressReadyId !== currentPuzzle.id) return;
    const allMapped = uniqueSymbols.every((s) => Boolean(mappings[s.symbolId]));
    if (!allMapped) return;
    const allCorrect = uniqueSymbols.every((s) => mappings[s.symbolId] === s.targetLetter);
    if (!allCorrect) return;

    const elapsed = getTimerSeconds();
    commitTimer(elapsed);
    setIsSolved(true);
    setIsTimerRunning(false);
    setIsSolveBulletinOpen(true);
    setSelectedSymbolId(null);
    setSelectedCellId(null);
    dismissKeyboard();
    void import('../data/caseFiles').then(({ fragmentsUpdatedByPuzzle }) => {
      if (fragmentsUpdatedByPuzzle(currentPuzzle).length > 0) {
        setCaseFileToastPuzzle(currentPuzzle);
      }
    });
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      void import('canvas-confetti').then(({ default: fireConfetti }) => {
        fireConfetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#78350f', '#f59e0b', '#d97706', '#1c1917', '#10b981'],
        });
      });
    }
    if (isPracticePuzzle(currentPuzzle)) return;

    const nextSolved = Array.from(new Set([...solvedPuzzleIds, currentPuzzle.id]));
    setSolvedPuzzleIds(nextSolved);
    writeSolvedPuzzleIds(nextSolved);
    const next: GameStats = {
      ...gameStats,
      puzzlesSolved: gameStats.puzzlesSolved + 1,
      currentStreak: gameStats.currentStreak + 1,
      maxStreak: Math.max(gameStats.maxStreak, gameStats.currentStreak + 1),
      fastestTime:
        gameStats.fastestTime === null ? elapsed : Math.min(gameStats.fastestTime, elapsed),
      totalTimePlayed: gameStats.totalTimePlayed + elapsed,
    };
    setGameStats(next);
    writeGameStats(next);
    if (!user) return;
    const solverName = solverDisplayName(user);
    void import('../utils/firebaseStore').then((store) => {
      forgetCloud(
        store.recordPuzzleSolve(user.uid, currentPuzzle.id, elapsed, hintsUsed, accuracy, solverName),
        'record-solve'
      );
      forgetCloud(store.saveUserProfile(user.uid, next, nextSolved), 'save-profile');
      forgetCloud(
        store.saveCloudProgress(user.uid, currentPuzzle.id, boardProgress({ selectedSymbolId: null, isSolved: true })),
        'save-progress'
      );
    });
  }, [
    mappings,
    uniqueSymbols,
    isSolved,
    currentPuzzle,
    getTimerSeconds,
    commitTimer,
    user,
    hintsUsed,
    accuracy,
    solvedPuzzleIds,
    gameStats,
    progressReadyId,
    boardReady,
    boardProgress,
    setIsSolved,
    setIsTimerRunning,
    setIsSolveBulletinOpen,
    setSelectedSymbolId,
    setSelectedCellId,
    setCaseFileToastPuzzle,
    setSolvedPuzzleIds,
    setGameStats,
    dismissKeyboard,
  ]);
}
