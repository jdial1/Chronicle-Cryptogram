export type DeskLayer = 'storage' | 'cloud' | 'auth' | 'render';

export const STORAGE_JAMMED =
  'The desk drawer is jammed. Free some space and the cipher will file again.';
export class DeskError extends Error {
  readonly layer: DeskLayer;
  readonly code: string;
  readonly userMessage: string;
  override readonly cause?: unknown;

  constructor(opts: { layer: DeskLayer; code: string; userMessage: string; cause?: unknown }) {
    super(opts.userMessage);
    this.name = 'DeskError';
    this.layer = opts.layer;
    this.code = opts.code;
    this.userMessage = opts.userMessage;
    this.cause = opts.cause;
  }
}

export function firebaseCode(err: unknown): string {
  if (err instanceof DeskError) return err.code;
  if (err && typeof err === 'object' && 'code' in err) return String(err.code);
  return '';
}

const USER_COPY: Record<string, string> = {
  'auth/popup-closed-by-user': 'Sign-in was cancelled.',
  'auth/cancelled-popup-request': 'Sign-in was cancelled.',
  'auth/network-request-failed': 'The wire is down. Try again when the desk is online.',
  'auth/too-many-requests': 'Too many attempts. Wait a beat.',
  'auth/user-disabled': 'These credentials are no longer in service.',
  'auth/invalid-credential': 'Those credentials did not take.',
  'auth/invalid-id-token': 'Those credentials did not take.',
  'auth/unauthorized-domain': 'This desk is not cleared for sign-in.',
  'auth/operation-not-allowed': 'Sign-in is not open on this desk.',
  'permission-denied': 'The bureau would not take that request.',
  unavailable: 'The wire is down. Try again when the desk is online.',
};

export function toUserMessage(err: unknown, fallback: string): string {
  if (err instanceof DeskError) return err.userMessage;
  const code = firebaseCode(err);
  if (code && USER_COPY[code]) return USER_COPY[code];
  if (code) return fallback;
  if (err instanceof Error && err.message && !err.message.includes('/')) return err.message;
  return fallback;
}

export function logDesk(label: string, err: unknown): void {
  if (import.meta.env.DEV) console.warn(`[desk:${label}]`, err);
}

export function reportDesk(err: unknown, label = 'desk'): void {
  logDesk(label, err);
}

export function forgetCloud(promise: Promise<unknown>, label: string): void {
  void promise.catch((err) => reportDesk(err, label));
}