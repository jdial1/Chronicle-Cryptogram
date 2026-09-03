import { StrictMode, useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CaseFileModal } from './components/CaseFileModal';
import { CryptogramGrid } from './components/CryptogramGrid';
import { GlyphTally } from './components/PrimerCoach';
import { TodayStatsBulletin } from './components/TodayStatsBulletin';
import { INITIAL_PUZZLES } from './data/puzzles';
import { WoodcutPressFilter } from './deskIcons';
import { SymbolMapping } from './types';
import { isMorningEdition } from './utils/edition';
import { buildCipherAlphabet, calculateSymbolFrequencies, parseCryptogramText } from './utils/cipherEngine';
import './index.css';

const TITLE = 'CHRONICLE CRYPTOGRAM';
const MID_SOLVE = 'CROEA';
const SILHOUETTE = 'GiSecretBook';

/** Store-listing scenes. 'board' also covers the Night Extra, via the homophones toggle. */
type Scene = 'board' | 'caseFile' | 'bulletin';

/**
 * Real puzzles and a real solve history, so the case file assembles genuine fragments
 * rather than lorem. Six editions in is far enough for several characters to have
 * something on file.
 */
const SHOT_SOLVED_IDS = INITIAL_PUZZLES.filter((puzzle) => puzzle.editionNumber <= 6).map(
  (puzzle) => puzzle.id
);

const SHOT_PUZZLE =
  INITIAL_PUZZLES.find((puzzle) => puzzle.editionNumber === 6 && isMorningEdition(puzzle)) ??
  INITIAL_PUZZLES[0];

function firstSymbolId(words: ReturnType<typeof parseCryptogramText>) {
  for (const word of words) {
    for (const symbol of word.symbols) {
      if (!symbol.isPunctuation) return symbol.symbolId;
    }
  }
  return null;
}

function uniqueSymbols(words: ReturnType<typeof parseCryptogramText>) {
  const seen = new Set<string>();
  const list: { symbolId: string; targetLetter: string }[] = [];
  for (const word of words) {
    for (const symbol of word.symbols) {
      if (symbol.isPunctuation || seen.has(symbol.symbolId)) continue;
      seen.add(symbol.symbolId);
      list.push({ symbolId: symbol.symbolId, targetLetter: symbol.targetLetter });
    }
  }
  return list;
}

function mappingsForLetters(
  symbols: { symbolId: string; targetLetter: string }[],
  letters: string
): SymbolMapping {
  const set = new Set(letters.toUpperCase().replace(/[^A-Z]/g, '').split(''));
  const next: SymbolMapping = {};
  for (const symbol of symbols) {
    if (set.has(symbol.targetLetter)) next[symbol.symbolId] = symbol.targetLetter;
  }
  return next;
}

