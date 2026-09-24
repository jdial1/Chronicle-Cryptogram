import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * The Bureau prints; it does not certify (docs/VOICE.md). This used to be pinned on
 * the leaderboard alone, and the clipping screen shipped "CERTIFIED" and "OFFICIALLY
 * DECRYPTED" right past it. So every component's copy is judged, not one file's.
 *
 * Only shipped copy counts: string literals and JSX text, with comments stripped.
 * Identifiers are code, and `verifiedSymbolIds` (marks a check confirmed) is not a
 * claim made to the player.
 */
const dir = new URL('./', import.meta.url);
const components = readdirSync(dir).filter((name) => name.endsWith('.tsx'));

function shippedCopy(source: string): string {
  const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
  const literals = [...code.matchAll(/(['"`])((?:\\.|(?!\1)[^\\\n])*)\1/g)].map((m) => m[2]);
  const jsxText = [...code.matchAll(/>([^<>{}]+)</g)].map((m) => m[1]);
  return [...literals, ...jsxText].join('\n');
}

describe('component copy', () => {
  it('finds the components it is meant to judge', () => {
    expect(components).toContain('LeaderboardModal.tsx');
    expect(components).toContain('TodayStatsBulletin.tsx');
  });

  it.each(components)('%s never claims the Bureau verified, certified or made anything official', (name) => {
    const copy = shippedCopy(readFileSync(new URL(name, dir), 'utf8'));
    expect(copy.match(/verif|certif|official/gi) ?? []).toEqual([]);
  });
});
