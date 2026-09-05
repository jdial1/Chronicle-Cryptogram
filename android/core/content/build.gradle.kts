plugins {
    // No kotlin-android plugin: AGP 9 has built-in Kotlin support and rejects it.
    alias(libs.plugins.android.library)
    alias(libs.plugins.kotlin.serialization)
}

/**
 * Stage the canonical content from src/data. Nothing is committed under assets/,
 * so the JSON cannot drift from the copy the web app reads.
 *
 * This is the only place that stages the shipped content. `:app` had a second
 * Sync task doing the same copy into its own assets, which was pure duplicate
 * work -- library assets merge into the app -- and worse than harmless: when the
 * app's copy was narrowed to drop `plates.json`, this one still globbed `*.json`
 * and put it back, so the file kept shipping and the narrowing looked like it
 * had failed.
 *
 * AGP 9 rejects Provider instances in the SourceSet API, so the directories are
 * named literally and the wiring is an explicit task dependency below.
 */
val generatedAssets = "build/generated/assets"
val generatedTestContent = "build/generated/test-content"

val stageContent = tasks.register<Sync>("stageContent") {
    // Named rather than globbed. plates.json is web-only: the web resolves plate
    // ids to images through Vite, while this app draws its press plates from the
    // generated Woodcuts drawables, and there are no assets/plates/ images in
    // the APK for those ids to resolve to.
    from(rootProject.file("../src/data")) {
        include("puzzles.json", "caseFiles.json", "cipherTactics.json", "primerPractice.json")
    }
    into(layout.projectDirectory.dir("$generatedAssets/content"))
}

/** The same files again for the schema guard, a plain JVM test -- no Robolectric. */
val stageContentForTests = tasks.register<Sync>("stageContentForTests") {
    // The same four the app ships. plates.json is web-only content, guarded by
    // src/data/content.test.ts on the side that actually renders it.
    from(rootProject.file("../src/data")) {
        include("puzzles.json", "caseFiles.json", "cipherTactics.json", "primerPractice.json")
    }
    into(layout.projectDirectory.dir("$generatedTestContent/content"))
}

android {
    namespace = "com.chroniclecryptogram.content"
    compileSdk = 37
    defaultConfig { minSdk = 26 }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    sourceSets {
        getByName("main") { assets.srcDir(generatedAssets) }
        getByName("test") { resources.srcDir(generatedTestContent) }
    }
    testOptions {
        unitTests.all { it.useJUnitPlatform() }
    }
}

// AGP 9 drops `kotlinOptions`; its built-in Kotlin support is configured through
// the standard top-level `kotlin` extension instead.
kotlin {
    compilerOptions {
        jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17)
        allWarningsAsErrors.set(true)
    }
}

// AGP owns the resource-merging task types, so wire by name rather than by type.
tasks.named("preBuild") { dependsOn(stageContent) }
tasks.matching { it.name.contains("UnitTestJavaRes") || it.name.contains("UnitTestResources") }
    .configureEach { dependsOn(stageContentForTests) }
tasks.withType<Test>().configureEach { dependsOn(stageContentForTests) }

dependencies {
    api(project(":core:cipher"))
    implementation(libs.kotlinx.serialization.json)
    testImplementation(libs.junit.jupiter)
    testRuntimeOnly(libs.junit.platform.launcher)
}
