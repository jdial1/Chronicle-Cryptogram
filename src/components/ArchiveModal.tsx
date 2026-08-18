import React, { useEffect, useState } from 'react';
import { X, Newspaper, ArrowRight, CheckCircle2, Lock, Calendar, ChevronDown, ChevronUp } from '../icons';
import { PuzzleData } from '../types';
import {
  formatEditionDate,
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

function DecodeMark({ label, done }: { label: string; done: boolean }) {
  return (
    <span
      title={done ? `${label} decoded` : `${label} not decoded`}
      className={`w-5 h-5 flex items-center justify-center rounded-xs border ${
        done ? 'border-emerald-400 bg-emerald-950/40' : 'border-amber-800/70'
      }`}
    >
      {done && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
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

  return (
    <div
      className={`flex-1 min-w-[14rem] p-3 border rounded-xs ${
        locked
          ? 'bg-stone-200/70 border-stone-400'
          : isCurrent
            ? 'bg-amber-100/80 border-stone-900 ring-1 ring-stone-900'
            : 'bg-[#fdfbf6] border-stone-400'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span
          className={`px-1.5 py-0.5 text-[10px] font-typewriter font-black uppercase tracking-wider ${
            label === 'Night Extra' ? 'bg-stone-950 text-amber-200' : 'bg-stone-900 text-[#f7f3e8]'
          }`}
        >
          {label}
        </span>
        {isSolved && !locked && (
          <span className="flex items-center gap-1 text-emerald-800 font-typewriter font-bold text-[10px] uppercase">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Decoded
          </span>
        )}
        {locked && (
          <span className="flex items-center gap-1 text-stone-500 font-typewriter font-bold text-[10px] uppercase">
            <Lock className="w-3.5 h-3.5" />
            Locked
          </span>
        )}
      </div>
      {locked ? (
        <p className="font-treatise text-xs text-stone-500 italic">
          Locked until the Morning Edition for this date is decoded.
        </p>
      ) : (
        <>
          <h4 className="font-headline font-bold text-sm text-stone-950 uppercase leading-snug">
            {puzzle.headline}
          </h4>
          <p className="font-newspaper text-xs text-stone-600 line-clamp-2 mt-1">{puzzle.subheadline}</p>
          <button
            onClick={onOpen}
            className={`mt-2 flex items-center gap-1 px-2.5 py-1 font-typewriter font-bold text-[11px] uppercase rounded-xs cursor-pointer ${
              isCurrent
                ? 'bg-stone-900 text-amber-200'
                : 'bg-amber-700 hover:bg-amber-800 text-amber-50'
            }`}
          >
            <span>{isCurrent ? 'Now Reading' : isSolved ? 'Reopen' : 'Open Article'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </>
      )}
    </div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="bg-[#fcf9f2] w-full max-w-3xl rounded-sm border-2 border-stone-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-stone-900 text-stone-100 p-3 sm:p-4 flex items-center justify-between border-b-2 border-amber-600">
          <div className="flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-base sm:text-lg font-masthead font-bold tracking-wide text-amber-100 uppercase">
                Back Issues
              </h2>
              <p className="text-[11px] font-mono-code text-stone-400">
                Morning Editions and Night Extras by date
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

        <div className="flex-1 overflow-y-auto p-3 sm:p-5 bg-newsprint space-y-3">
          {issues.map((issue) => {
            const nightUnlocked = isNightUnlockedForDate(puzzles, solvedPuzzleIds, issue.date);
            const morningSolved = Boolean(issue.morning && solvedPuzzleIds.includes(issue.morning.id));
            const nightSolved = Boolean(issue.night && solvedPuzzleIds.includes(issue.night.id));
            const isOpenIssue = openDates.has(issue.date);
            const isToday = issue.date === currentDate;

            return (
              <article key={issue.date} className="border-2 border-stone-800 bg-[#f8f3e8] overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleDate(issue.date)}
                  aria-expanded={isOpenIssue}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-stone-900 text-amber-100 cursor-pointer hover:bg-stone-800"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="font-typewriter font-bold text-xs uppercase tracking-wider truncate">
                      {formatEditionDate(issue.date)}
                    </span>
                    {isToday && (
                      <span className="shrink-0 px-1.5 py-0.5 bg-amber-600 text-stone-950 font-typewriter font-black text-[9px] uppercase tracking-wider">
                        Today
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="flex items-center gap-1" aria-label="Decode status">
                      <DecodeMark label="Morning" done={morningSolved} />
                      {issue.night && <DecodeMark label="Night" done={nightSolved} />}
                    </span>
                    <span className="font-typewriter text-[10px] uppercase tracking-widest text-amber-300/80">
                      {issue.editionNumber === 0 ? 'Primer' : `Edition #${issue.editionNumber}`}
                    </span>
                    {isOpenIssue ? (
                      <ChevronUp className="w-3.5 h-3.5 text-amber-300" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-amber-300" />
                    )}
                  </div>
                </button>
                {isOpenIssue && (
                  <div className="p-2.5 flex flex-col sm:flex-row gap-2.5">
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

        <div className="p-3 bg-[#f4eee1] border-t border-stone-400 text-xs font-mono-code text-stone-600">
          <span>{issues.length} dates in the vault</span>
        </div>
      </div>
    </div>
  );
};
