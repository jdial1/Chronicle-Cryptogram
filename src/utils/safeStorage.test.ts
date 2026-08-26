import { describe, expect, it } from 'vitest';
import { storageGet, storageGetJSON, storageSet } from './safeStorage';

const mem = new Map<string, string>();

Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (key: string) => mem.get(key) ?? null,
    setItem: (key: string, value: string) => {
      mem.set(key, value);
    },
    removeItem: (key: string) => {
      mem.delete(key);
    },
  },
});

describe('safeStorage', () => {
  it('round-trips JSON', () => {
    expect(storageSet('desk-test', '{"ok":1}')).toBe(true);
    expect(storageGet('desk-test')).toBe('{"ok":1}');
    expect(storageGetJSON<{ ok: number }>('desk-test')).toEqual({ ok: 1 });
  });
});
