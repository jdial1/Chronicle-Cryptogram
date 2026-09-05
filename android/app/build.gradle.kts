import java.util.Properties

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.compose)
}

/**
 * Whether this build has a cloud at all.
 *
 * Two conditions, both required, and `core/cloud/build.gradle.kts` computes the
 * same pair -- they must agree, or the UI here would gate on a flag that does
 * not match the code it linked against.
 *
 * Credentials alone were the old test, and it was the wrong one twice over: a
 * contributor without google-services.json got a working offline build (good),
 * but there was no way to *ask* for one, and the Firebase dependencies shipped
 * either way. `chronicleCloud=false` is how 1.0 ships offline while sign-in and
 * the leaderboard wait on Google Cloud console work that cannot be done here.
 */
val hasFirebaseConfig = providers.gradleProperty("chronicleCloud").get().toBoolean() &&
    file("google-services.json").exists()

/** The type-3 (web) OAuth client from google-services.json, or empty. */
fun googleWebClientId(): String {
    val config = file("google-services.json")
    if (!hasFirebaseConfig || !config.exists()) return ""
    // client_type 3 is the web client. Type 1 is Android and does NOT work with
    // Credential Manager -- using it is the classic cause of a silent sign-in
    // failure, so it is read from the file rather than pasted in by hand.
    val pattern = Regex(""""client_id"\s*:\s*"([^"]+)",\s*"client_type"\s*:\s*3""")
    return pattern.find(config.readText())?.groupValues?.get(1).orEmpty()
}

if (hasFirebaseConfig) {
    apply(plugin = "com.google.gms.google-services")
    // Crash reporting. Gated with the rest of Firebase so a credential-less
    // build still assembles, and it closes the gap the release plan calls out:
    // the native path shipped with no crash reporting at all.
    apply(plugin = "com.google.firebase.crashlytics")
}

/**
 * The content the app ships. Staged from src/data on every build, so the season
 * in the APK is the same file the web app reads -- there is no second copy.
 */
val generatedAssets = "build/generated/assets"

val stageContent = tasks.register<Sync>("stageContent") {
    from(rootProject.file("../src/data")) { include("*.json") }
    into(layout.projectDirectory.dir("$generatedAssets/content"))
}

/**
 * Release signing. The keystore lives outside the repo and is read from
 * android/keystore.properties locally, or from environment variables in CI --
 * a debug-signed release build cannot be uploaded to Play, and committing a
 * keystore would be worse.
 */
val keystoreProperties = Properties().apply {
    val file = rootProject.file("keystore.properties")
    if (file.exists()) file.inputStream().use { load(it) }
}

fun signingValue(key: String, env: String): String? =
    keystoreProperties.getProperty(key) ?: System.getenv(env)

val hasSigningConfig = signingValue("storeFile", "ANDROID_KEYSTORE_PATH") != null

/**
 * Play publishing, optional. The service-account JSON never lives in the repo --
 * it is a credential that can push a build to every user of the app -- so the
 * plugin only applies when one is configured.
 *
 * Gradle Play Publisher reads that credential from ANDROID_PUBLISHER_CREDENTIALS
 * itself and takes the track from the command line, so there is no DSL block
 * here and nothing can accidentally promote a build:
 *
 *   ANDROID_PUBLISHER_CREDENTIALS=... ./gradlew :app:publishBundle --track internal
 *
 * Tracks match the ladder the Expo setup used: internal, then alpha, then
 * production at a staged rollout.
 */
if (System.getenv("ANDROID_PUBLISHER_CREDENTIALS") != null) {
    apply(plugin = "com.github.triplet.play")
}

/**
 * The platform the app targets, overridable for a sideload build.
 *
 * The default is the newest SDK, which is what Play wants. `compileSdk` is not
 * a knob -- the AndroidX stack in the current Compose BOM refuses to be compiled
 * against anything older -- but the *target* is, and lowering it removes a
 * variable when a device refuses to install a sideloaded APK:
 * `-PchronicleTargetSdk=36` targets a shipped Android version instead.
 */
val chronicleSdk = providers.gradleProperty("chronicleTargetSdk").get().toInt()

/**
 * Install beside the Play build rather than trying to replace it.
 *
 * Only valid because `com.chroniclecryptogram.app` is a registered Firebase
 * client carrying the debug certificate; check `google-services.json` before
 * changing the suffix.
 */
/**
 * The Play build number.
 *
 * Committed rather than derived, because Play's rule is unforgiving: a version
 * code can never be reused and can never go backwards, and a rejected upload
 * burns the number anyway. This was previously the CI run number falling back
 * to 1, which meant a hand-built bundle uploaded as 1 while a later CI build
 * would jump to some unrelated number -- two different ways to be rejected on
 * a value that cannot then be corrected.
 *
 * Bump it in gradle.properties in the same commit that ships the build.
 * `-PchronicleVersionCode=` overrides it for a one-off upload.
 */
