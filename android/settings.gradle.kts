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
