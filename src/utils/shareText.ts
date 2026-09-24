import { formatTime } from './formatTime';

/**
 * Where a shared solve should send a reader. Deliberately not window.location.href:
 * in the bundled Android build that is the WebViewAssetLoader path, and even on the
 * web it carries the ?source=android query the shell appends.
 */
export const SHARE_URL = 'https://jdial1.github.io/Chronicle-Cryptogram/';

/**
 * What the agent needed from the Bureau, as the receipt prints it.
 *
 * Help, not accuracy: a solve only fires once every mark is right, so accuracy
 * always read 100% and said nothing. Hints and checks are the two things a solve
 * can differ by, and a clean solve is the one worth posting.
 */
export function helpLine(hintsUsed: number, checksUsed: number): string {
  if (hintsUsed === 0 && checksUsed === 0) return 'Clean — no hints, no checks';
  return `Hints ${hintsUsed} · Checks ${checksUsed}`;
}

/**
 * The card a player posts. Byte-identical to Android's `Solve.shareText`, which
 * pins the same string, so one solve reads the same from either surface.
 */
export function solveShareText(solve: {
  editionNumber: number;
  headline: string;
  timerSeconds: number;
  hintsUsed: number;
  checksUsed: number;
}): string {
  return [
    `📰 CHRONICLE CRYPTOGRAM — EDITION #${solve.editionNumber}`,
    `🔍 Solved: "${solve.headline}"`,
    `⏱️ Time: ${formatTime(solve.timerSeconds)}`,
    `🔎 ${helpLine(solve.hintsUsed, solve.checksUsed)}`,
    `Play Chronicle Cryptogram: ${SHARE_URL}`,
  ].join('\n');
}
