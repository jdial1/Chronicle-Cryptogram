import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from './firebase';
import {
  GameStats,
  LeaderboardEntry,
  PuzzleLiveStats,
  PuzzleProgress,
  DailyHintWallet,
} from '../types';

const EMPTY_STATS: Omit<PuzzleLiveStats, 'puzzleId'> = {
  startedCount: 0,
  completeCount: 0,
  totalTimeSeconds: 0,
  fastestTime: null,
  fastestSolverName: null,
};

const DEFAULT_GAME_STATS: GameStats = {
  puzzlesPlayed: 0,
  puzzlesSolved: 0,
  currentStreak: 1,
  maxStreak: 1,
  fastestTime: null,
  totalTimePlayed: 0,
  averageAccuracy: 100,
  leaderboardSubmissions: 0,
};

function startId(uid: string, puzzleId: string) {
  return `${uid}_${puzzleId}`;
}

function clip(value: string, max: number) {
  return value.trim().slice(0, max);
}

export function emptyPuzzleStats(puzzleId: string): PuzzleLiveStats {
  return { puzzleId, ...EMPTY_STATS };
}

export function derivePublicStats(stats: PuzzleLiveStats | null) {
  const startedCount = stats?.startedCount ?? 0;
  const completeCount = stats?.completeCount ?? 0;
  return {
    quickestSolveTime: stats?.fastestTime ?? 0,
    totalSolvers: completeCount,
    solveRatePercentage: startedCount > 0 ? Math.round((completeCount / startedCount) * 1000) / 10 : 0,
    averageTimeSeconds: completeCount > 0 ? stats!.totalTimeSeconds / completeCount : 0,
    fastestSolverName: stats?.fastestSolverName ?? null,
  };
}

export const DAILY_HINTS = 3;
export const DAILY_CHECKS = 3;
const PROGRESS_KEY = 'cryptogram_progress_';
const DAILY_HINTS_KEY = 'cryptogram_daily_hints_';
const DAILY_CHECKS_KEY = 'cryptogram_daily_checks_';

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
  return {
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
  };
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

function isEditionDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function clipDailyWallet(editionDate: string, used: number): DailyHintWallet {
  const clipped = Math.min(DAILY_HINTS, Math.max(0, Math.floor(Number(used)) || 0));
  return { editionDate, used: clipped, remaining: DAILY_HINTS - clipped };
}

export function mergeDailyHints(
  local: DailyHintWallet | null,
  cloud: DailyHintWallet | null,
  editionDate: string
): DailyHintWallet {
  return clipDailyWallet(editionDate, Math.max(local?.used ?? 0, cloud?.used ?? 0));
}

function normalizeProgress(raw: unknown): PuzzleProgress | null {
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
  };
  } catch {
    return null;
  }
}

function normalizeDailyHints(raw: unknown, editionDate: string): DailyHintWallet | null {
  if (!isEditionDate(editionDate)) return null;
  try {
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!data || typeof data !== 'object') return null;
    const used = Number((data as DailyHintWallet).used);
    const remaining = Number((data as DailyHintWallet).remaining);
    const fromParts =
      Number.isFinite(used) ? used : Number.isFinite(remaining) ? DAILY_HINTS - remaining : 0;
    return clipDailyWallet(editionDate, fromParts);
  } catch {
    return null;
  }
}

export function readLocalProgress(puzzleId: string): PuzzleProgress | null {
  try {
    return normalizeProgress(localStorage.getItem(`${PROGRESS_KEY}${puzzleId}`));
  } catch {
    return null;
  }
}

function clipMappings(mappings: PuzzleProgress['mappings']) {
  const next: PuzzleProgress['mappings'] = {};
  for (const key of Object.keys(mappings || {}).slice(0, 80)) {
    const letter = mappings[key];
    if (typeof letter === 'string' && letter) next[key] = letter;
  }
  return next;
}

function progressFields(progress: PuzzleProgress) {
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
  };
}

