package com.chroniclecryptogram.session

import android.util.Log
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import com.chroniclecryptogram.data.CloudDesk
import com.chroniclecryptogram.data.CloudProfile
import com.chroniclecryptogram.data.DeskPrefs
import com.chroniclecryptogram.data.DeskStore
import com.chroniclecryptogram.data.hydrateFromCloud
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.FlowPreview
import kotlinx.coroutines.flow.debounce
import kotlinx.coroutines.flow.distinctUntilChangedBy
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.withContext

/** Log tag for refused cloud writes. */
const val SyncTag = "ChronicleSync"

/**
 * How long the desk must be quiet before it is pushed.
 *
 * Typing changes the board on every keystroke, and the web debounces its writes
 * for the same reason. Long enough to coalesce a burst of typing, short enough
 * that closing the app straight after a solve still syncs it.
 */
private const val PUSH_DEBOUNCE_MS = 2_000L

/**
 * Keeps the local desk and the cloud copy in step for as long as it is composed.
 *
 * Lifted out of the app's root composable, which had grown to hold thirty-five
 * state values and thirty-eight effects at once. Every wiring bug this project
 * has had -- a desk that never synced, a profile write that could not succeed,
 * a clock nothing started -- lived in that function, and the reason they were
 * hard to see is that nothing else was separable from them.
 */
@OptIn(FlowPreview::class)
@Composable
fun CloudSync(
    store: DeskStore,
    cloud: CloudDesk,
    uid: String?,
    displayName: String?,
    prefs: DeskPrefs,
) {
    // Sign-in pulls the cloud copy down and merges it into the local desk. The
    // merge rules are the ones fixture-pinned against the web's localStore, so
    // two devices disagreeing about a half-finished board resolve identically on
    // both apps rather than one of them silently winning.
    LaunchedEffect(uid) {
        if (uid == null) return@LaunchedEffect
        withContext(Dispatchers.IO) { runCatching { store.hydrateFromCloud(cloud, uid) } }
    }

    // ...and pushes back up, debounced: a keystroke changes the board, and an
    // unthrottled push would be one write per letter typed.
    LaunchedEffect(uid, displayName, prefs.codename, prefs.titleBadge, prefs.countryCode) {
        val id = uid ?: return@LaunchedEffect
        val profile = CloudProfile(
            displayName = displayName.orEmpty(),
            codename = prefs.codename,
            titleBadge = prefs.titleBadge,
            countryCode = prefs.countryCode,
        )

        store.state
            .map { desk -> desk to desk.updatedAt }
            .distinctUntilChangedBy { it.second }
            .debounce(PUSH_DEBOUNCE_MS)
            .collect { (desk, _) ->
                withContext(Dispatchers.IO) {
                    // Each write stands alone. Bundled in one runCatching, the
                    // first refusal aborted every later write and reported
                    // nothing -- which is how a user document the rules rejected
                    // went unnoticed while progress never synced.
                    val failures = buildList {
                        runCatching {
                            cloud.pushStats(id, profile, desk.stats, desk.solvedPuzzleIds)
                        }.onFailure { add("profile: ${it.message}") }

                        desk.progress.forEach { (puzzleId, progress) ->
                            runCatching { cloud.pushProgress(id, puzzleId, progress) }
                                .onFailure { add("progress $puzzleId: ${it.message}") }
                        }

                        desk.hints.forEach { (edition, hints) ->
                            val number = edition.toIntOrNull() ?: return@forEach
                            runCatching {
                                cloud.pushWallets(
                                    id,
                                    number,
                                    hints,
                                    desk.checks[edition] ?: hints,
                                )
                            }.onFailure { add("wallet $edition: ${it.message}") }
                        }
                    }

                    if (failures.isNotEmpty()) {
                        Log.w(SyncTag, "desk sync refused -- " + failures.joinToString("; "))
                    }
                }
            }
    }
}
