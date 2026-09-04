package com.chroniclecryptogram.data

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.emptyPreferences
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStoreFile
import androidx.datastore.preferences.core.PreferenceDataStoreFactory
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map
import java.io.IOException

/** Which palette to paint, independent of the per-puzzle Morning/Evening slot. */
enum class ThemeMode { System, Light, Dark }

/**
 * How the player types. The typewriter is the house instrument; the system
 * keyboard is offered for anyone who finds a custom key bank slower or harder
 * to reach, which includes most switch- and gesture-typing users.
 */
enum class KeyboardMode { Typewriter, System }

data class DeskPrefs(
    val themeMode: ThemeMode = ThemeMode.System,
    val keyboardMode: KeyboardMode = KeyboardMode.Typewriter,
    val reduceMotion: Boolean = false,
    /**
     * How the player is named on the board. Empty means they have not chosen
     * one, and nothing is posted until they do -- a time is published under this
     * name, so it is never picked for them.
     */
    val codename: String = "",
    val titleBadge: String = "",
    val countryCode: String = "US",
) {
    /** A board posting needs a name; everything else has a default. */
    val canPost: Boolean get() = codename.isNotBlank()
}

/**
 * Small, independent settings.
 *
 * Preferences DataStore rather than the [DeskStore] proto: these are scalars a
 * user toggles, they have no merge semantics, and keeping them separate means a
 * settings write never rewrites the whole save file.
 */
interface PrefsStore {
    val prefs: Flow<DeskPrefs>
    suspend fun setThemeMode(mode: ThemeMode)
    suspend fun setKeyboardMode(mode: KeyboardMode)
    suspend fun setReduceMotion(enabled: Boolean)
    suspend fun setCodename(codename: String)
    suspend fun setTitleBadge(badge: String)
    suspend fun setCountryCode(code: String)
}

class DataStorePrefsStore(private val store: DataStore<Preferences>) : PrefsStore {

    override val prefs: Flow<DeskPrefs> = store.data
        // A read failure must not take the app down; defaults are always safe.
        .catch { error -> if (error is IOException) emit(emptyPreferences()) else throw error }
        .map { values ->
            DeskPrefs(
                themeMode = values[ThemeKey]?.toThemeMode() ?: ThemeMode.System,
                keyboardMode = values[KeyboardKey]?.toKeyboardMode() ?: KeyboardMode.Typewriter,
                reduceMotion = values[ReduceMotionKey] ?: false,
                codename = values[CodenameKey].orEmpty(),
                titleBadge = values[TitleBadgeKey] ?: TitleBadges.last(),
                countryCode = values[CountryKey] ?: "US",
            )
        }

    override suspend fun setThemeMode(mode: ThemeMode) {
        store.edit { it[ThemeKey] = mode.name }
    }

    override suspend fun setKeyboardMode(mode: KeyboardMode) {
        store.edit { it[KeyboardKey] = mode.name }
    }

    override suspend fun setReduceMotion(enabled: Boolean) {
        store.edit { it[ReduceMotionKey] = enabled }
    }

    override suspend fun setCodename(codename: String) {
        store.edit { it[CodenameKey] = Posting.clipCodename(codename) }
    }

    override suspend fun setTitleBadge(badge: String) {
        store.edit { it[TitleBadgeKey] = badge.take(60) }
    }

    override suspend fun setCountryCode(code: String) {
        store.edit { it[CountryKey] = code.uppercase().take(2) }
    }

    companion object {
        private val ThemeKey = stringPreferencesKey("themeMode")
        private val KeyboardKey = stringPreferencesKey("keyboardMode")
        private val ReduceMotionKey = booleanPreferencesKey("reduceMotion")
        private val CodenameKey = stringPreferencesKey("codename")
        private val TitleBadgeKey = stringPreferencesKey("titleBadge")
        private val CountryKey = stringPreferencesKey("countryCode")

        /** An unrecognised stored value falls back rather than throwing. */
        private fun String.toThemeMode() =
            ThemeMode.entries.firstOrNull { it.name == this }

        private fun String.toKeyboardMode() =
            KeyboardMode.entries.firstOrNull { it.name == this }

        fun create(context: Context): DataStorePrefsStore = DataStorePrefsStore(
            PreferenceDataStoreFactory.create {
                context.preferencesDataStoreFile("desk-prefs")
            }
        )
    }
}
