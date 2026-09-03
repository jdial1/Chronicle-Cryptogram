import React, { useEffect, useRef, useState } from 'react';
import { useZoom } from '../hooks/useZoom';
import { CryptogramWord, SymbolMapping } from '../types';
import { DecodedStamp, PuzzleSilhouette, RotateCcw, RefreshCw, BarChart3, Type, Lightbulb } from '../deskIcons';
import { GlyphTally, type GlyphCount } from './PrimerCoach';
import { TypewriterKeyboard, armKey, releaseKey } from './TypewriterKeyboard';
import { ZoomControls } from './ZoomControls';

interface CryptogramGridProps {
  words: CryptogramWord[];
  mappings: SymbolMapping;
  selectedSymbolId: string | null;
  onSelectSymbol: (symbolId: string, cellId?: string) => void;
  flaggedSymbolIds: string[];
  lockedSymbolIds: string[];
  isSolved: boolean;
  onClearLetters?: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
  onUseHint?: () => void;
  onCheckLetter?: () => void;
  hintsRemaining?: number;
  checksRemaining?: number;
  silhouette?: string;
  night?: boolean;
  frequencies?: GlyphCount[];
  deskArmed?: boolean;
  gameKeyboard?: boolean;
  onLetter?: (letter: string) => void;
  onBackspace?: () => void;
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

/** Per-cell typewriter wobble, keyed to the letter it was generated for. */
type TypewriterJitter = { letter: string; rotate: string; y: string };

function typewriterJitter() {
  return {
    rotate: `${(Math.random() * 6 - 3).toFixed(2)}deg`,
    y: `${(Math.random() * 2 - 1).toFixed(2)}px`,
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
  onClearLetters,
  onUndo,
  canUndo = false,
  onUseHint,
  onCheckLetter,
  hintsRemaining = 0,
  checksRemaining = 0,
  silhouette,
  night = false,
  frequencies,
  deskArmed = false,
  gameKeyboard = true,
  onLetter,
  onBackspace,
}) => {
  const { zoom, zoomOut, zoomIn, canZoomOut, canZoomIn } = useZoom(ZOOM_MIN, ZOOM_MAX, ZOOM_STEP, ZOOM_DEFAULT);
  const [showTally, setShowTally] = useState(false);
  const jitterRef = useRef<Record<string, TypewriterJitter>>({});
  const skipJitter =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hintReady = Boolean(selectedSymbolId) && !isSymbolSolved(words, mappings, selectedSymbolId);
  const mappedSelected = Boolean(selectedSymbolId && mappings[selectedSymbolId]);
  const selectedLocked = Boolean(selectedSymbolId && lockedSymbolIds.includes(selectedSymbolId));
  const selectedWrong = Boolean(selectedSymbolId && flaggedSymbolIds.includes(selectedSymbolId));
  const checkReady = mappedSelected && !selectedLocked && !selectedWrong;
  const deskNote = selectedLocked
    ? 'That mark is locked.'
    : selectedWrong
      ? 'That letter is wrong. Type a different one.'
      : checksRemaining <= 0
        ? 'No checks left today.'
        : !checkReady
          ? 'Select a mark and type a letter, then Check.'
          : `Check ${checksRemaining} · Hint ${hintsRemaining}`;

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
          let jitter: TypewriterJitter | undefined = jitterRef.current[cellKey];
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
                  ? 'bg-[var(--paper-card)] border border-stone-600/70 cursor-default'
                  : isSelected
                  ? 'is-selected bg-[var(--selected)] text-[var(--selected-ink)] ring-2 ring-stone-950 shadow-md scale-105 z-10 cursor-pointer transition-transform duration-100'
                  : 'hover:bg-[var(--paper-reading)] bg-[var(--paper-card)] border border-stone-600/70 shadow-2xs cursor-pointer transition-colors duration-100'
              } ${isError ? 'bg-red-100 border-red-700 ring-1 ring-red-700' : ''}`}
              aria-pressed={isSelected}
              aria-invalid={isError || undefined}
              aria-label={
                isError
                  ? `Cipher glyph ${item.char}, mapped to ${mappedLetter}, marked wrong`
                  : lockedSymbolIds.includes(item.symbolId) && mappedLetter
                    ? `Cipher glyph ${item.char}, locked as ${mappedLetter}`
                    : mappedLetter
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
      tabIndex={-1}
      role="group"
      aria-label="Cryptogram puzzle"
      style={{ '--cipher-zoom': isSolved ? ZOOM_DEFAULT : zoom } as React.CSSProperties}
      onPointerDown={(event) => {
        if (!isSolved) event.preventDefault();
      }}
      className={`w-full min-w-0 bg-[var(--paper-scan-fill)] border-2 border-stone-900 rounded-xs bg-scanned-doc relative select-none ${
        isSolved ? 'is-solved' : ''
      } ${!isSolved ? 'is-desk-armed' : ''} ${!isSolved && gameKeyboard ? 'has-typewriter' : ''} ${showTally ? 'has-tally' : ''}`}
    >
      {isSolved && <DecodedStamp size="board" />}
      <div className="cipher-folio">
      <PuzzleSilhouette
        name={silhouette}
        className={`newspaper-silhouette cipher-silhouette${night ? ' is-night' : ''}`}
      />
      <div className="cipher-lines relative z-10 flex flex-wrap items-end gap-x-5 sm:gap-x-7 gap-y-7 sm:gap-y-9 w-full min-w-0 justify-start">
        {renderWords(words)}
      </div>
      </div>
      {!isSolved && (
        <div className="cipher-desk">
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
          {!isSolved && gameKeyboard && onLetter && onBackspace ? (
            <TypewriterKeyboard onLetter={onLetter} onBackspace={onBackspace} />
          ) : null}
          <div className="cipher-zoom" role="group" aria-label="Puzzle type size">
            <ZoomControls
              canZoomOut={canZoomOut}
              canZoomIn={canZoomIn}
              onZoomOut={zoomOut}
              onZoomIn={zoomIn}
              outLabel="Decrease puzzle text size"
              inLabel="Increase puzzle text size"
              outCaption="A−"
              inCaption="A+"
              onPointerDown={armKey}
              onPointerUp={releaseKey}
              onPointerCancel={releaseKey}
            />
          </div>
          <p className="desk-status" role="status">
            {deskNote}
          </p>
          <div className="brass-loupe brass-loupe-actions">
          {onCheckLetter ? (
            <button
              type="button"
              className="hint-tool"
              data-caption="Check"
              aria-label={
                !checkReady || checksRemaining <= 0
                  ? deskNote
                  : `Check the highlighted letter, ${checksRemaining} remaining today`
              }
              title={
                !checkReady || checksRemaining <= 0
                  ? deskNote
                  : 'Check the highlighted letter. Three per day.'
              }
              disabled={checksRemaining <= 0 || !checkReady}
              onPointerDown={armKey}
              onPointerUp={releaseKey}
              onPointerCancel={releaseKey}
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
              data-caption="Hint"
              aria-label={
                hintsRemaining <= 0
                  ? 'No hints left today'
                  : selectedLocked
                    ? 'Hint unavailable, that mark is locked'
                    : !hintReady
                      ? selectedSymbolId
                        ? 'Hint unavailable, that letter is already solved'
                        : 'Hint unavailable, select a mark first'
                      : `Reveal the highlighted letter, ${hintsRemaining} remaining today`
              }
              title={
                hintsRemaining <= 0
                  ? 'No hints left today'
                  : selectedLocked
                    ? 'That mark is locked.'
                    : !hintReady
                      ? selectedSymbolId
                        ? 'That letter is already solved.'
                        : 'Select a mark first'
                      : 'Reveal the highlighted letter. Three per day.'
              }
              disabled={hintsRemaining <= 0 || !hintReady}
              onPointerDown={armKey}
              onPointerUp={releaseKey}
              onPointerCancel={releaseKey}
              onClick={onUseHint}
            >
              <Lightbulb className="w-4 h-4" />
              {hintsRemaining > 0 ? <sup className="hint-count">{hintsRemaining}</sup> : null}
            </button>
          ) : null}
          {onUndo ? (
            <button
              type="button"
              data-caption="Undo"
              aria-label="Undo last letter"
              title={canUndo ? 'Undo the last letter' : 'Nothing to undo'}
              disabled={!canUndo}
              onPointerDown={armKey}
              onPointerUp={releaseKey}
              onPointerCancel={releaseKey}
              onClick={onUndo}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          ) : null}
          {frequencies ? (
            <button
              type="button"
              data-caption="Tally"
              className="loupe-secondary"
              aria-label="Toggle glyph tally"
              title="Count repeating marks"
              aria-pressed={showTally}
              onPointerDown={armKey}
              onPointerUp={releaseKey}
              onPointerCancel={releaseKey}
              onClick={() => setShowTally((value) => !value)}
            >
              <BarChart3 className="w-4 h-4" />
            </button>
          ) : null}
          {onClearLetters ? (
            <button
              type="button"
              data-caption="Wipe"
              className="loupe-secondary"
              aria-label="Wipe all guesses"
              title="Wipe all guesses. The cipher stays."
              onPointerDown={armKey}
              onPointerUp={releaseKey}
              onPointerCancel={releaseKey}
              onClick={onClearLetters}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          ) : null}
        </div>
        </div>
      )}
    </div>
  );
};
