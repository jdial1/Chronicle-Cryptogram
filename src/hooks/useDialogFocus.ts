import { useLayoutEffect } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function shown(el: HTMLElement) {
  return el.getClientRects().length > 0;
}

function focusables(root: HTMLElement) {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(shown);
}

function topDialog() {
  let top: HTMLElement | null = null;
  let rank = -Infinity;
  for (const dialog of document.querySelectorAll<HTMLElement>('[role="dialog"]')) {
    const layer = dialog.closest('.modal-backdrop') ?? dialog;
    const z = Number.parseInt(getComputedStyle(layer).zIndex, 10);
    const next = Number.isNaN(z) ? 0 : z;
    if (!top || next >= rank) {
      top = dialog;
      rank = next;
    }
  }
  return top;
}

export function useDialogFocus(sheetDepth: number) {
  useLayoutEffect(() => {
    if (sheetDepth <= 0) return;
    const dialog = topDialog();
    if (!dialog) return;

    const prior = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!dialog.hasAttribute('tabindex')) dialog.tabIndex = -1;
    if (!dialog.contains(document.activeElement)) dialog.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const items = focusables(dialog);
      if (items.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (!dialog.contains(active) || (!event.shiftKey && active === last)) {
        event.preventDefault();
        first.focus();
        return;
      }
      if (event.shiftKey && (active === first || active === dialog)) {
        event.preventDefault();
        last.focus();
      }
    };

    const onFocusIn = (event: FocusEvent) => {
      if (!(event.target instanceof Node) || dialog.contains(event.target)) return;
      const items = focusables(dialog);
      (items[0] ?? dialog).focus();
    };

    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('focusin', onFocusIn);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('focusin', onFocusIn);
      if (prior?.isConnected) prior.focus();
    };
  }, [sheetDepth]);
}
