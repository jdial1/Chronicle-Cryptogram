import React, { type ReactNode } from 'react';
import { X } from '../icons';

type DeskModalProps = {
  isOpen: boolean;
  onClose: () => void;
  titleId: string;
  title?: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  zClass?: string;
  slip?: boolean;
  sheetClassName?: string;
  titleClassName?: string;
  children: ReactNode;
};

export function DeskModal({
  isOpen,
  onClose,
  titleId,
  title,
  subtitle,
  icon,
  zClass = 'z-50',
  slip = false,
  sheetClassName = '',
  titleClassName = 'text-base sm:text-lg font-masthead font-bold tracking-wide uppercase leading-tight',
  children,
}: DeskModalProps) {
  if (!isOpen) return null;
  const slipClass = slip ? 'is-slip' : '';
  return (
    <div className={`modal-backdrop ${slipClass} ${zClass} select-none`} onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`modal-sheet ${slipClass} ${sheetClassName}`.trim()}
        onClick={(event) => event.stopPropagation()}
      >
        {title != null ? (
          <div className="modal-masthead">
            <div className="flex items-center gap-2 min-w-0">
              {icon}
              <div className="min-w-0">
                <h2 id={titleId} className={titleClassName}>
                  {title}
                </h2>
                {subtitle}
              </div>
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
        ) : null}
        {children}
      </section>
    </div>
  );
}
