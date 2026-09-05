plugins {
    alias(libs.plugins.android.library)
}

/**
 * Whether this build has a cloud at all.
 *
 * Two conditions, both required, and the same pair is computed in
 * `app/build.gradle.kts` -- they must agree or `:app` would gate its UI on a
 * flag that does not match the code it linked against.
 *
 * `chronicleCloud` is off for the 1.0 release, which ships offline: sign-in and
 * the leaderboard are waiting on Google Cloud console work that cannot be done
 * from this repo. Leaving the dependencies in place while the feature is dark
 * is not a neutral choice -- see `src/offline/.../Offline.kt` for what it costs.
 */
val cloudEnabled = providers.gradleProperty("chronicleCloud").get().toBoolean() &&
    rootProject.file("app/google-services.json").exists()

android {
    testOptions {
        unitTests.all { it.useJUnitPlatform() }
    }

    namespace = "com.chroniclecryptogram.cloud"
    compileSdk = 37
    defaultConfig { minSdk = 26 }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    // Exactly one of the two implementations is compiled. `src/main` holds
    // nothing: there is no shared code between them, only a shared surface.
    sourceSets {
        getByName("main") {
            kotlin.srcDir(if (cloudEnabled) "src/firebase/kotlin" else "src/offline/kotlin")
        }
        // The sign-in error mapping is Firebase-specific and cannot compile
        // without it.
        getByName("test") {
            if (cloudEnabled) kotlin.srcDir("src/firebaseTest/kotlin")
        }
    }
}

kotlin {
    compilerOptions {
        jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17)
        allWarningsAsErrors.set(true)
    }
}

dependencies {
    api(project(":core:data"))

    // Declared conditionally, not merely unused when the feature is off: an AAR
    // in the bundle contributes its manifest permissions and its content
    // providers whether or not a line of code calls it.
    if (cloudEnabled) {
        implementation(platform(libs.firebase.bom))
        implementation(libs.firebase.auth)
        implementation(libs.firebase.firestore)
        implementation(libs.firebase.crashlytics)
        implementation(libs.androidx.credentials)
        implementation(libs.androidx.credentials.play.services)
        implementation(libs.google.identity.googleid)
        // firebase-*.await() extensions.
        implementation("org.jetbrains.kotlinx:kotlinx-coroutines-play-services:1.10.2")
    }

    testImplementation(libs.junit.jupiter)
    testRuntimeOnly(libs.junit.platform.launcher)
}
