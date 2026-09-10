const { withProjectBuildGradle } = require('expo/config-plugins');

const MARKER = 'CHRONICLE_NATIVE_BUILD_PATHS';

/**
 * Raises CMAKE_OBJECT_PATH_MAX for every Android library that compiles native code.
 *
 * Without this, a Windows build dies with:
 *
 *   ninja: error: manifest 'build.ninja' still dirty after 100 tries
 *
 * which is a symptom rather than the cause. CMake decides an object path exceeds
 * CMAKE_OBJECT_PATH_MAX (250 by default), rewrites build.ninja to shorten it, ninja sees
 * a changed manifest and re-invokes CMake, and the cycle never converges. The paths in
 * question are genuinely long: nitrogen generates names like
 * HybridGoogleSignInButtonComponent.cpp.o, and CMake mangles the source's full absolute
 * path into the object path, so a 180-character object directory plus a 173-character
 * mangled name reaches 353. No plausible checkout location gets that under 250.
 *
 * Emitted on every platform, deliberately. Config plugins run on the developer's
 * machine, so gating this on process.platform would make the generated project differ
 * between machines and between local and EAS builds -- exactly the divergence that
 * produces "works here, fails there". Raising a maximum is inert where nothing was
 * approaching it.
 *
 * This does not lift the OS limit. Windows still needs LongPathsEnabled for paths past
 * MAX_PATH; see docs/SECRETS.md.
 */
function withCmakeObjectPathMax(config) {
  return withProjectBuildGradle(config, (mod) => {
    if (mod.modResults.language !== 'groovy') {
      throw new Error('with-native-build-paths: expected Groovy project build.gradle');
    }
    if (mod.modResults.contents.includes(MARKER)) return mod;
    mod.modResults.contents += `
// ${MARKER}
subprojects { subproject ->
    subproject.plugins.withId("com.android.library") {
        subproject.android.defaultConfig.externalNativeBuild.cmake.arguments +=
            ["-DCMAKE_OBJECT_PATH_MAX=4096"]
    }
}
`;
    return mod;
  });
}

module.exports = withCmakeObjectPathMax;
