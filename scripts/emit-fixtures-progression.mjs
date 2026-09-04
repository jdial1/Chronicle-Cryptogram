/**
 * The progression, merge, normalize, wallet and cursor halves of the fixture set.
 * Split out of emit-fixtures.mjs only to keep each file readable; the emitter
 * imports this and there is no separate entry point.
 *
 * Every function here takes the `emit` callback so both halves write through the
 * same --check-aware writer.
 */
import {
  isHardPuzzle,
  frontPageEdition,
  isNightUnlocked,
  isSeasonComplete,
  currentMorningPuzzle,
  chapterForEdition,
  groupIssues,
  maxEdition,
  editionLabel,
} from '../src/utils/edition.ts';
import {
  mergeProgress,
  mergeGameStats,
  mergeSolvedIds,
  normalizeProgress,
  normalizeDailyHints,
  mergeDailyHints,
  clipDailyWallet,
  clipHintedSymbolIds,
  clipSelectedSymbolId,
  isEditionKey,
  progressFields,
  usedHintsFromProgress,
  usedChecksFromProgress,
  DEFAULT_GAME_STATS,
  DAILY_HINTS,
  DAILY_CHECKS,
} from '../src/utils/localStore.ts';
import { letterCells, cellCursor, nextOpenCell, previousCell } from '../src/game/cipherCursor.ts';
import { decodedMappingsFromPuzzle, withHintedMappings, liveFlaggedIds } from '../src/game/puzzleState.ts';
import { buildCipherAlphabet, parseCryptogramText } from '../src/utils/cipherEngine.ts';
import { INITIAL_PUZZLES } from '../src/data/puzzles.ts';

/** The seed each puzzle actually uses, per puzzleState.ts:59. */
const puzzleSeed = (puzzle) => puzzle.id + puzzle.originalText;

const morningId = (edition) =>
  INITIAL_PUZZLES.find((p) => p.editionNumber === edition && !isHardPuzzle(p) && p.editionNumber > 0)?.id;

/** A PuzzleProgress with every field populated, so partial overrides stay readable. */
const progress = (over = {}) => ({
  mappings: { s1: 'A' },
  timerSeconds: 10,
  hintsUsed: 0,
  hintsRemaining: DAILY_HINTS,
  hintedSymbolIds: [],
  checksUsed: 0,
  checksRemaining: DAILY_CHECKS,
  verifiedSymbolIds: [],
  flaggedSymbolIds: [],
  selectedSymbolId: null,
  isSolved: false,
  ...over,
});

export function emitProgression(emit) {
  const top = maxEdition(INITIAL_PUZZLES);
  const contiguous = (n) => Array.from({ length: n }, (_, i) => morningId(i + 1)).filter(Boolean);
  const primerId = INITIAL_PUZZLES.find((p) => p.editionNumber === 0)?.id;
  const nightIds = INITIAL_PUZZLES.filter((p) => isHardPuzzle(p)).map((p) => p.id);

  const cases = [
    { name: 'empty', solvedIds: [] },
    // Edition 0 sits outside the walk, so solving the primer must not advance it.
    { name: 'primer-only', solvedIds: primerId ? [primerId] : [] },
    { name: 'one', solvedIds: contiguous(1) },
    { name: 'three', solvedIds: contiguous(3) },
    // A hole must not be skippable: 1,2,4 solved still yields a front page of 3.
    { name: 'hole-1-2-4', solvedIds: [morningId(1), morningId(2), morningId(4)].filter(Boolean) },
    { name: 'hole-at-one', solvedIds: [morningId(2), morningId(3)].filter(Boolean) },
    { name: 'night-only', solvedIds: nightIds.slice(0, 5) },
    { name: 'all-mornings', solvedIds: contiguous(top) },
    { name: 'everything', solvedIds: INITIAL_PUZZLES.map((p) => p.id) },
    { name: 'unknown-ids', solvedIds: ['not_a_puzzle', 'day_999_easy'] },
  ];

  const editions = Array.from({ length: top + 2 }, (_, i) => i);

  emit('progression', {
    maxEdition: top,
    editionLabels: editions.map((n) => ({ edition: n, label: editionLabel(n) })),
    chapters: editions.map((n) => ({ edition: n, chapter: chapterForEdition(n) })),
    // groupIssues does not depend on solve state -- it returns every issue so the
    // UI can render lock state itself.
    issues: groupIssues(INITIAL_PUZZLES).map((issue) => ({
      editionNumber: issue.editionNumber,
      morningId: issue.morning?.id ?? null,
      nightId: issue.night?.id ?? null,
    })),
    cases: cases.map((c) => ({
      name: c.name,
      solvedIds: c.solvedIds,
      frontPageEdition: frontPageEdition(INITIAL_PUZZLES, c.solvedIds),
      currentMorningPuzzleId: currentMorningPuzzle(INITIAL_PUZZLES, c.solvedIds)?.id ?? null,
      seasonComplete: isSeasonComplete(INITIAL_PUZZLES, c.solvedIds),
      nightUnlocked: editions.map((n) => ({
        edition: n,
        unlocked: isNightUnlocked(INITIAL_PUZZLES, c.solvedIds, n),
      })),
    })),
  });
}

