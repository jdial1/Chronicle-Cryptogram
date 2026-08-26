import { GameStats, PuzzleProgress, DailyHintWallet } from '../types';
import { STORAGE_KEYS } from './storageKeys';
import { storageGet, storageGetJSON, storageKeysWithPrefix, storageSetJSON } from './safeStorage';

export const DEFAULT_GAME_STATS: GameStats = {
  puzzlesPlayed: 0,
  puzzlesSolved: 0,
  currentStreak: 1,
  maxStreak: 1,
  fastestTime: null,
  totalTimePlayed: 0,
  averageAccuracy: 100,
  leaderboardSubmissions: 0,
};

export const DAILY_HINTS = 3;
export const DAILY_CHECKS = 3;

export function clipHintedSymbolIds(ids: unknown): string[] {
  if (!Array.isArray(ids)) return [];
  const out: string[] = [];
  for (const id of ids) {
    if (typeof id !== 'string' || !id || id.length > 80) continue;
    if (!out.includes(id)) out.push(id);
    if (out.length >= 26) break;
  }
  return out;
}

export function clipSelectedSymbolId(id: unknown): string | null {
  return clipHintedSymbolIds([id])[0] || null;
}

export function mergeProgress(local: PuzzleProgress | null, cloud: PuzzleProgress | null): PuzzleProgress | null {
  if (!cloud) return local;
  if (!local) return cloud;
  const hintedSymbolIds = clipHintedSymbolIds([
    ...(cloud.hintedSymbolIds || []),
    ...(local.hintedSymbolIds || []),
  ]);
  const verifiedSymbolIds = clipHintedSymbolIds([
    ...(cloud.verifiedSymbolIds || []),
    ...(local.verifiedSymbolIds || []),
  ]);
  const flaggedSymbolIds = clipHintedSymbolIds([
    ...(cloud.flaggedSymbolIds || []),
    ...(local.flaggedSymbolIds || []),
  ]).filter((id) => !hintedSymbolIds.includes(id) && !verifiedSymbolIds.includes(id));
  const hintsUsed = Math.max(local.hintsUsed || 0, cloud.hintsUsed || 0, hintedSymbolIds.length);
  const checksUsed = Math.max(local.checksUsed || 0, cloud.checksUsed || 0, verifiedSymbolIds.length);
  const hintsRemaining = Math.min(
    local.hintsRemaining ?? DAILY_HINTS,
    cloud.hintsRemaining ?? DAILY_HINTS,
    Math.max(0, DAILY_HINTS - hintsUsed)
  );
  const checksRemaining = Math.min(
    local.checksRemaining ?? DAILY_CHECKS,
    cloud.checksRemaining ?? DAILY_CHECKS,
    Math.max(0, DAILY_CHECKS - checksUsed)
  );
  if (local.isSolved && cloud.isSolved) {
    const winner = local.timerSeconds <= cloud.timerSeconds ? local : cloud;
    return {
      ...winner,
      hintedSymbolIds,
      verifiedSymbolIds,
      flaggedSymbolIds,
      hintsUsed,
      checksUsed,
      hintsRemaining,
      checksRemaining,
    };
  }
  if (cloud.isSolved) {
    return {
      ...cloud,
      hintedSymbolIds,
      verifiedSymbolIds,
      flaggedSymbolIds,
      hintsUsed: Math.max(cloud.hintsUsed || 0, hintedSymbolIds.length),
      checksUsed: Math.max(cloud.checksUsed || 0, verifiedSymbolIds.length),
    };
  }
  if (local.isSolved) {
    return {
      ...local,
      hintedSymbolIds,
      verifiedSymbolIds,
      flaggedSymbolIds,
      hintsUsed: Math.max(local.hintsUsed || 0, hintedSymbolIds.length),
      checksUsed: Math.max(local.checksUsed || 0, verifiedSymbolIds.length),
    };
  }
  const localStamp = Number(local.updatedAt) || 0;
  const cloudStamp = Number(cloud.updatedAt) || 0;
  if (localStamp || cloudStamp) {
    const winner = localStamp >= cloudStamp ? local : cloud;
    return progressSnapshot({
      ...winner,
      hintedSymbolIds,
      verifiedSymbolIds,
      flaggedSymbolIds,
      hintsUsed,
      checksUsed,
      hintsRemaining,
      checksRemaining,
      updatedAt: Math.max(localStamp, cloudStamp),
    });
  }
  return progressSnapshot({
    mappings: { ...(cloud.mappings || {}), ...(local.mappings || {}) },
    timerSeconds: Math.max(local.timerSeconds || 0, cloud.timerSeconds || 0),
    hintsUsed,
    hintsRemaining,
    hintedSymbolIds,
    checksUsed,
    checksRemaining,
    verifiedSymbolIds,
    flaggedSymbolIds,
    selectedSymbolId: clipSelectedSymbolId(local.selectedSymbolId || cloud.selectedSymbolId),
    isSolved: false,
  });
}

