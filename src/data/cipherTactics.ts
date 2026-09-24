import data from './cipherTactics.json';

export type CipherTactic = {
  id: string;
  title: string;
  summary: string;
  points: { lead: string; body: string }[];
  /** The letters the Primer confirms together when this tell is spotted. */
  primerConfirms: string[];
};

export const CIPHER_INTRO: string = data.intro;
export const CIPHER_TOOLS: { lead: string; body: string }[] = data.tools;
export const CIPHER_TACTICS: CipherTactic[] = data.tactics;
/** The Bureau's promise of a fair page, stated in the Handbook. */
export const FAIR_PLAY_CHARTER = data.charter;
/** The orders that arrive before the first Night Extra. */
export const NIGHT_MEMO: { title: string; body: string } = data.nightMemo;