/**
 * mergeProgress stamps `updatedAt: Date.now()` whenever neither side carried a
 * timestamp (progressSnapshot's fallback), which would make this fixture change
 * on every run. Replace only that freshly-minted value with a sentinel: the
 * Kotlin port must put a current clock reading there, and every other field
 * stays pinned exactly.
 */
const NOW = '<now>';

function pinStamp(merged, local, cloud) {
  if (!merged) return merged;
  // Several branches return an input record untouched, so it carries no stamp at
  // all. Only a value the merge actually minted gets the sentinel.
  if (merged.updatedAt === undefined) return merged;
  const carried = Math.max(Number(local?.updatedAt) || 0, Number(cloud?.updatedAt) || 0);
  if (carried && merged.updatedAt === carried) return merged;
  return { ...merged, updatedAt: NOW };
}

export function emitMergeProgress(emit) {
  const cases = [
    ['both-null', null, null],
    ['local-only', progress(), null],
    ['cloud-only', null, progress({ timerSeconds: 99 })],
    ['cloud-solved-local-not', progress(), progress({ isSolved: true, timerSeconds: 40 })],
    ['local-solved-cloud-not', progress({ isSolved: true, timerSeconds: 40 }), progress()],
    [
      'both-solved-cloud-faster',
      progress({ isSolved: true, timerSeconds: 90 }),
      progress({ isSolved: true, timerSeconds: 30 }),
    ],
    [
      'both-solved-local-faster',
      progress({ isSolved: true, timerSeconds: 30 }),
      progress({ isSolved: true, timerSeconds: 90 }),
    ],
    [
      'both-solved-equal',
      progress({ isSolved: true, timerSeconds: 60 }),
      progress({ isSolved: true, timerSeconds: 60 }),
    ],
    [
      'stamped-cloud-newer',
      progress({ updatedAt: 1000, timerSeconds: 5 }),
      progress({ updatedAt: 2000, timerSeconds: 7 }),
    ],
    [
      'stamped-local-newer',
      progress({ updatedAt: 2000, timerSeconds: 7 }),
      progress({ updatedAt: 1000, timerSeconds: 5 }),
    ],
    [
      'stamped-equal',
      progress({ updatedAt: 1000, timerSeconds: 5 }),
      progress({ updatedAt: 1000, timerSeconds: 9 }),
    ],
    [
      'unstamped-union',
      progress({ mappings: { s1: 'A' }, hintedSymbolIds: ['s1'] }),
      progress({ mappings: { s2: 'B' }, hintedSymbolIds: ['s2'] }),
    ],
    ['conflicting-mappings', progress({ mappings: { s1: 'A' } }), progress({ mappings: { s1: 'Z' } })],
    ['hints-differ', progress({ hintsUsed: 1, hintsRemaining: 2 }), progress({ hintsUsed: 3, hintsRemaining: 0 })],
    ['checks-differ', progress({ checksUsed: 2, checksRemaining: 1 }), progress({ checksUsed: 0, checksRemaining: 3 })],
    ['flags-differ', progress({ flaggedSymbolIds: ['s1'] }), progress({ flaggedSymbolIds: ['s2'] })],
  ];

  emit('merge-progress', {
    freshStampSentinel: NOW,
    progress: cases.map(([name, local, cloud]) => ({
      name,
      local,
      cloud,
      merged: pinStamp(mergeProgress(local, cloud), local, cloud),
    })),
    progressFields: cases
      .filter(([, local]) => local)
      .map(([name, local]) => ({ name, input: local, fields: progressFields(local) })),
    gameStats: [
      ['cloud-null', DEFAULT_GAME_STATS, null],
      [
        'cloud-ahead',
        DEFAULT_GAME_STATS,
        { ...DEFAULT_GAME_STATS, puzzlesSolved: 4, totalTimePlayed: 500, fastestTime: 30 },
      ],
      [
        'local-ahead',
        { ...DEFAULT_GAME_STATS, puzzlesSolved: 9, fastestTime: 12 },
        { ...DEFAULT_GAME_STATS, puzzlesSolved: 4, fastestTime: 30 },
      ],
      [
        'fastest-null-vs-value',
        { ...DEFAULT_GAME_STATS, fastestTime: null },
        { ...DEFAULT_GAME_STATS, fastestTime: 77 },
      ],
      ['accuracy', { ...DEFAULT_GAME_STATS, averageAccuracy: 80 }, { ...DEFAULT_GAME_STATS, averageAccuracy: 95 }],
    ].map(([name, local, cloud]) => ({ name, local, cloud, merged: mergeGameStats(local, cloud) })),
    solvedIds: [
      ['both-empty', [], []],
      ['disjoint', ['a', 'b'], ['c']],
      ['overlapping', ['a', 'b'], ['b', 'c']],
      ['duplicates-in-local', ['a', 'a', 'b'], ['b']],
    ].map(([name, local, cloud]) => ({ name, local, cloud, merged: mergeSolvedIds(local, cloud) })),
  });
}

