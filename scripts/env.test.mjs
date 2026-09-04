import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadEnvFile } from './env.mjs';

/**
 * These run on Linux CI, which is exactly the problem: a .env authored on Windows is
 * CRLF, and the loader silently parsed nothing. The build then refused to start with
 * "VITE_FIREBASE_API_KEY is empty" while the file sat there fully populated.
 */
describe('loadEnvFile', () => {
  let dir;
  const KEYS = ['T_CRLF', 'T_LF', 'T_QUOTED', 'T_SINGLE', 'T_BARE', 'T_PRESET', 'T_HASH'];

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'envtest-'));
    for (const k of KEYS) delete process.env[k];
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
    for (const k of KEYS) delete process.env[k];
  });

  const write = (body) => {
    const p = join(dir, '.env');
    writeFileSync(p, body);
    return p;
  };

  it('reads CRLF files, as written by a Windows editor', () => {
    loadEnvFile(write('T_CRLF="yes"\r\nT_BARE=plain\r\n'));
    expect(process.env.T_CRLF).toBe('yes');
    expect(process.env.T_BARE).toBe('plain');
  });

  it('still reads LF files', () => {
    loadEnvFile(write('T_LF="yes"\n'));
    expect(process.env.T_LF).toBe('yes');
  });

  it('strips both quote styles and leaves bare values alone', () => {
    loadEnvFile(write('T_QUOTED="d"\r\nT_SINGLE=\'s\'\r\nT_BARE=b\r\n'));
    expect(process.env.T_QUOTED).toBe('d');
    expect(process.env.T_SINGLE).toBe('s');
    expect(process.env.T_BARE).toBe('b');
  });

  it('never clobbers an already-set var, so CI secrets win over a stray .env', () => {
    process.env.T_PRESET = 'from-ci';
    loadEnvFile(write('T_PRESET=from-file\r\n'));
    expect(process.env.T_PRESET).toBe('from-ci');
  });

  it('skips comments', () => {
    loadEnvFile(write('# T_HASH=nope\r\n'));
    expect(process.env.T_HASH).toBeUndefined();
  });

  it('is a no-op when the file is absent', () => {
    expect(() => loadEnvFile(join(dir, 'nope.env'))).not.toThrow();
  });
});
