package com.chroniclecryptogram.cipher

import com.chroniclecryptogram.cipher.model.DailyHintWallet
import com.chroniclecryptogram.cipher.model.GameStats
import com.chroniclecryptogram.cipher.model.PuzzleProgress
import com.chroniclecryptogram.cipher.model.Wallets
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.booleanOrNull
import kotlinx.serialization.json.doubleOrNull
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

/**
 * Local/cloud reconciliation and hostile-input normalization, ported from
 * `src/utils/localStore.ts` lines 31-206. Pinned by the merge-progress,
 * normalize-progress and wallets fixtures.
 *
 * Only the pure half lives here. The storage wrappers (`readLocalProgress`,
 * `persistProgress`, ...) belong to `:core:data`, which is what lets these run
 * as fast JVM tests.
 *
 * Local storage is treated as untrusted throughout: every list is clipped, every
 * number clamped.
 */
object Merge {

    private const val MAX_MAPPINGS = 80
    private const val MAX_SYMBOL_IDS = 26
    private const val MAX_SYMBOL_ID_LENGTH = 80
    private const val MAX_TIMER_SECONDS = 86_400
    private const val MAX_USED = 20

    /** Dedupes, drops empty/overlong entries, caps at 26. Mirrors `clipHintedSymbolIds`. */
    fun clipSymbolIds(ids: List<String?>?): List<String> {
        if (ids == null) return emptyList()
        val out = ArrayList<String>(MAX_SYMBOL_IDS)
        for (id in ids) {
            if (id.isNullOrEmpty() || id.length > MAX_SYMBOL_ID_LENGTH) continue
            if (id !in out) out += id
            if (out.size >= MAX_SYMBOL_IDS) break
        }
        return out
    }

    fun clipSelectedSymbolId(id: String?): String? = clipSymbolIds(listOf(id)).firstOrNull()

    /**
     * Union of local and cloud, cloud first so a local guess wins a conflict.
     *
     * The branch order matters and is not arbitrary: a solved side always beats
     * an unsolved one, two solved sides are decided by the faster timer, and only
     * when neither is solved do timestamps (then a field-wise union) apply.
     */
    fun mergeProgress(
        local: PuzzleProgress?,
        cloud: PuzzleProgress?,
        now: () -> Long = System::currentTimeMillis,
    ): PuzzleProgress? {
        if (cloud == null) return local
        if (local == null) return cloud

        val hintedSymbolIds = clipSymbolIds(cloud.hintedSymbolIds + local.hintedSymbolIds)
        val verifiedSymbolIds = clipSymbolIds(cloud.verifiedSymbolIds + local.verifiedSymbolIds)
        val flaggedSymbolIds = clipSymbolIds(cloud.flaggedSymbolIds + local.flaggedSymbolIds)
            .filter { it !in hintedSymbolIds && it !in verifiedSymbolIds }

        val hintsUsed = maxOf(local.hintsUsed, cloud.hintsUsed, hintedSymbolIds.size)
        val checksUsed = maxOf(local.checksUsed, cloud.checksUsed, verifiedSymbolIds.size)
        val hintsRemaining = minOf(
            local.hintsRemaining,
            cloud.hintsRemaining,
            maxOf(0, Wallets.DAILY_HINTS - hintsUsed),
        )
        val checksRemaining = minOf(
            local.checksRemaining,
            cloud.checksRemaining,
            maxOf(0, Wallets.DAILY_CHECKS - checksUsed),
        )

        if (local.isSolved && cloud.isSolved) {
            val winner = if (local.timerSeconds <= cloud.timerSeconds) local else cloud
            return winner.copy(
                hintedSymbolIds = hintedSymbolIds,
                verifiedSymbolIds = verifiedSymbolIds,
                flaggedSymbolIds = flaggedSymbolIds,
                hintsUsed = hintsUsed,
                checksUsed = checksUsed,
                hintsRemaining = hintsRemaining,
                checksRemaining = checksRemaining,
            )
        }

        if (cloud.isSolved) {
            return cloud.copy(
                hintedSymbolIds = hintedSymbolIds,
                verifiedSymbolIds = verifiedSymbolIds,
                flaggedSymbolIds = flaggedSymbolIds,
                hintsUsed = maxOf(cloud.hintsUsed, hintedSymbolIds.size),
                checksUsed = maxOf(cloud.checksUsed, verifiedSymbolIds.size),
            )
        }

        if (local.isSolved) {
            return local.copy(
                hintedSymbolIds = hintedSymbolIds,
                verifiedSymbolIds = verifiedSymbolIds,
                flaggedSymbolIds = flaggedSymbolIds,
                hintsUsed = maxOf(local.hintsUsed, hintedSymbolIds.size),
                checksUsed = maxOf(local.checksUsed, verifiedSymbolIds.size),
            )
        }

        val localStamp = local.updatedAt ?: 0L
        val cloudStamp = cloud.updatedAt ?: 0L
        if (localStamp != 0L || cloudStamp != 0L) {
            val winner = if (localStamp >= cloudStamp) local else cloud
            return progressSnapshot(
                winner.copy(
                    hintedSymbolIds = hintedSymbolIds,
                    verifiedSymbolIds = verifiedSymbolIds,
                    flaggedSymbolIds = flaggedSymbolIds,
                    hintsUsed = hintsUsed,
                    checksUsed = checksUsed,
                    hintsRemaining = hintsRemaining,
                    checksRemaining = checksRemaining,
                    updatedAt = maxOf(localStamp, cloudStamp),
                ),
                now = now,
            )
        }

        return progressSnapshot(
            PuzzleProgress(
                // Local last, so a local guess wins a conflicting key.
                mappings = LinkedHashMap<String, String>().apply {
                    putAll(cloud.mappings)
                    putAll(local.mappings)
                },
                timerSeconds = maxOf(local.timerSeconds, cloud.timerSeconds),
                hintsUsed = hintsUsed,
                hintsRemaining = hintsRemaining,
                hintedSymbolIds = hintedSymbolIds,
                checksUsed = checksUsed,
                checksRemaining = checksRemaining,
                verifiedSymbolIds = verifiedSymbolIds,
                flaggedSymbolIds = flaggedSymbolIds,
                selectedSymbolId = clipSelectedSymbolId(
                    local.selectedSymbolId?.ifEmpty { null } ?: cloud.selectedSymbolId
                ),
                isSolved = false,
                updatedAt = null,
            ),
            now = now,
        )
    }

