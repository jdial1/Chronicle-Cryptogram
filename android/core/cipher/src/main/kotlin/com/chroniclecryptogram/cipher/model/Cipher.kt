package com.chroniclecryptogram.cipher.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/** Ported from `CipherSymbol` in `src/types.ts`. */
@Serializable
data class CipherSymbol(
    val id: String,
    val glyph: String,
    val name: String,
    val category: SymbolCategory,
)

@Serializable
enum class SymbolCategory {
    @SerialName("zodiac") ZODIAC,
    @SerialName("geometric") GEOMETRIC,
    @SerialName("alchemical") ALCHEMICAL,
    @SerialName("runic") RUNIC,
    @SerialName("inverted") INVERTED,
}

/**
 * One rendered position in a word. Punctuation keeps its literal character and
 * carries a `punct_<char>` id, matching the TypeScript so cell ids line up.
 */
@Serializable
data class CipherCell(
    val symbolId: String,
    val targetLetter: String,
    val isPunctuation: Boolean = false,
    val char: String? = null,
)

/** Ported from `CryptogramWord` in `src/types.ts`. Ids are `word_<index>`. */
@Serializable
data class CryptogramWord(
    val id: String,
    val symbols: List<CipherCell>,
)

/**
 * The per-puzzle cipher. [letterToSymbols] holds allocation order per letter --
 * Hard puzzles give E, T and A two glyphs each, and [parseCryptogramText] cycles
 * them round-robin to blunt frequency counting.
 */
data class HomophonicCipherMap(
    val letterToSymbols: Map<String, List<CipherSymbol>>,
    val symbolIdToInfo: Map<String, SymbolInfo>,
)

data class SymbolInfo(
    val glyph: String,
    val targetLetter: String,
    val name: String,
)

/** One row of the glyph tally. Ordered by [count] descending, ties by first appearance. */
data class SymbolFrequency(
    val symbolId: String,
    val glyph: String,
    val count: Int,
    val percentage: Double,
    val mappedLetter: String,
    val targetLetter: String,
)
