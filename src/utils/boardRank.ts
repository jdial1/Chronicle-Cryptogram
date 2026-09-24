/**
 * How the Bureau board orders filed times: least help first, then fastest.
 *
 * A clean solve outranks a quick one. The measure of a solve is how little the
 * agent needed from the Bureau, and speed only breaks ties between agents who
 * needed the same. Android's `Standings` orders by the same two keys, and the
 * Firestore query (`helpUsed`, then `timeSeconds`) returns the rows in this order.
 */
export interface Filing {
  hintsUsed: number;
  checksUsed: number;
  timeSeconds: number;
}

export const helpUsed = (filing: Pick<Filing, 'hintsUsed' | 'checksUsed'>) =>
  filing.hintsUsed + filing.checksUsed;

export function compareFilings(a: Filing, b: Filing): number {
  return helpUsed(a) - helpUsed(b) || a.timeSeconds - b.timeSeconds;
}

/** A new filing replaces the agent's old one only when it would rank higher. */
export const isBetterFiling = (next: Filing, existing: Filing) => compareFilings(next, existing) < 0;
