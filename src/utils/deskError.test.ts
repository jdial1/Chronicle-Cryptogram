import { describe, expect, it } from 'vitest';
import { DeskError, STORAGE_JAMMED, forgetCloud, logDesk, toUserMessage } from './deskError';

describe('toUserMessage', () => {
  it('maps known firebase codes to paper copy', () => {
    expect(toUserMessage({ code: 'auth/network-request-failed' }, 'Sign-in failed')).toBe(
      'The wire is down. Try again when the desk is online.'
    );
  });

  it('never returns a raw firebase code', () => {
    expect(toUserMessage({ code: 'auth/internal-error' }, 'Sign-in failed')).toBe('Sign-in failed');
  });

  it('uses a plain Error message when there is no code', () => {
    expect(toUserMessage(new Error('Desk jammed'), 'fallback')).toBe('Desk jammed');
  });

  it('falls back when the value is unknown', () => {
    expect(toUserMessage(null, 'Sign-in failed')).toBe('Sign-in failed');
  });
});

describe('DeskError', () => {
  it('carries layer, code, and user copy', () => {
    const err = new DeskError({ layer: 'storage', code: 'storage/quota', userMessage: STORAGE_JAMMED });
    expect(err.layer).toBe('storage');
    expect(toUserMessage(err, 'fallback')).toBe(STORAGE_JAMMED);
  });
});

describe('logDesk', () => {
  it('always writes console.error so production logcat can see it', () => {
    const error = console.error;
    const calls: unknown[][] = [];
    console.error = (...args) => {
      calls.push(args);
    };
    try {
      logDesk('render', new Error('jam'));
      expect(calls[0]?.[0]).toBe('[desk:render]');
    } finally {
      console.error = error;
    }
  });
});
  it('does not throw when the promise rejects', async () => {
    const error = console.error;
    console.error = () => undefined;
    try {
      expect(() => forgetCloud(Promise.reject(new Error('offline')), 'test')).not.toThrow();
      await Promise.resolve();
    } finally {
      console.error = error;
    }
  });
});
