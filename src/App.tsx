import React, { useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef, lazy, Suspense } from 'react';
import { Header } from './components/Header';
import { CryptogramGrid } from './components/CryptogramGrid';
import { PrimerCoach } from './components/PrimerCoach';
import { INITIAL_PUZZLES } from './data/puzzles';
import type { CaseCharacterId } from './data/caseFiles';
import { PuzzleData, PuzzleProgress, SymbolMapping, GameStats } from './types';
import { isHardPuzzle, isMorningEdition, isNightEdition, isNightUnlocked, isPracticePuzzle, isPrimerPuzzle, matchesMode, articleDek, articleByline, currentMorningPuzzle, morningPuzzleForEdition, nightPuzzleForEdition } from './utils/edition';
import { useCampaignProgress } from './hooks/useCampaignProgress';
import { getInitialPuzzle, loadPuzzleState, withHintedMappings, decodedMappings } from './game/puzzleState';
import { usePuzzleSession } from './hooks/usePuzzleSession';
import { useDailyWalletActions } from './hooks/useDailyWalletActions';
import { useDeskTimer } from './hooks/useDeskTimer';
import { useSolveCelebration } from './hooks/useSolveCelebration';
import { dismissMobileKeyboard, selectedGlyphTile, placeCipherInput, letterCells, nextOpenCell, previousCell, webTypeFeel } from './game/cipherCursor';
import { DeskError, STORAGE_JAMMED, reportDesk } from './utils/deskError';
import { DeskErrorBoundary } from './components/DeskErrorBoundary';
import { useSheetStack } from './hooks/useSheetStack';
import { useCloudDesk } from './hooks/useCloudDesk';
import { createPracticePuzzle } from './data/primerPractice';
import { articlePlateId } from './data/plates';
import { useAuth } from './hooks/useAuth';
import {
  clipHintedSymbolIds,
  persistProgress,
  readGameStats,
  readSolvedPuzzleIds,
  writeSolvedPuzzleIds,
} from './utils/localStore';
import { formatTime } from './utils/formatTime';
import { deskThemeIsDark, toggleDeskTheme } from './utils/deskTheme';
import { useEditionUpdate } from './hooks/useEditionUpdate';
import { Newspaper, WoodcutPressFilter } from './deskIcons';
import { splashBlocksDesk } from './splashGate';
import { isFirebaseEnabled } from './utils/firebaseFlags';
import { useDeskOnline } from './hooks/useDeskOnline';
import {
  bureauDeskSeen,
  markBureauDeskSeen,
  usesGameKeyboard,
  toggleGameKeyboard,
} from './utils/deskPrefs';

const LeaderboardModal = lazy(() =>
  import('./components/LeaderboardModal').then((mod) => ({ default: mod.LeaderboardModal }))
);
const NewspaperClippingModal = lazy(() =>
  import('./components/NewspaperClippingModal').then((mod) => ({ default: mod.NewspaperClippingModal }))
);
const ArchiveModal = lazy(() =>
  import('./components/ArchiveModal').then((mod) => ({ default: mod.ArchiveModal }))
);
const HowToPlayModal = lazy(() =>
  import('./components/HowToPlayModal').then((mod) => ({ default: mod.HowToPlayModal }))
);
const ResetLettersModal = lazy(() =>
  import('./components/ResetLettersModal').then((mod) => ({ default: mod.ResetLettersModal }))
);
const BureauDeskModal = lazy(() =>
  import('./components/BureauDeskModal').then((mod) => ({ default: mod.BureauDeskModal }))
);
const ArticleReaderModal = lazy(() =>
  import('./components/ArticleReaderModal').then((mod) => ({ default: mod.ArticleReaderModal }))
);
const CaseFileModal = lazy(() =>
  import('./components/CaseFileModal').then((mod) => ({ default: mod.CaseFileModal }))
);
const CaseFileToast = lazy(() =>
  import('./components/CaseFileModal').then((mod) => ({ default: mod.CaseFileToast }))
);
const EditionUpdateBanner = lazy(() =>
  import('./components/EditionUpdateBanner').then((mod) => ({ default: mod.EditionUpdateBanner }))
);
const TodayStatsBulletin = lazy(() =>
  import('./components/TodayStatsBulletin').then((mod) => ({ default: mod.TodayStatsBulletin }))
);
const LiveStatsRow = lazy(() =>
  import('./components/TodayStatsBulletin').then((mod) => ({ default: mod.LiveStatsRow }))
);

