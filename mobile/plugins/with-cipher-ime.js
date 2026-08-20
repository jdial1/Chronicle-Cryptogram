const { withAndroidManifest } = require('expo/config-plugins');

function withCipherIme(config) {
  return withAndroidManifest(config, (mod) => {
    const app = mod.modResults.manifest.application?.[0];
    if (!app) return mod;
    app.$ = app.$ || {};
    app.$['android:importantForAutofill'] = 'noExcludeDescendants';
    for (const activity of app.activity || []) {
      activity.$ = activity.$ || {};
      activity.$['android:importantForAutofill'] = 'noExcludeDescendants';
    }
    return mod;
  });
}

module.exports = withCipherIme;
