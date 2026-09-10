package com.chroniclecryptogram.content

import android.content.res.AssetManager
import com.chroniclecryptogram.cipher.model.PuzzleData
import kotlinx.serialization.json.Json

/**
 * Decodes the content files from any source of text.
 *
 * The reader is a lambda so the schema guard can run as a plain JVM test against
 * the same staged files, with no emulator and no Robolectric; [fromAssets] is
 * the Android one.
 *
 * `ignoreUnknownKeys = false` is deliberate: a field added or renamed on the
 * TypeScript side should fail loudly at parse time rather than silently
 * disappear. That guard is the reason this is worth a test at all.
 */
class ContentParser(private val read: (String) -> String) {

    private val json = Json { ignoreUnknownKeys = false }

    fun puzzles(): List<PuzzleData> = json.decodeFromString(read("puzzles.json"))

    fun caseFiles(): CaseFileContent = json.decodeFromString(read("caseFiles.json"))

    fun cipherTactics(): CipherTacticsContent = json.decodeFromString(read("cipherTactics.json"))

    fun primerPractice(): PrimerPracticeContent = json.decodeFromString(read("primerPractice.json"))

    companion object {
        /**
         * Reads from `assets/content/`, which Gradle stages from `src/data/` on
         * every build so the web app and this one cannot drift.
         *
         * There used to be a `ContentRepository` class here whose five methods
         * were each `= parser.x()` and nothing else, wrapping this one to hide
         * the lambda. Two of those five were never called.
         */
        fun fromAssets(assets: AssetManager) = ContentParser { name ->
            assets.open("content/$name").bufferedReader().use { it.readText() }
        }
    }
}
