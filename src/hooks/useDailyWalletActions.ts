import { useCallback } from 'react';
import type { User } from 'firebase/auth';
import type { PuzzleData, PuzzleProgress, SymbolMapping } from '../types';
import {
  DAILY_CHECKS,
  DAILY_HINTS,
  clipDailyWallet,
  clipHintedSymbolIds,
  persistProgress,
  writeLocalDailyChecks,
  writeLocalDailyHints,
} from '../utils/localStore';
import { DeskError, STORAGE_JAMMED, forgetCloud, reportDesk } from '../utils/deskError';

type WalletKind = 'hint' | 'check';

export function useDailyWalletActions({
  currentPuzzle,
  uniqueSymbols,
  mappings,
  selectedSymbolId,
  hintedSymbolIds,
  verifiedSymbolIds,
  flaggedSymbolIds,
  hintsUsed,
  hintsRemaining,
  checksUsed,
  checksRemaining,
  boardReady,
  isSolved,
  user,
  boardProgress,
  onStorageFail,
  setHintedSymbolIds,
  setHintsUsed,
  setHintsRemaining,
  setVerifiedSymbolIds,
  setChecksUsed,
  setChecksRemaining,
  setFlaggedSymbolIds,
  setMappings,
}: {
  currentPuzzle: PuzzleData;
  uniqueSymbols: { symbolId: string; targetLetter: string }[];
  mappings: SymbolMapping;
  selectedSymbolId: string | null;
  hintedSymbolIds: string[];
  verifiedSymbolIds: string[];
  flaggedSymbolIds: string[];
  hintsUsed: number;
  hintsRemaining: number;
  checksUsed: number;
  checksRemaining: number;
  boardReady: boolean;
  isSolved: boolean;
  user: User | null;
  boardProgress: (overrides?: Partial<PuzzleProgress>) => PuzzleProgress;
  onStorageFail: () => void;
  setHintedSymbolIds: (ids: string[]) => void;
  setHintsUsed: (n: number) => void;
  setHintsRemaining: (n: number) => void;
  setVerifiedSymbolIds: (ids: string[]) => void;
  setChecksUsed: (n: number) => void;
  setChecksRemaining: (n: number) => void;
  setFlaggedSymbolIds: (ids: string[]) => void;
  setMappings: (next: SymbolMapping) => void;
}) {
  const fileProgress = useCallback(
    (progress: PuzzleProgress, walletKind: WalletKind, wallet: ReturnType<typeof clipDailyWallet>) => {
      if (!persistProgress(currentPuzzle.id, progress)) {
        reportDesk(
          new DeskError({ layer: 'storage', code: 'storage/quota', userMessage: STORAGE_JAMMED }),
          'storage'
        );
        onStorageFail();
      }
      if (walletKind === 'hint') writeLocalDailyHints(wallet);
      else writeLocalDailyChecks(wallet);
    },
    [currentPuzzle.id, onStorageFail]
  );

  const handleUseHint = useCallback(() => {
    if (hintsRemaining <= 0 || !boardReady || isSolved || !selectedSymbolId) return;
    const target = uniqueSymbols.find((s) => s.symbolId === selectedSymbolId);
    if (!target || mappings[target.symbolId] === target.targetLetter) return;
    if (hintedSymbolIds.includes(target.symbolId) || verifiedSymbolIds.includes(target.symbolId)) return;
    const nextHinted = clipHintedSymbolIds([...hintedSymbolIds, target.symbolId]);
    const nextUsed = Math.max(hintsUsed + 1, nextHinted.length);
    const nextRemaining = Math.max(0, hintsRemaining - 1);
    const nextMappings = { ...mappings, [target.symbolId]: target.targetLetter };
    const nextFlagged = flaggedSymbolIds.filter((id) => id !== target.symbolId);
    const progress = boardProgress({
      mappings: nextMappings,
      hintsUsed: nextUsed,
      hintsRemaining: nextRemaining,
      hintedSymbolIds: nextHinted,
      flaggedSymbolIds: nextFlagged,
    });
    const wallet = clipDailyWallet(currentPuzzle.editionDate, DAILY_HINTS - nextRemaining);
    setHintedSymbolIds(nextHinted);
    setHintsUsed(nextUsed);
    setHintsRemaining(nextRemaining);
    setFlaggedSymbolIds(nextFlagged);
    setMappings(nextMappings);
    fileProgress(progress, 'hint', wallet);
    if (user) {
      void import('../utils/firebaseStore').then((store) => {
        forgetCloud(store.saveCloudProgress(user.uid, currentPuzzle.id, progress), 'save-progress');
        forgetCloud(store.saveCloudDailyHints(user.uid, wallet), 'save-hints');
      });
    }
  }, [
    hintsRemaining,
    boardReady,
    isSolved,
    selectedSymbolId,
    uniqueSymbols,
    mappings,
    hintedSymbolIds,
    verifiedSymbolIds,
    flaggedSymbolIds,
    hintsUsed,
    boardProgress,
    currentPuzzle,
    user,
    fileProgress,
    setHintedSymbolIds,
    setHintsUsed,
    setHintsRemaining,
    setFlaggedSymbolIds,
    setMappings,
  ]);

  const handleCheckLetter = useCallback(() => {
    if (checksRemaining <= 0 || !boardReady || isSolved || !selectedSymbolId) return;
    const target = uniqueSymbols.find((s) => s.symbolId === selectedSymbolId);
    if (!target) return;
    const mapped = mappings[target.symbolId];
    if (!mapped) return;
    if (hintedSymbolIds.includes(target.symbolId) || verifiedSymbolIds.includes(target.symbolId)) return;
    if (flaggedSymbolIds.includes(target.symbolId)) return;
    const correct = mapped === target.targetLetter;
    const nextVerified = correct
      ? clipHintedSymbolIds([...verifiedSymbolIds, target.symbolId])
      : verifiedSymbolIds;
    const nextFlagged = correct
      ? flaggedSymbolIds.filter((id) => id !== target.symbolId)
      : clipHintedSymbolIds([...flaggedSymbolIds, target.symbolId]);
    const nextUsed = Math.max(checksUsed + 1, nextVerified.length);
    const nextRemaining = Math.max(0, checksRemaining - 1);
    const progress = boardProgress({
      checksUsed: nextUsed,
      checksRemaining: nextRemaining,
      verifiedSymbolIds: nextVerified,
      flaggedSymbolIds: nextFlagged,
    });
    const wallet = clipDailyWallet(currentPuzzle.editionDate, DAILY_CHECKS - nextRemaining);
    setVerifiedSymbolIds(nextVerified);
    setFlaggedSymbolIds(nextFlagged);
    setChecksUsed(nextUsed);
    setChecksRemaining(nextRemaining);
    fileProgress(progress, 'check', wallet);
    if (user) {
      void import('../utils/firebaseStore').then((store) => {
        forgetCloud(store.saveCloudProgress(user.uid, currentPuzzle.id, progress), 'save-progress');
        forgetCloud(store.saveCloudDailyChecks(user.uid, wallet), 'save-checks');
      });
    }
  }, [
    checksRemaining,
    boardReady,
    isSolved,
    selectedSymbolId,
    uniqueSymbols,
    mappings,
    hintedSymbolIds,
    verifiedSymbolIds,
    flaggedSymbolIds,
    checksUsed,
    boardProgress,
    currentPuzzle,
    user,
    fileProgress,
    setVerifiedSymbolIds,
    setFlaggedSymbolIds,
    setChecksUsed,
    setChecksRemaining,
  ]);

  return { handleUseHint, handleCheckLetter };
}
