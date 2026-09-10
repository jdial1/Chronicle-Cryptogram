# Building the Android app

Two routes. **Local Gradle for iteration** — measured at 13m46s on a cold build.
**EAS for release artifacts**, because Play signing lives there; on the free tier expect
a long queue (73 minutes, once) against a 45-minute build ceiling.

For credentials — the root `.env`, `EXPO_TOKEN`, the GitHub secrets — see
[SECRETS.md](SECRETS.md). This file is only about the build toolchain.

## Local build

```
cd mobile
npx expo prebuild --platform android --clean
cd android
./gradlew assembleRelease          # Windows: .\gradlew.bat assembleRelease
```

APK at `mobile/android/app/build/outputs/apk/release/app-release.apk`.
Install with `adb install -r app-release.apk`.

`assembleRelease`, not `assembleDebug`: the Expo/RN template's release `signingConfig`
falls back to the bundled `debug.keystore`, so the APK is signed and installable, while a
debug variant expects a Metro dev server on localhost.

### Requirements

- **JDK 17.** Not 21, not 25 — see below.
- **Android SDK** with NDK `27.1.12297006` and CMake `3.22.1`, both from the SDK Manager.
- `ANDROID_HOME` pointing at the SDK.
- On Windows: a short checkout root and `LongPathsEnabled`.

`mobile/android/` is generated and gitignored. `--clean` regenerates it, which is also
what makes a config-plugin change take effect — after editing anything in
`mobile/plugins/` or the `plugins` array of `mobile/app.json`, re-run prebuild or the
change is silently absent.

## The four failures worth knowing about

Every one of these presents with an error naming something other than its cause.

### `SDK location not found`

`ANDROID_HOME` is unset. Set it as an environment variable:

```
setx ANDROID_HOME "%LOCALAPPDATA%\Android\Sdk"      # Windows
export ANDROID_HOME="$HOME/Library/Android/sdk"      # macOS
```

Do **not** put it in `android/local.properties`. That file lives inside the generated
`android/` directory, so `prebuild --clean` deletes it on every run.

### `WARNING: A restricted method in java.lang.System has been called`

Reported as the failure of `:expo-modules-core:configureCMakeRelWithDebInfo`, which makes
it look like a CMake or NDK problem. It is neither. The stack trace ends in
`GeneratePrefabPackages.reportErrors`:

AGP runs **prefab** as a subprocess. On JDK 24+ that subprocess prints a JEP 472
native-access warning to stderr. AGP reads the subprocess output line by line and throws
`IllegalStateException` on any line it does not recognise. The JVM's own warning becomes
the build error.

Use **JDK 17**. Two traps:

- Android Studio's bundled JBR is itself JDK 25 on current releases, so pointing
  `JAVA_HOME` there does not help. Check the version, not the vendor.
- `JAVA_TOOL_OPTIONS=--enable-native-access=ALL-UNNAMED` does not work around it: that
  variable makes the JVM print `Picked up JAVA_TOOL_OPTIONS:` to stderr, which hits the
  same parser and fails identically.

Verify with `gradlew -version` and read the `Launcher JVM:` line — Gradle uses
`JAVA_HOME`, while `java -version` reads `PATH`, and the two can disagree. The daemon
caches its JVM, so run `gradlew --stop` after changing it.

A durable place for it, since `android/gradle.properties` is regenerated, is
`~/.gradle/gradle.properties`:

```
org.gradle.java.home=C\:\\Users\\you\\jdk17\\jdk-17.0.20.1+1
```

Java properties format: escape the colon, double the backslashes, and do not append `bin`.

### `ninja: error: manifest 'build.ninja' still dirty after 100 tries`

A symptom, not a cause. CMake decides an object path exceeds `CMAKE_OBJECT_PATH_MAX`
(250 by default), rewrites `build.ninja` to shorten it, ninja sees a changed manifest and
re-invokes CMake, and the cycle never converges. The log shows dozens of
`Re-running CMake / Configuring done / Generating done` before ninja gives up.

`mobile/plugins/with-native-build-paths.js` raises the limit to 4096 for every Android
library that compiles native code, so this should not recur. Windows needs two more
things, because the limit CMake enforces is not the one the OS enforces:

1. **A short checkout root.** `C:\d`, not `C:\Users\you\Desktop\Project`. CMake mangles
   each source file's full absolute path into the object path, so the checkout location
   is counted twice — once in the object directory and once in the mangled name.
2. **`LongPathsEnabled`**, in an elevated PowerShell, then reboot:

```powershell
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" `
  -Name LongPathsEnabled -Value 1 -PropertyType DWORD -Force
```

For scale: from a 44-character root the paths reached 353 characters. A 4-character root
brings that to 273 — still past the classic `MAX_PATH` of 260, which is what the registry
change is for.

### `Refusing to stage the Android web bundle`

Only from `scripts/android-ship.mjs`, not from a plain Gradle build. You need a root
`.env`; see [SECRETS.md](SECRETS.md). The trap is that copying `.env.example` verbatim
does not work — it ships `VITE_FIREBASE_ENABLED="false"`, which is the right default for
web work and precisely the value the guard rejects.

## Pinned versions

`mobile/app.json` pins these through `expo-build-properties`, so an Expo upgrade becomes a
deliberate decision rather than a silent one:

| | |
|---|---|
| compileSdk / targetSdk | 36 |
| minSdk | 24 |
| buildTools | 36.0.0 |
| ndk | 27.1.12297006 |

They match what Expo 57 resolves to today, so pinning changed nothing — it is a latch.
`targetSdk` is the one Play enforces deadlines against, so when it needs to move, move it
here on purpose.

## EAS

```
cd mobile
npm run ship:android:test -- --skip-smoke
```

An `eas-cli login` session is enough locally; only CI needs `EXPO_TOKEN`. `android/` and
`ios/` are in `mobile/.easignore` — without that, a machine that has run prebuild uploads
its whole Gradle tree and EAS treats the project as bare, skipping the server-side
prebuild that runs the config plugins.
