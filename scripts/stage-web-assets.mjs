/**
 * Builds the full web app and stages it where the Android config plugin can copy it
 * into app/src/main/assets.
 *
 * Two things this guards, because both fail silently otherwise:
 *
 *  - Firebase. eas-android.yml does not carry the VITE_FIREBASE_* secrets that
 *    deploy.yml does, and a local .env is gitignored. Without them the app builds
 *    fine, shows the board, passes the Maestro smoke test -- and has no sign-in, no
 *    leaderboard and no cloud save. In a paid app that is the worst possible bug.
 *  - The demo ceiling. VITE_MAX_EDITION belongs to the Pages build only. Leaking it
 *    here would ship a paid app containing three editions.
 */
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { mobileDir, root } from './project-paths.mjs';

export const STAGE_DIR = join(mobileDir, 'web-assets');

/** Never belongs in an APK: the screenshot harness, dev previews, the service worker. */
const EXCLUDED = new Set([
  'shot.html',
  'splash.html',
  'splashdev.html',
  'sw.js',
  'version.json',
]);
const isExcluded = (name) => EXCLUDED.has(name) || /^workbox-.*\.js(\.map)?$/.test(name);

function requireEnv() {
  const missing = [];
  if (process.env.VITE_FIREBASE_ENABLED !== 'true') missing.push('VITE_FIREBASE_ENABLED must be "true"');
  for (const key of ['VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_PROJECT_ID', 'VITE_FIREBASE_APP_ID']) {
    if (!process.env[key]) missing.push(`${key} is empty`);
  }
  if (process.env.VITE_MAX_EDITION) {
    missing.push('VITE_MAX_EDITION is set — that is the Pages demo ceiling, not the app build');
  }
  if (missing.length) {
    console.error('Refusing to stage the Android web bundle:');
    for (const line of missing) console.error(`  - ${line}`);
    console.error('\nThe app would build and pass smoke tests with sign-in, the leaderboard');
    console.error('and cloud save silently missing. Set the values and re-run.');
    process.exit(1);
  }
}

function copyFiltered(from, to) {
  mkdirSync(to, { recursive: true });
  let files = 0;
  for (const name of readdirSync(from)) {
    if (isExcluded(name)) continue;
    const src = join(from, name);
    if (statSync(src).isDirectory()) {
      files += copyFiltered(src, join(to, name));
    } else {
      cpSync(src, join(to, name));
      files += 1;
    }
  }
  return files;
}

export function stageWebAssets() {
  requireEnv();

  const build = spawnSync('npx', ['vite', 'build'], {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, VITE_BUNDLED: '1' },
  });
  if (build.status !== 0) {
    console.error('vite build failed; nothing staged.');
    process.exit(build.status ?? 1);
  }

  const dist = join(root, 'dist');
  if (!existsSync(join(dist, 'index.html'))) {
    console.error('vite build produced no dist/index.html.');
    process.exit(1);
  }

  rmSync(STAGE_DIR, { recursive: true, force: true });
  const files = copyFiltered(dist, STAGE_DIR);
  console.log(`Staged ${files} files into ${STAGE_DIR}`);
  return STAGE_DIR;
}

export function assertStaged() {
  if (!existsSync(join(STAGE_DIR, 'index.html'))) {
    console.error(`No staged web bundle at ${STAGE_DIR}. Run the stage step first.`);
    console.error('A build without it produces a black WebView, which the process-alive');
    console.error('check in the smoke test would not catch.');
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  stageWebAssets();
}
