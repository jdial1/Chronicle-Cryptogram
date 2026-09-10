package com.chroniclecryptogram.data

import android.content.Context
import androidx.datastore.core.CorruptionException
import androidx.datastore.core.DataStore
import androidx.datastore.core.DataStoreFactory
import androidx.datastore.core.Serializer
import androidx.datastore.dataStoreFile
import kotlinx.coroutines.flow.Flow
import kotlinx.serialization.SerializationException
import kotlinx.serialization.json.Json
import java.io.InputStream
import java.io.OutputStream

/**
 * Local persistence for the desk.
 *
 * DataStore rather than Room: the whole record is under ~40 KB, is read in full
 * at boot, and never exceeds 61 boards. `updateData` gives atomicity and a Flow
 * for free. **If the leaderboard is ever cached locally, or a season grows to
 * hundreds of puzzles, that trade flips** -- which is why every caller goes
 * through this interface rather than touching DataStore directly.
 *
 * The plan called for Proto DataStore. This uses DataStore's generic core with a
 * kotlinx.serialization JSON serializer instead: identical semantics without
 * pulling in protoc, which would have to download a native binary. The stored
 * shape is [DeskState] either way.
 */
interface DeskStore {
    val state: Flow<DeskState>
    suspend fun update(transform: (DeskState) -> DeskState): DeskState
}

/**
 * A corrupt or truncated file must not lock the player out of the game. Losing
 * local progress is bad; refusing to launch is worse, and the cloud copy can
 * restore it. The failure is deliberately silent-but-recoverable rather than
 * fatal.
 */
internal object DeskStateSerializer : Serializer<DeskState> {

    private val json = Json {
        ignoreUnknownKeys = true // forward compatibility for older builds
        encodeDefaults = true
    }

    override val defaultValue = DeskState()

    override suspend fun readFrom(input: InputStream): DeskState =
        try {
            json.decodeFromString(input.readBytes().decodeToString())
        } catch (error: SerializationException) {
            throw CorruptionException("desk state is unreadable", error)
        }

    override suspend fun writeTo(t: DeskState, output: OutputStream) {
        output.write(json.encodeToString(t).encodeToByteArray())
    }
}

class DataStoreDeskStore(private val store: DataStore<DeskState>) : DeskStore {

    override val state: Flow<DeskState> = store.data

    override suspend fun update(transform: (DeskState) -> DeskState): DeskState =
        store.updateData(transform)

    companion object {
        private const val FILE_NAME = "desk.json"

        fun create(context: Context): DataStoreDeskStore = DataStoreDeskStore(
            DataStoreFactory.create(
                serializer = DeskStateSerializer,
                // A corrupt file resets to an empty desk rather than crashing on
                // every launch, which would be unrecoverable without a reinstall.
                corruptionHandler = androidx.datastore.core.handlers.ReplaceFileCorruptionHandler {
                    DeskState()
                },
                produceFile = { context.dataStoreFile(FILE_NAME) },
            )
        )
    }
}
