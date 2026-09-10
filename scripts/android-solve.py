"""Prints the glyph -> letter mapping that solves a puzzle.

The board reports each cell as "Cipher glyph <g>, unassigned", so knowing which
letter each glyph stands for is enough to solve it in one tap per glyph. That
mapping is already in the golden fixtures -- `cipher-words.json` carries every
cell of all 61 puzzles with its glyph and its true letter -- so it is read from
there rather than derived again or guessed from the screen.

Usage:  python scripts/android-solve.py <puzzleId>
Output: one "glyph<TAB>letter" line per distinct glyph.
"""

import io
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FIXTURE = os.path.join(
    ROOT, "android", "core", "cipher", "src", "test", "resources",
    "fixtures", "cipher-words.json",
)


def mapping_for(puzzle_id):
    entries = json.load(io.open(FIXTURE, encoding="utf-8"))
    entry = next((e for e in entries if e["puzzleId"] == puzzle_id), None)
    if entry is None:
        known = ", ".join(sorted(e["puzzleId"] for e in entries)[:5])
        raise SystemExit(f"no puzzle {puzzle_id!r} in the fixture (e.g. {known}, ...)")

    pairs = {}
    for word in entry["words"]:
        for cell in word["symbols"]:
            # Punctuation is printed, not solved.
            if cell.get("isPunctuation"):
                continue
            glyph = cell.get("char")
            letter = cell.get("targetLetter")
            if not glyph or not letter:
                continue
            # One glyph stands for exactly one letter; a disagreement would mean
            # the fixture and the engine had drifted apart.
            if pairs.setdefault(glyph, letter) != letter:
                raise SystemExit(f"glyph {glyph!r} maps to two letters")
    return pairs


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    out = io.open(sys.stdout.fileno(), mode="w", encoding="utf-8", closefd=False)
    for glyph, letter in mapping_for(sys.argv[1]).items():
        out.write(f"{glyph}\t{letter}\n")
    out.flush()
