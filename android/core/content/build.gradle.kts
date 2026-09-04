plugins {
    // No kotlin-android plugin: AGP 9 has built-in Kotlin support and rejects it.
    alias(libs.plugins.android.library)
    alias(libs.plugins.kotlin.serialization)
}

/**
 * Stage the canonical content from src/data. Nothing is committed under assets/,
 * so the JSON cannot drift from the copy the web app reads.
 *
 * AGP 9 rejects Provider instances in the SourceSet API, so the directories are
 * named literally and the wiring is an explicit task dependency below.
 */
val generatedAssets = "build/generated/assets"
val generatedTestContent = "build/generated/test-content"

val stageContent by tasks.registering(Sync::class) {
    from(rootProject.file("../src/data")) { include("*.json") }
    into(layout.projectDirectory.dir("$generatedAssets/content"))
}

/** The same files again for the schema guard, a plain JVM test -- no Robolectric. */
val stageContentForTests by tasks.registering(Sync::class) {
    from(rootProject.file("../src/data")) { include("*.json") }
    into(layout.projectDirectory.dir("$generatedTestContent/content"))
}

android {
    namespace = "com.chroniclecryptogram.content"
    compileSdk = 36
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
