const { withGradleProperties, withProjectBuildGradle } = require('expo/config-plugins');

const MARKER = 'CHRONICLE_EDGE_TO_EDGE_API35';
const MATERIAL = 'com.google.android.material:material:1.14.0';

/**
 * This plugin used to also patch React Native's WindowUtil.kt to guard the deprecated
 * statusBarColor/navigationBarColor setters, which required building React Native and
 * Hermes from source via a Gradle includeBuild. That cost more than it was worth: EAS
 * build 5910cd1d was killed at the free-tier ceiling of exactly 45 minutes, having
 * spent it compiling RN's native code and the Hermes engine from C++.
 *
 * Both mods came out together, because they only ever worked as a pair -- WindowUtil.kt
 * lives in node_modules and is compiled only when RN is built from source, so the patch
 * was inert the moment the source build went.
 *
 * Losing it should be free. Edge-to-edge moved into React Native itself in RN 0.81 /
 * Expo SDK 54, and this app is on RN 0.86 / Expo 57 -- two SDKs past that line. The two
 * mods below still do something without a source build, so they stay until a device
 * says otherwise.
 */
function withEdgeToEdgeGradleFlag(config) {
  return withGradleProperties(config, (mod) => {
    const props = mod.modResults;
    const existing = props.find((item) => item.type === 'property' && item.key === 'edgeToEdgeEnabled');
    if (existing) {
      existing.value = 'true';
    } else {
      props.push({ type: 'property', key: 'edgeToEdgeEnabled', value: 'true' });
    }
    return mod;
  });
}

function withMaterial114(config) {
  return withProjectBuildGradle(config, (mod) => {
    if (mod.modResults.language !== 'groovy') {
      throw new Error('with-android-edge-to-edge: expected Groovy project build.gradle');
    }
    if (mod.modResults.contents.includes(MARKER)) return mod;
    mod.modResults.contents += `
// ${MARKER}
subprojects { subproject ->
    subproject.configurations.configureEach {
        resolutionStrategy {
            force '${MATERIAL}'
        }
    }
}
`;
    return mod;
  });
}

function withAndroidEdgeToEdge(config) {
  config = withEdgeToEdgeGradleFlag(config);
  config = withMaterial114(config);
  return config;
}

module.exports = withAndroidEdgeToEdge;
