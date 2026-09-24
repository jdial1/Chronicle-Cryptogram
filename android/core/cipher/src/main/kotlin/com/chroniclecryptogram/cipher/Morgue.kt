package com.chroniclecryptogram.cipher

import com.chroniclecryptogram.cipher.model.PuzzleData

/**
 * The paper's morgue: its own clippings, searched by a word (docs/SOUL-FEATURES.md,
 * idea 27). Only pages the agent has decoded answer, so the search can never reveal a
 * line, or confirm a guess, from a page still open. The web's `game/morgue.ts`
 * answers the same way.
 */
object Morgue {

    const val MIN_QUERY = 3

    fun search(puzzles: List<PuzzleData>, solvedPuzzleIds: Set<String>, query: String): List<PuzzleData> {
        val needle = query.trim().uppercase()
        if (needle.length < MIN_QUERY) return emptyList()
        return puzzles.filter { puzzle ->
            puzzle.id in solvedPuzzleIds &&
                "${puzzle.originalText} ${puzzle.headline} ${puzzle.subheadline}".uppercase().contains(needle)
        }
    }
}
