package com.chroniclecryptogram.data

import com.chroniclecryptogram.cipher.model.DailyHintWallet
import com.chroniclecryptogram.cipher.model.GameStats
import com.chroniclecryptogram.cipher.model.PuzzleProgress

/**
 * The cloud half of the desk.
 *
 * An interface rather than a Firebase class so the merge and sync rules can be
 * tested against a fake, and so a build with no Firebase configuration can
 * substitute [NoCloudDesk] and still run the whole game offline.
 *
 * **The document paths are fixed by `firestore.rules`**, which is shared with
 * the web app and must not be edited for this port. They are, exactly:
 *
 *   users/{uid}
 *   users/{uid}/progress/{puzzleId}
 *   users/{uid}/dailyHints/{edition}
 *   users/{uid}/dailyChecks/{edition}
 *   starts/{uid}_{puzzleId}
 *   solves/{uid}_{puzzleId}
 *   puzzleStats/{puzzleId}
 *   leaderboard/{puzzleId}/entries/{uid}
 */
interface CloudDesk {

    /** Null when nothing has been synced for this account yet. */
    suspend fun fetch(uid: String): CloudSnapshot?

    suspend fun pushProgress(uid: String, puzzleId: String, progress: PuzzleProgress)

    suspend fun pushWallets(
        uid: String,
        edition: Int,
        hints: DailyHintWallet,
        checks: DailyHintWallet,
    )

    /**
     * Writes the user document.
     *
     * [profile] is not optional decoration: `firestore.rules` requires
     * displayName, codename, titleBadge and countryCode to be present and
     * non-empty on *every* write to `users/{uid}`, create or update. A stats-only
     * write is rejected, which is what happened for as long as nothing called
     * this.
     */
    suspend fun pushStats(
        uid: String,
        profile: CloudProfile,
        stats: GameStats,
        solvedPuzzleIds: List<String>,
    )

    /**
     * Deletes every document the account owns.
     *
     * `starts/` and `solves/` receipts are deliberately **not** deleted: the
     * rules make them non-deletable so a client cannot delete a receipt and
     * re-run the increment to pump the public solve counters. They carry no
     * personal data.
     */
    suspend fun deleteAccountData(uid: String)
}

/**
 * The identity fields the user document must carry.
 *
 * [DEFAULT_CODENAME] mirrors the web's fallback, so a player who has not chosen
 * a name still has a valid document. It is only ever a document field -- nothing
 * is posted to the public board until they pick a name themselves.
 */
data class CloudProfile(
    val displayName: String = DEFAULT_CODENAME,
    val codename: String = DEFAULT_CODENAME,
    val titleBadge: String = "Field Operative",
    val countryCode: String = "US",
    val photoUrl: String = "",
) {
    /** Clipped to the lengths the rules enforce. */
    fun clipped() = CloudProfile(
        displayName = displayName.trim().ifEmpty { DEFAULT_CODENAME }.take(80),
        codename = codename.trim().ifEmpty { DEFAULT_CODENAME }.take(24),
        titleBadge = titleBadge.trim().ifEmpty { "Field Operative" }.take(60),
        countryCode = countryCode.uppercase().takeIf { it.matches(Regex("^[A-Z]{2}$")) } ?: "US",
        // Rules allow an empty string or an https URL, nothing else.
        photoUrl = photoUrl.takeIf { it.startsWith("https://") && it.length <= 500 }.orEmpty(),
    )
}

const val DEFAULT_CODENAME = "Codebreaker"

data class CloudSnapshot(
    val progress: Map<String, PuzzleProgress> = emptyMap(),
    val hints: Map<String, DailyHintWallet> = emptyMap(),
    val checks: Map<String, DailyHintWallet> = emptyMap(),
    val solvedPuzzleIds: List<String> = emptyList(),
    val stats: GameStats = GameStats(),
    val updatedAt: Long = 0L,
) {
    fun toDeskState() = DeskState(
        progress = progress,
        hints = hints,
        checks = checks,
        solvedPuzzleIds = solvedPuzzleIds,
        stats = stats,
        updatedAt = updatedAt,
    )
}

/**
 * The cloud, when there isn't one.
 *
 * A build without Firebase configuration uses this, and the game is fully
 * playable: everything except the leaderboard and cross-device sync is local
 * anyway. Failing closed here rather than crashing is what lets the app ship
 * and be developed without credentials.
 */
object NoCloudDesk : CloudDesk {
    override suspend fun fetch(uid: String): CloudSnapshot? = null
    override suspend fun pushProgress(uid: String, puzzleId: String, progress: PuzzleProgress) = Unit
    override suspend fun pushWallets(
        uid: String,
        edition: Int,
        hints: DailyHintWallet,
        checks: DailyHintWallet,
    ) = Unit
    override suspend fun pushStats(
        uid: String,
        profile: CloudProfile,
        stats: GameStats,
        solvedPuzzleIds: List<String>,
    ) = Unit
    override suspend fun deleteAccountData(uid: String) = Unit
}

/**
 * Folds a cloud snapshot into the local desk on sign-in.
 *
 * Reuses [DeskActions.mergeCloud], which reuses the merge rules pinned by the
 * fixtures generated from the web's `localStore.ts`. Nothing about the
 * reconciliation is new code, which is the point: two clients disagreeing about
 * a half-finished board is the case most likely to lose a player's work.
 */
suspend fun DeskStore.hydrateFromCloud(
    cloud: CloudDesk,
    uid: String,
    now: () -> Long = System::currentTimeMillis,
): DeskState {
    val snapshot = cloud.fetch(uid) ?: return update { it }
    return update { local -> DeskActions.mergeCloud(local, snapshot.toDeskState(), now) }
}
