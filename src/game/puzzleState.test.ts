import { beforeEach, describe, expect, it } from 'vitest';
import { INITIAL_PUZZLES } from '../data/puzzles';
import { isMorningEdition, isPrimerPuzzle } from '../utils/edition';
import { writeSolvedPuzzleIds } from '../utils/localStore';
import {
  decodedMappings,
  decodedMappingsFromPuzzle,
  gateCloudHydrate,
  getInitialPuzzle,
  liveFlaggedIds,
  withHintedMappings,
} from './puzzleState';

const mem = new Map<string, string>();

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (key: string) => mem.get(key) ?? null,
    setItem: (key: string, value: string) => {
      mem.set(key, value);
    },
    removeItem: (key: string) => {
      mem.delete(key);
    },
    get length() {
      return mem.size;
    },
    key: (i: number) => [...mem.keys()][i] ?? null,
  },
});

const primer = INITIAL_PUZZLES.find((puzzle) => isPrimerPuzzle(puzzle) && isMorningEdition(puzzle));

beforeEach(() => {
  mem.clear();
});

describe('decodedMappings', () => {
  it('copies symbol targets', () => {
    expect(decodedMappings([{ symbolId: 'a', targetLetter: 'T' }])).toEqual({ a: 'T' });
  });
});

describe('withHintedMappings', () => {
  it('fills hinted marks from the decoded alphabet', () => {
    if (!primer) throw new Error('missing primer');
    const decoded = decodedMappingsFromPuzzle(primer);
    const [symbolId, letter] = Object.entries(decoded)[0];
    const next = withHintedMappings(primer, {}, [symbolId]);
    expect(next[symbolId]).toBe(letter);
  });
});

describe('liveFlaggedIds', () => {
  it('keeps a wrong unlocked mapping and drops a locked one', () => {
    if (!primer) throw new Error('missing primer');
    const decoded = decodedMappingsFromPuzzle(primer);
    const [symbolId, letter] = Object.entries(decoded)[0];
    const wrong = letter === 'A' ? 'B' : 'A';
    expect(liveFlaggedIds(primer, { [symbolId]: wrong }, [symbolId], [])).toEqual([symbolId]);
    expect(liveFlaggedIds(primer, { [symbolId]: wrong }, [symbolId], [symbolId])).toEqual([]);
  });
});

describe('gateCloudHydrate', () => {
  it('keeps live mappings when the board is dirty', () => {
    const incoming = { mappings: { a: 'C' }, timerSeconds: 12, hintsUsed: 1 };
    const current = { mappings: { a: 'T' }, timerSeconds: 4 };
    expect(gateCloudHydrate(true, incoming, current).mappings).toEqual({ a: 'T' });
    expect(gateCloudHydrate(false, incoming, current).mappings).toEqual({ a: 'C' });
  });
});

describe('getInitialPuzzle', () => {
  it('opens the unsolved primer first', () => {
    if (!primer) throw new Error('missing primer');
    expect(getInitialPuzzle().id).toBe(primer.id);
  });

  it('leaves the primer once it is solved', () => {
    if (!primer) throw new Error('missing primer');
    writeSolvedPuzzleIds([primer.id]);
    expect(getInitialPuzzle().id).not.toBe(primer.id);
  });
});
