package com.chroniclecryptogram.board

import com.chroniclecryptogram.data.DeskState
import com.chroniclecryptogram.data.DeskStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow

/**
 * An in-memory desk.
 *
 * This is the whole reason [DeskStore] is an interface rather than a class, and
 * it had been written out separately in each test file that needed it -- three
 * copies of the same eight lines, differing only in which of `writes` and
 * `current()` each one happened to want.
 *
 * `:core:data` still keeps its own, because sharing one across module
 * boundaries needs the test-fixtures plugin, and a build plugin to save eight
 * lines is a worse trade than the duplication.
 */
internal class FakeDeskStore(initial: DeskState = DeskState()) : DeskStore {
    private val flow = MutableStateFlow(initial)

    override val state: Flow<DeskState> = flow

    /** How many times the desk was written, for the tests that debounce. */
    var writes = 0
        private set

    override suspend fun update(transform: (DeskState) -> DeskState): DeskState {
        writes++
        flow.value = transform(flow.value)
        return flow.value
    }

    fun current(): DeskState = flow.value
}