    /** Clamps every field. The `updatedAt` key is dropped entirely when absent or zero. */
    fun progressFields(progress: PuzzleProgress): PuzzleProgress {
        val updatedAt = progress.updatedAt?.takeIf { it != 0L }
        return PuzzleProgress(
            mappings = clipMappings(progress.mappings),
            timerSeconds = progress.timerSeconds.coerceIn(0, MAX_TIMER_SECONDS),
            hintsUsed = progress.hintsUsed.coerceIn(0, MAX_USED),
            hintsRemaining = progress.hintsRemaining.coerceIn(0, Wallets.DAILY_HINTS),
            hintedSymbolIds = clipSymbolIds(progress.hintedSymbolIds),
            checksUsed = progress.checksUsed.coerceIn(0, MAX_USED),
            checksRemaining = progress.checksRemaining.coerceIn(0, Wallets.DAILY_CHECKS),
            verifiedSymbolIds = clipSymbolIds(progress.verifiedSymbolIds),
            flaggedSymbolIds = clipSymbolIds(progress.flaggedSymbolIds),
            selectedSymbolId = clipSelectedSymbolId(progress.selectedSymbolId),
            isSolved = progress.isSolved,
            updatedAt = updatedAt,
        )
    }

    /** [progressFields], but a record with no timestamp is stamped with the clock. */
    fun progressSnapshot(
        progress: PuzzleProgress,
        stamped: Boolean = false,
        now: () -> Long = System::currentTimeMillis,
    ): PuzzleProgress = progressFields(
        progress.copy(
            updatedAt = if (stamped) now() else progress.updatedAt?.takeIf { it != 0L } ?: now()
        )
    )

    private fun clipMappings(mappings: Map<String, String>): Map<String, String> {
        val out = LinkedHashMap<String, String>()
        for ((key, letter) in mappings.entries.take(MAX_MAPPINGS)) {
            if (letter.isNotEmpty()) out[key] = letter
        }
        return out
    }

