import { PuzzleData } from '../types';
import { isMorningEdition, isNightEdition } from '../utils/edition';

export type CaseSlot = 'Morning' | 'Evening';
export type CaseCharacterId =
  | 'thorne'
  | 'beatrice'
  | 'clara'
  | 'sterling'
  | 'archibald'
  | 'blackwood'
  | 'reginald';

export type CasePart =
  | { kind: 'text'; value: string; when?: CaseSlot }
  | { kind: 'quote'; slot: CaseSlot };

export type CaseFragment = {
  characterId: CaseCharacterId;
  editionNumber: number;
  title: string;
  parts: CasePart[];
};

export type CaseNoteSegment = { kind: 'text' | 'quote'; value: string };

export type AssembledFragment = {
  characterId: CaseCharacterId;
  editionNumber: number;
  title: string;
  segments: CaseNoteSegment[];
};

export const CASE_CHARACTERS: {
  id: CaseCharacterId;
  name: string;
  dossier: string;
  file: string;
  plate: string;
}[] = [
  { id: 'thorne', name: 'Detective Elias Thorne', dossier: 'Lead investigator', file: 'Thorne', plate: 'c1' },
  { id: 'beatrice', name: 'Beatrice Vance', dossier: 'The widow', file: 'Beatrice', plate: 'c2' },
  { id: 'clara', name: 'Clara Vance', dossier: 'The missing heir', file: 'Clara', plate: 'c3' },
  { id: 'sterling', name: 'Arthur Sterling', dossier: 'The partner', file: 'Sterling', plate: 'c4' },
  { id: 'archibald', name: 'Archibald Vance', dossier: 'The victim', file: 'Archibald', plate: 'c5' },
  { id: 'blackwood', name: 'Dr. Aris Blackwood', dossier: 'The physician', file: 'Blackwood', plate: 'c6' },
  { id: 'reginald', name: 'Reginald', dossier: 'The butler', file: 'Reginald', plate: 'c7' },
];

function t(value: string, when?: CaseSlot): CasePart {
  return when ? { kind: 'text', value, when } : { kind: 'text', value };
}

function q(slot: CaseSlot): CasePart {
  return { kind: 'quote', slot };
}