export function emitNormalizeProgress(emit) {
  const bigMappings = {};
  for (let i = 0; i < 200; i++) bigMappings['s' + i] = 'A';
  const manyIds = Array.from({ length: 40 }, (_, i) => 'id' + i);

  const cases = [
    ['null', null],
    ['undefined', undefined],
    ['number', 42],
    ['string-not-json', 'nonsense{'],
    ['string-json', JSON.stringify(progress())],
    ['empty-object', {}],
    ['valid', progress()],
    ['200-mappings', progress({ mappings: bigMappings })],
    ['40-hinted-ids', progress({ hintedSymbolIds: manyIds })],
    ['overlong-id', progress({ hintedSymbolIds: ['x'.repeat(200), 'ok'] })],
    ['duplicate-ids', progress({ hintedSymbolIds: ['a', 'a', 'b'] })],
    ['timer-huge', progress({ timerSeconds: 1e9 })],
    ['timer-negative', progress({ timerSeconds: -5 })],
    ['timer-nan', progress({ timerSeconds: NaN })],
    ['hints-huge', progress({ hintsUsed: 999, hintsRemaining: -4 })],
    ['checks-huge', progress({ checksUsed: 999, checksRemaining: -4 })],
    ['selected-overlong', progress({ selectedSymbolId: 'x'.repeat(200) })],
    ['wrong-types', { mappings: 'no', timerSeconds: 'no', hintedSymbolIds: 'no', isSolved: 'yes' }],
    // Latent TypeScript defect, pinned so it cannot change unnoticed: a present
    // but non-numeric hints/checksRemaining takes the `Number(...)` branch rather
    // than the null branch, so NaN survives every clamp and serialises as null.
    // Kotlin cannot hold NaN in an Int and deliberately diverges here -- see
    // Merge.normalizeProgress.
    ['nan-remaining', progress({ hintsRemaining: 'abc', checksRemaining: 'xyz' })],
  ];

  emit('normalize-progress', {
    cases: cases.map(([name, raw]) => ({
      name,
      raw: raw === undefined ? null : raw,
      normalized: normalizeProgress(raw),
    })),
    clipHintedSymbolIds: [
      ['not-array', 'nope'],
      ['empty', []],
      ['duplicates', ['a', 'a', 'b']],
      ['overlong', ['x'.repeat(81), 'ok']],
      ['at-limit', ['x'.repeat(80)]],
      ['thirty', Array.from({ length: 30 }, (_, i) => 'id' + i)],
      ['mixed-types', ['a', 1, null, '', 'b']],
    ].map(([name, input]) => ({ name, input, output: clipHintedSymbolIds(input) })),
    clipSelectedSymbolId: [
      ['null', null],
      ['valid', 'sym_1'],
      ['empty', ''],
      ['overlong', 'x'.repeat(81)],
      ['number', 7],
    ].map(([name, input]) => ({ name, input, output: clipSelectedSymbolId(input) })),
  });
}

