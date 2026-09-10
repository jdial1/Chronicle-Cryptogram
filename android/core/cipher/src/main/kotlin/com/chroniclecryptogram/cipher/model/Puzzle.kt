package com.chroniclecryptogram.cipher.model

import kotlinx.serialization.Serializable

/**
 * Ported from `PuzzleData` in `src/types.ts`, and the shape of every record in
 * `src/data/puzzles.json`.
 *
 * `editionDate` is carried but unused: nothing in `src/` reads it since the
 * campaign reframe replaced calendar gating with progression. It stays because
 * it is useful authoring metadata for scheduling Season 2, and dropping it would
 * mean editing 61 records for no runtime gain.
 */
@Serializable
data class PuzzleData(
    val id: String,
    val editionNumber: Int,
    val title: String,
    val headline: String,
    val subheadline: String,
    val authorOrSource: String,
    val originalText: String,
    /** Display copy. Play mode is [difficultyMode], or `Edition.puzzleMode`. */
    val difficulty: String,
    val difficultyMode: String? = null,
    val editionSlot: String? = null,
    val theme: String,
    val category: String,
    val silhouette: String? = null,
    val hints: List<PuzzleHint> = emptyList(),
    val editionDate: String? = null,
)

@Serializable
data class PuzzleHint(
    val letter: String,
    val clue: String,
)

/** One edition's pair. Either slot can be absent while a season is being authored. */
data class Issue(
    val editionNumber: Int,
    val morning: PuzzleData? = null,
    val night: PuzzleData? = null,
)

/** Player-facing archive chapter. Spans match ISSUE_CHAPTERS in `src/utils/edition.ts`. */
data class IssueChapter(
    val week: Int,
    val kicker: String,
    val title: String,
    val from: Int,
    val to: Int,
)

enum class PuzzleMode { EASY, HARD }
