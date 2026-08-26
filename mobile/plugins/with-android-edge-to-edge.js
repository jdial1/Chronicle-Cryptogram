const fs = require('fs');
const path = require('path');
const {
  withDangerousMod,
  withGradleProperties,
  withProjectBuildGradle,
  withSettingsGradle,
} = require('expo/config-plugins');

const MARKER = 'CHRONICLE_EDGE_TO_EDGE_API35';
const MATERIAL = 'com.google.android.material:material:1.14.0';

function windowUtilPath(projectRoot) {
  const pkg = require.resolve('react-native/package.json', { paths: [projectRoot] });
  return path.join(
    path.dirname(pkg),
    'ReactAndroid/src/main/java/com/facebook/react/views/view/WindowUtil.kt'
  );
}

function replaceOnce(src, find, replace, label) {
  if (!src.includes(find)) {
    throw new Error(`with-android-edge-to-edge: missing ${label} in WindowUtil.kt`);
  }
  return src.replace(find, replace);
}

function patchWindowUtil(src) {
  const hadCrlf = src.includes('\r\n');
  let next = src.replace(/\r\n/g, '\n');
  if (next.includes(MARKER)) return src;

  next = replaceOnce(
    next,
    `  statusBarColor = Color.TRANSPARENT

  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
    navigationBarColor = Color.TRANSPARENT`,
    `  // ${MARKER}
  if (Build.VERSION.SDK_INT < Build.VERSION_CODES.VANILLA_ICE_CREAM) {
    @Suppress("DEPRECATION")
    statusBarColor = Color.TRANSPARENT
  }

  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.VANILLA_ICE_CREAM) {
      @Suppress("DEPRECATION")
      navigationBarColor = Color.TRANSPARENT
    }`,
    'enableEdgeToEdge bar colors'
  );

  next = replaceOnce(
    next,
    `    navigationBarColor =
        if (isAppearanceLightNavigationBars) LightNavigationBarColor else DarkNavigationBarColor`,
    `    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.VANILLA_ICE_CREAM) {
      @Suppress("DEPRECATION")
      navigationBarColor =
          if (isAppearanceLightNavigationBars) LightNavigationBarColor else DarkNavigationBarColor
    }`,
    'pre-Q navigationBarColor'
  );

  next = replaceOnce(
    next,
    `  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
    attributes.layoutInDisplayCutoutMode =
        when {
          Build.VERSION.SDK_INT >= Build.VERSION_CODES.R ->
              WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_ALWAYS
          else -> WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
        }
  }`,
    `  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
    attributes.layoutInDisplayCutoutMode =
        WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_ALWAYS
  }`,
    'display cutout mode'
  );

  next = replaceOnce(
    next,
    `private fun Window.statusBarHide() {
  if (isEdgeToEdgeFeatureFlagOn) {`,
    `private fun Window.statusBarHide() {
  if (isEdgeToEdgeFeatureFlagOn || Build.VERSION.SDK_INT >= Build.VERSION_CODES.VANILLA_ICE_CREAM) {`,
    'statusBarHide'
  );

  next = replaceOnce(
    next,
    `private fun Window.statusBarShow() {
  if (isEdgeToEdgeFeatureFlagOn) {`,
    `private fun Window.statusBarShow() {
  if (isEdgeToEdgeFeatureFlagOn || Build.VERSION.SDK_INT >= Build.VERSION_CODES.VANILLA_ICE_CREAM) {`,
    'statusBarShow'
  );

  next = replaceOnce(
    next,
    `          WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES`,
    `          WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_ALWAYS`,
    'statusBarHide cutout'
  );

  next = replaceOnce(
    next,
    `          WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_DEFAULT`,
    `          WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_ALWAYS`,
    'statusBarShow cutout'
  );

  return hadCrlf ? next.replace(/\n/g, '\r\n') : next;
}

function withWindowUtilPatch(config) {
  return withDangerousMod(config, [
    'android',
    (mod) => {
      const file = windowUtilPath(mod.modRequest.projectRoot);
      const src = fs.readFileSync(file, 'utf8');
      const next = patchWindowUtil(src);
      if (next !== src) fs.writeFileSync(file, next);
      return mod;
    },
  ]);
}

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

function withRnFromSource(config) {
  return withSettingsGradle(config, (mod) => {
    if (mod.modResults.contents.includes(MARKER)) return mod;
    if (mod.modResults.contents.includes('project(":packages:react-native:ReactAndroid")')) return mod;
    mod.modResults.contents += `
// ${MARKER}
includeBuild(expoAutolinking.reactNative) {
    dependencySubstitution {
        substitute(module("com.facebook.react:react-android")).using(project(":packages:react-native:ReactAndroid"))
        substitute(module("com.facebook.react:react-native")).using(project(":packages:react-native:ReactAndroid"))
        substitute(module("com.facebook.react:hermes-android")).using(project(":packages:react-native:ReactAndroid:hermes-engine"))
        substitute(module("com.facebook.react:hermes-engine")).using(project(":packages:react-native:ReactAndroid:hermes-engine"))
    }
}
`;
    return mod;
  });
}

function withAndroidEdgeToEdge(config) {
  config = withWindowUtilPatch(config);
  config = withEdgeToEdgeGradleFlag(config);
  config = withMaterial114(config);
  config = withRnFromSource(config);
  return config;
}

module.exports = withAndroidEdgeToEdge;
