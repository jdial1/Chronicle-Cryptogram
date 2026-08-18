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

function NoteBody({ fragment }: { fragment: AssembledFragment }) {
  return (
    <p className="font-newspaper text-sm text-stone-800 leading-relaxed">
      {fragment.segments.map((segment, index) =>
        segment.kind === 'quote' ? (
          <span key={index} className="font-typewriter font-bold text-stone-950 tracking-wide">
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
      className="fixed inset-0 z-[55] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs select-none"
      onClick={onClose}
    >
      <div
        className="bg-[#fcf9f2] w-full max-w-3xl rounded-sm border-2 border-stone-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="bg-stone-900 text-stone-100 p-3 sm:p-4 flex items-center justify-between border-b-2 border-amber-600">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-masthead font-bold tracking-wide text-amber-100 uppercase">
                Bureau Case Files
              </h2>
              <p className="text-[11px] font-mono-code text-stone-400 truncate">
                Fragments unlocked by decoded Morning Editions and Night Extras
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-100 rounded hover:bg-stone-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {dossiers.length > 0 && (
          <div className="flex gap-1 overflow-x-auto p-2 sm:p-3 border-b border-stone-400 bg-[#f4ede0]">
            {dossiers.map((entry) => {
              const selected = entry.id === character?.id;
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setActiveId(entry.id)}
                  className={`shrink-0 px-2.5 py-1.5 border rounded-xs text-left cursor-pointer ${
                    selected
                      ? 'bg-stone-950 text-amber-100 border-stone-950'
                      : 'bg-[#fdfbf6] text-stone-800 border-stone-400 hover:border-stone-700'
                  }`}
                >
                  <span className="block font-typewriter font-bold text-[10px] uppercase tracking-wider">
                    {entry.name}
                  </span>
                  <span className={`block text-[10px] font-treatise ${selected ? 'text-amber-200/80' : 'text-stone-500'}`}>
                    {entry.notes.length} {entry.notes.length === 1 ? 'fragment' : 'fragments'}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div ref={notesRef} className="flex-1 overflow-y-auto p-4 sm:p-5 bg-newsprint">
          {dossiers.length === 0 || !character ? (
            <p className="font-treatise italic text-stone-600 text-sm">
              No decoded fragments. Solve the daily cryptograms to open the first dossier.
            </p>
          ) : (
            <>
              <div className="mb-4 border-b border-stone-400 pb-2">
                <h3 className="font-headline font-black text-xl text-stone-950 uppercase tracking-tight">
                  {character.name}
                </h3>
                <p className="font-typewriter text-[10px] uppercase tracking-widest text-stone-500">
                  {character.dossier}
                </p>
              </div>
              <ol className="space-y-3">
                {notes.map((fragment) => {
                  const key = fragmentKey(fragment);
                  const highlighted = key === focusFragmentKey;
                  return (
                    <li
                      key={key}
                      data-fragment={key}
                      className={`p-3 border rounded-xs bg-[#fdfbf6] ${
                        highlighted ? 'border-amber-700 ring-2 ring-amber-600' : 'border-stone-400'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-typewriter font-black text-[10px] uppercase tracking-widest text-amber-800">
                          Day {fragment.editionNumber} — {fragment.title}
                        </span>
                        {highlighted && (
                          <span className="font-typewriter font-bold text-[9px] uppercase tracking-widest text-amber-700">
                            Just filed
                          </span>
                        )}
                      </div>
                      <NoteBody fragment={fragment} />
                    </li>
                  );
                })}
              </ol>
            </>
          )}
        </div>
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
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-1.5rem)] max-w-lg flex items-stretch bg-stone-950 text-amber-100 border-2 border-amber-600 shadow-2xl">
      <button
        type="button"
        onClick={onOpen}
        className="flex-1 flex items-center gap-2 min-w-0 px-4 py-3 text-left cursor-pointer hover:bg-stone-900"
      >
        <FileText className="w-5 h-5 text-amber-400 shrink-0" />
        <span className="min-w-0">
          <span className="block font-typewriter font-black text-xs uppercase tracking-widest">
            Case File Updated
          </span>
          <span className="block font-treatise text-xs text-amber-200/90 truncate">
            {names.join(' · ')}
          </span>
        </span>
      </button>
      <button
        type="button"
        onClick={onDismiss}
        className="px-3 text-stone-400 hover:text-white cursor-pointer"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
