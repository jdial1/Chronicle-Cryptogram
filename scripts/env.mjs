/**
 * The one place a local credential gets into process.env.
 *
 * Several scripts hard-fail without credentials -- stage-web-assets.mjs refuses to
 * build without VITE_FIREBASE_*, android-ship.mjs refuses without an Expo identity --
 * but nothing was loading .env for them, so a machine with a perfectly good .env was
 * still refused. Vite reads .env itself; plain Node scripts do not.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { mobileDir, root } from './project-paths.mjs';

/** Load one .env into process.env. Existing vars win, so CI secrets are never clobbered. */
export function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const match = /^\s*([\w.-]+)\s*=\s*(.*)$/.exec(line);
    if (!match || line.trimStart().startsWith('#')) continue;
    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;
    process.env[key] = rawValue.trim().replace(/^(['"])([\s\S]*)\1$/, '$2');
  }
}

/**
 * Load the project's .env files. Root first: it holds the web/Firebase vars, and
 * mobile/.env holds the Android ones. Because the first value set wins, root also
 * takes precedence on the rare key both define.
 */
export function loadProjectEnv() {
  loadEnvFile(join(root, '.env'));
  loadEnvFile(join(mobileDir, '.env'));
}