    fun mergeGameStats(local: GameStats, cloud: GameStats?): GameStats {
        if (cloud == null) return local
        if (local.puzzlesSolved > cloud.puzzlesSolved) return local
        return cloud.copy(
            fastestTime = when {
                local.fastestTime == null -> cloud.fastestTime
                cloud.fastestTime == null -> local.fastestTime
                else -> minOf(local.fastestTime, cloud.fastestTime)
            },
            totalTimePlayed = maxOf(local.totalTimePlayed, cloud.totalTimePlayed),
        )
    }

    /** Local first, then cloud, deduped. Order is part of the contract. */
    fun mergeSolvedIds(local: List<String>, cloud: List<String>): List<String> =
        (local + cloud).distinct()

    /**
     * Normalizes a raw saved record. Accepts a JSON string, an object, or
     * anything else (returning null), matching how the TypeScript treats a value
     * read straight out of localStorage.
     *
     * **Deliberate divergence.** When `hintsRemaining`/`checksRemaining` is
     * present but not a number, the TypeScript takes its `Number(...)` branch and
     * NaN survives every clamp, serialising as `null` -- a latent defect pinned by
     * the `nan-remaining` fixture case. An `Int` cannot hold NaN, so this falls
     * back to the same value the absent branch computes. Everything else is exact.
     */
    fun normalizeProgress(raw: JsonElement?): PuzzleProgress? {
        val data = asObject(raw) ?: return null

        val mappings = LinkedHashMap<String, String>()
        (data["mappings"] as? JsonObject)?.entries?.take(MAX_MAPPINGS)?.forEach { (key, value) ->
            val letter = (value as? JsonPrimitive)?.takeIf { it.isString }?.content
            if (!letter.isNullOrEmpty()) mappings[key] = letter
        }

        val hintedSymbolIds = clipSymbolIds(stringList(data["hintedSymbolIds"]))
        val verifiedSymbolIds = clipSymbolIds(stringList(data["verifiedSymbolIds"]))
        val flaggedSymbolIds = clipSymbolIds(stringList(data["flaggedSymbolIds"]))
            .filter { it !in hintedSymbolIds && it !in verifiedSymbolIds }

        val timerSeconds = numberOrZero(data["timerSeconds"])
        val hintsUsed = maxOf(numberOrZero(data["hintsUsed"]), hintedSymbolIds.size.toDouble())
        val checksUsed = maxOf(numberOrZero(data["checksUsed"]), verifiedSymbolIds.size.toDouble())

        val hintsRemaining = remaining(data["hintsRemaining"], Wallets.DAILY_HINTS, hintsUsed)
        val checksRemaining = remaining(data["checksRemaining"], Wallets.DAILY_CHECKS, checksUsed)

        return PuzzleProgress(
            mappings = mappings,
            timerSeconds = clampToInt(timerSeconds, 0, MAX_TIMER_SECONDS),
            hintsUsed = clampToInt(hintsUsed, 0, MAX_USED),
            hintsRemaining = clampToInt(hintsRemaining, 0, Wallets.DAILY_HINTS),
            hintedSymbolIds = hintedSymbolIds,
            checksUsed = clampToInt(checksUsed, 0, MAX_USED),
            checksRemaining = clampToInt(checksRemaining, 0, Wallets.DAILY_CHECKS),
            verifiedSymbolIds = verifiedSymbolIds,
            flaggedSymbolIds = flaggedSymbolIds,
            selectedSymbolId = clipSelectedSymbolId(stringOrNull(data["selectedSymbolId"])),
            isSolved = truthy(data["isSolved"]),
            updatedAt = numberOrZero(data["updatedAt"]).takeIf { it != 0.0 }?.toLong(),
        )
    }

    /**
     * JS: `x == null ? max(0, cap - used) : Number(x)`. When `Number(x)` is NaN
     * the TypeScript leaks NaN; see the divergence note on [normalizeProgress].
     */
    private fun remaining(value: JsonElement?, cap: Int, used: Double): Double {
        if (value == null || value is JsonNull) return maxOf(0.0, cap - used)
        val parsed = (value as? JsonPrimitive)?.doubleOrNull
        return parsed ?: maxOf(0.0, cap - used)
    }

    private fun asObject(raw: JsonElement?): JsonObject? = when {
        raw == null || raw is JsonNull -> null
        raw is JsonObject -> raw
        raw is JsonPrimitive && raw.isString -> runCatching {
            kotlinx.serialization.json.Json.parseToJsonElement(raw.content) as? JsonObject
        }.getOrNull()
        else -> null
    }

