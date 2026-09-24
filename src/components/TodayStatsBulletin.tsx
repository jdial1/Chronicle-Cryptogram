import React, { useState } from 'react';
import { Users, TrendingUp } from '../icons';
import { formatTime } from '../utils/cipherEngine';
import { PuzzleData } from '../types';
import { isHardPuzzle, isPracticePuzzle, isPrimerPuzzle } from '../utils/edition';
import { usePuzzleStats } from '../hooks/usePuzzleStats';
import { derivePublicStats } from '../utils/firebaseStore';
import { helpLine, solveShareText } from '../utils/shareText';
import { DeskModal } from './DeskModal';

interface SolvedStatsProps {
  currentPuzzle: PuzzleData;
  timerSeconds: number;
  hintsUsed: number;
  checksUsed: number;
  /** After a Night Extra: the next edition's Morning, when the agent has reached it. */
  onNextEdition?: () => void;
  /** The next page's headline, and only its headline: the question the agent leaves with. */
  nextHeadline?: string;
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
      icon: <Users className="w-4 h-4 text-stone-800 shrink-0" />,
      label: 'Solvers',
      value: currentStats.totalSolvers.toLocaleString(),
    },
    {
      icon: <TrendingUp className="w-4 h-4 text-emerald-800 shrink-0" />,
      label: 'Rate',
      value: `${currentStats.solveRatePercentage}%`,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
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
  hintsUsed,
  checksUsed,
  onNextEdition,
  nextHeadline,
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
  const [copied, setCopied] = useState(false);
  if (!isOpen) return null;

  const share = async () => {
    const text = solveShareText({
      editionNumber: currentPuzzle.editionNumber,
      headline: currentPuzzle.headline,
      timerSeconds,
      hintsUsed,
      checksUsed,
    });
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: 'Chronicle Cryptogram', text });
      } catch {
        // Dismissing the share sheet is not a failure worth reporting.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // No clipboard (an insecure origin, a locked-down WebView): nothing to copy to.
    }
  };

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
  const showNextEdition = isHard && !isSeasonComplete && onNextEdition;

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
          <p className="font-typewriter text-xs uppercase tracking-[0.2em] text-stone-600">Help taken</p>
          <p className="mt-1 font-typewriter font-black text-2xl sm:text-3xl text-stone-950 leading-tight">
            {helpLine(hintsUsed, checksUsed)}
          </p>
          <p className="mt-2 font-typewriter text-sm text-stone-800 tabular-nums">
            Time on desk {formatTime(timerSeconds).replace(/\.\d$/, '')}
          </p>
          <button
            type="button"
            onClick={() => void share()}
            className="mt-3 desk-hit inline-flex items-center justify-center px-3 py-1.5 border border-stone-500 font-typewriter font-bold text-xs uppercase tracking-wider text-stone-900 hover:bg-amber-100 cursor-pointer"
          >
            {copied ? 'Copied to the clipboard' : 'Share'}
          </button>
          {nextHeadline && !isSeasonComplete && (
            <p className="mt-4 font-typewriter text-xs uppercase tracking-[0.2em] text-stone-600">
              Next on the wire
              <span className="mt-1 block font-headline font-black text-base normal-case tracking-normal text-stone-950">
                {nextHeadline}
              </span>
            </p>
          )}
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

        {showNextEdition && (
          <div className="modal-action-dock sm:flex sm:justify-end sm:px-4">
            <button
              type="button"
              onClick={() => {
                onClose();
                onNextEdition?.();
              }}
              className={inkAction}
            >
              Decode the Next Front Page
            </button>
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
