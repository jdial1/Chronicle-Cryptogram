import React, { useEffect, useState } from 'react';
import { Newspaper, CheckCircle2, DecodedStamp, Lock, ChevronDown, ChevronUp, PuzzleSilhouette } from '../icons';
import { PuzzleData } from '../types';
import { DeskModal } from './DeskModal';
import {
  editionLabel,
  groupIssues,
  groupIssuesByChapter,
  isNightUnlocked,
  isPracticePuzzle,
} from '../utils/edition';
import { PRACTICE_ARCHIVE_CARD } from '../data/primerPractice';

interface ArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  puzzles: PuzzleData[];
  currentPuzzleId: string;
  onSelectPuzzle: (puzzle: PuzzleData) => void;
  onStartPractice?: () => void;
  solvedPuzzleIds: string[];
  frontPage: number;
}

function DecodeStamp({ label, done }: { label: string; done: boolean }) {
  return (
    <span
      role="img"
      aria-label={done ? `${label} decoded` : `${label} not decoded`}
      title={done ? `${label} decoded` : `${label} not decoded`}
      className={`w-4 h-4 flex items-center justify-center rounded-full border ${
        done
          ? 'border-[color:var(--ink-cinnabar)] text-[color:var(--ink-cinnabar)]'
          : 'border-stone-500'
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
  lockHint = 'Decode Morning Edition to unlock.',
  extra = false,
  onOpen,
}: {
  label: string;
  puzzle?: PuzzleData;
  locked: boolean;
  isCurrent: boolean;
  isSolved: boolean;
  lockHint?: string;
  extra?: boolean;
  onOpen: () => void;
}) {
  if (!puzzle) return null;

  const body = (
    <>
      {isSolved && !locked && <DecodedStamp />}
      <div className="relative z-10 flex items-center justify-between gap-2 mb-1.5">
        <span
          className={`px-1.5 py-0.5 text-xs font-newspaper font-bold uppercase tracking-wider text-stone-950 ${
            extra || label === 'Night Extra' ? 'bg-[#d6c9b0]' : 'bg-[#e8e0d0]'
          }`}
        >
          {label}
        </span>
        {isSolved && !locked && <span className="sr-only">Decoded</span>}
        {isCurrent && (
          <span className="font-typewriter font-bold text-xs uppercase tracking-widest text-stone-600">
            Now Reading
          </span>
        )}
        {locked && (
          <span className="text-stone-600" aria-label="Locked">
            <Lock className="w-3.5 h-3.5 text-[color:var(--ink-prussian)]" />
          </span>
        )}
      </div>
      {locked ? (
        <p className="relative z-10 font-treatise text-xs text-stone-700 italic">
          {lockHint}
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
  onStartPractice,
  solvedPuzzleIds,
  frontPage,
}) => {
  const issues = groupIssues(puzzles);
  const chapters = groupIssuesByChapter(issues);
  const [openEditions, setOpenEditions] = useState<Set<number>>(() => new Set([frontPage]));

  useEffect(() => {
    if (!isOpen) return;
    setOpenEditions(new Set([frontPage]));
  }, [isOpen, frontPage]);

  const toggleEdition = (edition: number) => {
    setOpenEditions((prev) => {
      const next = new Set(prev);
      if (next.has(edition)) next.delete(edition);
      else next.add(edition);
      return next;
    });
  };

  if (!isOpen) return null;

  return (
    <DeskModal
      isOpen={isOpen}
      onClose={onClose}
      titleId="archive-title"
      title="Issues"
      icon={<Newspaper className="w-5 h-5 shrink-0" />}
      sheetClassName="max-w-3xl"
    >
        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5 bg-newsprint space-y-5">
          {chapters.map((chapter) => (
            <section
              key={chapter.week}
              aria-labelledby={`chapter-${chapter.week}-title`}
              className="space-y-3"
            >
              <header className="sticky top-0 z-10 -mx-3 sm:-mx-5 px-3 sm:px-5 py-1.5 bg-newsprint">
                <p className="font-typewriter text-[10px] font-bold uppercase tracking-[0.28em] text-stone-600 text-center">
                  {chapter.kicker}
                </p>
                <h3
                  id={`chapter-${chapter.week}-title`}
                  className="font-masthead font-black text-lg sm:text-xl uppercase tracking-[0.14em] text-stone-950 text-center leading-tight"
                >
                  {chapter.title}
                </h3>
                <div className="mt-1.5 h-px bg-stone-700" />
              </header>
              {chapter.issues.map((issue) => {
            const primerIssue = issue.editionNumber === 0;
            // The Primer sits outside the season walk, so it is never gated by frontPage.
            const editionLocked = !primerIssue && issue.editionNumber > frontPage;
            const nightUnlocked =
              !editionLocked && isNightUnlocked(puzzles, solvedPuzzleIds, issue.editionNumber);
            const morningSolved = Boolean(issue.morning && solvedPuzzleIds.includes(issue.morning.id));
            const nightSolved = Boolean(issue.night && solvedPuzzleIds.includes(issue.night.id));
            const practiceUnlocked = Boolean(morningSolved && onStartPractice);
            const extraPuzzle = primerIssue ? PRACTICE_ARCHIVE_CARD : issue.night;
            const extraUnlocked = primerIssue ? practiceUnlocked : nightUnlocked;
            const extraCurrent = primerIssue
              ? isPracticePuzzle({ id: currentPuzzleId, category: '' })
              : issue.night?.id === currentPuzzleId;
            const isOpenIssue = openEditions.has(issue.editionNumber);
            const isFrontPage = issue.editionNumber === frontPage;

            return (
              <article key={issue.editionNumber} className="border-2 border-stone-700 bg-[var(--paper)]">
                <button
                  type="button"
                  onClick={() => toggleEdition(issue.editionNumber)}
                  aria-expanded={isOpenIssue}
                  aria-controls={`issue-${issue.editionNumber}`}
                  className="w-full flex items-center justify-between gap-2 px-3 min-h-12 py-2 bg-[var(--paper-masthead)] text-stone-950 cursor-pointer hover:bg-[#e0d5c0]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <PuzzleSilhouette
                      name={issue.morning?.silhouette ?? issue.night?.silhouette}
                      className="newspaper-silhouette w-6 h-6 shrink-0"
                    />
                    <span className="font-typewriter font-bold text-xs uppercase tracking-wider truncate">
                      {editionLabel(issue.editionNumber)}
                    </span>
                    {isFrontPage && (
                      <span className="hidden sm:inline shrink-0 px-1.5 py-0.5 bg-amber-600 text-stone-950 font-typewriter font-black text-xs uppercase tracking-wider">
                        Front Page
                      </span>
                    )}
                    {editionLocked && <Lock className="w-3.5 h-3.5 text-stone-600 shrink-0" />}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="flex items-center gap-1.5">
                      {issue.morning && (
                        <DecodeStamp label={primerIssue ? 'Primer' : 'Morning'} done={morningSolved} />
                      )}
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
                  <div id={`issue-${issue.editionNumber}`} className="p-2.5 flex flex-row gap-2.5">
                    <IssueSlot
                      label={primerIssue ? 'Training Primer' : 'Morning Edition'}
                      puzzle={issue.morning}
                      locked={editionLocked}
                      lockHint="Decode the edition before it to unlock."
                      isCurrent={issue.morning?.id === currentPuzzleId}
                      isSolved={morningSolved}
                      onOpen={() => {
                        if (!issue.morning || editionLocked) return;
                        onSelectPuzzle(issue.morning);
                        onClose();
                      }}
                    />
                    <IssueSlot
                      label={primerIssue ? 'Practice Drill' : 'Night Extra'}
                      extra={primerIssue}
                      puzzle={extraPuzzle}
                      locked={!extraUnlocked}
                      isCurrent={extraCurrent}
                      isSolved={primerIssue ? false : nightSolved}
                      lockHint={
                        primerIssue
                          ? 'Decode the Primer to unlock.'
                          : editionLocked
                            ? 'Decode the edition before it to unlock.'
                            : 'Decode Morning Edition to unlock.'
                      }
                      onOpen={() => {
                        if (primerIssue) {
                          if (!extraUnlocked) return;
                          onStartPractice?.();
                          onClose();
                          return;
                        }
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
            </section>
          ))}
        </div>
    </DeskModal>
  );
};
