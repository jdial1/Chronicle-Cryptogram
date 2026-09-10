pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\.android.*")
                includeGroupByRegex("com\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "chronicle-cryptogram"

// The game logic, ported from src/. Plain kotlin("jvm") on purpose: its tests are
// the parity gate against the fixtures generated from the TypeScript, and they
// must run in seconds with no emulator and no Robolectric.
include(":core:cipher")

// Content loading: reads the JSON staged from src/data into assets.
include(":core:content")

// Theme, typography and shared Compose components.
include(":core:designsystem")

// Local persistence: DataStore-backed desk state and preferences.
include(":core:data")

// Firebase-backed cloud desk. Optional: the app substitutes NoCloudDesk when the
// project is built without google-services.json.
include(":core:cloud")

include(":app")
