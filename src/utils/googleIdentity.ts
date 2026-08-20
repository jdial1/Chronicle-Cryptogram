type CredentialResponse = {
  credential?: string;
};

type GoogleAccountsId = {
  initialize: (config: {
    client_id: string;
    callback: (response: CredentialResponse) => void;
    use_fedcm_for_button?: boolean;
    auto_select?: boolean;
    button_auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
  }) => void;
  renderButton: (
    parent: HTMLElement,
    options: {
      type?: string;
      theme?: string;
      size?: string;
      text?: string;
      shape?: string;
      width?: number;
      logo_alignment?: string;
    }
  ) => void;
};

type GoogleWindow = Window & {
  google?: { accounts?: { id?: GoogleAccountsId } };
};

export const GOOGLE_WEB_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID ||
  '647414230767-coj2nt4mk2ok8rf919gh108502qtptup.apps.googleusercontent.com';

type TokenHandler = (idToken: string) => void;

let tokenHandler: TokenHandler | null = null;
let gisReady: Promise<GoogleAccountsId> | null = null;
let initialized = false;

export function onGoogleIdToken(handler: TokenHandler | null) {
  tokenHandler = handler;
}

function loadGis() {
  if (gisReady) return gisReady;
  gisReady = new Promise((resolve, reject) => {
    const existing = (window as GoogleWindow).google?.accounts?.id;
    if (existing) {
      resolve(existing);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => {
      const api = (window as GoogleWindow).google?.accounts?.id;
      if (!api) {
        reject(new Error('Google Identity Services failed to load'));
        return;
      }
      resolve(api);
    };
    script.onerror = () => reject(new Error('Google Identity Services failed to load'));
    document.head.appendChild(script);
  });
  return gisReady;
}

export async function ensureGoogleIdentity() {
  const api = await loadGis();
  if (initialized) return api;
  api.initialize({
    client_id: GOOGLE_WEB_CLIENT_ID,
    callback: (response) => {
      if (response.credential) tokenHandler?.(response.credential);
    },
    use_fedcm_for_button: true,
    auto_select: false,
    button_auto_select: false,
    cancel_on_tap_outside: true,
  });
  initialized = true;
  return api;
}

export async function renderGoogleButton(host: HTMLElement, full: boolean) {
  const api = await ensureGoogleIdentity();
  const paint = () => {
    const width = full
      ? Math.max(240, Math.floor(host.getBoundingClientRect().width) || 320)
      : 212;
    host.replaceChildren();
    api.renderButton(host, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      shape: 'rectangular',
      width,
      logo_alignment: 'left',
    });
  };
  paint();
}
