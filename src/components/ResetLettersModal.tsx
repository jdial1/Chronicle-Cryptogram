import React from 'react';
import { RotateCcw } from '../icons';
import { DeskModal } from './DeskModal';

interface ResetLettersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ResetLettersModal: React.FC<ResetLettersModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => (
  <DeskModal
    isOpen={isOpen}
    onClose={onClose}
    titleId="reset-letters-title"
    title="Clear letters"
    icon={<RotateCcw className="w-5 h-5 shrink-0" />}
    slip
    sheetClassName="max-w-md"
  >
    <div className="p-5 bg-newsprint">
      <p className="font-newspaper text-sm text-stone-700 leading-relaxed">
        This wipes every mapped letter on this edition. The cipher itself stays.
      </p>
    </div>
    <div className="modal-action-dock p-3 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:px-4 sm:py-2.5">
      <button
        type="button"
        onClick={onClose}
        className="w-full sm:w-auto min-h-12 px-4 py-2.5 border-2 border-stone-800 bg-[var(--paper)] hover:bg-amber-100 text-stone-950 font-typewriter font-bold text-xs uppercase tracking-wider cursor-pointer"
      >
        Keep working
      </button>
      <button
        type="button"
        onClick={onConfirm}
        className="woodblock-stamp w-full sm:w-auto min-h-12 px-4 py-2.5 font-typewriter font-bold text-xs uppercase tracking-wider cursor-pointer"
      >
        Clear letters
      </button>
    </div>
  </DeskModal>
);
