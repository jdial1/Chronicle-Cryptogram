import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { isFirebaseConfigured } from '../utils/firebaseFlags';
import { isAndroidAppShell, postToAndroidApp } from '../utils/androidApp';
import { firebaseCode, toUserMessage, forgetCloud } from '../utils/deskError';

type NativeAuthDetail = {
  type?: string;
  idToken?: string;
  message?: string;
};

type AndroidAuthWindow = Window & {
  __CHRONICLE_NATIVE_AUTH__?: (detail: NativeAuthDetail) => void;
  __CHRONICLE_NATIVE_AUTH_QUEUE__?: NativeAuthDetail[];
};

function runWhenIdle(fn: () => void) {
  if (typeof requestIdleCallback === 'function') {
    const id = requestIdleCallback(fn, { timeout: 1800 });
    return () => cancelIdleCallback(id);
  }
  const id = window.setTimeout(fn, 1);
  return () => window.clearTimeout(id);
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!isFirebaseConfigured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setReady(true);
      return;
    }
    let cancelled = false;
    let unsub = () => undefined as void;
    let clearOnline = () => undefined as void;
    let clearNative = () => undefined as void;

    const stopIdle = runWhenIdle(() => {
      void (async () => {
        const [{ auth }, authMod, { onGoogleIdToken }] = await Promise.all([
          import('../utils/firebase'),
          import('firebase/auth'),
          import('../utils/googleIdentity'),
        ]);
        if (cancelled) return;
        if (!auth) {
          setReady(true);
          return;
        }
        const deskAuth = auth;
        const {
          GoogleAuthProvider,
          linkWithCredential,
          onAuthStateChanged,
          signInAnonymously,
          signInWithCredential,
        } = authMod;

        async function upgradeWithGoogleCredential(
          cred: ReturnType<typeof GoogleAuthProvider.credential>
        ) {
          const current = deskAuth.currentUser;
          if (current?.isAnonymous) {
            try {
              await linkWithCredential(current, cred);
              return;
            } catch (err) {
              const code = firebaseCode(err);
              if (code !== 'auth/credential-already-in-use' && code !== 'auth/email-already-in-use') {
                throw err;
              }
            }
          }
          await signInWithCredential(deskAuth, cred);
        }

        unsub = onAuthStateChanged(deskAuth, (next) => {
          setUser(next);
          setReady(true);
          if (!next) {
            if (typeof navigator !== 'undefined' && !navigator.onLine) return;
            forgetCloud(signInAnonymously(deskAuth), 'anon-auth');
          }
        });
        const onOnline = () => {
          if (!deskAuth.currentUser) forgetCloud(signInAnonymously(deskAuth), 'anon-auth');
        };
        window.addEventListener('online', onOnline);
        clearOnline = () => window.removeEventListener('online', onOnline);

        const applyToken = (idToken: string) => {
          setError(null);
          upgradeWithGoogleCredential(GoogleAuthProvider.credential(idToken)).catch((err) => {
            setError(toUserMessage(err, 'Sign-in failed'));
          });
        };
        onGoogleIdToken(applyToken);
        if (!isAndroidAppShell()) {
          clearNative = () => onGoogleIdToken(null);
          return;
        }
        let seenToken = '';
        const apply = (detail: NativeAuthDetail) => {
          if (detail?.type === 'ID_TOKEN' && detail.idToken) {
            postToAndroidApp({ type: 'NATIVE_AUTH_ACK' });
            if (seenToken === detail.idToken) return;
            seenToken = detail.idToken;
            applyToken(detail.idToken);
            return;
          }
          if (detail?.type === 'ERROR') {
            postToAndroidApp({ type: 'NATIVE_AUTH_ACK' });
            setError(detail.message || 'Sign-in failed');
          }
        };
        const onNative = (event: Event) => {
          apply((event as CustomEvent<NativeAuthDetail>).detail);
        };
        const w = window as AndroidAuthWindow;
        w.__CHRONICLE_NATIVE_AUTH__ = apply;
        const queued = w.__CHRONICLE_NATIVE_AUTH_QUEUE__;
        if (Array.isArray(queued)) {
          w.__CHRONICLE_NATIVE_AUTH_QUEUE__ = [];
          queued.forEach(apply);
        }
        window.addEventListener('chronicle-native-auth', onNative);
        clearNative = () => {
          onGoogleIdToken(null);
          if (w.__CHRONICLE_NATIVE_AUTH__ === apply) w.__CHRONICLE_NATIVE_AUTH__ = undefined;
          window.removeEventListener('chronicle-native-auth', onNative);
        };
      })();
    });

    return () => {
      cancelled = true;
      stopIdle();
      unsub();
      clearOnline();
      clearNative();
    };
  }, []);

  const signIn = async () => {
    const { auth } = await import('../utils/firebase');
    if (!auth) return;
    setError(null);
    if (isAndroidAppShell()) postToAndroidApp({ type: 'GOOGLE_SIGN_IN' });
  };

  const signOutUser = async () => {
    const [{ auth }, { signOut }] = await Promise.all([import('../utils/firebase'), import('firebase/auth')]);
    if (!auth) return;
    setError(null);
    try {
      await signOut(auth);
    } catch (err) {
      setError(toUserMessage(err, 'Sign-out failed'));
      return;
    }
    if (isAndroidAppShell()) postToAndroidApp({ type: 'GOOGLE_SIGN_OUT' });
  };

  /**
   * Closes the Firebase Auth account itself. Play's deletion requirement is the
   * account, not just its documents -- signing out leaves the account alive.
   * Callers must wipe Firestore first: once the account is gone, request.auth is
   * null and every rule denies.
   */
  const deleteAccount = async () => {
    const [{ auth }, { deleteUser }] = await Promise.all([
      import('../utils/firebase'),
      import('firebase/auth'),
    ]);
    const current = auth?.currentUser;
    if (!auth || !current) return;
    setError(null);
    try {
      await deleteUser(current);
    } catch (err) {
      setError(toUserMessage(err, 'The bureau could not close the file.'));
      throw err;
    }
    if (isAndroidAppShell()) postToAndroidApp({ type: 'GOOGLE_SIGN_OUT' });
  };

  return {
    user,
    identified: Boolean(user && !user.isAnonymous),
    ready,
    error,
    signIn,
    signOut: signOutUser,
    deleteAccount,
    configured: isFirebaseConfigured,
  };
}
