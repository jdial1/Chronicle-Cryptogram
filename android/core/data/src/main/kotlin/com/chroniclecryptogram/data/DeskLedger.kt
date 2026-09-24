package com.chroniclecryptogram.data

import com.chroniclecryptogram.cipher.model.PuzzleProgress

/**
 * The desk's books, kept on craft rather than the stopwatch (docs/SOUL.md, "Print
 * the Help Taken"). A page is clean when it was solved with no hint and no check.
 * The web's `utils/deskLedger.ts` keeps the same books.
 */
data class DeskLedger(
    val decoded: Int = 0,
    val clean: Int = 0,
    val hintsTaken: Int = 0,
    val checksTaken: Int = 0,
    /** The solved pages that took no help, for the Archive's clean impression. */
    val cleanPuzzleIds: Set<String> = emptySet(),
) {
    companion object {
        fun isClean(progress: PuzzleProgress?): Boolean =
            progress != null && progress.isSolved && progress.hintsUsed == 0 && progress.checksUsed == 0

        fun of(state: DeskState): DeskLedger {
            val solved = state.solvedPuzzleIds.toSet()
            val boards = solved.map { it to state.progress[it] }
            val clean = boards.filter { (_, progress) -> isClean(progress) }.map { it.first }.toSet()
            return DeskLedger(
                decoded = solved.size,
                clean = clean.size,
                hintsTaken = boards.sumOf { it.second?.hintsUsed ?: 0 },
                checksTaken = boards.sumOf { it.second?.checksUsed ?: 0 },
                cleanPuzzleIds = clean,
            )
        }
    }
}