export const CASE_FRAGMENTS: CaseFragment[] = [
  {
    characterId: 'thorne',
    editionNumber: 1,
    title: 'The Detective',
    parts: [
      t('NYPD detective assigned to the Vance Estate. '),
      t('The initial sweep proves ', 'Morning'),
      q('Morning'),
      t(' Archibald knew too much about the smuggling ring.', 'Morning'),
      t(' The night extra confirms ', 'Evening'),
      q('Evening'),
      t(" I'm going to find out who did it."),
    ],
  },
  {
    characterId: 'thorne',
    editionNumber: 6,
    title: 'The Bloodhound',
    parts: [
      t('Four hours north on a sleeper. I clocked him as an upstate jailer, not a gala guest. Relentless on the trail. '),
      q('Morning'),
      t(' I am willing to ride sleepless trains to Albany to chase down a single ticket stub to find her.', 'Morning'),
    ],
  },
  {
    characterId: 'thorne',
    editionNumber: 16,
    title: 'The Lone Wolf',
    parts: [
      t("The Mayor is out and I cannot trust my own Chief. He sprung the butler. I filed it: ", 'Morning'),
      q('Morning'),
      t(' I officially burn my bridges and go rogue.', 'Morning'),
    ],
  },
  {
    characterId: 'thorne',
    editionNumber: 17,
    title: 'The Executioner',
    parts: [
      t("Crossed the ultimate line to save Clara's life. "),
      q('Morning'),
      t(' I am the one who pulled the trigger.', 'Morning'),
    ],
  },
  {
    characterId: 'thorne',
    editionNumber: 24,
    title: 'The Tactician',
    parts: [
      t('I did not invent the climax. I struck a match the old man left on Pier 84. Rather than calling for backup I wrote: '),
      q('Morning'),
      t('.', 'Morning'),
    ],
  },
  {
    characterId: 'thorne',
    editionNumber: 30,
    title: 'The Civilian',
    parts: [
      t('Left my tarnished badge on a diner counter. '),
      t("Clara's parting cipher read: ", 'Morning'),
      q('Morning'),
      t('. ', 'Morning'),
      t('The last envelope named her vanishing act: ', 'Evening'),
      q('Evening'),
      t('. ', 'Evening'),
      t("The city isn't honest, but I made it safe for one more night."),
    ],
  },
  {
    characterId: 'beatrice',
    editionNumber: 2,
    title: 'The Cold Widow',
    parts: [
      t("The grieving act is a sham. She was not hiding an affair. He left the revocation on the study desk for her to steal. She burned it, thinking that would keep the fleet in syndicate hands forever. "),
      q('Morning'),
      t(' That sent her hunting the library for the compartment behind the red sailboat.', 'Morning'),
      q('Evening'),
    ],
  },
  {
    characterId: 'beatrice',
    editionNumber: 5,
    title: 'The Extortionist',
    parts: [
      t("Intercepted wires prove she is shaking down her husband's partner. "),
      q('Morning'),
      t('. ', 'Morning'),
      t('The same night, Blackwood ran his own bluff on the dead wire: ', 'Evening'),
      q('Evening'),
      t('.', 'Evening'),
    ],
  },
  {
    characterId: 'beatrice',
    editionNumber: 9,
    title: 'The Mother Twist',
    parts: [
      t('The ultimate liar. A birth certificate in the wall safe proves '),
      q('Morning'),
      t('. The girl was born out of wedlock before Beatrice married Vance.', 'Morning'),
    ],
  },
  {
    characterId: 'beatrice',
    editionNumber: 12,
    title: 'The Smuggler',
    parts: [
      t('A pawnshop trace confirms the hollow cane. '),
      q('Morning'),
      t('. ', 'Morning'),
      t("She pawned the hollow cane hours after the gala. The lab extra: ", 'Evening'),
      q('Evening'),
      t('.', 'Evening'),
    ],
  },
  {
    characterId: 'beatrice',
    editionNumber: 18,
    title: 'The Killer',
    parts: [
      t("Clara's testimony confirms she didn't just plan it. "),
      q('Morning'),
      t('. ', 'Morning'),
      t('From the priest-hole Clara swore she saw the cane and heard a deep voice, but not his face. The night extra named the voice: ', 'Evening'),
      q('Evening'),
      t('.', 'Evening'),
    ],
  },
  {
    characterId: 'beatrice',
    editionNumber: 22,
    title: 'The Monster',
    parts: [
      t('Arrives at Pier 84 with the doctor still in the passenger seat. She decided at the Plaza he would not split the take. '),
      q('Morning'),
      t('. ', 'Morning'),
      t('She would even kill her own daughter for the gold. The night extra: ', 'Evening'),
      q('Evening'),
      t('.', 'Evening'),
    ],
  },
  {
    characterId: 'beatrice',
    editionNumber: 26,
    title: 'The Prisoner',
    parts: [
      q('Morning'),
      t(' She did it to keep her loot. It failed. ', 'Morning'),
      t('The bullion returns to the rightful heir. The night inventory: ', 'Evening'),
      q('Evening'),
      t('.', 'Evening'),
    ],
  },
  {
    characterId: 'clara',
    editionNumber: 3,
    title: 'The Missing Heir',
    parts: [
      t("Archibald's estranged daughter, who vanished three years ago. We just learned it: "),
      q('Morning'),
      t(' She inherits the massive fortune.', 'Morning'),
    ],
  },
  {
    characterId: 'clara',
    editionNumber: 6,
    title: 'The Prisoner',
    parts: [
      t('The doctor kept her drugged to hide the bootlegging routes. The ledger extra: ', 'Evening'),
      q('Evening'),
      t('. ', 'Evening'),
      t('But the nurse confirms it: ', 'Morning'),
      q('Morning'),
      t('.', 'Morning'),
    ],
  },
  {
    characterId: 'clara',
    editionNumber: 10,
    title: 'The Witness',
    parts: [
      t("Hiding in the Bowery. She slipped into the priest-hole uninvited and watched her father's murder from the wall. He never knew she was there. I am still hunting a Manhattan phantom. The letter is all smell and silver: "),
      q('Morning'),
      t('.', 'Morning'),
    ],
  },
  {
    characterId: 'clara',
    editionNumber: 13,
    title: 'The Hunted',
    parts: [
      t('I arrived at her boarding house too late. Her mirror held a lipstick line: '),
      q('Morning'),
      t('.', 'Morning'),
    ],
  },
  {
    characterId: 'clara',
    editionNumber: 18,
    title: 'The Survivor',
    parts: [
      t('Rescued from the hit squad. She sat ice-still in the interrogation room and confirmed it: '),
      q('Morning'),
      t('.', 'Morning'),
    ],
  },
  {
    characterId: 'clara',
    editionNumber: 21,
    title: 'The Bait',
    parts: [
      t('Stood as bait at Pier 84 until the dockworker confirmed the old man\'s gold map: '),
      q('Morning'),
      t('.', 'Morning'),
    ],
  },
  {
    characterId: 'clara',
    editionNumber: 29,
    title: 'The Successor',
    parts: [
      t('Takes over the company. '),
      q('Morning'),
      t('. ', 'Morning'),
      t("She fed her father's last blackmail files to the study furnace. The night extra confirmed it: ", 'Evening'),
      q('Evening'),
      t('. The red pen was hers.', 'Evening'),
    ],
  },
  {
    characterId: 'sterling',
    editionNumber: 3,
    title: 'The Panicked Partner',
    parts: [
      t("Archibald's business partner. He sweats bullets. We learned "),
      q('Morning'),
      t(' The heir is back.', 'Morning'),
      t(' He paid to have her sent away to the sanatorium. The night extra: ', 'Evening'),
      q('Evening'),
      t('.', 'Evening'),
    ],
  },
  {
    characterId: 'sterling',
    editionNumber: 7,
    title: 'The Bootlegger',
    parts: [
      t('The Coast Guard raid proves it: '),
      q('Morning'),
      t(' He runs the waterfront underworld.', 'Morning'),
    ],
  },
  {
    characterId: 'sterling',
    editionNumber: 11,
    title: 'The Mob Boss',
    parts: [
      q('Morning'),
      t(' He did it at The Blind Tiger speakeasy, where the bartender distributes the dock payoffs. ', 'Morning'),
      t('The napkin in the booth named the weapon, not the man: ', 'Evening'),
      q('Evening'),
      t('.', 'Evening'),
    ],
  },
  {
    characterId: 'sterling',
    editionNumber: 14,
    title: 'The Gun Runner',
    parts: [
      t('He is worse than a bootlegger. The private ledger proves he was smuggling weapons. The torn page ran straight to City Hall: ', 'Evening'),
      q('Evening'),
      t('.', 'Evening'),
    ],
  },
  {
    characterId: 'sterling',
    editionNumber: 17,
    title: 'The Alibi',
    parts: [
      t('Proved innocent of the physical murder. He was at the speakeasy during the killing. A dropped police file at Pier 44 confirmed it: ', 'Evening'),
      q('Evening'),
      t('.', 'Evening'),
    ],
  },
  {
    characterId: 'sterling',
    editionNumber: 23,
    title: 'The Viper',
    parts: [
      t("Turns on Beatrice at Pier 84. He kept a carbon from his own crooked chemist—the same bench Blackwood used for the almonds. He means to hang the doctor with it. The rafters extra: ", 'Evening'),
      q('Evening'),
      t('. There is no honor among thieves.', 'Evening'),
    ],
  },
  {
    characterId: 'sterling',
    editionNumber: 25,
    title: 'The Convict',
    parts: [
      t('Tackled into the Hudson. Under the lights he finally said it: '),
      q('Morning'),
      t('. ', 'Morning'),
      t("Then he named the pieces. The doctor supplied the cyanide. Beatrice poured it. He claimed he only laundered the money. The second signature: ", 'Evening'),
      q('Evening'),
      t('.', 'Evening'),
    ],
  },
  {
    characterId: 'archibald',
    editionNumber: 1,
    title: 'The Victim',
    parts: [
      t('Renowned shipping tycoon found dead in a locked study. The coroner confirmed '),
      q('Morning'),
      t('.', 'Morning'),
    ],
  },
  {
    characterId: 'archibald',
    editionNumber: 7,
    title: 'The Ultimatum',
    parts: [
      t("He wasn't suicidal; he was angry. He left the rum books where the Coast Guard would have to find them. The harbor extra: ", 'Evening'),
      q('Evening'),
      t('.', 'Evening'),
    ],
  },
  {
    characterId: 'archibald',
    editionNumber: 9,
    title: 'The Blackmailer',
    parts: [
      t('Far from innocent himself. Clara threatened to expose his blackmail ring to the press. The midnight extra: ', 'Evening'),
      q('Evening'),
      t('.', 'Evening'),
    ],
  },
  {
    characterId: 'archibald',
    editionNumber: 28,
    title: 'The Paranoid Tycoon',
    parts: [
      t("His final cipher proved he wasn't blind. He did not hand Clara the keys in 1923. He sealed a dead-man's trust that slept until they killed him. He did not put her in the wall that night. She put herself there. The last night letter: ", 'Evening'),
      q('Evening'),
      t('. ', 'Evening'),
      q('Morning'),
      t('.', 'Morning'),
    ],
  },
  {
    characterId: 'blackwood',
    editionNumber: 19,
    title: 'The Accomplice',
    parts: [
      t('A travel alias put him at the gala. Phantom train down, Albany desk after. The locker held the rest: ', 'Morning'),
      q('Morning'),
      t('. ', 'Morning'),
      t('He supplied the cyanide from his medical bag. The night search found: ', 'Evening'),
      q('Evening'),
      t('.', 'Evening'),
    ],
  },
  {
    characterId: 'blackwood',
    editionNumber: 20,
    title: 'The Expendable Lover',
    parts: [
      t('Plotted to split the fortune with Beatrice in Havana. A terrified maid spotted them leaving the Plaza Hotel. '),
      q('Morning'),
      t(". He is already arguing for a split. She is already done sharing.", 'Morning'),
    ],
  },
  {
    characterId: 'reginald',
    editionNumber: 8,
    title: 'The Bribed Servant',
    parts: [
      t("Vance's trusted butler. Confesses to the hall key on a mortise lock that works both sides, remembering "),
      q('Morning'),
      t('. ', 'Morning'),
      t('He would not name the man in the hall. He did name the lock: ', 'Evening'),
      q('Evening'),
      t('. I booked him. The Chief will cut him loose.', 'Evening'),
    ],
  },
  {
    characterId: 'reginald',
    editionNumber: 14,
    title: 'The Dead Fool',
    parts: [
      t("Found floating in the East River with cobblestones in his pockets. O'Malley sprung him for insufficient evidence. He walked with a planted page and tried to squeeze Sterling. It was the wrong sheet. "),
      q('Morning'),
      t(' He paid it.', 'Morning'),
    ],
  },
];

