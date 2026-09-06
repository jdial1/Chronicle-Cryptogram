package com.chroniclecryptogram.cipher

import com.chroniclecryptogram.cipher.model.PuzzleData
import kotlin.random.Random

/**
 * Extra drills off the back of the Primer, ported from `src/data/primerPractice.ts`.
 *
 * A drill is the Primer's own record with a different quote dropped into it: the
 * same edition number, the same plate, the same wallet. That is what makes it a
 * drill rather than a puzzle -- it teaches the five tells again on new text, and
 * it counts for nothing. [Edition.isPracticePuzzle] is what every persistence
 * path checks to keep it that way.
 *
 * The id is unique per drill because the desk keys progress by puzzle id and a
 * reused id would restore the previous drill's board over the new quote.
 */
object PrimerPractice {

    /** Marks a drill even if the id scheme ever changes. Matches the web string. */
    const val CATEGORY = "Primer Practice"

    /** The Archive's practice slot, which stands in for a Night Extra on the Primer. */
    const val SLOT_ID = "practice_slot"

    private const val HEADLINE = "CODEBREAKER'S DRILL"
    private const val TITLE = "Day 0 - Practice"
    private const val SUBHEADLINE =
        "A second training cipher from the desk. The five tells still hold: " +
            "single-letter words, frequent letters, short words, apostrophes, " +
            "then double letters."

    /** The Primer, which every drill is cut from. */
    private fun template(puzzles: List<PuzzleData>): PuzzleData? =
        puzzles.firstOrNull { Edition.isPrimerPuzzle(it) }

    /**
     * A fresh drill, or null when the season carries no Primer to cut one from.
     *
     * [excludeText] is the quote the player just finished, so "Another Drill"
     * never hands back the one they are looking at. With a pool of one it has to
     * repeat, and does.
     */
    fun create(
        puzzles: List<PuzzleData>,
        pool: List<String>,
        excludeText: String? = null,
        random: Random = Random,
        now: () -> Long = System::currentTimeMillis,
    ): PuzzleData? {
        val primer = template(puzzles) ?: return null
        if (pool.isEmpty()) return null

        val choices = pool.filterNot { it == excludeText }.ifEmpty { pool }
        val stamp = now().toString(36)
        val salt = random.nextInt(46656).toString(36)

        return primer.copy(
            id = "practice_$stamp$salt",
            title = TITLE,
            headline = HEADLINE,
            subheadline = SUBHEADLINE,
            originalText = choices[random.nextInt(choices.size)],
            category = CATEGORY,
            // The Primer's per-letter clues are written for the Primer's quote.
            hints = emptyList(),
        )
    }

    /**
     * The stand-in the Archive lists in the Primer's second slot.
     *
     * It is never opened itself -- tapping it mints a real drill -- so it needs a
     * headline and a category and nothing else true about it.
     */
    fun archiveCard(puzzles: List<PuzzleData>): PuzzleData? = template(puzzles)?.copy(
        id = SLOT_ID,
        title = TITLE,
        headline = HEADLINE,
        category = CATEGORY,
        hints = emptyList(),
    )
}