export function mergeGameStats(local: GameStats, cloud: GameStats | null): GameStats {
  if (!cloud) return local;
  if (local.puzzlesSolved > cloud.puzzlesSolved) return local;
  return {
    ...cloud,
    maxStreak: Math.max(local.maxStreak, cloud.maxStreak),
    fastestTime:
      local.fastestTime == null
        ? cloud.fastestTime
        : cloud.fastestTime == null
          ? local.fastestTime
          : Math.min(local.fastestTime, cloud.fastestTime),
    totalTimePlayed: Math.max(local.totalTimePlayed, cloud.totalTimePlayed),
  };
}

export function mergeSolvedIds(local: string[], cloud: string[]) {
  return Array.from(new Set([...local, ...cloud]));
}

export function isEditionDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function clipDailyWallet(editionDate: string, used: number, cap = DAILY_HINTS): DailyHintWallet {
  const clipped = Math.min(cap, Math.max(0, Math.floor(Number(used)) || 0));
  return { editionDate, used: clipped, remaining: cap - clipped };
}

export function mergeDailyHints(
  local: DailyHintWallet | null,
  cloud: DailyHintWallet | null,
  editionDate: string,
  cap = DAILY_HINTS
): DailyHintWallet {
  return clipDailyWallet(editionDate, Math.max(local?.used ?? 0, cloud?.used ?? 0), cap);
}

export function normalizeProgress(raw: unknown): PuzzleProgress | null {
  try {
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!data || typeof data !== 'object') return null;
    const source = (data as PuzzleProgress).mappings;
    const mappings: PuzzleProgress['mappings'] = {};
    if (source && typeof source === 'object') {
      for (const key of Object.keys(source).slice(0, 80)) {
        const letter = source[key];
        if (typeof letter === 'string' && letter) mappings[key] = letter;
      }
    }
    const hintedSymbolIds = clipHintedSymbolIds((data as PuzzleProgress).hintedSymbolIds);
    const verifiedSymbolIds = clipHintedSymbolIds((data as PuzzleProgress).verifiedSymbolIds);
    const flaggedSymbolIds = clipHintedSymbolIds((data as PuzzleProgress).flaggedSymbolIds).filter(
      (id) => !hintedSymbolIds.includes(id) && !verifiedSymbolIds.includes(id)
    );
    const timerSeconds = Number((data as PuzzleProgress).timerSeconds) || 0;
    const hintsUsed = Math.max(Number((data as PuzzleProgress).hintsUsed) || 0, hintedSymbolIds.length);
    const checksUsed = Math.max(Number((data as PuzzleProgress).checksUsed) || 0, verifiedSymbolIds.length);
    const hintsRemaining =
      (data as PuzzleProgress).hintsRemaining == null
        ? Math.max(0, DAILY_HINTS - hintsUsed)
        : Number((data as PuzzleProgress).hintsRemaining);
    const checksRemaining =
      (data as PuzzleProgress).checksRemaining == null
        ? Math.max(0, DAILY_CHECKS - checksUsed)
        : Number((data as PuzzleProgress).checksRemaining);
    return {
      mappings,
      timerSeconds: Math.min(86400, Math.max(0, timerSeconds)),
      hintsUsed: Math.min(20, Math.max(0, hintsUsed)),
      hintsRemaining: Math.min(DAILY_HINTS, Math.max(0, hintsRemaining)),
      hintedSymbolIds,
      checksUsed: Math.min(20, Math.max(0, checksUsed)),
      checksRemaining: Math.min(DAILY_CHECKS, Math.max(0, checksRemaining)),
      verifiedSymbolIds,
      flaggedSymbolIds,
      selectedSymbolId: clipSelectedSymbolId((data as PuzzleProgress).selectedSymbolId),
      isSolved: Boolean((data as PuzzleProgress).isSolved),
      updatedAt: Number((data as PuzzleProgress).updatedAt) || undefined,
    };
  } catch {
    return null;
  }
}

