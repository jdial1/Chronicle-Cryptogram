import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Key } from '../deskIcons';
import { CryptogramWord, SymbolMapping } from '../types';
import { CIPHER_TACTICS } from '../data/cipherTactics';

export interface GlyphCount {
  symbolId: string;
  glyph: string;
  count: number;
  mappedLetter: string;
}

interface PrimerCoachProps {
  words: CryptogramWord[];
  mappings: SymbolMapping;
  isSolved: boolean;
  compact?: boolean;
}

export function GlyphTally({
  frequencies,
  selectedSymbolId,
  onSelectSymbol,
  standalone = false,
}: {
  frequencies: GlyphCount[];
  selectedSymbolId: string | null;
  onSelectSymbol: (symbolId: string) => void;
  standalone?: boolean;
}) {
  const tally = frequencies.filter((item) => item.count > 1);
  const topCount = tally[0]?.count || 0;
  if (!tally.length) return null;
  return (
    <div
      className={
        standalone
          ? 'border-2 border-stone-800 bg-[var(--paper-masthead)] px-3 py-2.5'
          : 'border-t-2 border-stone-800 bg-[var(--paper-masthead)] px-3 py-2.5'
      }
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="font-typewriter font-black text-xs uppercase tracking-widest text-stone-800">
          Glyph tally
        </span>
        <span className="font-treatise text-xs text-stone-800">
          Busiest first. English leans on E, T, A, O, I, N
        </span>
      </div>
      <div className="glyph-tally-row flex flex-nowrap sm:flex-wrap gap-1 overflow-x-auto sm:overflow-visible">
        {tally.map((item) => {
          const selected = selectedSymbolId === item.symbolId;
          const hottest = item.count === topCount && topCount > 1;
          return (
            <button
              key={item.symbolId}
              type="button"
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => onSelectSymbol(item.symbolId)}
              className={`desk-hit shrink-0 min-w-12 py-1 flex flex-col items-center justify-center border rounded-xs cursor-pointer touch-manipulation ${
                selected
                  ? 'bg-amber-200 border-stone-950 ring-1 ring-stone-950'
                  : hottest
                    ? 'bg-amber-100/80 border-amber-800'
                    : 'bg-[var(--paper-card)] border-stone-400 hover:border-stone-700'
              }`}
              title={`${item.count} ${item.count === 1 ? 'time' : 'times'}${item.mappedLetter ? ` → ${item.mappedLetter}` : ''}`}
              aria-label={`Glyph ${item.glyph}, ${item.count} ${item.count === 1 ? 'time' : 'times'}${item.mappedLetter ? `, mapped to ${item.mappedLetter}` : ', unmapped'}`}
              aria-pressed={selected}
            >
              <span className="font-treatise text-base leading-none text-stone-950">{item.glyph}</span>
              <span className="font-typewriter font-black text-xs text-stone-800 leading-none mt-0.5">
                {item.count}
              </span>
              <span className="font-typewriter text-xs font-bold text-amber-900 leading-none mt-0.5 min-h-3">
                {item.mappedLetter || ' '}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function letterMapped(words: CryptogramWord[], mappings: SymbolMapping, letter: string) {
  return words.some((word) =>
    word.symbols.some(
      (symbol) =>
        !symbol.isPunctuation &&
        symbol.targetLetter === letter &&
        mappings[symbol.symbolId] === letter
    )
  );
}

const PRIMER_HINTS: Record<string, string> = {
  singles:
    'This dispatch opens on a lone mark. Nine times out of ten that is I. You will meet a lonely A later.',
  frequency:
    'Tally the marks. The loudest ones are usually E or T. That is how the language breathes.',
  'short-words':
    'THE shows twice. AND is right behind it. Once T is in ink, AT is a cheap two-letter word.',
  apostrophes:
    "CAN'T hides an apostrophe. The letter after it is usually S, T, D, or M — and N'T hands you both N and T.",
  doubles:
    'SEE hides EE in a short word. LOOK and TOO hide OO. LETTER hides TT. Doubles do not lie on the morning edition.',
};

export const PrimerCoach: React.FC<PrimerCoachProps> = ({
  words,
  mappings,
  isSolved,
  compact = false,
}) => {
  const doneById: Record<string, boolean> = {
    singles: letterMapped(words, mappings, 'I'),
    frequency: letterMapped(words, mappings, 'E') || letterMapped(words, mappings, 'T'),
    'short-words':
      letterMapped(words, mappings, 'T') &&
      letterMapped(words, mappings, 'H') &&
      letterMapped(words, mappings, 'E'),
    apostrophes: letterMapped(words, mappings, 'N') && letterMapped(words, mappings, 'T'),
    doubles: letterMapped(words, mappings, 'O'),
  };

  const steps = CIPHER_TACTICS.map((tactic) => ({
    ...tactic,
    hint: PRIMER_HINTS[tactic.id],
    done: Boolean(doneById[tactic.id]),
  }));
  const nextTell = steps.findIndex((step) => !step.done);
  const unlockedIndex = isSolved || nextTell === -1 ? steps.length - 1 : nextTell;
  const [viewIndex, setViewIndex] = useState(0);

  useEffect(() => {
    setViewIndex(unlockedIndex);
  }, [unlockedIndex]);

  const viewed = steps[viewIndex];
  const tellNumber = viewIndex + 1;
  const done = isSolved || viewed.done;
  const atStart = viewIndex === 0;
  const atEnd = viewIndex === steps.length - 1;

  return (
    <aside className={`primer-coach mb-3 border-2 border-stone-800 bg-[var(--paper)] overflow-hidden${compact ? ' is-compact' : ''}`}>
      <div className="primer-coach-rail bg-[var(--paper-masthead)] text-stone-950 px-3 py-1.5 flex items-center justify-between gap-2 border-b border-stone-400">
        <span className="flex items-center gap-2 min-w-0">
          <Key className="w-4 h-4 shrink-0" />
          <span className="font-typewriter font-black text-xs uppercase tracking-widest truncate">
            Five Tells Of English
          </span>
        </span>
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => setViewIndex((index) => Math.max(0, index - 1))}
            disabled={atStart}
            className="desk-hit text-stone-800 disabled:text-stone-600 cursor-pointer disabled:cursor-default"
            aria-label="Previous tell"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-typewriter font-bold text-xs uppercase tracking-widest text-stone-700 tabular-nums min-w-[3.25rem] text-center">
            {tellNumber} of {steps.length}
          </span>
          <button
            type="button"
            onClick={() => setViewIndex((index) => Math.min(steps.length - 1, index + 1))}
            disabled={atEnd}
            className="desk-hit text-stone-800 disabled:text-stone-600 cursor-pointer disabled:cursor-default"
            aria-label="Next tell"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="p-2 sm:p-3">
        <div
          className={`p-2 border rounded-xs ${
            done
              ? 'border-emerald-700/50 bg-emerald-50/70'
              : 'border-amber-700 bg-amber-100/70 ring-1 ring-amber-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 flex items-center justify-center font-typewriter font-black text-xs text-stone-700 shrink-0">
              {tellNumber}
            </span>
            <span className="font-typewriter font-black text-xs uppercase tracking-widest text-stone-900">
              {viewed.title}
            </span>
          </div>
          <p className="primer-coach-copy mt-1 font-treatise text-xs text-stone-700 leading-relaxed">
            {viewed.summary} {viewed.hint}
          </p>
        </div>
      </div>
    </aside>
  );
};