    private fun stringList(value: JsonElement?): List<String>? =
        runCatching { value?.jsonArray?.mapNotNull { stringOrNull(it) } }.getOrNull()

    private fun stringOrNull(value: JsonElement?): String? =
        (value as? JsonPrimitive)?.takeIf { it.isString }?.content

    /** JS `Number(x) || 0`: non-numeric, NaN and 0 all collapse to 0. */
    private fun numberOrZero(value: JsonElement?): Double {
        val primitive = value as? JsonPrimitive ?: return 0.0
        if (primitive is JsonNull) return 0.0
        val number = if (primitive.isString) primitive.content.toDoubleOrNull() else primitive.doubleOrNull
        return number?.takeIf { !it.isNaN() } ?: 0.0
    }

    /** JS `Boolean(x)`: any non-empty string is true, so `"yes"` and `"false"` both are. */
    private fun truthy(value: JsonElement?): Boolean {
        val primitive = value as? JsonPrimitive ?: return false
        if (primitive is JsonNull) return false
        primitive.booleanOrNull?.let { return it }
        if (primitive.isString) return primitive.content.isNotEmpty()
        return (primitive.doubleOrNull ?: 0.0) != 0.0
    }

    private fun clampToInt(value: Double, min: Int, max: Int): Int {
        if (value.isNaN()) return min
        return value.toInt().coerceIn(min, max)
    }

    /* ------------------------------------------------------------- wallets */

    /** Old date-keyed entries fail this and are skipped. */
    fun isEditionKey(value: Double): Boolean =
        value == Math.floor(value) && !value.isInfinite() && value >= 0 && value <= 999

    fun clipDailyWallet(edition: Int, used: Double, cap: Int = Wallets.DAILY_HINTS): DailyHintWallet {
        val floored = if (used.isNaN()) 0.0 else Math.floor(used)
        val clipped = minOf(cap.toDouble(), maxOf(0.0, if (floored == 0.0) 0.0 else floored)).toInt()
        return DailyHintWallet(edition = edition, used = clipped, remaining = cap - clipped)
    }

    fun mergeDailyHints(
        local: DailyHintWallet?,
        cloud: DailyHintWallet?,
        edition: Int,
        cap: Int = Wallets.DAILY_HINTS,
    ): DailyHintWallet = clipDailyWallet(
        edition,
        maxOf((local?.used ?: 0).toDouble(), (cloud?.used ?: 0).toDouble()),
        cap,
    )

    fun normalizeDailyHints(
        raw: JsonElement?,
        edition: Int,
        cap: Int = Wallets.DAILY_HINTS,
    ): DailyHintWallet? {
        if (!isEditionKey(edition.toDouble())) return null
        val data = asObject(raw) ?: return null
        val used = (data["used"] as? JsonPrimitive)?.doubleOrNull
        val remaining = (data["remaining"] as? JsonPrimitive)?.doubleOrNull
        val fromParts = when {
            used != null && used.isFinite() -> used
            remaining != null && remaining.isFinite() -> cap - remaining
            else -> 0.0
        }
        return clipDailyWallet(edition, fromParts, cap)
    }

    fun usedHintsFromProgress(
        edition: Int,
        puzzles: List<Pair<String, Int>>,
        progressById: Map<String, PuzzleProgress>,
    ): Int = usedFromProgress(edition, puzzles, progressById) {
        maxOf(it.hintsUsed, it.hintedSymbolIds.size)
    }

    fun usedChecksFromProgress(
        edition: Int,
        puzzles: List<Pair<String, Int>>,
        progressById: Map<String, PuzzleProgress>,
    ): Int = usedFromProgress(edition, puzzles, progressById) {
        maxOf(it.checksUsed, it.verifiedSymbolIds.size)
    }

    private fun usedFromProgress(
        edition: Int,
        puzzles: List<Pair<String, Int>>,
        progressById: Map<String, PuzzleProgress>,
        used: (PuzzleProgress) -> Int,
    ): Int = puzzles.sumOf { (id, editionNumber) ->
        if (editionNumber != edition) 0 else progressById[id]?.let(used) ?: 0
    }
}
