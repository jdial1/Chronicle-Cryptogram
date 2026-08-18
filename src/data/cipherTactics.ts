export type CipherTactic = {
  id: string;
  title: string;
  summary: string;
  points: string[];
};

export const CIPHER_INTRO =
  'Cryptograms are substitution ciphers: each letter in a quote is replaced by a different letter. Breaking them does not take a math background. It is pattern recognition in English.';

export const CIPHER_TACTICS: CipherTactic[] = [
  {
    id: 'singles',
    title: 'Attack the Single-Letter Words First',
    summary: 'English has only two common one-letter words: A and I.',
    points: [
      'A standalone glyph is a 50/50 between A and I.',
      'O appears as a word in poetry (O Romeo), but A and I cover nearly every standard puzzle.',
      'If that single letter opens the sentence, it is frequently I.',
    ],
  },
  {
    id: 'frequency',
    title: 'Hunt for the Most Frequent Letters',
    summary: 'The letters that dominate English are E, T, A, O, I, N, S, H, R, D, L, and U.',
    points: [
      'Count which glyphs appear most often. The leader is very likely E or T.',
      'A glyph that shows up once or twice is probably a rare letter: Z, Q, X, J, or K.',
      'On the Morning Edition each plaintext letter uses one glyph, so counting works. The Night Extra splits common letters across several glyphs.',
    ],
  },
  {
    id: 'short-words',
    title: 'Spot Common Two- and Three-Letter Words',
    summary: 'Short words are the mortar between nouns and verbs, and only a few are common.',
    points: [
      'Two-letter words: OF, TO, IN, IT, IS, BE, AS, AT, SO, WE, HE, BY, OR, ON, DO, IF, ME, MY, UP.',
      'Three-letter words: THE is the most common, then AND, FOR, WAS, HIS, NOT.',
      'If a frequent three-letter word starts with a letter you already think is I or A, you may be looking at THE or AND.',
    ],
  },
  {
    id: 'apostrophes',
    title: 'Look for Apostrophes',
    summary: 'An apostrophe sharply limits which letters can follow it.',
    points: [
      'One letter after an apostrophe is almost always S, T, D, or M (IT\'S, CAN\'T, YOU\'D, I\'M).',
      'Two letters after an apostrophe are usually RE, VE, or LL (THEY\'RE, WE\'VE, YOU\'LL).',
      'If the word ends in N\'T, you have just solved N and T.',
    ],
  },
  {
    id: 'doubles',
    title: 'Identify Double Letters',
    summary: 'Twin glyphs give away the shape of a word.',
    points: [
      'Common double consonants: LL, SS, TT, FF, RR, NN, PP, CC.',
      'Common double vowels: EE and OO.',
      'At the end of a word, doubles are often LL or SS. In the middle of a short word, they are often EE or OO (SEEN, GOOD).',
    ],
  },
];
