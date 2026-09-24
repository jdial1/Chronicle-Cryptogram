/**
 * The author's workbench: every press check on a page, before it goes into the
 * season (docs/SOUL-FEATURES.md, idea 15). The same checks the content tests run,
 * so a writer fixes a draft line instead of meeting a failing test later.
 *
 *   npm run desk:check -- day_4_hard day_21_easy
 *   npm run desk:check -- --quote "SHE NEVER BOARDED THE TRAIN." --headline "THE WIDOW'S ALIBI" \
 *                         --article "The porter remembers her hat..." [--night]
 */
import { INITIAL_PUZZLES } from '../src/data/puzzles';
import { frameLeak, letterCount, splitLetters } from '../src/game/deskCheck';
import { lastWordAlternates } from '../src/game/fairPlay';
import { FAIR_PLAY_DICTIONARY } from '../src/game/fairPlayDictionary';
import { isHardPuzzle } from '../src/utils/edition';
import type { PuzzleData } from '../src/types';

const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

function draft(): PuzzleData {
  const night = args.includes('--night');
  return {
    ...INITIAL_PUZZLES[1],
    id: 'draft',
    headline: flag('headline') ?? '',
    subheadline: flag('article') ?? '',
    originalText: flag('quote')!.toUpperCase(),
    difficulty: night ? 'Hard' : 'Easy',
    difficultyMode: night ? 'Hard' : 'Easy',
    editionSlot: night ? 'Evening' : 'Morning',
  } as PuzzleData;
}

const pages = flag('quote')
  ? [draft()]
  : args.filter((a) => !a.startsWith('--')).map((id) => {
      const page = INITIAL_PUZZLES.find((p) => p.id === id);
      if (!page) throw new Error(`No page with id ${id}`);
      return page;
    });
if (!pages.length) {
  console.log('Usage: npm run desk:check -- <puzzle id...>  |  --quote "..." [--headline "..."] [--article "..."] [--night]');
  process.exit(1);
}

const lengths = INITIAL_PUZZLES.filter((p) => p.editionNumber > 0).map((p) => letterCount(p.originalText));
const [shortest, longest] = [Math.min(...lengths), Math.max(...lengths)];

let problems = 0;
for (const page of pages) {
  const notes: string[] = [];
  const letters = letterCount(page.originalText);
  notes.push(`length: ${letters} letters (season runs ${shortest}–${longest})`);
  if (letters < shortest || letters > longest) notes.push('  ! outside the season range');

  if (isHardPuzzle(page)) {
    const split = splitLetters(page);
    notes.push(`night split: ${split.length ? split.join(', ') : 'none'}`);
    if (!split.length) (problems += 1), notes.push('  ! plays flat: repeat E, T or A so something splits');
  }

  const leak = frameLeak(page);
  notes.push(`frame prints: ${leak.printed.length}/${leak.answer.length} long words${leak.printed.length ? ` (${leak.printed.join(', ')})` : ''}`);
  if (leak.answer.length >= 2 && leak.share === 1) (problems += 1), notes.push('  ! the frame prints the whole answer');
  else if (leak.share > 0.5) notes.push('  ~ over half: check the frame gives the crib, not the line');

  const rivals = lastWordAlternates(page, FAIR_PLAY_DICTIONARY);
  notes.push(rivals.length ? 'last-word rivals (does the frame or grammar settle each?):' : 'last-word rivals: none');
  for (const { word, alternates } of rivals) notes.push(`  ${word} -> ${alternates.join(', ')}`);

  console.log(`\n${page.id}: ${page.originalText}\n  ${notes.join('\n  ')}`);
}
process.exit(problems ? 1 : 0);
