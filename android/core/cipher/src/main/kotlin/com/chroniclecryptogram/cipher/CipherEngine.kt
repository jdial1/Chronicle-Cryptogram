package com.chroniclecryptogram.cipher

import com.chroniclecryptogram.cipher.model.CipherCell
import com.chroniclecryptogram.cipher.model.CipherSymbol
import com.chroniclecryptogram.cipher.model.CryptogramWord
import com.chroniclecryptogram.cipher.model.HomophonicCipherMap
import com.chroniclecryptogram.cipher.model.SymbolFrequency
import com.chroniclecryptogram.cipher.model.SymbolInfo

/**
 * Ported from `src/utils/cipherEngine.ts`. Pinned by the cipher-alphabet,
 * cipher-words and frequencies fixtures.
 *
 * Nothing here may be "cleaned up" without regenerating those fixtures: the
 * output is a wire format between two independent implementations of the same
 * game, and the cipher is recomputed per device rather than stored.
 */
object CipherEngine {

    /** Hard puzzles split the three commonest letters across two glyphs each. */
    private val homophoneAllocations = mapOf("E" to 2, "T" to 2, "A" to 2)

    private val alphabet = ('A'..'Z').map(Char::toString)

    /**
     * Seeded Fisher-Yates over the palette, then a per-letter allocation walk.
     *
     * [seed] is `puzzle.id + puzzle.originalText`, matching `puzzleState.ts`.
     * [homophonic] is `isHardPuzzle(puzzle)`.
     */
    fun buildCipherAlphabet(seed: String, homophonic: Boolean = true): HomophonicCipherMap {
        val symbols = ZodiacSymbolsPalette.toMutableList()
        val swaps = Lcg.shuffleOrder(seed, symbols.size)
        for (i in symbols.size - 1 downTo 1) {
            val j = swaps[i]
            val temp = symbols[i]
            symbols[i] = symbols[j]
            symbols[j] = temp
        }

        val letterToSymbols = LinkedHashMap<String, List<CipherSymbol>>()
        val symbolIdToInfo = LinkedHashMap<String, SymbolInfo>()
        var cursor = 0

        for (letter in alphabet) {
            val count = if (homophonic) homophoneAllocations[letter] ?: 1 else 1
            val allocated = ArrayList<CipherSymbol>(count)

            repeat(count) { index ->
                val base = symbols[cursor % symbols.size]
                val uniqueId =
                    if (homophonic) "homo_${letter}_${index}_${base.id}" else "mono_${letter}_${base.id}"
                val name = if (homophonic) "${base.name} (Variant ${index + 1})" else base.name

                allocated += base.copy(id = uniqueId, name = name)
                symbolIdToInfo[uniqueId] = SymbolInfo(base.glyph, letter, name)
                cursor++
            }

            letterToSymbols[letter] = allocated
        }

        return HomophonicCipherMap(letterToSymbols, symbolIdToInfo)
    }

    /**
     * Splits [text] on whitespace and maps each character to a glyph.
     *
     * Homophones cycle round-robin by occurrence *across the whole message*, not
     * per word -- that is what suppresses frequency counting on Hard puzzles.
     *
     * A character is a letter only if uppercasing it yields a single A-Z. The
     * TypeScript tests `/^[A-Z]$/` against `char.toUpperCase()`, so anything
     * outside ASCII falls through to punctuation on both sides.
     */
    fun parseCryptogramText(text: String, cipherMap: HomophonicCipherMap): List<CryptogramWord> {
        val rawWords = text.trim().split(WHITESPACE)
        val letterOccurrences = HashMap<String, Int>()

        return rawWords.mapIndexed { wordIndex, rawWord ->
            val cells = rawWord.map { char ->
                val upper = char.uppercaseChar()
                val homophones = if (upper in 'A'..'Z') cipherMap.letterToSymbols[upper.toString()] else null

                if (homophones != null) {
                    val key = upper.toString()
                    val occurrence = letterOccurrences[key] ?: 0
                    val selected = homophones[occurrence % homophones.size]
                    letterOccurrences[key] = occurrence + 1
                    CipherCell(
                        symbolId = selected.id,
                        targetLetter = key,
                        isPunctuation = false,
                        char = selected.glyph,
                    )
                } else {
                    CipherCell(
                        symbolId = "punct_$char",
                        targetLetter = char.toString(),
                        isPunctuation = true,
                        char = char.toString(),
                    )
                }
            }
            CryptogramWord(id = "word_$wordIndex", symbols = cells)
        }
    }

    /**
     * The glyph tally, ordered by count descending.
     *
     * Ties keep first-appearance order. JavaScript's `Array.sort` is stable and
     * iterates `Object.entries` in insertion order; [LinkedHashMap] plus Kotlin's
     * stable [sortedByDescending] reproduces that. Using a plain [HashMap] here
     * would reorder ties and break the frequencies fixture.
     */
    fun calculateSymbolFrequencies(
        words: List<CryptogramWord>,
        cipherMap: HomophonicCipherMap,
    ): List<SymbolFrequency> {
        val counts = LinkedHashMap<String, Int>()
        val targetLetters = HashMap<String, String>()
        var totalLetters = 0

        for (word in words) {
            for (cell in word.symbols) {
                if (cell.isPunctuation) continue
                counts[cell.symbolId] = (counts[cell.symbolId] ?: 0) + 1
                targetLetters[cell.symbolId] = cell.targetLetter
                totalLetters++
            }
        }

        return counts.entries
            .map { (symbolId, count) ->
                SymbolFrequency(
                    symbolId = symbolId,
                    glyph = cipherMap.symbolIdToInfo[symbolId]?.glyph ?: "?",
                    count = count,
                    percentage = if (totalLetters > 0) count.toDouble() / totalLetters * 100 else 0.0,
                    mappedLetter = "",
                    targetLetter = targetLetters[symbolId].orEmpty(),
                )
            }
            .sortedByDescending { it.count }
    }

    private val WHITESPACE = Regex("\\s+")
}
