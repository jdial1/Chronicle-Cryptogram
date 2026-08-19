import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import {
  BackHandler,
  Platform,
  Pressable,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import {
  GoogleSignin,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';
import { WebView, type WebViewMessageEvent, type WebViewNavigation } from 'react-native-webview';

SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const extra = Constants.expoConfig?.extra as
  | { webUrl?: string; googleWebClientId?: string }
  | undefined;

const WEB_URL = extra?.webUrl ?? 'https://jdial1.github.io/Chronicle-Cryptogram/';
const GOOGLE_WEB_CLIENT_ID =
  extra?.googleWebClientId ??
  '647414230767-coj2nt4mk2ok8rf919gh108502qtptup.apps.googleusercontent.com';
const PAPER = '#fbf7ee';
const INK = '#1c1917';

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

export default function App() {
  const webRef = useRef<WebView>(null);
  const canGoBack = useRef(false);
  const signingIn = useRef(false);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });
  }, []);

  useEffect(() => {
    const hide = setTimeout(() => {
      SplashScreen.hideAsync();
    }, 8000);
    return () => clearTimeout(hide);
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack.current) {
        webRef.current?.goBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, []);

  const hideSplash = useCallback(() => {
    SplashScreen.hideAsync();
  }, []);

  const retry = useCallback(() => {
    setFailed(false);
    setReloadKey((n) => n + 1);
  }, []);

  const ensureDeliveryChannel = useCallback(async () => {
    if (Platform.OS !== 'android') return;
    await Notifications.setNotificationChannelAsync('delivery', {
      name: 'Paper delivery',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }, []);

  const subscribeDelivery = useCallback(async () => {
    await ensureDeliveryChannel();
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      injectEvent(webRef, 'chronicle-native-delivery', { subscribed: false, blocked: true });
      return;
    }
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Chronicle Cryptogram',
        body: "The new paper has arrived! Uncover today's mystery.",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 8,
        minute: 0,
        channelId: 'delivery',
      },
    });
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Chronicle Cryptogram',
        body: 'You are on the delivery list. We will ring when a new edition is on the stands.',
      },
      trigger: { channelId: 'delivery' },
    });
    injectEvent(webRef, 'chronicle-native-delivery', { subscribed: true, blocked: false });
  }, [ensureDeliveryChannel]);

  const unsubscribeDelivery = useCallback(async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    injectEvent(webRef, 'chronicle-native-delivery', { subscribed: false, blocked: false });
  }, []);

  const nativeSignIn = useCallback(async () => {
    if (signingIn.current) return;
    signingIn.current = true;
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();
      if (!isSuccessResponse(response) || !response.data.idToken) {
        injectEvent(webRef, 'chronicle-native-auth', {
          type: 'ERROR',
          message: 'Sign-in cancelled',
        });
        return;
      }
      injectEvent(webRef, 'chronicle-native-auth', {
        type: 'ID_TOKEN',
        idToken: response.data.idToken,
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
      await GoogleSignin.signOut();
    } catch {
      await GoogleSignin.revokeAccess();
    }
  }, []);

  const onMessage = useCallback(
    (event: WebViewMessageEvent) => {
      let payload: { type?: string };
      try {
        payload = JSON.parse(event.nativeEvent.data);
      } catch {
        return;
      }
      if (payload.type === 'GOOGLE_SIGN_IN') nativeSignIn();
      if (payload.type === 'GOOGLE_SIGN_OUT') nativeSignOut();
      if (payload.type === 'DELIVERY_SUBSCRIBE') subscribeDelivery();
      if (payload.type === 'DELIVERY_UNSUBSCRIBE') unsubscribeDelivery();
    },
    [nativeSignIn, nativeSignOut, subscribeDelivery, unsubscribeDelivery]
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
      <View style={styles.fail}>
        <StatusBar style="dark" />
        <Text style={styles.failKicker}>The wire is down</Text>
        <Text style={styles.failBody}>
          Chronicle Cryptogram could not reach the morning edition. Check the connection and try
          again.
        </Text>
        <Pressable onPress={retry} style={styles.retry}>
          <Text style={styles.retryLabel}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <WebView
        key={reloadKey}
        ref={webRef}
        source={{ uri: SOURCE_URI }}
        style={styles.web}
        injectedJavaScriptBeforeContentLoaded={INJECTED}
        injectedJavaScript={INJECTED}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        setSupportMultipleWindows={false}
        onShouldStartLoadWithRequest={(request) => !isAuthUrl(request.url)}
        onMessage={onMessage}
        onNavigationStateChange={onNav}
        onLoadEnd={hideSplash}
        onError={() => {
          hideSplash();
          setFailed(true);
        }}
        onHttpError={(event) => {
          if (event.nativeEvent.statusCode >= 500) {
            hideSplash();
            setFailed(true);
          }
        }}
        allowsBackForwardNavigationGestures={false}
        overScrollMode="never"
        nestedScrollEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PAPER,
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight ?? 0 : 0,
  },
  web: {
    flex: 1,
    backgroundColor: PAPER,
  },
  fail: {
    flex: 1,
    backgroundColor: PAPER,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  failKicker: {
    fontSize: 22,
    fontWeight: '800',
    color: INK,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  failBody: {
    fontSize: 16,
    lineHeight: 24,
    color: INK,
    textAlign: 'center',
  },
  retry: {
    marginTop: 8,
    borderWidth: 2,
    borderColor: INK,
    paddingHorizontal: 28,
    paddingVertical: 10,
  },
  retryLabel: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: INK,
  },
});