val chronicleVersionCode = providers.gradleProperty("chronicleVersionCode").get().toInt()

val sideloadAlongsidePlay =
    providers.gradleProperty("chronicleSideload").orNull?.toBoolean() ?: false

android {
    namespace = "com.chroniclecryptogram"
    compileSdk = 37

    defaultConfig {
        applicationId = "com.chroniclecryptogram"
        minSdk = 26
        targetSdk = chronicleSdk
        buildConfigField("boolean", "HAS_FIREBASE", hasFirebaseConfig.toString())
        // Credential Manager needs the *web* OAuth client id. Reading it from
        // google-services.json keeps it from being pasted in twice and drifting.
        buildConfigField("String", "GOOGLE_WEB_CLIENT_ID", "\"${'$'}{googleWebClientId()}\"")
        versionCode = chronicleVersionCode
        versionName = "1.0.0"
    }

    signingConfigs {
        if (hasSigningConfig) {
            create("release") {
                storeFile = file(signingValue("storeFile", "ANDROID_KEYSTORE_PATH")!!)
                storePassword = signingValue("storePassword", "ANDROID_KEYSTORE_PASSWORD")
                keyAlias = signingValue("keyAlias", "ANDROID_KEY_ALIAS")
                keyPassword = signingValue("keyPassword", "ANDROID_KEY_PASSWORD")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            // Unsigned when no keystore is configured, so a contributor can still
            // build a release variant; publishing checks for a signature.
            signingConfig = if (hasSigningConfig) signingConfigs.getByName("release") else null
        }
        debug {
            versionNameSuffix = "-debug"

            // Sideloading onto a phone that already has the Play build fails:
            // Play owns com.chroniclecryptogram and signs it with its own key,
            // and Android will not let a differently-signed APK take over a
            // package. The device reports only "You can't install this app on
            // your phone", which says nothing about certificates.
            //
            // -PchronicleSideload=true installs under a second application id
            // instead. It is not an arbitrary suffix: google-services.json
            // registers com.chroniclecryptogram.app as a client in its own
            // right, carrying this same debug certificate, so Firebase keeps
            // working. Any other suffix would silently lose it.
            //
            // Two caveats, both learned the hard way.
            //
            // It is the id the retired Expo shell shipped under, so a device
            // still carrying that build hits the same signature conflict here.
            // No suffix dodges a signature mismatch -- only a package name
            // nothing else already owns.
            //
            // And `.app` was an abandoned Play attempt: the bundle did not match
            // the console's project, so it was never submitted. Firebase still
            // lists it, but its OAuth setup was left half-finished, which is a
            // likely source of `[28444] Developer console is not set up
            // correctly` when signing in under this id. Use it to exercise the
            // game; test sign-in on the real package instead.
            if (sideloadAlongsidePlay) {
                applicationIdSuffix = ".app"
                versionNameSuffix = "-sideload"
            }
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    buildFeatures {
        compose = true
        buildConfig = true
    }
    sourceSets {
        getByName("main") { assets.srcDir(generatedAssets) }
    }
    testOptions {
        unitTests {
            isIncludeAndroidResources = true
            all { it.useJUnitPlatform() }
        }
    }
}

kotlin {
    compilerOptions {
        jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17)
        allWarningsAsErrors.set(true)
    }
}

tasks.named("preBuild") { dependsOn(stageContent) }

dependencies {
    implementation(libs.androidx.splashscreen)
    implementation(project(":core:cipher"))
    implementation(project(":core:content"))
    implementation(project(":core:data"))
    implementation(project(":core:cloud"))
    implementation(project(":core:designsystem"))

    implementation(platform(libs.compose.bom))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.material3:material3")
    implementation(libs.compose.material.icons.core)
    implementation("androidx.activity:activity-compose:1.11.0")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.9.4")
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    debugImplementation("androidx.compose.ui:ui-tooling")

    testImplementation(libs.junit.jupiter)
    testImplementation(libs.kotlinx.serialization.json)
    testImplementation(libs.kotlinx.coroutines.test)
    testRuntimeOnly(libs.junit.platform.launcher)

    // Screenshot and layout tests run on the JVM under Robolectric, so the
    // fontScale checks gate every build instead of needing a device.
    testImplementation(libs.junit4)
    testRuntimeOnly(libs.junit.vintage.engine)
    testImplementation(libs.robolectric)
    testImplementation(platform(libs.compose.bom))
    testImplementation(libs.compose.ui.test.junit4)
    debugImplementation(libs.compose.ui.test.manifest)
}
