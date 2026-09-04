plugins {
    alias(libs.plugins.kotlin.jvm)
    alias(libs.plugins.kotlin.serialization)
}

// No Android dependency, by design. The fixtures in src/test/resources are
// generated from the TypeScript by `npm run emit:fixtures`; see their README.
kotlin {
    compilerOptions {
        jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17)
        allWarningsAsErrors.set(true)
    }
}

java {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
}

/**
 * Stage the canonical content JSON from src/data into the test resources rather
 * than committing a second copy. This is the same Sync-task mechanism the :app
 * module will use for its assets, exercised early so drift is impossible.
 */
val stageContentForTests = tasks.register<Sync>("stageContentForTests") {
    from(rootProject.file("../src/data")) { include("*.json") }
    into(layout.buildDirectory.dir("generated/test-content/content"))
}

sourceSets["test"].resources.srcDir(
    stageContentForTests.map { layout.buildDirectory.dir("generated/test-content").get() }
)

dependencies {
    implementation(libs.kotlinx.serialization.json)
    testImplementation(libs.junit.jupiter)
    testRuntimeOnly(libs.junit.platform.launcher)
}

tasks.test {
    useJUnitPlatform()
    testLogging {
        events("passed", "skipped", "failed")
    }
}
