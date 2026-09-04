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
