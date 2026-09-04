import { PuzzleData } from '../types';
import { isMorningEdition, isNightEdition } from '../utils/edition';
import data from './caseFiles.json';

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

export type CaseCharacter = {
  id: CaseCharacterId;
  name: string;
  dossier: string;
  file: string;
  plate: string;
};

export const CASE_CHARACTERS: CaseCharacter[] = data.characters as CaseCharacter[];

export const CASE_FRAGMENTS: CaseFragment[] = data.fragments as CaseFragment[];

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
