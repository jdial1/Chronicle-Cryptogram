package com.chroniclecryptogram.content

import com.chroniclecryptogram.cipher.Edition
import com.chroniclecryptogram.cipher.model.PuzzleData

/** One assembled line of a dossier: prose, or a quote the player decoded. */
data class CaseNoteSegment(val kind: Kind, val value: String) {
    enum class Kind { TEXT, QUOTE }
}

data class AssembledFragment(
    val characterId: String,
    val editionNumber: Int,
    val title: String,
    val segments: List<CaseNoteSegment>,
)

/**
 * Assembles case-file dossiers from what the player has actually solved, ported
 * from the behaviour half of `src/data/caseFiles.ts` and pinned by the
 * case-files fixture.
 *
 * The rule that gives the feature its point: a `quote` part splices in the
 * decoded quote for its slot, and a `text` part carrying a `when` appears only
 * once that slot is solved. **A fragment with no quote at all is withheld
 * entirely** -- otherwise the dossier would read as a table of contents for
 * editions the player has not reached.
 */
object CaseFiles {

    private const val MORNING = "Morning"
    private const val EVENING = "Evening"

    private val endsInStop = Regex("[.!?]$")
    private val leadingPeriods = Regex("^\\s*[.]+(?=\\s|$)")
    private val startsWithClause = Regex("^[,;:]")
    private val startsWithLower = Regex("^[a-z]")
    private val startsWithPunctuation = Regex("^[,:;]")

    fun assemble(
        fragment: CaseFragment,
        puzzles: List<PuzzleData>,
        solvedPuzzleIds: Set<String>,
    ): AssembledFragment? {
        val segments = ArrayList<CaseNoteSegment>()
        var hasQuote = false

        for (part in fragment.parts) {
            if (!partVisible(part, fragment.editionNumber, puzzles, solvedPuzzleIds)) continue

            if (part.kind == "quote") {
                val slot = part.slot ?: continue
                val puzzle = puzzleForSlot(fragment.editionNumber, slot, puzzles) ?: continue
                segments += CaseNoteSegment(CaseNoteSegment.Kind.QUOTE, puzzle.originalText)
                hasQuote = true
                continue
            }

            pushText(segments, part.value.orEmpty())
        }

        // No decoded quote means nothing was earned, so the fragment is withheld.
        if (!hasQuote) return null

        return AssembledFragment(
            characterId = fragment.characterId,
            editionNumber = fragment.editionNumber,
            title = fragment.title,
            segments = segments,
        )
    }

    fun unlockedFragmentsForCharacter(
        characterId: String,
        content: CaseFileContent,
        puzzles: List<PuzzleData>,
        solvedPuzzleIds: Set<String>,
    ): List<AssembledFragment> = content.fragments
        .filter { it.characterId == characterId }
        .mapNotNull { assemble(it, puzzles, solvedPuzzleIds) }

    fun hasDecodedFragments(
        content: CaseFileContent,
        puzzles: List<PuzzleData>,
        solvedPuzzleIds: Set<String>,
    ): Boolean = content.fragments.any { assemble(it, puzzles, solvedPuzzleIds) != null }

    /**
     * Appends prose, stitching the seam where it follows a decoded quote.
     *
     * The authored text assumes the quote ends the sentence, so a continuation
     * needs the quote's full stop removed and the stray leading period dropped.
     * Without this the dossier reads ". , and he paid it." instead of
     * "..., and he paid it."
     */
    private fun pushText(segments: MutableList<CaseNoteSegment>, raw: String) {
        var value = raw
        val last = segments.lastOrNull()

        if (last != null && last.kind == CaseNoteSegment.Kind.QUOTE) {
            val ended = endsInStop.containsMatchIn(last.value)
            value = leadingPeriods.replace(value, "")
            val next = value.trim()
            if (next.isEmpty()) return
            if (ended && (startsWithClause.containsMatchIn(next) || startsWithLower.containsMatchIn(next))) {
                segments[segments.lastIndex] = last.copy(
                    value = endsInStop.replace(last.value, "")
                )
            }
            value = if (startsWithPunctuation.containsMatchIn(next)) next else " $next"
        }

        if (value.isBlank()) return
        segments += CaseNoteSegment(CaseNoteSegment.Kind.TEXT, value)
    }

    private fun partVisible(
        part: CasePart,
        edition: Int,
        puzzles: List<PuzzleData>,
        solvedPuzzleIds: Set<String>,
    ): Boolean {
        if (part.kind == "quote") {
            val slot = part.slot ?: return false
            return slotSolved(edition, slot, puzzles, solvedPuzzleIds)
        }
        val gate = part.`when` ?: return true
        return slotSolved(edition, gate, puzzles, solvedPuzzleIds)
    }

    private fun puzzleForSlot(edition: Int, slot: String, puzzles: List<PuzzleData>): PuzzleData? =
        when (slot) {
            EVENING -> Edition.nightPuzzleForEdition(puzzles, edition)
            MORNING -> Edition.morningPuzzleForEdition(puzzles, edition)
            else -> null
        }

    private fun slotSolved(
        edition: Int,
        slot: String,
        puzzles: List<PuzzleData>,
        solvedPuzzleIds: Set<String>,
    ): Boolean = puzzleForSlot(edition, slot, puzzles)?.id in solvedPuzzleIds
}
