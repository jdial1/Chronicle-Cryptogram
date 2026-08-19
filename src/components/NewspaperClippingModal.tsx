import React, { useState } from 'react';
import { X, Trophy, Copy, Check, ArrowRight, ShieldCheck, PuzzleSilhouette } from '../icons';
import { PuzzleData } from '../types';
import { formatSolvedQuote } from '../utils/cipherEngine';

interface NewspaperClippingModalProps {
  isOpen: boolean;
  onClose: () => void;
  puzzle: PuzzleData;
  timeFormatted: string;
  accuracy: number;
  hintsUsed: number;
  onOpenLeaderboard: () => void;
  onNextPuzzle?: () => void;
}

export const NewspaperClippingModal: React.FC<NewspaperClippingModalProps> = ({
  isOpen,
  onClose,
  puzzle,
  timeFormatted,
  accuracy,
  hintsUsed,
  onOpenLeaderboard,
  onNextPuzzle,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareText = `📰 CHRONICLE CRYPTOGRAM — EDITION #${puzzle.editionNumber}
🔍 Solved: "${puzzle.headline}"
⏱️ Time: ${timeFormatted}
🎯 Accuracy: ${accuracy}%
💡 Hints Used: ${hintsUsed}
🏆 Official Bureau Rank Verification: #1 Candidate
Play Chronicle Cryptogram: ${window.location.href}`;

  const handleCopyShare = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="modal-backdrop z-50 select-none">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="clipping-headline"
        className="modal-sheet max-w-2xl sm:border-4 sm:border-double sm:border-stone-900 relative"
      >
        {/* Newspaper Top Extra Banner */}
        <div className="bg-[#ebe4d4] text-stone-950 p-2 text-center border-b-2 border-stone-800">
          <div className="flex items-center justify-between px-3">
            <span className="text-[10px] font-mono-code font-bold uppercase tracking-widest text-stone-700">
              SPECIAL BULLETIN EDITION
            </span>
            <span className="text-[10px] font-mono-code font-bold uppercase text-stone-700">
              VOL. LVIII — CERTIFIED
            </span>
            <button
              type="button"
              onClick={onClose}
              className="text-stone-700 hover:text-stone-950 p-0.5 cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Newspaper Clipping Body */}
        <div className="flex-1 min-h-0 p-4 sm:p-7 overflow-y-auto bg-[#faf6ed] text-stone-900 font-newspaper space-y-4">
          {/* Main Headline */}
          <div className="text-center border-b-2 border-stone-800 pb-3">
            <span className="bg-[color:var(--ink-cinnabar)] text-[#f7f3e8] font-mono-code font-black text-xs px-2.5 py-0.5 uppercase tracking-widest rounded-xs inline-block mb-1.5">
              EXTRA! EXTRA! CIPHER CRACKED
            </span>
            <h2 id="clipping-headline" className="text-2xl sm:text-4xl font-headline font-black uppercase tracking-tight text-stone-950 leading-tight">
              {puzzle.headline}
            </h2>
            <p className="text-xs font-mono-code text-stone-600 uppercase tracking-widest mt-1">
              DISPATCH NO. {puzzle.editionNumber} • OFFICIALLY DECRYPTED BY AGENT
            </p>
          </div>

          {/* Decoded Quote Plaque */}
          <div className="clipping-deck bg-[#fdfbf7] p-4 sm:p-5 border-2 border-stone-800 rounded-xs shadow-inner relative">
            <PuzzleSilhouette
              name={puzzle.silhouette}
              className={`newspaper-silhouette clipping-silhouette${puzzle.editionSlot === 'Evening' ? ' is-night' : ''}`}
            />
            <div className="relative flex items-center gap-2 mb-2 font-mono-code text-xs font-bold text-stone-700">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>OFFICIAL DECRYPTED TRANSCRIPT:</span>
            </div>
            <p className="relative font-typewriter text-sm sm:text-base font-bold text-stone-950 leading-relaxed">
              "{formatSolvedQuote(puzzle.originalText, puzzle.solvedInsert, puzzle.solvedSwap)}"
            </p>

            {/* Vintage Red Ink Stamp */}
            <div className="absolute -bottom-2 -right-2 transform rotate-[-8deg] border-2 border-[color:var(--ink-cinnabar)] text-[color:var(--ink-cinnabar)] font-mono-code font-black text-xs sm:text-sm px-3 py-1 bg-[#f7f3e8]/90 rounded-xs uppercase tracking-widest shadow-xs pointer-events-none mix-blend-multiply opacity-90">
              ✓ DECODED & FILED
            </div>
          </div>

          {/* Codebreaker Stats Grid */}
          <div className="grid grid-cols-3 gap-2 py-2 border-t border-b border-stone-800 text-center font-mono-code">
            <div className="p-2 bg-[#f4eee1] border border-stone-400 rounded-xs">
              <span className="block text-[10px] text-stone-700 font-bold uppercase">Time Elapsed</span>
              <span className="text-lg sm:text-xl font-bold text-stone-950">{timeFormatted}</span>
            </div>
            <div className="p-2 bg-[#f4eee1] border border-stone-400 rounded-xs">
              <span className="block text-[10px] text-stone-700 font-bold uppercase">Accuracy</span>
              <span className="text-lg sm:text-xl font-bold text-emerald-800">{accuracy}%</span>
            </div>
            <div className="p-2 bg-[#f4eee1] border border-stone-400 rounded-xs">
              <span className="block text-[10px] text-stone-700 font-bold uppercase">Hints Used</span>
              <span className="text-lg sm:text-xl font-bold text-stone-950">{hintsUsed}</span>
            </div>
          </div>

          {/* Story Context Paragraph */}
          <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
            Bureau officials commended the remarkable speed and deduction shown in unraveling this cryptic
            Zodiac transmission. Your performance has been logged into today's permanent record for ranking
            against fellow codebreakers worldwide.
          </p>
        </div>

        {/* Action Buttons Footer */}
        <div className="p-3 sm:p-4 bg-[#f0eae1] border-t-2 border-stone-800 flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={handleCopyShare}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#faf6ed] hover:bg-stone-100 text-stone-900 border border-stone-500 font-mono-code font-bold text-xs rounded-xs shadow-xs cursor-pointer active:scale-95 transition-transform"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-stone-700" />}
            <span>{copied ? 'Telegram Copied!' : 'Copy Share Telegram'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenLeaderboard();
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-stone-950 font-mono-code font-bold text-xs rounded-xs shadow-xs cursor-pointer active:scale-95 transition-transform"
            >
              <Trophy className="w-4 h-4" />
              <span>Post to Global Leaderboard</span>
            </button>

            {onNextPuzzle && (
              <button
                onClick={onNextPuzzle}
                className="flex items-center gap-1 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-stone-950 font-mono-code font-bold text-xs rounded-xs shadow-xs cursor-pointer"
              >
                <span>Next Cipher</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
