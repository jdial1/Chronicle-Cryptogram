import React from 'react';
import { X, BookOpen, Key } from '../icons';
import { CIPHER_INTRO, CIPHER_TACTICS } from '../data/cipherTactics';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="bg-[#fcf9f2] w-full max-w-2xl rounded-sm border-2 border-stone-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-stone-900 text-stone-100 p-3 sm:p-4 flex items-center justify-between border-b-2 border-amber-600">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-base sm:text-lg font-masthead font-bold tracking-wide text-amber-100 uppercase">
                Codebreaker's Handbook
              </h2>
              <p className="text-[11px] font-mono-code text-stone-400">
                Five tells of English, plus the rules of this dispatch
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

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-newsprint text-stone-900 font-newspaper text-sm space-y-4">
          <p className="text-stone-700 leading-relaxed">{CIPHER_INTRO}</p>

          <section className="space-y-2">
            <h3 className="font-headline font-bold text-base text-stone-950 uppercase flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-700" />
              <span>How This Cipher Works</span>
            </h3>
            <p className="text-stone-700 leading-relaxed">
              Every glyph (such as <strong>⊕</strong>, <strong>◬</strong>, <strong>◪</strong>, <strong>Ǝ</strong>, <strong>Ↄ</strong>, <strong>⊥</strong>, or <strong>⊡</strong>) stands for an English letter. Tap a glyph, then type a letter — every copy of that glyph fills at once.
            </p>
            <div className="p-3 bg-[#fdfbf6] border-l-4 border-amber-600 rounded-r-xs font-mono-code text-xs text-stone-900 shadow-2xs space-y-1.5">
              <div>
                <strong>Morning Edition:</strong> One glyph per letter, so frequency counting works.
              </div>
              <div>
                <strong>Night Extra:</strong> Common letters like <strong>E, T, A, O, I, N</strong> are split across several glyphs to flatten those peaks.
              </div>
            </div>
          </section>

          {CIPHER_TACTICS.map((tactic, index) => (
            <section key={tactic.id} className="space-y-2">
              <h3 className="font-headline font-bold text-base text-stone-950 uppercase">
                {index + 1}. {tactic.title}
              </h3>
              <p className="text-stone-700 leading-relaxed">{tactic.summary}</p>
              <ul className="list-disc list-inside space-y-1.5 text-stone-700 text-xs sm:text-sm">
                {tactic.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="p-3 bg-[#f4eee1] border-t border-stone-400 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-900 text-stone-100 rounded-xs font-mono-code font-bold text-xs cursor-pointer"
          >
            I'm Ready to Decode
          </button>
        </div>
      </div>
    </div>
  );
};
