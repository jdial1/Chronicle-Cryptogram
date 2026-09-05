package com.chroniclecryptogram.content

import kotlinx.serialization.Serializable

/* ------------------------------------------------------------- case files */

@Serializable
data class CaseFileContent(
    val characters: List<CaseCharacter>,
    val fragments: List<CaseFragment>,
)

@Serializable
data class CaseCharacter(
    val id: String,
    val name: String,
    val dossier: String,
    val file: String,
    val plate: String,
)

/**
 * A dossier entry that assembles from the player's own solves: `text` parts are
 * always shown, `quote` parts splice in the decoded quote for that slot, and a
 * `when` narrows a text part to one slot. Nothing renders for an unsolved slot,
 * which is what makes the case file feel earned rather than unlocked.
 */
@Serializable
data class CaseFragment(
    val characterId: String,
    val editionNumber: Int,
    val title: String,
    val parts: List<CasePart>,
)

@Serializable
data class CasePart(
    val kind: String,
    val value: String? = null,
    val `when`: String? = null,
    val slot: String? = null,
)

/* --------------------------------------------------------- cipher tactics */

@Serializable
data class CipherTacticsContent(
    val intro: String,
    val tools: List<TacticPoint>,
    val tactics: List<CipherTactic>,
)

@Serializable
data class CipherTactic(
    val id: String,
    val title: String,
    val summary: String,
    val points: List<TacticPoint>,
)

@Serializable
data class TacticPoint(
    val lead: String,
    val body: String,
)

/* --------------------------------------------------------- primer practice */

@Serializable
data class PrimerPracticeContent(
    val practicePuzzles: List<String>,
)
