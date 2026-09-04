/**
 * Builds `chronicle_glyphs.ttf` -- a single font containing exactly the 54 cipher
 * glyphs -- and writes it into the design system's res/font.
 *
 *   cd .fontsrc && npm install        (one time; sources are OFL Noto builds)
 *   node scripts/gen-glyph-font.mjs
 *
 * Requires fonttools + brotli:  python -m pip install --user fonttools brotli
 *
 * ## Why this exists
 *
 * The palette spans Latin Extended, Number Forms, Canadian Aboriginal, Lisu,
 * Hangul, Greek, APL, Math Operators and Geometric Shapes. Measured against the
 * eleven typefaces the game already bundles, **25 of the 54 are covered by none
 * of them** -- every one of those faces covers the same 29 ASCII characters and
 * nothing else.
 *
 * On the web the browser silently falls back to a system font. On Android that
 * fallback is the device's Noto chain, which varies by OEM, by Android version,
 * and by whether the device ships CJK at all. A missing glyph renders as tofu,
 * and a cryptogram whose glyphs differ between devices is not the same puzzle.
 *
 * Subsetting each Noto source to just the codepoints it owns and merging them
 * gives one small file that renders identically everywhere, forever.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';

const PALETTE = 'android/core/cipher/src/test/resources/fixtures/palette.json';
const SOURCES = '.fontsrc/node_modules/@fontsource';
const OUT_DIR = 'android/core/designsystem/src/main/res/font';
const OUT = `${OUT_DIR}/chronicle_glyphs.ttf`;

if (!existsSync(SOURCES)) {
  console.error(
    `Missing ${SOURCES}.\nRun:  cd .fontsrc && npm install\n` +
      'Those packages are OFL Noto builds and are only needed to regenerate this font.'
  );
  process.exit(1);
}

mkdirSync(OUT_DIR, { recursive: true });

const python = String.raw`
import glob, json, os, sys
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.recordingPen import DecomposingRecordingPen

BS = chr(92)
palette = json.load(open(sys.argv[1], encoding='utf-8'))
need = {ord(s['glyph']) for s in palette['symbols']}
sources, out = sys.argv[2], sys.argv[3]
work = os.path.join(os.path.dirname(out), '_glyphwork')
os.makedirs(work, exist_ok=True)

files = [p.replace(BS, '/') for p in glob.glob(sources + '/*/files/*.woff2')]
files = [p for p in files if '-400-normal' in p]

scored = []
for path in files:
    try:
        font = TTFont(path)
        cmap = set()
        for t in font['cmap'].tables:
            cmap |= set(t.cmap.keys())
        if 'glyf' not in font:
            continue
        scored.append((len(need & cmap), path, cmap, font['head'].unitsPerEm))
    except Exception:
        continue

# Greedy set cover: fewest source files that supply all 54 codepoints.
scored.sort(key=lambda x: -x[0])
picked, covered = [], set()
for _, path, cmap, upem in scored:
    new = (cmap & need) - covered
    if not new:
        continue
    picked.append((path, new, upem))
    covered |= new

missing = need - covered
if missing:
    raise SystemExit('No source font covers: ' + ', '.join('U+%04X' % c for c in sorted(missing)))

upems = {upem for _, _, upem in picked}
if len(upems) != 1:
    raise SystemExit('Sources disagree on unitsPerEm: %s -- outlines would need scaling' % upems)

def subset_to(path, cps, target):
    raw = os.path.join(work, 'raw.ttf')
    font = TTFont(path)
    font.flavor = None
    font.save(raw)
    subset.main([
        raw,
        '--unicodes=' + ','.join('U+%04X' % c for c in sorted(cps)),
        '--output-file=' + target,
        '--no-hinting',
        '--notdef-outline',
        '--drop-tables+=DSIG,MATH',
        '--layout-features=',
    ])
    os.remove(raw)
    return TTFont(target)

# The biggest contributor becomes the base; the rest have their outlines copied
# in. fontTools' own merger cannot do this -- it trips over Noto Sans Math's MATH
# table and over head/OS2 fields that differ between Noto families -- and copying
# glyf outlines directly is both simpler and deterministic.
base_path, base_cps, _ = picked[0]
base = subset_to(base_path, base_cps, os.path.join(work, 'base.ttf'))
print('  %-58s %2d glyphs (base)' % (os.path.basename(base_path), len(base_cps)))

base_cmap = base['cmap'].getBestCmap()
glyf, hmtx = base['glyf'], base['hmtx']

for index, (path, cps, _) in enumerate(picked[1:], start=1):
    donor = subset_to(path, cps, os.path.join(work, 'donor%d.ttf' % index))
    donor_cmap = donor['cmap'].getBestCmap()
    donor_glyf, donor_hmtx = donor['glyf'], donor['hmtx']

    for cp in sorted(cps):
        src_name = donor_cmap[cp]
        name = 'uni%04X' % cp
        pen = TTGlyphPen(None)
        # Flatten composites so the copy carries no references to glyphs that
        # are not coming with it.
        recorder = DecomposingRecordingPen(donor_glyf)
        donor_glyf[src_name].draw(recorder, donor_glyf)
        recorder.replay(pen)
        glyf[name] = pen.glyph()
        hmtx[name] = donor_hmtx[src_name]
        base_cmap[cp] = name

    print('  %-58s %2d glyphs' % (os.path.basename(path), len(cps)))
    donor.close()
    os.remove(os.path.join(work, 'donor%d.ttf' % index))

base['glyf'].glyphOrder = base.getGlyphOrder()
for table in base['cmap'].tables:
    if table.isUnicode():
        table.cmap = dict(base_cmap)
base['maxp'].numGlyphs = len(base.getGlyphOrder())

name = base['name']
labels = {1: 'Chronicle Glyphs', 3: 'Chronicle Glyphs', 4: 'Chronicle Glyphs',
          6: 'ChronicleGlyphs', 16: 'Chronicle Glyphs'}
for record in list(name.names):
    if record.nameID in labels:
        name.setName(labels[record.nameID], record.nameID,
                     record.platformID, record.platEncID, record.langID)

base.save(out)

check = TTFont(out)
have = set()
for t in check['cmap'].tables:
    have |= set(t.cmap.keys())
still = need - have
if still:
    raise SystemExit('Merged font is missing: ' + ', '.join('U+%04X' % c for c in sorted(still)))

for f in glob.glob(os.path.join(work, '*')):
    os.remove(f)
os.rmdir(work)
print()
print('%d of %d glyphs present, %.1f KB -> %s' % (len(need & have), len(need), os.path.getsize(out) / 1024, out))
`;

execFileSync('python', ['-c', python, PALETTE, SOURCES, OUT], { stdio: 'inherit' });
