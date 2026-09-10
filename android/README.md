# android/

The native Kotlin + Jetpack Compose app. Replaces the Expo WebView shell in
`mobile/`, which is deleted once this reaches parity.

## Modules

| Module | Type | Holds |
|---|---|---|
| `:core:cipher` | `kotlin("jvm")` | The game logic ported from `src/`: cipher engine, progression, merge/normalize, cursor math |

More land as the port proceeds (`:core:content`, `:core:designsystem`,
`:core:data`, `:feature:*`, `:app`).

**`:core:cipher` has no Android dependency on purpose.** Its tests are the parity
gate against fixtures generated from the TypeScript, and they must run in seconds
with no emulator and no Robolectric. Do not add an Android dependency to it.

## Toolchain

Verified against Google Maven / Maven Central on 2026-09-04:

| | Version |
|---|---|
| Gradle | 9.7.1 |
| AGP | 9.4.0 |
| Kotlin | 2.4.10 |
| Compose BOM | 2026.08.00 |
| Build JVM | Temurin 25 (bytecode targets 17) |

Bytecode targets 17 via `jvmTarget` rather than a Gradle Java toolchain, so a
second JDK does not have to be installed.

## Running the tests

```bash
cd android && ./gradlew :core:cipher:test
```

The fixtures under `core/cipher/src/test/resources/fixtures/` are generated —
see their README. If they are stale, regenerate from the repo root with
`npm run emit:fixtures`.

## Host workaround: "Unable to establish loopback connection"

If Gradle fails to start a daemon with that message on this machine, it is not a
network problem.

**What happens.** On this Windows host, AF_UNIX sockets *bind* fine but fail to
*connect* with `Invalid argument` when the socket lives under
`%LOCALAPPDATA%\Temp`. Since JDK 21 the NIO `Selector`'s internal `Pipe` is built
on an AF_UNIX socket pair, so `Selector.open()` throws. The Gradle daemon starts,
accepts the TCP connection, then dies opening its selector, and the client
reports the connection failure. TCP loopback itself is unaffected, which is why
it presents as a network fault.

**The fix.** Point auto-bound AF_UNIX sockets at a directory that works:

```
-Djdk.net.unixdomain.tmpdir=C:/Users/<you>/.gradle/tmp
```

Use forward slashes — in a `.properties` file `\t` is unescaped twice and becomes
a tab, which splits the argument and produces `Could not find or load main class`.

It has to reach **both** the client JVM and the forked daemon. Gradle strips
unrecognized `-D` flags out of the daemon command line, so `org.gradle.jvmargs`
alone does not work. Set it in the environment instead, where every JVM picks it
up:

```bash
setx JAVA_TOOL_OPTIONS "-Djdk.net.unixdomain.tmpdir=C:/Users/<you>/.gradle/tmp"
```

This repo deliberately sets **no** `org.gradle.jvmargs` in
`android/gradle.properties`: project-level jvmargs override user-level ones, so
setting it here would mask the per-machine configuration. Heap tuning lives in
`~/.gradle/gradle.properties` alongside the workaround.

None of this is needed on Linux CI.
