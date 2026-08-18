import {
  collection,
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
  type Unsubscribe,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from './firebase';
import {
  GameStats,
  LeaderboardEntry,
  PuzzleLiveStats,
  PuzzleProgress,
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

export function mergeProgress(local: PuzzleProgress | null, cloud: PuzzleProgress | null): PuzzleProgress | null {
  if (!cloud) return local;
  if (!local) return cloud;
  if (local.isSolved && cloud.isSolved) {
    return local.timerSeconds <= cloud.timerSeconds ? local : cloud;
  }
  if (cloud.isSolved) return cloud;
  if (local.isSolved) return local;
  const localMapped = Object.keys(local.mappings || {}).length;
  const cloudMapped = Object.keys(cloud.mappings || {}).length;
  return cloudMapped > localMapped ? cloud : local;
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

const PROGRESS_KEY = 'cryptogram_progress_';

function normalizeProgress(raw: unknown): PuzzleProgress | null {
  try {
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!data || typeof data !== 'object') return null;
    const source = (data as PuzzleProgress).mappings;
    const mappings: PuzzleProgress['mappings'] = {};
    if (source && typeof source === 'object') {
      for (const key of Object.keys(source).slice(0, 40)) {
        const letter = source[key];
        if (typeof letter === 'string' && letter) mappings[key] = letter;
      }
    }
    const timerSeconds = Number((data as PuzzleProgress).timerSeconds) || 0;
    const hintsUsed = Number((data as PuzzleProgress).hintsUsed) || 0;
    const hintsRemaining =
      (data as PuzzleProgress).hintsRemaining == null
        ? 3
        : Number((data as PuzzleProgress).hintsRemaining);
    return {
      mappings,
      timerSeconds: Math.min(86400, Math.max(0, timerSeconds)),
      hintsUsed: Math.min(20, Math.max(0, hintsUsed)),
      hintsRemaining: Math.min(3, Math.max(0, hintsRemaining)),
      isSolved: Boolean((data as PuzzleProgress).isSolved),
    };
  } catch {
    return null;
  }
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
  solvedPuzzleIds: string[]
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
        hintsRemaining: stored?.hintsRemaining ?? 3,
        isSolved: Boolean(stored?.isSolved || solvedPuzzleIds.includes(puzzleId)),
      };
      const cloud = await loadCloudProgress(uid, puzzleId);
      const merged = mergeProgress(local, cloud);
      if (!merged) return;
      await saveCloudProgress(uid, puzzleId, merged);
      localStorage.setItem(`${PROGRESS_KEY}${puzzleId}`, JSON.stringify(merged));
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
  const data = snap.data();
  return {
    mappings: data.mappings || {},
    timerSeconds: data.timerSeconds || 0,
    hintsUsed: data.hintsUsed || 0,
    hintsRemaining: data.hintsRemaining ?? 3,
    isSolved: Boolean(data.isSolved),
  };
}

export async function saveCloudProgress(uid: string, puzzleId: string, progress: PuzzleProgress) {
  if (!db) return;
  await setDoc(doc(db, 'users', uid, 'progress', puzzleId), {
    puzzleId,
    mappings: progress.mappings,
    timerSeconds: progress.timerSeconds,
    hintsUsed: progress.hintsUsed,
    hintsRemaining: progress.hintsRemaining,
    isSolved: progress.isSolved,
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

export { DEFAULT_GAME_STATS };
