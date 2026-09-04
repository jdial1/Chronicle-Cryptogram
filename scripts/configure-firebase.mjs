import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getSecurityRules } from 'firebase-admin/security-rules';
import { loadEnvFile } from './env.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

loadEnvFile(join(root, '.env'));

const PAGES_DOMAIN = 'jdial1.github.io';
const DEFAULT_LOCATION = process.env.FIRESTORE_LOCATION || 'nam5';

function parseJsonEnv(raw) {
  if (!raw) return null;
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    try {
      return JSON.parse(Buffer.from(trimmed, 'base64').toString('utf8'));
    } catch {
      return null;
    }
  }
}

function loadServiceAccount() {
  const fromEnv = parseJsonEnv(process.env.GOOGLE_SERVICES_JSON);
  if (fromEnv?.type === 'service_account') return fromEnv;
  if (fromEnv?.project_info) {
    throw new Error(
      'GOOGLE_SERVICES_JSON is a client google-services.json file. Use a Firebase service account JSON from Project settings > Service accounts.'
    );
  }

  const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || process.argv[2];
  if (keyPath && existsSync(keyPath)) {
    const parsed = JSON.parse(readFileSync(keyPath, 'utf8'));
    if (parsed.type === 'service_account') return parsed;
  }

  throw new Error(
    'No service account found. Set GOOGLE_SERVICES_JSON or GOOGLE_APPLICATION_CREDENTIALS, or pass a key file path.'
  );
}

function writeTempKey(serviceAccount) {
  const dir = join(root, '.firebase');
  mkdirSync(dir, { recursive: true });
  const keyPath = join(dir, 'service-account.json');
  writeFileSync(keyPath, JSON.stringify(serviceAccount, null, 2));
  process.env.GOOGLE_APPLICATION_CREDENTIALS = keyPath;
  return keyPath;
}

function writeFirebaserc(projectId) {
  writeFileSync(
    join(root, '.firebaserc'),
    JSON.stringify({ projects: { default: projectId } }, null, 2) + '\n'
  );
}

async function getAccessToken(serviceAccount) {
  const { GoogleAuth } = await import('google-auth-library');
  const auth = new GoogleAuth({
    credentials: serviceAccount,
    scopes: [
      'https://www.googleapis.com/auth/cloud-platform',
      'https://www.googleapis.com/auth/datastore',
      'https://www.googleapis.com/auth/firebase',
      'https://www.googleapis.com/auth/identitytoolkit',
    ],
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  if (!token.token) throw new Error('Unable to obtain Google access token');
  return token.token;
}

async function ensureFirestoreDatabase(projectId, token) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)`;
  const existing = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (existing.ok) {
    console.log('Firestore database already exists.');
    return;
  }

  const createUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases?databaseId=(default)`;
  const created = await fetch(createUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'FIRESTORE_NATIVE',
      locationId: DEFAULT_LOCATION,
    }),
  });

  if (created.ok || created.status === 409) {
    console.log('Firestore database is ready.');
    return;
  }

  const body = await created.text();
  throw new Error(`Unable to create Firestore database (${created.status}): ${body}`);
}

async function seedPuzzleStats(db) {
  const puzzles = JSON.parse(readFileSync(join(root, 'src/data/puzzles.json'), 'utf8'));
  const batchSize = 400;
  let written = 0;
  let skipped = 0;

  for (let i = 0; i < puzzles.length; i += batchSize) {
    const slice = puzzles.slice(i, i + batchSize);
    const batch = db.batch();
    let batchWrites = 0;
    for (const puzzle of slice) {
      const ref = db.collection('puzzleStats').doc(puzzle.id);
      const snap = await ref.get();
      if (snap.exists) {
        skipped += 1;
        continue;
      }
      batch.set(ref, {
        puzzleId: puzzle.id,
        startedCount: 0,
        completeCount: 0,
        totalTimeSeconds: 0,
        fastestTime: null,
        fastestSolverName: null,
        updatedAt: FieldValue.serverTimestamp(),
      });
      batchWrites += 1;
      written += 1;
    }
    if (batchWrites > 0) await batch.commit();
  }

  console.log(`Seeded puzzleStats: ${written} created, ${skipped} already present.`);
}

async function deployRules() {
  const source = readFileSync(join(root, 'firestore.rules'), 'utf8');
  await getSecurityRules().releaseFirestoreRulesetFromSource(source);
  console.log('Deployed firestore.rules.');
}

async function authorizeDomains(projectId, token) {
  const url = `https://identitytoolkit.googleapis.com/admin/v2/projects/${projectId}/config`;
  const current = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!current.ok) {
    console.log(`Skipping auth domain update (${current.status}). Enable Google sign-in in the Firebase console if needed.`);
    return;
  }

  const config = await current.json();
  const domains = new Set(config.authorizedDomains || []);
  ['localhost', PAGES_DOMAIN, `${projectId}.firebaseapp.com`].forEach((domain) => domains.add(domain));

  const patched = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ authorizedDomains: Array.from(domains) }),
  });

  if (patched.ok) {
    console.log(`Authorized domains: ${Array.from(domains).join(', ')}`);
    return;
  }
  console.log(`Could not update authorized domains (${patched.status}). Add ${PAGES_DOMAIN} in Authentication > Settings.`);
}

function deployWithCli(projectId) {
  const result = spawnSync(
    'npx',
    ['-y', 'firebase-tools@latest', 'deploy', '--only', 'firestore:rules,firestore:indexes,auth', '--project', projectId],
    { cwd: root, stdio: 'inherit', shell: true }
  );
  if (result.status !== 0) {
    console.log('Firebase CLI deploy did not complete. Rules were still released via the Admin SDK when possible.');
  }
}

async function main() {
  const serviceAccount = loadServiceAccount();
  const projectId = serviceAccount.project_id || process.env.VITE_FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error('Missing Firebase project id');

  writeTempKey(serviceAccount);
  writeFirebaserc(projectId);

  if (!getApps().length) {
    initializeApp({
      credential: cert(serviceAccount),
      projectId,
    });
  }

  const token = await getAccessToken(serviceAccount);
  await ensureFirestoreDatabase(projectId, token);

  const db = getFirestore();
  await seedPuzzleStats(db);
  await deployRules();
  await authorizeDomains(projectId, token);
  deployWithCli(projectId);

  console.log(`Firebase database configuration complete for ${projectId}.`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
