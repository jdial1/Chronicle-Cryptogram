import { PuzzleData } from '../types';
import { isPrimerPuzzle } from '../utils/edition';
import data from './plates.json';

const PLATE_FILES: Record<string, string> = {
  c1: new URL('./images/c1.png', import.meta.url).href,
  c2: new URL('./images/c2.png', import.meta.url).href,
  c3: new URL('./images/c3.png', import.meta.url).href,
  c4: new URL('./images/c4.png', import.meta.url).href,
  c5: new URL('./images/c5.png', import.meta.url).href,
  c6: new URL('./images/c6.png', import.meta.url).href,
  c7: new URL('./images/c7.png', import.meta.url).href,
  l1: new URL('./images/l1.png', import.meta.url).href,
  l2: new URL('./images/l2.png', import.meta.url).href,
  l3: new URL('./images/l3.png', import.meta.url).href,
  l4: new URL('./images/l4.png', import.meta.url).href,
  l5: new URL('./images/l5.png', import.meta.url).href,
  l6: new URL('./images/l6.png', import.meta.url).href,
  l7: new URL('./images/l7.png', import.meta.url).href,
  l8: new URL('./images/l8.png', import.meta.url).href,
  l9: new URL('./images/l9.png', import.meta.url).href,
  l10: new URL('./images/l10.png', import.meta.url).href,
  l11: new URL('./images/l11.png', import.meta.url).href,
  l12: new URL('./images/l12.png', import.meta.url).href,
};

const { characterPlate: CHARACTER_PLATE, characterFirstEdition: CHARACTER_FIRST_EDITION } = data;
const LOCATION_BY_EDITION: Record<string, string> = data.locationByEdition;

export function plateSrc(id?: string | null) {
  if (!id) return undefined;
  return PLATE_FILES[id];
}

export function plateSrcs() {
  const people: string[] = [];
  const places: string[] = [];
  for (const [id, src] of Object.entries(PLATE_FILES)) {
    (id.startsWith('l') ? places : people).push(src);
  }
  return { people, places };
}

export function articlePlateId(puzzle: PuzzleData) {
  if (isPrimerPuzzle(puzzle)) return undefined;
  const location = LOCATION_BY_EDITION[puzzle.editionNumber];
  if (location) return location;
  const intros = Object.keys(CHARACTER_FIRST_EDITION).filter(
    (id) => CHARACTER_FIRST_EDITION[id] === puzzle.editionNumber
  );
  if (intros.length === 1) return CHARACTER_PLATE[intros[0]];
  if (puzzle.editionNumber === 3) return CHARACTER_PLATE.clara;
  const ids = Object.keys(PLATE_FILES);
  return ids[(puzzle.editionNumber - 1) % ids.length];
}