function prefetchDeskModals() {
  void import('./components/LeaderboardModal');
  void import('./components/ArchiveModal');
  void import('./components/HowToPlayModal');
  void import('./components/BureauDeskModal');
  void import('./components/ArticleReaderModal');
  void import('./components/CaseFileModal');
  void import('./components/NewspaperClippingModal');
  void import('./components/ResetLettersModal');
  void import('./components/TodayStatsBulletin');
  void import('./components/EditionUpdateBanner');
}

function cloudStore() {
  return import('./utils/firebaseStore');
}

const BOOT_PUZZLE = getInitialPuzzle();
const BOOT_STATE = loadPuzzleState(BOOT_PUZZLE);

export default function App() {
  const { user, identified, configured, error: authError, signIn, signOut, deleteAccount } = useAuth();
  const startedPuzzlesRef = useRef<Set<string>>(new Set());
  const boardDirtyRef = useRef(false);
  const [deskNotice, setDeskNotice] = useState<string | null>(null);

  const hiddenInputRef = useRef<HTMLInputElement>(null);

  // Puzzles State
  const allPuzzles = INITIAL_PUZZLES;
  const [currentPuzzle, setCurrentPuzzle] = useState<PuzzleData>(BOOT_PUZZLE);
  const [solvedPuzzleIds, setSolvedPuzzleIds] = useState<string[]>(readSolvedPuzzleIds);
  const [progressReadyId, setProgressReadyId] = useState('');

  const [gameStats, setGameStats] = useState<GameStats>(readGameStats);

  const [darkPaper, setDarkPaper] = useState(deskThemeIsDark);
  const [gameKeyboard, setGameKeyboard] = useState(usesGameKeyboard);
  const [showCaseFiles, setShowCaseFiles] = useState(false);

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

  const [isTimerRunning, setIsTimerRunning] = useState(!BOOT_STATE.isSolved && !splashBlocksDesk());
  const { timerSeconds, getTimerSeconds, commitTimer } = useDeskTimer(
    BOOT_STATE.timerSeconds,
    isTimerRunning && !isSolved
  );

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
  const mappingHistoryRef = useRef<SymbolMapping[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [deskArmed, setDeskArmed] = useState(() => !splashBlocksDesk());
  const [viewportKeyboard, setViewportKeyboard] = useState(false);

  if (progressReadyId !== currentPuzzle.id) {
    const loaded = loadPuzzleState(currentPuzzle, allPuzzles);
    boardDirtyRef.current = false;
    mappingHistoryRef.current = [];
    setCanUndo(false);
    setDeskNotice(null);
    setProgressReadyId(currentPuzzle.id);
    setMappings(loaded.mappings);
    commitTimer(loaded.timerSeconds);
    setHintsUsed(loaded.hintsUsed);
    setHintsRemaining(loaded.hintsRemaining);
    setHintedSymbolIds(loaded.hintedSymbolIds);
    setChecksUsed(loaded.checksUsed);
    setChecksRemaining(loaded.checksRemaining);
    setVerifiedSymbolIds(loaded.verifiedSymbolIds);
    setFlaggedSymbolIds(loaded.flaggedSymbolIds);
    setIsSolved(loaded.isSolved);
    setIsTimerRunning(!loaded.isSolved && !splashBlocksDesk());
    setSelectedSymbolId(loaded.isSolved ? null : loaded.selectedSymbolId);
    setSelectedCellId(null);
    setIsSolveBulletinOpen(false);
    setIsArticleOpen(false);
    setIsResetLettersOpen(false);
    setCaseFileToastPuzzle(null);
  }

  const boardReady = progressReadyId === currentPuzzle.id;
  const boardSolved = boardReady && isSolved;
  const boardMappings = boardReady ? mappings : {};

  const { cipherAlphabet, words, uniqueSymbols, symbolFrequencies } = usePuzzleSession(
    currentPuzzle,
    boardMappings
  );

  const boardProgress = useCallback((overrides: Partial<PuzzleProgress> = {}): PuzzleProgress => ({
    mappings,
    timerSeconds: getTimerSeconds(),
    hintsUsed,
    hintsRemaining,
    hintedSymbolIds,
    checksUsed,
    checksRemaining,
    verifiedSymbolIds,
    flaggedSymbolIds,
    selectedSymbolId,
    isSolved,
    ...overrides,
  }), [
    mappings,
    getTimerSeconds,
    hintsUsed,
    hintsRemaining,
    hintedSymbolIds,
    checksUsed,
    checksRemaining,
    verifiedSymbolIds,
    flaggedSymbolIds,
    selectedSymbolId,
    isSolved,
  ]);

  useCloudDesk({
    user,
    currentPuzzle,
    uniqueSymbols,
    solvedPuzzleIds,
    allPuzzles,
    progressReadyId,
    progress: boardProgress(),
    startedPuzzlesRef,
    boardDirtyRef,
    applyCloudBoard: (next) => {
      setMappings(next.mappings);
      commitTimer(next.timerSeconds);
      setHintsUsed(next.hintsUsed);
      setHintsRemaining(next.hintsRemaining);
      setHintedSymbolIds(next.hintedSymbolIds);
      setChecksUsed(next.checksUsed);
      setChecksRemaining(next.checksRemaining);
      setVerifiedSymbolIds(next.verifiedSymbolIds);
      setFlaggedSymbolIds(next.flaggedSymbolIds);
      setIsSolved(next.isSolved);
      setIsTimerRunning(!next.isSolved);
      if (next.selectedSymbolId !== undefined) setSelectedSymbolId(next.selectedSymbolId);
    },
    setSolvedPuzzleIds,
    setGameStats,
  });

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    setDeskArmed(!isSolved);
  }, [currentPuzzle.id, isSolved]);

  useEffect(() => {
    const enterEdition = () => {
      const next = getInitialPuzzle();
      const loaded = loadPuzzleState(next, allPuzzles);
      setCurrentPuzzle(next);
      setDeskArmed(!loaded.isSolved);
      setIsTimerRunning(!loaded.isSolved);
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };
    window.addEventListener('chronicle-splash-enter', enterEdition);
    return () => window.removeEventListener('chronicle-splash-enter', enterEdition);
  }, []);

  // Auto-load or reset state on puzzle change
  useEffect(() => {
    if (isSolved) {
      setSelectedSymbolId(null);
      setSelectedCellId(null);
      if (isPracticePuzzle(currentPuzzle)) return;
      setSolvedPuzzleIds((prev) => {
        if (prev.includes(currentPuzzle.id)) return prev;
        const next = [...prev, currentPuzzle.id];
        writeSolvedPuzzleIds(next);
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
    const arm = () => prefetchDeskModals();
    if (splashBlocksDesk()) {
      window.addEventListener('chronicle-splash-enter', arm, { once: true });
      return () => window.removeEventListener('chronicle-splash-enter', arm);
    }
    if (typeof requestIdleCallback === 'function') {
      const id = requestIdleCallback(arm, { timeout: 1800 });
      return () => cancelIdleCallback(id);
    }
    const id = window.setTimeout(arm, 1);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void import('./data/caseFiles').then(({ hasDecodedFragments }) => {
      if (!cancelled) setShowCaseFiles(hasDecodedFragments(INITIAL_PUZZLES, solvedPuzzleIds));
    });
    return () => {
      cancelled = true;
    };
  }, [solvedPuzzleIds]);

  const boardProgressRef = useRef(boardProgress);
  boardProgressRef.current = boardProgress;

  useEffect(() => {
    if (!isTimerRunning || isSolved || progressReadyId !== currentPuzzle.id) return;
    const id = window.setInterval(() => {
      persistProgress(currentPuzzle.id, boardProgressRef.current());
    }, 1000);
    return () => window.clearInterval(id);
  }, [isTimerRunning, isSolved, progressReadyId, currentPuzzle.id]);

  // Save progress automatically
  useEffect(() => {
    if (progressReadyId !== currentPuzzle.id || uniqueSymbols.length === 0) return;
    if (!persistProgress(currentPuzzle.id, boardProgress())) {
      reportDesk(
        new DeskError({ layer: 'storage', code: 'storage/quota', userMessage: STORAGE_JAMMED }),
        'storage'
      );
      setDeskNotice(STORAGE_JAMMED);
    }
  }, [progressReadyId, boardProgress, currentPuzzle.id, uniqueSymbols]);

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

  useSolveCelebration({
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
    dismissKeyboard: () => dismissMobileKeyboard(hiddenInputRef.current),
  });

  // Handle Letter Input (Applies to ALL instances of the selected symbol across the message)
  const handleKeyPress = useCallback(
    (letter: string) => {
      if (!selectedSymbolId || !boardReady || isSolved) return;
      if (hintedSymbolIds.includes(selectedSymbolId) || verifiedSymbolIds.includes(selectedSymbolId)) return;
      webTypeFeel('key');

      const upper = letter.toUpperCase();
      boardDirtyRef.current = true;
      mappingHistoryRef.current = [...mappingHistoryRef.current, mappings].slice(-40);
      setCanUndo(true);
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
      mappingHistoryRef.current = [...mappingHistoryRef.current, mappings].slice(-40);
      setCanUndo(true);
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
    mappingHistoryRef.current = [...mappingHistoryRef.current, mappings].slice(-40);
    setCanUndo(true);
    setMappings((prev) => {
      const next = { ...prev };
      delete next[prior.symbolId];
      return next;
    });
    setFlaggedSymbolIds((prev) => prev.filter((id) => id !== prior.symbolId));
  }, [selectedSymbolId, selectedCellId, isSolved, boardReady, mappings, words, hintedSymbolIds, verifiedSymbolIds]);


  const handleResetMappings = useCallback(() => {
    setIsResetLettersOpen(true);
  }, []);

  const confirmResetMappings = useCallback(() => {
    const locked = clipHintedSymbolIds([...hintedSymbolIds, ...verifiedSymbolIds]);
    mappingHistoryRef.current = [...mappingHistoryRef.current, mappings].slice(-40);
    setCanUndo(true);
    setMappings(withHintedMappings(currentPuzzle, {}, locked));
    setFlaggedSymbolIds([]);
    setIsResetLettersOpen(false);
  }, [currentPuzzle, hintedSymbolIds, verifiedSymbolIds, mappings]);

  const handleUndoMapping = useCallback(() => {
    const previous = mappingHistoryRef.current.pop();
    if (!previous) return;
    setCanUndo(mappingHistoryRef.current.length > 0);
    setMappings(previous);
  }, []);

  const onStorageFail = useCallback(() => setDeskNotice(STORAGE_JAMMED), []);
  const { handleUseHint, handleCheckLetter } = useDailyWalletActions({
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
  });

  // Physical Keyboard Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!boardReady || isSolved) return;
      const target = e.target as HTMLElement;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndoMapping();
        return;
      }
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
  }, [handleKeyPress, handleBackspace, handleUndoMapping, uniqueSymbols, selectedSymbolId, isSolved, boardReady]);

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
    hiddenInputRef.current?.focus();
  };

  const handleSelectDifficulty = (mode: 'Easy' | 'Hard') => {
    if (mode === 'Hard' && !isHardUnlocked) return;

    // Look for a puzzle in the same edition with matching mode
    const sameDayPuzzle = allPuzzles.find(
      (p) => p.editionNumber === currentPuzzle.editionNumber && matchesMode(p, mode)
    );
    if (sameDayPuzzle) {
      setCurrentPuzzle(sameDayPuzzle);
    } else {
      const anyMatching = allPuzzles.find((p) => matchesMode(p, mode));
      if (anyMatching) setCurrentPuzzle(anyMatching);
    }
  };

  const shouldOfferBureauDesk = () => {
    if (bureauDeskSeen()) return false;
    return configured && !identified;
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
    if (caseFileToastPuzzle) {
      setCaseFileToastPuzzle(null);
      return true;
    }
    if (isResetLettersOpen) {
      setIsResetLettersOpen(false);
      return true;
    }
    if (isBureauDeskOpen) {
      closeBureauDesk();
      return true;
    }
    if (isCaseFileOpen) {
      closeCaseFile();
      return true;
    }
    if (isLeaderboardOpen) {
      setIsLeaderboardOpen(false);
      return true;
    }
    if (isNewspaperClippingOpen) {
      setIsNewspaperClippingOpen(false);
      return true;
    }
    if (isSolveBulletinOpen) {
      closeSolveBulletin();
      return true;
    }
    if (isArchiveOpen) {
      setIsArchiveOpen(false);
      return true;
    }
    if (isHowToPlayOpen) {
      setIsHowToPlayOpen(false);
      return true;
    }
    if (isArticleOpen) {
      setIsArticleOpen(false);
      return true;
    }
    return false;
  };

  useSheetStack(sheetDepth, closeTopSheet);

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
    if (puzzle.editionNumber > frontPage) return;
    if (
      isNightEdition(puzzle) &&
      !isNightUnlocked(allPuzzles, solvedPuzzleIds, puzzle.editionNumber)
    ) {
      return;
    }
    setCurrentPuzzle(puzzle);
  };

  const handleStartPractice = () => {
    const exclude = isPracticePuzzle(currentPuzzle) ? currentPuzzle.originalText : undefined;
    setCurrentPuzzle(createPracticePuzzle(exclude));
    setIsSolveBulletinOpen(false);
  };

  const handleOpenTodayEdition = () => {
    const frontPageMorning = currentMorningPuzzle(INITIAL_PUZZLES, solvedPuzzleIds);
    if (frontPageMorning) setCurrentPuzzle(frontPageMorning);
    setIsSolveBulletinOpen(false);
  };

  /** Morning -> that edition's Night once unlocked, Night -> the next edition's Morning. */
  const handleNextPuzzle = () => {
    const edition = currentPuzzle.editionNumber;
    const next =
      isMorningEdition(currentPuzzle) && isNightUnlocked(allPuzzles, solvedPuzzleIds, edition)
        ? nightPuzzleForEdition(allPuzzles, edition)
        : edition + 1 <= frontPage
          ? morningPuzzleForEdition(INITIAL_PUZZLES, edition + 1)
          : undefined;
    if (next) setCurrentPuzzle(next);
    setIsNewspaperClippingOpen(false);
  };

  // Determine if Hard mode is unlocked for the current edition
  const isHardUnlocked = useMemo(() => {
    return solvedPuzzleIds.some((id) => {
      const p = allPuzzles.find((puzzle) => puzzle.id === id);
      return (
        p &&
        p.editionNumber === currentPuzzle.editionNumber &&
        matchesMode(p, 'Easy')
      );
    });
  }, [solvedPuzzleIds, allPuzzles, currentPuzzle.editionNumber]);

  const { frontPage, seasonLength, isSeasonComplete, isDemo } = useCampaignProgress(
    INITIAL_PUZZLES,
    solvedPuzzleIds
  );

  const nightEdition = isNightEdition(currentPuzzle);
  useEffect(() => {
    document.documentElement.classList.toggle('is-night', nightEdition);
    document.body.classList.toggle('is-night', nightEdition);
    if (nightEdition && !document.getElementById('fonts-extra')) {
      const extra = document.createElement('link');
      extra.id = 'fonts-extra';
      extra.rel = 'stylesheet';
      extra.href = './fonts-extra.css';
      document.head.appendChild(extra);
    }
    return () => {
      document.documentElement.classList.remove('is-night');
      document.body.classList.remove('is-night');
    };
  }, [nightEdition]);
  const deskCompact = !isSolved && (deskArmed || viewportKeyboard);
  const editionUpdate = useEditionUpdate();
  const deskOnline = useDeskOnline();

  const handleSelectSymbol = useCallback(
    (symId: string, cellId?: string) => {
      if (!boardReady || isSolved) return;
      setSelectedSymbolId(symId);
      setSelectedCellId(cellId ?? null);
      webTypeFeel('tap');
      setDeskArmed(true);
      if (gameKeyboard) return;
      hiddenInputRef.current?.focus();
    },
    [boardReady, isSolved, gameKeyboard]
  );

  useEffect(() => {
    if (!selectedSymbolId || isSolved || !boardReady) return;
    const input = hiddenInputRef.current;
    const pinBoard = deskArmed;
    const anchor = (scroll: boolean) => {
      if (!gameKeyboard && input) placeCipherInput(selectedSymbolId, input, selectedCellId);
      if (scroll && pinBoard) {
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
      <a href="#cryptogram-board" className="skip-to-puzzle">
        Skip to puzzle
      </a>
      {deskNotice ? (
        <p className="font-typewriter text-[13px] uppercase tracking-widest text-center py-2 px-3 bg-[var(--paper-reading)] text-[color:var(--cinnabar)] border-b-2 border-stone-800">
          {deskNotice}
        </p>
      ) : null}
      {editionUpdate.updateReady && editionUpdate.serverVersion ? (
        <Suspense fallback={null}>
          <EditionUpdateBanner
            localVersion={editionUpdate.localVersion}
            serverVersion={editionUpdate.serverVersion}
          />
        </Suspense>
      ) : null}
      <label htmlFor="cipher-letter-input" className="sr-only">
        Ink a letter for the selected cipher mark
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
          isPrimerPuzzle(currentPuzzle) && !isSolved ? 'is-primer' : ''
        } ${
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
          onOpenArchive={() => setIsArchiveOpen(true)}
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

        <div className="w-full edition-measure px-3 sm:px-6 pt-3 sm:pt-4 pb-3 sm:pb-5">
          <section className="article-deck relative">
            <button
              type="button"
              onClick={() => setIsArticleOpen(true)}
              className="desk-hit absolute top-0 right-0 z-10 min-h-8 px-2 inline-flex items-center gap-1 border border-stone-800 bg-[var(--paper)] hover:bg-amber-100 cursor-pointer"
              aria-label="Open the story"
            >
              <Newspaper className="w-3.5 h-3.5" />
              <span className="font-newspaper text-xs font-bold uppercase tracking-widest">Story</span>
            </button>
            <h2
              className={`text-center px-11 text-[calc(1.5rem+2pt)] sm:text-[calc(1.875rem+2pt)] md:text-[calc(2.25rem+2pt)] font-black tracking-tight uppercase leading-snug ${
                nightEdition ? 'font-letterpress text-stone-950' : 'font-headline text-stone-950'
              }`}
            >
              {currentPuzzle.headline}
            </h2>
          </section>
        </div>
      </div>

      <main
        className="flex-1 w-full min-w-0 edition-measure px-3 sm:px-6 py-3 sm:py-5 flex flex-col justify-between gap-3"
        inert={sheetLocked}
      >
        {isFirebaseEnabled && deskOnline && boardSolved && !isPracticePuzzle(currentPuzzle) && (
          <Suspense fallback={null}>
            <LiveStatsRow puzzleId={currentPuzzle.id} />
          </Suspense>
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
              compact={deskCompact}
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
            onClearLetters={handleResetMappings}
            onUndo={handleUndoMapping}
            canUndo={canUndo}
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

      <DeskErrorBoundary variant="sheet">
      <Suspense fallback={null}>
      {isLeaderboardOpen ? (
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        currentPuzzleId={currentPuzzle.id}
        currentPuzzleTitle={currentPuzzle.headline}
        puzzles={allPuzzles}
        user={identified ? user : null}
        onSignIn={signIn}
        currentSolveStats={
          isSolved && !isPracticePuzzle(currentPuzzle)
            ? {
                timeSeconds: timerSeconds,
                timeFormatted: formatTime(timerSeconds),
                hintsUsed,
                accuracy,
              }
            : null
        }
      />
      ) : null}

      {isSolveBulletinOpen ? (
      <TodayStatsBulletin
        isOpen={isSolveBulletinOpen}
        onClose={closeSolveBulletin}
        currentPuzzle={currentPuzzle}
        timerSeconds={timerSeconds}
        onUnlockHardMode={() => handleSelectDifficulty('Hard')}
        onOpenTodayEdition={handleOpenTodayEdition}
        onStartPractice={handleStartPractice}
        isSeasonComplete={isSeasonComplete}
        seasonLength={seasonLength}
        isDemo={isDemo}
        onOpenCaseFiles={() => {
          setCaseFileFocusId(null);
          setCaseFileFocusKey(null);
          setCaseFileToastPuzzle(null);
          setIsCaseFileOpen(true);
        }}
      />
      ) : null}

      {isNewspaperClippingOpen ? (
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
      ) : null}

      {isArchiveOpen ? (
      <ArchiveModal
        isOpen={isArchiveOpen}
        onClose={() => setIsArchiveOpen(false)}
        puzzles={INITIAL_PUZZLES}
        currentPuzzleId={currentPuzzle.id}
        onSelectPuzzle={handleSelectPuzzle}
        onStartPractice={handleStartPractice}
        solvedPuzzleIds={solvedPuzzleIds}
        frontPage={frontPage}
      />
      ) : null}

      {isCaseFileOpen ? (
      <CaseFileModal
        isOpen={isCaseFileOpen}
        onClose={closeCaseFile}
        puzzles={INITIAL_PUZZLES}
        solvedPuzzleIds={solvedPuzzleIds}
        focusCharacterId={caseFileFocusId}
        focusFragmentKey={caseFileFocusKey}
      />
      ) : null}

      {caseFileToastPuzzle ? (
      <CaseFileToast
        puzzle={caseFileToastPuzzle}
        onOpen={() => {
          if (!caseFileToastPuzzle) return;
          const toastPuzzle = caseFileToastPuzzle;
          void import('./data/caseFiles').then(({ fragmentsUpdatedByPuzzle, fragmentKey }) => {
            const updates = fragmentsUpdatedByPuzzle(toastPuzzle);
            const first = updates[0];
            setCaseFileFocusId(first?.characterId || 'thorne');
            setCaseFileFocusKey(first ? fragmentKey(first) : null);
            setIsSolveBulletinOpen(false);
            setCaseFileToastPuzzle(null);
            setIsCaseFileOpen(true);
          });
        }}
        onDismiss={() => setCaseFileToastPuzzle(null)}
      />
      ) : null}

      {isArticleOpen ? (
      <ArticleReaderModal
        isOpen={isArticleOpen}
        onClose={() => setIsArticleOpen(false)}
        headline={currentPuzzle.headline}
        body={articleDek(currentPuzzle)}
        byline={articleByline(currentPuzzle)}
        night={nightEdition}
        plate={articlePlateId(currentPuzzle)}
      />
      ) : null}

      {isHowToPlayOpen ? (
      <HowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
      />
      ) : null}

      {isBureauDeskOpen ? (
      <BureauDeskModal
        isOpen={isBureauDeskOpen}
        onClose={closeBureauDesk}
        identified={identified}
        user={identified ? user : null}
        night={isNightEdition(currentPuzzle)}
        gameStats={gameStats}
        seasonLength={seasonLength}
        authConfigured={bureauPreview ? true : configured}
        authError={authError}
        onIssueCredentials={signIn}
        onSignOut={signOut}
        darkPaper={darkPaper}
        onTogglePaper={togglePaper}
        gameKeyboard={gameKeyboard}
        onToggleKeyboard={toggleKeyboard}
        pressVersion={editionUpdate.serverVersion}
        todayClue={currentPuzzle.hints[0] || null}
        onDeleteRecords={
          user
            ? async () => {
                // Firestore first, while the account still authenticates; deleting the
                // account first would make every rule deny and strand the documents.
                const store = await cloudStore();
                await store.deleteCloudUserData(
                  user.uid,
                  INITIAL_PUZZLES.map((puzzle) => puzzle.id)
                );
                await deleteAccount();
              }
            : undefined
        }
      />
      ) : null}

      {isResetLettersOpen ? (
      <ResetLettersModal
        isOpen={isResetLettersOpen}
        onClose={() => setIsResetLettersOpen(false)}
        onConfirm={confirmResetMappings}
      />
      ) : null}
      </Suspense>
      </DeskErrorBoundary>
    </div>
  );
}
