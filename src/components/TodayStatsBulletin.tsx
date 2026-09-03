import React from 'react';
import { Zap, Users, TrendingUp, Award } from '../icons';
import { formatTime } from '../utils/cipherEngine';
import { PuzzleData } from '../types';
import { isHardPuzzle, isPracticePuzzle, isPrimerPuzzle } from '../utils/edition';
import { usePuzzleStats } from '../hooks/usePuzzleStats';
import { derivePublicStats } from '../utils/firebaseStore';
import { DeskModal } from './DeskModal';

interface SolvedStatsProps {
  currentPuzzle: PuzzleData;
  timerSeconds: number;
  onUnlockHardMode?: () => void;
  onOpenTodayEdition?: () => void;
  onStartPractice?: () => void;
  isSeasonComplete?: boolean;
  seasonLength?: number;
  isDemo?: boolean;
  onOpenCaseFiles?: () => void;
}

interface TodayStatsBulletinProps extends SolvedStatsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.chroniclecryptogram';

const inkAction =
  'w-full min-h-12 sm:w-auto px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-stone-950 font-typewriter font-bold text-xs uppercase tracking-wider cursor-pointer';

const inkSecondary =
  'w-full min-h-12 sm:w-auto px-4 py-2.5 border-2 border-stone-800 bg-[var(--paper)] hover:bg-amber-100 text-stone-950 font-typewriter font-bold text-xs uppercase tracking-wider cursor-pointer';

export function PrimerPathButtons({
  onOpenTodayEdition,
  onStartPractice,
  practiceLabel = 'Practice Drill',
}: {
  onOpenTodayEdition: () => void;
  onStartPractice?: () => void;
  practiceLabel?: string;
}) {
  const practiceButton = onStartPractice ? (
    <button type="button" onClick={onStartPractice} className={inkSecondary}>
      {practiceLabel}
    </button>
  ) : null;

  if (practiceButton) {
    return (
      <div className="flex flex-col sm:flex-row gap-2">
        <button type="button" onClick={onOpenTodayEdition} className={inkAction}>
          Decode the Front Page
        </button>
        {practiceButton}
      </div>
    );
  }

  return (
    <button type="button" onClick={onOpenTodayEdition} className={inkAction}>
      Decode the Front Page
    </button>
  );
}

export function LiveStatsRow({ puzzleId }: { puzzleId: string }) {
  const liveStats = usePuzzleStats(puzzleId);
  const currentStats = derivePublicStats(liveStats);

  const cells = [
    {
      icon: <Zap className="w-4 h-4 text-amber-800 fill-amber-500 shrink-0" />,
      label: 'Quickest',
      value: liveStats.completeCount > 0 ? formatTime(currentStats.quickestSolveTime) : '—',
    },
    {
      icon: <Users className="w-4 h-4 text-stone-800 shrink-0" />,
      label: 'Solvers',
      value: currentStats.totalSolvers.toLocaleString(),
    },
    {
      icon: <TrendingUp className="w-4 h-4 text-emerald-800 shrink-0" />,
      label: 'Rate',
      value: `${currentStats.solveRatePercentage}%`,
    },
    {
      icon: <Award className="w-4 h-4 text-stone-800 shrink-0" />,
      label: 'Average',
      value: liveStats.completeCount > 0 ? formatTime(currentStats.averageTimeSeconds) : '—',
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
      {cells.map((cell) => (
        <div
          key={cell.label}
          className="flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-2 p-1.5 sm:p-2 bg-[var(--paper)] border border-stone-300 rounded-xs min-w-0"
        >
          {cell.icon}
          <div className="overflow-hidden text-center sm:text-left min-w-0">
            <span className="block text-xs font-typewriter font-bold uppercase text-stone-700 truncate">
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

export const TodayStatsBulletin: React.FC<TodayStatsBulletinProps> = ({
  currentPuzzle,
  timerSeconds,
  onUnlockHardMode,
  isOpen,
  onClose,
  onOpenTodayEdition,
  onStartPractice,
  isSeasonComplete = false,
  seasonLength,
  isDemo = false,
  onOpenCaseFiles,
}) => {
  const isHard = isHardPuzzle(currentPuzzle);
  const isPrimer = isPrimerPuzzle(currentPuzzle);
  const isPractice = isPracticePuzzle(currentPuzzle);
  if (!isOpen) return null;

  const title = isPractice
    ? 'Drill decoded'
    : isPrimer
      ? 'Primer decoded'
      : isHard
        ? 'Night Extra decoded'
        : 'Morning Edition decoded';
  const showPrimerPath = (isPrimer || isPractice) && onOpenTodayEdition && !isSeasonComplete;
  const showSeasonFinale = isSeasonComplete && !isPractice;
  const showNightPost = !isPrimer && !isPractice && !isHard && onUnlockHardMode;

  return (
    <DeskModal
      isOpen={isOpen}
      onClose={onClose}
      titleId="stats-bulletin-title"
      title={title}
      slip
      sheetClassName="max-w-md"
    >
        <div className="p-6 text-center">
          <p className="font-typewriter text-xs uppercase tracking-[0.2em] text-stone-600">Your time</p>
          <p className="mt-1 font-typewriter font-black text-4xl sm:text-5xl text-stone-950 tabular-nums leading-none">
            {formatTime(timerSeconds)}
          </p>
          {showSeasonFinale && (
            <p className="mt-4 font-newspaper text-sm text-stone-700 leading-relaxed">
              {isDemo
                ? `That is the last of the ${seasonLength ?? 3} sample editions. The remaining editions of the Vance case are in the full paper.`
                : seasonLength
                  ? `That is all ${seasonLength} editions. The Vance file is closed — for now.`
                  : 'That is the last edition. The Vance file is closed — for now.'}
            </p>
          )}
        </div>

        {showPrimerPath && (
          <div className="modal-action-dock p-3 sm:flex sm:justify-end sm:px-4 sm:py-2.5">
            <PrimerPathButtons
              onOpenTodayEdition={() => {
                onClose();
                onOpenTodayEdition();
              }}
              onStartPractice={
                onStartPractice
                  ? () => {
                      onClose();
                      onStartPractice();
                    }
                  : undefined
              }
              practiceLabel={isPractice ? 'Another Drill' : 'Practice Drill'}
            />
          </div>
        )}

        {showSeasonFinale && (
          <div className="modal-action-dock p-3 sm:flex sm:justify-end sm:gap-2 sm:px-4 sm:py-2.5">
            {isDemo && (
              <a href={PLAY_STORE_URL} target="_blank" rel="noreferrer" className={`${inkAction} inline-block text-center`}>
                Get the full paper
              </a>
            )}
            {onOpenCaseFiles && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCaseFiles();
                }}
                className={isDemo ? inkSecondary : inkAction}
              >
                Read the Case File
              </button>
            )}
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
    </DeskModal>
  );
};
