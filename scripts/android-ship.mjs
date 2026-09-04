#!/usr/bin/env node
/**
 * Chronicle Cryptogram Android EAS + Play ship.
 *
 *   node scripts/android-ship.mjs
 *   node scripts/android-ship.mjs --test-only
 *   node scripts/android-ship.mjs --yes
 *   node scripts/android-ship.mjs --skip-stage   (reuse the staged web bundle)
 *
 * Always run against mobile/ (src/ is the web app).
 *
 * 0. Build the web app and stage it into mobile/web-assets for the APK
 * 1. npx eas-cli build --platform android --profile test
 * 2. Wait for you to type yes (skip with --yes)
 * 3. npx eas-cli build --platform android --profile production
 * 4. eas submit that AAB with profiles internal, alpha, and ea
 *
 * One-time: cd mobile && npx eas-cli login  (Play creds already in Expo)
 */
import { spawnSync } from "node:child_process";
import { createWriteStream, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { pipeline } from "node:stream/promises";
import { mobileDir, resolveMaestroBin, root } from "./project-paths.mjs";
import { loadProjectEnv } from "./env.mjs";
import { assertStaged, stageWebAssets } from "./stage-web-assets.mjs";

// Before anything reads process.env: stageWebAssets() and requireExpoAuth() both
// refuse to run without credentials, and .env is where they live locally.
loadProjectEnv();

const mobile = mobileDir;
const shipApk = path.join(mobile, ".ship", "test.apk");
const flags = new Set(process.argv.slice(2));
const testOnly = flags.has("--test-only") || flags.has("--skip-play");
const assumeYes = flags.has("--yes") || flags.has("-y");
const skipSmoke = flags.has("--skip-smoke");

function fail(msg) {
  console.error("FAIL:", msg);
  process.exit(1);
}

function step(msg) {
  console.log("\n==>", msg);
}

function runNpx(npxArgs, { inherit = false } = {}) {
  const opts = {
    cwd: mobile,
    encoding: "utf8",
    env: process.env,
    shell: true,
  };
  if (inherit) opts.stdio = "inherit";
  return spawnSync("npx", npxArgs, opts);
}

function eas(easArgs) {
  if (!existsSync(path.join(mobile, "eas.json"))) {
    fail("Expected EAS app in mobile/. src/ is the web app, not Android.");
  }
  console.log("npx eas-cli", easArgs.join(" "));
  const r = runNpx(["--yes", "eas-cli", ...easArgs], { inherit: true });
  if (r.error) fail(r.error.message);
  if (r.status !== 0) fail("eas-cli exited " + r.status);
}

function easCapture(easArgs) {
  if (!existsSync(path.join(mobile, "eas.json"))) {
    fail("Expected EAS app in mobile/. src/ is the web app, not Android.");
  }
  console.log("npx eas-cli", easArgs.join(" "));
  const r = runNpx(["--yes", "eas-cli", ...easArgs]);
  const out = `${r.stdout || ""}${r.stderr || ""}`;
  process.stdout.write(out);
  if (r.error) fail(r.error.message);
  if (r.status !== 0) fail("eas-cli exited " + r.status);
  return out;
}

/**
 * EAS needs an identity before anything else is worth doing. Checked up front because
 * the web build below takes minutes, and discovering this afterwards wastes all of it.
 */
function requireExpoAuth() {
  if (process.env.EXPO_TOKEN) return;

  // An existing `eas-cli login` session is equally valid -- this is a check, not a prompt.
  const who = runNpx(["--yes", "eas-cli", "whoami"]);
  if (who.status === 0) {
    console.log("Expo account:", (who.stdout || "").trim() || "(logged in)");
    return;
  }

  console.error("Refusing to build: no Expo credentials.");
  console.error("  - EXPO_TOKEN is unset and there is no eas-cli login session");
  console.error("\nEither add EXPO_TOKEN to mobile/.env (create one at");
  console.error("https://expo.dev/settings/access-tokens), or run:");
  console.error("  cd mobile && npx eas-cli login");
  console.error("\nSee docs/SECRETS.md.");
  process.exit(1);
}

/**
 * `eas build --json` prints an array of build objects. Read the first one rather than
 * scraping for `"id"`: the old regex took the *last* match, and a build object nests
 * fingerprint, initiatingActor, app and app.ownerAccount ids after its own -- so it
 * returned the account id. Harmless when only logged, but it is also what feeds
 * `eas submit --id` below.
 */
function parseBuild(text) {
  const start = text.indexOf('[');
  if (start !== -1) {
    try {
      const parsed = JSON.parse(text.slice(start, text.lastIndexOf(']') + 1));
      if (Array.isArray(parsed) && parsed[0]) return parsed[0];
    } catch {
      // Fall through to the URL scrape below.
    }
  }
  const url = text.match(
    /https:\/\/expo\.dev\/accounts\/[^/]+\/projects\/[^/]+\/builds\/([0-9a-f-]+)/i
  );
  return url ? { id: url[1] } : null;
}

/** Fail loudly on a build that did not produce an artifact, naming why. */
function assertBuildFinished(build, label) {
  const status = build?.status;
  if (status && status !== 'FINISHED') {
    fail(`${label} build ${build.id ?? "(unknown)"} ended as ${status}, not FINISHED.`);
  }
}

function parseArtifactUrl(text) {
  const m = text.match(
    /"(?:buildUrl|applicationArchiveUrl)"\s*:\s*"(https:\/\/expo\.dev\/artifacts\/eas\/[^"]+\.apk)"/i
  );
  return m ? m[1] : null;
}

