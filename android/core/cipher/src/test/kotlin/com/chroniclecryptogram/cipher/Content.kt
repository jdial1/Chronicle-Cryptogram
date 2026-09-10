package com.chroniclecryptogram.cipher

import com.chroniclecryptogram.cipher.model.PuzzleData
import kotlinx.serialization.json.Json

/**
 * The real season, loaded from the canonical `src/data/puzzles.json`. Gradle
 * stages it onto the test classpath (see this module's build script) so there is
 * no second copy to drift.
 *
 * `ignoreUnknownKeys = false` on purpose: a field added on the TypeScript side
 * should fail loudly here rather than be silently dropped.
 */
internal object Content {

    private val json = Json { ignoreUnknownKeys = false }

    val puzzles: List<PuzzleData> by lazy {
        val text = checkNotNull(Content::class.java.getResourceAsStream("/content/puzzles.json")) {
            "puzzles.json is not on the test classpath -- check stageContentForTests."
        }.bufferedReader().use { it.readText() }
        json.decodeFromString(text)
    }
}
