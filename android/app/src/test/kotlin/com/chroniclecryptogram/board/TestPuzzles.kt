package com.chroniclecryptogram.board

import com.chroniclecryptogram.cipher.Edition
import com.chroniclecryptogram.cipher.model.PuzzleData
import kotlinx.serialization.json.Json
import java.io.File

/**
 * The season, read straight from `src/data/puzzles.json`.
 *
 * Six test files had each written this out: walk up two directories, decode
 * strictly, take edition one's morning puzzle. Twelve copies of the relative
 * path between them, which is the part that breaks if the module ever moves.
 *
 * Strict decoding on purpose, matching `ContentParser`: a schema change on the
 * TypeScript side should fail these tests rather than quietly drop a field.
 *
 * Parsed once for the whole suite. It is ~76 KB and thirty-one puzzles, and the
 * tests only read it.
 */
internal object TestPuzzles {

    val all: List<PuzzleData> by lazy {
        val root = File("../..").canonicalFile
        Json { ignoreUnknownKeys = false }
            .decodeFromString(File(root, "src/data/puzzles.json").readText())
    }

    /** Edition one's morning puzzle: the first real board a player meets. */
    val first: PuzzleData by lazy { Edition.morningPuzzleForEdition(all, 1) ?: all.first() }
}
