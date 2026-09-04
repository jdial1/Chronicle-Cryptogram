import data from './cipherTactics.json';

export type CipherTactic = {
  id: string;
  title: string;
  summary: string;
  points: { lead: string; body: string }[];
};

export const CIPHER_INTRO: string = data.intro;
export const CIPHER_TOOLS: { lead: string; body: string }[] = data.tools;
export const CIPHER_TACTICS: CipherTactic[] = data.tactics;
