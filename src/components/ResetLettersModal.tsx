import React from 'react';
import { RotateCcw, X } from '../icons';

interface ResetLettersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ResetLettersModal: React.FC<ResetLettersModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop is-slip z-50 select-none" onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="reset-letters-title"
        className="modal-sheet is-slip max-w-md"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-masthead">
          <div className="flex items-center gap-2 min-w-0">
            <RotateCcw className="w-5 h-5 shrink-0" />
            <h2
              id="reset-letters-title"
              className="text-base sm:text-lg font-masthead font-bold tracking-wide uppercase leading-tight"
            >
              Clear letters
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="desk-hit shrink-0 flex items-center justify-center text-stone-700 hover:text-stone-950 rounded hover:bg-stone-200 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 bg-newsprint">
          <p className="font-newspaper text-sm text-stone-700 leading-relaxed">
            This wipes every mapped letter on this edition. The cipher itself stays.
          </p>
        </div>
        <div className="modal-action-dock p-3 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:px-4 sm:py-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto min-h-12 px-4 py-2.5 border-2 border-stone-800 bg-[#f8f3e8] hover:bg-amber-100 text-stone-950 font-typewriter font-bold text-xs uppercase tracking-wider cursor-pointer"
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
      </section>
    </div>
  );
};
