import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import {
  ActivityIndicator,
  AppState,
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

SplashScreen.preventAutoHideAsync();

const extra = Constants.expoConfig?.extra as
  | { webUrl?: string; googleWebClientId?: string }
  | undefined;

const WEB_URL = extra?.webUrl ?? 'https://jdial1.github.io/Chronicle-Cryptogram/';
const GOOGLE_WEB_CLIENT_ID =
  extra?.googleWebClientId ??
  '647414230767-coj2nt4mk2ok8rf919gh108502qtptup.apps.googleusercontent.com';
const PAPER_LIGHT = '#fbf7ee'; // keep in lockstep with src/themeTokens.ts
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
  window.__CHRONICLE_LAST_NATIVE_AUTH__ = window.__CHRONICLE_LAST_NATIVE_AUTH__ || '';
  window.__CHRONICLE_NATIVE_AUTH__ = window.__CHRONICLE_NATIVE_AUTH__ || function(detail){
    window.__CHRONICLE_NATIVE_AUTH_QUEUE__.push(detail);
    window.dispatchEvent(new CustomEvent('chronicle-native-auth',{detail:detail}));
  };
  window.__CHRONICLE_DELIVER_NATIVE_AUTH__ = function(d){
    var key = (d && d.type ? d.type : '') + ':' + (d && d.idToken ? d.idToken : (d && d.message ? d.message : ''));
    if (window.__CHRONICLE_LAST_NATIVE_AUTH__ === key) return;
    window.__CHRONICLE_LAST_NATIVE_AUTH__ = key;
    if (window.__CHRONICLE_NATIVE_AUTH__) {
      window.__CHRONICLE_NATIVE_AUTH__(d);
    } else {
      window.__CHRONICLE_NATIVE_AUTH_QUEUE__.push(d);
    }
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
  try {
    if (localStorage.getItem('cryptogram_offline_pack') && window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({type:'PRESS_PACKED'}));
    }
  } catch (e) {}
  function postErr(kind, msg){
    try {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type:'JS_ERROR',
          kind:kind,
          message:String(msg||'').slice(0,2000)
        }));
      }
    } catch (e) {}
  }
  function msgOf(args){
    var parts=[];
    for (var i=0;i<args.length;i++){
      var a=args[i];
      if (a==null) { parts.push(String(a)); continue; }
      if (typeof a==='string') { parts.push(a); continue; }
      if (a && a.stack) { parts.push(String(a.stack)); continue; }
      if (a && a.message) { parts.push(String(a.message)); continue; }
      try { parts.push(JSON.stringify(a)); } catch (e) { parts.push(String(a)); }
    }
    return parts.join(' ');
  }
  window.addEventListener('error', function(e){
    postErr('uncaught', (e && e.message ? e.message : 'error') + ' ' + (e && e.filename ? e.filename : '') + ':' + (e && e.lineno ? e.lineno : ''));
  });
  window.addEventListener('unhandledrejection', function(e){
    var r = e && e.reason;
    postErr('unhandledrejection', r && r.stack ? r.stack : r);
  });
  var origErr = console.error;
  console.error = function(){
    try { origErr.apply(console, arguments); } catch (e) {}
    var first = arguments[0];
    if (typeof first === 'string' && first.indexOf('[desk:') === 0) {
      postErr('desk', msgOf(arguments));
    }
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

function isMainEdition(url: string) {
  try {
    const incoming = new URL(url);
    const main = new URL(WEB_URL);
    return (
      incoming.origin === main.origin &&
      incoming.pathname.replace(/\/+$/, '') === main.pathname.replace(/\/+$/, '')
    );
  } catch {
    return false;
  }
}

function injectEvent(webRef: RefObject<WebView | null>, name: string, detail: object) {
  const payload = JSON.stringify(detail);
  if (name === 'chronicle-native-auth') {
    webRef.current?.injectJavaScript(
      `(function(){var d=${payload};if(window.__CHRONICLE_DELIVER_NATIVE_AUTH__){window.__CHRONICLE_DELIVER_NATIVE_AUTH__(d);}else if(window.__CHRONICLE_NATIVE_AUTH__){window.__CHRONICLE_NATIVE_AUTH__(d);}else{window.__CHRONICLE_NATIVE_AUTH_QUEUE__=window.__CHRONICLE_NATIVE_AUTH_QUEUE__||[];window.__CHRONICLE_NATIVE_AUTH_QUEUE__.push(d);}true;})();`
    );
    return;
  }
  webRef.current?.injectJavaScript(
    `(function(){var d=${payload};window.dispatchEvent(new CustomEvent('${name}',{detail:d}));true;})();`
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
  const pendingAuth = useRef<object | null>(null);
  const authFlush = useRef<ReturnType<typeof setTimeout>[]>([]);
  const persistKeysUntil = useRef(0);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [cacheBust, setCacheBust] = useState(false);
  const cacheTried = useRef(false);
  const loadFailed = useRef(false);
  const pressPacked = useRef(false);

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
    cacheTried.current = false;
    setFailed(false);
    setCacheBust(false);
    setReloadKey((n) => n + 1);
  }, []);

  const onLoadFail = useCallback((why?: string) => {
    if (why) console.error('[chronicle-webview]', why);
    loadFailed.current = true;
    hideSplash();
    if (cacheBust) {
      setCacheBust(false);
      setReloadKey((n) => n + 1);
      return;
    }
    if (!cacheTried.current) {
      cacheTried.current = true;
      setReloadKey((n) => n + 1);
      return;
    }
    console.error('[chronicle-webview] giving up after retries');
    setFailed(true);
  }, [cacheBust, hideSplash]);

  const stopAuthFlush = useCallback(() => {
    authFlush.current.forEach(clearTimeout);
    authFlush.current = [];
  }, []);

  const flushNativeAuth = useCallback(() => {
    if (!pendingAuth.current) return;
    injectEvent(webRef, 'chronicle-native-auth', pendingAuth.current);
  }, []);

  const deliverNativeAuth = useCallback(
    (detail: object) => {
      pendingAuth.current = detail;
      flushNativeAuth();
      stopAuthFlush();
      authFlush.current = [400, 1200, 3000].map((ms) => setTimeout(flushNativeAuth, ms));
    },
    [flushNativeAuth, stopAuthFlush]
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') flushNativeAuth();
    });
    return () => {
      sub.remove();
      stopAuthFlush();
    };
  }, [flushNativeAuth, stopAuthFlush]);

  const nativeSignIn = useCallback(async () => {
    if (signingIn.current) return;
    signingIn.current = true;
    try {
      await GoogleOneTapSignIn.checkPlayServices(true);
      let response = await GoogleOneTapSignIn.presentExplicitSignIn();
      if (isNoSavedCredentialFoundResponse(response)) {
        response = await GoogleOneTapSignIn.createAccount();
      }
      if (isCancelledResponse(response)) return;
      let idToken = isSuccessResponse(response) ? response.data?.idToken : null;
      if (!idToken) {
        try {
          idToken = (await GoogleOneTapSignIn.getTokens()).idToken;
        } catch {
          idToken = null;
        }
      }
      if (!idToken) {
        deliverNativeAuth({
          type: 'ERROR',
          message: 'Google did not return an ID token.',
        });
        return;
      }
      deliverNativeAuth({
        type: 'ID_TOKEN',
        idToken,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign-in failed';
      deliverNativeAuth({ type: 'ERROR', message });
    } finally {
      signingIn.current = false;
    }
  }, [deliverNativeAuth]);

  const nativeSignOut = useCallback(async () => {
    try {
      await GoogleOneTapSignIn.signOut();
    } catch {
      return;
    }
  }, []);

  const onMessage = useCallback(
    (event: WebViewMessageEvent) => {
      let payload: {
        type?: string;
        title?: string;
        text?: string;
        depth?: number;
        dark?: boolean;
        version?: string;
        kind?: string;
        message?: string;
      };
      try {
        payload = JSON.parse(event.nativeEvent.data);
      } catch {
        return;
      }
      if (payload.type === 'JS_ERROR') {
        console.error('[chronicle-js]', payload.kind || 'error', payload.message);
      }
      if (payload.type === 'GOOGLE_SIGN_IN') nativeSignIn();
      if (payload.type === 'NATIVE_AUTH_ACK') {
        pendingAuth.current = null;
        stopAuthFlush();
      }
      if (payload.type === 'GOOGLE_SIGN_OUT') nativeSignOut();
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
        cacheTried.current = false;
        setCacheBust(true);
        setReloadKey((n) => n + 1);
      }
      if (payload.type === 'PRESS_PACKED') {
        pressPacked.current = true;
      }
    },
    [keepCipherKeys, nativeSignIn, nativeSignOut, stopAuthFlush, setWebDark]
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
          {pressPacked.current
            ? 'The packed edition did not open. Retry to read from this desk, or restore the wire.'
            : 'Chronicle Cryptogram could not reach the morning edition. If you packed the press, retry to open the copy on this desk. Otherwise check the connection and try again.'}
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
          onLoadStart={() => {
            loadFailed.current = false;
          }}
          onLoadEnd={() => {
            hideSplash();
            paintInsets();
            flushNativeAuth();
            if (cacheBust) setCacheBust(false);
            if (!loadFailed.current) cacheTried.current = false;
          }}
          onError={(event) => {
            const n = event.nativeEvent;
            onLoadFail(`onError ${n.code} ${n.description} ${n.url}`);
          }}
          onHttpError={(event) => {
            const n = event.nativeEvent;
            if (n.statusCode >= 400 && isMainEdition(n.url)) {
              onLoadFail(`http ${n.statusCode} ${n.url} ${n.description}`);
            }
          }}
          onRenderProcessGone={(event) => {
            onLoadFail(`render process gone didCrash=${event.nativeEvent.didCrash}`);
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
