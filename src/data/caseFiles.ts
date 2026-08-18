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

export const CASE_CHARACTERS: { id: CaseCharacterId; name: string; dossier: string }[] = [
  { id: 'thorne', name: 'Detective Elias Thorne', dossier: 'Lead investigator' },
  { id: 'beatrice', name: 'Beatrice Vance', dossier: 'The widow' },
  { id: 'clara', name: 'Clara Vance', dossier: 'The missing heir' },
  { id: 'sterling', name: 'Arthur Sterling', dossier: 'The partner' },
  { id: 'archibald', name: 'Archibald Vance', dossier: 'The victim' },
  { id: 'blackwood', name: 'Dr. Aris Blackwood', dossier: 'The physician' },
  { id: 'reginald', name: 'Reginald', dossier: 'The butler' },
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
      t('. ', 'Morning'),
      t('I know ', 'Evening'),
      q('Evening'),
      t('. ', 'Evening'),
      t("I'm going to find out who did it."),
    ],
  },
  {
    characterId: 'thorne',
    editionNumber: 6,
    title: 'The Bloodhound',
    parts: [
      t('Relentless on the trail. '),
      q('Morning'),
      t(', and I\'m willing to ride sleepless trains to Albany to chase down a single ticket stub to find her.', 'Morning'),
    ],
  },
  {
    characterId: 'thorne',
    editionNumber: 16,
    title: 'The Lone Wolf',
    parts: [
      t('Realizing the entire NYPD is on the mob payroll, I know I must ', 'Morning'),
      q('Morning'),
      t('. I officially burn my bridges and go rogue.', 'Morning'),
    ],
  },
  {
    characterId: 'thorne',
    editionNumber: 17,
    title: 'The Executioner',
    parts: [
      t("Crossed the ultimate line to save Clara's life. "),
      q('Morning'),
      t(", and I'm the one who pulled the trigger.", 'Morning'),
    ],
  },
  {
    characterId: 'thorne',
    editionNumber: 24,
    title: 'The Tactician',
    parts: [
      t('I engineered a bloody climax at the docks. Rather than calling for backup, '),
      q('Morning'),
      t('.', 'Morning'),
    ],
  },
  {
    characterId: 'thorne',
    editionNumber: 30,
    title: 'The Civilian',
    parts: [
      t('Turned in my badge. '),
      t('Clara whispered ', 'Morning'),
      q('Morning'),
      t('. ', 'Morning'),
      t('She sent me a gold watch with a note: ', 'Evening'),
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
      t('The grieving act is a sham. '),
      q('Morning'),
      t('. ', 'Morning'),
      t('She was hunting for his secrets, knowing ', 'Evening'),
      q('Evening'),
      t('.', 'Evening'),
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
      q('Evening'),
      t('.', 'Evening'),
    ],
  },
  {
    characterId: 'beatrice',
    editionNumber: 9,
    title: 'The Mother Twist',
    parts: [
      t('The ultimate liar. Born out of wedlock before her marriage, a birth certificate proves '),
      q('Morning'),
      t(', hiding an illegitimate past from high society.', 'Morning'),
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
      t('There were ', 'Morning'),
      q('Morning'),
      t('. ', 'Morning'),
      t('From the priest-hole Clara swore ', 'Evening'),
      q('Evening'),
      t('.', 'Evening'),
    ],
  },
  {
    characterId: 'beatrice',
    editionNumber: 22,
    title: 'The Monster',
    parts: [
      t('Arrives at Pier 84 having already murdered the Doctor. '),
      q('Morning'),
      t(', and ', 'Morning'),
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
      t(' to keep her loot. It failed. ', 'Morning'),
      q('Evening'),
      t('.', 'Evening'),
    ],
  },
  {
    characterId: 'clara',
    editionNumber: 3,
    title: 'The Missing Heir',
    parts: [
      t("Archibald's estranged daughter, who vanished three years ago. We just learned "),
      q('Morning'),
      t(', and she inherits the massive fortune.', 'Morning'),
    ],
  },
  {
    characterId: 'clara',
    editionNumber: 6,
    title: 'The Prisoner',
    parts: [
      q('Evening'),
      t('. ', 'Evening'),
      t('But the nurse confirms ', 'Morning'),
      q('Morning'),
      t('.', 'Morning'),
    ],
  },
  {
    characterId: 'clara',
    editionNumber: 10,
    title: 'The Witness',
    parts: [
      t("Hiding in the Bowery. She watched her father's murder from a secret priest-hole, telling me to "),
      q('Morning'),
      t('.', 'Morning'),
    ],
  },
  {
    characterId: 'clara',
    editionNumber: 13,
    title: 'The Hunted',
    parts: [
      t('I arrived at her boarding house too late. Her mirror held a lipstick warning: '),
      q('Morning'),
      t('.', 'Morning'),
    ],
  },
  {
    characterId: 'clara',
    editionNumber: 18,
    title: 'The Survivor',
    parts: [
      t('Rescued from the hit squad. She sat in the interrogation room and confirmed there were '),
      q('Morning'),
      t('.', 'Morning'),
    ],
  },
  {
    characterId: 'clara',
    editionNumber: 21,
    title: 'The Bait',
    parts: [
      t('Shows incredible nerve, standing on Pier 84 to draw the killers out of the shadows. '),
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
      q('Evening'),
      t('. She learned to grow fangs.', 'Evening'),
    ],
  },
  {
    characterId: 'sterling',
    editionNumber: 3,
    title: 'The Panicked Partner',
    parts: [
      t("Archibald's business partner. He sweats bullets because "),
      q('Evening'),
      t(', and now the heir is back.', 'Evening'),
    ],
  },
  {
    characterId: 'sterling',
    editionNumber: 7,
    title: 'The Bootlegger',
    parts: [
      t('The Coast Guard raid proves '),
      q('Morning'),
      t(' of the waterfront underworld.', 'Morning'),
    ],
  },
  {
    characterId: 'sterling',
    editionNumber: 11,
    title: 'The Mob Boss',
    parts: [
      q('Morning'),
      t(' at The Blind Tiger speakeasy, where ', 'Morning'),
      q('Evening'),
      t('.', 'Evening'),
    ],
  },
  {
    characterId: 'sterling',
    editionNumber: 14,
    title: 'The Gun Runner',
    parts: [
      t('He is worse than a bootlegger. '),
      q('Evening'),
      t('.', 'Evening'),
    ],
  },
  {
    characterId: 'sterling',
    editionNumber: 17,
    title: 'The Alibi',
    parts: [
      t('Proved innocent of the physical murder. '),
      q('Evening'),
      t('.', 'Evening'),
    ],
  },
  {
    characterId: 'sterling',
    editionNumber: 23,
    title: 'The Viper',
    parts: [
      t('Turns on Beatrice at Pier 84. '),
      q('Evening'),
      t('. There is no honor among thieves.', 'Evening'),
    ],
  },
  {
    characterId: 'sterling',
    editionNumber: 25,
    title: 'The Convict',
    parts: [
      t('Tackled into the Hudson. '),
      q('Morning'),
      t('. ', 'Morning'),
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
      t("He wasn't suicidal; he was angry. "),
      q('Evening'),
      t('.', 'Evening'),
    ],
  },
  {
    characterId: 'archibald',
    editionNumber: 9,
    title: 'The Blackmailer',
    parts: [
      t('Far from innocent himself. '),
      q('Evening'),
      t('.', 'Evening'),
    ],
  },
  {
    characterId: 'archibald',
    editionNumber: 28,
    title: 'The Paranoid Tycoon',
    parts: [
      t("His final cipher proved he wasn't blind. "),
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
      t('The man from the study is identified. '),
      q('Morning'),
      t('. ', 'Morning'),
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
      t(". He doesn't realize Beatrice is going to put a bullet in him before they reach the docks.", 'Morning'),
    ],
  },
  {
    characterId: 'reginald',
    editionNumber: 8,
    title: 'The Bribed Servant',
    parts: [
      t("Vance's trusted butler. Confesses to unlocking the doors for the killers, remembering "),
      q('Morning'),
      t('. ', 'Morning'),
      t('He claims ', 'Evening'),
      q('Evening'),
      t('.', 'Evening'),
    ],
  },
  {
    characterId: 'reginald',
    editionNumber: 14,
    title: 'The Dead Fool',
    parts: [
      t('Found floating in the East River with cobblestones in his pockets. He stole the ledger to blackmail the mob. '),
      q('Morning'),
      t(', and he paid it.', 'Morning'),
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
  if (last?.kind === 'quote' && /\.$/.test(last.value)) {
    if (value.startsWith('. ')) value = value.slice(1);
    else if (value.startsWith('.')) value = value.slice(1);
    if (value.startsWith(',') || /^\s+[a-z]/.test(value)) last.value = last.value.replace(/\.$/, '');
  }
  if (!value) return;
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
      segments.push({ kind: 'quote', value: puzzle.originalText });
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
