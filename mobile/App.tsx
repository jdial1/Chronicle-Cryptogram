import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import {
  GoogleOneTapSignIn,
  isCancelledResponse,
  isNoSavedCredentialFoundResponse,
  isSuccessResponse,
} from 'react-native-nitro-google-signin';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, type WebViewMessageEvent, type WebViewNavigation } from 'react-native-webview';
import {
  cancelLocalDispatch,
  listenAppActive,
  listenForegroundDispatch,
  listenTokenRefresh,
  registerDispatchToken,
  requestDispatchPermission,
  hasDispatchPermission,
  showSubscribeNotice,
  stopDispatchToken,
} from './dispatch';

SplashScreen.preventAutoHideAsync();

const extra = Constants.expoConfig?.extra as
  | { webUrl?: string; googleWebClientId?: string }
  | undefined;

const WEB_URL = extra?.webUrl ?? 'https://jdial1.github.io/Chronicle-Cryptogram/';
const GOOGLE_WEB_CLIENT_ID =
  extra?.googleWebClientId ??
  '647414230767-coj2nt4mk2ok8rf919gh108502qtptup.apps.googleusercontent.com';
const PAPER_LIGHT = '#fbf7ee';
const PAPER_DARK = '#1C1A17';
const INK_LIGHT = '#1c1917';
const INK_DARK = '#f7f3e8';

function appUri() {
  const url = new URL(WEB_URL);
  url.searchParams.set('source', 'android');
  return url.toString();
}

const SOURCE_URI = appUri();
const GAME_ORIGIN = new URL(WEB_URL).origin;

const INJECTED = `
(function(){
  window.__CHRONICLE_ANDROID_APP__ = true;
  window.__CHRONICLE_NATIVE_AUTH_QUEUE__ = window.__CHRONICLE_NATIVE_AUTH_QUEUE__ || [];
  window.__CHRONICLE_NATIVE_AUTH__ = window.__CHRONICLE_NATIVE_AUTH__ || function(detail){
    window.__CHRONICLE_NATIVE_AUTH_QUEUE__.push(detail);
    window.dispatchEvent(new CustomEvent('chronicle-native-auth',{detail:detail}));
  };
  function requestNativeSignIn(){
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({type:'GOOGLE_SIGN_IN'}));
    }
  }
  function isAuthUrl(url){
    var u = String(url || '');
    return u.indexOf('accounts.google.com') !== -1 || u.indexOf('/__/auth') !== -1 || u.indexOf('firebaseapp.com') !== -1;
  }
  var origOpen = window.open;
  window.alert = function(){};
  window.confirm = function(){ return false; };
  window.prompt = function(){ return null; };
  window.open = function(url){
    if (!url || isAuthUrl(url)) {
      requestNativeSignIn();
      var loc = String(url || '');
      return {
        closed: false,
        close: function(){ this.closed = true; },
        focus: function(){},
        postMessage: function(){},
        get location(){ return { href: loc, assign: function(v){ loc = String(v); if (isAuthUrl(loc)) requestNativeSignIn(); } }; },
        set location(v){ loc = String(v); if (isAuthUrl(loc)) requestNativeSignIn(); }
      };
    }
    if (origOpen) return origOpen.apply(window, arguments);
    return null;
  };
  true;
})();
`;

function isAuthUrl(url: string) {
  try {
    const host = new URL(url).hostname;
    return (
      host === 'accounts.google.com' ||
      host.endsWith('.firebaseapp.com') ||
      url.includes('/__/auth/')
    );
  } catch {
    return false;
  }
}

function injectEvent(webRef: RefObject<WebView | null>, name: string, detail: object) {
  const payload = JSON.stringify(detail);
  webRef.current?.injectJavaScript(
    `(function(){var d=${payload};if(window.__CHRONICLE_NATIVE_AUTH__){window.__CHRONICLE_NATIVE_AUTH__(d);}window.dispatchEvent(new CustomEvent('${name}',{detail:d}));true;})();`
  );
}

function injectCipher(webRef: RefObject<WebView | null>, detail: object) {
  const payload = JSON.stringify(detail);
  webRef.current?.injectJavaScript(
    `(function(){window.dispatchEvent(new CustomEvent('chronicle-native-cipher',{detail:${payload}}));true;})();`
  );
}

