import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FileText, X } from '../icons';
import { PuzzleData } from '../types';
import {
  AssembledFragment,
  CASE_CHARACTERS,
  CaseCharacterId,
  fragmentsUpdatedByPuzzle,
  fragmentKey,
  unlockedFragmentsForCharacter,
} from '../data/caseFiles';

interface CaseFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  puzzles: PuzzleData[];
  solvedPuzzleIds: string[];
  focusCharacterId?: CaseCharacterId | null;
  focusFragmentKey?: string | null;
}

function dossierSubject(name: string) {
  return name.replace(/^(Detective|Dr\.)\s+/i, '').replace(/\.+$/g, '').trim();
}

function tabNameLines(name: string) {
  const subject = dossierSubject(name);
  const parts = subject.split(/\s+/);
  if (parts.length < 2) return [subject];
  return [parts[0], parts.slice(1).join(' ')];
}

function NoteBody({ fragment }: { fragment: AssembledFragment }) {
  return (
    <p className="font-typewriter text-[13px] text-stone-800 leading-[23px] scanned-ink">
      {fragment.segments.map((segment, index) =>
        segment.kind === 'quote' ? (
          <span key={index} className="scanned-double-underline font-typewriter tracking-wide">
            {segment.value}
          </span>
        ) : (
          <span key={index}>{segment.value}</span>
        )
      )}
    </p>
  );
}

export const CaseFileModal: React.FC<CaseFileModalProps> = ({
  isOpen,
  onClose,
  puzzles,
  solvedPuzzleIds,
  focusCharacterId,
  focusFragmentKey,
}) => {
  const [activeId, setActiveId] = useState<CaseCharacterId | null>(focusCharacterId || null);
  const notesRef = useRef<HTMLDivElement>(null);

  const dossiers = useMemo(
    () =>
      CASE_CHARACTERS.map((entry) => ({
        ...entry,
        notes: unlockedFragmentsForCharacter(entry.id, puzzles, solvedPuzzleIds),
      })).filter((entry) => entry.notes.length > 0),
    [puzzles, solvedPuzzleIds]
  );

  useEffect(() => {
    if (!isOpen) return;
    if (focusCharacterId && dossiers.some((entry) => entry.id === focusCharacterId)) {
      setActiveId(focusCharacterId);
      return;
    }
    setActiveId((current) => {
      if (current && dossiers.some((entry) => entry.id === current)) return current;
      return dossiers[0]?.id || null;
    });
  }, [isOpen, focusCharacterId, dossiers]);

  const character = dossiers.find((entry) => entry.id === activeId) || dossiers[0];
  const notes = character?.notes || [];

  useEffect(() => {
    if (!isOpen || !focusFragmentKey) return;
    const node = notesRef.current?.querySelector(`[data-fragment="${focusFragmentKey}"]`);
    node?.scrollIntoView({ block: 'nearest' });
  }, [isOpen, focusFragmentKey, notes]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop z-[55] select-none"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="casefile-title"
        className="modal-sheet max-w-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-masthead">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-5 h-5 shrink-0" />
            <h2 id="casefile-title" className="text-base sm:text-lg font-masthead font-bold tracking-wide uppercase leading-tight">
              Bureau Case Files
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

        {dossiers.length > 0 ? (
          <div className="flex flex-col flex-1 min-h-0 bg-[#d9d0bc]">
            <div
              className="shrink-0 flex items-end overflow-x-auto snap-x snap-mandatory gap-1 px-3 pt-2"
              role="tablist"
              aria-label="Dossiers"
            >
              {dossiers.map((entry) => {
                const selected = entry.id === character?.id;
                const [firstName, lastName] = tabNameLines(entry.name);
                return (
                  <button
                    key={entry.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    aria-label={dossierSubject(entry.name)}
                    onClick={() => setActiveId(entry.id)}
                    className={`shrink-0 snap-start min-w-[5.5rem] px-2.5 pt-1.5 pb-1 border-t border-x rounded-t-sm text-left cursor-pointer ${
                      selected
                        ? 'bg-[#f6f1e7] text-stone-950 border-stone-700 -mb-px pb-2 z-10 relative'
                        : 'bg-[#c4baa4] text-stone-700 border-stone-500/80 hover:bg-[#d0c6b0]'
                    }`}
                  >
                    <span className="flex flex-col font-typewriter font-bold text-[10px] uppercase tracking-wider leading-tight">
                      <span>{firstName}</span>
                      {lastName && <span>{lastName}</span>}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col flex-1 min-h-0 bg-newsprint border-t-2 border-stone-700">
              <div ref={notesRef} className="flex-1 overflow-y-auto px-3 py-3 sm:px-4 sm:p-4 space-y-3">
                {notes.map((fragment) => {
                  const key = fragmentKey(fragment);
                  const highlighted = key === focusFragmentKey;
                  return (
                    <article
                      key={key}
                      data-fragment={key}
                      className={`evidence-slip border border-stone-700 px-3 pt-2 pb-3 ${
                        highlighted ? 'ring-2 ring-amber-700' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2 pl-4 sm:pl-8">
                        <span className="font-typewriter font-black text-[10px] uppercase tracking-widest text-stone-800">
                          Day {fragment.editionNumber} · {fragment.title}
                        </span>
                        {highlighted && (
                          <span className="shrink-0 font-typewriter font-bold text-[9px] uppercase tracking-widest text-[color:var(--ink-cinnabar)] -rotate-2">
                            Just filed
                          </span>
                        )}
                      </div>
                      <div className="pl-4 sm:pl-8">
                        <NoteBody fragment={fragment} />
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-newsprint">
            <p className="font-treatise italic text-stone-600 text-sm">
              No decoded fragments. Solve the daily cryptograms to open the first dossier.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

interface CaseFileToastProps {
  puzzle: PuzzleData | null;
  onOpen: () => void;
  onDismiss: () => void;
}

export const CaseFileToast: React.FC<CaseFileToastProps> = ({ puzzle, onOpen, onDismiss }) => {
  if (!puzzle) return null;
  const updates = fragmentsUpdatedByPuzzle(puzzle);
  if (updates.length === 0) return null;
  const names = Array.from(
    new Set(
      updates.map((fragment) => CASE_CHARACTERS.find((entry) => entry.id === fragment.characterId)?.name).filter(Boolean)
    )
  );

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-1.5rem)] max-w-lg flex items-stretch bg-[#ebe4d4] text-stone-950 border-2 border-stone-800 shadow-2xl">
      <button
        type="button"
        onClick={onOpen}
        className="flex-1 flex items-center gap-2 min-w-0 px-4 py-3 text-left cursor-pointer hover:bg-[#e0d5c0]"
      >
        <FileText className="w-5 h-5 shrink-0" />
        <span className="min-w-0">
          <span className="block font-typewriter font-black text-xs uppercase tracking-widest">
            Case File Updated
          </span>
          <span className="block font-treatise text-xs text-stone-700 truncate">
            {names.join(' · ')}
          </span>
        </span>
      </button>
      <button
        type="button"
        onClick={onDismiss}
        className="px-3 text-stone-700 hover:text-stone-950 cursor-pointer"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
