/**
 * Guards mobile/app.json against config that would fail `expo prebuild`.
 *
 * Exists because Phase 1 removed @react-native-firebase/messaging from
 * mobile/package.json but left it in the plugins array. Expo resolves plugin
 * entries from node_modules, so the Android build broke -- and nothing noticed,
 * because eas-android.yml is workflow_dispatch only and the web CI never looks
 * at mobile/. This runs in the normal check job instead.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const mobile = join(root, 'mobile');

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const app = readJson(join(mobile, 'app.json')).expo;
const pkg = readJson(join(mobile, 'package.json'));
const deps = { ...pkg.dependencies, ...pkg.devDependencies };

const problems = [];

for (const entry of app.plugins ?? []) {
  const name = Array.isArray(entry) ? entry[0] : entry;
  if (name.startsWith('./') || name.startsWith('../')) {
    if (!existsSync(join(mobile, name))) {
      problems.push(`plugin file not found: ${name}`);
    }
  } else if (!deps[name]) {
    problems.push(`plugin "${name}" is not a dependency of mobile/package.json`);
  }
}

// googleServicesFile is read at prebuild time; a missing one fails the build late.
const services = app.android?.googleServicesFile;
if (services && !existsSync(join(mobile, services))) {
  problems.push(`android.googleServicesFile not found: ${services}`);
} else if (services) {
  // app.config.js overwrites this file from GOOGLE_SERVICES_CLIENT_JSON whenever that
  // env var is set, so a wrong or stale secret silently produces a build pointed at
  // another Firebase project. Every other check would still pass.
  const pkg = app.android?.package;
  try {
    const google = readJson(join(mobile, services));
    const clients = (google.client ?? []).map((c) => c.client_info?.android_client_info?.package_name);
    if (!clients.includes(pkg)) {
      problems.push(
        `${services} has no Android client for "${pkg}" (found: ${clients.join(', ') || 'none'})`
      );
    }
  } catch (err) {
    problems.push(`${services} is not readable JSON: ${err.message}`);
  }
}

if (problems.length) {
  console.error('mobile/app.json would fail expo prebuild:');
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

console.log(`mobile config OK (${(app.plugins ?? []).length} plugins resolve)`);
