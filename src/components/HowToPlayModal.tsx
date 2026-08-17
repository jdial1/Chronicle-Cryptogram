import React from 'react';
import { X, HelpCircle, CheckCircle, Sparkles, BookOpen, Key } from 'lucide-react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="bg-[#fcf9f2] w-full max-w-2xl rounded-sm border-2 border-stone-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-stone-900 text-stone-100 p-3 sm:p-4 flex items-center justify-between border-b-2 border-amber-600">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-base sm:text-lg font-masthead font-bold tracking-wide text-amber-100 uppercase">
                Codebreaker's Handbook
              </h2>
              <p className="text-[11px] font-mono-code text-stone-400">
                Official Rules of Zodiac Substitution Cryptograms
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-newsprint text-stone-900 font-newspaper text-sm space-y-4">
          <section className="space-y-2">
            <h3 className="font-headline font-bold text-base text-stone-950 uppercase flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-700" />
              <span>1. Homophonic Substitution & Frequency Suppression</span>
            </h3>
            <p className="text-stone-700 leading-relaxed">
              Every mysterious glyph (such as <strong>⊕</strong>, <strong>◬</strong>, <strong>◪</strong>, <strong>Ǝ</strong>, <strong>Ↄ</strong>, <strong>⊥</strong>, or <strong>⊡</strong>) is one of the 54 authentic Zodiac Killer cipher characters and represents an English letter from A to Z.
            </p>
            <div className="p-3 bg-[#fdfbf6] border-l-4 border-amber-600 rounded-r-xs font-mono-code text-xs text-stone-900 shadow-2xs space-y-1.5">
              <div>
                <strong>Homophone Suppression:</strong> Common letters like <strong>E, T, A, O, I, N</strong> are mapped to <em>multiple distinct symbols</em> (homophones) to suppress frequency peaks, just like historical Zodiac ciphers.
              </div>
              <div>
                <strong>Mapping Rule:</strong> Selecting a symbol and assigning it a letter updates <em>all identical instances of that specific symbol</em> across the entire dispatch. You can assign the same letter to multiple homophone symbols!
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="font-headline font-bold text-base text-stone-950 uppercase flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-700" />
              <span>2. Codebreaking Tactics</span>
            </h3>
            <ul className="list-disc list-inside space-y-1.5 text-stone-700 text-xs sm:text-sm">
              <li>
                <strong>Single-Letter Clues:</strong> Words consisting of a single character are almost always <strong>A</strong> or <strong>I</strong>.
              </li>
              <li>
                <strong>High Frequency Vowels & Consonants:</strong> <strong>E</strong>, <strong>T</strong>, <strong>A</strong>, <strong>O</strong>, <strong>I</strong>, and <strong>N</strong> appear most frequently in English prose.
              </li>
              <li>
                <strong>Common Two & Three-Letter Words:</strong> Look for patterns matching <strong>THE</strong>, <strong>AND</strong>, <strong>OF</strong>, <strong>TO</strong>, <strong>IS</strong>, <strong>IN</strong>, <strong>THAT</strong>.
              </li>
              <li>
                <strong>Double Symbols:</strong> Two identical symbols side-by-side often signify <strong>LL</strong>, <strong>EE</strong>, <strong>SS</strong>, or <strong>OO</strong>.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="font-headline font-bold text-base text-stone-950 uppercase flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-700" />
              <span>3. Pen vs. Pencil Mode</span>
            </h3>
            <p className="text-stone-700 text-xs sm:text-sm leading-relaxed">
              Use <strong>PEN</strong> mode for definitive letter placements, or toggle to <strong>PENCIL</strong> mode to test tentative hypotheses without committing.
            </p>
          </section>
        </div>

        {/* Footer */}
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
