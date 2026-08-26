import React, { useEffect, useState } from 'react';
import { BookOpen, Type, RotateCcw, Lightbulb } from '../icons';
import { CIPHER_INTRO, CIPHER_TACTICS, CIPHER_TOOLS } from '../data/cipherTactics';
import { DeskModal } from './DeskModal';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HANDBOOK_PAGES = [
  {
    id: 'cipher',
    tab: ['The', 'Cipher'],
    title: 'The Substitution Cipher',
    dek: 'Tap a mark, then type a letter. That is the whole game.',
    summary: CIPHER_INTRO,
    points: CIPHER_TOOLS,
  },
  ...CIPHER_TACTICS.map((tactic, index) => ({
    id: tactic.id,
    tab: [String(index + 1), tactic.id.replace(/-/g, ' ')],
    title: tactic.title,
    dek: tactic.summary,
    summary: null as string | null,
    points: tactic.points,
  })),
  {
    id: 'press',
    tab: ['The', 'Press'],
    title: 'A Copy for the Field',
    dek: 'Pack the paper before you leave the wire.',
    summary:
      'The cipher, archive, and case file already run from this desk. Packing is a confirmed copy for the commute, the sleeper, or a dead zone — not a gate on play.',
    points: [
      {
        lead: 'Bureau File',
        body: 'Open Bureau File from the agent plate or Sign in in the masthead. Keep a full copy of the press stores type, plates, and the serial on this desk.',
      },
      {
        lead: 'Install',
        body: 'On the web, Install App puts the paper on the home screen. On Android, the same Bureau File pack is the offline copy. Pack while you still have the wire.',
      },
      {
        lead: 'Still on the wire',
        body: 'Sign-in, the bureau board, and live solver counts need the network. Guesses and streak on this desk stay in local notes either way.',
      },
      {
        lead: 'Fresh plates',
        body: 'When a newer edition hits the stands, reload, then pack again from Bureau File so the field copy matches the press.',
      },
    ],
  },
];

function emphasizeDailyQuota(body: string) {
  const marks = ['Three hints per day', 'Three checks per day'];
  for (const mark of marks) {
    const at = body.indexOf(mark);
    if (at < 0) continue;
    return (
      <>
        {body.slice(0, at)}
        <strong className="font-bold underline">{mark}</strong>
        {body.slice(at + mark.length)}
      </>
    );
  }
  return body;
}

function CipherDeskRail() {
  return (
    <div className="brass-loupe brass-loupe-diagram mb-3" aria-hidden>
      <button type="button" tabIndex={-1} className="hint-tool" data-caption="Check">
        <Type className="w-4 h-4" />
        <sup className="hint-count">3</sup>
      </button>
      <button type="button" tabIndex={-1} className="hint-tool" data-caption="Hint">
        <Lightbulb className="w-4 h-4" />
        <sup className="hint-count">3</sup>
      </button>
      <button type="button" tabIndex={-1} data-caption="Undo">
        <RotateCcw className="w-4 h-4" />
      </button>
      <button type="button" tabIndex={-1} data-caption="Wipe">
        <RotateCcw className="w-4 h-4 rotate-180" />
      </button>
    </div>
  );
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  const [activeId, setActiveId] = useState(HANDBOOK_PAGES[0].id);

  useEffect(() => {
    if (isOpen) setActiveId(HANDBOOK_PAGES[0].id);
  }, [isOpen]);

  const page = HANDBOOK_PAGES.find((entry) => entry.id === activeId) || HANDBOOK_PAGES[0];

  return (
    <DeskModal
      isOpen={isOpen}
      onClose={onClose}
      titleId="handbook-title"
      title="Guide"
      icon={<BookOpen className="w-5 h-5 shrink-0" />}
      sheetClassName="max-w-3xl"
    >
        <div className="flex flex-col flex-1 min-h-0 bg-[#d9d0bc]">
          <div
            className="shrink-0 flex items-end overflow-x-auto snap-x snap-mandatory gap-1 px-3 pt-2"
            role="tablist"
            aria-label="Handbook sections"
          >
            {HANDBOOK_PAGES.map((entry) => {
              const selected = entry.id === page.id;
              return (
                <button
                  key={entry.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-label={entry.tab.join(' ')}
                  onClick={() => setActiveId(entry.id)}
                  className={`shrink-0 snap-start min-w-[5.5rem] px-2.5 pt-1.5 pb-1 border-t border-x rounded-t-sm text-left cursor-pointer ${
                    selected
                      ? 'bg-[#f6f1e7] text-stone-950 border-stone-700 -mb-px pb-2 z-10 relative'
                      : 'bg-[#c4baa4] text-stone-700 border-stone-500/80 hover:bg-[#d0c6b0]'
                  }`}
                >
                  <span className="flex flex-col font-typewriter font-bold text-xs uppercase tracking-wider leading-tight">
                    {entry.tab.map((line) => (
                      <span key={line}>{line}</span>
                    ))}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col flex-1 min-h-0 bg-newsprint border-t-2 border-stone-700">
            <div className="shrink-0 px-3 pt-3 sm:px-4">
              <h3 className="font-typewriter font-black text-sm uppercase tracking-widest text-stone-950">
                {page.title}
              </h3>
              {page.dek && (
                <p className="font-treatise italic text-xs text-stone-700 mt-0.5">{page.dek}</p>
              )}
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-3 sm:px-4 sm:p-4">
              <article className="reading-measure evidence-slip border border-stone-700 px-3 pt-2 pb-3">
                {page.summary && (
                  <p className="font-newspaper text-sm text-stone-700 leading-relaxed mb-3">{page.summary}</p>
                )}
                {page.id === 'cipher' ? <CipherDeskRail /> : null}
                {page.points.length > 0 && (
                  <div className="space-y-2 font-newspaper text-sm text-stone-700 leading-relaxed">
                    {page.points.map((point) => (
                      <p key={point.lead}>
                        <span className="font-typewriter font-bold uppercase tracking-wide text-stone-900">
                          {point.lead}:
                        </span>{' '}
                        {emphasizeDailyQuota(point.body)}
                      </p>
                    ))}
                  </div>
                )}
              </article>
            </div>
          </div>
        </div>

        <div className="modal-action-dock sm:flex sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="woodblock-stamp w-full min-h-12 sm:w-auto px-4 py-1.5 font-typewriter font-bold text-xs uppercase tracking-wider cursor-pointer"
          >
            I'm Ready to Decode
          </button>
        </div>
    </DeskModal>
  );
};
