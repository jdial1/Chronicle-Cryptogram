import type { ReactNode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { reportDesk } from '../utils/deskError';
import { INK_LIGHT, PAPER_LIGHT } from '../themeTokens';

function DeskFallback({ sheet }: { sheet?: boolean }) {
  return (
    <div
      className={
        sheet
          ? 'fixed inset-0 z-[80] flex items-center justify-center p-6'
          : 'min-h-screen flex items-center justify-center p-6'
      }
      style={{ background: sheet ? 'transparent' : PAPER_LIGHT, color: INK_LIGHT }}
    >
      <div
        className={sheet ? 'max-w-md text-center p-6 border-2 border-stone-800' : 'max-w-md text-center'}
        style={sheet ? { background: PAPER_LIGHT } : undefined}
      >
        <p className="font-masthead font-bold uppercase tracking-widest">Edition desk jammed</p>
        <p className="mt-3 font-newspaper text-sm">Reload the paper and the cipher will set again.</p>
        <button
          type="button"
          className="mt-4 px-4 py-2 border-2 border-stone-800 font-typewriter text-xs uppercase"
          onClick={() => window.location.reload()}
        >
          Reload
        </button>
      </div>
    </div>
  );
}

export function DeskErrorBoundary({
  children,
  variant = 'page',
}: {
  children: ReactNode;
  variant?: 'page' | 'sheet';
}) {
  return (
    <ErrorBoundary
      fallback={<DeskFallback sheet={variant === 'sheet'} />}
      onError={(error) => reportDesk(error, 'render')}
    >
      {children}
    </ErrorBoundary>
  );
}
