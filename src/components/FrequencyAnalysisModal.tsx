import React from 'react';
import { X, BarChart3, HelpCircle, ArrowRight } from '../icons';
import { ENGLISH_LETTER_FREQUENCIES } from '../utils/cipherEngine';

interface FrequencyAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbolFrequencies: {
    symbolId: string;
    glyph: string;
    count: number;
    percentage: number;
    mappedLetter: string;
  }[];
  onSelectSymbolFromFreq?: (symbolId: string) => void;
}

export const FrequencyAnalysisModal: React.FC<FrequencyAnalysisModalProps> = ({
  isOpen,
  onClose,
  symbolFrequencies,
  onSelectSymbolFromFreq,
}) => {
  if (!isOpen) return null;

  const englishFrequenciesList = Object.entries(ENGLISH_LETTER_FREQUENCIES).sort((a, b) => b[1] - a[1]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="bg-[#fcf9f2] w-full max-w-3xl rounded-sm border-2 border-stone-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-stone-900 text-stone-100 p-3 sm:p-4 flex items-center justify-between border-b-2 border-amber-600">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-base sm:text-lg font-masthead font-bold tracking-wide text-amber-100 uppercase">
                Cryptanalyst Frequency Table
              </h2>
              <p className="text-[11px] font-mono-code text-stone-400">
                Symbol Distribution vs. Standard English Letter Frequencies (ETAOIN SHRDLU)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-100 rounded hover:bg-stone-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4 bg-newsprint">
          {/* Left: Active Cipher Symbol Frequencies */}
          <div className="bg-[#fdfbf6] p-3 sm:p-4 border border-stone-400 rounded-xs shadow-xs">
            <div className="flex items-center justify-between border-b-2 border-stone-800 pb-2 mb-3">
              <h3 className="font-headline font-bold text-sm text-stone-900 uppercase">
                Current Puzzle Symbols ({symbolFrequencies.length} Unique)
              </h3>
              <span className="text-[10px] font-mono-code text-stone-500 uppercase">Sorted by Count</span>
            </div>

            <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
              {symbolFrequencies.map((item) => (
                <button
                  key={item.symbolId}
                  onClick={() => {
                    if (onSelectSymbolFromFreq) onSelectSymbolFromFreq(item.symbolId);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-1.5 bg-[#faf6ee] hover:bg-amber-100 border border-stone-300 rounded-xs text-xs font-mono-code transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 flex items-center justify-center bg-[#fdfaf3] border border-stone-800 text-base font-bold text-stone-900 rounded-xs group-hover:scale-105 transition-transform">
                      {item.glyph}
                    </span>
                    <div className="flex flex-col">
                      <span className="font-bold text-stone-900">
                        {item.count} {item.count === 1 ? 'time' : 'times'}
                      </span>
                      <span className="text-[10px] text-stone-500">{item.percentage.toFixed(1)}% of text</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-stone-400 text-[10px]">Mapped:</span>
                    <span
                      className={`w-6 h-6 flex items-center justify-center font-handwritten text-lg font-bold rounded-xs ${
                        item.mappedLetter
                          ? 'bg-amber-300 text-[#0f172a] border border-stone-800 font-bold'
                          : 'bg-stone-200 text-stone-400 border border-dashed border-stone-400'
                      }`}
                    >
                      {item.mappedLetter || '?'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right: Standard English Frequencies Reference & Pro Tips */}
          <div className="flex flex-col gap-3">
            <div className="bg-[#fdfbf6] p-3 sm:p-4 border border-stone-400 rounded-xs shadow-xs">
              <div className="flex items-center justify-between border-b-2 border-stone-800 pb-2 mb-3">
                <h3 className="font-headline font-bold text-sm text-stone-900 uppercase">
                  Standard English Frequencies
                </h3>
                <span className="text-[10px] font-mono-code text-stone-500">Normal Prose</span>
              </div>

              <div className="grid grid-cols-4 gap-1 text-xs font-mono-code max-h-[160px] overflow-y-auto">
                {englishFrequenciesList.slice(0, 16).map(([letter, freq]) => (
                  <div
                    key={letter}
                    className="p-1 bg-[#faf6ee] border border-stone-300 rounded-xs flex items-center justify-between"
                  >
                    <span className="font-bold font-typewriter text-stone-900 text-sm">{letter}</span>
                    <span className="text-[10px] text-stone-600">{freq}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cryptanalyst Tips & Homophone Frequency Suppression Insights */}
            <div className="bg-[#f4efe4] p-3 sm:p-4 border border-stone-400 rounded-xs font-newspaper text-xs text-stone-800 space-y-2">
              <div className="flex items-center gap-1.5 text-amber-950 font-bold font-headline uppercase text-xs">
                <HelpCircle className="w-4 h-4 text-amber-700" />
                <span>Homophonic Frequency Suppression:</span>
              </div>
              <div className="p-2 bg-[#eae3d2] rounded border border-stone-400/80 font-mono-code text-[11px] text-stone-900 leading-snug">
                <strong>Frequency Flattener Active:</strong> High-frequency letters like <strong>E, T, A, O, I, N</strong> are encrypted using <em>multiple distinct homophone symbols</em>. Each symbol's frequency is suppressed to ~2–3% to defeat naive frequency analysis!
              </div>
              <ul className="list-disc list-inside space-y-1 text-stone-700">
                <li>
                  <strong>Multiple Symbols for One Letter:</strong> Two or more different symbols (e.g. ⊕ and ◬) may legitimately both decode to <strong>E</strong>.
                </li>
                <li>
                  <strong>Single-Letter Words</strong>: Standalone isolated symbols are almost always <strong>A</strong> or <strong>I</strong>.
                </li>
                <li>
                  <strong>Common Trigrams</strong>: Look for structural patterns matching <strong>THE</strong>, <strong>AND</strong>, <strong>FOR</strong>, <strong>YOU</strong>, <strong>WAS</strong>.
                </li>
                <li>
                  <strong>Doublets</strong>: Adjacent paired symbols often signal common doubles like <strong>LL</strong>, <strong>EE</strong>, <strong>SS</strong>, <strong>OO</strong>.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#f4eee1] border-t border-stone-400 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-900 text-stone-100 rounded-xs font-mono-code font-bold text-xs cursor-pointer"
          >
            Return to Cipher
          </button>
        </div>
      </div>
    </div>
  );
};
