import { useMemo } from 'react';
import type { PuzzleData, PuzzleProgress, SymbolMapping } from '../types';
import { cipherForPuzzle } from '../game/puzzleState';
import { calculateSymbolFrequencies } from '../utils/cipherEngine';

export function usePuzzleSession(currentPuzzle: PuzzleData, mappings: SymbolMapping) {
  const cipher = useMemo(() => cipherForPuzzle(currentPuzzle), [currentPuzzle]);
  const uniqueSymbols = useMemo(() => {
    const syms: { symbolId: string; targetLetter: string }[] = [];
    const seen = new Set<string>();
    cipher.words.forEach((w) => {
      w.symbols.forEach((s) => {
        if (!s.isPunctuation && !seen.has(s.symbolId)) {
          seen.add(s.symbolId);
          syms.push({ symbolId: s.symbolId, targetLetter: s.targetLetter });
        }
      });
    });
    return syms;
  }, [cipher.words]);
  const symbolFrequencies = useMemo(() => {
    return calculateSymbolFrequencies(cipher.words, cipher.alphabet).map((f) => ({
      ...f,
      mappedLetter: mappings[f.symbolId] || '',
    }));
  }, [cipher.words, cipher.alphabet, mappings]);
  return {
    cipherAlphabet: cipher.alphabet,
    words: cipher.words,
    uniqueSymbols,
    symbolFrequencies,
  };
}

export function snapshotBoard(progress: PuzzleProgress): PuzzleProgress {
  return progress;
}
