import React, { useEffect, useState } from 'react';
import { X, Newspaper, CheckCircle2, DecodedStamp, Lock, ChevronDown, ChevronUp } from '../icons';
import { PuzzleData } from '../types';
import {
  formatEditionDate,
  formatEditionDateShort,
  groupPuzzlesByDate,
  isNightUnlockedForDate,
  publishedThroughDate,
} from '../utils/edition';

interface ArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  puzzles: PuzzleData[];
  currentPuzzleId: string;
  onSelectPuzzle: (puzzle: PuzzleData) => void;
  solvedPuzzleIds: string[];
}

function DecodeStamp({ label, done }: { label: string; done: boolean }) {
  return (
    <span
      role="img"
      aria-label={done ? `${label} decoded` : `${label} not decoded`}
      title={done ? `${label} decoded` : `${label} not decoded`}
      className={`w-4 h-4 flex items-center justify-center rounded-full border ${
        done ? 'border-red-600 text-red-600' : 'border-stone-500'
      }`}
    >
      {done && <CheckCircle2 className="w-2.5 h-2.5" />}
    </span>
  );
}

function IssueSlot({
  label,
  puzzle,
  locked,
  isCurrent,
  isSolved,
  onOpen,
}: {
  label: string;
  puzzle?: PuzzleData;
  locked: boolean;
  isCurrent: boolean;
  isSolved: boolean;
  onOpen: () => void;
}) {
  if (!puzzle) return null;

  const body = (
    <>
      {isSolved && !locked && <DecodedStamp />}
      <div className="relative z-10 flex items-center justify-between gap-2 mb-1.5">
        <span
          className={`px-1.5 py-0.5 text-[10px] font-newspaper font-bold uppercase tracking-wider text-stone-950 ${
            label === 'Night Extra' ? 'bg-[#d6c9b0]' : 'bg-[#e8e0d0]'
          }`}
        >
          {label}
        </span>
        {isSolved && !locked && <span className="sr-only">Decoded</span>}
        {isCurrent && (
          <span className="font-typewriter font-bold text-[9px] uppercase tracking-widest text-stone-600">
            Now Reading
          </span>
        )}
        {locked && (
          <span className="text-stone-600" aria-label="Locked">
            <Lock className="w-3.5 h-3.5" />
          </span>
        )}
      </div>
      {locked ? (
        <p className="relative z-10 font-treatise text-xs text-stone-700 italic">
          Decode Morning Edition to unlock.
        </p>
      ) : (
        <h4 className="relative z-10 font-newspaper font-bold text-sm text-stone-950 uppercase leading-snug">
          {puzzle.headline}
        </h4>
      )}
    </>
  );

  if (locked) {
    return (
      <div className="relative flex flex-col p-3 border rounded-xs w-1/4 flex-none bg-stone-200/70 border-stone-400">
        {body}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={isSolved ? `Reopen ${puzzle.headline}` : `Open ${puzzle.headline}`}
      className={`relative flex flex-col p-3 border rounded-xs text-left cursor-pointer fold-corner-card flex-1 min-w-0 pr-9 pb-9 border-stone-400 ${
        isCurrent ? 'is-reading border-stone-700 ring-1 ring-stone-700' : ''
      }`}
    >
      {body}
    </button>
  );
}

export const ArchiveModal: React.FC<ArchiveModalProps> = ({
  isOpen,
  onClose,
  puzzles,
  currentPuzzleId,
  onSelectPuzzle,
  solvedPuzzleIds,
}) => {
  const issues = groupPuzzlesByDate(puzzles);
  const currentDate = publishedThroughDate(puzzles);
  const [openDates, setOpenDates] = useState<Set<string>>(() => new Set([currentDate]));

  useEffect(() => {
    if (!isOpen) return;
    setOpenDates(new Set([publishedThroughDate(puzzles)]));
  }, [isOpen, puzzles]);

  const toggleDate = (date: string) => {
    setOpenDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop z-50 select-none">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="archive-title"
        className="modal-sheet max-w-3xl"
      >
        <div className="modal-masthead">
          <div className="flex items-center gap-2 min-w-0">
            <Newspaper className="w-5 h-5 shrink-0" />
            <h2 id="archive-title" className="text-base sm:text-lg font-masthead font-bold tracking-wide uppercase leading-tight">
              Back Issues
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 min-w-11 min-h-11 sm:min-w-0 sm:min-h-0 sm:p-1 flex items-center justify-center text-stone-700 hover:text-stone-950 rounded hover:bg-stone-200 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5 bg-newsprint space-y-3">
          {issues.map((issue) => {
            const nightUnlocked = isNightUnlockedForDate(puzzles, solvedPuzzleIds, issue.date);
            const morningSolved = Boolean(issue.morning && solvedPuzzleIds.includes(issue.morning.id));
            const nightSolved = Boolean(issue.night && solvedPuzzleIds.includes(issue.night.id));
            const isOpenIssue = openDates.has(issue.date);
            const isToday = issue.date === currentDate;

            return (
              <article key={issue.date} className="border-2 border-stone-700 bg-[#f8f3e8]">
                <button
                  type="button"
                  onClick={() => toggleDate(issue.date)}
                  aria-expanded={isOpenIssue}
                  aria-controls={`issue-${issue.date}`}
                  className="w-full flex items-center justify-between gap-2 px-3 min-h-11 sm:min-h-0 sm:py-2 bg-[#ebe4d4] text-stone-950 cursor-pointer hover:bg-[#e0d5c0]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-typewriter font-bold text-xs uppercase tracking-wider truncate sm:hidden">
                      {formatEditionDateShort(issue.date)}
                    </span>
                    <span className="hidden sm:inline font-typewriter font-bold text-xs uppercase tracking-wider truncate">
                      {formatEditionDate(issue.date)}
                    </span>
                    {isToday && (
                      <span className="hidden sm:inline shrink-0 px-1.5 py-0.5 bg-amber-600 text-stone-950 font-typewriter font-black text-[9px] uppercase tracking-wider">
                        Today
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="flex items-center gap-1.5">
                      {issue.morning && <DecodeStamp label="Morning" done={morningSolved} />}
                      {issue.night && <DecodeStamp label="Night" done={nightSolved} />}
                    </span>
                    {isOpenIssue ? (
                      <ChevronUp className="w-3.5 h-3.5 text-stone-700" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-stone-700" />
                    )}
                  </div>
                </button>
                {isOpenIssue && (
                  <div id={`issue-${issue.date}`} className="p-2.5 flex flex-row gap-2.5">
                    <IssueSlot
                      label={issue.editionNumber === 0 ? 'Training Primer' : 'Morning Edition'}
                      puzzle={issue.morning}
                      locked={false}
                      isCurrent={issue.morning?.id === currentPuzzleId}
                      isSolved={morningSolved}
                      onOpen={() => {
                        if (!issue.morning) return;
                        onSelectPuzzle(issue.morning);
                        onClose();
                      }}
                    />
                    <IssueSlot
                      label="Night Extra"
                      puzzle={issue.night}
                      locked={!nightUnlocked}
                      isCurrent={issue.night?.id === currentPuzzleId}
                      isSolved={nightSolved}
                      onOpen={() => {
                        if (!issue.night || !nightUnlocked) return;
                        onSelectPuzzle(issue.night);
                        onClose();
                      }}
                    />
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
};
