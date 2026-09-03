import { useEffect, useRef, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import type { User } from 'firebase/auth';
import type { GameStats, PuzzleData, PuzzleProgress, SymbolMapping } from '../types';
import {
  DAILY_CHECKS,
  clipHintedSymbolIds,
  clipSelectedSymbolId,
  mergeDailyHints,
  mergeGameStats,
  mergeProgress,
  mergeSolvedIds,
  readAllLocalProgress,
  readGameStats,
  readLocalProgress,
  readSolvedPuzzleIds,
  reconcileDailyChecks,
  reconcileDailyHints,
  writeGameStats,
  writeLocalDailyChecks,
  writeLocalDailyHints,
  writeLocalProgress,
  writeSolvedPuzzleIds,
} from '../utils/localStore';
import { forgetCloud, logDesk } from '../utils/deskError';
import { solverDisplayName } from '../utils/solverDisplayName';
import { INITIAL_PUZZLES } from '../data/puzzles';
import { isPracticePuzzle } from '../utils/edition';
import {
  decodedMappings,
  editionProgress,
  gateCloudHydrate,
  liveFlaggedIds,
  withHintedMappings,
} from '../game/puzzleState';

function cloudStore() {
  return import('../utils/firebaseStore');
}

export type CloudBoardApply = {
  mappings: SymbolMapping;
  timerSeconds: number;
  hintsUsed: number;
  hintsRemaining: number;
  hintedSymbolIds: string[];
  checksUsed: number;
  checksRemaining: number;
  verifiedSymbolIds: string[];
  flaggedSymbolIds: string[];
  isSolved: boolean;
  selectedSymbolId?: string | null;
};

export function useCloudDesk({
  user,
  currentPuzzle,
  uniqueSymbols,
  solvedPuzzleIds,
  allPuzzles,
  progressReadyId,
  progress,
  startedPuzzlesRef,
  boardDirtyRef,
  applyCloudBoard,
  setSolvedPuzzleIds,
  setGameStats,
}: {
  user: User | null;
  currentPuzzle: PuzzleData;
  uniqueSymbols: { symbolId: string; targetLetter: string }[];
  solvedPuzzleIds: string[];
  allPuzzles: PuzzleData[];
  progressReadyId: string;
  progress: PuzzleProgress;
  startedPuzzlesRef: MutableRefObject<Set<string>>;
  boardDirtyRef: MutableRefObject<boolean>;
  applyCloudBoard: (next: CloudBoardApply) => void;
  setSolvedPuzzleIds: Dispatch<SetStateAction<string[]>>;
  setGameStats: Dispatch<SetStateAction<GameStats>>;
}) {
  const applyRef = useRef(applyCloudBoard);
  applyRef.current = applyCloudBoard;

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const store = await cloudStore();
        const localSolved = readSolvedPuzzleIds();
        const localStats = readGameStats();
        const localProgress = readAllLocalProgress();
        const profile = await store.loadUserProfile(user.uid);
        if (cancelled) return;
        const nextSolved = mergeSolvedIds(localSolved, profile?.solvedPuzzleIds || []);
        const nextStats = mergeGameStats(localStats, profile?.gameStats || null);
        setSolvedPuzzleIds(nextSolved);
        setGameStats(nextStats);
        writeSolvedPuzzleIds(nextSolved);
        writeGameStats(nextStats);
        await store.ensureUserProfile(user, nextStats, nextSolved);
        if (cancelled) return;
        await store.importLocalProgressToCloud(user.uid, localProgress, nextSolved, INITIAL_PUZZLES);
        if (cancelled) return;
        const solverName = solverDisplayName(user);
        await Promise.all(
          nextSolved.map((puzzleId) => {
            const puzzle = INITIAL_PUZZLES.find((item) => item.id === puzzleId);
            if (!puzzle) return null;
            const stored = readLocalProgress(puzzleId);
            if (!stored?.isSolved || stored.timerSeconds < 0.1) return null;
            forgetCloud(
              store.recordPuzzleSolve(user.uid, puzzleId, stored.timerSeconds, stored.hintsUsed, 100, solverName),
              'record-solve'
            );
            return null;
          })
        );
      } catch (err) {
        logDesk('cloud-import', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, setSolvedPuzzleIds, setGameStats]);

  useEffect(() => {
    if (!user) return;
    if (isPracticePuzzle(currentPuzzle)) return;
    let cancelled = false;
    (async () => {
      try {
        const store = await cloudStore();
        const cloud = await store.loadCloudProgress(user.uid, currentPuzzle.id);
        if (cancelled) return;
        const local = readLocalProgress(currentPuzzle.id);
        const merged = mergeProgress(local, cloud);
        if (!merged || cancelled) return;
        const hintedSymbolIds = clipHintedSymbolIds(merged.hintedSymbolIds);
        const verifiedSymbolIds = clipHintedSymbolIds(merged.verifiedSymbolIds);
        const lockedSymbolIds = clipHintedSymbolIds([...hintedSymbolIds, ...verifiedSymbolIds]);
        const knownSolved = Boolean(merged.isSolved);
        const nextMappings = knownSolved
          ? decodedMappings(uniqueSymbols)
          : withHintedMappings(currentPuzzle, merged.mappings || {}, lockedSymbolIds);
        const next = {
          ...merged,
          mappings: nextMappings,
          hintedSymbolIds,
          verifiedSymbolIds,
          flaggedSymbolIds: knownSolved
            ? []
            : liveFlaggedIds(currentPuzzle, nextMappings, merged.flaggedSymbolIds, lockedSymbolIds),
          isSolved: knownSolved,
        };
        const progressById = editionProgress(currentPuzzle.editionNumber, allPuzzles);
        const localWallet = reconcileDailyHints(currentPuzzle.editionNumber, allPuzzles, progressById);
        const cloudWallet = await store.loadCloudDailyHints(user.uid, currentPuzzle.editionNumber);
        const localChecks = reconcileDailyChecks(currentPuzzle.editionNumber, allPuzzles, progressById);
        const cloudChecks = await store.loadCloudDailyChecks(user.uid, currentPuzzle.editionNumber);
        if (cancelled) return;
        const wallet = mergeDailyHints(localWallet, cloudWallet, currentPuzzle.editionNumber);
        const checkWallet = mergeDailyHints(localChecks, cloudChecks, currentPuzzle.editionNumber, DAILY_CHECKS);
        const stored = {
          ...next,
          hintsRemaining: wallet.remaining,
          checksRemaining: checkWallet.remaining,
        };
        writeLocalDailyHints(wallet);
        writeLocalDailyChecks(checkWallet);
        writeLocalProgress(currentPuzzle.id, stored);
        forgetCloud(store.saveCloudProgress(user.uid, currentPuzzle.id, stored), 'save-progress');
        forgetCloud(store.saveCloudDailyHints(user.uid, wallet), 'save-hints');
        forgetCloud(store.saveCloudDailyChecks(user.uid, checkWallet), 'save-checks');
        applyRef.current(
          gateCloudHydrate(
            boardDirtyRef.current,
            {
              mappings: next.mappings || {},
              timerSeconds: next.timerSeconds || 0,
              hintsUsed: next.hintsUsed || 0,
              hintsRemaining: wallet.remaining,
              hintedSymbolIds,
              checksUsed: next.checksUsed || 0,
              checksRemaining: checkWallet.remaining,
              verifiedSymbolIds,
              flaggedSymbolIds: next.flaggedSymbolIds,
              isSolved: next.isSolved || false,
              selectedSymbolId: next.isSolved ? undefined : clipSelectedSymbolId(next.selectedSymbolId),
            },
            { mappings: progress.mappings, timerSeconds: progress.timerSeconds }
          )
        );
        if (next.isSolved) {
          forgetCloud(
            store.recordPuzzleSolve(user.uid, currentPuzzle.id, next.timerSeconds, next.hintsUsed, 100, solverDisplayName(user)),
            'record-solve'
          );
          startedPuzzlesRef.current.add(currentPuzzle.id);
        }
      } catch (err) {
        logDesk('cloud-progress', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, currentPuzzle, uniqueSymbols, solvedPuzzleIds, allPuzzles, startedPuzzlesRef]);

  useEffect(() => {
    if (!user || uniqueSymbols.length === 0 || progressReadyId !== currentPuzzle.id) return;
    if (isPracticePuzzle(currentPuzzle)) return;
    const handle = window.setTimeout(() => {
      void cloudStore().then((store) =>
        forgetCloud(store.saveCloudProgress(user.uid, currentPuzzle.id, progress), 'save-progress')
      );
    }, 1500);
    return () => window.clearTimeout(handle);
  }, [
    user,
    progressReadyId,
    currentPuzzle,
    progress.mappings,
    progress.hintsUsed,
    progress.hintsRemaining,
    progress.hintedSymbolIds,
    progress.checksUsed,
    progress.checksRemaining,
    progress.verifiedSymbolIds,
    progress.flaggedSymbolIds,
    progress.selectedSymbolId,
    progress.isSolved,
    // Omit timerSeconds: a 100ms clock used to reset this debounce forever while playing.
    uniqueSymbols.length,
  ]);

  useEffect(() => {
    if (!user || progress.isSolved || Object.keys(progress.mappings).length === 0) return;
    if (progressReadyId !== currentPuzzle.id) return;
    if (isPracticePuzzle(currentPuzzle)) return;
    if (startedPuzzlesRef.current.has(currentPuzzle.id)) return;
    startedPuzzlesRef.current.add(currentPuzzle.id);
    void cloudStore().then((store) =>
      store.recordPuzzleStart(user.uid, currentPuzzle.id).catch((err) => {
        startedPuzzlesRef.current.delete(currentPuzzle.id);
        logDesk('puzzle-start', err);
      })
    );
  }, [user, progress.mappings, progress.isSolved, currentPuzzle, progressReadyId, startedPuzzlesRef]);
}
