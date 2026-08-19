type AndroidWindow = Window & {
  __CHRONICLE_ANDROID_APP__?: boolean;
  ReactNativeWebView?: { postMessage: (message: string) => void };
};

export function isAndroidAppShell() {
  if (typeof window === 'undefined') return false;
  const w = window as AndroidWindow;
  if (w.ReactNativeWebView) return true;
  if (w.__CHRONICLE_ANDROID_APP__) return true;
  return new URLSearchParams(window.location.search).get('source') === 'android';
}

export function postToAndroidApp(payload: Record<string, unknown>) {
  const w = window as AndroidWindow;
  w.ReactNativeWebView?.postMessage(JSON.stringify(payload));
}
