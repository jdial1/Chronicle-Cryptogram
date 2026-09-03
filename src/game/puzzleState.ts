import { PuzzleData, PuzzleProgress, SymbolMapping } from '../types';
import { INITIAL_PUZZLES } from '../data/puzzles';
import {
  clipHintedSymbolIds,
  clipSelectedSymbolId,
  readLocalProgress,
  readSolvedPuzzleIds,
  reconcileDailyChecks,
  reconcileDailyHints,
  writeLocalDailyChecks,
  writeLocalDailyHints,
} from '../utils/localStore';
import { isHardPuzzle, isMorningEdition, isPrimerPuzzle, currentMorningPuzzle } from '../utils/edition';
import { buildCipherAlphabet, parseCryptogramText } from '../utils/cipherEngine';

export function getInitialPuzzle(): PuzzleData {
  const solved = readSolvedPuzzleIds();
  const primer = INITIAL_PUZZLES.find((puzzle) => isPrimerPuzzle(puzzle) && isMorningEdition(puzzle));
  if (primer && !solved.includes(primer.id)) return primer;
  return currentMorningPuzzle(INITIAL_PUZZLES, solved) || INITIAL_PUZZLES[0];
}

export function withHintedMappings(
  puzzle: PuzzleData,
  mappings: SymbolMapping,
  hintedSymbolIds: string[]
): SymbolMapping {
  const decoded = decodedMappingsFromPuzzle(puzzle);
  const next = { ...mappings };
  for (const id of hintedSymbolIds) {
    if (decoded[id]) next[id] = decoded[id];
  }
  return next;
}

export function liveFlaggedIds(
  puzzle: PuzzleData,
  mappings: SymbolMapping,
  flaggedSymbolIds: string[],
  lockedSymbolIds: string[]
) {
  const decoded = decodedMappingsFromPuzzle(puzzle);
  return clipHintedSymbolIds(flaggedSymbolIds).filter((id) => {
    if (lockedSymbolIds.includes(id)) return false;
    const mapped = mappings[id];
    return Boolean(mapped && decoded[id] && mapped !== decoded[id]);
  });
}

export function decodedMappings(symbols: { symbolId: string; targetLetter: string }[]): SymbolMapping {
  const next: SymbolMapping = {};
  for (const symbol of symbols) {
    next[symbol.symbolId] = symbol.targetLetter;
  }
  return next;
}

export function cipherForPuzzle(puzzle: PuzzleData) {
  const alphabet = buildCipherAlphabet(puzzle.id + puzzle.originalText, isHardPuzzle(puzzle));
  const words = parseCryptogramText(puzzle.originalText, alphabet);
  const decoded: SymbolMapping = {};
  for (const word of words) {
    for (const symbol of word.symbols) {
      if (!symbol.isPunctuation) decoded[symbol.symbolId] = symbol.targetLetter;
    }
  }
  return { alphabet, words, decoded };
}

export function decodedMappingsFromPuzzle(puzzle: PuzzleData): SymbolMapping {
  return cipherForPuzzle(puzzle).decoded;
}

export function gateCloudHydrate<T extends { mappings: SymbolMapping; timerSeconds: number }>(
  dirty: boolean,
  incoming: T,
  current: { mappings: SymbolMapping; timerSeconds: number }
): T {
  if (!dirty) return incoming;
  return { ...incoming, mappings: current.mappings, timerSeconds: current.timerSeconds };
}

export function puzzleWasSolved(puzzleId: string, progress: PuzzleProgress | null) {
  return Boolean(progress?.isSolved || readSolvedPuzzleIds().includes(puzzleId));
}

export function editionProgress(
  edition: number,
  puzzles: { id: string; editionNumber: number }[]
) {
  const out: Record<string, PuzzleProgress> = {};
  for (const puzzle of puzzles) {
    if (puzzle.editionNumber !== edition) continue;
    const progress = readLocalProgress(puzzle.id);
    if (progress) out[puzzle.id] = progress;
  }
  return out;
}

export function loadPuzzleState(puzzle: PuzzleData, puzzles: PuzzleData[] = INITIAL_PUZZLES) {
  const progress = readLocalProgress(puzzle.id);
  const hintedSymbolIds = clipHintedSymbolIds(progress?.hintedSymbolIds);
  const verifiedSymbolIds = clipHintedSymbolIds(progress?.verifiedSymbolIds);
  const lockedSymbolIds = clipHintedSymbolIds([...hintedSymbolIds, ...verifiedSymbolIds]);
  const hintsUsed = Math.max(progress?.hintsUsed || 0, hintedSymbolIds.length);
  const checksUsed = Math.max(progress?.checksUsed || 0, verifiedSymbolIds.length);
  const progressById = editionProgress(puzzle.editionNumber, puzzles);
  const wallet = reconcileDailyHints(puzzle.editionNumber, puzzles, progressById);
  const checkWallet = reconcileDailyChecks(puzzle.editionNumber, puzzles, progressById);
  writeLocalDailyHints(wallet);
  writeLocalDailyChecks(checkWallet);
  const mappings = withHintedMappings(puzzle, progress?.mappings || {}, lockedSymbolIds);
  const flaggedSymbolIds = liveFlaggedIds(
    puzzle,
    mappings,
    progress?.flaggedSymbolIds || [],
    lockedSymbolIds
  );
  if (puzzleWasSolved(puzzle.id, progress)) {
    return {
      mappings: decodedMappingsFromPuzzle(puzzle),
      timerSeconds: progress?.timerSeconds || 0,
      hintsUsed,
      hintsRemaining: wallet.remaining,
      hintedSymbolIds,
      checksUsed,
      checksRemaining: checkWallet.remaining,
      verifiedSymbolIds,
      flaggedSymbolIds: [] as string[],
      selectedSymbolId: null as string | null,
      isSolved: true,
    };
  }
  if (progress) {
    return {
      mappings,
      timerSeconds: progress.timerSeconds || 0,
      hintsUsed,
      hintsRemaining: wallet.remaining,
      hintedSymbolIds,
      checksUsed,
      checksRemaining: checkWallet.remaining,
      verifiedSymbolIds,
      flaggedSymbolIds,
      selectedSymbolId: clipSelectedSymbolId(progress.selectedSymbolId),
      isSolved: false,
    };
  }
  return {
    mappings: {} as SymbolMapping,
    timerSeconds: 0,
    hintsUsed: 0,
    hintsRemaining: wallet.remaining,
    hintedSymbolIds,
    checksUsed: 0,
    checksRemaining: checkWallet.remaining,
    verifiedSymbolIds,
    flaggedSymbolIds,
    selectedSymbolId: null as string | null,
    isSolved: false,
  };
}