export function writeLocalProgress(puzzleId: string, progress: PuzzleProgress) {
  localStorage.setItem(
    `${PROGRESS_KEY}${puzzleId}`,
    JSON.stringify(progressFields(progress))
  );
}

export function readLocalDailyHints(editionDate: string): DailyHintWallet | null {
  try {
    return normalizeDailyHints(localStorage.getItem(`${DAILY_HINTS_KEY}${editionDate}`), editionDate);
  } catch {
    return null;
  }
}

export function writeLocalDailyHints(wallet: DailyHintWallet) {
  if (!isEditionDate(wallet.editionDate)) return;
  const next = clipDailyWallet(wallet.editionDate, wallet.used);
  localStorage.setItem(`${DAILY_HINTS_KEY}${next.editionDate}`, JSON.stringify(next));
}

export function readLocalDailyChecks(editionDate: string): DailyHintWallet | null {
  try {
    return normalizeDailyHints(localStorage.getItem(`${DAILY_CHECKS_KEY}${editionDate}`), editionDate);
  } catch {
    return null;
  }
}

export function writeLocalDailyChecks(wallet: DailyHintWallet) {
  if (!isEditionDate(wallet.editionDate)) return;
  const next = clipDailyWallet(wallet.editionDate, wallet.used);
  localStorage.setItem(`${DAILY_CHECKS_KEY}${next.editionDate}`, JSON.stringify(next));
}

export function readAllLocalDailyHints(): Record<string, DailyHintWallet> {
  return readAllLocalDailyWallets(DAILY_HINTS_KEY);
}

export function readAllLocalDailyChecks(): Record<string, DailyHintWallet> {
  return readAllLocalDailyWallets(DAILY_CHECKS_KEY);
}

function readAllLocalDailyWallets(prefix: string): Record<string, DailyHintWallet> {
  const out: Record<string, DailyHintWallet> = {};
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(prefix)) continue;
    const editionDate = key.slice(prefix.length);
    const parsed = normalizeDailyHints(localStorage.getItem(key), editionDate);
    if (parsed) out[editionDate] = parsed;
  }
  return out;
}

export function usedHintsFromProgress(
  editionDate: string,
  puzzles: { id: string; editionDate: string }[],
  progressById: Record<string, PuzzleProgress>
) {
  return puzzles.reduce((sum, puzzle) => {
    if (puzzle.editionDate !== editionDate) return sum;
    const progress = progressById[puzzle.id];
    if (!progress) return sum;
    return sum + Math.max(progress.hintsUsed || 0, (progress.hintedSymbolIds || []).length);
  }, 0);
}

export function usedChecksFromProgress(
  editionDate: string,
  puzzles: { id: string; editionDate: string }[],
  progressById: Record<string, PuzzleProgress>
) {
  return puzzles.reduce((sum, puzzle) => {
    if (puzzle.editionDate !== editionDate) return sum;
    const progress = progressById[puzzle.id];
    if (!progress) return sum;
    return sum + Math.max(progress.checksUsed || 0, (progress.verifiedSymbolIds || []).length);
  }, 0);
}

export function reconcileDailyHints(
  editionDate: string,
  puzzles: { id: string; editionDate: string }[],
  progressById: Record<string, PuzzleProgress> = readAllLocalProgress()
): DailyHintWallet {
  const local = readLocalDailyHints(editionDate);
  return clipDailyWallet(
    editionDate,
    Math.max(local?.used ?? 0, usedHintsFromProgress(editionDate, puzzles, progressById))
  );
}

export function reconcileDailyChecks(
  editionDate: string,
  puzzles: { id: string; editionDate: string }[],
  progressById: Record<string, PuzzleProgress> = readAllLocalProgress()
): DailyHintWallet {
  const local = readLocalDailyChecks(editionDate);
  return clipDailyWallet(
    editionDate,
    Math.max(local?.used ?? 0, usedChecksFromProgress(editionDate, puzzles, progressById))
  );
}

