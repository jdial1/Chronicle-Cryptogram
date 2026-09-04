package com.chroniclecryptogram.cipher

import com.chroniclecryptogram.cipher.model.Issue
import com.chroniclecryptogram.cipher.model.IssueChapter
import com.chroniclecryptogram.cipher.model.PuzzleData
import com.chroniclecryptogram.cipher.model.PuzzleMode

/**
 * Progression gating, ported from `src/utils/edition.ts` and pinned by the
 * progression fixture.
 *
 * The season unlocks by progress, not by calendar date: there is no clock in
 * here, which is what makes all of it deterministically testable.
 */
object Edition {

    /** Player-facing archive chapters. Spans match WEEKLY_TENTPOLES; titles are two words. */
    val issueChapters: List<IssueChapter> = listOf(
        IssueChapter(0, "Training", "The Primer", 0, 0),
        IssueChapter(1, "Chapter I", "The Panic", 1, 6),
        IssueChapter(2, "Chapter II", "Sins Exposed", 7, 13),
        IssueChapter(3, "Chapter III", "Systemic Rot", 14, 20),
        IssueChapter(4, "Chapter IV", "Rat Trap", 21, 27),
        IssueChapter(5, "Chapter V", "New Dawn", 28, 30),
    )

    fun puzzleMode(puzzle: PuzzleData): PuzzleMode = when (puzzle.difficultyMode) {
        "Hard" -> PuzzleMode.HARD
        "Easy" -> PuzzleMode.EASY
        else -> if (puzzle.difficulty == "Hard" || puzzle.difficulty == "Master") {
            PuzzleMode.HARD
        } else {
            PuzzleMode.EASY
        }
    }

    fun isHardPuzzle(puzzle: PuzzleData): Boolean = puzzleMode(puzzle) == PuzzleMode.HARD

    fun matchesMode(puzzle: PuzzleData, mode: PuzzleMode): Boolean = puzzleMode(puzzle) == mode

    /** Night extra: the evening slot, or a hard plate (legacy records carry no slot). */
    fun isNightEdition(puzzle: PuzzleData): Boolean =
        puzzle.editionSlot == "Evening" || isHardPuzzle(puzzle)

    fun isMorningEdition(puzzle: PuzzleData): Boolean = !isNightEdition(puzzle)

    fun isPracticePuzzle(id: String, category: String): Boolean =
        category == "Primer Practice" || id.startsWith("practice_")

    fun isPracticePuzzle(puzzle: PuzzleData): Boolean = isPracticePuzzle(puzzle.id, puzzle.category)

    fun isPrimerPuzzle(puzzle: PuzzleData): Boolean =
        puzzle.editionNumber == 0 && !isPracticePuzzle(puzzle)

    fun morningPuzzleForEdition(puzzles: List<PuzzleData>, edition: Int): PuzzleData? =
        puzzles.firstOrNull {
            it.editionNumber == edition && isMorningEdition(it) && !isPrimerPuzzle(it)
        }

    fun nightPuzzleForEdition(puzzles: List<PuzzleData>, edition: Int): PuzzleData? =
        puzzles.firstOrNull { it.editionNumber == edition && isNightEdition(it) }

    /** Highest edition in the season. Edition 0 is the Primer, so a season of 30 returns 30. */
    fun maxEdition(puzzles: List<PuzzleData>): Int =
        puzzles.fold(0) { max, puzzle -> maxOf(max, puzzle.editionNumber) }

    fun editionLabel(edition: Int): String =
        if (edition == 0) "The Primer" else "Edition No. $edition"

    fun articleDek(puzzle: PuzzleData): String =
        puzzle.subheadline.replace(DEK_PREFIX, "")

    fun articleByline(puzzle: PuzzleData): String =
        puzzle.authorOrSource
            .replace(NIGHT_POST_PREFIX, "")
            .replace(JOURNAL_PREFIX, "")

    fun isNightUnlocked(
        puzzles: List<PuzzleData>,
        solvedPuzzleIds: List<String>,
        edition: Int,
    ): Boolean = puzzles.any {
        it.editionNumber == edition && isMorningEdition(it) && it.id in solvedPuzzleIds
    }

    /**
     * Highest edition the player may open: 1, or one past the last contiguously
     * solved morning, clamped to the end of the season.
     *
     * Contiguous rather than max, so a hole in the run cannot be skipped and a
     * hand-edited save cannot jump the season. Edition 0 (the Primer) sits
     * outside the walk -- it is optional and always open.
     */
    fun frontPageEdition(puzzles: List<PuzzleData>, solvedPuzzleIds: List<String>): Int {
        val last = maxEdition(puzzles)
        var edition = 1
        while (edition < last) {
            val morning = morningPuzzleForEdition(puzzles, edition) ?: break
            if (morning.id !in solvedPuzzleIds) break
            edition += 1
        }
        return edition
    }

    fun currentMorningPuzzle(puzzles: List<PuzzleData>, solvedPuzzleIds: List<String>): PuzzleData? =
        morningPuzzleForEdition(puzzles, frontPageEdition(puzzles, solvedPuzzleIds))

    /** The last edition is reached and its Night Extra broken -- the season is over. */
    fun isSeasonComplete(puzzles: List<PuzzleData>, solvedPuzzleIds: List<String>): Boolean {
        val last = maxEdition(puzzles)
        if (frontPageEdition(puzzles, solvedPuzzleIds) != last) return false
        val finale = nightPuzzleForEdition(puzzles, last) ?: return false
        return finale.id in solvedPuzzleIds
    }

    /**
     * Falls back to the last chapter outside the declared spans. Season 2 content
     * added without extending [issueChapters] would silently render as "New Dawn",
     * which is why `src/data/season.test.ts` asserts chapter coverage.
     */
    fun chapterForEdition(editionNumber: Int): IssueChapter =
        issueChapters.firstOrNull { editionNumber >= it.from && editionNumber <= it.to }
            ?: issueChapters.last()

    fun groupIssuesByChapter(issues: List<Issue>): List<Pair<IssueChapter, List<Issue>>> {
        val chapters = ArrayList<Pair<IssueChapter, MutableList<Issue>>>()
        for (issue in issues) {
            val meta = chapterForEdition(issue.editionNumber)
            val last = chapters.lastOrNull()
            if (last == null || last.first.week != meta.week) {
                chapters += meta to mutableListOf(issue)
            } else {
                last.second += issue
            }
        }
        return chapters.map { it.first to it.second.toList() }
    }

    /** Every issue in the season, locked or not. Callers render lock state from [frontPageEdition]. */
    fun groupIssues(puzzles: List<PuzzleData>): List<Issue> {
        val grouped = LinkedHashMap<Int, Issue>()

        for (puzzle in puzzles) {
            if (!puzzle.id.startsWith("day_") || puzzle.category != "Daily Featured") continue
            val existing = grouped[puzzle.editionNumber] ?: Issue(puzzle.editionNumber)
            grouped[puzzle.editionNumber] =
                if (isNightEdition(puzzle)) existing.copy(night = puzzle)
                else existing.copy(morning = puzzle)
        }

        return grouped.values
            .filter { it.morning != null || it.night != null }
            .sortedBy { it.editionNumber }
    }

    private val DEK_PREFIX = Regex("^(?:LATE CITY FINAL|NIGHT EXTRA)\\s+[—–-]\\s+")
    private val NIGHT_POST_PREFIX = Regex("^The Chronicle Night Post(?:\\s+[—–-]|,)\\s*")
    private val JOURNAL_PREFIX = Regex("^Journal Entry\\s*[-—–]\\s*")
}
