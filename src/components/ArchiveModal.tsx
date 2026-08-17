import React, { useState } from 'react';
import { X, Calendar, Newspaper, ArrowRight, CheckCircle2, Bookmark, Flame } from 'lucide-react';
import { PuzzleData } from '../types';

interface ArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  puzzles: PuzzleData[];
  currentPuzzleId: string;
  onSelectPuzzle: (puzzle: PuzzleData) => void;
  solvedPuzzleIds: string[];
}

export const ArchiveModal: React.FC<ArchiveModalProps> = ({
  isOpen,
  onClose,
  puzzles,
  currentPuzzleId,
  onSelectPuzzle,
  solvedPuzzleIds,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  if (!isOpen) return null;

  const categories = ['All', '☀️ Easy Editions', '🌙 Hard Editions', 'Historical', 'AI Generated'];

  const filteredPuzzles = puzzles.filter((p) => {
    if (selectedCategory === 'All') return true;
    if (selectedCategory === '☀️ Easy Editions') return p.difficultyMode === 'Easy' || p.difficulty === 'Easy' || p.difficulty === 'Beginner';
    if (selectedCategory === '🌙 Hard Editions') return p.difficultyMode === 'Hard' || p.difficulty === 'Hard' || p.difficulty === 'Master' || p.difficulty === 'Intermediate';
    if (selectedCategory === 'Historical') return p.difficulty === 'Historical' || p.category === 'Historical';
    if (selectedCategory === 'AI Generated') return p.category === 'AI Generated';
    return p.category === selectedCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="bg-[#fcf9f2] w-full max-w-3xl rounded-sm border-2 border-stone-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-stone-900 text-stone-100 p-3 sm:p-4 flex items-center justify-between border-b-2 border-amber-600">
          <div className="flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-base sm:text-lg font-masthead font-bold tracking-wide text-amber-100 uppercase">
                The Chronicle Cipher Archives
              </h2>
              <p className="text-[11px] font-mono-code text-stone-400">
                Browse Past Daily Editions & Historical Ciphers
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

        {/* Category Filter Pills */}
        <div className="px-3 sm:px-4 py-2 bg-[#f4eee1] border-b border-stone-400 flex items-center gap-1.5 flex-wrap text-xs font-mono-code">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 font-bold rounded-xs transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-stone-900 text-amber-100 shadow-xs'
                  : 'bg-[#faf6ee] text-stone-700 hover:bg-stone-200 border border-stone-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Puzzle List Grid */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 bg-newsprint space-y-3">
          {filteredPuzzles.map((puzzle) => {
            const isCurrent = puzzle.id === currentPuzzleId;
            const isSolved = solvedPuzzleIds.includes(puzzle.id);

            return (
              <div
                key={puzzle.id}
                className={`p-3 sm:p-4 rounded-xs border transition-all ${
                  isCurrent
                    ? 'bg-amber-100/80 border-stone-900 ring-1 ring-stone-900 shadow-md'
                    : 'bg-[#fdfbf6] hover:bg-amber-50/70 border-stone-400 shadow-xs'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap text-xs font-mono-code">
                      <span className="font-bold text-stone-900 uppercase">
                        EDITION #{puzzle.editionNumber}
                      </span>
                      <span className="text-stone-400">•</span>
                      <span className="text-stone-600">{puzzle.editionDate}</span>
                      <span className="text-stone-400">•</span>
                      <span
                        className={`px-1.5 py-0.5 rounded-xs font-bold text-[10px] uppercase flex items-center gap-1 ${
                          puzzle.difficultyMode === 'Easy' || puzzle.difficulty === 'Easy' || puzzle.difficulty === 'Beginner'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}
                      >
                        {puzzle.editionSlot === 'Morning' ? '☀️ Morning Easy' : puzzle.editionSlot === 'Evening' ? '🌙 Evening Hard' : puzzle.difficulty}
                      </span>
                      <span className="text-stone-500 font-newspaper italic">
                        {puzzle.theme}
                      </span>
                    </div>

                    <h3 className="font-headline font-bold text-base sm:text-lg text-stone-950 uppercase">
                      {puzzle.headline}
                    </h3>
                    <p className="font-newspaper text-xs text-stone-600 line-clamp-1">
                      {puzzle.subheadline}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {isSolved && (
                      <span className="flex items-center gap-1 text-emerald-800 font-mono-code font-bold text-xs bg-emerald-50 px-2 py-1 border border-emerald-300 rounded-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Solved</span>
                      </span>
                    )}

                    <button
                      onClick={() => {
                        onSelectPuzzle(puzzle);
                        onClose();
                      }}
                      className={`flex items-center gap-1 px-3 py-1.5 font-mono-code font-bold text-xs rounded-xs shadow-xs cursor-pointer active:scale-95 transition-transform ${
                        isCurrent
                          ? 'bg-stone-900 text-amber-200'
                          : 'bg-amber-700 hover:bg-amber-800 text-white'
                      }`}
                    >
                      <span>{isCurrent ? 'Currently Playing' : 'Open Cipher'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#f4eee1] border-t border-stone-400 flex justify-between items-center text-xs font-mono-code text-stone-600">
          <span>{puzzles.length} Total Editions in Chronicle Vault</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-900 text-stone-100 rounded-xs font-bold cursor-pointer"
          >
            Close Archives
          </button>
        </div>
      </div>
    </div>
  );
};