export function normalizeDailyHints(
  raw: unknown,
  editionDate: string,
  cap = DAILY_HINTS
): DailyHintWallet | null {
  if (!isEditionDate(editionDate)) return null;
  try {
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!data || typeof data !== 'object') return null;
    const used = Number((data as DailyHintWallet).used);
    const remaining = Number((data as DailyHintWallet).remaining);
    const fromParts =
      Number.isFinite(used) ? used : Number.isFinite(remaining) ? cap - remaining : 0;
    return clipDailyWallet(editionDate, fromParts, cap);
  } catch {
    return null;
  }
}

export function readLocalProgress(puzzleId: string): PuzzleProgress | null {
  return normalizeProgress(storageGet(`${STORAGE_KEYS.progress}${puzzleId}`));
}

function clipMappings(mappings: PuzzleProgress['mappings']) {
  const next: PuzzleProgress['mappings'] = {};
  for (const key of Object.keys(mappings || {}).slice(0, 80)) {
    const letter = mappings[key];
    if (typeof letter === 'string' && letter) next[key] = letter;
  }
  return next;
}

export function progressFields(progress: PuzzleProgress): PuzzleProgress {
  const updatedAt = Number(progress.updatedAt) || undefined;
  return {
    mappings: clipMappings(progress.mappings),
    timerSeconds: Math.min(86400, Math.max(0, Number(progress.timerSeconds) || 0)),
    hintsUsed: Math.min(20, Math.max(0, Number(progress.hintsUsed) || 0)),
    hintsRemaining: Math.min(DAILY_HINTS, Math.max(0, Number(progress.hintsRemaining) || 0)),
    hintedSymbolIds: clipHintedSymbolIds(progress.hintedSymbolIds),
    checksUsed: Math.min(20, Math.max(0, Number(progress.checksUsed) || 0)),
    checksRemaining: Math.min(DAILY_CHECKS, Math.max(0, Number(progress.checksRemaining) || 0)),
    verifiedSymbolIds: clipHintedSymbolIds(progress.verifiedSymbolIds),
    flaggedSymbolIds: clipHintedSymbolIds(progress.flaggedSymbolIds),
    selectedSymbolId: clipSelectedSymbolId(progress.selectedSymbolId),
    isSolved: Boolean(progress.isSolved),
    ...(updatedAt ? { updatedAt } : {}),
  };
}

export function progressSnapshot(progress: PuzzleProgress, stamped = false): PuzzleProgress {
  return progressFields({
    ...progress,
    updatedAt: stamped ? Date.now() : Number(progress.updatedAt) || Date.now(),
  });
}

export function persistProgress(puzzleId: string, progress: PuzzleProgress): boolean {
  return storageSetJSON(`${STORAGE_KEYS.progress}${puzzleId}`, progressSnapshot(progress, true));
}

export function writeLocalProgress(puzzleId: string, progress: PuzzleProgress): boolean {
  return persistProgress(puzzleId, progress);
}

export type DailyWalletKind = 'hints' | 'checks';

function walletCap(kind: DailyWalletKind) {
  return kind === 'hints' ? DAILY_HINTS : DAILY_CHECKS;
}

function walletPrefix(kind: DailyWalletKind) {
  return kind === 'hints' ? STORAGE_KEYS.dailyHints : STORAGE_KEYS.dailyChecks;
}

export function readLocalDailyWallet(kind: DailyWalletKind, editionDate: string): DailyHintWallet | null {
  return normalizeDailyHints(storageGet(`${walletPrefix(kind)}${editionDate}`), editionDate, walletCap(kind));
}

export function writeLocalDailyWallet(kind: DailyWalletKind, wallet: DailyHintWallet): boolean {
  if (!isEditionDate(wallet.editionDate)) return false;
  const next = clipDailyWallet(wallet.editionDate, wallet.used, walletCap(kind));
  return storageSetJSON(`${walletPrefix(kind)}${next.editionDate}`, next);
}

export function readLocalDailyHints(editionDate: string): DailyHintWallet | null {
  return readLocalDailyWallet('hints', editionDate);
}

export function writeLocalDailyHints(wallet: DailyHintWallet): boolean {
  return writeLocalDailyWallet('hints', wallet);
}