async function downloadApk(url, dest) {
  mkdirSync(path.dirname(dest), { recursive: true });
  const res = await fetch(url);
  if (!res.ok) fail(`APK download failed: ${res.status} ${url}`);
  await pipeline(res.body, createWriteStream(dest));
  console.log("Saved", dest);
}

function hasMaestro() {
  if (resolveMaestroBin()) return true;
  const r = spawnSync("maestro", ["--version"], { shell: true, encoding: "utf8" });
  return r.status === 0;
}

function runSmoke() {
  const skipMaestro = !hasMaestro();
  if (skipMaestro) {
    console.log("Maestro not found — running crash-only smoke (--skip-maestro).");
  }
  const args = [path.join(root, "scripts", "android-smoke-test.mjs")];
  if (skipMaestro) args.push("--skip-maestro");
  const r = spawnSync(process.execPath, args, {
    cwd: mobile,
    stdio: "inherit",
    env: process.env,
  });
  if (r.status !== 0) fail("Smoke test failed.");
}

console.log("Repo:   ", root);
console.log("Mobile: ", mobile);

requireExpoAuth();

// Staged once, here. The production build below reuses this exact tree: there is an
// interactive gate between the two, and re-staging there would ship assets that never
// went through the smoke test.
if (flags.has("--skip-stage")) {
  assertStaged();
  console.log("Reusing the already-staged web bundle.");
} else {
  step("Build and stage the web bundle");
  stageWebAssets();
}

step("EAS test build (APK)");
const testOut = easCapture([
  "build",
  "--platform", "android",
  "--profile", "test",
  "--non-interactive",
  "--wait",
  "--json",
]);
const testBuild = parseBuild(testOut);
if (!testBuild) fail("Could not find test build in eas-cli output.");
console.log("Test build", testBuild.id);
assertBuildFinished(testBuild, "Test");
const apkUrl = testBuild.artifacts?.buildUrl
  ?? testBuild.artifacts?.applicationArchiveUrl
  ?? parseArtifactUrl(testOut);

if (apkUrl) {
  step("Download test APK");
  await downloadApk(apkUrl, shipApk);
} else if (!existsSync(shipApk)) {
  fail("No APK artifact URL and mobile/.ship/test.apk missing.");
}

if (!skipSmoke) {
  step("Local emulator smoke test");
  runSmoke();
}

if (testOnly) {
  console.log("Stopping after test profile (--test-only).");
  process.exit(0);
}

if (!assumeYes) {
  step("Continue to production?");
  console.log("Type yes to start production and Play submit.");
  const rl = readline.createInterface({ input, output });
  const answer = (await rl.question("> ")).trim().toLowerCase();
  rl.close();
  if (answer !== "yes" && answer !== "y") fail("Aborted.");
}

step("EAS production build (AAB)");
const prodOut = easCapture([
  "build",
  "--platform", "android",
  "--profile", "production",
  "--non-interactive",
  "--wait",
  "--json",
]);
const prodBuild = parseBuild(prodOut);
if (!prodBuild) fail("Could not find production build in eas-cli output.");
const prodId = prodBuild.id;
console.log("Production build", prodId);
assertBuildFinished(prodBuild, "Production");

step("Play Console: same AAB to internal, alpha, EA");
for (const profile of ["internal", "alpha", "ea"]) {
  console.log("---", profile, "---");
  eas([
    "submit",
    "--platform", "android",
    "--id", prodId,
    "--profile", profile,
    "--non-interactive",
    "--wait",
  ]);
}

console.log("\nDone.", prodId, "is on internal, Closed testing (alpha), and EA.");
