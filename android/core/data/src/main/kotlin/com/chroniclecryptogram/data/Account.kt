package com.chroniclecryptogram.data

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flowOf

/** Who is signed in, if anyone. */
data class Account(
    val uid: String,
    val displayName: String? = null,
    val anonymous: Boolean = true,
)

/**
 * Sign-in, behind an interface so the game builds and runs with no credentials
 * and so the UI can be driven by a fake.
 *
 * Google sign-in goes through Credential Manager rather than the retired
 * GoogleSignInClient, and the token is exchanged for a Firebase credential --
 * the same flow the web uses, with the same web client id.
 */
interface AccountRepository {
    val account: Flow<Account?>

    /** Signs in anonymously so progress has somewhere to sync before a real sign-in. */
    suspend fun signInAnonymously(): Result<Account>

    /**
     * Links or signs in with Google. [activity] is required: Credential Manager
     * needs an Activity context to present the account chooser.
     */
    suspend fun signInWithGoogle(activity: Any): Result<Account>

    suspend fun signOut()

    /**
     * Deletes the Firebase Auth user, not just their documents.
     *
     * Play requires deletion of the *account*, and the web version only ever
     * deleted the data -- the auth user survived.
     */
    suspend fun deleteAccount(): Result<Unit>
}

/** No credentials configured: the game is fully playable, just not synced. */
object NoAccountRepository : AccountRepository {
    override val account: Flow<Account?> = flowOf(null)
    override suspend fun signInAnonymously() = Result.failure<Account>(NotConfigured)
    override suspend fun signInWithGoogle(activity: Any) = Result.failure<Account>(NotConfigured)
    override suspend fun signOut() = Unit
    override suspend fun deleteAccount() = Result.failure<Unit>(NotConfigured)

    private val NotConfigured = IllegalStateException("This build has no bureau credentials.")
}
