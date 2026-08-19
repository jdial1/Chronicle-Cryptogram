import { useEffect, useState } from 'react';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from './firebase';
import { isAndroidAppShell, postToAndroidApp } from './androidApp';

type NativeAuthDetail = {
  type?: string;
  idToken?: string;
  message?: string;
};

type AndroidAuthWindow = Window & {
  __CHRONICLE_NATIVE_AUTH__?: (detail: NativeAuthDetail) => void;
  __CHRONICLE_NATIVE_AUTH_QUEUE__?: NativeAuthDetail[];
};

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
    });
  }, []);

  useEffect(() => {
    if (!auth || !isAndroidAppShell()) return;
    const apply = (detail: NativeAuthDetail) => {
      if (detail?.type === 'ID_TOKEN' && detail.idToken && auth) {
        signInWithCredential(auth, GoogleAuthProvider.credential(detail.idToken)).catch((err) => {
          setError(err instanceof Error ? err.message : 'Sign-in failed');
        });
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
      if (w.__CHRONICLE_NATIVE_AUTH__ === apply) w.__CHRONICLE_NATIVE_AUTH__ = undefined;
      window.removeEventListener('chronicle-native-auth', onNative);
    };
  }, []);

  const signIn = async () => {
    if (!auth || !googleProvider) return;
    setError(null);
    if (isAndroidAppShell()) {
      postToAndroidApp({ type: 'GOOGLE_SIGN_IN' });
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign-in failed';
      setError(message);
    }
  };

  const signOutUser = async () => {
    if (!auth) return;
    setError(null);
    await signOut(auth);
    if (isAndroidAppShell()) postToAndroidApp({ type: 'GOOGLE_SIGN_OUT' });
  };

  return { user, ready, error, signIn, signOut: signOutUser, configured: isFirebaseConfigured };
}
