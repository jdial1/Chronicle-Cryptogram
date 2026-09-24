import type { PuzzleProgress } from '../types';
import { readLocalProgress } from './localStore';

/**
 * The desk's books, kept on craft rather than the stopwatch (docs/SOUL.md, "Print
 * the Help Taken"). A page is clean when it was solved with no hint and no check.
 * Android's `DeskLedger` keeps the same books.
 */
export function isCleanSolve(progress: PuzzleProgress | null): boolean {
  return Boolean(progress?.isSolved) && progress!.hintsUsed === 0 && (progress!.checksUsed ?? 0) === 0;
}

export interface DeskLedger {
  decoded: number;
  clean: number;
  hintsTaken: number;
  checksTaken: number;
}

export function deskLedger(
  solvedPuzzleIds: string[],
  read: (puzzleId: string) => PuzzleProgress | null = readLocalProgress
): DeskLedger {
  const ledger: DeskLedger = { decoded: 0, clean: 0, hintsTaken: 0, checksTaken: 0 };
  for (const id of new Set(solvedPuzzleIds)) {
    const progress = read(id);
    ledger.decoded += 1;
    if (isCleanSolve(progress)) ledger.clean += 1;
    ledger.hintsTaken += progress?.hintsUsed ?? 0;
    ledger.checksTaken += progress?.checksUsed ?? 0;
  }
  return ledger;
}
