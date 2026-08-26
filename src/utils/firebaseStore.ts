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
import {
  DAILY_CHECKS,
  DAILY_HINTS,
  clipHintedSymbolIds,
  clipSelectedSymbolId,
  clipDailyWallet,
  isEditionDate,
  mergeDailyHints,
  mergeProgress,
  normalizeDailyHints,
  normalizeProgress,
  progressFields,
  progressSnapshot,
  readAllLocalDailyChecks,
  readAllLocalDailyHints,
  reconcileDailyChecks,
  reconcileDailyHints,
  writeLocalDailyChecks,
  writeLocalDailyHints,
  writeLocalProgress,
} from './localStore';
import { forgetCloud, logDesk } from './deskError';
import { solverDisplayName } from './solverDisplayName';
import { STORAGE_KEYS } from './storageKeys';
import { storageGet } from './safeStorage';

const EMPTY_STATS: Omit<PuzzleLiveStats, 'puzzleId'> = {
  startedCount: 0,
  completeCount: 0,
  totalTimeSeconds: 0,
  fastestTime: null,
  fastestSolverName: null,
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
      const local = progressSnapshot({
        ...(stored ? progressFields(stored) : progressFields({
          mappings: {},
          timerSeconds: 0,
          hintsUsed: 0,
          hintsRemaining: DAILY_HINTS,
          hintedSymbolIds: [],
          checksUsed: 0,
          checksRemaining: DAILY_CHECKS,
          verifiedSymbolIds: [],
          flaggedSymbolIds: [],
          selectedSymbolId: null,
          isSolved: false,
        })),
        isSolved: Boolean(stored?.isSolved || solvedPuzzleIds.includes(puzzleId)),
      });
      const cloud = await loadCloudProgress(uid, puzzleId).catch((err) => {
        logDesk('load-progress-import', err);
        return null;
      });
      const merged = mergeProgress(local, cloud);
      if (!merged) return;
      forgetCloud(saveCloudProgress(uid, puzzleId, merged), 'save-progress-import');
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
      const cloud = await loadCloudDailyHints(uid, editionDate).catch((err) => {
        logDesk('load-hints-import', err);
        return null;
      });
      const merged = mergeDailyHints(local, cloud, editionDate);
      writeLocalDailyHints(merged);
      forgetCloud(saveCloudDailyHints(uid, merged), 'save-hints-import');
    })
  );
  await Promise.all(
    Array.from(checkDates).map(async (editionDate) => {
      if (!isEditionDate(editionDate)) return;
      const local = reconcileDailyChecks(editionDate, puzzles, localProgress);
      const cloud = await loadCloudDailyChecks(uid, editionDate).catch((err) => {
        logDesk('load-checks-import', err);
        return null;
      });
      const merged = mergeDailyHints(local, cloud, editionDate, DAILY_CHECKS);
      writeLocalDailyChecks(merged);
      forgetCloud(saveCloudDailyChecks(uid, merged), 'save-checks-import');
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
  const codename = clip(storageGet(STORAGE_KEYS.codename) || solverDisplayName(user), 24);
  const payload = {
    uid: user.uid,
    displayName: clip(solverDisplayName(user), 80),
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
  return normalizeDailyHints(snap.data(), editionDate, DAILY_CHECKS);
}

export async function saveCloudDailyChecks(uid: string, wallet: DailyHintWallet) {
  if (!db || !isEditionDate(wallet.editionDate)) return;
  const next = clipDailyWallet(wallet.editionDate, wallet.used, DAILY_CHECKS);
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
  let last = emptyPuzzleStats(puzzleId);
  return onSnapshot(
    doc(db, 'puzzleStats', puzzleId),
    (snap) => {
      if (!snap.exists()) {
        last = emptyPuzzleStats(puzzleId);
        onChange(last);
        return;
      }
      const data = snap.data();
      last = {
        puzzleId,
        startedCount: data.startedCount || 0,
        completeCount: data.completeCount || 0,
        totalTimeSeconds: data.totalTimeSeconds || 0,
        fastestTime: typeof data.fastestTime === 'number' ? data.fastestTime : null,
        fastestSolverName: data.fastestSolverName ?? null,
      };
      onChange(last);
    },
    (err) => {
      logDesk('puzzle-stats', err);
      onChange(last);
    }
  );
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
  const store = db;
  const wipe = async (segment: string) => {
    const snap = await getDocs(collection(store, 'users', uid, segment));
    await Promise.all(snap.docs.map((item) => deleteDoc(item.ref)));
  };
  await wipe('progress');
  await wipe('dailyHints');
  await wipe('dailyChecks');
  const tokens = await getDocs(query(collection(store, 'dispatchTokens'), where('uid', '==', uid)));
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
