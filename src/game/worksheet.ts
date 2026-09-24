import type { CryptogramWord, SymbolMapping } from '../types';

/**
 * Two more counts for the glyph tally, after the period's frequency-and-contact
 * worksheets (docs/SOUL-FEATURES.md, idea 33): how often a glyph starts a word, and
 * how often it sits doubled inside one. Counts of what is visible on the board and
 * nothing more; the tally never suggests a letter. Android's `BoardState.tally`
 * counts the same way.
 */
export function worksheetCounts(words: CryptogramWord[]): Record<string, { starts: number; doubled: number }> {
  const counts: Record<string, { starts: number; doubled: number }> = {};
  const at = (symbolId: string) => (counts[symbolId] ??= { starts: 0, doubled: 0 });
  for (const word of words) {
    const first = word.symbols.find((symbol) => !symbol.isPunctuation);
    if (first) at(first.symbolId).starts += 1;
    for (let i = 1; i < word.symbols.length; i += 1) {
      const [before, here] = [word.symbols[i - 1], word.symbols[i]];
      if (!before.isPunctuation && !here.isPunctuation && before.symbolId === here.symbolId) {
        at(here.symbolId).doubled += 1;
      }
    }
  }
  return counts;
}

/**
 * The Primer's tells confirm in sets (idea 30, after *Chants of Sennaar*): a tell is
 * spotted only when every glyph of every letter it covers carries that letter, so no
 * single mark is ever confirmed on its own.
 */
export function lettersSolved(words: CryptogramWord[], mappings: SymbolMapping, letters: string[]): boolean {
  return letters.every((letter) => {
    const glyphs = words.flatMap((word) =>
      word.symbols.filter((symbol) => !symbol.isPunctuation && symbol.targetLetter === letter)
    );
    return glyphs.length > 0 && glyphs.every((symbol) => mappings[symbol.symbolId] === letter);
  });
}
