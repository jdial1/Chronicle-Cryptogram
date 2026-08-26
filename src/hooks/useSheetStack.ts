import { useCallback, useEffect, useRef } from 'react';
import { isAndroidAppShell, postToAndroidApp } from '../utils/androidApp';
import { useDialogFocus } from './useDialogFocus';

export function useSheetStack(depth: number, closeTop: () => boolean) {
  const closeTopRef = useRef(closeTop);
  closeTopRef.current = closeTop;
  const histPushed = useRef(false);

  useEffect(() => {
    postToAndroidApp({ type: 'SHEET_STACK', depth });
  }, [depth]);

  useEffect(() => {
    if (isAndroidAppShell()) return;
    const stacked = Boolean(
      window.history.state && (window.history.state as { chronicleSheet?: boolean }).chronicleSheet
    );
    if (depth > 0) {
      if (stacked) {
        window.history.replaceState({ chronicleSheet: true }, '');
      } else {
        window.history.pushState({ chronicleSheet: true }, '');
        histPushed.current = true;
      }
      return;
    }
    if (histPushed.current && stacked) {
      histPushed.current = false;
      window.history.back();
      return;
    }
    histPushed.current = false;
    if (stacked) window.history.replaceState(null, '');
  }, [depth]);

  useDialogFocus(depth);

  const onAndroidBack = useCallback(() => {
    closeTopRef.current();
  }, []);

  useEffect(() => {
    const focusedField = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || focusedField(event.target)) return;
      if (closeTopRef.current()) event.preventDefault();
    };
    const onPop = () => {
      if (isAndroidAppShell()) return;
      closeTopRef.current();
    };
    window.addEventListener('chronicle-android-back', onAndroidBack);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('chronicle-android-back', onAndroidBack);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('popstate', onPop);
    };
  }, [onAndroidBack]);
}