export function readAllLocalProgress(): Record<string, PuzzleProgress> {
  const out: Record<string, PuzzleProgress> = {};
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(PROGRESS_KEY)) continue;
    const puzzleId = key.slice(PROGRESS_KEY.length);
    if (!puzzleId) continue;
    const parsed = normalizeProgress(localStorage.getItem(key));
    if (parsed) out[puzzleId] = parsed;
  }
  return out;
}

export async function importLocalProgressToCloud(
  uid: string,
  localProgress: Record<string, PuzzleProgress>,
  solvedPuzzleIds: string[],
  puzzles: { id: string; editionDate: string }[] = []
) {
  if (!db) return;
  const puzzleIds = new Set([...Object.keys(localProgress), ...solvedPuzzleIds]);
  await Promise.all(
    Array.from(puzzleIds).map(async (puzzleId) => {
      if (!puzzleId || puzzleId.length > 80) return;
      const stored = localProgress[puzzleId];
      const local: PuzzleProgress = {
        mappings: stored?.mappings || {},
        timerSeconds: stored?.timerSeconds || 0,
        hintsUsed: stored?.hintsUsed || 0,
        hintsRemaining: stored?.hintsRemaining ?? DAILY_HINTS,
        hintedSymbolIds: clipHintedSymbolIds(stored?.hintedSymbolIds),
        checksUsed: stored?.checksUsed || 0,
        checksRemaining: stored?.checksRemaining ?? DAILY_CHECKS,
        verifiedSymbolIds: clipHintedSymbolIds(stored?.verifiedSymbolIds),
        flaggedSymbolIds: clipHintedSymbolIds(stored?.flaggedSymbolIds),
        selectedSymbolId: clipSelectedSymbolId(stored?.selectedSymbolId),
        isSolved: Boolean(stored?.isSolved || solvedPuzzleIds.includes(puzzleId)),
      };
      const cloud = await loadCloudProgress(uid, puzzleId).catch(() => null);
      const merged = mergeProgress(local, cloud);
      if (!merged) return;
      await saveCloudProgress(uid, puzzleId, merged).catch(() => undefined);
      writeLocalProgress(puzzleId, merged);
    })
  );
  const dates = new Set(Object.keys(readAllLocalDailyHints()));
  const checkDates = new Set(Object.keys(readAllLocalDailyChecks()));
  for (const puzzle of puzzles) {
    const stored = localProgress[puzzle.id];
    if (stored && (stored.hintsUsed > 0 || stored.hintedSymbolIds.length > 0)) {
      dates.add(puzzle.editionDate);
    }
    if (stored && (stored.checksUsed > 0 || stored.verifiedSymbolIds.length > 0 || stored.flaggedSymbolIds.length > 0)) {
      checkDates.add(puzzle.editionDate);
    }
  }
  await Promise.all(
    Array.from(dates).map(async (editionDate) => {
      if (!isEditionDate(editionDate)) return;
      const local = reconcileDailyHints(editionDate, puzzles, localProgress);
      const cloud = await loadCloudDailyHints(uid, editionDate).catch(() => null);
      const merged = mergeDailyHints(local, cloud, editionDate);
      writeLocalDailyHints(merged);
      await saveCloudDailyHints(uid, merged).catch(() => undefined);
    })
  );
  await Promise.all(
    Array.from(checkDates).map(async (editionDate) => {
      if (!isEditionDate(editionDate)) return;
      const local = reconcileDailyChecks(editionDate, puzzles, localProgress);
      const cloud = await loadCloudDailyChecks(uid, editionDate).catch(() => null);
      const merged = mergeDailyHints(local, cloud, editionDate);
      writeLocalDailyChecks(merged);
      await saveCloudDailyChecks(uid, merged).catch(() => undefined);
    })
  );
}

