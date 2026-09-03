export type CipherTactic = {
  id: string;
  title: string;
  summary: string;
  points: { lead: string; body: string }[];
};

export const CIPHER_INTRO =
  'Each mark stands for one letter. You break a cipher the way you break a case: wait for the tell, then press. No mathematics. Just English, black coffee, and a sharp eye.';

export const CIPHER_TOOLS: { lead: string; body: string }[] = [
  { lead: 'Smaller Type', body: 'Shrink the cipher tiles when the quote is crowding the page.' },
  { lead: 'Larger Type', body: 'Magnify the tiles when a glyph is hard to read.' },
  { lead: 'Check Letter', body: 'Test the highlighted guess. A correct letter locks in; a wrong one takes the red circle. Three checks per edition, shared by the morning and night extras; the count sits on the quill.' },
  { lead: 'Hint', body: 'Reveal the highlighted glyph. Select an unsolved letter first. Three hints per edition, shared by the morning and night extras; the count sits on the bulb.' },
  { lead: 'Glyph Tally', body: 'Open a count of repeating glyphs, busiest first. English leans on E, T, A, O, I, N.' },
  { lead: 'Clear Letters', body: 'Wipe every guess and start the quote over. The timer keeps running.' },
];

export const CIPHER_TACTICS: CipherTactic[] = [
  {
    id: 'singles',
    title: 'Attack the Single-Letter Words First',
    summary: 'English has only two common one-letter words: A and I.',
    points: [
      { lead: 'The Odds', body: 'A standalone glyph is a 50/50 between A and I.' },
      { lead: 'Single Letters', body: 'A and I cover nearly every puzzle. O appears as a word in poetry, but rarely here.' },
      { lead: 'Sentence Openers', body: 'If that single letter opens the sentence, it is frequently I.' },
      { lead: 'By Edition', body: 'Morning keeps A as one glyph. Night Extra splits A across two, so a second one-letter word with a different mark can still be A.' },
    ],
  },
  {
    id: 'frequency',
    title: 'Hunt for the Most Frequent Letters',
    summary: 'The letters that dominate English are E, T, A, O, I, N, S, H, R, D, L, and U.',
    points: [
      { lead: 'Count Glyphs', body: 'The leader is very likely E or T.' },
      { lead: 'Rare Marks', body: 'A glyph that shows up once or twice is probably Z, Q, X, J, or K.' },
      { lead: 'By Edition', body: 'Morning Edition uses one glyph per letter, so counting works. Night Extra gives E, T, and A two glyphs each; every other letter stays one-to-one. The busiest marks are still E or T, just split across a pair.' },
    ],
  },
  {
    id: 'short-words',
    title: 'Spot Common Two- and Three-Letter Words',
    summary: 'Short words are the mortar between nouns and verbs, and only a few are common.',
    points: [
      { lead: 'Two Letters', body: 'OF, TO, IN, IT, IS, BE, AS, AT, SO, WE, HE, BY, OR, ON, DO, IF, ME, MY, UP.' },
      { lead: 'Three Letters', body: 'THE is the most common, then AND, FOR, WAS, HIS, NOT.' },
      { lead: 'Cross-Check', body: 'If a frequent three-letter word starts with a letter you already think is I or A, you may be looking at THE or AND.' },
      { lead: 'By Edition', body: 'Night Extra splits T and E, so THE can show up as two glyph patterns that share the same middle mark for H.' },
    ],
  },
  {
    id: 'apostrophes',
    title: 'Look for Apostrophes',
    summary: 'An apostrophe sharply limits which letters can follow it.',
    points: [
      { lead: 'One After', body: "Almost always S, T, D, or M (IT'S, CAN'T, YOU'D, I'M)." },
      { lead: 'Two After', body: "Usually RE, VE, or LL (THEY'RE, WE'VE, YOU'LL)." },
      { lead: "The N'T Tell", body: "If the word ends in N'T, you have just solved N and T." },
      { lead: 'By Edition', body: "N'T still solves N on both editions. Night Extra splits T, so the mark after the apostrophe is only one of the two T glyphs." },
    ],
  },
  {
    id: 'doubles',
    title: 'Identify Double Letters',
    summary: 'Twin glyphs give away the shape of a word.',
    points: [
      { lead: 'Consonants', body: 'LL, SS, TT, FF, RR, NN, PP, CC.' },
      { lead: 'Vowels', body: 'EE and OO.' },
      { lead: 'Position', body: 'At the end of a word, often LL or SS. In the middle of a short word, often EE or OO (SEEN, GOOD).' },
      { lead: 'By Edition', body: 'Morning doubles always match. Night Extra splits E and T, so EE and TT may look like two marks. OO, LL, and SS still pair.' },
    ],
  },
];
