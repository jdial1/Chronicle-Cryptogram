import React from 'react';
import { Zap, Users, TrendingUp, Award, X } from '../icons';
import { formatTime } from '../utils/cipherEngine';
import { PuzzleData } from '../types';
import { isPrimerPuzzle } from '../utils/edition';
import { usePuzzleStats } from '../utils/usePuzzleStats';
import { derivePublicStats } from '../utils/firebaseStore';

interface SolvedStatsProps {
  currentPuzzle: PuzzleData;
  timerSeconds: number;
  onUnlockHardMode?: () => void;
  onOpenTodayEdition?: () => void;
  onOpenDayOne?: () => void;
  offerStoryCatchUp?: boolean;
  currentEditionNumber?: number;
}

interface TodayStatsBulletinProps extends SolvedStatsProps {
  isOpen: boolean;
  onClose: () => void;
}

function isHardPuzzle(puzzle: PuzzleData) {
  return puzzle.difficultyMode === 'Hard' || puzzle.difficulty === 'Hard';
}

const inkAction =
  'w-full min-h-12 sm:w-auto sm:min-h-0 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-stone-950 font-typewriter font-bold text-xs uppercase tracking-wider cursor-pointer';

const inkSecondary =
  'w-full min-h-12 sm:w-auto sm:min-h-0 px-4 py-2.5 border-2 border-stone-800 bg-[#f8f3e8] hover:bg-amber-100 text-stone-950 font-typewriter font-bold text-xs uppercase tracking-wider cursor-pointer';

export function PrimerPathButtons({
  offerCatchUp,
  currentEditionNumber,
  onOpenDayOne,
  onOpenTodayEdition,
}: {
  offerCatchUp: boolean;
  currentEditionNumber?: number;
  onOpenDayOne?: () => void;
  onOpenTodayEdition: () => void;
}) {
  if (offerCatchUp && onOpenDayOne) {
    return (
      <div className="flex flex-col sm:flex-row gap-2">
        <button type="button" onClick={onOpenDayOne} className={inkAction}>
          Start on Day 1
        </button>
        <button type="button" onClick={onOpenTodayEdition} className={inkSecondary}>
          {currentEditionNumber != null ? `Go to Day ${currentEditionNumber}` : 'Go to Today'}
        </button>
      </div>
    );
  }

  return (
    <button type="button" onClick={onOpenTodayEdition} className={inkAction}>
      Decode Today's Edition
    </button>
  );
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
            <span className="block text-[8px] sm:text-[9px] font-typewriter font-bold uppercase text-stone-700 truncate">
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
    <button type="button" onClick={onClick} className={inkAction}>
      Read the Night Post
    </button>
  );
}

export const TodayStatsBulletin: React.FC<TodayStatsBulletinProps> = ({
  currentPuzzle,
  timerSeconds,
  onUnlockHardMode,
  isOpen,
  onClose,
  onOpenTodayEdition,
  onOpenDayOne,
  offerStoryCatchUp = false,
  currentEditionNumber,
}) => {
  const isHard = isHardPuzzle(currentPuzzle);
  const isPrimer = isPrimerPuzzle(currentPuzzle);
  if (!isOpen) return null;

  const title = isPrimer ? 'Primer decoded' : isHard ? 'Night Extra decoded' : 'Morning Edition decoded';
  const showPrimerPath = isPrimer && onOpenTodayEdition;
  const showNightPost = !isPrimer && !isHard && onUnlockHardMode;

  return (
    <div className="modal-backdrop is-slip z-50 select-none" onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="stats-bulletin-title"
        className="modal-sheet is-slip max-w-md"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-masthead">
          <h2
            id="stats-bulletin-title"
            className="text-base sm:text-lg font-masthead font-bold tracking-wide uppercase leading-tight"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 min-w-11 min-h-11 sm:min-w-0 sm:min-h-0 sm:p-1 flex items-center justify-center text-stone-700 hover:text-stone-950 rounded hover:bg-stone-200 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 text-center">
          <p className="font-typewriter text-[10px] uppercase tracking-[0.2em] text-stone-600">Your time</p>
          <p className="mt-1 font-typewriter font-black text-4xl sm:text-5xl text-stone-950 tabular-nums leading-none">
            {formatTime(timerSeconds)}
          </p>
          {showPrimerPath && offerStoryCatchUp && (
            <p className="mt-4 font-newspaper text-sm text-stone-700 leading-relaxed">
              The story has already begun. Start on Day 1, or go to the current day.
            </p>
          )}
        </div>

        {showPrimerPath && (
          <div className="modal-action-dock p-3 sm:flex sm:justify-end sm:px-4 sm:py-2.5">
            <PrimerPathButtons
              offerCatchUp={offerStoryCatchUp}
              currentEditionNumber={currentEditionNumber}
              onOpenDayOne={
                onOpenDayOne
                  ? () => {
                      onClose();
                      onOpenDayOne();
                    }
                  : undefined
              }
              onOpenTodayEdition={() => {
                onClose();
                onOpenTodayEdition();
              }}
            />
          </div>
        )}

        {showNightPost && (
          <div className="modal-action-dock sm:flex sm:justify-end sm:px-4">
            <button
              type="button"
              onClick={() => {
                onClose();
                onUnlockHardMode?.();
              }}
              className={inkAction}
            >
              Read the Night Post
            </button>
          </div>
        )}
      </section>
    </div>
  );
};
