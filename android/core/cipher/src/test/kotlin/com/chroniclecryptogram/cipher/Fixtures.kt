package com.chroniclecryptogram.cipher

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject

/**
 * Loads the golden fixtures generated from the TypeScript by
 * `npm run emit:fixtures`. See src/test/resources/fixtures/README.md.
 *
 * Some fixtures are top-level arrays (one entry per puzzle) and some are objects
 * keyed by the function under test, so both shapes are available.
 */
internal object Fixtures {

    private val json = Json { ignoreUnknownKeys = false }

    fun load(name: String): JsonElement {
        val path = "/fixtures/$name.json"
        val text = checkNotNull(Fixtures::class.java.getResourceAsStream(path)) {
            "Missing fixture $path. Run `npm run emit:fixtures` from the repo root."
        }.bufferedReader().use { it.readText() }
        return json.parseToJsonElement(text)
    }

    fun obj(name: String): JsonObject = load(name).jsonObject

    fun array(name: String): JsonArray = load(name).jsonArray
}
