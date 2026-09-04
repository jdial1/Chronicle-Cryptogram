package com.chroniclecryptogram.cipher

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonObject

/**
 * Loads the golden fixtures generated from the TypeScript by
 * `npm run emit:fixtures`. See src/test/resources/fixtures/README.md.
 */
internal object Fixtures {

    private val json = Json { ignoreUnknownKeys = false }

    fun load(name: String): JsonObject {
        val path = "/fixtures/$name.json"
        val text = checkNotNull(Fixtures::class.java.getResourceAsStream(path)) {
            "Missing fixture $path. Run `npm run emit:fixtures` from the repo root."
        }.bufferedReader().use { it.readText() }
        return json.parseToJsonElement(text).jsonObject
    }
}
