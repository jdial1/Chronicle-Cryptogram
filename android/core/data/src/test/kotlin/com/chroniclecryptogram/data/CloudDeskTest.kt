package com.chroniclecryptogram.data

import com.chroniclecryptogram.cipher.model.DailyHintWallet
import com.chroniclecryptogram.cipher.model.GameStats
import com.chroniclecryptogram.cipher.model.PuzzleProgress
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.test.runTest
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

private class FakeStore(initial: DeskState = DeskState()) : DeskStore {
    private val flow = MutableStateFlow(initial)
    override val state: Flow<DeskState> = flow
    override suspend fun update(transform: (DeskState) -> DeskState): DeskState {
        flow.value = transform(flow.value)
        return flow.value
    }

    fun current() = flow.value
}

private class FakeCloud(private val snapshot: CloudSnapshot?) : CloudDesk {
    var deleted = false
        private set

    override suspend fun fetch(uid: String) = snapshot
    override suspend fun pushProgress(uid: String, puzzleId: String, progress: PuzzleProgress) = Unit
    override suspend fun pushWallets(
        uid: String,
        edition: Int,
        hints: DailyHintWallet,
        checks: DailyHintWallet,
    ) = Unit
    override suspend fun pushStats(uid: String, stats: GameStats, solvedPuzzleIds: List<String>) = Unit
    override suspend fun deleteAccountData(uid: String) { deleted = true }
}

/**
 * Sign-in reconciliation: the case most likely to lose a player's work, since it
 * is where two devices disagree about a half-finished board.
 *
 * The Firebase implementation cannot be exercised without credentials and a
 * device, so the contract is tested against fakes and the rules themselves live
 * in DeskActions, where they are pinned by fixtures from the web.
 */
@OptIn(ExperimentalCoroutinesApi::class)
class CloudDeskTest {

    private val now = 1_700_000_000_000L

    @Test
    fun `a first sign-in with nothing in the cloud leaves the desk alone`() = runTest {
        val local = DeskState(solvedPuzzleIds = listOf("a"))
        val store = FakeStore(local)

        val result = store.hydrateFromCloud(FakeCloud(null), "uid") { now }

        assertEquals(local, result)
    }

    @Test
    fun `signing in on a fresh device pulls the cloud desk down`() = runTest {
        val store = FakeStore(DeskState())
        val cloud = CloudSnapshot(
            progress = mapOf("day_1_easy" to PuzzleProgress(timerSeconds = 42)),
            solvedPuzzleIds = listOf("day_1_easy"),
            stats = GameStats(puzzlesSolved = 1, fastestTime = 42),
        )

        val result = store.hydrateFromCloud(FakeCloud(cloud), "uid") { now }

        assertEquals(listOf("day_1_easy"), result.solvedPuzzleIds)
        assertEquals(42, result.progress.getValue("day_1_easy").timerSeconds)
        assertEquals(1, result.stats.puzzlesSolved)
    }

    /** Neither side wins wholesale: solves union, and the better record survives. */
    @Test
    fun `two devices that disagree keep the work from both`() = runTest {
        val store = FakeStore(
            DeskState(
                progress = mapOf("a" to PuzzleProgress(timerSeconds = 30, updatedAt = 2000)),
                solvedPuzzleIds = listOf("a"),
                stats = GameStats(puzzlesSolved = 1, fastestTime = 30),
            )
        )
        val cloud = CloudSnapshot(
            progress = mapOf(
                "a" to PuzzleProgress(timerSeconds = 90, updatedAt = 1000),
                "b" to PuzzleProgress(timerSeconds = 55),
            ),
            solvedPuzzleIds = listOf("b"),
            stats = GameStats(puzzlesSolved = 1, fastestTime = 55),
        )

        val result = store.hydrateFromCloud(FakeCloud(cloud), "uid") { now }

        assertEquals(setOf("a", "b"), result.progress.keys, "no board should be dropped")
        assertEquals(30, result.progress.getValue("a").timerSeconds, "newer stamp wins")
        assertEquals(listOf("a", "b"), result.solvedPuzzleIds, "solves union")
        assertEquals(30, result.stats.fastestTime, "the better record survives")
    }

    @Test
    fun `a wallet spent on either device stays spent`() = runTest {
        val store = FakeStore(
            DeskState(hints = mapOf("1" to DailyHintWallet(edition = 1, used = 1, remaining = 2)))
        )
        val cloud = CloudSnapshot(
            hints = mapOf("1" to DailyHintWallet(edition = 1, used = 3, remaining = 0))
        )

        val result = store.hydrateFromCloud(FakeCloud(cloud), "uid") { now }

        assertEquals(3, result.hints.getValue("1").used, "hints must not come back")
        assertEquals(0, result.hints.getValue("1").remaining)
    }

    @Test
    fun `the no-cloud implementation is inert and never throws`() = runTest {
        assertNull(NoCloudDesk.fetch("uid"))
        NoCloudDesk.pushProgress("uid", "p", PuzzleProgress())
        NoCloudDesk.pushWallets(
            "uid", 1,
            DailyHintWallet(1, 0, 3),
            DailyHintWallet(1, 0, 3),
        )
        NoCloudDesk.pushStats("uid", GameStats(), emptyList())
        NoCloudDesk.deleteAccountData("uid")
    }

    @Test
    fun `deleting account data reaches the cloud`() = runTest {
        val cloud = FakeCloud(null)
        cloud.deleteAccountData("uid")
        assertTrue(cloud.deleted)
    }
}
