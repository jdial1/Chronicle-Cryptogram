import React, { useEffect, useRef, useState } from 'react';
import { CryptogramWord, SymbolMapping } from '../types';
import { DecodedStamp, PuzzleSilhouette, RotateCcw, Search, BarChart3, Type, Lightbulb } from '../icons';
import { GlyphTally, type GlyphCount } from './PrimerCoach';

interface CryptogramGridProps {
  words: CryptogramWord[];
  mappings: SymbolMapping;
  selectedSymbolId: string | null;
  onSelectSymbol: (symbolId: string, cellId?: string) => void;
  flaggedSymbolIds: string[];
  lockedSymbolIds: string[];
  isSolved: boolean;
  solvedInsert?: string;
  solvedSwap?: boolean;
  onClearLetters?: () => void;
  onUseHint?: () => void;
  onCheckLetter?: () => void;
  hintsRemaining?: number;
  checksRemaining?: number;
  silhouette?: string;
  night?: boolean;
  frequencies?: GlyphCount[];
}

const ZOOM_MIN = 0.8;
const ZOOM_MAX = 1.6;
const ZOOM_STEP = 0.15;
const ZOOM_DEFAULT = 1;

function isSymbolSolved(words: CryptogramWord[], mappings: SymbolMapping, symbolId: string | null) {
  if (!symbolId) return false;
  for (const word of words) {
    for (const symbol of word.symbols) {
      if (symbol.symbolId === symbolId && !symbol.isPunctuation) {
        return mappings[symbolId] === symbol.targetLetter;
      }
    }
  }
  return false;
}

function typewriterJitter() {
  return {
    rotate: `${(Math.random() * 6 - 3).toFixed(2)}deg`,
    y: `${(Math.random() * 2 - 1).toFixed(2)}px`,
  };
}

function wordEndsWith(word: CryptogramWord, char: string) {
  const last = word.symbols[word.symbols.length - 1];
  return Boolean(last?.isPunctuation && last.char === char);
}

function stripTrailing(word: CryptogramWord, char: string): CryptogramWord {
  if (!wordEndsWith(word, char)) return word;
  return { ...word, symbols: word.symbols.slice(0, -1) };
}

function withTrailingPeriod(word: CryptogramWord): CryptogramWord {
  if (wordEndsWith(word, '.')) return word;
  return {
    ...word,
    symbols: [
      ...word.symbols,
      { symbolId: 'punct_.', targetLetter: '.', isPunctuation: true, char: '.' },
    ],
  };
}

function splitSolvedClauses(words: CryptogramWord[]) {
  const cuts: number[] = [];
  words.forEach((word, index) => {
    if (wordEndsWith(word, '.')) cuts.push(index);
  });
  const lastCut = cuts[cuts.length - 1];
  const splitAt = lastCut === words.length - 1 ? cuts[cuts.length - 2] : lastCut;
  if (splitAt == null) return null;
  const head = words.slice(0, splitAt + 1);
  const tail = words.slice(splitAt + 1);
  if (!head.length || !tail.length) return null;
  return {
    head: [...head.slice(0, -1), stripTrailing(head[head.length - 1], '.')],
    tail: [...tail.slice(0, -1), stripTrailing(tail[tail.length - 1], '.')],
  };
}

function solvedLayout(words: CryptogramWord[], insert?: string, swap?: boolean) {
  if (!insert && !swap) return null;
  const split = splitSolvedClauses(words);
  if (!split) return null;
  const first = swap ? split.tail : split.head;
  const second = swap ? split.head : split.tail;
  return {
    first,
    second: [...second.slice(0, -1), withTrailingPeriod(second[second.length - 1])],
  };
}