export function findEditionPuzzle(
  puzzles: PuzzleData[],
  editionNumber: number,
  slot: CaseSlot
) {
  return puzzles.find((puzzle) => {
    if (puzzle.editionNumber !== editionNumber) return false;
    return slot === 'Evening' ? isNightEdition(puzzle) : isMorningEdition(puzzle);
  });
}

function slotSolved(
  puzzles: PuzzleData[],
  solvedPuzzleIds: string[],
  editionNumber: number,
  slot: CaseSlot
) {
  const puzzle = findEditionPuzzle(puzzles, editionNumber, slot);
  return Boolean(puzzle && solvedPuzzleIds.includes(puzzle.id));
}

function partVisible(
  part: CasePart,
  puzzles: PuzzleData[],
  solvedPuzzleIds: string[],
  editionNumber: number
) {
  if (part.kind === 'quote') {
    return slotSolved(puzzles, solvedPuzzleIds, editionNumber, part.slot);
  }
  if (!part.when) return true;
  return slotSolved(puzzles, solvedPuzzleIds, editionNumber, part.when);
}

function pushText(segments: CaseNoteSegment[], value: string) {
  const last = segments[segments.length - 1];
  if (last?.kind === 'quote') {
    const ended = /[.!?]$/.test(last.value);
    value = value.replace(/^\s*[.]+(?=\s|$)/, '');
    const next = value.trim();
    if (!next) return;
    if (ended && (/^[,;:]/.test(next) || /^[a-z]/.test(next))) {
      last.value = last.value.replace(/[.!?]$/, '');
    }
    value = /^[,:;]/.test(next) ? next : ` ${next}`;
  }
  if (!value.trim()) return;
  segments.push({ kind: 'text', value });
}

