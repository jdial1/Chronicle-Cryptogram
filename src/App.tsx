import React, { useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { CryptogramGrid } from './components/CryptogramGrid';
import { LeaderboardModal } from './components/LeaderboardModal';
import { NewspaperClippingModal } from './components/NewspaperClippingModal';
import { ArchiveModal } from './components/ArchiveModal';
import { AICipherGeneratorModal } from './components/AICipherGeneratorModal';
import { FrequencyAnalysisModal } from './components/FrequencyAnalysisModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { ArticleReaderModal, DropCapParagraph } from './components/ArticleReaderModal';
import { CaseFileModal, CaseFileToast } from './components/CaseFileModal';
import { PrimerCoach } from './components/PrimerCoach';
import { TodayStatsBulletin, LiveStatsRow, NightPostButton, PrimerPathButtons } from './components/TodayStatsBulletin';
import { INITIAL_PUZZLES } from './data/puzzles';
import {
  CaseCharacterId,
  fragmentKey,
  fragmentsUpdatedByPuzzle,
} from './data/caseFiles';
import { PuzzleData, PuzzleProgress, SymbolMapping, GameStats } from './types';
import { isMorningEdition, isNightEdition, isNightUnlockedForDate, isPrimerPuzzle, publishedThroughDate, articleDek, articleByline, currentMorningPuzzle, firstCasePuzzle, storyHasBegun, hasSolvedStoryPuzzle } from './utils/edition';
import { useDailyNotification } from './utils/useDailyNotification';
import { useAuth } from './utils/useAuth';
import {
  DEFAULT_GAME_STATS,
  ensureUserProfile,
  loadCloudProgress,
  loadUserProfile,
  mergeGameStats,
  mergeProgress,
  mergeSolvedIds,
  recordPuzzleSolve,
  recordPuzzleStart,
  saveCloudProgress,
  saveUserProfile,
} from './utils/firebaseStore';
import {
  buildCipherAlphabet,
  parseCryptogramText,
  calculateSymbolFrequencies,
  formatTime,
} from './utils/cipherEngine';
import {
  playTypewriterClack,
  playBackspaceClunk,
  playSolvedBell,
  playHintSound,
  setAudioEnabled,
} from './utils/audio';
import { PuzzleSilhouette, Search } from './icons';

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

function readPuzzleProgress(puzzleId: string): PuzzleProgress | null {
  try {
    const saved = localStorage.getItem(`cryptogram_progress_${puzzleId}`);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
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

function loadPuzzleState(puzzle: PuzzleData) {
  const progress = readPuzzleProgress(puzzle.id);
  if (puzzleWasSolved(puzzle.id, progress)) {
    return {
      mappings: decodedMappingsFromPuzzle(puzzle),
      timerSeconds: progress?.timerSeconds || 0,
      hintsUsed: progress?.hintsUsed || 0,
      hintsRemaining: progress?.hintsRemaining ?? 3,
      isSolved: true,
    };
  }
  if (progress) {
    return {
      mappings: progress.mappings || {},
      timerSeconds: progress.timerSeconds || 0,
      hintsUsed: progress.hintsUsed || 0,
      hintsRemaining: progress.hintsRemaining ?? 3,
      isSolved: false,
    };
  }
  return {
    mappings: {} as SymbolMapping,
    timerSeconds: 0,
    hintsUsed: 0,
    hintsRemaining: 3,
    isSolved: false,
  };
}

function dismissMobileKeyboard(input: HTMLInputElement | null) {
  input?.blur();
  const active = document.activeElement;
  if (active instanceof HTMLElement) active.blur();
}

const BOOT_PUZZLE = getInitialPuzzle();
const BOOT_STATE = loadPuzzleState(BOOT_PUZZLE);

export default function App() {
  const { supported: deliverySupported, subscribed: deliverySubscribed, blocked: deliveryBlocked, toggleDelivery } =
    useDailyNotification();
  const { user, signIn, signOut, configured } = useAuth();
  const startedPuzzlesRef = useRef<Set<string>>(new Set());

  const hiddenInputRef = useRef<HTMLInputElement>(null);

  // Puzzles State
  const [allPuzzles, setAllPuzzles] = useState<PuzzleData[]>(INITIAL_PUZZLES);
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

  const [soundEnabled, setSound] = useState(true);

  const [mappings, setMappings] = useState<SymbolMapping>(BOOT_STATE.mappings);
  const [selectedSymbolId, setSelectedSymbolId] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(BOOT_STATE.hintsUsed);
  const [hintsRemaining, setHintsRemaining] = useState(BOOT_STATE.hintsRemaining);
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
  const [isAIGeneratorOpen, setIsAIGeneratorOpen] = useState(false);
  const [isFrequencyOpen, setIsFrequencyOpen] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isArticleOpen, setIsArticleOpen] = useState(false);

  if (progressReadyId !== currentPuzzle.id) {
    const loaded = loadPuzzleState(currentPuzzle);
    setProgressReadyId(currentPuzzle.id);
    setMappings(loaded.mappings);
    setTimerSeconds(loaded.timerSeconds);
    setHintsUsed(loaded.hintsUsed);
    setHintsRemaining(loaded.hintsRemaining);
    setIsSolved(loaded.isSolved);
    setIsTimerRunning(!loaded.isSolved);
    setShowErrors(false);
    setSelectedSymbolId(null);
    setIsSolveBulletinOpen(false);
    setIsArticleOpen(false);
    setCaseFileToastPuzzle(null);
  }

  const boardReady = progressReadyId === currentPuzzle.id;
  const boardSolved = boardReady && isSolved;
  const boardMappings = boardReady ? mappings : {};

  // Derive Cipher Alphabet and Words using Zodiac killer symbols
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
  }, [currentPuzzle.id]);

  // Auto-load or reset state on puzzle change
  useEffect(() => {
    if (isSolved) {
      setSelectedSymbolId(null);
      setSolvedPuzzleIds((prev) => {
        if (prev.includes(currentPuzzle.id)) return prev;
        const next = [...prev, currentPuzzle.id];
        localStorage.setItem('cryptogram_solved_ids', JSON.stringify(next));
        return next;
      });
    } else if (uniqueSymbols.length > 0) {
      setSelectedSymbolId(uniqueSymbols[0].symbolId);
    }
  }, [currentPuzzle.id]);

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
      const localSolved = JSON.parse(localStorage.getItem('cryptogram_solved_ids') || '[]');
      const savedStats = localStorage.getItem('cryptogram_stats');
      const localStats = savedStats ? JSON.parse(savedStats) : DEFAULT_GAME_STATS;
      const profile = await loadUserProfile(user.uid);
      if (cancelled) return;
      const nextSolved = mergeSolvedIds(localSolved, profile?.solvedPuzzleIds || []);
      const nextStats = mergeGameStats(localStats, profile?.gameStats || null);
      setSolvedPuzzleIds(nextSolved);
      setGameStats(nextStats);
      localStorage.setItem('cryptogram_solved_ids', JSON.stringify(nextSolved));
      localStorage.setItem('cryptogram_stats', JSON.stringify(nextStats));
      await ensureUserProfile(user, nextStats, nextSolved);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const cloud = await loadCloudProgress(user.uid, currentPuzzle.id);
      if (cancelled || !cloud) return;
      const local = readPuzzleProgress(currentPuzzle.id);
      const merged = mergeProgress(local, cloud);
      if (!merged || cancelled) return;
      const knownSolved = Boolean(merged.isSolved);
      const next = knownSolved
        ? {
            ...merged,
            mappings: decodedMappings(uniqueSymbols),
            isSolved: true,
          }
        : { ...merged, isSolved: false };
      setMappings(next.mappings || {});
      setTimerSeconds(next.timerSeconds || 0);
      setHintsUsed(next.hintsUsed || 0);
      setHintsRemaining(next.hintsRemaining ?? 3);
      setIsSolved(next.isSolved || false);
      setIsTimerRunning(!next.isSolved);
      localStorage.setItem(`cryptogram_progress_${currentPuzzle.id}`, JSON.stringify(next));
      if (next.isSolved && !isPrimerPuzzle(currentPuzzle)) {
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
    })();
    return () => {
      cancelled = true;
    };
  }, [user, currentPuzzle.id, uniqueSymbols, solvedPuzzleIds]);

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
    const progress = {
      mappings,
      timerSeconds,
      hintsUsed,
      hintsRemaining,
      isSolved
    };
    localStorage.setItem(`cryptogram_progress_${currentPuzzle.id}`, JSON.stringify(progress));
  }, [progressReadyId, mappings, timerSeconds, hintsUsed, hintsRemaining, isSolved, currentPuzzle.id, uniqueSymbols]);

  useEffect(() => {
    if (!user || uniqueSymbols.length === 0 || progressReadyId !== currentPuzzle.id) return;
    const handle = window.setTimeout(() => {
      saveCloudProgress(user.uid, currentPuzzle.id, {
        mappings,
        timerSeconds,
        hintsUsed,
        hintsRemaining,
        isSolved,
      }).catch(() => undefined);
    }, 1500);
    return () => window.clearTimeout(handle);
  }, [user, progressReadyId, currentPuzzle.id, mappings, hintsUsed, hintsRemaining, isSolved, uniqueSymbols.length]);

  useEffect(() => {
    if (!user || isSolved || Object.keys(mappings).length === 0) return;
    if (progressReadyId !== currentPuzzle.id) return;
    if (isPrimerPuzzle(currentPuzzle)) return;
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
      dismissMobileKeyboard(hiddenInputRef.current);
      if (fragmentsUpdatedByPuzzle(currentPuzzle).length > 0) {
        setCaseFileToastPuzzle(currentPuzzle);
      }
      playSolvedBell();

      void import('canvas-confetti').then(({ default: fireConfetti }) => {
        fireConfetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#78350f', '#f59e0b', '#d97706', '#1c1917', '#10b981'],
        });
      });

      const nextSolved = Array.from(new Set([...solvedPuzzleIds, currentPuzzle.id]));
      setSolvedPuzzleIds(nextSolved);
      localStorage.setItem('cryptogram_solved_ids', JSON.stringify(nextSolved));

      const primer = isPrimerPuzzle(currentPuzzle);
      const next: GameStats = primer
        ? gameStats
        : {
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
      if (!primer) {
        setGameStats(next);
        localStorage.setItem('cryptogram_stats', JSON.stringify(next));
      }

      if (user) {
        if (!primer) {
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
        }
        saveUserProfile(user.uid, next, nextSolved).catch(() => undefined);
        saveCloudProgress(user.uid, currentPuzzle.id, {
          mappings,
          timerSeconds,
          hintsUsed,
          hintsRemaining,
          isSolved: true,
        }).catch(() => undefined);
      }
    }
  }, [mappings, uniqueSymbols, isSolved, currentPuzzle, timerSeconds, user, hintsUsed, accuracy, solvedPuzzleIds, hintsRemaining, gameStats, progressReadyId]);

  // Handle Letter Input (Applies to ALL instances of the selected symbol across the message)
  const handleKeyPress = useCallback(
    (letter: string) => {
      if (!selectedSymbolId || !boardReady || isSolved) return;
      playTypewriterClack();

      const upper = letter.toUpperCase();
      const nextMappings = {
        ...mappings,
        [selectedSymbolId]: upper,
      };
      setMappings(nextMappings);

      if (uniqueSymbols.every((s) => nextMappings[s.symbolId] === s.targetLetter)) {
        dismissMobileKeyboard(hiddenInputRef.current);
      }

      const currentIdx = uniqueSymbols.findIndex((s) => s.symbolId === selectedSymbolId);
      if (currentIdx !== -1) {
        const nextUnmapped = uniqueSymbols
          .slice(currentIdx + 1)
          .concat(uniqueSymbols.slice(0, currentIdx))
          .find((s) => !mappings[s.symbolId] && s.symbolId !== selectedSymbolId);

        if (nextUnmapped) {
          setSelectedSymbolId(nextUnmapped.symbolId);
        }
      }
    },
    [selectedSymbolId, isSolved, boardReady, uniqueSymbols, mappings]
  );

  // Handle Backspace / Clear
  const handleBackspace = useCallback(() => {
    if (!selectedSymbolId || !boardReady || isSolved) return;
    playBackspaceClunk();

    setMappings((prev) => {
      const next = { ...prev };
      delete next[selectedSymbolId];
      return next;
    });
  }, [selectedSymbolId, isSolved, boardReady]);

  const handleClearSymbol = useCallback(() => {
    handleBackspace();
  }, [handleBackspace]);

  const handleResetMappings = useCallback(() => {
    if (window.confirm('Are you sure you want to reset all symbol mappings for this cryptogram?')) {
      setMappings({});
      setShowErrors(false);
    }
  }, []);

  // Use Hint (Reveals 1 unmapped or incorrect symbol)
  const handleUseHint = useCallback(() => {
    if (hintsRemaining <= 0 || !boardReady || isSolved) return;

    // Find first unmapped or incorrect symbol
    const targetSymbol = uniqueSymbols.find(
      (s) => !mappings[s.symbolId] || mappings[s.symbolId] !== s.targetLetter
    );

    if (targetSymbol) {
      playHintSound();
      setHintsUsed((prev) => prev + 1);
      setHintsRemaining((prev) => prev - 1);

      setMappings((prev) => ({
        ...prev,
        [targetSymbol.symbolId]: targetSymbol.targetLetter,
      }));

      setSelectedSymbolId(targetSymbol.symbolId);
    }
  }, [hintsRemaining, isSolved, boardReady, uniqueSymbols, mappings]);

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
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (uniqueSymbols.length > 0) {
          const currentIdx = uniqueSymbols.findIndex((s) => s.symbolId === selectedSymbolId);
          const prevIdx = (currentIdx - 1 + uniqueSymbols.length) % uniqueSymbols.length;
          setSelectedSymbolId(uniqueSymbols[prevIdx].symbolId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyPress, handleBackspace, uniqueSymbols, selectedSymbolId, isSolved, boardReady]);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSound(next);
    setAudioEnabled(next);
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

  const handleSelectPuzzle = (puzzle: PuzzleData) => {
    if (puzzle.editionDate > publishedThroughDate(INITIAL_PUZZLES)) return;
    if (
      isNightEdition(puzzle) &&
      !isNightUnlockedForDate(allPuzzles, solvedPuzzleIds, puzzle.editionDate)
    ) {
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
  const todayEdition = currentMorningPuzzle(INITIAL_PUZZLES);
  const offerStoryCatchUp =
    isPrimerPuzzle(currentPuzzle) &&
    storyHasBegun(INITIAL_PUZZLES) &&
    !hasSolvedStoryPuzzle(allPuzzles, solvedPuzzleIds);

  // Handle Cell Tap (mobile keyboard trigger)
  const handleSelectSymbol = useCallback(
    (symId: string) => {
      if (!boardReady || isSolved) return;
      setSelectedSymbolId(symId);
      if (hiddenInputRef.current) {
        hiddenInputRef.current.focus();
      }
    },
    [boardReady, isSolved]
  );

  return (
    <div
      className={`min-h-screen flex flex-col justify-between selection:bg-stone-300 selection:text-stone-950 ${
        nightEdition ? 'bg-[#cfc3a8] text-stone-950' : 'bg-[#f7f3e8] text-stone-900'
      }`}
    >
      <label htmlFor="cipher-letter-input" className="sr-only">
        Type a letter to map the selected cipher glyph
      </label>
      <input
        id="cipher-letter-input"
        ref={hiddenInputRef}
        type="text"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck="false"
        className="fixed opacity-0 pointer-events-none w-0 h-0 text-base"
        style={{ left: '-9999px', top: '50%' }}
        value=""
        readOnly={isSolved}
        inputMode={isSolved ? 'none' : 'text'}
        tabIndex={isSolved ? -1 : 0}
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
      
      {/* Header with Masthead and Live Status */}
      <Header
        currentPuzzle={currentPuzzle}
        user={user}
        authConfigured={configured}
        onSignIn={signIn}
        onSignOut={signOut}
        onOpenArchive={() => setIsArchiveOpen(true)}
        onOpenCaseFiles={() => {
          if (solvedPuzzleIds.length === 0) return;
          setCaseFileFocusId(null);
          setCaseFileFocusKey(null);
          setCaseFileToastPuzzle(null);
          setIsCaseFileOpen(true);
        }}
        onOpenHandbook={() => setIsHowToPlayOpen(true)}
        showCaseFiles={solvedPuzzleIds.length > 0}
        deliverySupported={deliverySupported}
        deliverySubscribed={deliverySubscribed}
        deliveryBlocked={deliveryBlocked}
        onToggleDelivery={toggleDelivery}
      />

      {/* Main Newspaper Layout */}
      <main className="flex-1 w-full min-w-0 max-w-5xl mx-auto px-3 sm:px-6 py-3 sm:py-5 flex flex-col justify-between gap-3">
        {/* Authentic Newspaper Story Headline & Subdeck */}
        <section
          className={`relative text-center sm:text-left pt-1 pb-3 pr-10 ${
            nightEdition ? 'border-b-2 border-amber-800' : 'border-b-2 border-stone-900'
          }`}
        >
          <PuzzleSilhouette
            name={currentPuzzle.silhouette}
            className="newspaper-silhouette article-silhouette"
          />
          <button
            type="button"
            onClick={() => setIsArticleOpen(true)}
            className="absolute top-0 right-0 z-10 w-8 h-8 flex items-center justify-center border border-stone-800 hover:bg-amber-100 cursor-pointer"
            aria-label="Open article"
          >
            <Search className="w-4 h-4" />
          </button>
          <h2
            className={`text-[calc(1.5rem+2pt)] sm:text-[calc(1.875rem+2pt)] md:text-[calc(2.25rem+2pt)] font-black tracking-tight uppercase leading-snug ${
              nightEdition ? 'font-letterpress text-stone-950' : 'font-headline text-stone-950'
            }`}
          >
            {currentPuzzle.headline}
          </h2>
          <DropCapParagraph
            text={articleDek(currentPuzzle)}
            night={nightEdition}
            className="font-treatise text-left text-[calc(0.875rem+2pt)] sm:text-[calc(1rem+2pt)] italic mt-1 text-stone-800 leading-[1.65]"
          />
          <p className="mt-2 font-newspaper font-semibold text-[calc(0.875rem+2pt)] sm:text-[calc(1rem+2pt)] text-stone-950">
            — {articleByline(currentPuzzle)}
          </p>
        </section>

        {/* The Interactive Zodiac Cryptogram Board */}
        <section className="flex-1 flex flex-col justify-center min-w-0">
          {isPrimerPuzzle(currentPuzzle) && !boardSolved && (
            <PrimerCoach
              words={words}
              mappings={boardMappings}
              isSolved={boardSolved}
              frequencies={symbolFrequencies}
              selectedSymbolId={boardReady ? selectedSymbolId : null}
              onSelectSymbol={handleSelectSymbol}
              onOpenHandbook={() => setIsHowToPlayOpen(true)}
            />
          )}
          {boardSolved && !isSolveBulletinOpen && !isPrimerPuzzle(currentPuzzle) && (
            <div className="mb-3">
              <LiveStatsRow puzzleId={currentPuzzle.id} />
            </div>
          )}
          <CryptogramGrid
            words={words}
            mappings={boardMappings}
            selectedSymbolId={boardReady ? selectedSymbolId : null}
            onSelectSymbol={handleSelectSymbol}
            showErrors={showErrors}
            isSolved={boardSolved}
          />
          {boardSolved && !isSolveBulletinOpen && !nightEdition && !isPrimerPuzzle(currentPuzzle) && (
            <div className="mt-3">
              <NightPostButton onClick={() => handleSelectDifficulty('Hard')} />
            </div>
          )}
          {boardSolved && !isSolveBulletinOpen && isPrimerPuzzle(currentPuzzle) && (
            <div className="mt-3">
              {offerStoryCatchUp && (
                <p className="mb-2 text-center font-newspaper text-sm text-stone-700 leading-relaxed">
                  The story has already begun. Start on Day 1, or go to the current day.
                </p>
              )}
              <PrimerPathButtons
                offerCatchUp={offerStoryCatchUp}
                currentEditionNumber={todayEdition?.editionNumber}
                onOpenDayOne={handleOpenDayOne}
                onOpenTodayEdition={handleOpenTodayEdition}
              />
            </div>
          )}
        </section>
      </main>

      {/* Modals */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        currentPuzzleId={currentPuzzle.id}
        currentPuzzleTitle={currentPuzzle.headline}
        puzzles={allPuzzles}
        user={user}
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
        onClose={() => setIsSolveBulletinOpen(false)}
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
        onClose={() => {
          setIsCaseFileOpen(false);
          setCaseFileFocusId(null);
          setCaseFileFocusKey(null);
        }}
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

      <AICipherGeneratorModal
        isOpen={isAIGeneratorOpen}
        onClose={() => setIsAIGeneratorOpen(false)}
        onPuzzleGenerated={(newPuz) => {
          setAllPuzzles((prev) => [newPuz, ...prev]);
          setCurrentPuzzle(newPuz);
        }}
      />

      <FrequencyAnalysisModal
        isOpen={isFrequencyOpen}
        onClose={() => setIsFrequencyOpen(false)}
        symbolFrequencies={symbolFrequencies}
        onSelectSymbolFromFreq={(symId) => {
          if (boardReady && !isSolved) setSelectedSymbolId(symId);
        }}
      />

      <ArticleReaderModal
        isOpen={isArticleOpen}
        onClose={() => setIsArticleOpen(false)}
        headline={currentPuzzle.headline}
        body={articleDek(currentPuzzle)}
        byline={articleByline(currentPuzzle)}
        night={nightEdition}
      />

      <HowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
      />
    </div>
  );
}
