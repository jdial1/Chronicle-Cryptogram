import React from 'react';
import { CryptogramWord, SymbolMapping } from '../types';

interface CryptogramGridProps {
  words: CryptogramWord[];
  mappings: SymbolMapping;
  selectedSymbolId: string | null;
  onSelectSymbol: (symbolId: string) => void;
  showErrors: boolean;
  isSolved: boolean;
}

export const CryptogramGrid: React.FC<CryptogramGridProps> = ({
  words,
  mappings,
  selectedSymbolId,
  onSelectSymbol,
  showErrors,
  isSolved,
}) => {
  return (
    <div
      id="cryptogram-board"
      className={`w-full bg-[#f4eee2] p-4 sm:p-7 md:p-9 border-2 border-stone-900 rounded-xs bg-scanned-doc relative select-none overflow-hidden ${
        isSolved ? 'puzzle-dithered' : ''
      }`}
      aria-disabled={isSolved}
    >
      <div className="flex flex-wrap items-end gap-x-5 sm:gap-x-7 gap-y-7 sm:gap-y-9 max-w-5xl mx-auto justify-center sm:justify-start">
        {words.map((word) => (
          <div
            key={word.id}
            className="flex items-end gap-1 sm:gap-1.5 pb-1 border-b-2 border-stone-700/80"
          >
            {word.symbols.map((item, charIdx) => {
              if (item.isPunctuation) {
                return (
                  <div
                    key={`${word.id}_punct_${charIdx}`}
                    className="flex flex-col items-center justify-end h-16 sm:h-20 px-1 font-typewriter text-2xl sm:text-3xl font-black text-stone-950 pb-1"
                  >
                    <span>{item.char}</span>
                  </div>
                );
              }

              const isSelected = !isSolved && selectedSymbolId === item.symbolId;
              const mappedLetter = mappings[item.symbolId] || '';
              const isError = !isSolved && showErrors && mappedLetter && mappedLetter !== item.targetLetter;

              return (
                <button
                  key={`${word.id}_sym_${charIdx}`}
                  type="button"
                  disabled={isSolved}
                  tabIndex={isSolved ? -1 : 0}
                  onClick={() => {
                    if (!isSolved) onSelectSymbol(item.symbolId);
                  }}
                  className={`group relative flex flex-col items-center justify-between w-9 h-16 sm:w-11 sm:h-20 p-1 rounded-xs ${
                    isSolved
                      ? 'bg-[#fbf8f0] border border-stone-600/70 cursor-default'
                      : isSelected
                      ? 'bg-[#ffe8a3] ring-2 ring-stone-950 shadow-md scale-105 z-10 cursor-pointer transition-all duration-100'
                      : 'hover:bg-[#faeed6] bg-[#fbf8f0] border border-stone-600/70 shadow-2xs cursor-pointer transition-all duration-100'
                  } ${isError ? 'bg-red-100 border-red-700 ring-1 ring-red-700' : ''}`}
                  aria-label={`Cipher symbol with target ${item.targetLetter}, currently mapped to ${mappedLetter || 'none'}`}
                  aria-readonly={isSolved}
                >
                  <div className="w-full h-8 sm:h-10 flex items-center justify-center border-b border-stone-400/80 relative overflow-hidden">
                    {mappedLetter ? (
                      <span
                        className={`font-typewriter text-xl sm:text-2xl font-black uppercase tracking-wider leading-none select-none ${
                          isError ? 'text-red-700' : 'text-stone-950 scanned-ink'
                        }`}
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

                  <div
                    className={`w-full h-7 sm:h-8 flex items-center justify-center font-treatise text-lg sm:text-2xl font-bold ${
                      isSelected
                        ? 'text-stone-950 font-black scale-110'
                        : 'text-stone-900 group-hover:text-stone-950'
                    }`}
                  >
                    <span>{item.char}</span>
                  </div>

                  {isSelected && (
                    <span className="absolute -inset-0.5 border-2 border-stone-950 rounded-xs pointer-events-none" />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
