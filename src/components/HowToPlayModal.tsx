import React from 'react';
import { X, BookOpen, Key } from '../icons';
import { CIPHER_INTRO, CIPHER_TACTICS } from '../data/cipherTactics';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function FolderCard({
  tab,
  tilt,
  children,
}: {
  tab: React.ReactNode;
  tilt: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col">
      <div className="flex items-end px-2">
        <span className="inline-flex items-center px-2.5 pt-1.5 pb-1 border-t border-x rounded-t-sm bg-[#f6f1e7] text-stone-950 border-stone-700 -mb-px z-10 relative">
          <span className={`inline-flex items-center gap-1.5 font-typewriter font-bold text-[10px] uppercase tracking-wider origin-left ${tilt}`}>
            {tab}
          </span>
        </span>
      </div>
      <div className="border-2 border-stone-700 bg-[#f6f1e7] px-3 pt-2.5 pb-3 flex-1">
        {children}
      </div>
    </section>
  );
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop z-50 select-none">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="handbook-title"
        className="modal-sheet max-w-3xl"
      >
        <div className="modal-masthead">
          <div className="flex items-center gap-2 min-w-0">
            <BookOpen className="w-5 h-5 shrink-0" />
            <h2 id="handbook-title" className="text-base sm:text-lg font-masthead font-bold tracking-wide uppercase leading-tight">
              Codebreaker's Handbook
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

        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 bg-newsprint text-stone-900">
          <FolderCard
            tab={
              <>
                <Key className="w-3 h-3" />
                Cipher
              </>
            }
            tilt="-rotate-1"
          >
            <p className="font-newspaper text-sm text-stone-700 leading-relaxed">
              {CIPHER_INTRO}
            </p>
          </FolderCard>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
            {CIPHER_TACTICS.map((tactic, index) => {
              const tilt = ['-rotate-2', 'rotate-1', '-rotate-1', 'rotate-2', '-rotate-2'][index];
              return (
                <FolderCard key={tactic.id} tab={index + 1} tilt={tilt}>
                  <h3 className="font-headline font-bold text-sm text-stone-950 uppercase leading-snug">
                    {tactic.title}
                  </h3>
                  <p className="font-newspaper text-sm text-stone-700 leading-relaxed mt-1 mb-2">
                    {tactic.summary}
                  </p>
                  <div className="space-y-1.5 font-newspaper text-xs text-stone-700 leading-relaxed">
                    {tactic.points.map((point) => (
                      <p key={point.lead}>
                        <span className="font-typewriter font-bold uppercase tracking-wide text-stone-900">
                          {point.lead}:
                        </span>{' '}
                        {point.body}
                      </p>
                    ))}
                  </div>
                </FolderCard>
              );
            })}
          </div>
        </div>

        <div className="modal-action-dock sm:flex sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="woodblock-stamp w-full min-h-12 sm:w-auto sm:min-h-0 px-4 py-1.5 font-typewriter font-bold text-xs uppercase tracking-wider cursor-pointer"
          >
            I'm Ready to Decode
          </button>
        </div>
      </div>
    </div>
  );
};
