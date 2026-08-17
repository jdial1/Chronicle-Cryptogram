import React, { useState } from 'react';
import { Delete, Lightbulb, CheckSquare, Edit3, PenTool, RotateCcw, Keyboard, ChevronDown, ChevronUp } from 'lucide-react';
import { SymbolMapping } from '../types';

interface VirtualKeyboardProps {
  onKeyPress: (letter: string) => void;
  onBackspace: () => void;
  onClearSymbol: () => void;
  onResetMappings: () => void;
  onUseHint: () => void;
  onToggleShowErrors: () => void;
  showErrors: boolean;
  penMode: 'pen' | 'pencil';
  onTogglePenMode: () => void;
  mappings: SymbolMapping;
  selectedSymbolId: string | null;
  selectedLetter: string;
  hintsRemaining: number;
}

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({
  onKeyPress,
  onBackspace,
  onClearSymbol,
  onResetMappings,
  onUseHint,
  onToggleShowErrors,
  showErrors,
  penMode,
  onTogglePenMode,
  mappings,
  selectedSymbolId,
  selectedLetter,
  hintsRemaining,
}) => {
  // Onscreen keyboard is hidden by default
  const [showVirtualKeys, setShowVirtualKeys] = useState(false);

  // Map of letters already in use by which symbolId
  const usedLetters = Object.values(mappings).filter(Boolean);

  return (
    <div
      id="cryptogram-controls"
      className="w-full bg-[#f4eee1] p-3 sm:p-4 border-2 border-stone-800 shadow-md max-w-4xl mx-auto rounded-sm select-none mt-2"
    >
      {/* Sleek Decoder Control Bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {/* Left: Pen vs Pencil Mode & Erase */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#faf6ed] p-0.5 rounded border border-stone-400">
            <button
              type="button"
              onClick={onTogglePenMode}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-mono-code font-bold rounded-xs transition-colors cursor-pointer ${
                penMode === 'pen'
                  ? 'bg-stone-900 text-amber-100 shadow-xs'
                  : 'text-stone-700 hover:text-stone-950'
              }`}
              title="Ink Pen: Direct Cipher Mapping"
            >
              <PenTool className="w-3.5 h-3.5 text-amber-300" />
              <span>PEN</span>
            </button>
            <button
              type="button"
              onClick={onTogglePenMode}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-mono-code font-bold rounded-xs transition-colors cursor-pointer ${
                penMode === 'pencil'
                  ? 'bg-stone-700 text-stone-100 shadow-xs'
                  : 'text-stone-700 hover:text-stone-950'
              }`}
              title="Graphite Pencil: Pencil Marks"
            >
              <Edit3 className="w-3.5 h-3.5 text-stone-300" />
              <span>PENCIL</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClearSymbol}
            disabled={!selectedSymbolId}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-mono-code font-bold rounded-xs border transition-colors ${
              selectedSymbolId
                ? 'bg-[#faf6ed] hover:bg-stone-200 text-stone-800 border-stone-400 cursor-pointer'
                : 'bg-stone-200 text-stone-400 border-stone-300 cursor-not-allowed opacity-60'
            }`}
            title="Erase Current Symbol Mapping (Backspace / Delete)"
          >
            <Delete className="w-3.5 h-3.5" />
            <span>ERASE</span>
          </button>
        </div>

        {/* Center: Physical Keyboard Input Guide */}
        <div className="hidden md:flex items-center gap-1 text-[11px] font-mono-code text-stone-600 bg-[#ebe3d3] px-2.5 py-1 rounded border border-stone-400/60">
          <span>Type any key <strong className="text-stone-900">A–Z</strong> • Use <strong className="text-stone-900">← →</strong> / <strong className="text-stone-900">Tab</strong> to move</span>
        </div>

        {/* Right: Actions (Hint, Check, Reset, Optional Onscreen Keyboard Toggle) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={onUseHint}
            disabled={hintsRemaining <= 0}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-mono-code font-bold rounded-xs shadow-xs transition-transform active:scale-95 cursor-pointer ${
              hintsRemaining > 0
                ? 'bg-amber-700 hover:bg-amber-800 text-amber-50'
                : 'bg-stone-300 text-stone-500 cursor-not-allowed'
            }`}
            title="Reveal 1 Symbol"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-200 fill-amber-200" />
            <span>HINT ({hintsRemaining})</span>
          </button>

          <button
            type="button"
            onClick={onToggleShowErrors}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-mono-code font-bold rounded-xs border transition-colors cursor-pointer ${
              showErrors
                ? 'bg-red-700 text-white border-red-800'
                : 'bg-[#faf6ed] text-stone-800 border-stone-400 hover:bg-stone-100'
            }`}
            title="Highlight Incorrect Mappings"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>CHECK</span>
          </button>

          <button
            type="button"
            onClick={onResetMappings}
            className="p-1.5 text-stone-700 hover:text-red-700 hover:bg-red-50 border border-stone-400 rounded-xs bg-[#faf6ed] cursor-pointer"
            title="Reset All Mappings"
            aria-label="Reset puzzle"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Toggle for Touch / Virtual Keyboard (Hidden by default) */}
          <button
            type="button"
            onClick={() => setShowVirtualKeys(!showVirtualKeys)}
            className="flex items-center gap-1 px-2 py-1 text-xs font-mono-code text-stone-700 hover:text-stone-950 bg-[#faf6ed] border border-stone-400 rounded-xs cursor-pointer ml-1"
            title={showVirtualKeys ? 'Hide Onscreen Keys' : 'Show Onscreen Keys'}
          >
            <Keyboard className="w-3.5 h-3.5 text-stone-600" />
            {showVirtualKeys ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Optional Collapsible Onscreen Keyboard (Hidden by default) */}
      {showVirtualKeys && (
        <div className="flex flex-col gap-1 sm:gap-1.5 items-center w-full mt-3 pt-3 border-t border-stone-400/80">
          {KEYBOARD_ROWS.map((row, rowIdx) => (
            <div key={`row_${rowIdx}`} className="flex justify-center gap-1 sm:gap-1.5 w-full max-w-2xl">
              {rowIdx === 2 && (
                <button
                  type="button"
                  onClick={onClearSymbol}
                  disabled={!selectedSymbolId}
                  className={`flex-1 min-w-[36px] sm:min-w-[48px] h-9 sm:h-11 flex items-center justify-center font-mono-code text-xs font-bold rounded-xs border border-stone-500 shadow-xs transition-transform active:scale-95 ${
                    selectedSymbolId
                      ? 'bg-[#e5dec9] hover:bg-[#d8d0b8] text-stone-900 cursor-pointer'
                      : 'bg-stone-200 text-stone-400 opacity-60 cursor-not-allowed'
                  }`}
                  title="Erase Current Symbol Mapping"
                >
                  CLEAR
                </button>
              )}

              {row.map((letter) => {
                const isUsed = usedLetters.includes(letter);
                const isMappedToCurrent = selectedLetter === letter;

                return (
                  <button
                    key={letter}
                    type="button"
                    onClick={() => onKeyPress(letter)}
                    className={`flex-1 min-w-[26px] sm:min-w-[36px] max-w-[44px] h-9 sm:h-11 flex flex-col items-center justify-center font-typewriter text-sm sm:text-lg font-bold rounded-xs border shadow-xs transition-transform active:scale-90 cursor-pointer ${
                      isMappedToCurrent
                        ? 'bg-amber-400 text-stone-950 border-stone-900 ring-2 ring-stone-900 font-black'
                        : isUsed
                        ? 'bg-stone-300/80 text-stone-600 border-stone-400'
                        : 'bg-[#fdfbf7] hover:bg-amber-100 text-stone-950 border-stone-400 font-bold'
                    }`}
                    aria-label={`Letter ${letter}`}
                  >
                    <span>{letter}</span>
                  </button>
                );
              })}

              {rowIdx === 2 && (
                <button
                  type="button"
                  onClick={onBackspace}
                  className="flex-1 min-w-[36px] sm:min-w-[48px] h-9 sm:h-11 flex items-center justify-center font-mono-code text-stone-900 bg-[#e5dec9] hover:bg-[#d8d0b8] border border-stone-500 rounded-xs shadow-xs transition-transform active:scale-95 cursor-pointer"
                  title="Backspace"
                  aria-label="Backspace"
                >
                  <Delete className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

