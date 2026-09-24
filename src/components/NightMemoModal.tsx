import React from 'react';
import { NIGHT_MEMO } from '../data/cipherTactics';
import { DeskModal } from './DeskModal';

/**
 * The Night Extra's rule, delivered as orders the first time it applies
 * (docs/SOUL-FEATURES.md, idea 31, after *Papers, Please*'s bulletins). Shown once;
 * the Handbook keeps the full procedure. It is a sheet, so the clock is stopped
 * while the agent reads it.
 */
export const NightMemoModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => (
  <DeskModal isOpen={isOpen} onClose={onClose} titleId="night-memo-title" title={NIGHT_MEMO.title} slip sheetClassName="max-w-md">
    <div className="p-5">
      <p className="reading-measure font-newspaper text-sm text-stone-800 leading-relaxed">{NIGHT_MEMO.body}</p>
    </div>
    <div className="modal-action-dock sm:flex sm:justify-end sm:px-4">
      <button
        type="button"
        onClick={onClose}
        className="w-full min-h-12 sm:w-auto px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-stone-950 font-typewriter font-bold text-xs uppercase tracking-wider cursor-pointer"
      >
        Understood
      </button>
    </div>
  </DeskModal>
);