export function emitWallets(emit) {
  const editionKeys = [-1, 0, 1, 1.5, 30, 999, 1000, NaN];
  const clips = [];
  for (const cap of [DAILY_HINTS, DAILY_CHECKS]) {
    for (const used of [-3, 0, 1, 2.7, 3, 4, 999, NaN]) {
      clips.push({
        edition: 1,
        used: Number.isNaN(used) ? 'NaN' : used,
        cap,
        output: clipDailyWallet(1, used, cap),
      });
    }
  }

  // reconcileDailyHints/Checks read localStorage, so only their pure core is
  // pinned here: clipDailyWallet over usedHintsFromProgress/usedChecksFromProgress.
  const puzzles = INITIAL_PUZZLES.slice(0, 6).map((p) => ({ id: p.id, editionNumber: p.editionNumber }));
  const progressById = {};
  puzzles.forEach((p, i) => {
    progressById[p.id] = progress({
      hintsUsed: i % 4,
      hintedSymbolIds: Array.from({ length: (i + 1) % 4 }, (_, k) => 'h' + k),
      checksUsed: (i + 1) % 4,
      verifiedSymbolIds: Array.from({ length: i % 4 }, (_, k) => 'v' + k),
    });
  });

  emit('wallets', {
    dailyHints: DAILY_HINTS,
    dailyChecks: DAILY_CHECKS,
    isEditionKey: editionKeys.map((value) => ({
      value: Number.isNaN(value) ? 'NaN' : value,
      output: isEditionKey(value),
    })),
    clipDailyWallet: clips,
    normalizeDailyHints: [
      ['null', null, 1],
      ['string-json', JSON.stringify({ edition: 1, used: 2, remaining: 1 }), 1],
      ['string-bad', '{{', 1],
      ['from-remaining', { remaining: 1 }, 1],
      ['from-used', { used: 2 }, 1],
      ['both-missing', {}, 1],
      ['bad-edition', { used: 1 }, -1],
      ['edition-999', { used: 1 }, 999],
      ['edition-1000', { used: 1 }, 1000],
      ['used-over-cap', { used: 99 }, 1],
    ].map(([name, raw, edition]) => ({
      name,
      raw,
      edition,
      output: normalizeDailyHints(raw, edition, DAILY_HINTS),
    })),
    mergeDailyHints: [
      ['both-null', null, null],
      ['local-only', { edition: 1, used: 2, remaining: 1 }, null],
      ['cloud-only', null, { edition: 1, used: 3, remaining: 0 }],
      ['local-ahead', { edition: 1, used: 3, remaining: 0 }, { edition: 1, used: 1, remaining: 2 }],
      ['cloud-ahead', { edition: 1, used: 1, remaining: 2 }, { edition: 1, used: 3, remaining: 0 }],
    ].map(([name, local, cloud]) => ({
      name,
      local,
      cloud,
      output: mergeDailyHints(local, cloud, 1, DAILY_HINTS),
    })),
    usedFromProgress: [...new Set(puzzles.map((p) => p.editionNumber))].map((edition) => ({
      edition,
      hints: usedHintsFromProgress(edition, puzzles, progressById),
      checks: usedChecksFromProgress(edition, puzzles, progressById),
    })),
    progressById,
    puzzles,
  });
}