export function readLocalDailyChecks(editionDate: string): DailyHintWallet | null {
  return readLocalDailyWallet('checks', editionDate);
}

export function writeLocalDailyChecks(wallet: DailyHintWallet): boolean {
  return writeLocalDailyWallet('checks', wallet);
}

function readAllLocalDailyWallets(prefix: string, cap: number): Record<string, DailyHintWallet> {
  const out: Record<string, DailyHintWallet> = {};
  for (const key of storageKeysWithPrefix(prefix)) {
    const editionDate = key.slice(prefix.length);
    const parsed = normalizeDailyHints(storageGet(key), editionDate, cap);
    if (parsed) out[editionDate] = parsed;
  }
  return out;
}

export function readAllLocalDailyHints(): Record<string, DailyHintWallet> {
  return readAllLocalDailyWallets(STORAGE_KEYS.dailyHints, DAILY_HINTS);
}

export function readAllLocalDailyChecks(): Record<string, DailyHintWallet> {
  return readAllLocalDailyWallets(STORAGE_KEYS.dailyChecks, DAILY_CHECKS);
}

function usedFromProgress(
  editionDate: string,
  puzzles: { id: string; editionDate: string }[],
  progressById: Record<string, PuzzleProgress>,
  used: (progress: PuzzleProgress) => number
) {
  return puzzles.reduce((sum, puzzle) => {
    if (puzzle.editionDate !== editionDate) return sum;
    const progress = progressById[puzzle.id];
    if (!progress) return sum;
    return sum + used(progress);
  }, 0);
}

export function usedHintsFromProgress(
  editionDate: string,
  puzzles: { id: string; editionDate: string }[],
  progressById: Record<string, PuzzleProgress>
) {
  return usedFromProgress(editionDate, puzzles, progressById, (progress) =>
    Math.max(progress.hintsUsed || 0, (progress.hintedSymbolIds || []).length)
  );
}

export function usedChecksFromProgress(
  editionDate: string,
  puzzles: { id: string; editionDate: string }[],
  progressById: Record<string, PuzzleProgress>
) {
  return usedFromProgress(editionDate, puzzles, progressById, (progress) =>
    Math.max(progress.checksUsed || 0, (progress.verifiedSymbolIds || []).length)
  );
}

export function reconcileDailyHints(
  editionDate: string,
  puzzles: { id: string; editionDate: string }[],
  progressById: Record<string, PuzzleProgress>
): DailyHintWallet {
  const local = readLocalDailyHints(editionDate);
  return clipDailyWallet(
    editionDate,
    Math.max(local?.used ?? 0, usedHintsFromProgress(editionDate, puzzles, progressById)),
    DAILY_HINTS
  );
}

export function reconcileDailyChecks(
  editionDate: string,
  puzzles: { id: string; editionDate: string }[],
  progressById: Record<string, PuzzleProgress>
): DailyHintWallet {
  const local = readLocalDailyChecks(editionDate);
  return clipDailyWallet(
    editionDate,
    Math.max(local?.used ?? 0, usedChecksFromProgress(editionDate, puzzles, progressById)),
    DAILY_CHECKS
  );
}

export function readAllLocalProgress(): Record<string, PuzzleProgress> {
  const out: Record<string, PuzzleProgress> = {};
  for (const key of storageKeysWithPrefix(STORAGE_KEYS.progress)) {
    const puzzleId = key.slice(STORAGE_KEYS.progress.length);
    if (!puzzleId) continue;
    const parsed = normalizeProgress(storageGet(key));
    if (parsed) out[puzzleId] = parsed;
  }
  return out;
}

export function readSolvedPuzzleIds(): string[] {
  const saved = storageGetJSON<unknown>(STORAGE_KEYS.solvedIds);
  return Array.isArray(saved) ? saved.filter((id): id is string => typeof id === 'string') : [];
}

export function writeSolvedPuzzleIds(ids: string[]) {
  storageSetJSON(STORAGE_KEYS.solvedIds, Array.from(new Set(ids)));
}

export function readGameStats(): GameStats {
  const saved = storageGetJSON<GameStats>(STORAGE_KEYS.stats);
  if (!saved || typeof saved !== 'object') return DEFAULT_GAME_STATS;
  return mergeGameStats(DEFAULT_GAME_STATS, saved);
}

export function writeGameStats(stats: GameStats) {
  storageSetJSON(STORAGE_KEYS.stats, stats);
}
