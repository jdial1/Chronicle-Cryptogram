package com.chroniclecryptogram.content

import android.content.res.AssetManager
import com.chroniclecryptogram.cipher.model.PuzzleData
import kotlinx.serialization.json.Json

/**
 * Reads the season and its supporting copy out of `assets/content/`.
 *
 * Those files are not committed. Gradle stages them from `src/data/` on every
 * build, so the web app and the Android app cannot drift: there is exactly one
 * copy of the content in the repository and both surfaces read it.
 *
 * The parsing lives in [ContentParser] so the schema guard can run as a plain
 * JVM test against the same staged files, with no emulator and no Robolectric.
 */
class ContentRepository(private val assets: AssetManager) {

    private val parser = ContentParser { name ->
        assets.open("content/$name").bufferedReader().use { it.readText() }
    }

    fun puzzles(): List<PuzzleData> = parser.puzzles()

    fun caseFiles(): CaseFileContent = parser.caseFiles()

    fun cipherTactics(): CipherTacticsContent = parser.cipherTactics()

    fun primerPractice(): PrimerPracticeContent = parser.primerPractice()

    fun plates(): PlateContent = parser.plates()
}

/**
 * Decodes the content files from any source of text.
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

    fun plates(): PlateContent = json.decodeFromString(read("plates.json"))
}