export async function loadUserProfile(uid: string) {
  if (!db) return null;
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    gameStats: {
      puzzlesPlayed: data.puzzlesPlayed ?? 0,
      puzzlesSolved: data.puzzlesSolved ?? 0,
      currentStreak: data.currentStreak ?? 1,
      maxStreak: data.maxStreak ?? 1,
      fastestTime: data.fastestTime ?? null,
      totalTimePlayed: data.totalTimePlayed ?? 0,
      averageAccuracy: data.averageAccuracy ?? 100,
      leaderboardSubmissions: data.leaderboardSubmissions ?? 0,
    } as GameStats,
    solvedPuzzleIds: Array.isArray(data.solvedPuzzleIds) ? (data.solvedPuzzleIds as string[]) : [],
    codename: typeof data.codename === 'string' ? data.codename : '',
  };
}

export async function ensureUserProfile(
  user: User,
  gameStats: GameStats,
  solvedPuzzleIds: string[]
) {
  if (!db) return;
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  const codename = clip(
    localStorage.getItem('cryptogram_codename') || user.displayName || 'Codebreaker',
    24
  );
  const payload = {
    uid: user.uid,
    displayName: clip(user.displayName || 'Codebreaker', 80),
    photoURL: user.photoURL || '',
    codename,
    titleBadge: 'Field Operative',
    countryCode: 'US',
    ...gameStats,
    solvedPuzzleIds: solvedPuzzleIds.slice(0, 500),
    updatedAt: serverTimestamp(),
  };
  if (!snap.exists()) {
    await setDoc(ref, { ...payload, createdAt: serverTimestamp() });
    return;
  }
  await setDoc(
    ref,
    {
      displayName: payload.displayName,
      photoURL: payload.photoURL,
      ...gameStats,
      solvedPuzzleIds: payload.solvedPuzzleIds,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function saveUserProfile(
  uid: string,
  gameStats: GameStats,
  solvedPuzzleIds: string[]
) {
  if (!db) return;
  await setDoc(
    doc(db, 'users', uid),
    {
      ...gameStats,
      solvedPuzzleIds: solvedPuzzleIds.slice(0, 500),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function loadCloudProgress(uid: string, puzzleId: string): Promise<PuzzleProgress | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, 'users', uid, 'progress', puzzleId));
  if (!snap.exists()) return null;
  return normalizeProgress(snap.data());
}

export async function saveCloudProgress(uid: string, puzzleId: string, progress: PuzzleProgress) {
  if (!db) return;
  await setDoc(doc(db, 'users', uid, 'progress', puzzleId), {
    puzzleId,
    ...progressFields(progress),
    updatedAt: serverTimestamp(),
  });
}

export async function loadCloudDailyHints(uid: string, editionDate: string): Promise<DailyHintWallet | null> {
  if (!db || !isEditionDate(editionDate)) return null;
  const snap = await getDoc(doc(db, 'users', uid, 'dailyHints', editionDate));
  if (!snap.exists()) return null;
  return normalizeDailyHints(snap.data(), editionDate);
}

export async function saveCloudDailyHints(uid: string, wallet: DailyHintWallet) {
  if (!db || !isEditionDate(wallet.editionDate)) return;
  const next = clipDailyWallet(wallet.editionDate, wallet.used);
  await setDoc(doc(db, 'users', uid, 'dailyHints', next.editionDate), {
    editionDate: next.editionDate,
    used: next.used,
    remaining: next.remaining,
    updatedAt: serverTimestamp(),
  });
}

export async function loadCloudDailyChecks(uid: string, editionDate: string): Promise<DailyHintWallet | null> {
  if (!db || !isEditionDate(editionDate)) return null;
  const snap = await getDoc(doc(db, 'users', uid, 'dailyChecks', editionDate));
  if (!snap.exists()) return null;
  return normalizeDailyHints(snap.data(), editionDate);
}

export async function saveCloudDailyChecks(uid: string, wallet: DailyHintWallet) {
  if (!db || !isEditionDate(wallet.editionDate)) return;
  const next = clipDailyWallet(wallet.editionDate, wallet.used);
  await setDoc(doc(db, 'users', uid, 'dailyChecks', next.editionDate), {
    editionDate: next.editionDate,
    used: next.used,
    remaining: next.remaining,
    updatedAt: serverTimestamp(),
  });
}

export async function recordPuzzleStart(uid: string, puzzleId: string) {
  if (!db) return;
  const startRef = doc(db, 'starts', startId(uid, puzzleId));
  const statsRef = doc(db, 'puzzleStats', puzzleId);
  await runTransaction(db, async (tx) => {
    const startSnap = await tx.get(startRef);
    if (startSnap.exists()) return;
    const statsSnap = await tx.get(statsRef);
    tx.set(startRef, {
      uid,
      puzzleId,
      createdAt: serverTimestamp(),
    });
    if (statsSnap.exists()) {
      const current = statsSnap.data();
      tx.update(statsRef, {
        startedCount: (current.startedCount || 0) + 1,
        updatedAt: serverTimestamp(),
      });
      return;
    }
    tx.set(statsRef, {
      puzzleId,
      startedCount: 1,
      completeCount: 0,
      totalTimeSeconds: 0,
      fastestTime: null,
      fastestSolverName: null,
      updatedAt: serverTimestamp(),
    });
  });
}

export async function recordPuzzleSolve(
  uid: string,
  puzzleId: string,
  timeSeconds: number,
  hintsUsed: number,
  accuracy: number,
  solverName: string
) {
  if (!db) return;
  if (timeSeconds < 5 || timeSeconds > 86400) return;
  await recordPuzzleStart(uid, puzzleId);
  const solveRef = doc(db, 'solves', startId(uid, puzzleId));
  const statsRef = doc(db, 'puzzleStats', puzzleId);
  const name = clip(solverName || 'Anonymous', 80);
  await runTransaction(db, async (tx) => {
    const solveSnap = await tx.get(solveRef);
    if (solveSnap.exists()) return;
    const statsSnap = await tx.get(statsRef);
    tx.set(solveRef, {
      uid,
      puzzleId,
      timeSeconds,
      hintsUsed,
      accuracy,
      createdAt: serverTimestamp(),
    });
    if (statsSnap.exists()) {
      const current = statsSnap.data();
      const completeCount = (current.completeCount || 0) + 1;
      const totalTimeSeconds = (current.totalTimeSeconds || 0) + timeSeconds;
      const previousFastest = typeof current.fastestTime === 'number' ? current.fastestTime : null;
      const isFastest = previousFastest == null || timeSeconds < previousFastest;
      tx.update(statsRef, {
        completeCount,
        totalTimeSeconds,
        fastestTime: isFastest ? timeSeconds : previousFastest,
        fastestSolverName: isFastest ? name : current.fastestSolverName ?? null,
        updatedAt: serverTimestamp(),
      });
      return;
    }
    tx.set(statsRef, {
      puzzleId,
      startedCount: 1,
      completeCount: 1,
      totalTimeSeconds: timeSeconds,
      fastestTime: timeSeconds,
      fastestSolverName: name,
      updatedAt: serverTimestamp(),
    });
  });
}

export function subscribePuzzleStats(
  puzzleId: string,
  onChange: (stats: PuzzleLiveStats) => void
): Unsubscribe | null {
  if (!db || !puzzleId) return null;
  return onSnapshot(doc(db, 'puzzleStats', puzzleId), (snap) => {
    if (!snap.exists()) {
      onChange(emptyPuzzleStats(puzzleId));
      return;
    }
    const data = snap.data();
    onChange({
      puzzleId,
      startedCount: data.startedCount || 0,
      completeCount: data.completeCount || 0,
      totalTimeSeconds: data.totalTimeSeconds || 0,
      fastestTime: typeof data.fastestTime === 'number' ? data.fastestTime : null,
      fastestSolverName: data.fastestSolverName ?? null,
    });
  });
}

export async function fetchLeaderboard(puzzleId: string): Promise<LeaderboardEntry[]> {
  if (!db || !puzzleId) return [];
  const q = query(
    collection(db, 'leaderboard', puzzleId, 'entries'),
    orderBy('timeSeconds'),
    limit(100)
  );
  const snap = await getDocs(q);
  return snap.docs.map((item) => {
    const data = item.data();
    return {
      id: item.id,
      puzzleId,
      codename: data.codename,
      titleBadge: data.titleBadge,
      timeSeconds: data.timeSeconds,
      timeFormatted: data.timeFormatted,
      hintsUsed: data.hintsUsed,
      accuracy: data.accuracy,
      countryCode: data.countryCode,
      timestamp: data.timestamp?.toDate?.()?.toISOString?.() || new Date().toISOString(),
      isToday: true,
    } as LeaderboardEntry;
  });
}

export async function submitLeaderboardEntry(
  uid: string,
  entry: Omit<LeaderboardEntry, 'id' | 'timestamp' | 'isToday'>
) {
  if (!db) return { rank: null as number | null };
  if (entry.timeSeconds < 5 || entry.timeSeconds > 86400) return { rank: null as number | null };
  const ref = doc(db, 'leaderboard', entry.puzzleId, 'entries', uid);
  const existing = await getDoc(ref);
  if (existing.exists() && existing.data().timeSeconds <= entry.timeSeconds) {
    const board = await fetchLeaderboard(entry.puzzleId);
    return { rank: board.findIndex((item) => item.id === uid) + 1 || null };
  }
  await setDoc(ref, {
    uid,
    puzzleId: entry.puzzleId,
    codename: clip(entry.codename, 24),
    titleBadge: clip(entry.titleBadge, 60),
    timeSeconds: entry.timeSeconds,
    timeFormatted: clip(entry.timeFormatted, 16),
    hintsUsed: entry.hintsUsed,
    accuracy: entry.accuracy,
    countryCode: clip(entry.countryCode.toUpperCase(), 2),
    timestamp: serverTimestamp(),
  });
  const board = await fetchLeaderboard(entry.puzzleId);
  return { rank: board.findIndex((item) => item.id === uid) + 1 || null };
}

function dispatchTokenId(token: string) {
  return token.replace(/\//g, '_').slice(0, 1500);
}

export async function saveDispatchToken(
  uid: string,
  token: string,
  subscribed: boolean
) {
  if (!db || !uid || !token) return;
  await setDoc(doc(db, 'dispatchTokens', dispatchTokenId(token)), {
    uid,
    token,
    subscribed,
    updatedAt: serverTimestamp(),
  });
}

export async function clearDispatchToken(uid: string, token: string) {
  if (!db || !uid || !token) return;
  await deleteDoc(doc(db, 'dispatchTokens', dispatchTokenId(token)));
}

export async function deleteCloudUserData(uid: string, puzzleIds: string[]) {
  if (!db || !uid) return;
  const wipe = async (...path: string[]) => {
    const snap = await getDocs(collection(db, ...path));
    await Promise.all(snap.docs.map((item) => deleteDoc(item.ref)));
  };
  await wipe('users', uid, 'progress');
  await wipe('users', uid, 'dailyHints');
  await wipe('users', uid, 'dailyChecks');
  const tokens = await getDocs(query(collection(db, 'dispatchTokens'), where('uid', '==', uid)));
  await Promise.all(tokens.docs.map((item) => deleteDoc(item.ref)));
  await Promise.all(
    puzzleIds.map((puzzleId) =>
      Promise.all([
        deleteDoc(doc(db, 'leaderboard', puzzleId, 'entries', uid)),
        deleteDoc(doc(db, 'starts', `${uid}_${puzzleId}`)),
        deleteDoc(doc(db, 'solves', `${uid}_${puzzleId}`)),
      ])
    )
  );
  await deleteDoc(doc(db, 'users', uid));
}

export { DEFAULT_GAME_STATS };
