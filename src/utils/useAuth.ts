import { useEffect, useState } from 'react';
import {
  GoogleAuthProvider,
  linkWithCredential,
  onAuthStateChanged,
  signInAnonymously,
  signInWithCredential,
  signOut,
  type User,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from './firebase';
import { isAndroidAppShell, postToAndroidApp } from './androidApp';
import { onGoogleIdToken } from './googleIdentity';

type NativeAuthDetail = {
  type?: string;
  idToken?: string;
  message?: string;
};

type AndroidAuthWindow = Window & {
  __CHRONICLE_NATIVE_AUTH__?: (detail: NativeAuthDetail) => void;
  __CHRONICLE_NATIVE_AUTH_QUEUE__?: NativeAuthDetail[];
};

async function upgradeWithGoogleCredential(
  cred: ReturnType<typeof GoogleAuthProvider.credential>
) {
  if (!auth) return;
  const current = auth.currentUser;
  if (current?.isAnonymous) {
    try {
      await linkWithCredential(current, cred);
      return;
    } catch (err) {
      const code = err && typeof err === 'object' && 'code' in err ? String(err.code) : '';
      if (code !== 'auth/credential-already-in-use' && code !== 'auth/email-already-in-use') {
        throw err;
      }
    }
  }
  await signInWithCredential(auth, cred);
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!isFirebaseConfigured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      setReady(true);
      return;
    }
    return onAuthStateChanged(auth, (next) => {
      setUser(next);
      setReady(true);
      if (!next) signInAnonymously(auth).catch(() => undefined);
    });
  }, []);

  useEffect(() => {
    if (!auth) return;
    const applyToken = (idToken: string) => {
      setError(null);
      upgradeWithGoogleCredential(GoogleAuthProvider.credential(idToken)).catch((err) => {
        const code = err && typeof err === 'object' && 'code' in err ? String(err.code) : '';
        setError(code || (err instanceof Error ? err.message : 'Sign-in failed'));
      });
    };
    onGoogleIdToken(applyToken);
    if (!isAndroidAppShell()) return () => onGoogleIdToken(null);
    const apply = (detail: NativeAuthDetail) => {
      if (detail?.type === 'ID_TOKEN' && detail.idToken) {
        applyToken(detail.idToken);
        return;
      }
      if (detail?.type === 'ERROR') {
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
    return () => {
      onGoogleIdToken(null);
      if (w.__CHRONICLE_NATIVE_AUTH__ === apply) w.__CHRONICLE_NATIVE_AUTH__ = undefined;
      window.removeEventListener('chronicle-native-auth', onNative);
    };
  }, []);

  const signIn = async () => {
    if (!auth) return;
    setError(null);
    if (isAndroidAppShell()) postToAndroidApp({ type: 'GOOGLE_SIGN_IN' });
  };

  const signOutUser = async () => {
    if (!auth) return;
    setError(null);
    await signOut(auth);
    if (isAndroidAppShell()) postToAndroidApp({ type: 'GOOGLE_SIGN_OUT' });
  };

  return {
    user,
    identified: Boolean(user && !user.isAnonymous),
    ready,
    error,
    signIn,
    signOut: signOutUser,
    configured: isFirebaseConfigured,
  };
}
