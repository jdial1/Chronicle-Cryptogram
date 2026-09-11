import { describe, expect, it } from 'vitest';
import { CASE_CHARACTERS, CASE_FRAGMENTS } from './caseFiles';
import { CIPHER_INTRO, CIPHER_TOOLS, CIPHER_TACTICS } from './cipherTactics';
import { PRACTICE_PUZZLES } from './primerPractice';
import plates from './plates.json';
import puzzles from './puzzles.json';

/**
 * The five JSON files under src/data are the single source of truth for content:
 * the web build imports them directly, and the Android build stages them into
 * assets/ with a Gradle Sync task. A file that goes missing or empty here breaks
 * both surfaces, so assert shape on the web side too rather than only in Kotlin.
 */
describe('content data files', () => {
  it('puzzles.json carries the season', () => {
    expect(puzzles.length).toBeGreaterThan(0);
  });

  it('caseFiles.json carries characters and fragments', () => {
    expect(CASE_CHARACTERS.length).toBeGreaterThan(0);
    expect(CASE_FRAGMENTS.length).toBeGreaterThan(0);
  });

  it('every fragment points at a known character', () => {
    const ids = new Set(CASE_CHARACTERS.map((character) => character.id));
    for (const fragment of CASE_FRAGMENTS) {
      expect(ids).toContain(fragment.characterId);
    }
  });

  it('cipherTactics.json carries the intro, tools and tactics', () => {
    expect(CIPHER_INTRO.length).toBeGreaterThan(0);
    expect(CIPHER_TOOLS.length).toBeGreaterThan(0);
    expect(CIPHER_TACTICS.length).toBeGreaterThan(0);
  });

  it('primerPractice.json carries practice quotes', () => {
    expect(PRACTICE_PUZZLES.length).toBeGreaterThan(0);
    expect(PRACTICE_PUZZLES.every((text) => text.length > 0)).toBe(true);
  });

  /**
   * The Primer promises five tells and then hands the player a random drill. If
   * the pool stops carrying a tell, the drill quietly stops teaching it, and
   * nothing else in the suite would notice. A third of the pool is the bar: low
   * enough to leave room for flavour, high enough that a drill is likely to show
   * the tell the player was just told to hunt.
   */
  it('the drill pool exercises the five tells', () => {
    const share = (holds: (text: string) => boolean) =>
      PRACTICE_PUZZLES.filter(holds).length / PRACTICE_PUZZLES.length;

    // 1. Single-letter words -- A and I, the 50/50 the Primer opens on.
    expect(share((text) => /(^|\s)[AI](\s|[.,!?'])/.test(text))).toBeGreaterThan(1 / 3);
    // 3. Short words -- two and three letters.
    expect(share((text) => /(^|\s)[A-Z]{2,3}(\s|[.,!?])/.test(text))).toBeGreaterThan(1 / 3);
    // 4. Apostrophes.
    expect(share((text) => text.includes("'"))).toBeGreaterThan(1 / 5);
    // 5. Double letters.
    expect(share((text) => /([A-Z])\1/.test(text))).toBeGreaterThan(1 / 3);

    // 2. Frequent letters. The tell is only true if the pool is ordinary
    // English, so assert the shape the player is taught to count on.
    const counts = new Map<string, number>();
    for (const letter of PRACTICE_PUZZLES.join('').replace(/[^A-Z]/g, '')) {
      counts.set(letter, (counts.get(letter) || 0) + 1);
    }
    const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([letter]) => letter);
    expect(ranked[0]).toBe('E');
    // Not the exact ETAOIN order -- 73 short phrases will not reproduce that, and
    // pinning it would freeze the wordlist. Top ten is the honest form of the claim.
    for (const letter of 'ETAOIN') expect(ranked.slice(0, 10)).toContain(letter);
  });

  it('plates.json maps every character to a listed plate', () => {
    const ids = new Set(plates.plateIds);
    for (const plate of Object.values(plates.characterPlate)) {
      expect(ids).toContain(plate);
    }
    for (const plate of Object.values(plates.locationByEdition)) {
      expect(ids).toContain(plate);
    }
  });

  it('every case character has a plate that plates.json lists', () => {
    const ids = new Set(plates.plateIds);
    for (const character of CASE_CHARACTERS) {
      expect(ids).toContain(character.plate);
    }
  });
});