export function emitPuzzleState(emit) {
  // One Easy and one Hard puzzle, so homophone allocation is exercised.
  const chosen = [
    INITIAL_PUZZLES.find((p) => p.editionNumber === 1 && !isHardPuzzle(p)),
    INITIAL_PUZZLES.find((p) => p.editionNumber === 1 && isHardPuzzle(p)),
  ].filter(Boolean);

  emit('puzzle-state', {
    puzzles: chosen.map((puzzle) => {
      const decoded = decodedMappingsFromPuzzle(puzzle);
      const ids = Object.keys(decoded);
      const wrong = ids[0];
      const right = ids[1];
      const locked = ids[2];

      // A board with one wrong guess, one right guess, and one locked symbol.
      const mappings = {
        [wrong]: decoded[wrong] === 'A' ? 'B' : 'A',
        [right]: decoded[right],
        [locked]: decoded[locked],
      };

      return {
        puzzleId: puzzle.id,
        hard: isHardPuzzle(puzzle),
        decoded,
        mappings,
        withHintedMappings: withHintedMappings(puzzle, mappings, [ids[3], ids[4], 'not_a_symbol']),
        liveFlagged: [
          {
            name: 'wrong-guess-is-flagged',
            flagged: [wrong, right],
            locked: [],
            output: liveFlaggedIds(puzzle, mappings, [wrong, right], []),
          },
          {
            name: 'locked-symbol-never-flags',
            flagged: [wrong],
            locked: [wrong],
            output: liveFlaggedIds(puzzle, mappings, [wrong], [wrong]),
          },
          {
            name: 'unmapped-symbol-never-flags',
            flagged: [ids[10]],
            locked: [],
            output: liveFlaggedIds(puzzle, mappings, [ids[10]], []),
          },
          {
            name: 'unknown-id-is-dropped',
            flagged: ['not_a_symbol'],
            locked: [],
            output: liveFlaggedIds(puzzle, mappings, ['not_a_symbol'], []),
          },
        ],
      };
    }),
  });
}

export function emitCursor(emit) {
  // A real board, so cell ids and punctuation handling match the shipped game.
  const puzzle = INITIAL_PUZZLES.find((p) => p.editionNumber === 1 && !isHardPuzzle(p)) || INITIAL_PUZZLES[0];
  const map = buildCipherAlphabet(puzzleSeed(puzzle), isHardPuzzle(puzzle));
  const words = parseCryptogramText(puzzle.originalText, map);
  const cells = letterCells(words);

  const someSymbol = cells[3]?.symbolId ?? null;
  const lastCell = cells[cells.length - 1];

  // Every symbol mapped -- nextOpenCell must return null rather than loop forever.
  const fullMappings = {};
  for (const cell of cells) fullMappings[cell.symbolId] = 'A';
  // Everything mapped except the very first cell: proves the search wraps around.
  const wrapMappings = { ...fullMappings };
  delete wrapMappings[cells[0].symbolId];

  const selections = [
    ['no-selection', null, null],
    ['by-symbol', someSymbol, null],
    ['by-cell', null, cells[5]?.cellId ?? null],
    ['cell-wins-over-symbol', someSymbol, cells[9]?.cellId ?? null],
    ['unknown-symbol', 'not_a_symbol', null],
    ['unknown-cell', null, 'not_a_cell'],
    ['last-cell', null, lastCell?.cellId ?? null],
    ['first-cell', null, cells[0]?.cellId ?? null],
  ];

  const mappingSets = [
    ['none', {}],
    ['all', fullMappings],
    ['all-but-first', wrapMappings],
  ];

  emit('cursor', {
    puzzleId: puzzle.id,
    cells,
    letterCellsEmpty: letterCells([]),
    cellCursor: selections.map(([name, symbolId, cellId]) => ({
      name,
      selectedSymbolId: symbolId,
      selectedCellId: cellId,
      index: cellCursor(cells, symbolId, cellId),
    })),
    previousCell: selections.map(([name, symbolId, cellId]) => ({
      name,
      selectedSymbolId: symbolId,
      selectedCellId: cellId,
      cell: previousCell(cells, symbolId, cellId),
    })),
    nextOpenCell: mappingSets.flatMap(([mapName, mappings]) =>
      selections.map(([name, symbolId, cellId]) => ({
        name: mapName + '/' + name,
        selectedSymbolId: symbolId,
        selectedCellId: cellId,
        mappedSymbolCount: Object.keys(mappings).length,
        cell: nextOpenCell(cells, symbolId, cellId, mappings),
      }))
    ),
    emptyBoard: {
      cellCursor: cellCursor([], null, null),
      nextOpenCell: nextOpenCell([], null, null, {}),
      previousCell: previousCell([], null, null),
    },
  });
}