function ShotPage() {
  const [scene, setScene] = useState<Scene>('board');
  const [text, setText] = useState(TITLE);
  const [reveal, setReveal] = useState('');
  const [homophonic, setHomophonic] = useState(false);
  const [night, setNight] = useState(false);
  const [phone, setPhone] = useState(false);
  const [showTally, setShowTally] = useState(false);
  const [dock, setDock] = useState(true);
  const [isSolved, setIsSolved] = useState(false);
  const [mappings, setMappings] = useState<SymbolMapping>({});
  const [selectedSymbolId, setSelectedSymbolId] = useState<string | null>(null);

  const cipher = useMemo(
    () => buildCipherAlphabet(`title-shot:${text}`, homophonic),
    [text, homophonic]
  );
  const words = useMemo(() => parseCryptogramText(text, cipher), [text, cipher]);
  const symbols = useMemo(() => uniqueSymbols(words), [words]);
  const frequencies = useMemo(
    () =>
      calculateSymbolFrequencies(words, cipher).map((item) => ({
        ...item,
        mappedLetter: mappings[item.symbolId] || '',
      })),
    [words, cipher, mappings]
  );

  useEffect(() => {
    setMappings(
      isSolved
        ? mappingsForLetters(symbols, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ')
        : mappingsForLetters(symbols, reveal)
    );
    setSelectedSymbolId(isSolved ? null : firstSymbolId(words));
  }, [words, symbols, reveal, isSolved]);

  useEffect(() => {
    document.documentElement.classList.toggle('is-night', night);
    document.body.classList.toggle('is-night', night);
    return () => {
      document.documentElement.classList.remove('is-night');
      document.body.classList.remove('is-night');
    };
  }, [night]);

  const applyReveal = useCallback((letters: string, solved = false) => {
    setReveal(letters);
    setIsSolved(solved);
  }, []);

  const handleKeyPress = useCallback(
    (letter: string) => {
      if (!selectedSymbolId || isSolved) return;
      const upper = letter.toUpperCase();
      setMappings((prev) => ({ ...prev, [selectedSymbolId]: upper }));
      const currentIdx = symbols.findIndex((s) => s.symbolId === selectedSymbolId);
      const nextUnmapped = symbols
        .slice(currentIdx + 1)
        .concat(symbols.slice(0, currentIdx))
        .find((s) => s.symbolId !== selectedSymbolId && !mappings[s.symbolId]);
      if (nextUnmapped) setSelectedSymbolId(nextUnmapped.symbolId);
    },
    [selectedSymbolId, isSolved, symbols, mappings]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setDock((open) => !open);
        return;
      }
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      if (!selectedSymbolId || isSolved) return;
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        setMappings((prev) => {
          const next = { ...prev };
          delete next[selectedSymbolId];
          return next;
        });
      } else if (/^[a-zA-Z]$/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        handleKeyPress(e.key);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleKeyPress, selectedSymbolId, isSolved]);

  return (
    <div
      className={`noir-newspaper-bg min-h-screen flex flex-col items-center justify-center p-3 sm:p-6 ${
        night ? 'is-night text-stone-950' : 'text-stone-900'
      }`}
    >
      <WoodcutPressFilter />
      <div className={phone ? 'w-[390px] max-w-full' : 'w-full max-w-5xl'}>
        {showTally ? (
          <GlyphTally
            frequencies={frequencies}
            selectedSymbolId={isSolved ? null : selectedSymbolId}
            onSelectSymbol={setSelectedSymbolId}
            standalone
          />
        ) : null}
        <CryptogramGrid
          words={words}
          mappings={mappings}
          selectedSymbolId={isSolved ? null : selectedSymbolId}
          onSelectSymbol={setSelectedSymbolId}
          flaggedSymbolIds={[]}
          lockedSymbolIds={[]}
          isSolved={isSolved}
          silhouette={SILHOUETTE}
          night={night}
        />
      </div>

      {/* Overlay scenes render above the board, which is what they look like in play. */}
      <CaseFileModal
        isOpen={scene === 'caseFile'}
        onClose={() => setScene('board')}
        puzzles={INITIAL_PUZZLES}
        solvedPuzzleIds={SHOT_SOLVED_IDS}
      />
      <TodayStatsBulletin
        isOpen={scene === 'bulletin'}
        onClose={() => setScene('board')}
        currentPuzzle={SHOT_PUZZLE}
        timerSeconds={247}
        onUnlockHardMode={() => undefined}
        seasonLength={30}
      />

      {dock ? (
        <form
          // Above the modal backdrop (z-50/z-55), or opening a scene would trap the
          // operator with no way to switch back. Escape also toggles the dock away
          // for the actual capture.
          className="fixed bottom-3 left-1/2 z-[80] w-[min(42rem,calc(100%-1.5rem))] -translate-x-1/2 border-2 border-stone-800 bg-[var(--paper-masthead)] p-3 shadow-md"
          onSubmit={(e) => {
            e.preventDefault();
            applyReveal(reveal, false);
          }}
        >
          <div className="mb-2 flex flex-wrap gap-1.5">
            {(
              [
                ['board', 'Board'],
                ['caseFile', 'Case file'],
                ['bulletin', 'Solve bulletin'],
              ] as [Scene, string][]
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setScene(value)}
                aria-pressed={scene === value}
                className={`cursor-pointer border px-2 py-1 font-mono-code text-xs font-bold uppercase ${
                  scene === value
                    ? 'border-stone-950 bg-[var(--selected)]'
                    : 'border-stone-700 bg-[#faf6ed]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="block font-mono-code text-xs font-bold uppercase tracking-widest text-stone-600">
            Puzzle text
            <input
              value={text}
              onChange={(e) => setText(e.target.value.toUpperCase())}
              className="mt-1 w-full border border-stone-500 bg-[var(--paper-card)] px-2 py-1.5 font-typewriter text-sm uppercase text-stone-950"
            />
          </label>
          <label className="mt-2 block font-mono-code text-xs font-bold uppercase tracking-widest text-stone-600">
            Reveal letters
            <input
              value={reveal}
              onChange={(e) => setReveal(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
              placeholder="CROEA"
              className="mt-1 w-full border border-stone-500 bg-[var(--paper-card)] px-2 py-1.5 font-typewriter text-sm uppercase text-stone-950"
            />
          </label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button
              type="button"
              className="cursor-pointer border border-stone-700 bg-[#faf6ed] px-2 py-1 font-mono-code text-xs font-bold uppercase"
              onClick={() => applyReveal('', false)}
            >
              Empty
            </button>
            <button
              type="button"
              className="cursor-pointer border border-stone-700 bg-[#faf6ed] px-2 py-1 font-mono-code text-xs font-bold uppercase"
              onClick={() => applyReveal(MID_SOLVE, false)}
            >
              Mid-solve
            </button>
            <button
              type="button"
              className="cursor-pointer border border-stone-700 bg-[#faf6ed] px-2 py-1 font-mono-code text-xs font-bold uppercase"
              onClick={() => applyReveal('ABCDEFGHIJKLMNOPQRSTUVWXYZ', true)}
            >
              Solved
            </button>
            <button
              type="button"
              className={`cursor-pointer border px-2 py-1 font-mono-code text-xs font-bold uppercase ${
                phone ? 'border-stone-950 bg-[var(--selected)]' : 'border-stone-700 bg-[#faf6ed]'
              }`}
              onClick={() => setPhone((v) => !v)}
            >
              Phone
            </button>
            <button
              type="button"
              className={`cursor-pointer border px-2 py-1 font-mono-code text-xs font-bold uppercase ${
                showTally ? 'border-stone-950 bg-[var(--selected)]' : 'border-stone-700 bg-[#faf6ed]'
              }`}
              onClick={() => setShowTally((v) => !v)}
            >
              Tally
            </button>
            <button
              type="button"
              className={`cursor-pointer border px-2 py-1 font-mono-code text-xs font-bold uppercase ${
                night ? 'border-stone-950 bg-[var(--selected)]' : 'border-stone-700 bg-[#faf6ed]'
              }`}
              onClick={() => setNight((v) => !v)}
            >
              Night
            </button>
            <button
              type="button"
              className={`cursor-pointer border px-2 py-1 font-mono-code text-xs font-bold uppercase ${
                homophonic ? 'border-stone-950 bg-[var(--selected)]' : 'border-stone-700 bg-[#faf6ed]'
              }`}
              onClick={() => setHomophonic((v) => !v)}
            >
              Homophonic
            </button>
            <button
              type="button"
              className="ml-auto cursor-pointer border border-stone-950 bg-stone-900 px-2 py-1 font-mono-code text-xs font-bold uppercase text-[#f7f3e8]"
              onClick={() => setDock(false)}
            >
              Hide · Esc
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ShotPage />
  </StrictMode>
);
