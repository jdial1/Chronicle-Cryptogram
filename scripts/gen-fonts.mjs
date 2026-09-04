/**
 * Converts the self-hosted woff2 faces in public/fonts into TTFs Android can
 * load, writing them to the design-system module's res/font.
 *
 *   node scripts/gen-fonts.mjs
 *
 * Requires fonttools + brotli:  python -m pip install --user fonttools brotli
 *
 * Converting what already ships, rather than re-downloading from Google Fonts,
 * keeps the two surfaces on byte-identical outlines and avoids introducing a
 * second provenance for the same typefaces. All seven families are OFL.
 *
 * Android resource names must be lowercase with underscores, so the hyphenated
 * web filenames are rewritten here and the mapping is printed for Type.kt.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const SRC = 'public/fonts';
const OUT = 'android/core/designsystem/src/main/res/font';

mkdirSync(OUT, { recursive: true });

const script = `
import sys
from fontTools.ttLib import TTFont
source, target = sys.argv[1], sys.argv[2]
font = TTFont(source)
font.flavor = None          # drop the woff2 wrapper
font.save(target)
`;

const resourceName = (file) =>
  file
    .replace(/\.woff2$/, '')
    .replace(/-/g, '_')
    .toLowerCase();

const converted = [];

for (const file of readdirSync(SRC).filter((f) => f.endsWith('.woff2'))) {
  const name = resourceName(file);
  const target = join(OUT, `${name}.ttf`);
  execFileSync('python', ['-c', script, join(SRC, file), target], { stdio: 'inherit' });
  converted.push({ file, name });
}

converted.sort((a, b) => a.name.localeCompare(b.name));
for (const { file, name } of converted) console.log(`  ${file} -> ${name}.ttf`);
console.log(`\n${converted.length} faces written to ${OUT}`);