export const CryptogramGrid: React.FC<CryptogramGridProps> = ({
  words,
  mappings,
  selectedSymbolId,
  onSelectSymbol,
  flaggedSymbolIds,
  lockedSymbolIds,
  isSolved,
  solvedInsert,
  solvedSwap,
  onClearLetters,
  onUseHint,
  onCheckLetter,
  hintsRemaining = 0,
  checksRemaining = 0,
  silhouette,
  night = false,
  frequencies,
}) => {
  const [zoom, setZoom] = useState(ZOOM_DEFAULT);
  const [showTally, setShowTally] = useState(false);
  const jitterRef = useRef<Record<string, { letter: string; rotate: string; y: string }>>({});
  const skipJitter =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const layout = isSolved ? solvedLayout(words, solvedInsert, solvedSwap) : null;
  const rows = layout ? [layout.first, layout.second] : [words];
  const hintReady = Boolean(selectedSymbolId) && !isSymbolSolved(words, mappings, selectedSymbolId);
  const mappedSelected = Boolean(selectedSymbolId && mappings[selectedSymbolId]);
  const checkReady =
    mappedSelected &&
    !lockedSymbolIds.includes(selectedSymbolId!) &&
    !flaggedSymbolIds.includes(selectedSymbolId!);

  useEffect(() => {
    jitterRef.current = {};
    setShowTally(false);
  }, [words]);

  const renderWords = (list: CryptogramWord[]) =>
    list.map((word) => (
      <div
        key={word.id}
        className="cipher-word flex flex-wrap items-end gap-3 w-fit max-w-full min-w-0 pb-1 border-b-2 border-stone-700/80 overflow-visible"
      >
        {word.symbols.map((item, charIdx) => {
          if (item.isPunctuation) {
            return (
              <div
                key={`${word.id}_punct_${charIdx}`}
                className="cipher-punct flex flex-col items-center justify-end px-1 font-typewriter font-black text-stone-950 pb-1"
              >
                <span>{item.char}</span>
              </div>
            );
          }

          const isSelected = !isSolved && selectedSymbolId === item.symbolId;
          const mappedLetter = mappings[item.symbolId] || '';
          const isError = !isSolved && flaggedSymbolIds.includes(item.symbolId) && mappedLetter && mappedLetter !== item.targetLetter;
          const cellKey = `${word.id}_${charIdx}`;
          let jitter = jitterRef.current[cellKey];
          if (!mappedLetter || skipJitter) {
            delete jitterRef.current[cellKey];
            jitter = undefined;
          } else if (!jitter || jitter.letter !== mappedLetter) {
            jitter = { letter: mappedLetter, ...typewriterJitter() };
            jitterRef.current[cellKey] = jitter;
          }

          return (
            <button
              key={`${word.id}_sym_${charIdx}`}
              type="button"
              data-cipher-symbol={item.symbolId}
              data-cipher-cell={cellKey}
              disabled={isSolved}
              tabIndex={isSolved ? -1 : 0}
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => {
                if (!isSolved) onSelectSymbol(item.symbolId, cellKey);
              }}
              className={`cipher-tile group relative flex flex-col items-center justify-between p-1 rounded-xs ${
                isSolved
                  ? 'bg-[#fbf8f0] border border-stone-600/70 cursor-default'
                  : isSelected
                  ? 'bg-[#ffe8a3] ring-2 ring-stone-950 shadow-md scale-105 z-10 cursor-pointer transition-transform duration-100'
                  : 'hover:bg-[#faeed6] bg-[#fbf8f0] border border-stone-600/70 shadow-2xs cursor-pointer transition-colors duration-100'
              } ${isError ? 'bg-red-100 border-red-700 ring-1 ring-red-700' : ''}`}
              aria-pressed={isSelected}
              aria-label={
                mappedLetter
                  ? `Cipher glyph ${item.char}, mapped to ${mappedLetter}`
                  : `Cipher glyph ${item.char}, unmapped`
              }
            >
              <div className="cipher-letter w-full flex items-center justify-center border-b border-stone-400/80 relative">
                {mappedLetter ? (
                  <span
                    className={`cipher-mapped font-typewriter font-black uppercase tracking-wider leading-none select-none ${
                      isError ? 'text-red-700' : 'text-stone-950 scanned-ink'
                    }`}
                    style={
                      jitter
                        ? ({
                            '--type-rot': jitter.rotate,
                            '--type-y': jitter.y,
                          } as React.CSSProperties)
                        : undefined
                    }
                  >
                    {mappedLetter}
                  </span>
                ) : (
                  <span className="w-3.5 h-0.5 bg-stone-700 mt-3 group-hover:bg-stone-950 transition-colors" />
                )}

                {isError && (
                  <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-600 rounded-full ring-1 ring-white" />
                )}
              </div>

              {!isSolved && (
                <div
                  className={`cipher-glyph w-full flex items-center justify-center font-treatise font-bold ${
                    isSelected
                      ? 'text-stone-950 font-black scale-110'
                      : 'text-stone-900 group-hover:text-stone-950'
                  }`}
                >
                  <span>{item.char}</span>
                </div>
              )}

              {isSelected && (
                <span className="absolute -inset-0.5 border-2 border-stone-950 rounded-xs pointer-events-none" />
              )}
            </button>
          );
        })}
      </div>
    ));

  return (
    <div
      id="cryptogram-board"
      role="group"
      aria-label="Cryptogram puzzle"
      style={{ '--cipher-zoom': isSolved ? ZOOM_DEFAULT : zoom } as React.CSSProperties}
      onPointerDown={(event) => {
        if (!isSolved) event.preventDefault();
      }}
      className={`w-full min-w-0 bg-[#f4eee2] border-2 border-stone-900 rounded-xs bg-scanned-doc relative select-none ${
        isSolved ? 'is-solved' : ''
      }`}
    >
      {isSolved && <DecodedStamp size="board" />}
      <svg aria-hidden className="absolute w-0 h-0 overflow-hidden pointer-events-none">
        <filter id="solved-insert-ink" x="-20%" y="-60%" width="140%" height="220%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="4" seed="8" result="grit" />
          <feDisplacementMap in="SourceGraphic" in2="grit" scale="0.35" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <div className="cipher-folio">
      <PuzzleSilhouette
        name={silhouette}
        className={`newspaper-silhouette cipher-silhouette${night ? ' is-night' : ''}`}
      />
      <div className="cipher-lines relative z-10 flex flex-wrap items-end gap-x-5 sm:gap-x-7 gap-y-7 sm:gap-y-9 w-full min-w-0 max-w-5xl mx-auto justify-start">
        {renderWords(rows[0])}
        {layout ? (
          <>
            {solvedInsert ? <span className="solved-insert">{solvedInsert}</span> : null}
            {renderWords(rows[1])}
          </>
        ) : null}
      </div>
      </div>
      {!isSolved && (
        <>
          {showTally && frequencies ? (
            <div className="glyph-tally-dock">
              <GlyphTally
                frequencies={frequencies}
                selectedSymbolId={selectedSymbolId}
                onSelectSymbol={onSelectSymbol}
                standalone
              />
            </div>
          ) : null}
          <div className="brass-loupe">
          <button
            type="button"
            aria-label="Decrease puzzle text size"
            disabled={zoom <= ZOOM_MIN}
            onPointerDown={(event) => event.preventDefault()}
            onClick={() => setZoom((value) => Math.max(ZOOM_MIN, Math.round((value - ZOOM_STEP) * 100) / 100))}
          >
            <Search className="w-3 h-3" />
          </button>
          <button
            type="button"
            aria-label="Increase puzzle text size"
            disabled={zoom >= ZOOM_MAX}
            onPointerDown={(event) => event.preventDefault()}
            onClick={() => setZoom((value) => Math.min(ZOOM_MAX, Math.round((value + ZOOM_STEP) * 100) / 100))}
          >
            <Search className="w-5 h-5" />
          </button>
          {onCheckLetter ? (
            <button
              type="button"
              className="hint-tool"
              aria-label={`Check the highlighted letter, ${checksRemaining} remaining today`}
              title="Check the highlighted letter. Three checks per day."
              disabled={checksRemaining <= 0 || !checkReady}
              onPointerDown={(event) => event.preventDefault()}
              onClick={onCheckLetter}
            >
              <Type className="w-4 h-4" />
              {checksRemaining > 0 ? <sup className="hint-count">{checksRemaining}</sup> : null}
            </button>
          ) : null}
          {onUseHint ? (
            <button
              type="button"
              className="hint-tool"
              aria-label={`Reveal the highlighted letter, ${hintsRemaining} remaining today`}
              title="Reveal the highlighted letter. Three hints per day."
              disabled={hintsRemaining <= 0 || !hintReady}
              onPointerDown={(event) => event.preventDefault()}
              onClick={onUseHint}
            >
              <Lightbulb className="w-4 h-4" />
              {hintsRemaining > 0 ? <sup className="hint-count">{hintsRemaining}</sup> : null}
            </button>
          ) : null}
          {frequencies ? (
            <button
              type="button"
              aria-label="Toggle glyph tally"
              title="Glyph tally"
              aria-pressed={showTally}
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => setShowTally((value) => !value)}
            >
              <BarChart3 className="w-4 h-4" />
            </button>
          ) : null}
          {onClearLetters ? (
            <button
              type="button"
              aria-label="Clear all letters"
              title="Clear all letters"
              onPointerDown={(event) => event.preventDefault()}
              onClick={onClearLetters}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          ) : null}
        </div>
        </>
      )}
    </div>
  );
};
