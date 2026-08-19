import React, { useEffect, useRef, useState } from 'react';
import { CryptogramWord, SymbolMapping } from '../types';
import { DecodedStamp, RotateCcw, Search } from '../icons';

interface CryptogramGridProps {
  words: CryptogramWord[];
  mappings: SymbolMapping;
  selectedSymbolId: string | null;
  onSelectSymbol: (symbolId: string) => void;
  showErrors: boolean;
  isSolved: boolean;
  solvedInsert?: string;
  solvedSwap?: boolean;
  onClearLetters?: () => void;
}

const ZOOM_MIN = 0.8;
const ZOOM_MAX = 1.6;
const ZOOM_STEP = 0.15;
const ZOOM_DEFAULT = 1;

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
  if (!insert) return null;
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
  showErrors,
  isSolved,
  solvedInsert,
  solvedSwap,
  onClearLetters,
}) => {
  const [zoom, setZoom] = useState(ZOOM_DEFAULT);
  const jitterRef = useRef<Record<string, { letter: string; rotate: string; y: string }>>({});
  const layout = isSolved ? solvedLayout(words, solvedInsert, solvedSwap) : null;
  const rows = layout ? [layout.first, layout.second] : [words];

  useEffect(() => {
    jitterRef.current = {};
  }, [words]);

  const renderWords = (list: CryptogramWord[]) =>
    list.map((word) => (
      <div
        key={word.id}
        className="flex flex-wrap items-end gap-1 sm:gap-1.5 w-fit max-w-full min-w-0 pb-1 border-b-2 border-stone-700/80"
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
          const isError = !isSolved && showErrors && mappedLetter && mappedLetter !== item.targetLetter;
          const cellKey = `${word.id}_${charIdx}`;
          let jitter = jitterRef.current[cellKey];
          if (!mappedLetter) {
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
              disabled={isSolved}
              tabIndex={isSolved ? -1 : 0}
              onClick={() => {
                if (!isSolved) onSelectSymbol(item.symbolId);
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
                  <span className="w-3.5 h-0.5 bg-stone-400 mt-3 group-hover:bg-stone-700 transition-colors" />
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
      className={`w-full min-w-0 bg-[#f4eee2] p-4 sm:p-7 md:p-9 border-2 border-stone-900 rounded-xs bg-scanned-doc relative select-none overflow-x-hidden ${
        isSolved ? 'is-solved' : 'pt-11 sm:pt-11 md:pt-11'
      }`}
    >
      {!isSolved && (
        <div className="absolute top-1.5 right-1.5 z-20 brass-loupe">
          <button
            type="button"
            aria-label="Decrease puzzle text size"
            disabled={zoom <= ZOOM_MIN}
            onClick={() => setZoom((value) => Math.max(ZOOM_MIN, Math.round((value - ZOOM_STEP) * 100) / 100))}
          >
            <Search className="w-3 h-3" />
          </button>
          <button
            type="button"
            aria-label="Reset puzzle text size"
            disabled={zoom === ZOOM_DEFAULT}
            onClick={() => setZoom(ZOOM_DEFAULT)}
          >
            <Search className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            aria-label="Increase puzzle text size"
            disabled={zoom >= ZOOM_MAX}
            onClick={() => setZoom((value) => Math.min(ZOOM_MAX, Math.round((value + ZOOM_STEP) * 100) / 100))}
          >
            <Search className="w-5 h-5" />
          </button>
          {onClearLetters ? (
            <button
              type="button"
              aria-label="Clear all letters"
              title="Clear all letters"
              onClick={onClearLetters}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </div>
      )}
      {isSolved && <DecodedStamp size="board" />}
      <div className="flex flex-wrap items-end gap-x-5 sm:gap-x-7 gap-y-7 sm:gap-y-9 w-full min-w-0 max-w-5xl mx-auto justify-start">
        {renderWords(rows[0])}
        {layout ? (
          <>
            <span className="solved-insert">{solvedInsert}</span>
            {renderWords(rows[1])}
          </>
        ) : null}
      </div>
    </div>
  );
};
