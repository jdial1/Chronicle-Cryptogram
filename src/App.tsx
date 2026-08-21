import React, { useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { CryptogramGrid } from './components/CryptogramGrid';
import { LeaderboardModal } from './components/LeaderboardModal';
import { NewspaperClippingModal } from './components/NewspaperClippingModal';
import { ArchiveModal } from './components/ArchiveModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { ResetLettersModal } from './components/ResetLettersModal';
import { BureauDeskModal, bureauDeskSeen, markBureauDeskSeen, usesGameKeyboard, toggleGameKeyboard } from './components/BureauDeskModal';
import { ArticleReaderModal, DropCapParagraph } from './components/ArticleReaderModal';
import { CaseFileModal, CaseFileToast } from './components/CaseFileModal';
import { EditionPlate } from './components/EditionPlate';
import { EditionUpdateBanner } from './components/EditionUpdateBanner';
import { TodayStatsBulletin, LiveStatsRow } from './components/TodayStatsBulletin';
import { INITIAL_PUZZLES } from './data/puzzles';
import {
  CaseCharacterId,
  fragmentKey,
  fragmentsUpdatedByPuzzle,
  hasDecodedFragments,
} from './data/caseFiles';
import { PuzzleData, PuzzleProgress, SymbolMapping, GameStats } from './types';
import { isMorningEdition, isNightEdition, isNightUnlockedForDate, isPrimerPuzzle, publishedThroughDate, articleDek, articleByline, currentMorningPuzzle, firstCasePuzzle, storyHasBegun, hasSolvedStoryPuzzle } from './utils/edition';
import { articlePlateId } from './data/plates';
import { useDailyNotification } from './utils/useDailyNotification';
import { useAuth } from './utils/useAuth';
import {
  DAILY_CHECKS,
  DAILY_HINTS,
  DEFAULT_GAME_STATS,
  clipDailyWallet,
  clipHintedSymbolIds,
  clipSelectedSymbolId,
  ensureUserProfile,
  importLocalProgressToCloud,
  loadCloudDailyChecks,
  loadCloudDailyHints,
  loadCloudProgress,
  loadUserProfile,
  mergeDailyHints,
  mergeGameStats,
  mergeProgress,
  mergeSolvedIds,
  readAllLocalProgress,
  readLocalProgress,
  reconcileDailyChecks,
  reconcileDailyHints,
  recordPuzzleSolve,
  recordPuzzleStart,
  saveCloudDailyChecks,
  saveCloudDailyHints,
  saveCloudProgress,
  saveUserProfile,
  deleteCloudUserData,
  writeLocalDailyChecks,
  writeLocalDailyHints,
  writeLocalProgress,
} from './utils/firebaseStore';
import {
  buildCipherAlphabet,
  parseCryptogramText,
  calculateSymbolFrequencies,
  formatTime,
} from './utils/cipherEngine';
import { deskThemeIsDark, toggleDeskTheme } from './utils/deskTheme';
import { useEditionUpdate } from './utils/useEditionUpdate';
import { Search, WoodcutPressFilter } from './icons';
import { isFirebaseEnabled } from './utils/firebase';
import { isAndroidAppShell, postToAndroidApp } from './utils/androidApp';
import { useDialogFocus } from './utils/useDialogFocus';

function isHardPuzzle(puzzle: PuzzleData) {
  return (
    puzzle.difficultyMode === 'Hard' ||
    puzzle.difficulty === 'Hard' ||
    puzzle.difficulty === 'Master'
  );
}

function getInitialPuzzle(): PuzzleData {
  const primer = INITIAL_PUZZLES.find((puzzle) => isPrimerPuzzle(puzzle) && isMorningEdition(puzzle));
  if (primer && !readSolvedPuzzleIds().includes(primer.id)) return primer;
  return currentMorningPuzzle(INITIAL_PUZZLES) || INITIAL_PUZZLES[0];
}

function readSolvedPuzzleIds(): string[] {
  try {
    const saved = localStorage.getItem('cryptogram_solved_ids');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function withHintedMappings(
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

function liveFlaggedIds(
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

function decodedMappings(
  symbols: { symbolId: string; targetLetter: string }[]
): SymbolMapping {
  const next: SymbolMapping = {};
  for (const symbol of symbols) {
    next[symbol.symbolId] = symbol.targetLetter;
  }
  return next;
}

function decodedMappingsFromPuzzle(puzzle: PuzzleData): SymbolMapping {
  const alphabet = buildCipherAlphabet(puzzle.id + puzzle.originalText, isHardPuzzle(puzzle));
  const next: SymbolMapping = {};
  for (const word of parseCryptogramText(puzzle.originalText, alphabet)) {
    for (const symbol of word.symbols) {
      if (!symbol.isPunctuation) next[symbol.symbolId] = symbol.targetLetter;
    }
  }
  return next;
}

function puzzleWasSolved(puzzleId: string, progress: PuzzleProgress | null) {
  return Boolean(progress?.isSolved || readSolvedPuzzleIds().includes(puzzleId));
}

function loadPuzzleState(puzzle: PuzzleData, puzzles: PuzzleData[] = INITIAL_PUZZLES) {
  const progress = readLocalProgress(puzzle.id);
  const hintedSymbolIds = clipHintedSymbolIds(progress?.hintedSymbolIds);
  const verifiedSymbolIds = clipHintedSymbolIds(progress?.verifiedSymbolIds);
  const lockedSymbolIds = clipHintedSymbolIds([...hintedSymbolIds, ...verifiedSymbolIds]);
  const hintsUsed = Math.max(progress?.hintsUsed || 0, hintedSymbolIds.length);
  const checksUsed = Math.max(progress?.checksUsed || 0, verifiedSymbolIds.length);
  const wallet = reconcileDailyHints(puzzle.editionDate, puzzles);
  const checkWallet = reconcileDailyChecks(puzzle.editionDate, puzzles);
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

function dismissMobileKeyboard(input: HTMLInputElement | null) {
  input?.blur();
  const active = document.activeElement;
  if (active instanceof HTMLElement) active.blur();
  postToAndroidApp({ type: 'CIPHER_BLUR' });
}

function selectedGlyphTile(symbolId: string, cellId?: string | null) {
  if (cellId) {
    const cell = document.querySelector(`[data-cipher-cell="${CSS.escape(cellId)}"]`);
    if (cell instanceof HTMLElement && cell.getAttribute('data-cipher-symbol') === symbolId) {
      return cell;
    }
  }
  return document.querySelector(`[data-cipher-symbol="${CSS.escape(symbolId)}"]`);
}

function placeCipherInput(symbolId: string, input: HTMLInputElement, cellId?: string | null) {
  const tile = selectedGlyphTile(symbolId, cellId);
  if (!(tile instanceof HTMLElement)) return null;
  const rect = tile.getBoundingClientRect();
  input.style.left = `${rect.left}px`;
  input.style.top = `${rect.top}px`;
  input.style.width = `${Math.max(16, rect.width)}px`;
  input.style.height = `${Math.max(16, rect.height)}px`;
  return tile;
}

function letterCells(words: { id: string; symbols: { symbolId: string; isPunctuation?: boolean }[] }[]) {
  const cells: { cellId: string; symbolId: string }[] = [];
  words.forEach((word) => {
    word.symbols.forEach((item, charIdx) => {
      if (!item.isPunctuation) cells.push({ cellId: `${word.id}_${charIdx}`, symbolId: item.symbolId });
    });
  });
  return cells;
}

function cellCursor(
  cells: { cellId: string; symbolId: string }[],
  selectedSymbolId: string | null,
  selectedCellId?: string | null
) {
  if (selectedCellId) {
    const byCell = cells.findIndex((cell) => cell.cellId === selectedCellId);
    if (byCell >= 0) return byCell;
  }
  if (!selectedSymbolId) return 0;
  const bySymbol = cells.findIndex((cell) => cell.symbolId === selectedSymbolId);
  return bySymbol < 0 ? 0 : bySymbol;
}

function nextOpenCell(
  cells: { cellId: string; symbolId: string }[],
  selectedSymbolId: string | null,
  selectedCellId: string | null,
  mappings: SymbolMapping
) {
  if (!cells.length) return null;
  const start = cellCursor(cells, selectedSymbolId, selectedCellId);
  for (let step = 1; step <= cells.length; step += 1) {
    const cell = cells[(start + step) % cells.length];
    if (!mappings[cell.symbolId]) return cell;
  }
  return null;
}

function previousCell(
  cells: { cellId: string; symbolId: string }[],
  selectedSymbolId: string | null,
  selectedCellId?: string | null
) {
  const start = cellCursor(cells, selectedSymbolId, selectedCellId);
  if (start <= 0) return null;
  return cells[start - 1];
}

function webTypeFeel(kind: 'tap' | 'key') {
  if (isAndroidAppShell()) return;
  try {
    navigator.vibrate?.(kind === 'tap' ? 12 : 8);
  } catch {
    return;
  }
}

const BOOT_PUZZLE = getInitialPuzzle();
const BOOT_STATE = loadPuzzleState(BOOT_PUZZLE);

export default function App() {
  const { user, identified, configured, error: authError, signIn, signOut } = useAuth();
  const {
    supported: deliverySupported,
    subscribed: deliverySubscribed,
    blocked: deliveryBlocked,
    toggleDelivery,
    openSettings: openDeliverySettings,
    subscribeError: deliveryError,
  } = useDailyNotification(user?.uid);
  const startedPuzzlesRef = useRef<Set<string>>(new Set());

  const hiddenInputRef = useRef<HTMLInputElement>(null);

  // Puzzles State
  const allPuzzles = INITIAL_PUZZLES;
  const [currentPuzzle, setCurrentPuzzle] = useState<PuzzleData>(BOOT_PUZZLE);
  const [solvedPuzzleIds, setSolvedPuzzleIds] = useState<string[]>(readSolvedPuzzleIds);
  const [progressReadyId, setProgressReadyId] = useState('');

  const [gameStats, setGameStats] = useState<GameStats>(() => {
    try {
      const saved = localStorage.getItem('cryptogram_stats');
      return saved
        ? JSON.parse(saved)
        : DEFAULT_GAME_STATS;
    } catch {
      return DEFAULT_GAME_STATS;
    }
  });

  const [darkPaper, setDarkPaper] = useState(deskThemeIsDark);
  const [gameKeyboard, setGameKeyboard] = useState(usesGameKeyboard);

  const [mappings, setMappings] = useState<SymbolMapping>(BOOT_STATE.mappings);
  const [selectedSymbolId, setSelectedSymbolId] = useState<string | null>(null);
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null);
  const [hintsUsed, setHintsUsed] = useState(BOOT_STATE.hintsUsed);
  const [hintsRemaining, setHintsRemaining] = useState(BOOT_STATE.hintsRemaining);
  const [hintedSymbolIds, setHintedSymbolIds] = useState<string[]>(BOOT_STATE.hintedSymbolIds);
  const [checksUsed, setChecksUsed] = useState(BOOT_STATE.checksUsed);
  const [checksRemaining, setChecksRemaining] = useState(BOOT_STATE.checksRemaining);
  const [verifiedSymbolIds, setVerifiedSymbolIds] = useState<string[]>(BOOT_STATE.verifiedSymbolIds);
  const [flaggedSymbolIds, setFlaggedSymbolIds] = useState<string[]>(BOOT_STATE.flaggedSymbolIds);
  const [isSolved, setIsSolved] = useState(BOOT_STATE.isSolved);

  const [timerSeconds, setTimerSeconds] = useState(BOOT_STATE.timerSeconds);
  const [isTimerRunning, setIsTimerRunning] = useState(!BOOT_STATE.isSolved);

  // Modals
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isNewspaperClippingOpen, setIsNewspaperClippingOpen] = useState(false);
  const [isSolveBulletinOpen, setIsSolveBulletinOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isCaseFileOpen, setIsCaseFileOpen] = useState(false);
  const [caseFileFocusId, setCaseFileFocusId] = useState<CaseCharacterId | null>(null);
  const [caseFileFocusKey, setCaseFileFocusKey] = useState<string | null>(null);
  const [caseFileToastPuzzle, setCaseFileToastPuzzle] = useState<PuzzleData | null>(null);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isArticleOpen, setIsArticleOpen] = useState(false);
  const [isResetLettersOpen, setIsResetLettersOpen] = useState(false);
  const [isBureauDeskOpen, setIsBureauDeskOpen] = useState(false);
  const [bureauPreview, setBureauPreview] = useState(false);
  const bureauAfterRef = useRef<(() => void) | null>(null);
  const [deskArmed, setDeskArmed] = useState(false);
  const [viewportKeyboard, setViewportKeyboard] = useState(false);

  if (progressReadyId !== currentPuzzle.id) {
    const loaded = loadPuzzleState(currentPuzzle, allPuzzles);
    setProgressReadyId(currentPuzzle.id);
    setMappings(loaded.mappings);
    setTimerSeconds(loaded.timerSeconds);
    setHintsUsed(loaded.hintsUsed);
    setHintsRemaining(loaded.hintsRemaining);
    setHintedSymbolIds(loaded.hintedSymbolIds);
    setChecksUsed(loaded.checksUsed);
    setChecksRemaining(loaded.checksRemaining);
    setVerifiedSymbolIds(loaded.verifiedSymbolIds);
    setFlaggedSymbolIds(loaded.flaggedSymbolIds);
    setIsSolved(loaded.isSolved);
    setIsTimerRunning(!loaded.isSolved);
    setSelectedSymbolId(loaded.isSolved ? null : loaded.selectedSymbolId);
    setSelectedCellId(null);
    setIsSolveBulletinOpen(false);
    setIsArticleOpen(false);
    setIsResetLettersOpen(false);
    setCaseFileToastPuzzle(null);
    postToAndroidApp({
      type: 'SHEET_STACK',
      depth:
        Number(isBureauDeskOpen) +
        Number(isCaseFileOpen) +
        Number(isLeaderboardOpen) +
        Number(isNewspaperClippingOpen) +
        Number(isArchiveOpen) +
        Number(isHowToPlayOpen),
    });
  }

  const boardReady = progressReadyId === currentPuzzle.id;
  const boardSolved = boardReady && isSolved;
  const boardMappings = boardReady ? mappings : {};

  const cipherAlphabet = useMemo(() => {
    return buildCipherAlphabet(currentPuzzle.id + currentPuzzle.originalText, isHardPuzzle(currentPuzzle));
  }, [currentPuzzle]);

  const words = useMemo(() => {
    return parseCryptogramText(currentPuzzle.originalText, cipherAlphabet);
  }, [currentPuzzle, cipherAlphabet]);

  const symbolFrequencies = useMemo(() => {
    const freqs = calculateSymbolFrequencies(words, cipherAlphabet);
    return freqs.map((f) => ({
      ...f,
      mappedLetter: boardMappings[f.symbolId] || '',
    }));
  }, [words, cipherAlphabet, boardMappings]);

  // Unique symbols list
  const uniqueSymbols = useMemo(() => {
    const syms: { symbolId: string; targetLetter: string }[] = [];
    const seen = new Set<string>();
    words.forEach((w) => {
      w.symbols.forEach((s) => {
        if (!s.isPunctuation && !seen.has(s.symbolId)) {
          seen.add(s.symbolId);
          syms.push({ symbolId: s.symbolId, targetLetter: s.targetLetter });
        }
      });
    });
    return syms;
  }, [words]);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    setDeskArmed(false);
  }, [currentPuzzle.id]);

  // Auto-load or reset state on puzzle change
  useEffect(() => {
    if (isSolved) {
      setSelectedSymbolId(null);
      setSelectedCellId(null);
      setSolvedPuzzleIds((prev) => {
        if (prev.includes(currentPuzzle.id)) return prev;
        const next = [...prev, currentPuzzle.id];
        localStorage.setItem('cryptogram_solved_ids', JSON.stringify(next));
        return next;
      });
    } else if (uniqueSymbols.length > 0) {
      setSelectedSymbolId((prev) =>
        prev && uniqueSymbols.some((s) => s.symbolId === prev) ? prev : uniqueSymbols[0].symbolId
      );
      setSelectedCellId(null);
    }
  }, [currentPuzzle.id]);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const sync = () => {
      setViewportKeyboard(window.innerHeight - viewport.height > 120);
    };
    sync();
    viewport.addEventListener('resize', sync);
    viewport.addEventListener('scroll', sync);
    return () => {
      viewport.removeEventListener('resize', sync);
      viewport.removeEventListener('scroll', sync);
    };
  }, []);

  useEffect(() => {
    if (!boardReady || isSolved || uniqueSymbols.length === 0) return;
    if (!solvedPuzzleIds.includes(currentPuzzle.id)) return;
    setMappings(decodedMappings(uniqueSymbols));
    setIsSolved(true);
    setIsTimerRunning(false);
  }, [boardReady, isSolved, solvedPuzzleIds, currentPuzzle.id, uniqueSymbols]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const localSolved = readSolvedPuzzleIds();
        const savedStats = localStorage.getItem('cryptogram_stats');
        const localStats = savedStats ? JSON.parse(savedStats) : DEFAULT_GAME_STATS;
        const localProgress = readAllLocalProgress();
        const profile = await loadUserProfile(user.uid);
        if (cancelled) return;
        const nextSolved = mergeSolvedIds(localSolved, profile?.solvedPuzzleIds || []);
        const nextStats = mergeGameStats(localStats, profile?.gameStats || null);
        setSolvedPuzzleIds(nextSolved);
        setGameStats(nextStats);
        localStorage.setItem('cryptogram_solved_ids', JSON.stringify(nextSolved));
        localStorage.setItem('cryptogram_stats', JSON.stringify(nextStats));
        await ensureUserProfile(user, nextStats, nextSolved);
        if (cancelled) return;
        await importLocalProgressToCloud(user.uid, localProgress, nextSolved, INITIAL_PUZZLES);
        if (cancelled) return;
        const solverName =
          localStorage.getItem('cryptogram_codename') || user.displayName || 'Anonymous';
        await Promise.all(
          nextSolved.map((puzzleId) => {
            const puzzle = INITIAL_PUZZLES.find((item) => item.id === puzzleId);
            if (!puzzle) return null;
            const progress = readLocalProgress(puzzleId);
            if (!progress?.isSolved || progress.timerSeconds < 0.1) return null;
            return recordPuzzleSolve(
              user.uid,
              puzzleId,
              progress.timerSeconds,
              progress.hintsUsed,
              100,
              solverName
            ).catch(() => undefined);
          })
        );
      } catch {
        return;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
      const cloud = await loadCloudProgress(user.uid, currentPuzzle.id);
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
      const localWallet = reconcileDailyHints(currentPuzzle.editionDate, allPuzzles);
      const cloudWallet = await loadCloudDailyHints(user.uid, currentPuzzle.editionDate);
      const localChecks = reconcileDailyChecks(currentPuzzle.editionDate, allPuzzles);
      const cloudChecks = await loadCloudDailyChecks(user.uid, currentPuzzle.editionDate);
      if (cancelled) return;
      const wallet = mergeDailyHints(localWallet, cloudWallet, currentPuzzle.editionDate);
      const checkWallet = mergeDailyHints(localChecks, cloudChecks, currentPuzzle.editionDate);
      const stored = {
        ...next,
        hintsRemaining: wallet.remaining,
        checksRemaining: checkWallet.remaining,
      };
      writeLocalDailyHints(wallet);
      writeLocalDailyChecks(checkWallet);
      writeLocalProgress(currentPuzzle.id, stored);
      saveCloudProgress(user.uid, currentPuzzle.id, stored).catch(() => undefined);
      saveCloudDailyHints(user.uid, wallet).catch(() => undefined);
      saveCloudDailyChecks(user.uid, checkWallet).catch(() => undefined);
      setMappings(next.mappings || {});
      setTimerSeconds(next.timerSeconds || 0);
      setHintsUsed(next.hintsUsed || 0);
      setHintsRemaining(wallet.remaining);
      setHintedSymbolIds(hintedSymbolIds);
      setChecksUsed(next.checksUsed || 0);
      setChecksRemaining(checkWallet.remaining);
      setVerifiedSymbolIds(verifiedSymbolIds);
      setFlaggedSymbolIds(next.flaggedSymbolIds);
      setIsSolved(next.isSolved || false);
      setIsTimerRunning(!next.isSolved);
      if (!next.isSolved) {
        setSelectedSymbolId(clipSelectedSymbolId(next.selectedSymbolId));
      }
      if (next.isSolved) {
        const solverName =
          localStorage.getItem('cryptogram_codename') || user.displayName || 'Anonymous';
        recordPuzzleSolve(
          user.uid,
          currentPuzzle.id,
          next.timerSeconds,
          next.hintsUsed,
          100,
          solverName
        ).catch(() => undefined);
        startedPuzzlesRef.current.add(currentPuzzle.id);
      }
      } catch {
        return;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, currentPuzzle.id, currentPuzzle.editionDate, uniqueSymbols, solvedPuzzleIds, allPuzzles]);

  useEffect(() => {
    if (!isTimerRunning || isSolved) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => +(prev + 0.1).toFixed(1));
    }, 100);
    return () => clearInterval(interval);
  }, [isTimerRunning, isSolved]);

  // Save progress automatically
  useEffect(() => {
    if (progressReadyId !== currentPuzzle.id || uniqueSymbols.length === 0) return;
    writeLocalProgress(currentPuzzle.id, {
      mappings,
      timerSeconds,
      hintsUsed,
      hintsRemaining,
      hintedSymbolIds,
      checksUsed,
      checksRemaining,
      verifiedSymbolIds,
      flaggedSymbolIds,
      selectedSymbolId,
      isSolved,
    });
  }, [progressReadyId, mappings, timerSeconds, hintsUsed, hintsRemaining, hintedSymbolIds, checksUsed, checksRemaining, verifiedSymbolIds, flaggedSymbolIds, selectedSymbolId, isSolved, currentPuzzle.id, uniqueSymbols]);

  useEffect(() => {
    if (!user || uniqueSymbols.length === 0 || progressReadyId !== currentPuzzle.id) return;
    const handle = window.setTimeout(() => {
      saveCloudProgress(user.uid, currentPuzzle.id, {
        mappings,
        timerSeconds,
        hintsUsed,
        hintsRemaining,
        hintedSymbolIds,
        checksUsed,
        checksRemaining,
        verifiedSymbolIds,
        flaggedSymbolIds,
        selectedSymbolId,
        isSolved,
      }).catch(() => undefined);
    }, 1500);
    return () => window.clearTimeout(handle);
  }, [user, progressReadyId, currentPuzzle.id, mappings, hintsUsed, hintsRemaining, hintedSymbolIds, checksUsed, checksRemaining, verifiedSymbolIds, flaggedSymbolIds, selectedSymbolId, isSolved, uniqueSymbols.length]);

  useEffect(() => {
    if (!user || isSolved || Object.keys(mappings).length === 0) return;
    if (progressReadyId !== currentPuzzle.id) return;
    if (startedPuzzlesRef.current.has(currentPuzzle.id)) return;
    startedPuzzlesRef.current.add(currentPuzzle.id);
    recordPuzzleStart(user.uid, currentPuzzle.id).catch(() => {
      startedPuzzlesRef.current.delete(currentPuzzle.id);
    });
  }, [user, mappings, currentPuzzle.id, isSolved, progressReadyId]);

  const accuracy = useMemo(() => {
    let correct = 0;
    let totalMapped = 0;
    uniqueSymbols.forEach((s) => {
      if (mappings[s.symbolId]) {
        totalMapped++;
        if (mappings[s.symbolId] === s.targetLetter) {
          correct++;
        }
      }
    });
    if (totalMapped === 0) return 100;
    return Math.round((correct / totalMapped) * 100);
  }, [uniqueSymbols, mappings]);

  useEffect(() => {
    if (!boardReady || uniqueSymbols.length === 0 || isSolved || progressReadyId !== currentPuzzle.id) return;

    const allMapped = uniqueSymbols.every((s) => Boolean(mappings[s.symbolId]));
    if (!allMapped) return;

    const allCorrect = uniqueSymbols.every((s) => mappings[s.symbolId] === s.targetLetter);
    if (allCorrect) {
      setIsSolved(true);
      setIsTimerRunning(false);
      setIsSolveBulletinOpen(true);
      setSelectedSymbolId(null);
      setSelectedCellId(null);
      dismissMobileKeyboard(hiddenInputRef.current);
      if (fragmentsUpdatedByPuzzle(currentPuzzle).length > 0) {
        setCaseFileToastPuzzle(currentPuzzle);
      }
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

      const nextSolved = Array.from(new Set([...solvedPuzzleIds, currentPuzzle.id]));
      setSolvedPuzzleIds(nextSolved);
      localStorage.setItem('cryptogram_solved_ids', JSON.stringify(nextSolved));

      const next: GameStats = {
        ...gameStats,
        puzzlesSolved: gameStats.puzzlesSolved + 1,
        currentStreak: gameStats.currentStreak + 1,
        maxStreak: Math.max(gameStats.maxStreak, gameStats.currentStreak + 1),
        fastestTime:
          gameStats.fastestTime === null
            ? timerSeconds
            : Math.min(gameStats.fastestTime, timerSeconds),
        totalTimePlayed: gameStats.totalTimePlayed + timerSeconds,
      };
      setGameStats(next);
      localStorage.setItem('cryptogram_stats', JSON.stringify(next));

      if (user) {
        const solverName =
          localStorage.getItem('cryptogram_codename') || user.displayName || 'Anonymous';
        recordPuzzleSolve(
          user.uid,
          currentPuzzle.id,
          timerSeconds,
          hintsUsed,
          accuracy,
          solverName
        ).catch(() => undefined);
        saveUserProfile(user.uid, next, nextSolved).catch(() => undefined);
        saveCloudProgress(user.uid, currentPuzzle.id, {
          mappings,
          timerSeconds,
          hintsUsed,
          hintsRemaining,
          hintedSymbolIds,
          checksUsed,
          checksRemaining,
          verifiedSymbolIds,
          flaggedSymbolIds,
          selectedSymbolId: null,
          isSolved: true,
        }).catch(() => undefined);
      }
    }
  }, [mappings, uniqueSymbols, isSolved, currentPuzzle, timerSeconds, user, hintsUsed, hintedSymbolIds, checksUsed, checksRemaining, verifiedSymbolIds, flaggedSymbolIds, accuracy, solvedPuzzleIds, hintsRemaining, gameStats, progressReadyId]);

  // Handle Letter Input (Applies to ALL instances of the selected symbol across the message)
  const handleKeyPress = useCallback(
    (letter: string) => {
      if (!selectedSymbolId || !boardReady || isSolved) return;
      if (hintedSymbolIds.includes(selectedSymbolId) || verifiedSymbolIds.includes(selectedSymbolId)) return;
      webTypeFeel('key');

      const upper = letter.toUpperCase();
      const nextMappings = {
        ...mappings,
        [selectedSymbolId]: upper,
      };
      setMappings(nextMappings);
      setFlaggedSymbolIds((prev) => prev.filter((id) => id !== selectedSymbolId));

      if (uniqueSymbols.every((s) => nextMappings[s.symbolId] === s.targetLetter)) {
        dismissMobileKeyboard(hiddenInputRef.current);
      }

      const nextCell = nextOpenCell(letterCells(words), selectedSymbolId, selectedCellId, nextMappings);
      if (nextCell) {
        setSelectedSymbolId(nextCell.symbolId);
        setSelectedCellId(nextCell.cellId);
      }
    },
    [selectedSymbolId, selectedCellId, isSolved, boardReady, uniqueSymbols, mappings, words, hintedSymbolIds, verifiedSymbolIds]
  );

  const handleBackspace = useCallback(() => {
    if (!selectedSymbolId || !boardReady || isSolved) return;
    if (hintedSymbolIds.includes(selectedSymbolId) || verifiedSymbolIds.includes(selectedSymbolId)) return;
    if (mappings[selectedSymbolId]) {
      setMappings((prev) => {
        const next = { ...prev };
        delete next[selectedSymbolId];
        return next;
      });
      setFlaggedSymbolIds((prev) => prev.filter((id) => id !== selectedSymbolId));
      return;
    }
    const prior = previousCell(letterCells(words), selectedSymbolId, selectedCellId);
    if (!prior || hintedSymbolIds.includes(prior.symbolId) || verifiedSymbolIds.includes(prior.symbolId)) return;
    setSelectedSymbolId(prior.symbolId);
    setSelectedCellId(prior.cellId);
    setMappings((prev) => {
      const next = { ...prev };
      delete next[prior.symbolId];
      return next;
    });
    setFlaggedSymbolIds((prev) => prev.filter((id) => id !== prior.symbolId));
  }, [selectedSymbolId, selectedCellId, isSolved, boardReady, mappings, words, hintedSymbolIds, verifiedSymbolIds]);

  useEffect(() => {
    if (!isAndroidAppShell()) return;
    const onCipher = (event: Event) => {
      const detail = (event as CustomEvent<{ type?: string; letter?: string }>).detail;
      if (detail?.type === 'KEY' && detail.letter) handleKeyPress(detail.letter);
      if (detail?.type === 'BACKSPACE') handleBackspace();
      if (detail?.type === 'SHOW') setDeskArmed(true);
      if (detail?.type === 'BLUR') setDeskArmed(false);
    };
    window.addEventListener('chronicle-native-cipher', onCipher);
    return () => window.removeEventListener('chronicle-native-cipher', onCipher);
  }, [handleKeyPress, handleBackspace]);

  const handleClearSymbol = useCallback(() => {
    handleBackspace();
  }, [handleBackspace]);

  const handleResetMappings = useCallback(() => {
    setIsResetLettersOpen(true);
  }, []);

  const confirmResetMappings = useCallback(() => {
    const locked = clipHintedSymbolIds([...hintedSymbolIds, ...verifiedSymbolIds]);
    setMappings(withHintedMappings(currentPuzzle, {}, locked));
    setFlaggedSymbolIds([]);
    setIsResetLettersOpen(false);
  }, [currentPuzzle, hintedSymbolIds, verifiedSymbolIds]);

  const handleUseHint = useCallback(() => {
    if (hintsRemaining <= 0 || !boardReady || isSolved || !selectedSymbolId) return;

    const targetSymbol = uniqueSymbols.find((s) => s.symbolId === selectedSymbolId);
    if (!targetSymbol || mappings[targetSymbol.symbolId] === targetSymbol.targetLetter) return;
    if (hintedSymbolIds.includes(targetSymbol.symbolId) || verifiedSymbolIds.includes(targetSymbol.symbolId)) return;

    const nextHinted = clipHintedSymbolIds([...hintedSymbolIds, targetSymbol.symbolId]);
    const nextUsed = Math.max(hintsUsed + 1, nextHinted.length);
    const nextRemaining = Math.max(0, hintsRemaining - 1);
    const nextMappings = {
      ...mappings,
      [targetSymbol.symbolId]: targetSymbol.targetLetter,
    };
    const nextFlagged = flaggedSymbolIds.filter((id) => id !== targetSymbol.symbolId);
    const progress = {
      mappings: nextMappings,
      timerSeconds,
      hintsUsed: nextUsed,
      hintsRemaining: nextRemaining,
      hintedSymbolIds: nextHinted,
      checksUsed,
      checksRemaining,
      verifiedSymbolIds,
      flaggedSymbolIds: nextFlagged,
      selectedSymbolId,
      isSolved,
    };
    const wallet = clipDailyWallet(currentPuzzle.editionDate, DAILY_HINTS - nextRemaining);
    setHintedSymbolIds(nextHinted);
    setHintsUsed(nextUsed);
    setHintsRemaining(nextRemaining);
    setFlaggedSymbolIds(nextFlagged);
    setMappings(nextMappings);
    writeLocalProgress(currentPuzzle.id, progress);
    writeLocalDailyHints(wallet);
    if (user) {
      saveCloudProgress(user.uid, currentPuzzle.id, progress).catch(() => undefined);
      saveCloudDailyHints(user.uid, wallet).catch(() => undefined);
    }
  }, [
    hintsRemaining,
    isSolved,
    boardReady,
    uniqueSymbols,
    mappings,
    selectedSymbolId,
    hintedSymbolIds,
    verifiedSymbolIds,
    flaggedSymbolIds,
    hintsUsed,
    checksUsed,
    checksRemaining,
    timerSeconds,
    currentPuzzle.editionDate,
    currentPuzzle.id,
    user,
  ]);

  const handleCheckLetter = useCallback(() => {
    if (checksRemaining <= 0 || !boardReady || isSolved || !selectedSymbolId) return;

    const targetSymbol = uniqueSymbols.find((s) => s.symbolId === selectedSymbolId);
    if (!targetSymbol) return;
    const mapped = mappings[targetSymbol.symbolId];
    if (!mapped) return;
    if (hintedSymbolIds.includes(targetSymbol.symbolId) || verifiedSymbolIds.includes(targetSymbol.symbolId)) return;
    if (flaggedSymbolIds.includes(targetSymbol.symbolId)) return;

    const correct = mapped === targetSymbol.targetLetter;
    const nextVerified = correct
      ? clipHintedSymbolIds([...verifiedSymbolIds, targetSymbol.symbolId])
      : verifiedSymbolIds;
    const nextFlagged = correct
      ? flaggedSymbolIds.filter((id) => id !== targetSymbol.symbolId)
      : clipHintedSymbolIds([...flaggedSymbolIds, targetSymbol.symbolId]);
    const nextUsed = Math.max(checksUsed + 1, nextVerified.length);
    const nextRemaining = Math.max(0, checksRemaining - 1);
    const progress = {
      mappings,
      timerSeconds,
      hintsUsed,
      hintsRemaining,
      hintedSymbolIds,
      checksUsed: nextUsed,
      checksRemaining: nextRemaining,
      verifiedSymbolIds: nextVerified,
      flaggedSymbolIds: nextFlagged,
      selectedSymbolId,
      isSolved,
    };
    const wallet = clipDailyWallet(currentPuzzle.editionDate, DAILY_CHECKS - nextRemaining);
    setVerifiedSymbolIds(nextVerified);
    setFlaggedSymbolIds(nextFlagged);
    setChecksUsed(nextUsed);
    setChecksRemaining(nextRemaining);
    writeLocalProgress(currentPuzzle.id, progress);
    writeLocalDailyChecks(wallet);
    if (user) {
      saveCloudProgress(user.uid, currentPuzzle.id, progress).catch(() => undefined);
      saveCloudDailyChecks(user.uid, wallet).catch(() => undefined);
    }
  }, [
    checksRemaining,
    isSolved,
    boardReady,
    uniqueSymbols,
    mappings,
    selectedSymbolId,
    hintedSymbolIds,
    verifiedSymbolIds,
    flaggedSymbolIds,
    checksUsed,
    hintsUsed,
    hintsRemaining,
    timerSeconds,
    currentPuzzle.editionDate,
    currentPuzzle.id,
    user,
  ]);

  // Physical Keyboard Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!boardReady || isSolved) return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return;
      }

      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        handleBackspace();
      } else if (/^[a-zA-Z]$/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        handleKeyPress(e.key.toUpperCase());
      } else if (e.key === 'ArrowRight' || e.key === 'Tab') {
        e.preventDefault();
        if (uniqueSymbols.length > 0) {
          const currentIdx = uniqueSymbols.findIndex((s) => s.symbolId === selectedSymbolId);
          const nextIdx = (currentIdx + 1) % uniqueSymbols.length;
          setSelectedSymbolId(uniqueSymbols[nextIdx].symbolId);
          setSelectedCellId(null);
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (uniqueSymbols.length > 0) {
          const currentIdx = uniqueSymbols.findIndex((s) => s.symbolId === selectedSymbolId);
          const prevIdx = (currentIdx - 1 + uniqueSymbols.length) % uniqueSymbols.length;
          setSelectedSymbolId(uniqueSymbols[prevIdx].symbolId);
          setSelectedCellId(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyPress, handleBackspace, uniqueSymbols, selectedSymbolId, isSolved, boardReady]);

  const togglePaper = () => {
    setDarkPaper(toggleDeskTheme());
  };

  const toggleKeyboard = () => {
    const next = toggleGameKeyboard();
    setGameKeyboard(next);
    if (!boardReady || isSolved) return;
    if (next) {
      dismissMobileKeyboard(hiddenInputRef.current);
      if (selectedSymbolId) setDeskArmed(true);
      return;
    }
    if (!selectedSymbolId) return;
    setDeskArmed(true);
    if (isAndroidAppShell()) {
      postToAndroidApp({ type: 'CIPHER_FOCUS' });
      return;
    }
    hiddenInputRef.current?.focus();
  };

  const handleSelectDifficulty = (mode: 'Easy' | 'Hard') => {
    if (mode === 'Hard' && !isHardUnlocked) return;

    // Look for puzzle on the same edition date with matching mode
    const sameDayPuzzle = allPuzzles.find(
      (p) =>
        p.editionDate === currentPuzzle.editionDate &&
        (p.difficultyMode === mode ||
          (mode === 'Easy' ? p.difficulty === 'Beginner' || p.difficulty === 'Easy' : p.difficulty === 'Hard' || p.difficulty === 'Master' || p.difficulty === 'Intermediate'))
    );
    if (sameDayPuzzle) {
      setCurrentPuzzle(sameDayPuzzle);
    } else {
      const anyMatching = allPuzzles.find(
        (p) =>
          p.difficultyMode === mode ||
          (mode === 'Easy' ? p.difficulty === 'Beginner' || p.difficulty === 'Easy' : p.difficulty === 'Hard' || p.difficulty === 'Master')
      );
      if (anyMatching) setCurrentPuzzle(anyMatching);
    }
  };

  const shouldOfferBureauDesk = () => {
    if (bureauDeskSeen()) return false;
    const needCreds = configured && !identified;
    const needDispatch = deliverySupported && !deliverySubscribed && !deliveryBlocked;
    return needCreds || needDispatch;
  };

  const showBureauDesk = (after?: () => void) => {
    bureauAfterRef.current = after || null;
    setIsBureauDeskOpen(true);
  };

  const openBureauDesk = (after?: () => void) => {
    if (!shouldOfferBureauDesk()) {
      after?.();
      return;
    }
    showBureauDesk(after);
  };

  const closeBureauDesk = () => {
    if (!bureauPreview) markBureauDeskSeen();
    setBureauPreview(false);
    setIsBureauDeskOpen(false);
    const after = bureauAfterRef.current;
    bureauAfterRef.current = null;
    after?.();
  };

  const closeCaseFile = () => {
    setIsCaseFileOpen(false);
    setCaseFileFocusId(null);
    setCaseFileFocusKey(null);
  };

  const closeSolveBulletin = () => {
    setIsSolveBulletinOpen(false);
    openBureauDesk();
  };

  const sheetDepth =
    Number(Boolean(caseFileToastPuzzle)) +
    Number(isResetLettersOpen) +
    Number(isBureauDeskOpen) +
    Number(isCaseFileOpen) +
    Number(isLeaderboardOpen) +
    Number(isNewspaperClippingOpen) +
    Number(isSolveBulletinOpen) +
    Number(isArchiveOpen) +
    Number(isHowToPlayOpen) +
    Number(isArticleOpen);
  const sheetLocked = sheetDepth > Number(Boolean(caseFileToastPuzzle));

  const closeTopSheet = () => {
    const report = (opened = 0) => {
      postToAndroidApp({ type: 'SHEET_STACK', depth: Math.max(0, sheetDepth - 1 + opened) });
    };
    if (caseFileToastPuzzle) {
      setCaseFileToastPuzzle(null);
      report();
      return true;
    }
    if (isResetLettersOpen) {
      setIsResetLettersOpen(false);
      report();
      return true;
    }
    if (isBureauDeskOpen) {
      closeBureauDesk();
      report();
      return true;
    }
    if (isCaseFileOpen) {
      closeCaseFile();
      report();
      return true;
    }
    if (isLeaderboardOpen) {
      setIsLeaderboardOpen(false);
      report();
      return true;
    }
    if (isNewspaperClippingOpen) {
      setIsNewspaperClippingOpen(false);
      report();
      return true;
    }
    if (isSolveBulletinOpen) {
      closeSolveBulletin();
      report(shouldOfferBureauDesk() ? 1 : 0);
      return true;
    }
    if (isArchiveOpen) {
      setIsArchiveOpen(false);
      report();
      return true;
    }
    if (isHowToPlayOpen) {
      setIsHowToPlayOpen(false);
      report();
      return true;
    }
    if (isArticleOpen) {
      setIsArticleOpen(false);
      report();
      return true;
    }
    return false;
  };

  const closeTopSheetRef = useRef(closeTopSheet);
  closeTopSheetRef.current = closeTopSheet;
  const sheetHistPushed = useRef(false);

  useEffect(() => {
    postToAndroidApp({ type: 'SHEET_STACK', depth: sheetDepth });
  }, [sheetDepth]);

  useEffect(() => {
    if (isAndroidAppShell()) return;
    const stacked = Boolean(
      window.history.state && (window.history.state as { chronicleSheet?: boolean }).chronicleSheet
    );
    if (sheetDepth > 0) {
      if (stacked) {
        window.history.replaceState({ chronicleSheet: true }, '');
      } else {
        window.history.pushState({ chronicleSheet: true }, '');
        sheetHistPushed.current = true;
      }
      return;
    }
    if (sheetHistPushed.current && stacked) {
      sheetHistPushed.current = false;
      window.history.back();
      return;
    }
    sheetHistPushed.current = false;
    if (stacked) window.history.replaceState(null, '');
  }, [sheetDepth]);

  useDialogFocus(sheetDepth);

  useEffect(() => {
    const focusedField = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
    };
    const onAndroidBack = () => {
      closeTopSheetRef.current();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || focusedField(event.target)) return;
      if (closeTopSheetRef.current()) event.preventDefault();
    };
    const onPop = () => {
      if (isAndroidAppShell()) return;
      closeTopSheetRef.current();
    };
    window.addEventListener('chronicle-android-back', onAndroidBack);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('chronicle-android-back', onAndroidBack);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('popstate', onPop);
    };
  }, []);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const onKey = (e: KeyboardEvent) => {
      if (!e.shiftKey || !(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'b') return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return;
      }
      e.preventDefault();
      setBureauPreview(true);
      showBureauDesk();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleSelectPuzzle = (puzzle: PuzzleData) => {
    if (puzzle.editionDate > publishedThroughDate(INITIAL_PUZZLES)) return;
    if (
      isNightEdition(puzzle) &&
      !isNightUnlockedForDate(allPuzzles, solvedPuzzleIds, puzzle.editionDate)
    ) {
      return;
    }
    if (
      shouldOfferBureauDesk() &&
      currentPuzzle.editionNumber === 1 &&
      isMorningEdition(currentPuzzle) &&
      puzzle.id !== currentPuzzle.id
    ) {
      openBureauDesk(() => setCurrentPuzzle(puzzle));
      return;
    }
    setCurrentPuzzle(puzzle);
  };

  const handleOpenTodayEdition = () => {
    const todayMorning = currentMorningPuzzle(INITIAL_PUZZLES);
    if (todayMorning) setCurrentPuzzle(todayMorning);
    setIsSolveBulletinOpen(false);
  };

  const handleOpenDayOne = () => {
    const dayOne = firstCasePuzzle(INITIAL_PUZZLES);
    if (dayOne) setCurrentPuzzle(dayOne);
    setIsSolveBulletinOpen(false);
  };

  const handleNextPuzzle = () => {
    const cutoff = publishedThroughDate(INITIAL_PUZZLES);
    const published = INITIAL_PUZZLES.filter((puzzle) => puzzle.editionDate <= cutoff);
    const currentIdx = published.findIndex((p) => p.id === currentPuzzle.id);
    if (currentIdx === -1) return;
    const nextIdx = (currentIdx + 1) % published.length;
    setCurrentPuzzle(published[nextIdx]);
    setIsNewspaperClippingOpen(false);
  };

  // Determine if Hard mode is unlocked for the current date
  const isHardUnlocked = useMemo(() => {
    return solvedPuzzleIds.some((id) => {
      const p = allPuzzles.find((puzzle) => puzzle.id === id);
      return (
        p &&
        p.editionDate === currentPuzzle.editionDate &&
        (p.difficultyMode === 'Easy' || p.difficulty === 'Easy' || p.difficulty === 'Beginner')
      );
    });
  }, [solvedPuzzleIds, allPuzzles, currentPuzzle.editionDate]);

  const nightEdition = isNightEdition(currentPuzzle);
  useEffect(() => {
    document.documentElement.classList.toggle('is-night', nightEdition);
    document.body.classList.toggle('is-night', nightEdition);
    return () => {
      document.documentElement.classList.remove('is-night');
      document.body.classList.remove('is-night');
    };
  }, [nightEdition]);
  const todayEdition = currentMorningPuzzle(INITIAL_PUZZLES);
  const offerStoryCatchUp =
    isPrimerPuzzle(currentPuzzle) &&
    storyHasBegun(INITIAL_PUZZLES) &&
    !hasSolvedStoryPuzzle(allPuzzles, solvedPuzzleIds);
  const showCaseFiles = hasDecodedFragments(INITIAL_PUZZLES, solvedPuzzleIds);
  const deskCompact = !isSolved && (deskArmed || viewportKeyboard);
  const editionUpdate = useEditionUpdate();

  const handleSelectSymbol = useCallback(
    (symId: string, cellId?: string) => {
      if (!boardReady || isSolved) return;
      setSelectedSymbolId(symId);
      setSelectedCellId(cellId ?? null);
      webTypeFeel('tap');
      setDeskArmed(true);
      if (gameKeyboard) return;
      if (isAndroidAppShell()) {
        postToAndroidApp({ type: 'CIPHER_FOCUS' });
        return;
      }
      hiddenInputRef.current?.focus();
    },
    [boardReady, isSolved, gameKeyboard]
  );

  useEffect(() => {
    if (!selectedSymbolId || isSolved || !boardReady) return;
    const nativeDesk = isAndroidAppShell();
    const input = hiddenInputRef.current;
    const anchor = (scroll: boolean) => {
      if (!gameKeyboard && !nativeDesk && input) placeCipherInput(selectedSymbolId, input, selectedCellId);
      if (scroll) {
        selectedGlyphTile(selectedSymbolId, selectedCellId)?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    };

    anchor(true);
    const later = window.setTimeout(() => anchor(true), 380);
    const onMove = () => anchor(false);
    window.addEventListener('scroll', onMove, true);
    const viewport = window.visualViewport;
    viewport?.addEventListener('resize', onMove);
    viewport?.addEventListener('scroll', onMove);
    return () => {
      window.clearTimeout(later);
      window.removeEventListener('scroll', onMove, true);
      viewport?.removeEventListener('resize', onMove);
      viewport?.removeEventListener('scroll', onMove);
    };
  }, [selectedSymbolId, selectedCellId, isSolved, boardReady, deskCompact, gameKeyboard]);

  return (
    <div
      className={`noir-newspaper-bg min-h-screen flex flex-col justify-between selection:bg-stone-300 selection:text-stone-950 ${
        nightEdition ? 'is-night text-stone-950' : 'text-stone-950'
      }`}
    >
      <WoodcutPressFilter />
      {editionUpdate.updateReady && editionUpdate.serverVersion ? (
        <EditionUpdateBanner
          localVersion={editionUpdate.localVersion}
          serverVersion={editionUpdate.serverVersion}
        />
      ) : null}
      <label htmlFor="cipher-letter-input" className="sr-only">
        Type a letter to map the selected cipher glyph
      </label>
      <input
        id="cipher-letter-input"
        ref={hiddenInputRef}
        type="text"
        name="cipher-glyph"
        lang="en"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="characters"
        spellCheck={false}
        inputMode={isSolved || gameKeyboard ? 'none' : 'search'}
        enterKeyHint="done"
        data-1p-ignore="true"
        data-lpignore="true"
        data-form-type="other"
        maxLength={1}
        value=""
        readOnly={isSolved}
        tabIndex={isSolved || gameKeyboard ? -1 : 0}
        inert={sheetLocked}
        onFocus={() => {
          if (!isSolved) setDeskArmed(true);
        }}
        onBlur={() => {
          window.setTimeout(() => {
            if (document.activeElement === hiddenInputRef.current) return;
            if (document.getElementById('cryptogram-board')?.contains(document.activeElement)) {
              if (!gameKeyboard) hiddenInputRef.current?.focus();
              return;
            }
            setDeskArmed(false);
          }, 0);
        }}
        onChange={(e) => {
          const val = e.target.value;
          if (val.length > 0) {
            const char = val[val.length - 1];
            if (/^[a-zA-Z]$/.test(char)) {
              handleKeyPress(char.toUpperCase());
            }
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Backspace' || e.key === 'Delete') {
            e.preventDefault();
            handleBackspace();
          }
        }}
      />
      
      <div
        className={`edition-sheet w-full ${deskCompact ? 'is-desk-compact' : ''} ${
          nightEdition
            ? 'is-night text-stone-950 border-b-4 border-amber-800'
            : 'text-stone-950 border-b-2 border-stone-900'
        }`}
        inert={sheetLocked}
      >
        <Header
          currentPuzzle={currentPuzzle}
          user={identified ? user : null}
          authConfigured={configured}
          onOpenBureau={() => showBureauDesk()}
          onOpenArchive={() => {
            if (
              shouldOfferBureauDesk() &&
              currentPuzzle.editionNumber === 1 &&
              isMorningEdition(currentPuzzle)
            ) {
              openBureauDesk(() => setIsArchiveOpen(true));
              return;
            }
            setIsArchiveOpen(true);
          }}
          onOpenCaseFiles={() => {
            if (!showCaseFiles) return;
            setCaseFileFocusId(null);
            setCaseFileFocusKey(null);
            setCaseFileToastPuzzle(null);
            setIsCaseFileOpen(true);
          }}
          onOpenHandbook={() => setIsHowToPlayOpen(true)}
          showCaseFiles={showCaseFiles}
        />

        <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 pt-3 sm:pt-4 pb-3 sm:pb-5">
          <section className="article-deck relative">
            <button
              type="button"
              onClick={() => setIsArticleOpen(true)}
              className="desk-hit absolute top-0 right-0 z-10 w-8 h-8 flex items-center justify-center border border-stone-800 hover:bg-amber-100 cursor-pointer"
              aria-label="Open article"
            >
              <Search className="w-4 h-4" />
            </button>
            <h2
              className={`text-center px-11 text-[calc(1.5rem+2pt)] sm:text-[calc(1.875rem+2pt)] md:text-[calc(2.25rem+2pt)] font-black tracking-tight uppercase leading-snug ${
                nightEdition ? 'font-letterpress text-stone-950' : 'font-headline text-stone-950'
              }`}
            >
              {currentPuzzle.headline}
            </h2>
            <div className="article-collapse">
              <div>
                <EditionPlate plate={articlePlateId(currentPuzzle)} night={nightEdition} />
                <DropCapParagraph
                  text={articleDek(currentPuzzle)}
                  night={nightEdition}
                  className="article-dek-board font-treatise text-left text-[calc(0.875rem+2pt)] sm:text-[calc(1rem+2pt)] italic mt-1 text-stone-800 leading-[1.65]"
                />
                <p className="mt-2 font-newspaper font-semibold text-[calc(0.875rem+2pt)] sm:text-[calc(1rem+2pt)] text-stone-950">
                  — {articleByline(currentPuzzle)}
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>

      <main
        className="flex-1 w-full min-w-0 max-w-5xl mx-auto px-3 sm:px-6 py-3 sm:py-5 flex flex-col justify-between gap-3"
        inert={sheetLocked}
      >
        {isFirebaseEnabled && boardSolved && (
          <LiveStatsRow puzzleId={currentPuzzle.id} />
        )}

        <section
          className={`flex-1 flex flex-col min-w-0 ${boardSolved ? 'justify-start' : 'justify-center'}`}
          onPointerDown={(event) => {
            if (deskCompact) event.preventDefault();
          }}
        >
          {isPrimerPuzzle(currentPuzzle) && !boardSolved && (
            <PrimerCoach
              words={words}
              mappings={boardMappings}
              isSolved={boardSolved}
            />
          )}
          <CryptogramGrid
            words={words}
            mappings={boardMappings}
            selectedSymbolId={boardReady ? selectedSymbolId : null}
            onSelectSymbol={handleSelectSymbol}
            flaggedSymbolIds={flaggedSymbolIds}
            lockedSymbolIds={clipHintedSymbolIds([...hintedSymbolIds, ...verifiedSymbolIds])}
            isSolved={boardSolved}
            solvedInsert={currentPuzzle.solvedInsert}
            solvedSwap={currentPuzzle.solvedSwap}
            onClearLetters={handleResetMappings}
            onUseHint={handleUseHint}
            onCheckLetter={handleCheckLetter}
            hintsRemaining={hintsRemaining}
            checksRemaining={checksRemaining}
            silhouette={currentPuzzle.silhouette}
            night={nightEdition}
            frequencies={symbolFrequencies}
            deskArmed={deskArmed}
            gameKeyboard={gameKeyboard}
            onLetter={handleKeyPress}
            onBackspace={handleBackspace}
          />
        </section>
      </main>

      {/* Modals */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        currentPuzzleId={currentPuzzle.id}
        currentPuzzleTitle={currentPuzzle.headline}
        puzzles={allPuzzles}
        user={identified ? user : null}
        onSignIn={signIn}
        currentSolveStats={
          isSolved
            ? {
                timeSeconds: timerSeconds,
                timeFormatted: formatTime(timerSeconds),
                hintsUsed,
                accuracy,
              }
            : null
        }
      />

      <TodayStatsBulletin
        isOpen={isSolveBulletinOpen}
        onClose={closeSolveBulletin}
        currentPuzzle={currentPuzzle}
        timerSeconds={timerSeconds}
        onUnlockHardMode={() => handleSelectDifficulty('Hard')}
        onOpenTodayEdition={handleOpenTodayEdition}
        onOpenDayOne={handleOpenDayOne}
        offerStoryCatchUp={offerStoryCatchUp}
        currentEditionNumber={todayEdition?.editionNumber}
      />

      <NewspaperClippingModal
        isOpen={isNewspaperClippingOpen}
        onClose={() => setIsNewspaperClippingOpen(false)}
        puzzle={currentPuzzle}
        timeFormatted={formatTime(timerSeconds)}
        accuracy={accuracy}
        hintsUsed={hintsUsed}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        onNextPuzzle={handleNextPuzzle}
      />

      <ArchiveModal
        isOpen={isArchiveOpen}
        onClose={() => setIsArchiveOpen(false)}
        puzzles={INITIAL_PUZZLES}
        currentPuzzleId={currentPuzzle.id}
        onSelectPuzzle={handleSelectPuzzle}
        solvedPuzzleIds={solvedPuzzleIds}
      />

      <CaseFileModal
        isOpen={isCaseFileOpen}
        onClose={closeCaseFile}
        puzzles={INITIAL_PUZZLES}
        solvedPuzzleIds={solvedPuzzleIds}
        focusCharacterId={caseFileFocusId}
        focusFragmentKey={caseFileFocusKey}
      />

      <CaseFileToast
        puzzle={caseFileToastPuzzle}
        onOpen={() => {
          if (!caseFileToastPuzzle) return;
          const updates = fragmentsUpdatedByPuzzle(caseFileToastPuzzle);
          const first = updates[0];
          setCaseFileFocusId(first?.characterId || 'thorne');
          setCaseFileFocusKey(first ? fragmentKey(first) : null);
          setIsSolveBulletinOpen(false);
          setCaseFileToastPuzzle(null);
          setIsCaseFileOpen(true);
        }}
        onDismiss={() => setCaseFileToastPuzzle(null)}
      />

      <ArticleReaderModal
        isOpen={isArticleOpen}
        onClose={() => setIsArticleOpen(false)}
        headline={currentPuzzle.headline}
        body={articleDek(currentPuzzle)}
        byline={articleByline(currentPuzzle)}
        night={nightEdition}
        plate={articlePlateId(currentPuzzle)}
      />

      <HowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
      />

      <BureauDeskModal
        isOpen={isBureauDeskOpen}
        onClose={closeBureauDesk}
        identified={identified}
        user={identified ? user : null}
        night={isNightEdition(currentPuzzle)}
        gameStats={gameStats}
        authConfigured={bureauPreview ? true : configured}
        authError={authError}
        onIssueCredentials={signIn}
        onSignOut={signOut}
        deliverySupported={bureauPreview ? true : deliverySupported}
        deliverySubscribed={deliverySubscribed}
        deliveryBlocked={bureauPreview || !isAndroidAppShell() ? false : deliveryBlocked}
        deliveryError={deliveryError}
        deliveryCopy={
          isAndroidAppShell()
            ? 'A tap on the shoulder around 8:00 a.m. Eastern when the morning edition hits the stands. That is the only alert we send. You can leave the list any time; the paper still prints if you decline.'
            : 'A local notice the next time you open the paper that day — not a scheduled morning push. You can leave the list any time; the puzzles still run if you decline.'
        }
        onToggleDelivery={toggleDelivery}
        onOpenSettings={openDeliverySettings}
        darkPaper={darkPaper}
        onTogglePaper={togglePaper}
        gameKeyboard={gameKeyboard}
        onToggleKeyboard={toggleKeyboard}
        onDeleteRecords={
          identified && user
            ? async () => {
                await deleteCloudUserData(
                  user.uid,
                  INITIAL_PUZZLES.map((puzzle) => puzzle.id)
                );
                await signOut();
              }
            : undefined
        }
      />

      <ResetLettersModal
        isOpen={isResetLettersOpen}
        onClose={() => setIsResetLettersOpen(false)}
        onConfirm={confirmResetMappings}
      />
    </div>
  );
}
