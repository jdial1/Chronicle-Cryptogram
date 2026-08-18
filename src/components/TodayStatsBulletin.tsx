import React from 'react';
import { Zap, Users, TrendingUp, Award, Unlock, X } from '../icons';
import { formatTime } from '../utils/cipherEngine';
import { PuzzleData } from '../types';
import { isPrimerPuzzle } from '../utils/edition';
import { usePuzzleStats } from '../utils/usePuzzleStats';
import { derivePublicStats } from '../utils/firebaseStore';

interface SolvedStatsProps {
  currentPuzzle: PuzzleData;
  timerSeconds: number;
  onUnlockHardMode?: () => void;
  isHardUnlocked?: boolean;
  onOpenTodayEdition?: () => void;
}

interface TodayStatsBulletinProps extends SolvedStatsProps {
  isOpen: boolean;
  onClose: () => void;
}

function isHardPuzzle(puzzle: PuzzleData) {
  return puzzle.difficultyMode === 'Hard' || puzzle.difficulty === 'Hard';
}

export function LiveStatsRow({ puzzleId }: { puzzleId: string }) {
  const liveStats = usePuzzleStats(puzzleId);
  const currentStats = derivePublicStats(liveStats);

  const cells = [
    {
      icon: <Zap className="w-4 h-4 text-amber-800 fill-amber-500 shrink-0" />,
      label: 'Quickest Solve',
      value: liveStats.completeCount > 0 ? formatTime(currentStats.quickestSolveTime) : '—',
    },
    {
      icon: <Users className="w-4 h-4 text-stone-800 shrink-0" />,
      label: 'Total Solvers',
      value: currentStats.totalSolvers.toLocaleString(),
    },
    {
      icon: <TrendingUp className="w-4 h-4 text-emerald-800 shrink-0" />,
      label: 'Solve Rate',
      value: `${currentStats.solveRatePercentage}%`,
    },
    {
      icon: <Award className="w-4 h-4 text-stone-800 shrink-0" />,
      label: 'Average Time',
      value: liveStats.completeCount > 0 ? formatTime(currentStats.averageTimeSeconds) : '—',
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
      {cells.map((cell) => (
        <div
          key={cell.label}
          className="flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-2 p-1.5 sm:p-2 bg-[#f8f4ea] border border-stone-300 rounded-xs min-w-0"
        >
          {cell.icon}
          <div className="overflow-hidden text-center sm:text-left min-w-0">
            <span className="block text-[8px] sm:text-[9px] font-typewriter font-bold uppercase text-stone-600 truncate">
              {cell.label}
            </span>
            <span className="text-xs sm:text-sm font-typewriter font-bold text-stone-950">
              {cell.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function NightPostButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full px-4 py-2.5 bg-stone-950 hover:bg-stone-800 text-amber-100 font-typewriter font-bold text-xs uppercase rounded-xs cursor-pointer shadow-xs transition-colors"
    >
      Read the Night Post
    </button>
  );
}

export const TodayStatsBulletin: React.FC<TodayStatsBulletinProps> = ({
  currentPuzzle,
  timerSeconds,
  onUnlockHardMode,
  isHardUnlocked,
  isOpen,
  onClose,
  onOpenTodayEdition,
}) => {
  const isHard = isHardPuzzle(currentPuzzle);
  const isPrimer = isPrimerPuzzle(currentPuzzle);
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs select-none"
      onClick={onClose}
    >
      <section
        className="w-full max-w-2xl bg-[#fdfbf6] border-2 border-stone-900 rounded-xs shadow-2xl bg-scanned-doc overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="bg-stone-900 text-[#f7f3e8] px-3 sm:px-4 py-1.5 flex items-center justify-between gap-2 text-xs font-typewriter">
          <div className="flex items-center gap-2 font-bold tracking-wider min-w-0">
            <span className="bg-amber-500 text-stone-950 px-1.5 py-0.5 text-[10px] uppercase font-bold rounded-xs shrink-0">
              {isPrimer ? 'TRAINING DESK' : 'LIVE STATISTICS'}
            </span>
            <span className="text-amber-100 uppercase truncate">
              {isPrimer ? 'Codebreaker Primer' : `Global Solves — ${currentPuzzle.editionDate}`}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-white cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 sm:p-4 border-b border-stone-400">
          <p className={`font-treatise text-sm sm:text-base text-stone-900 leading-relaxed ${isPrimer ? '' : 'mb-3'}`}>
            {isPrimer ? (
              <>
                <strong>Primer decoded.</strong> You just used the five tells of English:
                single-letter words, frequent letters, short words, apostrophes, and doubles.
                Today's Vance Estate cipher is waiting.
              </>
            ) : (
              <>
                <strong>Congratulations, Codebreaker.</strong> You have successfully decrypted today's{' '}
                {isHard ? 'Night Extra' : 'Morning Edition'} cipher in{' '}
                <span className="font-typewriter font-bold bg-amber-200 px-1">{formatTime(timerSeconds)}</span>.
                Your time has been recorded in the national ledger.
              </>
            )}
          </p>
          {!isPrimer && <LiveStatsRow puzzleId={currentPuzzle.id} />}
        </div>

        {isPrimer && onOpenTodayEdition && (
          <div className="p-3 sm:p-4 bg-[#f4ede0]">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenTodayEdition();
              }}
              className="w-full px-4 py-2.5 bg-stone-950 hover:bg-stone-800 text-amber-100 font-typewriter font-bold text-xs uppercase rounded-xs cursor-pointer shadow-xs transition-colors"
            >
              Decode Today's Edition
            </button>
          </div>
        )}

        {!isPrimer && !isHard && onUnlockHardMode && (
          <div className="p-3 sm:p-4 bg-[#f4ede0] space-y-3">
            <div className="flex items-center gap-2">
              <Unlock className="w-5 h-5 text-emerald-700 shrink-0" />
              <div>
                <span className="block font-typewriter font-bold text-stone-950 text-sm">
                  NIGHT EXTRA {isHardUnlocked ? 'UNLOCKED' : 'AVAILABLE'}
                </span>
                <span className="block font-treatise text-stone-700 text-xs mt-0.5">
                  The composing room has set the Late City Final — a harder cipher under a new masthead.
                </span>
              </div>
            </div>
            <NightPostButton
              onClick={() => {
                onClose();
                onUnlockHardMode();
              }}
            />
          </div>
        )}
      </section>
    </div>
  );
};
