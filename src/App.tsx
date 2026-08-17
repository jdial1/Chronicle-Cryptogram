import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Header } from './components/Header';
import { CryptogramGrid } from './components/CryptogramGrid';
import { LeaderboardModal } from './components/LeaderboardModal';
import { NewspaperClippingModal } from './components/NewspaperClippingModal';
import { ArchiveModal } from './components/ArchiveModal';
import { AICipherGeneratorModal } from './components/AICipherGeneratorModal';
import { FrequencyAnalysisModal } from './components/FrequencyAnalysisModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { TodayStatsBulletin } from './components/TodayStatsBulletin';
import { INITIAL_PUZZLES } from './data/puzzles';
import { PuzzleData, SymbolMapping, PencilMapping, GameStats } from './types';
import { useDailyNotification } from './utils/useDailyNotification';
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
  playPaperRustle,
  setAudioEnabled,
} from './utils/audio';

export default function App() {
  useDailyNotification();

  const hiddenInputRef = useRef<HTMLInputElement>(null);

  // Puzzles State
  const [allPuzzles, setAllPuzzles] = useState<PuzzleData[]>(INITIAL_PUZZLES);
  const [currentPuzzle, setCurrentPuzzle] = useState<PuzzleData>(INITIAL_PUZZLES[0]);
  const [solvedPuzzleIds, setSolvedPuzzleIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('cryptogram_solved_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Game Stats State
  const [gameStats, setGameStats] = useState<GameStats>(() => {
    try {
      const saved = localStorage.getItem('cryptogram_stats');
      return saved
        ? JSON.parse(saved)
        : {
            puzzlesPlayed: 0,
            puzzlesSolved: 0,
            currentStreak: 1,
            maxStreak: 1,
            fastestTime: null,
            totalTimePlayed: 0,
            averageAccuracy: 100,
            leaderboardSubmissions: 0,
          };
    } catch {
      return {
        puzzlesPlayed: 0,
        puzzlesSolved: 0,
        currentStreak: 1,
        maxStreak: 1,
        fastestTime: null,
        totalTimePlayed: 0,
        averageAccuracy: 100,
        leaderboardSubmissions: 0,
      };
    }
  });

  // Sound Settings
  const [soundEnabled, setSound] = useState(true);

  // Active Puzzle Decryption State
  const [mappings, setMappings] = useState<SymbolMapping>({});
  const [pencilMappings, setPencilMappings] = useState<PencilMapping>({});
  const [selectedSymbolId, setSelectedSymbolId] = useState<string | null>(null);
  const [penMode, setPenMode] = useState<'pen' | 'pencil'>('pen');
  const [showErrors, setShowErrors] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hintsRemaining, setHintsRemaining] = useState(3);
  const [isSolved, setIsSolved] = useState(false);

  // Timer
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  // Modals
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isNewspaperClippingOpen, setIsNewspaperClippingOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isAIGeneratorOpen, setIsAIGeneratorOpen] = useState(false);
  const [isFrequencyOpen, setIsFrequencyOpen] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);

  // Derive Cipher Alphabet and Words using Zodiac killer symbols
  const cipherAlphabet = useMemo(() => {
    const isHardMode = currentPuzzle.difficultyMode === 'Hard' || currentPuzzle.difficulty === 'Hard' || currentPuzzle.difficulty === 'Master';
    return buildCipherAlphabet(currentPuzzle.id + currentPuzzle.originalText, isHardMode);
  }, [currentPuzzle]);

  const words = useMemo(() => {
    return parseCryptogramText(currentPuzzle.originalText, cipherAlphabet);
  }, [currentPuzzle, cipherAlphabet]);

  const symbolFrequencies = useMemo(() => {
    const freqs = calculateSymbolFrequencies(words, cipherAlphabet);
    return freqs.map((f) => ({
      ...f,
      mappedLetter: mappings[f.symbolId] || '',
    }));
  }, [words, cipherAlphabet, mappings]);

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

  // Auto-load or reset state on puzzle change
  useEffect(() => {
    const savedProgressStr = localStorage.getItem(`cryptogram_progress_${currentPuzzle.id}`);
    
    if (savedProgressStr) {
      try {
        const savedProgress = JSON.parse(savedProgressStr);
        setMappings(savedProgress.mappings || {});
        setPencilMappings(savedProgress.pencilMappings || {});
        setTimerSeconds(savedProgress.timerSeconds || 0);
        setHintsUsed(savedProgress.hintsUsed || 0);
        setHintsRemaining(savedProgress.hintsRemaining ?? 3);
        setIsSolved(savedProgress.isSolved || false);
        setIsTimerRunning(savedProgress.isSolved ? false : true);
        setShowErrors(false);
        
        if (uniqueSymbols.length > 0) {
          setSelectedSymbolId(uniqueSymbols[0].symbolId);
        }
      } catch {
        resetPuzzleState();
      }
    } else {
      resetPuzzleState();
    }
    playPaperRustle();
  }, [currentPuzzle, uniqueSymbols]);

  const resetPuzzleState = () => {
    setMappings({});
    setPencilMappings({});
    setTimerSeconds(0);
    setIsTimerRunning(true);
    setHintsUsed(0);
    setHintsRemaining(3);
    setIsSolved(false);
    setShowErrors(false);
    if (uniqueSymbols.length > 0) {
      setSelectedSymbolId(uniqueSymbols[0].symbolId);
    }
  };

  // Timer Tick
  useEffect(() => {
    if (!isTimerRunning || isSolved) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => +(prev + 0.1).toFixed(1));
    }, 100);
    return () => clearInterval(interval);
  }, [isTimerRunning, isSolved]);

  // Save progress automatically
  useEffect(() => {
    // Only save if we actually have symbols loaded, preventing overwrite on initial empty mount
    if (uniqueSymbols.length > 0) {
      const progress = {
        mappings,
        pencilMappings,
        timerSeconds,
        hintsUsed,
        hintsRemaining,
        isSolved
      };
      localStorage.setItem(`cryptogram_progress_${currentPuzzle.id}`, JSON.stringify(progress));
    }
  }, [mappings, pencilMappings, timerSeconds, hintsUsed, hintsRemaining, isSolved, currentPuzzle.id, uniqueSymbols]);

  // Check Solution
  useEffect(() => {
    if (uniqueSymbols.length === 0 || isSolved) return;

    const allMapped = uniqueSymbols.every((s) => Boolean(mappings[s.symbolId]));
    if (!allMapped) return;

    const allCorrect = uniqueSymbols.every((s) => mappings[s.symbolId] === s.targetLetter);
    if (allCorrect) {
      setIsSolved(true);
      setIsTimerRunning(false);
      playSolvedBell();

      // Trigger Confetti
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#78350f', '#f59e0b', '#d97706', '#1c1917', '#10b981'],
      });

      // Update Solved History & Stats
      setSolvedPuzzleIds((prev) => {
        const next = Array.from(new Set([...prev, currentPuzzle.id]));
        localStorage.setItem('cryptogram_solved_ids', JSON.stringify(next));
        return next;
      });

      setGameStats((prev) => {
        const next: GameStats = {
          ...prev,
          puzzlesSolved: prev.puzzlesSolved + 1,
          currentStreak: prev.currentStreak + 1,
          maxStreak: Math.max(prev.maxStreak, prev.currentStreak + 1),
          fastestTime:
            prev.fastestTime === null
              ? timerSeconds
              : Math.min(prev.fastestTime, timerSeconds),
          totalTimePlayed: prev.totalTimePlayed + timerSeconds,
        };
        localStorage.setItem('cryptogram_stats', JSON.stringify(next));
        return next;
      });
    }
  }, [mappings, uniqueSymbols, isSolved, currentPuzzle, timerSeconds]);

  // Handle Letter Input (Applies to ALL instances of the selected symbol across the message)
  const handleKeyPress = useCallback(
    (letter: string) => {
      if (!selectedSymbolId || isSolved) return;
      playTypewriterClack();

      const upper = letter.toUpperCase();

      if (penMode === 'pen') {
        setMappings((prev) => {
          // In homophonic substitution with frequency suppression, multiple symbols can decode to the same letter!
          return {
            ...prev,
            [selectedSymbolId]: upper,
          };
        });

        // Automatically advance to the next unmapped symbol
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
      } else {
        // Pencil Mode: Toggle candidate
        setPencilMappings((prev) => {
          const currentPencils = prev[selectedSymbolId] || [];
          const exists = currentPencils.includes(upper);
          const nextPencils = exists
            ? currentPencils.filter((l) => l !== upper)
            : [...currentPencils, upper];
          return {
            ...prev,
            [selectedSymbolId]: nextPencils,
          };
        });
      }
    },
    [selectedSymbolId, isSolved, penMode, uniqueSymbols, mappings]
  );

  // Handle Backspace / Clear
  const handleBackspace = useCallback(() => {
    if (!selectedSymbolId || isSolved) return;
    playBackspaceClunk();

    setMappings((prev) => {
      const next = { ...prev };
      delete next[selectedSymbolId];
      return next;
    });

    setPencilMappings((prev) => {
      const next = { ...prev };
      delete next[selectedSymbolId];
      return next;
    });
  }, [selectedSymbolId, isSolved]);

  const handleClearSymbol = useCallback(() => {
    handleBackspace();
  }, [handleBackspace]);

  const handleResetMappings = useCallback(() => {
    if (window.confirm('Are you sure you want to reset all symbol mappings for this cryptogram?')) {
      setMappings({});
      setPencilMappings({});
      setShowErrors(false);
      playPaperRustle();
    }
  }, []);

  // Use Hint (Reveals 1 unmapped or incorrect symbol)
  const handleUseHint = useCallback(() => {
    if (hintsRemaining <= 0 || isSolved) return;

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
  }, [hintsRemaining, isSolved, uniqueSymbols, mappings]);

  // Physical Keyboard Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if inside an input or textarea
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
  }, [handleKeyPress, handleBackspace, uniqueSymbols, selectedSymbolId]);

  // Accuracy calculation
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
    setCurrentPuzzle(puzzle);
  };

  const handleNextPuzzle = () => {
    const currentIdx = allPuzzles.findIndex((p) => p.id === currentPuzzle.id);
    const nextIdx = (currentIdx + 1) % allPuzzles.length;
    setCurrentPuzzle(allPuzzles[nextIdx]);
    setIsNewspaperClippingOpen(false);
  };

  // Determine if Hard mode is unlocked for the current date
  const isHardUnlocked = useMemo(() => {
    // Has the user solved an easy puzzle for the current date?
    return solvedPuzzleIds.some((id) => {
      const p = allPuzzles.find((puzzle) => puzzle.id === id);
      return (
        p &&
        p.editionDate === currentPuzzle.editionDate &&
        (p.difficultyMode === 'Easy' || p.difficulty === 'Easy' || p.difficulty === 'Beginner')
      );
    });
  }, [solvedPuzzleIds, allPuzzles, currentPuzzle.editionDate]);

  // Handle Cell Tap (mobile keyboard trigger)
  const handleSelectSymbol = useCallback((symId: string) => {
    setSelectedSymbolId(symId);
    if (hiddenInputRef.current) {
      hiddenInputRef.current.focus();
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#f7f3e8] text-stone-900 flex flex-col justify-between selection:bg-amber-200">
      <input
        ref={hiddenInputRef}
        type="text"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck="false"
        className="fixed opacity-0 pointer-events-none w-0 h-0"
        style={{ left: '-9999px', top: '50%' }}
        value=""
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
      />

      {/* Main Newspaper Layout */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-3 sm:px-6 py-3 sm:py-5 flex flex-col justify-between gap-3">
        {/* Authentic Newspaper Story Headline & Subdeck */}
        <section className="text-center sm:text-left pt-1 pb-3 border-b-2 border-stone-900">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-headline font-black tracking-tight text-stone-950 uppercase leading-snug">
            {currentPuzzle.headline}
          </h2>
          <p className="font-treatise text-sm sm:text-base text-stone-800 italic mt-1">
            "{currentPuzzle.subheadline}" — <span className="not-italic font-semibold text-stone-950 font-newspaper">{currentPuzzle.authorOrSource}</span>
          </p>
        </section>

        {/* The Interactive Zodiac Cryptogram Board */}
        <section className="flex-1 flex flex-col justify-center">
          <CryptogramGrid
            words={words}
            mappings={mappings}
            pencilMappings={pencilMappings}
            selectedSymbolId={selectedSymbolId}
            onSelectSymbol={handleSelectSymbol}
            showErrors={showErrors}
            isSolved={isSolved}
          />
          
          {isSolved && (
            <TodayStatsBulletin 
              currentPuzzle={currentPuzzle}
              timerSeconds={timerSeconds}
              isHardUnlocked={isHardUnlocked}
              onUnlockHardMode={() => handleSelectDifficulty('Hard')}
            />
          )}
        </section>
      </main>

      {/* Modals */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        currentPuzzleId={currentPuzzle.id}
        currentPuzzleTitle={currentPuzzle.headline}
        currentSolveStats={
          isSolved
            ? {
                timeSeconds: timerSeconds,
                timeFormatted: formatTime(timerSeconds),
                hintsUsed,
                accuracy,
                penMode,
              }
            : null
        }
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
        puzzles={allPuzzles}
        currentPuzzleId={currentPuzzle.id}
        onSelectPuzzle={handleSelectPuzzle}
        solvedPuzzleIds={solvedPuzzleIds}
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
        onSelectSymbolFromFreq={(symId) => setSelectedSymbolId(symId)}
      />

      <HowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
      />
    </div>
  );
}
