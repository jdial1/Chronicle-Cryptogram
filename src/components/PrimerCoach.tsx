import React from 'react';
import { CheckCircle2, BookOpen, Key, BarChart3 } from '../icons';
import { CryptogramWord, SymbolMapping } from '../types';
import { CIPHER_TACTICS } from '../data/cipherTactics';

interface GlyphCount {
  symbolId: string;
  glyph: string;
  count: number;
  mappedLetter: string;
}

interface PrimerCoachProps {
  words: CryptogramWord[];
  mappings: SymbolMapping;
  isSolved: boolean;
  frequencies: GlyphCount[];
  selectedSymbolId: string | null;
  onSelectSymbol: (symbolId: string) => void;
  onOpenHandbook?: () => void;
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
    'This dispatch opens with a one-letter word, so try I. Later you will also meet a standalone A.',
  frequency:
    'Count the glyphs. The busiest marks in this cipher are likely E or T — the same letters that dominate English.',
  'short-words':
    'THE appears twice. AND is close behind. AT is a common two-letter word once T is in ink.',
  apostrophes:
    'CAN\'T hides an apostrophe. One letter after it is usually S, T, D, or M — and N\'T solves both N and T.',
  doubles:
    'SEE hides EE in the middle of a short word. LOOK and TOO hide OO. LETTER hides TT.',
};

export const PrimerCoach: React.FC<PrimerCoachProps> = ({
  words,
  mappings,
  isSolved,
  frequencies,
  selectedSymbolId,
  onSelectSymbol,
  onOpenHandbook,
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
  const activeIndex = steps.findIndex((step) => !step.done);
  const tally = frequencies.filter((item) => item.count > 1);
  const topCount = tally[0]?.count || 0;

  return (
    <aside className="mb-3 border-2 border-stone-800 bg-[#f8f3e8] overflow-hidden">
      <div className="bg-stone-900 text-amber-100 px-3 py-1.5 flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 min-w-0">
          <Key className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-typewriter font-black text-[10px] uppercase tracking-widest truncate">
            Five Tells Of English
          </span>
        </span>
        {onOpenHandbook && (
          <button
            type="button"
            onClick={onOpenHandbook}
            className="inline-flex items-center gap-1 font-typewriter font-bold text-[10px] uppercase tracking-widest text-amber-300 hover:text-amber-100 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Handbook
          </button>
        )}
      </div>
      <ol className="p-3 space-y-2">
        {steps.map((step, index) => {
          const active = !isSolved && index === activeIndex;
          const done = isSolved || step.done;
          return (
            <li
              key={step.id}
              className={`p-2 border rounded-xs ${
                done
                  ? 'border-emerald-700/50 bg-emerald-50/70'
                  : active
                    ? 'border-amber-700 bg-amber-100/70 ring-1 ring-amber-700'
                    : 'border-stone-300 bg-[#fdfbf6] opacity-70'
              }`}
            >
              <div className="flex items-center gap-2">
                {done ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
                ) : (
                  <span className="w-3.5 h-3.5 flex items-center justify-center font-typewriter font-black text-[10px] text-stone-700 shrink-0">
                    {index + 1}
                  </span>
                )}
                <span className="font-typewriter font-black text-[10px] uppercase tracking-widest text-stone-900">
                  {step.title}
                </span>
              </div>
              {active && (
                <p className="mt-1 font-treatise text-xs text-stone-700 leading-relaxed">
                  {step.summary} {step.hint}
                </p>
              )}
            </li>
          );
        })}
      </ol>
      <div className="border-t-2 border-stone-800 bg-[#f4ede0] px-3 py-2.5">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 font-typewriter font-black text-[10px] uppercase tracking-widest text-stone-900">
            <BarChart3 className="w-3.5 h-3.5 text-amber-800" />
            Glyph tally
          </span>
          <span className="font-treatise text-[11px] text-stone-600">
            Busiest first — English favors E, T, A, O, I, N
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {tally.map((item) => {
            const selected = selectedSymbolId === item.symbolId;
            const hottest = item.count === topCount && topCount > 1;
            return (
              <button
                key={item.symbolId}
                type="button"
                onClick={() => onSelectSymbol(item.symbolId)}
                className={`w-9 sm:w-10 py-1 flex flex-col items-center border rounded-xs cursor-pointer ${
                  selected
                    ? 'bg-amber-200 border-stone-950 ring-1 ring-stone-950'
                    : hottest
                      ? 'bg-amber-100/80 border-amber-800'
                      : 'bg-[#fdfbf6] border-stone-400 hover:border-stone-700'
                }`}
                title={`${item.count} ${item.count === 1 ? 'time' : 'times'}${item.mappedLetter ? ` → ${item.mappedLetter}` : ''}`}
              >
                <span className="font-treatise text-base leading-none text-stone-950">{item.glyph}</span>
                <span className="font-typewriter font-black text-[10px] text-stone-800 leading-none mt-0.5">
                  {item.count}
                </span>
                <span className="font-typewriter text-[9px] font-bold text-amber-900 leading-none mt-0.5 min-h-[10px]">
                  {item.mappedLetter || ' '}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
