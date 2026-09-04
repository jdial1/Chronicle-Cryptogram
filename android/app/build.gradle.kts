import java.util.Properties

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.roborazzi)
}

/**
 * Firebase is optional. Without google-services.json the plugin is not applied,
 * the app substitutes NoCloudDesk, and the whole game still works -- everything
 * but the leaderboard and cross-device sync is local anyway. That keeps the
 * build green for a contributor with no credentials, and keeps CI honest.
 */
val hasFirebaseConfig = file("google-services.json").exists()
if (hasFirebaseConfig) {
    apply(plugin = "com.google.gms.google-services")
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

android {
    namespace = "com.chroniclecryptogram"
    compileSdk = 37

    defaultConfig {
        applicationId = "com.chroniclecryptogram"
        minSdk = 26
        targetSdk = 37
        buildConfigField("boolean", "HAS_FIREBASE", hasFirebaseConfig.toString())
        // CI stamps the build number; a local build is always 1.
        versionCode = System.getenv("GITHUB_RUN_NUMBER")?.toIntOrNull() ?: 1
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
            // No applicationIdSuffix: google-services.json registers
            // com.chroniclecryptogram, and a suffixed id would not match it.
            versionNameSuffix = "-debug"
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
    implementation(project(":core:cipher"))
    implementation(project(":core:content"))
    implementation(project(":core:data"))
    implementation(project(":core:cloud"))
    implementation(project(":core:designsystem"))

    implementation(platform(libs.compose.bom))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.material3:material3")
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
    testImplementation(libs.roborazzi)
    testImplementation(libs.roborazzi.compose)
    testImplementation(libs.roborazzi.junit.rule)
    testImplementation(platform(libs.compose.bom))
    testImplementation(libs.compose.ui.test.junit4)
    debugImplementation(libs.compose.ui.test.manifest)
}
