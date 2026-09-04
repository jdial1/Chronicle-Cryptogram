plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.roborazzi)
}

/**
 * The content the app ships. Staged from src/data on every build, so the season
 * in the APK is the same file the web app reads -- there is no second copy.
 */
val generatedAssets = "build/generated/assets"

val stageContent by tasks.registering(Sync::class) {
    from(rootProject.file("../src/data")) { include("*.json") }
    into(layout.projectDirectory.dir("$generatedAssets/content"))
}

android {
    namespace = "com.chroniclecryptogram"
    compileSdk = 37

    defaultConfig {
        applicationId = "com.chroniclecryptogram"
        minSdk = 26
        targetSdk = 37
        // CI stamps the build number; a local build is always 1.
        versionCode = System.getenv("GITHUB_RUN_NUMBER")?.toIntOrNull() ?: 1
        versionName = "1.0.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    buildFeatures { compose = true }
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
    implementation(project(":core:designsystem"))

    implementation(platform(libs.compose.bom))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.activity:activity-compose:1.11.0")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.9.4")
    debugImplementation("androidx.compose.ui:ui-tooling")

    testImplementation(libs.junit.jupiter)
    testImplementation(libs.kotlinx.serialization.json)
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