export function assembleFragment(
  fragment: CaseFragment,
  puzzles: PuzzleData[],
  solvedPuzzleIds: string[]
): AssembledFragment | null {
  const segments: CaseNoteSegment[] = [];
  let hasQuote = false;

  for (const part of fragment.parts) {
    if (!partVisible(part, puzzles, solvedPuzzleIds, fragment.editionNumber)) continue;
    if (part.kind === 'quote') {
      const puzzle = findEditionPuzzle(puzzles, fragment.editionNumber, part.slot);
      if (!puzzle) continue;
      segments.push({
        kind: 'quote',
        value: puzzle.originalText,
      });
      hasQuote = true;
      continue;
    }
    pushText(segments, part.value);
  }

  if (!hasQuote) return null;
  return {
    characterId: fragment.characterId,
    editionNumber: fragment.editionNumber,
    title: fragment.title,
    segments,
  };
}

export function unlockedFragmentsForCharacter(
  characterId: CaseCharacterId,
  puzzles: PuzzleData[],
  solvedPuzzleIds: string[]
) {
  return CASE_FRAGMENTS.filter((fragment) => fragment.characterId === characterId)
    .map((fragment) => assembleFragment(fragment, puzzles, solvedPuzzleIds))
    .filter((fragment): fragment is AssembledFragment => Boolean(fragment));
}

export function hasDecodedFragments(puzzles: PuzzleData[], solvedPuzzleIds: string[]) {
  return CASE_FRAGMENTS.some((fragment) => assembleFragment(fragment, puzzles, solvedPuzzleIds));
}

export function fragmentKey(fragment: { characterId: string; editionNumber: number }) {
  return `${fragment.characterId}-${fragment.editionNumber}`;
}

export function fragmentsUpdatedByPuzzle(puzzle: PuzzleData) {
  const slot: CaseSlot = isNightEdition(puzzle) ? 'Evening' : 'Morning';
  return CASE_FRAGMENTS.filter(
    (fragment) =>
      fragment.editionNumber === puzzle.editionNumber &&
      fragment.parts.some((part) => part.kind === 'quote' && part.slot === slot)
  );
}