function injectAndroidBack(webRef: RefObject<WebView | null>) {
  webRef.current?.injectJavaScript(
    `(function(){window.dispatchEvent(new CustomEvent('chronicle-android-back'));true;})();`
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Desk />
    </SafeAreaProvider>
  );
}

function Desk() {
  const insets = useSafeAreaInsets();
  const [webDark, setWebDark] = useState<boolean | null>(null);
  const night = webDark === true;
  const paper = night ? PAPER_DARK : PAPER_LIGHT;
  const ink = night ? INK_DARK : INK_LIGHT;
  const webRef = useRef<WebView>(null);
  const cipherRef = useRef<TextInput>(null);
  const canGoBack = useRef(false);
  const sheetDepth = useRef(0);
  const signingIn = useRef(false);
  const dispatchOn = useRef(false);
  const persistKeysUntil = useRef(0);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [cacheBust, setCacheBust] = useState(false);

  useEffect(() => {
    GoogleOneTapSignIn.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });
  }, []);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(paper).catch(() => undefined);
  }, [paper]);

  useEffect(() => {
    const hide = setTimeout(() => {
      SplashScreen.hideAsync();
    }, 8000);
    return () => clearTimeout(hide);
  }, []);

  useEffect(() => {
    const shown = Keyboard.addListener('keyboardDidShow', () => {
      injectCipher(webRef, { type: 'SHOW' });
    });
    const hidden = Keyboard.addListener('keyboardDidHide', () => {
      if (Date.now() < persistKeysUntil.current) {
        cipherRef.current?.focus();
        return;
      }
      injectCipher(webRef, { type: 'BLUR' });
    });
    return () => {
      shown.remove();
      hidden.remove();
    };
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (sheetDepth.current > 0) {
        injectAndroidBack(webRef);
        return true;
      }
      if (canGoBack.current) {
        webRef.current?.goBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, []);

  const keepCipherKeys = useCallback(() => {
    persistKeysUntil.current = Date.now() + 500;
    cipherRef.current?.focus();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  }, []);

  const hideSplash = useCallback(() => {
    SplashScreen.hideAsync();
  }, []);

  const paintInsets = useCallback(() => {
    webRef.current?.injectJavaScript(
      `(function(){var r=document.documentElement;r.style.setProperty('--safe-top','${insets.top}px');r.style.setProperty('--safe-right','${insets.right}px');r.style.setProperty('--safe-bottom','${insets.bottom}px');r.style.setProperty('--safe-left','${insets.left}px');true;})();`
    );
  }, [insets.bottom, insets.left, insets.right, insets.top]);

  useEffect(() => {
    paintInsets();
  }, [paintInsets]);

  const retry = useCallback(() => {
    setFailed(false);
    setReloadKey((n) => n + 1);
  }, []);

  const reportDispatch = useCallback((detail: object) => {
    injectEvent(webRef, 'chronicle-native-delivery', detail);
  }, []);

  const refreshDispatchToken = useCallback(async () => {
    if (!dispatchOn.current) return;
    if (!(await hasDispatchPermission())) return;
    try {
      const token = await registerDispatchToken();
      reportDispatch({ subscribed: true, blocked: false, token });
    } catch {
      reportDispatch({ subscribed: true, blocked: false });
    }
  }, [reportDispatch]);

  const subscribeDelivery = useCallback(async () => {
    const allowed = await requestDispatchPermission();
    if (!allowed) {
      dispatchOn.current = false;
      reportDispatch({ subscribed: false, blocked: true });
      return;
    }
    dispatchOn.current = true;
    await cancelLocalDispatch();
    await showSubscribeNotice();
    try {
      const token = await registerDispatchToken();
      reportDispatch({ subscribed: true, blocked: false, token });
    } catch {
      reportDispatch({ subscribed: true, blocked: false });
    }
  }, [reportDispatch]);

  const unsubscribeDelivery = useCallback(async () => {
    dispatchOn.current = false;
    await cancelLocalDispatch();
    await stopDispatchToken();
    reportDispatch({ subscribed: false, blocked: false });
  }, [reportDispatch]);

  useEffect(() => {
    void cancelLocalDispatch();
    const foreground = listenForegroundDispatch();
    const tokens = listenTokenRefresh((token) => {
      if (!dispatchOn.current) return;
      reportDispatch({ subscribed: true, blocked: false, token });
    });
    const appState = listenAppActive(() => {
      void (async () => {
        const allowed = await hasDispatchPermission();
        if (!allowed) {
          if (!dispatchOn.current) return;
          dispatchOn.current = false;
          await cancelLocalDispatch();
          await stopDispatchToken();
          reportDispatch({ subscribed: false, blocked: true });
          return;
        }
        if (dispatchOn.current) {
          await refreshDispatchToken();
          return;
        }
        reportDispatch({ blocked: false });
      })();
    });
    return () => {
      foreground();
      tokens();
      appState.remove();
    };
  }, [refreshDispatchToken, reportDispatch]);

  const nativeSignIn = useCallback(async () => {
    if (signingIn.current) return;
    signingIn.current = true;
    try {
      await GoogleOneTapSignIn.checkPlayServices(true);
      let response = await GoogleOneTapSignIn.presentExplicitSignIn();
      if (isNoSavedCredentialFoundResponse(response)) {
        response = await GoogleOneTapSignIn.createAccount();
      }
      if (isCancelledResponse(response) || isNoSavedCredentialFoundResponse(response)) {
        return;
      }
      const idToken = isSuccessResponse(response) ? response.data.idToken : null;
      if (!idToken) {
        injectEvent(webRef, 'chronicle-native-auth', {
          type: 'ERROR',
          message: 'Sign-in cancelled',
        });
        return;
      }
      injectEvent(webRef, 'chronicle-native-auth', {
        type: 'ID_TOKEN',
        idToken,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign-in failed';
      injectEvent(webRef, 'chronicle-native-auth', { type: 'ERROR', message });
    } finally {
      signingIn.current = false;
    }
  }, []);

  const nativeSignOut = useCallback(async () => {
    try {
      await GoogleOneTapSignIn.signOut();
    } catch {
      return;
    }
  }, []);

  const onMessage = useCallback(
    (event: WebViewMessageEvent) => {
      let payload: { type?: string; title?: string; text?: string; depth?: number; dark?: boolean };
      try {
        payload = JSON.parse(event.nativeEvent.data);
      } catch {
        return;
      }
      if (payload.type === 'GOOGLE_SIGN_IN') nativeSignIn();
      if (payload.type === 'GOOGLE_SIGN_OUT') nativeSignOut();
      if (payload.type === 'DELIVERY_SUBSCRIBE') subscribeDelivery();
      if (payload.type === 'DELIVERY_UNSUBSCRIBE') unsubscribeDelivery();
      if (payload.type === 'DELIVERY_RESCHEDULE') {
        dispatchOn.current = true;
        refreshDispatchToken();
      }
      if (payload.type === 'OPEN_SETTINGS') {
        Linking.openSettings().catch(() => undefined);
      }
      if (payload.type === 'THEME') {
        setWebDark(payload.dark === true);
      }
      if (payload.type === 'SHARE' && payload.text) {
        Share.share({
          title: payload.title || 'Chronicle Cryptogram',
          message: payload.text,
        }).catch(() => undefined);
      }
      if (payload.type === 'SHEET_STACK') {
        sheetDepth.current = Math.max(0, Number(payload.depth) || 0);
      }
      if (payload.type === 'CIPHER_FOCUS') keepCipherKeys();
      if (payload.type === 'CIPHER_BLUR') {
        cipherRef.current?.blur();
      }
      if (payload.type === 'RELOAD') {
        setCacheBust(true);
        setReloadKey((n) => n + 1);
      }
    },
    [keepCipherKeys, nativeSignIn, nativeSignOut, refreshDispatchToken, subscribeDelivery, unsubscribeDelivery, setWebDark]
  );

  const onNav = useCallback((nav: WebViewNavigation) => {
    if (isAuthUrl(nav.url)) {
      webRef.current?.stopLoading();
      webRef.current?.injectJavaScript(
        `(function(){if(location.origin!==${JSON.stringify(GAME_ORIGIN)}){location.replace(${JSON.stringify(SOURCE_URI)});}true;})();`
      );
      return;
    }
    canGoBack.current = nav.canGoBack;
  }, []);

  if (failed) {
    return (
      <View style={[styles.fail, { backgroundColor: paper, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <StatusBar style={night ? 'light' : 'dark'} />
        <Text style={[styles.failKicker, { color: ink }]}>The wire is down</Text>
        <Text style={[styles.failBody, { color: ink }]}>
          Chronicle Cryptogram could not reach the morning edition. Check the connection and try
          again.
        </Text>
        <Pressable
          onPress={retry}
          accessibilityRole="button"
          accessibilityLabel="Retry"
          style={[styles.retry, { borderColor: ink }]}
        >
          <Text style={[styles.retryLabel, { color: ink }]}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: paper }]}>
      <StatusBar style={night ? 'light' : 'dark'} />
      <KeyboardAvoidingView
        style={[styles.desk, { backgroundColor: paper }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={insets.top}
      >
        <ScrollView
          style={[styles.desk, { backgroundColor: paper }]}
          contentContainerStyle={[styles.desk, { backgroundColor: paper }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
          scrollEnabled={false}
        >
        <WebView
          key={reloadKey}
          ref={webRef}
          source={{ uri: SOURCE_URI }}
          style={[styles.web, { backgroundColor: paper }]}
          startInLoadingState
          renderLoading={() => (
            <View style={[styles.loading, { backgroundColor: paper }]}>
              <ActivityIndicator size="large" color={ink} />
            </View>
          )}
          injectedJavaScriptBeforeContentLoaded={INJECTED}
          injectedJavaScript={INJECTED}
          javaScriptEnabled
          cacheEnabled
          cacheMode={cacheBust ? 'LOAD_NO_CACHE' : 'LOAD_CACHE_ELSE_NETWORK'}
          domStorageEnabled
          sharedCookiesEnabled={false}
          thirdPartyCookiesEnabled={false}
          setSupportMultipleWindows={false}
          originWhitelist={[GAME_ORIGIN]}
          onShouldStartLoadWithRequest={(request) => !isAuthUrl(request.url)}
          onMessage={onMessage}
          onNavigationStateChange={onNav}
          onLoadEnd={() => {
            hideSplash();
            paintInsets();
            if (cacheBust) setCacheBust(false);
          }}
          onError={() => {
            hideSplash();
            setFailed(true);
          }}
          onHttpError={(event) => {
            if (event.nativeEvent.statusCode >= 400) {
              hideSplash();
              setFailed(true);
            }
          }}
          allowsBackForwardNavigationGestures={false}
          overScrollMode="never"
          nestedScrollEnabled
        />
        <TextInput
          ref={cipherRef}
          value=""
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no"
          autoCorrect={false}
          autoCapitalize="characters"
          spellCheck={false}
          autoComplete="off"
          textContentType="none"
          importantForAutofill="noExcludeDescendants"
          caretHidden
          contextMenuHidden
          showSoftInputOnFocus
          blurOnSubmit={false}
          disableFullscreenUI
          inputMode="search"
          keyboardType={Platform.OS === 'ios' ? 'ascii-capable' : 'default'}
          returnKeyType="done"
          style={styles.cipherInput}
          onChangeText={(text) => {
            const letter = text.replace(/[^a-zA-Z]/g, '').slice(-1);
            cipherRef.current?.setNativeProps({ text: '' });
            if (letter) {
              Haptics.selectionAsync().catch(() => undefined);
              injectCipher(webRef, { type: 'KEY', letter: letter.toUpperCase() });
            }
          }}
          onKeyPress={({ nativeEvent }) => {
            if (nativeEvent.key === 'Backspace') {
              Haptics.selectionAsync().catch(() => undefined);
              injectCipher(webRef, { type: 'BACKSPACE' });
            }
          }}
        />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  desk: {
    flex: 1,
  },
  web: {
    flex: 1,
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cipherInput: {
    position: 'absolute',
    opacity: 0,
    width: 0,
    height: 0,
    fontSize: 16,
  },
  fail: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  failKicker: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  failBody: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  retry: {
    marginTop: 8,
    borderWidth: 2,
    paddingHorizontal: 28,
    paddingVertical: 10,
  },
  retryLabel: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
